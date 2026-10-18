/* Figures for the aim, theory, method and worked example, and the MCQ list */
(function (L) {
  'use strict';
  const { el, txt, $, C, F_BODY, F_CAP, LENS, NUM } = L;
  const T = (g, x, y, s, o) => txt(g, x, y, s, Object.assign({ 'font-family': F_BODY, 'font-size': 14, fill: C.ink2 }, o || {}));
  const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2), f4 = v => v.toFixed(4);
  /* a dimension line with end ticks and a centred label */
  function dim(g, x1, x2, y, lab, col) {
    col = col || C.ink2;
    el('line', { x1, y1: y, x2, y2: y, stroke: col, 'stroke-width': 1.2 }, g);
    [x1, x2].forEach(x => el('line', { x1: x, y1: y - 6, x2: x, y2: y + 6, stroke: col, 'stroke-width': 1.2 }, g));
    T(g, (x1 + x2) / 2, y - 7, lab, { 'text-anchor': 'middle', 'font-size': 15, 'font-style': 'italic', 'font-weight': 600, fill: col });
  }

  /* ---------- aim figure ---------- */
  (function aim() {
    const s = $('aim-fig'); if (!s) return;
    const fpx = 100, u = 2.6, r = LENS.rayDiagram(s, { x: 450, y: 170, w: 430, fpx, u, h: 52, lh: 96 });
    const v = u * fpx / (u - 1) * 1;
    dim(r.g, 450 - u * fpx, 450, 292, 'u', C.acc2); dim(r.g, 450, 450 + v, 292, 'v', C.sec);
    T(r.g, 450, 318, '1/f = 1/u + 1/v', { 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 600, fill: C.ink });
  })();

  /* ---------- theory: focusing parallel rays ---------- */
  function parallelFig(s, o) {
    s.innerHTML = ''; o = o || {};
    const gid = LENS.glassDefs(s), g = el('g', null, s), X0 = o.x || 230, Y0 = o.y || 130, f = o.fpx || 150, W = o.w || 520;
    el('line', { x1: 14, y1: Y0, x2: W - 14, y2: Y0, stroke: C.ink, 'stroke-width': 1.3 }, g);
    LENS.drawLens(g, X0, Y0, 96, 9, gid);
    [-72, -44, -18, 18, 44, 72].forEach(h => el('path', { d: `M24 ${Y0 + h} L${X0} ${Y0 + h} L${X0 + f} ${Y0} L${W - 20} ${Y0 - h * (W - 20 - X0 - f) / f}`, fill: 'none', stroke: C.acc, 'stroke-width': 1.7, opacity: .9 }, g));
    el('circle', { cx: X0 + f, cy: Y0, r: 4.5, fill: C.ink }, g);
    T(g, X0 + f, Y0 + 26, 'F', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 16, fill: C.ink });
    el('circle', { cx: X0, cy: Y0, r: 3, fill: C.sec }, g);
    dim(g, X0, X0 + f, Y0 + 112, 'f', C.sec);
    if (o.labels !== false) {
      T(g, X0 + 8, Y0 - 104, 'optical centre', { 'font-size': 12.5, fill: C.sec, 'font-style': 'italic' });
      T(g, W - 18, Y0 - 8, 'principal axis', { 'text-anchor': 'end', 'font-size': 12.5, fill: C.muted, 'font-style': 'italic' });
      T(g, 24, Y0 - 82, o.from || 'parallel rays', { 'font-size': 12.5, fill: C.acc2, 'font-style': 'italic' });
    }
    return g;
  }
  (function focus() { const s = $('th-focus'); if (s) parallelFig(s, { x: 210, y: 120, fpx: 170, w: 520 }); })();

  /* ---------- theory: the cases ---------- */
  (function cases() {
    const box = $('th-cases'); if (!box) return;
    const C6 = [
      { u: null, t: 'Object at infinity', d: 'Parallel rays meet at F: the distance-object method.', k: 'image at F · real · inverted · tiny' },
      { u: 2.6, t: 'Beyond 2F', d: 'The image forms between F and 2F on the other side.', k: 'real · inverted · diminished' },
      { u: 2, t: 'At 2F', d: 'The image forms at 2F: u = v = 2f.', k: 'real · inverted · same size' },
      { u: 1.5, t: 'Between F and 2F', d: 'The image forms beyond 2F.', k: 'real · inverted · magnified' },
      { u: 1, t: 'At F', d: 'The rays leave parallel: no image forms on a screen.', k: 'image at infinity' },
      { u: 0.6, t: 'Inside F', d: 'The rays diverge after the lens; they seem to come from a point on the object side. The magnifier case.', k: 'virtual · upright · magnified' }
    ];
    C6.forEach(c => {
      const fig = document.createElement('figure'); fig.className = 'case';
      const s = el('svg', { viewBox: '0 0 420 230', role: 'img', 'aria-label': 'Ray diagram: object ' + c.t.toLowerCase() }, fig);
      if (c.u == null) parallelFig(s, { x: 170, y: 110, fpx: 110, w: 420, labels: false });
      else LENS.rayDiagram(s, { x: c.u < 1 ? 240 : 200, y: 120, w: c.u < 1 ? 230 : 196, fpx: c.u > 2.2 ? 54 : c.u >= 2 ? 62 : c.u >= 1.5 ? 56 : c.u >= 1 ? 72 : 82, u: c.u, h: 34, lh: 76 });
      const cap = document.createElement('figcaption'); cap.innerHTML = `<b>${c.t}</b>${c.d}<span class="kv">${c.k}</span>`; fig.appendChild(cap);
      box.appendChild(fig);
    });
  })();

  /* ---------- theory: explorer ---------- */
  (function explorer() {
    const s = $('th-ex-svg'), r = $('th-ex-u'), out = $('th-ex-out'); if (!s) return;
    function draw() {
      const u = +r.value, f = 15; $('th-ex-uv').textContent = f1(u) + ' cm';
      LENS.rayDiagram(s, { x: 360, y: 160, w: 350, fpx: 66, u: u / f, h: 40, lh: 92 });
      if (Math.abs(u - f) < 1e-6) { out.innerHTML = '<b>u = F</b>: the refracted rays are parallel, so the image is at infinity. No screen position gives an image.'; return; }
      const v = u * f / (u - f), m = Math.abs(v) / u;
      if (v > 0) {
        const nat = m < .97 ? 'diminished' : m > 1.03 ? 'magnified' : 'same size';
        out.innerHTML = `v = ${u} × 15 ÷ (${u} − 15) = <b>${f1(v)} cm</b>${v * 66 / f > 350 ? ' (off the drawing)' : ''}<br>Real, inverted, ${nat}: m = v/u = <b>${f2(m)}</b><br>Object to image: u + v = <b>${f1(u + v)} cm</b>${Math.abs(u - 30) < .3 ? ' — the minimum, 4F' : ' (never less than 4F = 60 cm)'}`;
      } else out.innerHTML = `v = ${u} × 15 ÷ (${u} − 15) = <b>${f1(v)} cm</b>: negative, so the image is <b>virtual</b>, on the object side.<br>Upright and magnified, m = |v|/u = <b>${f2(m)}</b>. It can be seen through the lens but not caught on a screen.`;
    }
    r.addEventListener('input', draw); draw();
  })();

  /* ---------- theory: u + v against u ---------- */
  (function sum() {
    const s = $('th-sum'); if (!s) return;
    const P = L.makePlot(s, { W: 520, H: 330, ml: 64, mr: 22, mt: 44, mb: 56, xmin: 15, xmax: 75, ymin: 40, ymax: 140, xstep: 10, ystep: 20, xlabel: [{ i: 'u' }, ' (cm)'], ylabel: [{ i: 'u' }, ' + ', { i: 'v' }, ' (cm)'] });
    const pts = []; for (let u = 17.2; u <= 75.01; u += .4) { const v = u * 15 / (u - 15); if (u + v <= 140) pts.push(`${P.X(u).toFixed(1)} ${P.Y(u + v).toFixed(1)}`); }
    el('line', { x1: P.X(15), y1: P.Y(60), x2: P.X(75), y2: P.Y(60), stroke: C.sec, 'stroke-width': 1.4, 'stroke-dasharray': '6 5' }, P.g);
    el('path', { d: 'M' + pts.join(' L'), fill: 'none', stroke: C.acc, 'stroke-width': 2.6 }, P.g);
    el('circle', { cx: P.X(30), cy: P.Y(60), r: 5.5, fill: C.acc, stroke: 'var(--card)', 'stroke-width': 2 }, P.g);
    T(P.g, P.X(31.5), P.Y(60) + 22, 'minimum 4F = 60 cm at u = 2F', { 'font-size': 13.5, fill: C.acc2, 'font-weight': 600 });
    T(P.g, P.X(74), P.Y(60) - 8, 'u + v = 4F', { 'text-anchor': 'end', 'font-size': 12.5, fill: C.sec, 'font-style': 'italic' });
  })();

  /* ---------- method: apparatus ---------- */
  (function apparatus() {
    const box = $('app-grid'); if (!box) return;
    const items = [
      ['Optical bench', 'Metal rail with a cm scale and sliding riders', g => {
        el('rect', { x: 8, y: 58, width: 184, height: 22, fill: '#c9cdc6', stroke: '#6f756f' }, g);
        for (let k = 0; k <= 36; k++) el('line', { x1: 14 + k * 4.9, y1: 58, x2: 14 + k * 4.9, y2: k % 5 ? 64 : 69, stroke: '#2a2d28', 'stroke-width': .8 }, g);
        [40, 100, 160].forEach(x => { el('rect', { x: x - 12, y: 44, width: 24, height: 16, fill: '#1c1e1a', stroke: '#000' }, g); el('line', { x1: x, y1: 60, x2: x, y2: 80, stroke: '#e2593a', 'stroke-width': 1.2 }, g); el('circle', { cx: x + 15, cy: 52, r: 3, fill: '#b8923e' }, g); });
        el('rect', { x: 2, y: 80, width: 14, height: 12, fill: '#2c2f2a' }, g); el('rect', { x: 184, y: 80, width: 14, height: 12, fill: '#2c2f2a' }, g);
      }],
      ['Lamp house', 'Lit F-shaped cut-out: the object', g => {
        el('rect', { x: 62, y: 12, width: 76, height: 78, rx: 5, fill: '#3e4a3c', stroke: '#11140f' }, g);
        el('rect', { x: 80, y: 30, width: 40, height: 44, fill: '#14160f' }, g);
        el('path', { d: LENS.fGlyph, transform: 'translate(100 52) scale(16)', fill: '#fff2cf' }, g);
        el('circle', { cx: 100, cy: 52, r: 26, fill: '#ffd98a', opacity: .12 }, g);
        el('rect', { x: 92, y: 90, width: 16, height: 10, fill: '#9aa29a' }, g);
      }],
      ['Convex lens', 'In a holder; labelled f = 15 cm', g => {
        const gid = LENS.glassDefs(g.ownerSVGElement); LENS.drawLens(g, 100, 50, 40, 8, gid, { stroke: '#a9c3c4' });
        el('path', { d: 'M100 6 q-14 0 -14 14 v60 q0 14 14 14 q14 0 14 -14 v-60 q0 -14 -14 -14z', fill: 'none', stroke: '#11140f', 'stroke-width': 3 }, g);
        el('rect', { x: 94, y: 94, width: 12, height: 10, fill: '#9aa29a' }, g);
      }],
      ['White screen', 'Catches the real image', g => {
        el('path', { d: 'M86 10 L114 18 L114 86 L86 94 Z', fill: '#e8e4d6', stroke: '#11140f' }, g);
        el('path', { d: LENS.fGlyph, transform: 'translate(100 52) scale(9 -9)', fill: '#7b6f4f', opacity: .7 }, g);
        el('rect', { x: 96, y: 94, width: 8, height: 10, fill: '#9aa29a' }, g);
      }],
      ['Card and a distant object', 'A window across the room, for a rough F', g => {
        el('rect', { x: 18, y: 14, width: 64, height: 78, fill: '#d8e2dd', stroke: '#b5ad93', 'stroke-width': 4 }, g);
        el('line', { x1: 50, y1: 14, x2: 50, y2: 92, stroke: '#b5ad93', 'stroke-width': 3 }, g); el('line', { x1: 18, y1: 50, x2: 82, y2: 50, stroke: '#b5ad93', 'stroke-width': 3 }, g);
        el('path', { d: 'M144 22 L170 30 L170 80 L144 88 Z', fill: '#e8e4d6', stroke: '#11140f' }, g);
        el('rect', { x: 150, y: 46, width: 12, height: 14, fill: '#fff2cf', opacity: .8 }, g);
      }]
    ];
    items.forEach(([nm, sm, draw]) => {
      const d = document.createElement('div'); d.className = 'app-item';
      const s = el('svg', { viewBox: '0 0 200 108', 'aria-hidden': 'true' }, d); draw(el('g', null, s));
      d.insertAdjacentHTML('beforeend', `<span>${nm}</span><small>${sm}</small>`); box.appendChild(d);
    });
  })();

  /* ---------- method: steps drive a schematic ---------- */
  (function steps() {
    const s = $('m-step-svg'), list = $('m-steps'), cap = $('m-step-cap'); if (!s) return;
    const EX = LENS.EX;
    const caps = [
      'The lens faces a window across the room; a white card behind it is moved until the window is sharp on it.',
      `The lens-to-card distance is a rough F (here ${f1(LENS.EX_ROUGH)} cm); 2F = ${f1(2 * LENS.EX_ROUGH)} cm.`,
      `The lamp house goes beyond 2F, for example u = ${f1(EX[0].u)} cm from the lens.`,
      `The screen is slid until the F is sharp: a small, inverted image, at about v = ${f1(EX[0].v)} cm.`,
      'Both distances are measured from the centre of the lens: u to the lamp (object), v to the screen.',
      'Three readings beyond 2F, one at 2F and three between F and 2F, where the image is magnified and lies far out.',
      'Each pair gives a point (1/u, 1/v). The best-fit line is extended to meet both axes.',
      'Both intercepts estimate 1/F. F = 1 ÷ mean intercept; P = 1/f with f in metres.'
    ];
    function bench(g, lampU, scrV, o) {
      o = o || {}; const X0 = 280, k = 4.2, Y = 190;
      el('rect', { x: 20, y: 236, width: 520, height: 16, fill: '#aeb3ab' }, g);
      for (let c = 0; c <= 26; c++) el('line', { x1: 30 + c * 19.2, y1: 236, x2: 30 + c * 19.2, y2: 242, stroke: '#2a2d28', 'stroke-width': 1 }, g);
      el('line', { x1: 24, y1: Y, x2: 536, y2: Y, stroke: '#6f756f', 'stroke-dasharray': '3 5' }, g);
      const gid = LENS.glassDefs(s); LENS.drawLens(g, X0, Y, 40, 6, gid, { stroke: '#a9c3c4' }); el('line', { x1: X0, y1: Y + 40, x2: X0, y2: 236, stroke: '#9aa29a', 'stroke-width': 3 }, g);
      if (lampU != null) {
        const x = X0 - lampU * k; el('rect', { x: x - 30, y: Y - 26, width: 30, height: 52, fill: '#3e4a3c', stroke: '#000' }, g);
        el('path', { d: LENS.fGlyph, transform: `translate(${x - 2} ${Y}) scale(10)`, fill: '#fff2cf' }, g); el('line', { x1: x - 15, y1: Y + 26, x2: x - 15, y2: 236, stroke: '#9aa29a', 'stroke-width': 3 }, g);
        if (o.beam) { const v = scrV; el('path', { d: `M${x} ${Y - 10} L${X0} ${Y - 30} L${X0 + v * k} ${Y + 10 * v / lampU} L${X0} ${Y + 30} L${x} ${Y + 10}Z`, fill: '#ffd98a', opacity: .16 }, g); }
      }
      if (scrV != null) {
        const x = X0 + scrV * k; el('path', { d: `M${x} ${Y - 40} L${x + 8} ${Y - 36} L${x + 8} ${Y + 36} L${x} ${Y + 40}Z`, fill: '#e8e4d6', stroke: '#000' }, g);
        el('line', { x1: x + 4, y1: Y + 38, x2: x + 4, y2: 236, stroke: '#9aa29a', 'stroke-width': 3 }, g);
        if (o.img) el('path', { d: LENS.fGlyph, transform: `translate(${x + 4} ${Y}) scale(${(10 * scrV / lampU).toFixed(2)} ${(-10 * scrV / lampU).toFixed(2)})`, fill: '#7b6f4f', opacity: .8 }, g);
      }
      if (o.marks) [[-2, '2F'], [-1, 'F'], [1, 'F'], [2, '2F']].forEach(([m, t]) => { const x = X0 + m * LENS.EX_ROUGH * k; el('path', { d: `M${x - 4} 228 L${x + 4} 228 L${x} 236Z`, fill: '#e2593a' }, g); T(g, x, 222, t, { 'text-anchor': 'middle', 'font-size': 11, fill: '#f08a6b', 'font-weight': 700 }); });
      return { X0, k, Y };
    }
    const W = (g, x, y, t, o) => T(g, x, y, t, Object.assign({ fill: '#d6dccb', 'font-size': 13 }, o || {}));
    function draw(i) {
      s.innerHTML = ''; const g = el('g', null, s);
      if (i <= 1) {
        const gid = LENS.glassDefs(s); el('rect', { x: 24, y: 70, width: 70, height: 96, fill: '#d8e2dd', stroke: '#b5ad93', 'stroke-width': 5 }, g);
        W(g, 59, 60, 'window ≈ 10 m', { 'text-anchor': 'middle', 'font-size': 12 });
        el('line', { x1: 24, y1: 190, x2: 536, y2: 190, stroke: '#6f756f', 'stroke-dasharray': '3 5' }, g);
        el('path', { d: 'M110 160 L250 160 L250 220 L110 220Z', fill: '#ffd98a', opacity: .08 }, g);
        LENS.drawLens(g, 250, 190, 40, 6, gid, { stroke: '#a9c3c4' });
        const cx = 250 + LENS.EX_ROUGH * 13;
        el('path', { d: `M250 150 L${cx} 190 L250 230Z`, fill: '#ffd98a', opacity: .16 }, g);
        el('path', { d: `M${cx} 150 L${cx + 8} 154 L${cx + 8} 226 L${cx} 230Z`, fill: '#e8e4d6', stroke: '#000' }, g);
        if (i === 1) { el('line', { x1: 250, y1: 262, x2: cx, y2: 262, stroke: '#e2593a', 'stroke-width': 1.4 }, g); W(g, (250 + cx) / 2, 254, `F ≈ ${f1(LENS.EX_ROUGH)} cm`, { 'text-anchor': 'middle', fill: '#f08a6b', 'font-weight': 700 }); }
        return;
      }
      if (i === 2) { bench(g, EX[0].u, null, { marks: true }); W(g, 30, 40, 'lamp beyond 2F'); }
      if (i === 3) { bench(g, EX[0].u, EX[0].v, { marks: true, beam: true, img: true }); W(g, 30, 40, 'sharp, diminished image on the screen'); }
      if (i === 4) {
        const b = bench(g, EX[0].u, EX[0].v, { img: true });
        [[b.X0 - EX[0].u * b.k, b.X0, 'u = ' + f1(EX[0].u) + ' cm', '#f08a6b'], [b.X0, b.X0 + EX[0].v * b.k, 'v = ' + f1(EX[0].v) + ' cm', '#9fb8ff']].forEach(([x1, x2, t, c]) => {
          el('line', { x1, y1: 280, x2, y2: 280, stroke: c, 'stroke-width': 1.4 }, g); [x1, x2].forEach(x => el('line', { x1: x, y1: 273, x2: x, y2: 287, stroke: c }, g)); W(g, (x1 + x2) / 2, 306, t, { 'text-anchor': 'middle', fill: c, 'font-weight': 700, 'font-size': 14 });
        });
      }
      if (i === 5) { bench(g, EX[5].u, EX[5].v, { marks: true, beam: true, img: true }); W(g, 30, 40, `magnified: u = ${f1(EX[5].u)} cm, v = ${f1(EX[5].v)} cm`); }
      if (i >= 6) {
        const P = { X: x => 70 + x * 5600, Y: y => 300 - y * 3400 };
        el('line', { x1: 70, y1: 300, x2: 540, y2: 300, stroke: '#d6dccb' }, g); el('line', { x1: 70, y1: 300, x2: 70, y2: 20, stroke: '#d6dccb' }, g);
        W(g, 530, 290, '1/u', { 'text-anchor': 'end', 'font-style': 'italic' }); W(g, 78, 30, '1/v', { 'font-style': 'italic' });
        EX.forEach(e => el('circle', { cx: P.X(1 / e.u), cy: P.Y(1 / e.v), r: 4.5, fill: 'none', stroke: '#fff2cf', 'stroke-width': 2 }, g));
        const F = LENS.fit(EX.map(e => ({ x: 1 / e.u, y: 1 / e.v })));
        el('line', { x1: P.X(0), y1: P.Y(F.a), x2: P.X(F.xi), y2: P.Y(0), stroke: '#e2593a', 'stroke-width': 2, 'stroke-dasharray': i === 7 ? '' : '6 5' }, g);
        if (i === 7) {
          el('circle', { cx: P.X(F.xi), cy: 300, r: 5, fill: '#9fb8ff' }, g); el('circle', { cx: 70, cy: P.Y(F.a), r: 5, fill: '#9fb8ff' }, g);
          W(g, P.X(F.xi), 322, 'a', { 'text-anchor': 'middle', fill: '#9fb8ff', 'font-weight': 700, 'font-style': 'italic' }); W(g, 56, P.Y(F.a) + 5, 'b', { 'text-anchor': 'middle', fill: '#9fb8ff', 'font-weight': 700, 'font-style': 'italic' });
          W(g, 300, 60, 'F = 1 ÷ [(a + b) ÷ 2]', { 'font-size': 15, fill: '#f08a6b', 'font-weight': 700 });
        }
      }
    }
    L.methodSteps(list, cap, draw, caps);
  })();

  /* ---------- worked example ---------- */
  (function example() {
    const tb = $('ex-table'); if (!tb) return;
    const EX = LENS.EX, rows = EX.map(e => LENS.row(e.u, e.v));
    $('ex-F').textContent = f1(LENS.EX_ROUGH); $('ex-2F').textContent = f1(2 * LENS.EX_ROUGH);
    const grp = [{ k: 'lt', nm: 'u < 2F', sub: 'magnified', r: rows.filter(r => LENS.group(r.u, r.v) === 'lt') }, { k: 'eq', nm: 'u = 2F', sub: 'same size', r: rows.filter(r => LENS.group(r.u, r.v) === 'eq') }, { k: 'gt', nm: 'u > 2F', sub: 'diminished', r: rows.filter(r => LENS.group(r.u, r.v) === 'gt') }];
    const Fs = grp.flatMap(G => G.r).map(r => +f2(r.F)), mF = Fs.reduce((a, b) => a + b, 0) / Fs.length;
    let h = '<thead><tr><th>Position</th><th><i>U</i><span class="u">cm</span></th><th><i>V</i><span class="u">cm</span></th><th>1/<i>U</i><span class="u">cm⁻¹</span></th><th>1/<i>V</i><span class="u">cm⁻¹</span></th><th><span class="fx">1/<i>F</i> = 1/<i>U</i> + 1/<i>V</i></span><span class="u">cm⁻¹</span></th><th><i>F</i><span class="u">cm</span></th></tr></thead><tbody>';
    grp.forEach(G => G.r.forEach((r, i) => {
      h += `<tr class="${i === 0 ? 'gstart' : ''}">${i === 0 ? `<td class="grp" rowspan="${G.r.length}">${G.nm}<small>${G.sub}</small></td>` : ''}<td>${f1(r.u)}</td><td>${f1(r.v)}</td><td class="calc-c">${f4(r.iu)}</td><td class="calc-c">${f4(r.iv)}</td><td class="calc-c">${f4(r.iF)}</td><td class="f-c">${f2(r.F)}</td></tr>`;
    }));
    h += `</tbody><tfoot><tr><td class="lbl" colspan="6">Mean (<i>F</i>)</td><td>${f2(mF)}</td></tr></tfoot>`;
    tb.innerHTML = h;
    /* graph */
    const P = L.makePlot($('ex-graph'), { W: 640, H: 560, ml: 84, mr: 30, mt: 52, mb: 66, xmax: 0.08, ymax: 0.08, xstep: 0.01, ystep: 0.01, xdec: 2, ydec: 2, xlabel: ['1/', { i: 'u' }, ' (cm⁻¹)'], ylabel: ['1/', { i: 'v' }, ' (cm⁻¹)'] });
    const F = LENS.fit(rows.map(r => ({ x: r.iu, y: r.iv }))), a4 = +f4(F.xi), b4 = +f4(F.yi), mi = +((a4 + b4) / 2).toFixed(5), Fg = +f2(1 / mi);
    el('path', { d: `M${P.X(0)} ${P.Y(F.yi)} L${P.X(F.xi)} ${P.Y(0)}`, stroke: C.acc, 'stroke-width': 1.6, 'stroke-dasharray': '6 5', fill: 'none' }, P.g);
    el('path', { d: `M${P.X(0.02)} ${P.Y(F.a + F.b * .02)} L${P.X(0.052)} ${P.Y(F.a + F.b * .052)}`, stroke: C.acc, 'stroke-width': 2.6, fill: 'none' }, P.g);
    rows.forEach(r => el('circle', { cx: P.X(r.iu), cy: P.Y(r.iv), r: 5.4, fill: 'var(--plot)', stroke: C.ink, 'stroke-width': 2.2 }, P.g));
    [[P.X(F.xi), P.Y(0), `a = ${f4(F.xi)}`, 10, -14, 'start'], [P.X(0), P.Y(F.yi), `b = ${f4(F.yi)}`, 14, 5, 'start']].forEach(([x, y, t, dx, dy, an]) => {
      el('path', { d: `M${x} ${y - 9} L${x + 7} ${y} L${x} ${y + 9} L${x - 7} ${y}Z`, fill: C.sec }, P.g);
      T(P.g, x + dx, y + dy, t, { 'text-anchor': an, 'font-size': 15, 'font-weight': 700, fill: C.sec });
    });
    T(P.g, P.X(0.042), P.Y(0.062), `slope ≈ ${F.b.toFixed(2)}`, { 'font-size': 14, fill: C.muted, 'font-style': 'italic' });
    /* calculation */
    const fm = +(+f2(mF) / 100).toFixed(4), Pw = 1 / fm, e1 = Math.abs(+f2(mF) - 15) / 15 * 100, e2 = Math.abs(Fg - 15) / 15 * 100;
    const step = (n, sub, line, res) => `<div class="calc-step${res ? ' result' : ''}"><span class="cs-n">${n}</span><span class="sub">${sub}</span><span class="eq-line">${line}</span></div>`;
    $('ex-calc').innerHTML = [
      step(1, 'Theoretical value', 'Labelled on the lens holder: <i>f</i><sub>th</sub> = <b>15 cm</b>'),
      step(2, 'Experimental value: the mean of the F column', `Mean (<i>F</i>) = (${Fs.map(f2).join(' + ')}) ÷ 7 = ${f2(Fs.reduce((a, b) => a + b, 0))} ÷ 7 = <b>${f2(mF)} cm</b>`),
      step(3, 'Intercept on the 1/u axis', `<i>a</i> = <b>${f4(F.xi)} cm⁻¹</b>`),
      step(4, 'Intercept on the 1/v axis', `<i>b</i> = <b>${f4(F.yi)} cm⁻¹</b>`),
      step(5, 'Mean intercept', `1/<i>F</i> = (${f4(F.xi)} + ${f4(F.yi)}) ÷ 2 = <b>${mi.toFixed(5)} cm⁻¹</b>`),
      step(6, 'Graphical value', `<i>F</i><sub>graph</sub> = 1 ÷ ${mi.toFixed(5)} = <b>${f2(Fg)} cm</b>`),
      step(7, 'Focal length in metres', `<i>f</i> = ${f2(mF)} ÷ 100 = <b>${fm.toFixed(4)} m</b>`),
      step(8, 'Power', `<i>P</i> = 1 ÷ ${fm.toFixed(4)} = <b>+${f2(Pw)} D</b>`),
      step(9, 'Percentage error, table', `|${f2(mF)} − 15| ÷ 15 × 100 = <b>${f2(e1)} %</b>`),
      step('✓', 'Percentage error, graph', `|${f2(Fg)} − 15| ÷ 15 × 100 = <b>${f2(e2)} %</b>`, true)
    ].join('');
    $('ex-res').innerHTML = `<thead><tr><th>Result</th><th>Value</th></tr></thead><tbody>
      <tr><td>Theoretical focal length (labelled)</td><td>f = 15 cm</td></tr>
      <tr><td>Experimental focal length (mean of the table)</td><td>F = ${f2(mF)} cm</td></tr>
      <tr><td>Graphical focal length (from the intercepts)</td><td>F = ${f2(Fg)} cm</td></tr>
      <tr><td>Power of the lens</td><td>P = +${f2(Pw)} D</td></tr>
      <tr><td>Percentage error: table · graph</td><td>${f2(e1)} % · ${f2(e2)} %</td></tr>
      <tr><td>Distance-object method</td><td>F ≈ ${f1(LENS.EX_ROUGH)} cm, 2F ≈ ${f1(2 * LENS.EX_ROUGH)} cm</td></tr></tbody>`;
    L.EXRES = { mF, a: F.xi, b: F.yi, mi, Fg, P: Pw, e1, e2 };
  })();

  L.mcq($('mcq-list'), L.MCQ, $('mcq-score'), $('mcq-reset'));
  void NUM; void F_CAP;
})(window.SOL);
