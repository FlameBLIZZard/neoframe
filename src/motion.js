/* NEOFRAME motion layer
 * GSAP 3.15 (+ ScrollTrigger, SplitText, Flip, Draggable, InertiaPlugin, DrawSVG, CustomEase),
 * Lenis (smooth scroll), canvas-confetti, OGL (lazy-loaded WebGL hero effect).
 * Everything here is an enhancement: if a library is missing or the visitor prefers
 * reduced motion, this file exits and the inline script keeps the page fully usable.
 */
(() => {
  const root = document.documentElement;
  const g = window.gsap;
  const libsOk = g && window.ScrollTrigger && window.SplitText && window.Flip && window.Draggable && window.DrawSVGPlugin && window.CustomEase;
  if (!libsOk || matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.remove('js-motion'); return; }

  g.registerPlugin(ScrollTrigger, SplitText, Flip, Draggable, InertiaPlugin, DrawSVGPlugin, CustomEase);
  window.__nfMotion = true;
  root.classList.add('gsap-on');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = () => innerWidth >= 1024;

  // House timing: "slap" overshoots like a sticker hitting paper, "snap" is quick and crisp
  CustomEase.create('slap', 'M0,0 C0.18,0 0.24,1.22 0.48,1.08 0.66,0.98 0.8,1 1,1');
  CustomEase.create('snap', 'M0,0 C0.3,0.85 0.45,1 1,1');
  g.defaults({ ease: 'snap', duration: 0.22 });

  /* ------------------------------------------------------------------ Lenis */
  let lenis = null;
  if (fine && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 }, prevent: (n) => !!(n.closest && n.closest('dialog')) });
    lenis.on('scroll', ScrollTrigger.update);
    g.ticker.add((t) => lenis.raf(t * 1000));
    g.ticker.lagSmoothing(0);
    $$('dialog').forEach((d) => new MutationObserver(() => (d.open ? lenis.stop() : lenis.start())).observe(d, { attributes: true, attributeFilter: ['open'] }));
  }
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' }));

  const ready = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
  ready.then(init);

  function init() {
    progressAndNav();
    buttons();
    markers();
    headings();
    tickers();
    hero();
    features();
    mockup();
    howItWorks();
    templates();
    notes();
    pricing();
    faq();
    cta();
    feedback();
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ------------------------------------------------- progress bar + nav pill */
  function progressAndNav() {
    g.to('#nf-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    const pill = $('#nav-pill');
    const pairs = $$('.nav-link').map((l) => [l, document.getElementById(l.dataset.sec)]).filter((p) => p[1]);
    if (!pill || !pairs.length) return;
    let current;
    const pick = () => {
      const mid = innerHeight * 0.45;
      let hit = null;
      for (const [l, s] of pairs) { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) hit = l; }
      if (hit === current) return;
      current = hit;
      if (!hit) g.to(pill, { autoAlpha: 0, duration: 0.2 });
      else g.to(pill, { x: hit.offsetLeft, width: hit.offsetWidth, autoAlpha: 1, duration: 0.4, ease: 'slap' });
    };
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: pick });
    ScrollTrigger.addEventListener('refresh', () => { current = undefined; pick(); });
    pick();
  }

  /* ------------------------------------------------------------ buttons */
  function buttons() {
    $$('.btn').forEach((b) => {
      if (fine) {
        b.addEventListener('pointerenter', () => g.to(b, { x: -2, y: -2, duration: 0.15 }));
        b.addEventListener('pointerleave', () => g.to(b, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.25 }));
      }
      b.addEventListener('pointerdown', () => g.to(b, { x: 1, y: 1, scaleX: 1.04, scaleY: 0.92, duration: 0.08 }));
      b.addEventListener('pointerup', () => g.to(b, { x: fine ? -2 : 0, y: fine ? -2 : 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.35)' }));
    });
  }

  /* ------------------------------------------------ hand-drawn underlines */
  function markers() {
    $$('.marker').forEach((a) => {
      a.insertAdjacentHTML('beforeend', '<svg class="marker-svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 6 C 22 2, 45 9, 65 5 S 90 4, 98 6"/></svg>');
      const path = $('.marker-svg path', a);
      g.set(path, { drawSVG: '0%' });
      const on = () => g.to(path, { drawSVG: '100%', duration: 0.35, ease: 'power2.out', overwrite: true });
      const off = () => g.to(path, { drawSVG: '100% 100%', duration: 0.25, ease: 'power2.in', overwrite: true, onComplete: () => g.set(path, { drawSVG: '0%' }) });
      a.addEventListener('pointerenter', on); a.addEventListener('focus', on);
      a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
    });
  }

  /* ---------------------------------------------- section headline reveals */
  function headings() {
    $$('main h2.display').filter((h) => !h.closest('#top') && !h.classList.contains('cta-title')).forEach((h) => {
      SplitText.create(h, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: (self) => g.from(self.lines, { yPercent: 108, duration: 0.85, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: h, start: 'top 86%', once: true } }),
      });
    });
  }

  /* ------------------------------------------------------- ticker strips */
  function tickers() {
    $$('.ticker').forEach((t) => {
      const track = $('.ticker-track', t);
      const dir = +(t.dataset.dir || 1);
      const loop = g.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 30, ease: 'none', repeat: -1 });
      const skew = g.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3' });
      let settle;
      ScrollTrigger.create({
        trigger: t.parentElement, start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity();
          const ts = (v < 0 ? -1 : 1) * (1 + Math.min(Math.abs(v) / 300, 6));
          g.to(loop, { timeScale: ts, duration: 0.2, overwrite: true });
          skew(g.utils.clamp(-10, 10, v / -250));
          clearTimeout(settle);
          settle = setTimeout(() => { g.to(loop, { timeScale: Math.sign(ts), duration: 0.9 }); skew(0); }, 120);
        },
      });
    });
  }

  /* ----------------------------------------------------------------- hero */
  function hero() {
    const top = $('#top');
    if (!top) return;
    g.set($$('[data-hero-hide]', top), { autoAlpha: 1 });
    const a = SplitText.create('.h1-a', { type: 'words,chars' });
    const b = SplitText.create('.h1-b', { type: 'words,chars' });
    const tl = g.timeline({ delay: 0.05 });
    tl.from(a.chars, { y: -90, rotation: () => g.utils.random(-28, 28), autoAlpha: 0, duration: 0.55, ease: 'slap', stagger: 0.022 })
      .from('.h1-tape', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.5, ease: 'expo.out' }, '-=0.2')
      .from(b.chars, { yPercent: 120, autoAlpha: 0, duration: 0.4, stagger: 0.018, ease: 'back.out(2.5)' }, '-=0.3')
      .from(['.hero-sub', '.hero-cta', '.hero-note'], { y: 24, autoAlpha: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, '-=0.3')
      .from('.hero-frame', { scale: 1.3, rotation: 5, autoAlpha: 0, boxShadow: '0px 0px 0px 0px #000', duration: 0.42, ease: 'power4.in' }, 0.3)
      .to(top, { y: 5, duration: 0.05, yoyo: true, repeat: 1, ease: 'none' }, '>')
      .from('.hero-sticker', { scale: 2.4, autoAlpha: 0, duration: 0.45, ease: 'back.out(3)', stagger: 0.14 }, '>-0.02')
      .set(top, { clearProps: 'transform' });

    // Stickers: grab, fling, settle with a wobble
    Draggable.create('.hero-sticker', {
      type: 'x,y', inertia: true, bounds: top, edgeResistance: 0.75, zIndexBoost: true,
      onPress() { g.to(this.target, { scale: 1.12, duration: 0.15, overwrite: 'auto' }); },
      onDrag() { g.to(this.target, { rotation: g.utils.clamp(-28, 28, this.deltaX * 2.4), duration: 0.25, overwrite: 'auto' }); },
      onThrowUpdate() {
        const vx = window.InertiaPlugin && InertiaPlugin.getVelocity ? InertiaPlugin.getVelocity(this.target, 'x') : 0;
        g.to(this.target, { rotation: g.utils.clamp(-28, 28, vx / 45), duration: 0.2, overwrite: 'auto' });
      },
      onRelease() { g.to(this.target, { scale: 1, duration: 0.3 }); if (!this.isThrowing) settleSticker(this.target); },
      onThrowComplete() { settleSticker(this.target); },
    });
    function settleSticker(el) { g.to(el, { rotation: 0, duration: 1.1, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' }); }

    if (fine && wide()) heroShader();
  }

  /* ---------------------------------------------- WebGL halftone / RGB-split */
  async function heroShader() {
    const frame = $('.hero-frame'), img = $('#hero-img');
    if (!frame || !img) return;
    let O;
    try { O = await import(window.NF_OGL_URL || 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm'); } catch (e) { return; }
    try {
      if (!img.complete || !img.naturalWidth) await img.decode();
      const { Renderer, Program, Mesh, Triangle, Texture } = O;
      const renderer = new Renderer({ dpr: Math.min(devicePixelRatio, 2), antialias: false });
      const gl = renderer.gl;
      gl.canvas.className = 'hero-gl';
      gl.canvas.setAttribute('aria-hidden', 'true');
      frame.appendChild(gl.canvas);
      const texture = new Texture(gl, { image: img, generateMipmaps: false });
      const u = { tMap: { value: texture }, uMouse: { value: [0.5, 0.5] }, uStrength: { value: 0 }, uAspect: { value: 1 } };
      const program = new Program(gl, {
        vertex: `attribute vec2 uv; attribute vec2 position; varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`,
        fragment: `precision highp float;
          uniform sampler2D tMap; uniform vec2 uMouse; uniform float uStrength; uniform float uAspect;
          varying vec2 vUv;
          void main(){
            vec2 asp = vec2(uAspect, 1.0);
            float d = distance(vUv * asp, uMouse * asp);
            float f = smoothstep(0.42, 0.0, d) * uStrength;
            vec2 dir = normalize(vUv - uMouse + 1e-4);
            float off = 0.022 * f;
            vec3 col = vec3(texture2D(tMap, vUv + dir * off).r, texture2D(tMap, vUv).g, texture2D(tMap, vUv - dir * off).b);
            float cells = 85.0;
            vec2 gp = vUv * asp * cells;
            vec2 cuv = (floor(gp) + 0.5) / cells / asp;
            vec3 cc = texture2D(tMap, cuv).rgb;
            float L = dot(cc, vec3(0.299, 0.587, 0.114));
            float r = (1.0 - L) * 0.62;
            float dotm = 1.0 - smoothstep(r - 0.07, r + 0.07, length(fract(gp) - 0.5));
            vec3 ht = mix(vec3(1.0), cc * 0.35, dotm);
            gl_FragColor = vec4(mix(col, ht, smoothstep(0.25, 0.85, f)), 1.0);
          }`,
        uniforms: u,
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
      const size = () => { renderer.setSize(frame.clientWidth, frame.clientHeight); u.uAspect.value = frame.clientWidth / frame.clientHeight; };
      size(); new ResizeObserver(size).observe(frame);
      const m = { x: 0.5, y: 0.5 }, tgt = { x: 0.5, y: 0.5 };
      let running = false;
      const render = () => { m.x += (tgt.x - m.x) * 0.16; m.y += (tgt.y - m.y) * 0.16; u.uMouse.value = [m.x, m.y]; renderer.render({ scene: mesh }); };
      const start = () => { if (!running) { running = true; g.ticker.add(render); } };
      const stop = () => { running = false; g.ticker.remove(render); };
      frame.addEventListener('pointermove', (e) => { const r = frame.getBoundingClientRect(); tgt.x = (e.clientX - r.left) / r.width; tgt.y = 1 - (e.clientY - r.top) / r.height; });
      frame.addEventListener('pointerenter', (e) => {
        const r = frame.getBoundingClientRect(); tgt.x = m.x = (e.clientX - r.left) / r.width; tgt.y = m.y = 1 - (e.clientY - r.top) / r.height;
        start(); g.to(gl.canvas, { opacity: 1, duration: 0.15, overwrite: true }); g.to(u.uStrength, { value: 1, duration: 0.5, ease: 'power2.out', overwrite: true });
      });
      frame.addEventListener('pointerleave', () => {
        g.to(u.uStrength, { value: 0, duration: 0.6, ease: 'power2.inOut', overwrite: true, onComplete: () => g.to(gl.canvas, { opacity: 0, duration: 0.15, onComplete: stop }) });
      });
    } catch (e) { /* no WebGL: the plain image stays */ }
  }

  /* -------------------------------------------------------------- features */
  function features() {
    const rows = $$('.feat-row');
    if (!rows.length) return;
    const icons = rows.map((r) => $('.feat-icon', r)), texts = rows.map((r) => $('div', r));
    g.set(icons, { scale: 0, rotation: -30 });
    g.set(texts, { x: -30, autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: rows[0].parentElement, start: 'top 82%', once: true,
      onEnter: () => {
        g.to(icons, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)', stagger: 0.12 });
        g.to(texts, { x: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out', stagger: 0.12 });
      },
    });
  }

  /* ------------------------------------------- app mockup: Flip + demo cursor */
  function mockup() {
    const fig = $('#mockup'), grid = $('#dash-grid');
    if (!fig || !grid) return;
    const cards = $$('.dash-card', grid), tabs = $$('.dash-tab', fig);
    const lockHeight = () => { g.set(grid, { minHeight: 0 }); g.set(grid, { minHeight: grid.offsetHeight }); };
    addEventListener('load', lockHeight); if (document.readyState === 'complete') lockHeight();

    const filter = (cat) => {
      tabs.forEach((t) => {
        const on = t.dataset.cat === cat;
        t.setAttribute('aria-pressed', on);
        t.classList.toggle('bg-paper', on); t.classList.toggle('text-ink', on); t.classList.toggle('text-neutral-400', !on);
      });
      const state = Flip.getState(cards);
      cards.forEach((c) => c.classList.toggle('hidden', !(cat === 'all' || c.dataset.cat === cat)));
      Flip.from(state, {
        duration: 0.6, ease: 'slap', absolute: true, stagger: 0.03,
        onEnter: (els) => g.fromTo(els, { autoAlpha: 0, scale: 0.6, rotation: -8 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2)' }),
        onLeave: (els) => g.to(els, { autoAlpha: 0, scale: 0.6, rotation: 8, duration: 0.3 }),
      });
    };
    tabs.forEach((t) => t.addEventListener('click', () => filter(t.dataset.cat)));

    if (!fine) return;
    // Idle demo: a fake cursor clicks through the tabs once, unless the visitor gets there first
    const cur = document.createElement('div');
    cur.className = 'demo-cursor';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.2 L11.3 13.6 L17.5 13.4 Z" fill="#FAFF00" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    fig.appendChild(cur);
    let touched = false, demo;
    fig.addEventListener('pointerenter', () => { touched = true; if (demo) { demo.kill(); g.to(cur, { autoAlpha: 0, duration: 0.2 }); } }, { once: true });
    const at = (el) => { const r = el.getBoundingClientRect(), f = fig.getBoundingClientRect(); return { x: r.left - f.left + r.width / 2 - 4, y: r.top - f.top + r.height / 2 - 2 }; };
    ScrollTrigger.create({
      trigger: fig, start: 'top 55%', once: true,
      onEnter: () => g.delayedCall(1.4, () => {
        if (touched) return;
        demo = g.timeline();
        demo.set(cur, { x: fig.clientWidth * 0.6, y: fig.clientHeight * 0.8, autoAlpha: 0 }).to(cur, { autoAlpha: 1, duration: 0.25 });
        ['posters', 'social', 'slides', 'all'].forEach((cat) => {
          const t = tabs.find((x) => x.dataset.cat === cat);
          demo.to(cur, { ...at(t), duration: 0.75, ease: 'power2.inOut' })
            .to(cur, { scale: 0.75, duration: 0.08, yoyo: true, repeat: 1 })
            .call(() => { if (!touched) filter(cat); })
            .to({}, { duration: 0.85 });
        });
        demo.to(cur, { autoAlpha: 0, duration: 0.3 });
      }),
    });
  }

  /* ---------------------------------------------------------- how it works */
  function howItWorks() {
    const how = $('#how');
    if (!how) return;
    const T = (i) => $(`.wf-text-${i}`, how), V = (i) => $(`.wf-vis-${i}`, how);
    const selRect = $('.sel-rect', how), selBits = [...$$('.sel-h', how), $('.sel-label', how)];
    const chks = $$('.wf-vis-2 .chk', how), chkI = $$('.wf-vis-2 .chk-i', how);
    const fill = $('.export-fill', how), stamp = $('.ready-stamp', how), card = $('.export-card', how);
    const dots = $$('.wf-dot', how);
    const LABELS = [0.75, 1.75, 3.35];
    let tl = null;

    const mm = g.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      g.set([T(1), T(2)], { autoAlpha: 0, y: 40 });
      g.set([V(1), V(2)], { autoAlpha: 0, y: 160, rotation: 10 });
      g.set(selRect, { drawSVG: '0%' }); g.set(selBits, { scale: 0, autoAlpha: 0 });
      g.set(chks, { backgroundColor: 'rgba(250,255,0,0)' }); g.set(chkI, { scale: 0 }); g.set(fill, { scaleX: 0 }); g.set(stamp, { autoAlpha: 0, scale: 2.4 });
      const setDots = () => {
        const i = tl.time() < 1.15 ? 0 : tl.time() < 2.15 ? 1 : 2;
        dots.forEach((d, j) => { d.classList.toggle('bg-ink', j <= i); d.classList.toggle('bg-paper', j > i); d.setAttribute('aria-current', j === i ? 'step' : 'false'); });
      };
      tl = g.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: how, start: 'top 72px', end: 'bottom bottom', scrub: 0.6, onUpdate: setDots } });
      tl.to(selRect, { drawSVG: '100%', duration: 0.45 }, 0.05)
        .to(selBits, { scale: 1, autoAlpha: 1, duration: 0.12, stagger: 0.05, ease: 'back.out(3)' }, 0.45)
        // deal step 1 -> 2
        .to(V(0), { x: -170, y: -50, rotation: -14, autoAlpha: 0, duration: 0.35 }, 1)
        .to(T(0), { y: -40, autoAlpha: 0, duration: 0.25 }, 1)
        .to(V(1), { y: 0, rotation: 0, autoAlpha: 1, duration: 0.35, ease: 'back.out(1.4)' }, 1.15)
        .to(T(1), { y: 0, autoAlpha: 1, duration: 0.25 }, 1.2)
        // deal step 2 -> 3
        .to(V(1), { x: -170, y: -50, rotation: -14, autoAlpha: 0, duration: 0.35 }, 2)
        .to(T(1), { y: -40, autoAlpha: 0, duration: 0.25 }, 2)
        .to(V(2), { y: 0, rotation: 0, autoAlpha: 1, duration: 0.35, ease: 'back.out(1.4)' }, 2.15)
        .to(T(2), { y: 0, autoAlpha: 1, duration: 0.25 }, 2.2)
        // step 3: tick, fill, stamp
        .to(chks, { backgroundColor: 'rgba(250,255,0,1)', duration: 0.06, stagger: 0.14 }, 2.55)
        .to(chkI, { scale: 1, duration: 0.1, stagger: 0.14, ease: 'back.out(3)' }, 2.57)
        .to(fill, { scaleX: 1, duration: 0.35, ease: 'none' }, 2.95)
        .to(stamp, { autoAlpha: 1, scale: 1, duration: 0.12, ease: 'power4.in' }, 3.32)
        .to(card, { x: 4, y: 2, duration: 0.03, yoyo: true, repeat: 1 }, 3.44)
        .to({}, { duration: 0.35 });
      return () => { tl = null; };
    });
    mm.add('(max-width: 1023px)', () => {
      $$('.wf-text, .wf-vis', how).forEach((el) => g.from(el, { y: 50, autoAlpha: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
      g.set(selRect, { drawSVG: '0%' }); g.set(selBits, { scale: 0 });
      g.timeline({ scrollTrigger: { trigger: V(0), start: 'top 70%', once: true } })
        .to(selRect, { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut' })
        .to(selBits, { scale: 1, duration: 0.15, stagger: 0.06, ease: 'back.out(3)' });
      g.set(chks, { backgroundColor: 'rgba(250,255,0,0)' }); g.set(chkI, { scale: 0 }); g.set(fill, { scaleX: 0 }); g.set(stamp, { autoAlpha: 0, scale: 2.4 });
      g.timeline({ scrollTrigger: { trigger: V(2), start: 'top 65%', once: true } })
        .to(chks, { backgroundColor: 'rgba(250,255,0,1)', duration: 0.1, stagger: 0.2 })
        .to(chkI, { scale: 1, duration: 0.15, stagger: 0.2, ease: 'back.out(3)' }, '<')
        .to(fill, { scaleX: 1, duration: 0.6, ease: 'none' })
        .to(stamp, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'power4.in' })
        .to(card, { x: 4, duration: 0.04, yoyo: true, repeat: 3 });
    });

    dots.forEach((d) => d.addEventListener('click', () => {
      if (!tl || !tl.scrollTrigger) return;
      const st = tl.scrollTrigger;
      scrollToY(st.start + (st.end - st.start) * (LABELS[+d.dataset.step] / tl.duration()));
    }));

    // Brand colour: paint wipes out from the swatch, then the whole page adopts it
    const paint = $('#wf-paint'), wipe = paint && $('.wipe', paint);
    $$('.swatch').forEach((s) => s.addEventListener('click', () => {
      const hex = s.dataset.hex;
      if (!wipe) { root.style.setProperty('--accent', hex); return; }
      const pr = paint.getBoundingClientRect(), sr = s.getBoundingClientRect();
      // start the wipe at the frame edge nearest the swatch, so the paint hits the picture right away
      const cx = g.utils.clamp(0, pr.width, sr.left + sr.width / 2 - pr.left), cy = g.utils.clamp(0, pr.height, sr.top + sr.height / 2 - pr.top);
      const R = Math.hypot(Math.max(Math.abs(cx), Math.abs(pr.width - cx)), Math.max(Math.abs(cy), Math.abs(pr.height - cy)));
      g.killTweensOf(wipe);
      g.fromTo(wipe, { backgroundColor: hex, clipPath: `circle(0px at ${cx}px ${cy}px)` }, {
        clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: 0.75, ease: 'power3.inOut',
        onComplete: () => { root.style.setProperty('--accent', hex); g.set(wipe, { clipPath: 'circle(0px at 0px 0px)' }); },
      });
      g.fromTo(s, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    }));
  }

  /* -------------------------------------------- templates: fan + Flip preview */
  function templates() {
    const grid = $('#tmpl-grid');
    if (!grid) return;
    const cards = $$('.tmpl', grid);
    const rot = [-9, 6, -4, 11];
    const stack = () => {
      const gr = grid.getBoundingClientRect(), cx = gr.left + gr.width / 2, cy = gr.top + gr.height / 2;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        g.set(c, { x: cx - (r.left + r.width / 2) + i * 6, y: cy - (r.top + r.height / 2) + i * 4 + 40, rotation: rot[i], scale: 0.86 });
      });
    };
    stack();
    ScrollTrigger.create({
      trigger: grid, start: 'top 78%', once: true,
      onEnter: () => g.to(cards, { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.9, ease: 'slap', stagger: 0.08 }),
    });

    cards.forEach((c, i) => {
      const img = $('.tmpl-img', c);
      if (fine) {
        c.addEventListener('pointerenter', () => { g.to(c, { y: -8, rotation: i % 2 ? 2 : -2, boxShadow: '10px 10px 0px 0px #000', duration: 0.3, ease: 'back.out(2)' }); g.to(img, { scale: 1.07, duration: 0.45, ease: 'power2.out' }); });
        c.addEventListener('pointerleave', () => { g.to(c, { y: 0, rotation: 0, boxShadow: '6px 6px 0px 0px #000', duration: 0.3 }); g.to(img, { scale: 1, duration: 0.45 }); });
      }
    });

    const pv = $('#preview'), pvImg = $('#pv-img');
    if (!pv || !pvImg) return;
    const chrome = (on, d = 0.25) => g.to(pv, { backgroundColor: on ? '#FFFFFF' : 'rgba(255,255,255,0)', borderColor: on ? '#000000' : 'rgba(0,0,0,0)', boxShadow: on ? '10px 10px 0px 0px #000' : '0px 0px 0px 0px rgba(0,0,0,0)', duration: d });
    const bits = () => $$('h2, button, p', pv);
    let active = null;
    cards.forEach((c) => c.addEventListener('click', () => {
      active = c;
      const img = $('.tmpl-img', c);
      $('#pv-title').textContent = c.dataset.title;
      pvImg.src = c.dataset.img; pvImg.alt = c.dataset.title + ' template preview';
      g.set(img, { scale: 1 });
      img.dataset.flipId = 'tmpl-preview'; pvImg.dataset.flipId = 'tmpl-preview';
      const state = Flip.getState(img);
      g.set(pv, { backgroundColor: 'rgba(255,255,255,0)', borderColor: 'rgba(0,0,0,0)', boxShadow: '0px 0px 0px 0px rgba(0,0,0,0)' });
      g.set(bits(), { autoAlpha: 0 });
      pv.showModal();
      Flip.from(state, { targets: pvImg, duration: 0.6, ease: 'expo.out', scale: true });
      chrome(true, 0.3);
      g.to(bits(), { autoAlpha: 1, duration: 0.25, delay: 0.3, stagger: 0.03 });
    }));
    let closing = false;
    const close = () => {
      if (closing || !pv.open) return;
      closing = true;
      const img = active && $('.tmpl-img', active);
      g.to(bits(), { autoAlpha: 0, duration: 0.15 });
      chrome(false, 0.18);
      const done = () => { pv.close(); g.set([pvImg, pv, ...bits()], { clearProps: 'all' }); closing = false; };
      if (img && img.getBoundingClientRect().height > 0) Flip.fit(pvImg, img, { duration: 0.5, ease: 'expo.inOut', scale: true, onComplete: done });
      else done();
    };
    pv.addEventListener('click', (e) => {
      if (e.target === pv || e.target.closest('[data-close]')) { e.stopImmediatePropagation(); close(); }
    }, true);
    pv.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  }

  /* ---------------------------------------------------- "made for" notes */
  function notes() {
    const ns = $$('.note');
    if (!ns.length) return;
    const r = (n) => +n.dataset.rot || 0;
    ns.forEach((n) => g.set(n, { rotation: r(n) - 14, y: 120, scale: 1.08, autoAlpha: 0, transformOrigin: '15% 0%' }));
    ScrollTrigger.create({
      trigger: ns[0].parentElement, start: 'top 80%', once: true,
      onEnter: () => g.to(ns, { rotation: (i) => r(ns[i]), y: 0, scale: 1, autoAlpha: 1, duration: 0.65, ease: 'back.out(1.6)', stagger: 0.16 }),
    });
    if (fine) ns.forEach((n) => {
      n.addEventListener('pointerenter', () => g.to(n, { rotation: 0, y: -8, duration: 0.3, ease: 'back.out(2)' }));
      n.addEventListener('pointerleave', () => g.to(n, { rotation: r(n), y: 0, duration: 0.35 }));
    });
  }

  /* -------------------------------------------------------- pricing */
  function pricing() {
    const plans = $$('.plan'), pro = $('.plan-pro');
    if (plans.length) {
      g.set(plans, { y: '+=70', autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: plans[0].parentElement, start: 'top 80%', once: true,
        onEnter: () => {
          g.to(plans.filter((p) => p !== pro), { y: '-=70', autoAlpha: 1, duration: 0.55, ease: 'power3.out', stagger: 0.1 });
          g.to(pro, { y: '-=70', autoAlpha: 1, duration: 0.7, ease: 'back.out(1.5)', delay: 0.28 });
        },
      });
    }

    // Odometer prices
    const prices = $$('[data-price-m]');
    const build = (el, str) => {
      el.innerHTML = `<span class="sr-only">${str}</span>` + [...str].map((ch) => /\d/.test(ch)
        ? `<span class="odo-col" aria-hidden="true"><span class="odo-strip">${'0123456789'.split('').map((d) => `<span>${d}</span>`).join('')}</span></span>`
        : `<span aria-hidden="true">${ch}</span>`).join('');
      el.classList.add('odo');
      $$('.odo-strip', el).forEach((s, i) => g.set(s, { yPercent: -10 * +str.replace(/\D/g, '')[i] }));
      el.dataset.cur = str;
    };
    prices.forEach((el) => build(el, el.dataset.priceM));
    const roll = (el, str) => {
      const from = el.dataset.cur || '';
      if (from.replace(/\d/g, '0') !== str.replace(/\d/g, '0')) return build(el, str);
      $('.sr-only', el).textContent = str;
      const digits = str.replace(/\D/g, '');
      $$('.odo-strip', el).forEach((s, i) => g.to(s, { yPercent: -10 * +digits[i], duration: 0.6 + i * 0.12, ease: 'slap' }));
      el.dataset.cur = str;
    };
    const stamp = $('.off-stamp'), badge = $('.save-badge');
    addEventListener('nf:billing', (e) => {
      const yearly = e.detail.yearly;
      prices.forEach((el) => roll(el, yearly ? el.dataset.priceY : el.dataset.priceM));
      if (badge) g.fromTo(badge, { scale: 1 }, { scale: 1.3, duration: 0.12, yoyo: true, repeat: 1 });
      if (!stamp) return;
      if (yearly) {
        g.fromTo(stamp, { scale: 2.6, rotation: -34, autoAlpha: 0 }, { scale: 1, rotation: -14, autoAlpha: 1, duration: 0.3, ease: 'power4.in', delay: 0.25 });
        g.to(pro, { x: 3, duration: 0.04, yoyo: true, repeat: 3, delay: 0.55 });
      } else g.to(stamp, { autoAlpha: 0, scale: 0.6, duration: 0.2 });
    });
  }

  /* ------------------------------------------------------------- FAQ */
  function faq() {
    $$('.faq').forEach((d) => {
      const sum = $('summary', d), plus = $('.faq-plus', d), body = $('p', d);
      sum.addEventListener('click', (e) => {
        e.preventDefault();
        if (d.dataset.anim) return;
        d.dataset.anim = '1';
        const from = d.offsetHeight;
        if (!d.open) {
          d.open = true;
          const to = d.offsetHeight;
          g.fromTo(d, { height: from, overflow: 'hidden' }, { height: to, duration: 0.45, ease: 'expo.out', onComplete: () => { g.set(d, { clearProps: 'height,overflow' }); delete d.dataset.anim; } });
          g.fromTo(body, { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, delay: 0.08 });
          g.to(plus, { rotation: 135, duration: 0.5, ease: 'back.out(3)' });
        } else {
          g.fromTo(d, { height: from, overflow: 'hidden' }, { height: sum.offsetHeight + 6, duration: 0.32, ease: 'power3.inOut', onComplete: () => { d.open = false; g.set(d, { clearProps: 'height,overflow' }); delete d.dataset.anim; } });
          g.to(plus, { rotation: 0, duration: 0.3 });
        }
      });
    });
  }

  /* -------------------------------------------------------------- CTA */
  function cta() {
    const h = $('.cta-title');
    if (h) SplitText.create(h, {
      type: 'words,chars', autoSplit: true,
      onSplit: (self) => g.from(self.chars, { y: 70, rotation: () => g.utils.random(-20, 20), autoAlpha: 0, duration: 0.5, ease: 'slap', stagger: 0.025, scrollTrigger: { trigger: h, start: 'top 82%', once: true } }),
    });
    const frame = $('.cta-frame'), due = $('.due-stamp');
    if (frame && due) {
      g.set(due, { autoAlpha: 0, scale: 3, rotation: -40 });
      g.timeline({ scrollTrigger: { trigger: frame, start: 'top 70%', once: true }, delay: 0.5 })
        .to(due, { autoAlpha: 1, scale: 1, rotation: -16, duration: 0.3, ease: 'power4.in' })
        .to(frame, { x: 5, duration: 0.04, yoyo: true, repeat: 3, ease: 'none' })
        .set(frame, { x: 0 });
    }
  }

  /* --------------------------------------------- form feedback + confetti */
  function feedback() {
    addEventListener('nf:invalid', (e) => {
      const f = e.detail && e.detail.field;
      if (f) g.fromTo(f, { x: 0 }, { x: 9, duration: 0.05, repeat: 5, yoyo: true, ease: 'none', clearProps: 'x' });
    });
    addEventListener('nf:joined', (e) => {
      const btn = e.detail && e.detail.button;
      if (!btn) return;
      g.fromTo(btn, { scale: 0.88 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      if (!window.confetti) return;
      const host = btn.closest('dialog');
      let fire = window.confetti, rect = btn.getBoundingClientRect(), W = innerWidth, H = innerHeight, ox = 0, oy = 0;
      if (host) { // dialogs sit in the top layer, so draw the burst inside the dialog
        let c = $('canvas.nf-confetti', host);
        if (!c) { c = document.createElement('canvas'); c.className = 'nf-confetti'; Object.assign(c.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' }); host.appendChild(c); c.__fire = confetti.create(c, { resize: true }); }
        fire = c.__fire; const hr = host.getBoundingClientRect(); W = hr.width; H = hr.height; ox = hr.left; oy = hr.top;
      }
      const origin = { x: (rect.left + rect.width / 2 - ox) / W, y: (rect.top + rect.height / 2 - oy) / H };
      const colors = ['#FAFF00', '#FF0080', '#00F0FF', '#000000'];
      const star = confetti.shapeFromText ? confetti.shapeFromText({ text: '✦', scalar: 2.2 }) : 'square';
      fire({ origin, colors, shapes: [star], scalar: 2.2, particleCount: 45, spread: 80, startVelocity: 40, disableForReducedMotion: true });
      fire({ origin, colors, shapes: ['square'], scalar: 1.1, particleCount: 60, spread: 120, startVelocity: 32, disableForReducedMotion: true });
    });
  }
})();
