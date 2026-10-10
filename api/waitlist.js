// NEOFRAME waitlist — Vercel serverless function.
// Stores each signup as a JSON object in a Cloudflare R2 bucket (S3-compatible API, SigV4 signed).
//
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, ADMIN_KEY
//
// Routes:
//   POST /api/waitlist                 { email, role?, plan?, note?, source? }  → saves a signup
//   GET  /api/waitlist?key=ADMIN_KEY&action=setup   → creates the bucket if missing, checks write access
//   GET  /api/waitlist?key=ADMIN_KEY&action=export  → downloads all signups as CSV
const crypto = require('node:crypto');

const ENV = () => ({
  account: process.env.R2_ACCOUNT_ID,
  keyId: process.env.R2_ACCESS_KEY_ID,
  secret: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET || 'neoframe-waitlist',
  admin: process.env.ADMIN_KEY,
});

const sha256 = (d) => crypto.createHash('sha256').update(d).digest('hex');
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

async function r2(method, path, { query = {}, body = '', headers = {} } = {}) {
  const { account, keyId, secret } = ENV();
  const host = `${account}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = amzDate.slice(0, 8);
  const payloadHash = sha256(body);
  const canonPath = path.split('/').map(enc).join('/');
  const qs = Object.keys(query).sort().map((k) => `${enc(k)}=${enc(query[k])}`).join('&');
  const h = { host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate, ...headers };
  const names = Object.keys(h).map((k) => k.toLowerCase()).sort();
  const lower = Object.fromEntries(Object.entries(h).map(([k, v]) => [k.toLowerCase(), String(v).trim()]));
  const canonHeaders = names.map((n) => `${n}:${lower[n]}\n`).join('');
  const signed = names.join(';');
  const canonReq = [method, canonPath, qs, canonHeaders, signed, payloadHash].join('\n');
  const scope = `${day}/auto/s3/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonReq)].join('\n');
  const kSign = hmac(hmac(hmac(hmac('AWS4' + secret, day), 'auto'), 's3'), 'aws4_request');
  const sig = crypto.createHmac('sha256', kSign).update(toSign).digest('hex');
  const auth = `AWS4-HMAC-SHA256 Credential=${keyId}/${scope}, SignedHeaders=${signed}, Signature=${sig}`;
  const url = `https://${host}${canonPath}${qs ? '?' + qs : ''}`;
  return fetch(url, { method, headers: { ...h, Authorization: auth }, body: body || undefined });
}

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 8192) break; chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}

function csvCell(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const env = ENV();
  if (!env.account || !env.keyId || !env.secret) return res.status(500).json({ error: 'not-configured' });

  try {
    if (req.method === 'POST') {
      const b = await readJson(req);
      if (clip(b.company, 100)) return res.status(200).json({ ok: true }); // honeypot: pretend success
      const email = clip(b.email, 254).toLowerCase();
      if (!EMAIL.test(email)) return res.status(400).json({ error: 'invalid-email' });
      const record = {
        email,
        role: clip(b.role, 60),
        plan: clip(b.plan, 20),
        note: clip(b.note, 500),
        source: clip(b.source, 40),
        joinedAt: new Date().toISOString(),
        country: req.headers['x-vercel-ip-country'] || '',
      };
      // One object per email (re-joining just updates it)
      const key = `signups/${sha256(email).slice(0, 32)}.json`;
      const r = await r2('PUT', `/${env.bucket}/${key}`, {
        body: JSON.stringify(record),
        headers: { 'content-type': 'application/json' },
      });
      if (!r.ok) { console.error('R2 put failed', r.status, await r.text()); return res.status(502).json({ error: 'save-failed' }); }
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const q = req.query || {};
      if (!env.admin || q.key !== env.admin) return res.status(404).json({ error: 'not-found' });

      if (q.action === 'setup') {
        const head = await r2('HEAD', `/${env.bucket}`);
        let created = false;
        if (head.status === 404) {
          const c = await r2('PUT', `/${env.bucket}`);
          if (!c.ok) return res.status(502).json({ step: 'create-bucket', status: c.status, body: (await c.text()).slice(0, 400) });
          created = true;
        } else if (!head.ok) {
          return res.status(502).json({ step: 'head-bucket', status: head.status });
        }
        const t = await r2('PUT', `/${env.bucket}/_health.json`, { body: JSON.stringify({ at: new Date().toISOString() }), headers: { 'content-type': 'application/json' } });
        return res.status(t.ok ? 200 : 502).json({ bucket: env.bucket, created, writeOk: t.ok, writeStatus: t.status });
      }

      if (q.action === 'export') {
        const rows = []; let token;
        do {
          const query = { 'list-type': '2', prefix: 'signups/', ...(token ? { 'continuation-token': token } : {}) };
          const l = await r2('GET', `/${env.bucket}`, { query });
          const xml = await l.text();
          if (!l.ok) return res.status(502).json({ step: 'list', status: l.status });
          const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
          const got = await Promise.all(keys.map(async (k) => { const o = await r2('GET', `/${env.bucket}/${k}`); return o.ok ? o.json() : null; }));
          rows.push(...got.filter(Boolean));
          token = (xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/) || [])[1];
        } while (token);
        rows.sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
        const cols = ['joinedAt', 'email', 'role', 'plan', 'note', 'source', 'country'];
        const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="neoframe-waitlist.csv"');
        return res.status(200).send(csv);
      }
      return res.status(400).json({ error: 'unknown-action' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (e) {
    console.error(e);
    const isAdmin = env.admin && (req.query || {}).key === env.admin;
    return res.status(500).json({ error: 'server-error', ...(isAdmin ? { detail: String(e && e.message), cause: String(e && e.cause && (e.cause.code || e.cause.message)) } : {}) });
  }
};
