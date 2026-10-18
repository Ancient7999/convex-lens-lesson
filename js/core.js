/* Convex lens lesson: shared engine (no dependencies) */
window.SOL = (function () {
  'use strict';
  const L = {};

  /* tutorial clock: virtual milliseconds that stop while paused and run faster at higher speed */
  const TC = { speed: 1, paused: false, base: 0, at: performance.now() };
  function tnow() { const n = performance.now(); if (!TC.paused) TC.base += (n - TC.at) * TC.speed; TC.at = n; return TC.base; }
  function tcSet(o) { tnow(); Object.assign(TC, o); }

  /* ---------- helpers ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs) { const t = el('text', Object.assign({ x, y }, attrs || {}), parent); t.textContent = s; return t; }
  /* text with italic symbols, subscripts and superscripts: parts are strings or {i}, {sub}, {sup} */
  function tsub(parent, x, y, parts, attrs) {
    const t = el('text', Object.assign({ x, y }, attrs || {}), parent);
    parts.forEach(p => {
      if (typeof p === 'string') { const s = el('tspan', null, t); s.textContent = p; }
      else if (p.i) { const s = el('tspan', { 'font-style': 'italic' }, t); s.textContent = p.i; }
      else { const s = el('tspan', { 'baseline-shift': p.sup ? 'super' : 'sub', 'font-size': '72%' }, t); s.textContent = p.sub || p.sup; }
    });
    return t;
  }
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function svgPoint(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function parseNum(s) { if (s == null) return NaN; s = String(s).trim().replace(',', '.').replace(/\s/g, '').replace('−', '-').replace(/^\+/, ''); if (!s) return NaN; return Number(s); }
  const near = (a, b, tol) => isFinite(a) && isFinite(b) && b !== 0 && Math.abs(a - b) / Math.abs(b) <= tol;
  const fmt = (v, d) => (Math.abs(v) < 1e-12 ? 0 : v).toFixed(d);
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const F_HEAD = 'var(--f-head)', F_BODY = 'var(--f-body)', F_CAP = 'var(--f-cap)';
  const C = { ink: 'var(--ink)', ink2: 'var(--ink-2)', muted: 'var(--muted)', acc: 'var(--acc)', acc2: 'var(--acc-2)', acc3: 'var(--acc-3)', accPale: 'var(--acc-pale)', sec: 'var(--sec)', sec2: 'var(--sec-2)', secPale: 'var(--sec-pale)', ray: 'var(--ray)', line: 'var(--line)', rule: 'var(--rule)', paper: 'var(--card)', good: 'var(--good)', bad: 'var(--bad)', warn: 'var(--warn)' };
  const raw = h => h;

  /* ---------- background: faint light rays refracted by an unseen lens, with slow glints travelling along them ---------- */
  function background() {
    const cv = $('bg'), ctx = cv.getContext('2d');
    let W = 0, H = 0, rgb = '178,61,29', rgb2 = '44,70,122', bundles = [];
    function build() {
      const rnd = mulberry32(1111); bundles = [];
      const n = W < 700 ? 2 : 3;
      for (let k = 0; k < n; k++) {
        const lx = W * (0.18 + 0.64 * (k + rnd() * .5) / n), cy = H * (0.25 + rnd() * .5), half = Math.min(H * .22, 150 + rnd() * 80), f = 160 + rnd() * 220;
        bundles.push({ lx, cy, half, f, rays: 9 + Math.floor(rnd() * 4), ph: rnd() * 10, sp: 0.03 + rnd() * .03, c: k % 2 ? rgb2 : rgb, drift: rnd() * 6.28 });
      }
    }
    function size() { const dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const cs = getComputedStyle(document.documentElement); rgb = cs.getPropertyValue('--bg-ray-rgb').trim() || rgb; rgb2 = cs.getPropertyValue('--bg-ray2-rgb').trim() || rgb2; build(); }
    function draw(now) {
      const t = now / 1000; ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1;
      bundles.forEach(b => {
        const fx = b.lx + b.f + Math.sin(t * .07 + b.drift) * 26, fy = b.cy + Math.cos(t * .05 + b.drift) * 10;
        /* the lens itself: a faint biconvex outline */
        ctx.strokeStyle = `rgba(${b.c},.07)`; ctx.beginPath(); ctx.ellipse(b.lx, b.cy, 9, b.half + 14, 0, 0, 6.283); ctx.stroke();
        for (let i = 0; i < b.rays; i++) {
          const y = b.cy - b.half + 2 * b.half * i / (b.rays - 1), ex = W + 40, k = (ex - b.lx) / (fx - b.lx), ey = y + (fy - y) * k;
          const a = .05 + .03 * Math.sin(t * .4 + i * .9 + b.ph);
          ctx.strokeStyle = `rgba(${b.c},${a.toFixed(3)})`; ctx.beginPath(); ctx.moveTo(-20, y); ctx.lineTo(b.lx, y); ctx.lineTo(ex, ey); ctx.stroke();
          /* a glint running along the ray */
          const L1 = b.lx + 20, L2 = Math.hypot(ex - b.lx, ey - y), tot = L1 + L2, d = ((t * 60 * (1 + b.sp * 8) + i * 97 + b.ph * 50) % (tot + 400)) - 200;
          if (d > 0 && d < tot) {
            let px, py; if (d < L1) { px = -20 + d; py = y; } else { const q = (d - L1) / L2; px = b.lx + (ex - b.lx) * q; py = y + (ey - y) * q; }
            const g = ctx.createRadialGradient(px, py, 0, px, py, 10); g.addColorStop(0, `rgba(${b.c},.20)`); g.addColorStop(1, `rgba(${b.c},0)`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 10, 0, 6.283); ctx.fill();
          }
        }
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 26); g.addColorStop(0, `rgba(${b.c},.12)`); g.addColorStop(1, `rgba(${b.c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, 26, 0, 6.283); ctx.fill();
      });
    }
    let last = 0;
    function frame(n) { if (n - last > 40) { draw(n); last = n; } requestAnimationFrame(frame); }
    window.addEventListener('resize', () => { size(); draw(performance.now()); }); size();
    if (reduced) draw(performance.now()); else requestAnimationFrame(frame);
  }

  /* ---------- navigation: a section rail; Practical is open, the other sections unlock on click and stay open for the session ---------- */
  const onEnter = {}, onLeave = {};
  let views = [], ids = [], items = [], current = -1;
  const keyOf = v => v.id.replace('view-', '').split('-')[0];
  const ICON = {
    practical: '<path d="M2 18h20"/><path d="M5 18v-6h3v6M16 18v-7h3v7"/><path d="M12 6c1.4 2 1.4 7 0 9-1.4-2-1.4-7 0-9z"/><path d="M12 15v3"/>',
    aim: '<circle cx="12" cy="12" r="8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    theory: '<path d="M2 8h8l6 8h6M2 16h8l6-8h6"/><path d="M10 4c1.2 2.5 1.2 13.5 0 16-1.2-2.5-1.2-13.5 0-16z"/>',
    method: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 5.5l1 1 2-2M4 11.5l1 1 2-2M4 17.5l1 1 2-2"/>',
    obs: '<rect x="3.5" y="4" width="17" height="16"/><path d="M3.5 9.5h17M3.5 15h17M10 4v16"/>',
    mcq: '<rect x="4" y="4" width="16" height="13"/><path d="M8 21l3-4"/><path d="M10 8.5a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.2"/><circle cx="12" cy="14" r=".6" fill="currentColor"/>'
  };
  const SHORT = { practical: 'Practical', aim: 'Aim', theory: 'Theory', method: 'Method', obs: 'Data', mcq: 'MCQs' };
  const LOCK = '<svg class="ri-lock" viewBox="0 0 16 16" aria-hidden="true"><path class="shackle" d="M5 7V5a3 3 0 0 1 6 0v2"/><rect x="3.5" y="7" width="9" height="7" rx="1"/></svg>';
  const secOf = v => v.id.replace('view-', '').split('-').slice(1).join('-');
  const unlockKey = k => 'lens-unlocked-' + k;
  function unlockedSet(k) { try { return new Set(JSON.parse(sessionStorage.getItem(unlockKey(k)) || '[]')); } catch (_) { return new Set(); } }
  function isOpen(v) { const s = secOf(v); return s === 'practical' || unlockedSet(keyOf(v)).has(s); }
  const memo = new Set();
  function unlock(v) {
    const k = keyOf(v), set = unlockedSet(k); set.add(secOf(v));
    try { sessionStorage.setItem(unlockKey(k), JSON.stringify([...set])); } catch (_) { /* storage unavailable: unlocked for this page view only */ }
    memo.add(v.id);
  }
  const open = v => isOpen(v) || memo.has(v.id);
  function paintLocks() { items.forEach((b, j) => { const o = open(views[j]); b.classList.toggle('locked', !o); b.setAttribute('aria-label', views[j].dataset.title + (o ? '' : ' (locked: opens on click)')); }); }
  function nav() {
    views = Array.from(document.querySelectorAll('.view')); ids = views.map(v => v.id.replace('view-', ''));
    const navEl = $('rail-nav');
    items = views.map((v, i) => {
      const sec = secOf(v), b = document.createElement('button'); b.type = 'button'; b.className = 'ri ri-' + sec; b.dataset.key = keyOf(v); b.dataset.sec = sec;
      b.innerHTML = `<span class="ri-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[sec] || ''}</svg>${sec === 'practical' ? '' : LOCK}</span><span class="ri-l">${v.dataset.title}</span><span class="ri-s">${SHORT[sec] || v.dataset.title}</span><span class="ri-tip" aria-hidden="true">${v.dataset.title}</span>`;
      b.addEventListener('click', () => {
        if (open(v)) { goTo(i, true); return; }
        if (b.classList.contains('unlocking')) return;
        unlock(v); b.classList.add('unlocking');
        setTimeout(() => { b.classList.remove('unlocking'); paintLocks(); goTo(i, true); }, reduced ? 0 : 520);
      });
      navEl.appendChild(b); return b;
    });
    window.addEventListener('popstate', () => goTo(fromHash(), false));
    window.addEventListener('hashchange', () => goTo(fromHash(), false));
  }
  function goTo(i, push) {
    i = clamp(i, 0, views.length - 1);
    if (i === current) return;
    if (!open(views[i])) unlock(views[i]); /* a direct link opens that one section only */
    if (current >= 0 && onLeave[ids[current]]) onLeave[ids[current]]();
    current = i;
    views.forEach((v, j) => v.classList.toggle('active', j === i));
    items.forEach((b, j) => { b.classList.toggle('current', j === i); if (j === i) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    paintLocks();
    const cr = $('top-crumb'); if (cr) cr.innerHTML = `<span>Lab 11</span><i>/</i><b>${views[i].dataset.title}</b>`;
    if (push && location.hash !== '#' + ids[i]) history.pushState(null, '', '#' + ids[i]);
    window.scrollTo({ top: 0 });
    document.title = views[i].dataset.title + ' · Focal length of a convex lens';
    if (onEnter[ids[i]]) onEnter[ids[i]]();
  }
  function fromHash() { const k = ids.indexOf(location.hash.replace('#', '')); return k < 0 ? 0 : k; }

  /* ---------- custom cursor: a fine reticle around a tiny biconvex lens; the centre is the hotspot ---------- */
  let cursorOn = false, lastTick = 0;
  function cursor() {
    const cur = $('cursor');
    if (!window.matchMedia('(pointer:fine)').matches) return;
    window.addEventListener('mousemove', e => {
      if (!cursorOn) { document.body.classList.add('has-cursor'); cursorOn = true; }
      cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      cur.classList.remove('hidden');
      const t = e.target && e.target.closest ? e.target : null;
      const grab = t && t.closest('.drag, .gh');
      const text = t && t.closest('input[type=text]');
      const hot = t && t.closest('button:not(:disabled), a, select, label, input[type=range], .live, .sym, .num');
      cur.classList.toggle('grab', !!grab); cur.classList.toggle('hot', !!hot && !grab); cur.classList.toggle('text', !!text);
    }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.add('hidden'));
    window.addEventListener('blur', () => cur.classList.add('hidden'));
    document.addEventListener('pointerdown', () => cursorTick(), true);
  }
  function cursorTick() {
    if (!cursorOn) return; const n = performance.now(); if (n - lastTick < 90) return; lastTick = n;
    const cur = $('cursor'); cur.classList.remove('tick'); void cur.offsetWidth; cur.classList.add('tick');
  }

  /* ---------- plot frame: upright axis labels, unsigned ticks ---------- */
  function makePlot(svg, o) {
    const W = o.W, H = o.H, ml = o.ml || 78, mr = o.mr || 26, mt = o.mt || 46, mb = o.mb || 62;
    const x0 = o.xmin || 0, y0 = o.ymin || 0;
    const X = v => ml + (v - x0) / (o.xmax - x0) * (W - ml - mr), Y = v => H - mb - (v - y0) / (o.ymax - y0) * (H - mt - mb);
    const ix = px => x0 + (px - ml) / (W - ml - mr) * (o.xmax - x0), iy = py => y0 + (H - mb - py) / (H - mt - mb) * (o.ymax - y0);
    svg.innerHTML = ''; svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const g = el('g', null, svg);
    el('rect', { x: ml, y: mt, width: W - ml - mr, height: H - mt - mb, fill: 'var(--plot)' }, g);
    const nx = Math.round((o.xmax - x0) / (o.xminor || o.xstep / 5)), ny = Math.round((o.ymax - y0) / (o.yminor || o.ystep / 5));
    for (let k = 0; k <= nx; k++) { const v = x0 + k * (o.xmax - x0) / nx; el('line', { x1: X(v), y1: mt, x2: X(v), y2: H - mb, stroke: 'var(--plot-grid)', 'stroke-width': k % 5 ? .5 : 1 }, g); }
    for (let k = 0; k <= ny; k++) { const v = y0 + k * (o.ymax - y0) / ny; el('line', { x1: ml, y1: Y(v), x2: W - mr, y2: Y(v), stroke: 'var(--plot-grid)', 'stroke-width': k % 5 ? .5 : 1 }, g); }
    for (let v = x0; v <= o.xmax + 1e-9; v += o.xstep) {
      el('line', { x1: X(v), y1: H - mb, x2: X(v), y2: H - mb + 6, stroke: C.ink, 'stroke-width': 1.2 }, g);
      txt(g, X(v), H - mb + 24, Math.abs(v).toFixed(o.xdec || 0), { 'text-anchor': 'middle', 'font-size': 14.5, fill: C.ink2, 'font-family': F_BODY });
    }
    for (let v = y0; v <= o.ymax + 1e-9; v += o.ystep) {
      el('line', { x1: ml - 6, y1: Y(v), x2: ml, y2: Y(v), stroke: C.ink, 'stroke-width': 1.2 }, g);
      txt(g, ml - 10, Y(v) + 5, Math.abs(v).toFixed(o.ydec || 0), { 'text-anchor': 'end', 'font-size': 14.5, fill: C.ink2, 'font-family': F_BODY });
    }
    el('line', { x1: ml, y1: H - mb, x2: W - mr + 8, y2: H - mb, stroke: C.ink, 'stroke-width': 1.6 }, g);
    el('line', { x1: ml, y1: H - mb, x2: ml, y2: mt - 10, stroke: C.ink, 'stroke-width': 1.6 }, g);
    tsub(g, (ml + W - mr) / 2, H - 12, o.xlabel, { 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 600, fill: C.ink, 'font-family': F_BODY });
    tsub(g, ml - 8, mt - 20, o.ylabel, { 'text-anchor': 'start', 'font-size': 16, 'font-weight': 600, fill: C.ink, 'font-family': F_BODY });
    const plot = el('g', null, svg);
    return { X, Y, ix, iy, g: plot, ml, mr, mt, mb, W, H };
  }

  /* ---------- MCQs: numbered, choices shuffled, hint on a wrong pick, explanation on the right one ---------- */
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function mcq(listEl, data, scoreEl, resetBtn) {
    let solved = 0, firstTry = 0;
    function render() {
      solved = 0; firstTry = 0; listEl.innerHTML = '';
      data.forEach((q, qi) => {
        const li = document.createElement('li'); li.className = 'mcq';
        li.innerHTML = `<p class="mcq-q"><span class="mcq-n">${String(qi + 1).padStart(2, '0')}</span><span>${q.q}</span></p><div class="mcq-opts"></div><div class="mcq-fb" aria-live="polite"></div>`;
        const opts = li.querySelector('.mcq-opts'), fb = li.querySelector('.mcq-fb'); let tries = 0;
        shuffle(q.o.map((t, i) => ({ t, i }))).forEach(c => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.innerHTML = c.t; b.dataset.k = c.i === 0 ? 'right' : 'wrong';
          b.addEventListener('click', () => {
            tries++;
            if (c.i === 0) {
              b.classList.add('right'); opts.querySelectorAll('.opt').forEach(x => x.disabled = true);
              fb.className = 'mcq-fb show explain'; fb.innerHTML = q.e; li.classList.add('solved'); solved++; if (tries === 1) firstTry++; upd();
            } else { b.classList.add('wrong'); b.disabled = true; fb.className = 'mcq-fb show hint'; fb.innerHTML = q.h; }
          });
          opts.appendChild(b);
        });
        listEl.appendChild(li);
      });
      upd();
    }
    function upd() { scoreEl.textContent = `${solved} / ${data.length} answered · ${firstTry} on the first try`; }
    resetBtn.addEventListener('click', render); render();
  }

  /* ---------- extras: opens upward, closes about 500 ms after the pointer leaves ---------- */
  function extras() {
    document.querySelectorAll('.extras').forEach(box => {
      const btn = box.querySelector('.extras-toggle'); let t = null, openedAt = 0;
      const op = () => { clearTimeout(t); if (!box.classList.contains('open')) openedAt = Date.now(); box.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); };
      const close = () => { clearTimeout(t); box.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
      const later = () => { clearTimeout(t); t = setTimeout(close, 500); };
      box.addEventListener('mouseenter', op); box.addEventListener('mouseleave', later);
      btn.addEventListener('click', () => { if (!box.classList.contains('open')) op(); else if (Date.now() - openedAt > 350) close(); });
      box.addEventListener('focusin', op); box.addEventListener('focusout', e => { if (!box.contains(e.relatedTarget)) later(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    });
  }

  /* ---------- method steps: a list that drives a figure ---------- */
  function methodSteps(listEl, capEl, draw, caps) {
    const btns = Array.from(listEl.querySelectorAll('.step'));
    function sel(i) { btns.forEach((b, k) => b.setAttribute('aria-pressed', k === i ? 'true' : 'false')); capEl.innerHTML = caps[i]; draw(i); }
    btns.forEach((b, i) => b.addEventListener('click', () => sel(i)));
    sel(0);
  }

  Object.assign(L, { raw, TC, tnow, tcSet, NS, reduced, el, txt, tsub, $, clamp, sleep, svgPoint, parseNum, near, fmt, mulberry32, F_HEAD, F_BODY, F_CAP, C, makePlot, mcq, methodSteps, onEnter, onLeave, goTo, cursorTick, shuffle });
  L._init = [background, nav, cursor, extras];
  L.boot = () => { L._init.forEach(f => f()); goTo(fromHash(), false); };
  return L;
})();
