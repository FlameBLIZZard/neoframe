# NEOFRAME — landing page + early-access waitlist

Live: https://neoframe.aditya-dev.com  (Vercel project `neoframe`)

## What's here
| Path | What it is |
|---|---|
| `src/index.html` | **Edit this.** Page source (icons are `<i-con name="…">` placeholders from lucide). |
| `src/input.css` | Custom CSS + Tailwind layers (poster headline, buttons, stickers, workflow layout). |
| `index.html`, `styles.css` | Built output that gets deployed. Don't hand-edit — rebuild. |
| `assets/*.avif` | Optimised images (≈240 KB total, down from ≈7 MB). Old PNG/JPG originals are kept but not deployed. |
| `src/motion.js` | **Edit this** for animations. Built to `motion.js`. GSAP + plugins, Lenis, canvas-confetti, OGL (hero shader). |
| `api/waitlist.js` | Serverless function: saves signups to Cloudflare R2 (`neoframe-waitlist` bucket). |
| `index.v1-original.html` | Your original page, kept for reference. |

## Rebuild after editing
```bash
npm install          # once
npm run build:site   # Tailwind CSS + inline icons -> index.html / styles.css
npm run deploy       # vercel --prod (folder is already linked to the project)
```
Preview locally with `run.bat` (the waitlist form only works on the deployed site).

## Motion
All animation lives in `src/motion.js` and only enhances the page:
- Libraries load from jsDelivr, pinned: GSAP 3.15.0 (ScrollTrigger, SplitText, Flip, Draggable, InertiaPlugin, DrawSVG, CustomEase), Lenis 1.3.26, canvas-confetti 1.9.4, OGL 1.0.11 (lazy, desktop only).
- If a library fails to load, or the visitor has *reduce motion* on, the page shows everything statically.
- Test offline: `python build.py --local`, then `python -m http.server` and open `/_local.html` (uses `node_modules`).

## Waitlist
Signups are stored one JSON file per email in the R2 bucket `neoframe-waitlist` (re-joining updates the entry).
- **Download all signups as CSV:** `https://neoframe.aditya-dev.com/api/waitlist?action=export&key=ADMIN_KEY`
- **Check storage is working:** `…/api/waitlist?action=setup&key=ADMIN_KEY`

`ADMIN_KEY` and the R2 keys live in Vercel → neoframe → Settings → Environment Variables.
When you rotate the R2 keys in Cloudflare, update `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` there and redeploy.

## DNS
`neoframe` CNAME → `cname.vercel-dns.com` in Cloudflare (DNS only / grey cloud).
