/* The practical: distance-object reading, u–v readings, the observation table, the 1/v–1/u graph, the calculation and the tutorial */
(function (L) {
  'use strict';
  const { el, txt, tsub, $, clamp, parseNum, near, C, F_BODY, F_CAP, LENS, tut, NUM, setWork, tween, ease } = L;
  const B = L.BENCH, DS = L.DIST;
  const guard = f => (...a) => { if (!tut.on) f(...a); };
  const GROUPS = [
    { k: 'lt', n: 3, nm: 'u < 2F', sub: 'magnified' },
    { k: 'eq', n: 1, nm: 'u = 2F', sub: 'same size' },
    { k: 'gt', n: 3, nm: 'u > 2F', sub: 'diminished' }
  ];
  const GN = { lt: 'u < 2F (magnified)', eq: 'u = 2F (same size)', gt: 'u > 2F (diminished)' };
  const st = { rows: { lt: [], eq: [], gt: [] }, order: [], gN: null, h: null, rough: null };
  const DEF_H = () => [{ x: 0.02, y: 0.055 }, { x: 0.055, y: 0.02 }];
  const f4 = v => v.toFixed(4), f2 = v => v.toFixed(2), f1 = v => v.toFixed(1);
  const allRows = () => GROUPS.flatMap(g => st.rows[g.k].map((r, i) => Object.assign({ g: g.k, i }, r)));
  const nRows = () => st.order.length;

  /* ---------- part 1: distance object ---------- */
  const dmsg = $('dist-recmsg');
  const dsay = (t, c) => { dmsg.className = 'rec-msg' + (c ? ' ' + c : ''); dmsg.innerHTML = t; };
  document.querySelectorAll('#dist-ctl .nudge-btns button').forEach(b => b.addEventListener('click', guard(() => DS.move(DS.st.s + +b.dataset.d))));
  function markF() {
    if (!DS.st.sharp) { dsay('The image of the window is not sharp yet. Slide the card until the window bars and the tree look crisp, then read the rule.', 'warn'); return false; }
    const F = DS.read(); st.rough = F; LENS.setRough(F);
    $('dist-F').textContent = f1(F); $('dist-2F').textContent = f1(2 * F);
    dsay(`F ≈ ${f1(F)} cm and 2F ≈ ${f1(2 * F)} cm. Arrow marks on the bench now show F and 2F on both sides of the lens: the lamp goes beyond 2F for the diminished readings.`, 'ok');
    updResult(); return true;
  }
  $('dist-mark').addEventListener('click', guard(markF));

  /* ---------- part 2: bench controls ---------- */
  document.querySelectorAll('#lens-ctl .nudge-btns').forEach(g => g.querySelectorAll('button').forEach(b => b.addEventListener('click', guard(() => { const k = g.dataset.k; B.move(k, B.st[k] + +b.dataset.d); B.setFocus(k); }))));
  const raysBtn = $('lens-rays');
  raysBtn.addEventListener('click', guard(() => { B.setRays(!B.st.rays); raysBtn.setAttribute('aria-pressed', B.st.rays ? 'true' : 'false'); }));

  /* ---------- readings ---------- */
  const inU = $('lens-u'), inV = $('lens-v'), rmsg = $('lens-recmsg'), rout = $('lens-readout');
  const rsay = (t, c) => { rmsg.className = 'rec-msg' + (c ? ' ' + c : ''); rmsg.innerHTML = t; };
  function readScale() {
    const r = B.read(), u = +(r.lens - r.lamp).toFixed(1), v = +(r.screen - r.lens).toFixed(1), o = B.optics();
    inU.value = f1(u); inV.value = f1(v);
    rout.innerHTML = `Lamp <b>${f1(r.lamp)}</b> · lens <b>${f1(r.lens)}</b> · screen <b>${f1(r.screen)}</b> cm → u = ${f1(r.lens)} − ${f1(r.lamp)} = <b>${f1(u)} cm</b>, v = ${f1(r.screen)} − ${f1(r.lens)} = <b>${f1(v)} cm</b>${o.sharp ? '' : ' <span class="warn-t">(the image is not sharp yet)</span>'}`;
    return { u, v };
  }
  $('lens-read').addEventListener('click', guard(readScale));
  function record(partial) {
    const u = parseNum(inU.value), v = parseNum(inV.value), rawU = inU.value.trim(), rawV = inV.value.trim();
    if (!rawU || !rawV || !isFinite(u) || !isFinite(v)) { rsay('Enter u and v in cm, or use Read the scale.', 'warn'); return false; }
    if (/^[−-]/.test(rawU) || /^[−-]/.test(rawV)) { rsay('With real-is-positive, a real object and a real image both have positive distances: drop the minus sign.', 'warn'); return false; }
    const o = B.optics(), r = B.read(), U = +(r.lens - r.lamp).toFixed(1), V = +(r.screen - r.lens).toFixed(1);
    if (!o.real) { rsay('There is no real image with the lamp at or inside F, so there is nothing to measure on the screen. Move the lamp further from the lens than F.', 'warn'); return false; }
    if (!o.sharp) { rsay('The image on the screen is not sharp yet. Slide the screen until the sharpness ladder turns red and the F looks crisp, then read the scale.', 'warn'); return false; }
    if (Math.abs(u - V) <= .15 && Math.abs(v - U) <= .15 && Math.abs(U - V) > .3) { rsay('u and v are swapped: u runs from the lens to the object (the lamp house), v from the lens to the screen.', 'warn'); return false; }
    if ((Math.abs(u - r.lamp) <= .05 && Math.abs(U - r.lamp) > .3) || (Math.abs(v - r.screen) <= .05 && Math.abs(V - r.screen) > .3)) { rsay('That is a scale position, not a distance. The lens is at 55.0 cm: u = lens − lamp and v = screen − lens.', 'warn'); return false; }
    if (Math.abs(u - U) > .15 || Math.abs(v - V) > .15) { rsay('These do not match the riders. Read the three indexes through the loupe again: u = lens − lamp, v = screen − lens.', 'warn'); return false; }
    const g = LENS.group(u, v), G = GROUPS.find(q => q.k === g);
    if (st.rows[g].length >= G.n) { rsay(`The ${GN[g]} group already has ${G.n === 1 ? 'its reading' : 'three readings'}. Move the lamp to another region: ${g === 'gt' ? 'between F and 2F, or to 2F' : g === 'lt' ? 'beyond 2F, or to 2F' : 'beyond 2F, or between F and 2F'}.`, 'warn'); return false; }
    if (allRows().some(q => Math.abs(q.u - u) < .5)) { rsay(`A reading at u ≈ ${f1(u)} cm is already in the table. Move the lamp at least 1 cm for a new reading.`, 'warn'); return false; }
    st.rows[g].push({ u, v }); st.order.push(g);
    const i = st.rows[g].length - 1, R = LENS.row(u, v);
    renderTable({ g, i }, partial);
    rsay(`Recorded in the ${GN[g]} group: 1/F = 1/${f1(u)} + 1/${f1(v)} = ${f4(R.iu)} + ${f4(R.iv)} = ${f4(R.iF)} cm⁻¹, so F = ${f2(R.F)} cm.`, 'ok');
    return true;
  }
  function undo() { if (!st.order.length) return; const g = st.order.pop(); st.rows[g].pop(); renderTable(); rsay('Last reading deleted.'); }
  $('lens-record').addEventListener('click', guard(() => record()));
  $('lens-undo').addEventListener('click', guard(undo));

  /* ---------- observation table ---------- */
  const table = $('lens-table');
  const COLS = ['u', 'v', 'iu', 'iv', 'iF', 'F'];
  const Fs = () => allRows().map(r => +f2(LENS.row(r.u, r.v).F));
  const meanF = () => { const a = Fs(); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN; };
  function cell(g, i, c) { return table.querySelector(`tr[data-g="${g}"][data-i="${i}"] td[data-c="${c}"]`); }
  function renderTable(fresh, cols) {
    let h = '<thead><tr><th>Position</th><th><i>U</i><span class="u">cm</span></th><th><i>V</i><span class="u">cm</span></th><th>1/<i>U</i><span class="u">cm⁻¹</span></th><th>1/<i>V</i><span class="u">cm⁻¹</span></th><th><span class="fx">1/<i>F</i> = 1/<i>U</i> + 1/<i>V</i></span><span class="u">cm⁻¹</span></th><th><i>F</i><span class="u">cm</span></th></tr></thead><tbody>';
    GROUPS.forEach(G => {
      for (let i = 0; i < G.n; i++) {
        const r = st.rows[G.k][i], isF = fresh && fresh.g === G.k && fresh.i === i, R = r ? LENS.row(r.u, r.v) : null;
        const vals = R ? [f1(r.u), f1(r.v), f4(R.iu), f4(R.iv), f4(R.iF), f2(R.F)] : null;
        h += `<tr data-g="${G.k}" data-i="${i}" class="${i === 0 ? 'gstart' : ''}${isF && cols == null ? ' fresh' : ''}">`;
        if (i === 0) h += `<td class="grp" rowspan="${G.n}">${G.nm}<small>${G.sub}</small></td>`;
        COLS.forEach((c, k) => {
          const show = vals && !(isF && cols != null && k >= cols);
          h += `<td data-c="${c}" class="${k >= 2 && k < 5 ? 'calc-c' : k === 5 ? 'f-c' : ''}${show ? '' : ' empty'}">${show ? vals[k] : ''}</td>`;
        });
        h += '</tr>';
      }
    });
    const m = meanF(), showM = nRows() && !(fresh && cols != null);
    h += `</tbody><tfoot><tr><td class="lbl" colspan="6">Mean (<i>F</i>)</td><td id="lens-meanF">${showM ? f2(m) : '—'}</td></tr></tfoot>`;
    table.innerHTML = h;
    drawGraph(); workFex();
  }

  /* ---------- graph: 1/v against 1/u, a line with two handles, extended to both axes ---------- */
  const gsvg = $('lens-graph');
  const Pl = L.makePlot(gsvg, { W: 640, H: 560, ml: 84, mr: 30, mt: 52, mb: 66, xmax: 0.08, ymax: 0.08, xstep: 0.01, ystep: 0.01, xdec: 2, ydec: 2, xlabel: ['1/', { i: 'u' }, ' (cm⁻¹)'], ylabel: ['1/', { i: 'v' }, ' (cm⁻¹)'] });
  const lineG = el('g', null, Pl.g), ptsG = el('g', null, Pl.g), mkG = el('g', null, Pl.g), hG = el('g', null, Pl.g);
  const ext = el('path', { d: '', fill: 'none', stroke: C.acc, 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }, lineG);
  const seg = el('path', { d: '', fill: 'none', stroke: C.acc, 'stroke-width': 2.6 }, lineG);
  const aMark = el('g', { class: 'g-mark' }, mkG), bMark = el('g', { class: 'g-mark' }, mkG);
  el('path', { d: 'M0 -9 L7 0 L0 9 L-7 0 Z', fill: C.sec, stroke: 'var(--card)', 'stroke-width': 1.5 }, aMark); const aT = txt(aMark, 0, -16, 'a', { 'text-anchor': 'middle', 'font-size': 16, 'font-style': 'italic', 'font-weight': 700, fill: C.sec, 'font-family': F_BODY });
  el('path', { d: 'M0 -9 L7 0 L0 9 L-7 0 Z', fill: C.sec, stroke: 'var(--card)', 'stroke-width': 1.5 }, bMark); txt(bMark, 16, 5, 'b', { 'font-size': 16, 'font-style': 'italic', 'font-weight': 700, fill: C.sec, 'font-family': F_BODY });
  void aT;
  const handles = [0, 1].map(k => {
    const g = el('g', { class: 'g-h drag', tabindex: 0, role: 'slider', 'aria-label': `Line handle ${k + 1}. Arrow keys move it.` }, hG);
    el('circle', { r: 16, fill: 'transparent' }, g);
    el('circle', { r: 8.5, fill: 'var(--card)', stroke: C.acc, 'stroke-width': 2.6 }, g);
    el('circle', { r: 2.4, fill: C.acc }, g);
    return g;
  });
  const gread = $('lens-gread');
  const lineOf = () => {
    const [p, q] = st.h; if (Math.abs(q.x - p.x) < 1e-6) return null;
    const m = (q.y - p.y) / (q.x - p.x), b = p.y - m * p.x;
    if (!(m < -1e-6) || b <= 0) return { m, b, ok: false };
    return { m, b, a: -b / m, ok: true };
  };
  const shownPts = () => { const r = allRows().map(q => ({ x: 1 / q.u, y: 1 / q.v, g: q.g, i: q.i })); return st.gN == null ? r : r.slice(0, st.gN); };
  function ptsOrder() { /* in the order the readings were taken */
    const seen = { lt: 0, eq: 0, gt: 0 }; return st.order.map(g => { const i = seen[g]++; const r = st.rows[g][i]; return { x: 1 / r.u, y: 1 / r.v, g, i }; });
  }
  function drawGraph() {
    ptsG.innerHTML = '';
    const pts = st.gN == null ? ptsOrder() : ptsOrder().slice(0, st.gN);
    pts.forEach(p => el('circle', { cx: Pl.X(p.x), cy: Pl.Y(p.y), r: 5.4, fill: 'var(--plot)', stroke: C.ink, 'stroke-width': 2.2, 'data-g': p.g, 'data-i': p.i, class: 'g-pt' }, ptsG));
    const Lr = lineOf(), [p, q] = st.h;
    handles.forEach((h, k) => h.setAttribute('transform', `translate(${Pl.X(st.h[k].x).toFixed(1)} ${Pl.Y(st.h[k].y).toFixed(1)})`));
    seg.setAttribute('d', `M${Pl.X(p.x)} ${Pl.Y(p.y)} L${Pl.X(q.x)} ${Pl.Y(q.y)}`);
    if (Lr && Lr.ok && Lr.a <= 0.08 && Lr.b <= 0.08) {
      ext.setAttribute('d', `M${Pl.X(0)} ${Pl.Y(Lr.b)} L${Pl.X(Lr.a)} ${Pl.Y(0)}`);
      aMark.setAttribute('transform', `translate(${Pl.X(Lr.a)} ${Pl.Y(0)})`); bMark.setAttribute('transform', `translate(${Pl.X(0)} ${Pl.Y(Lr.b)})`);
      aMark.style.display = bMark.style.display = '';
            gread.innerHTML = `<div><span>Intercept on 1/<i>u</i> axis, <i>a</i></span><b id="g-a">${f4(Lr.a)}</b> cm⁻¹</div><div><span>Intercept on 1/<i>v</i> axis, <i>b</i></span><b id="g-b">${f4(Lr.b)}</b> cm⁻¹</div><div><span>Mean (<i>a</i> + <i>b</i>) ÷ 2</span><b id="g-mi">${(+f4(Lr.a) / 2 + +f4(Lr.b) / 2).toFixed(5)}</b> cm⁻¹</div><div><span><i>F</i><sub>graph</sub> = 1 ÷ mean</span><b id="g-F">${f2(1 / +((+f4(Lr.a) + +f4(Lr.b)) / 2).toFixed(5))}</b> cm</div>`;
    } else {
      ext.setAttribute('d', ''); aMark.style.display = bMark.style.display = 'none';
      gread.innerHTML = '<div class="g-none">The line must slope downwards and cut both axes inside the graph.</div>';
    }
  }
  function setH(k, x, y) { st.h[k] = { x: clamp(x, 0.002, 0.078), y: clamp(y, 0.002, 0.078) }; drawGraph(); }
  let hd = null;
  handles.forEach((h, k) => {
    h.addEventListener('pointerdown', e => { if (tut.on) return; e.preventDefault(); hd = { k, id: e.pointerId }; try { gsvg.setPointerCapture(e.pointerId); } catch (_) { /* no capture */ } h.classList.add('grab'); });
    h.addEventListener('keydown', e => {
      if (tut.on) return; const s = e.shiftKey ? 0.002 : 0.0005, d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] }[e.key];
      if (!d) return; e.preventDefault(); setH(k, st.h[k].x + d[0], st.h[k].y + d[1]);
    });
  });
  gsvg.addEventListener('pointermove', e => { if (!hd || hd.id !== e.pointerId) return; const p = L.svgPoint(gsvg, e); setH(hd.k, Pl.ix(p.x), Pl.iy(p.y)); });
  const hEnd = e => { if (hd && hd.id === e.pointerId) { handles[hd.k].classList.remove('grab'); hd = null; } };
  gsvg.addEventListener('pointerup', hEnd); gsvg.addEventListener('pointercancel', hEnd);
  $('lens-gline').addEventListener('click', guard(() => { st.h = DEF_H(); drawGraph(); }));
  const fitNow = () => LENS.fit(ptsOrder());
  function rmsOf(Lr) { const p = ptsOrder(); if (!p.length || !Lr) return Infinity; return Math.sqrt(p.reduce((s, q) => s + Math.pow(q.y - (Lr.b + Lr.m * q.x), 2), 0) / p.length); }

  /* ---------- calculation ---------- */
  const KEYS = ['fth', 'fex', 'a', 'b', 'mi', 'fg', 'fm', 'P', 'e1', 'e2'];
  const IN = {}; KEYS.forEach(k => { IN[k] = $('in-' + k); });
  const wk = k => $('w-' + k), chk = $('lens-chk'), res = $('lens-result');
  const val = k => parseNum(IN[k].value), str = k => IN[k].value.trim();
  const ok = k => isFinite(val(k)) && str(k) !== '';
  function workFex() {
    const rows = allRows();
    setWork(wk('fex'), rows.length ? `= (${rows.map(r => NUM(`F-${r.g}-${r.i}`, f2(LENS.row(r.u, r.v).F))).join(' + ')}) ÷ ${NUM('nF', rows.length)} = ${NUM('r-fex', f2(meanF()))}` : '');
  }
  function workAll() {
    setWork(wk('mi'), ok('a') && ok('b') ? `= (${NUM('av', str('a'))} + ${NUM('bv', str('b'))}) ÷ 2 = ${NUM('r-mi', ((val('a') + val('b')) / 2).toFixed(5))}` : '');
    setWork(wk('fg'), ok('mi') && val('mi') ? `= 1 ÷ ${NUM('miv', str('mi'))} = ${NUM('r-fg', f2(1 / val('mi')))}` : '');
    setWork(wk('fm'), ok('fex') ? `= ${NUM('fexv', str('fex'))} ÷ 100 = ${NUM('r-fm', (val('fex') / 100).toFixed(4))}` : '');
    setWork(wk('P'), ok('fm') && val('fm') ? `= 1 ÷ ${NUM('fmv', str('fm'))} = ${NUM('r-P', f2(1 / val('fm')))}` : '');
    setWork(wk('e1'), ok('fex') && ok('fth') && val('fth') ? `= |${NUM('e1f', str('fex'))} − ${NUM('e1t', str('fth'))}| ÷ ${NUM('e1t2', str('fth'))} × 100 = ${NUM('r-e1', f2(Math.abs(val('fex') - val('fth')) / val('fth') * 100))}` : '');
    setWork(wk('e2'), ok('fg') && ok('fth') && val('fth') ? `= |${NUM('e2g', str('fg'))} − ${NUM('e2t', str('fth'))}| ÷ ${NUM('e2t2', str('fth'))} × 100 = ${NUM('r-e2', f2(Math.abs(val('fg') - val('fth')) / val('fth') * 100))}` : '');
  }
  Object.values(IN).forEach(i => i.addEventListener('input', () => { i.classList.remove('flag', 'okf'); workAll(); }));
  const rel = (a, b, t) => isFinite(a) && isFinite(b) && Math.abs(a - b) <= t * Math.max(Math.abs(b), 1e-9);
  function check() {
    const v = {}; KEYS.forEach(k => { v[k] = val(k); }); const notes = [];
    Object.values(IN).forEach(i => i.classList.remove('flag', 'okf'));
    const n = nRows();
    if (n < 3) { chk.className = 'check-msg nudge'; chk.innerHTML = 'Record at least three readings first (ideally all seven: three with u > 2F, one at u = 2F, three with u < 2F). A line through fewer than three points says little about the scatter.'; res.hidden = true; return false; }
    const flag = (k, t) => { IN[k].classList.add('flag'); notes.push(t); }, good = k => IN[k].classList.add('okf');
    if (KEYS.some(k => /^[−-]/.test(str(k)))) notes.push('Sign slip: with real-is-positive the distances, the intercepts, F and the power of a convex lens are all positive.');
    const av = k => Math.abs(v[k]);
    /* 1 · labelled value */
    if (near(av('fth'), LENS.label, .001)) good('fth'); else if (near(av('fth'), LENS.label / 100, .001)) flag('fth', 'The table works in cm: the labelled focal length is 15 cm (0.15 m is used later, for the power).'); else flag('fth', 'The theoretical value is the focal length printed on the lens holder: f = 15 cm.');
    /* 2 · mean of the F column */
    const mF = meanF();
    if (Math.abs(av('fex') - mF) <= .015) good('fex');
    else if (rel(av('fex'), mF * n, .002)) flag('fex', `That is the sum of the F column. Divide it by the number of readings, ${n}.`);
    else if (rel(av('fex'), 1 / mF, .02) || rel(av('fex'), allRows().reduce((s, r) => s + LENS.row(r.u, r.v).iF, 0) / n, .02)) flag('fex', 'That is a value of 1/F in cm⁻¹. The reciprocal is still to be taken: F = 1 ÷ (1/F), about 15 cm.');
    else flag('fex', 'Mean (F) is the average of the F column of the table.');
    /* 3, 4 · intercepts of the drawn line */
    const Lr = lineOf();
    if (!Lr || !Lr.ok) { flag('a', 'Draw the line first: it must slope downwards and cut both axes.'); IN.b.classList.add('flag'); }
    else {
      const ta = .0006;
      const aOK = Math.abs(av('a') - Lr.a) <= ta, bOK = Math.abs(av('b') - Lr.b) <= ta;
      const swap = !aOK && !bOK && Math.abs(av('a') - Lr.b) <= ta && Math.abs(av('b') - Lr.a) <= ta;
      if (swap) { flag('a', 'a and b are swapped: a is where the line cuts the horizontal 1/u axis, b where it cuts the vertical 1/v axis.'); IN.b.classList.add('flag'); }
      else {
        if (aOK) good('a'); else if (rel(av('a'), 1 / Lr.a, .03)) flag('a', 'That is 1 ÷ intercept. The intercept itself is read on the 1/u axis, in cm⁻¹ (about 0.07).'); else flag('a', `a is read where the dashed extension of the line meets the 1/u axis (the graph shows ${f4(Lr.a)} cm⁻¹).`);
        if (bOK) good('b'); else if (rel(av('b'), 1 / Lr.b, .03)) flag('b', 'That is 1 ÷ intercept. The intercept itself is read on the 1/v axis, in cm⁻¹.'); else if (aOK && !str('b')) flag('b', 'Both intercepts estimate 1/F: read b on the 1/v axis as well, not a alone.'); else flag('b', `b is read where the line meets the 1/v axis (the graph shows ${f4(Lr.b)} cm⁻¹).`);
      }
      if (rmsOf(Lr) > .002) notes.push('The line is not a best fit yet: move the handles until it runs through the middle of the points, with about as many above as below.');
    }
    /* 5 · mean intercept */
    const mi = (av('a') + av('b')) / 2;
    if (Math.abs(av('mi') - mi) <= .00006) good('mi');
    else if (rel(av('mi'), av('a') + av('b'), .003)) flag('mi', 'That is a + b. The mean intercept is (a + b) ÷ 2.');
    else if ((rel(av('mi'), av('a'), .0005) || rel(av('mi'), av('b'), .0005)) && Math.abs(av('a') - av('b')) > .00005) flag('mi', 'That uses one intercept only. Both a and b estimate 1/F; their mean, (a + b) ÷ 2, uses the whole line.');
    else flag('mi', 'Mean intercept = (a + b) ÷ 2, with the two intercepts above.');
    /* 6 · graphical F */
    const fg = av('mi') ? 1 / av('mi') : NaN;
    if (rel(av('fg'), fg, .002)) good('fg');
    else if (rel(av('fg'), av('mi'), .01)) flag('fg', 'The mean intercept is 1/F in cm⁻¹. Take the reciprocal: F = 1 ÷ mean intercept.');
    else if ((rel(av('fg'), 1 / av('a'), .002) || rel(av('fg'), 1 / av('b'), .002)) && Math.abs(av('a') - av('b')) > .00005) flag('fg', 'That is 1 ÷ one intercept. F<sub>graph</sub> = 1 ÷ mean intercept.');
    else if (rel(av('fg'), 2 / av('mi'), .01)) flag('fg', 'F<sub>graph</sub> = 1 ÷ mean intercept, not 2 ÷ it.');
    else flag('fg', 'F<sub>graph</sub> = 1 ÷ (mean intercept).');
    /* 7 · f in metres */
    if (Math.abs(av('fm') - av('fex') / 100) <= .00051) good('fm');
    else if (rel(av('fm'), av('fex'), .002)) flag('fm', 'f is still in cm. For the power it goes into metres: f ÷ 100.');
    else if (rel(av('fm'), av('fex') / 1000, .01)) flag('fm', 'That divides by 1000 (mm to m). From cm to m divide by 100.');
    else flag('fm', 'f in metres = Mean (F) in cm ÷ 100.');
    /* 8 · power */
    const P = av('fm') ? 1 / av('fm') : NaN;
    if (rel(av('P'), P, .004)) good('P');
    else if (rel(av('P'), 1 / av('fex'), .01)) flag('P', 'That uses f in cm, so it is a hundred times too small. P = 1 ÷ f with f in metres: 1 ÷ 0.15 ≈ 6.67 D.');
    else if (rel(av('P'), 100 / av('fm'), .01) && av('fm') < 1) flag('P', 'That is a hundred times too large: f is already in metres, so P = 1 ÷ f.');
    else if (rel(av('P'), av('fm'), .01)) flag('P', 'The power is the reciprocal of f, not f itself: P = 1 ÷ f.');
    else flag('P', 'P = 1 ÷ f, with f in metres, in dioptres (D).');
    /* 9, 10 · percentage errors */
    [['e1', 'fex'], ['e2', 'fg']].forEach(([k, s]) => {
      const pe = av('fth') ? Math.abs(av(s) - av('fth')) / av('fth') * 100 : NaN;
      if (isFinite(pe) && Math.abs(av(k) - pe) <= .06) good(k);
      else if (isFinite(pe) && Math.abs(av(k) - pe / 100) <= .0006 && pe > .05) flag(k, 'That is the fraction. Multiply by 100 for a percentage.');
      else flag(k, `% error = |${s === 'fex' ? 'F<sub>exp</sub>' : 'F<sub>graph</sub>'} − f<sub>th</sub>| ÷ f<sub>th</sub> × 100, with the values above.`);
    });
    if (!notes.length) {
      chk.className = 'check-msg ok'; chk.innerHTML = 'All values check out. The table and the graph agree with the labelled focal length within a fraction of a centimetre, and the power follows from f in metres.';
      res.hidden = false; updResult(); return true;
    }
    chk.className = 'check-msg nudge'; chk.innerHTML = 'Not yet:<ul>' + notes.map(t => `<li>${t}</li>`).join('') + '</ul>'; res.hidden = true;
    return false;
  }
  function updResult() {
    if (res.hidden) return;
    res.innerHTML = `<h3>Result</h3><table class="res-t"><thead><tr><th>Quantity</th><th>Value</th></tr></thead><tbody>
      <tr><td>Theoretical focal length (labelled)</td><td><i>f</i> = ${NUM('resT', str('fth'))} cm</td></tr>
      <tr><td>Experimental focal length (mean of the table)</td><td><i>F</i> = ${NUM('resE', str('fex'))} cm</td></tr>
      <tr><td>Graphical focal length (from the intercepts)</td><td><i>F</i> = ${NUM('resG', str('fg'))} cm</td></tr>
      <tr><td>Power of the lens</td><td><i>P</i> = +${NUM('resP', str('P').replace(/^\+/, ''))} D</td></tr>
      <tr><td>Percentage error: table · graph</td><td>${NUM('resE1', str('e1'))} % · ${NUM('resE2', str('e2'))} %</td></tr>
      ${st.rough != null ? `<tr><td>Distance-object method</td><td><i>F</i> ≈ ${NUM('resR', f1(st.rough))} cm, 2<i>F</i> ≈ ${NUM('resR2', f1(2 * st.rough))} cm</td></tr>` : ''}
    </tbody></table>`;
  }
  $('lens-check').addEventListener('click', guard(check));

  /* ---------- traceable calculation ---------- */
  const calc = $('lens-calc');
  const lSym = (row, k) => document.querySelector(`#cr-${row} label .sym[data-sym="${k}"]`);
  const wNum = (k, ref) => wk(k) && wk(k).querySelector(`.num[data-ref="${ref}"]`);
  const firstF = () => { const r = allRows()[0]; return r ? cell(r.g, r.i, 'F') : null; };
  const rNum = k => res.querySelector(`.num[data-ref="${k}"]`);
  function INFO(k) {
    const m = /^F-(lt|eq|gt)-(\d)$/.exec(k);
    if (m) { const r = st.rows[m[1]][+m[2]]; if (!r) return null; const R = LENS.row(r.u, r.v); return { title: '', nm: `F for u = ${f1(r.u)} cm, v = ${f1(r.v)} cm`, where: `1 ÷ (1/U + 1/V) = 1 ÷ ${f4(R.iF)}. Table, ${GN[m[1]]} group, F column.`, src: () => cell(m[1], +m[2], 'F') }; }
    switch (k) {
      case 'fth': return { title: '<i>f</i><sub>th</sub>: the labelled focal length, in cm', nm: 'f<sub>th</sub>', where: 'Printed on the lens holder on the bench: f = 15 cm.', src: () => B.lensTag };
      case 'fthq': case 'fthq2': case 'e1t': case 'e1t2': case 'e2t': case 'e2t2': return { title: '<i>f</i><sub>th</sub> from line 1', nm: 'theoretical f in cm', where: 'From the answer box of line 1.', src: () => IN.fth };
      case 'fex': return { title: 'Mean (<i>F</i>): experimental focal length, in cm', nm: 'Mean (F)', where: 'The average of the F column of the table. Worked out in the line below.', src: () => wNum('fex', 'r-fex') || IN.fex };
      case 'Fcol': return { title: 'The <i>F</i> column', nm: 'F values', where: 'Each row of the table: F = 1 ÷ (1/U + 1/V). Table, last column.', src: firstF };
      case 'nF': return { title: '', nm: 'the number of readings', where: 'How many rows of the table are filled.', src: () => table.querySelector('tbody') };
      case 'r-fex': return { title: '', nm: 'Mean (F) in cm', where: 'The result of this line. It goes into the answer box, into f in metres (line 7) and the % error (line 9).', src: () => wNum('fm', 'fexv') || lSym('fm', 'fexp') };
      case 'fexp': case 'fexv': case 'fexq': case 'e1f': return { title: 'Mean (<i>F</i>) from line 2', nm: 'experimental F in cm', where: 'From the answer box of line 2.', src: () => IN.fex };
      case 'a': return { title: '<i>a</i>: intercept on the 1/<i>u</i> axis, in cm⁻¹', nm: 'a', where: 'Where the extended line cuts the horizontal axis (1/v = 0). Graph, left marker on the 1/u axis.', src: () => aMark };
      case 'b': return { title: '<i>b</i>: intercept on the 1/<i>v</i> axis, in cm⁻¹', nm: 'b', where: 'Where the extended line cuts the vertical axis (1/u = 0). Graph, marker on the 1/v axis.', src: () => bMark };
      case 'ap': case 'av': return { title: '<i>a</i> from line 3', nm: 'a in cm⁻¹', where: 'From the answer box of line 3.', src: () => IN.a };
      case 'bp': case 'bv': return { title: '<i>b</i> from line 4', nm: 'b in cm⁻¹', where: 'From the answer box of line 4.', src: () => IN.b };
      case 'mi': return { title: 'Mean intercept = 1/<i>F</i>, in cm⁻¹', nm: 'mean intercept', where: 'Both intercepts estimate 1/F, so their mean is the best value from the line.', src: () => wNum('mi', 'r-mi') || IN.mi };
      case 'r-mi': return { title: '', nm: 'mean intercept in cm⁻¹', where: 'The result of this line. It goes into the answer box and is inverted in line 6.', src: () => wNum('fg', 'miv') || lSym('fg', 'mip') };
      case 'mip': case 'miv': return { title: 'Mean intercept from line 5', nm: '1/F in cm⁻¹', where: 'From the answer box of line 5.', src: () => IN.mi };
      case 'fg': return { title: '<i>F</i><sub>graph</sub>: focal length from the graph, in cm', nm: 'F<sub>graph</sub>', where: 'The reciprocal of the mean intercept.', src: () => wNum('fg', 'r-fg') || IN.fg };
      case 'r-fg': return { title: '', nm: 'F<sub>graph</sub> in cm', where: 'The result of this line. It goes into the answer box, the % error (line 10) and the Result.', src: () => wNum('e2', 'e2g') || lSym('e2', 'fgq') };
      case 'fgq': case 'e2g': return { title: '<i>F</i><sub>graph</sub> from line 6', nm: 'graphical F in cm', where: 'From the answer box of line 6.', src: () => IN.fg };
      case 'fm': return { title: '<i>f</i> in metres', nm: 'f in m', where: 'Mean (F) in cm divided by 100, because the dioptre is defined with f in metres.', src: () => wNum('fm', 'r-fm') || IN.fm };
      case 'r-fm': return { title: '', nm: 'f in m', where: 'The result of this line. It goes into the answer box and into the power, line 8.', src: () => wNum('P', 'fmv') || lSym('P', 'fmp') };
      case 'fmp': case 'fmv': return { title: '<i>f</i> in metres from line 7', nm: 'f in m', where: 'From the answer box of line 7.', src: () => IN.fm };
      case 'P': return { title: '<i>P</i>: power of the lens, in dioptres', nm: 'P', where: 'The reciprocal of the focal length in metres; positive for a converging lens.', src: () => wNum('P', 'r-P') || IN.P };
      case 'r-P': return { title: '', nm: 'P in dioptres', where: 'The result of this line. It goes into the answer box and the Result.', src: () => rNum('resP') || (str('P') ? IN.P : null) };
      case 'e1': return { title: 'Percentage error of the table value', nm: '% error', where: 'How far Mean (F) is from the labelled value, as a percentage of it.', src: () => wNum('e1', 'r-e1') || IN.e1 };
      case 'e2': return { title: 'Percentage error of the graph value', nm: '% error', where: 'How far F<sub>graph</sub> is from the labelled value, as a percentage of it.', src: () => wNum('e2', 'r-e2') || IN.e2 };
      case 'r-e1': return { title: '', nm: '% error of the table value', where: 'The result of this line. It goes into the answer box and the Result.', src: () => rNum('resE1') || (str('e1') ? IN.e1 : null) };
      case 'r-e2': return { title: '', nm: '% error of the graph value', where: 'The result of this line. It goes into the answer box and the Result.', src: () => rNum('resE2') || (str('e2') ? IN.e2 : null) };
      case 'resT': return { title: '', nm: 'theoretical f in cm', where: 'From line 1, the label on the lens holder.', src: () => IN.fth };
      case 'resE': return { title: '', nm: 'experimental F in cm', where: 'From line 2, the mean of the table.', src: () => IN.fex };
      case 'resG': return { title: '', nm: 'graphical F in cm', where: 'From line 6, the reciprocal of the mean intercept.', src: () => IN.fg };
      case 'resP': return { title: '', nm: 'power in dioptres', where: 'From line 8, P = 1 ÷ f with f in metres.', src: () => IN.P };
      case 'resE1': return { title: '', nm: '% error of the table value', where: 'From line 9.', src: () => IN.e1 };
      case 'resE2': return { title: '', nm: '% error of the graph value', where: 'From line 10.', src: () => IN.e2 };
      case 'resR': return { title: '', nm: 'rough F in cm', where: 'Part 1: the lens-to-card distance with a distant window sharp on the card.', src: () => $('dist-F') };
      case 'resR2': return { title: '', nm: '2F in cm', where: 'Part 1: twice the rough focal length.', src: () => $('dist-2F') };
    }
    return null;
  }
  L.registerTrace(calc, INFO);

  /* ---------- start over ---------- */
  function reset() {
    B.reset(); DS.reset(); LENS.setRough(null); raysBtn.setAttribute('aria-pressed', 'false');
    st.rows = { lt: [], eq: [], gt: [] }; st.order = []; st.gN = null; st.h = DEF_H(); st.rough = null;
    $('dist-F').textContent = '—'; $('dist-2F').textContent = '—'; dsay(''); rsay(''); rout.innerHTML = '';
    inU.value = ''; inV.value = '';
    Object.values(IN).forEach(i => { i.value = ''; i.classList.remove('flag', 'okf'); });
    L.traceHide(); workAll(); chk.className = 'check-msg'; chk.innerHTML = ''; res.hidden = true; res.innerHTML = '';
    renderTable();
  }
  $('lens-reset').addEventListener('click', guard(reset));
  L.onLeave['lens-practical'] = () => L.tutStop();

  /* ---------- tutorial ---------- */
  const SB = b => ({ svg: B.svg, box: b }), SD = b => ({ svg: DS.svg, box: b });
  const rig = $('lens-frame'), drig = $('dist-frame');
  const moveT = (which, to, ms) => { const from = B.st[which]; return tween(ms, k => B.move(which, from + (to - from) * ease(k))); };
  async function slideScreen(Tt, v, ms) {
    /* in from beyond the image, past the sharp point, then back to the middle of the sharp range */
    const vt = LENS.image(55 - B.st.lamp), far = Math.min(118, 55 + vt + Math.max(5, vt * .22)), near_ = 55 + vt - Math.max(2.5, vt * .1);
    await moveT('screen', far, ms * .3);
    await moveT('screen', near_, ms * .45);
    await moveT('screen', 55 + v, ms * .25);
  }
  async function fillRow(Tt, g, i, full) {
    const r = st.rows[g][i], R = LENS.row(r.u, r.v), hold = full ? null : 1900;
    const steps = [
      ['U', `u = ${f1(r.u)} cm goes into the U column of the ${GN[g]} group.`, `U = ${f1(r.u)} cm`],
      ['V', `v = ${f1(r.v)} cm goes into the V column.`, `V = ${f1(r.v)} cm`],
      ['1/U', full ? `The reciprocal of u, in cm⁻¹: 1 ÷ ${f1(r.u)} = ${f4(R.iu)}. Four decimal places keep three significant figures.` : `1 ÷ ${f1(r.u)} = ${f4(R.iu)} cm⁻¹.`, `1/U = 1 ÷ ${f1(r.u)} = ${f4(R.iu)} cm⁻¹`],
      ['1/V', `1 ÷ ${f1(r.v)} = ${f4(R.iv)} cm⁻¹.`, `1/V = 1 ÷ ${f1(r.v)} = ${f4(R.iv)} cm⁻¹`],
      ['1/F', full ? `The lens formula adds the two reciprocals: ${f4(R.iu)} + ${f4(R.iv)} = ${f4(R.iF)} cm⁻¹ (summed before rounding).` : `${f4(R.iu)} + ${f4(R.iv)} = ${f4(R.iF)} cm⁻¹.`, `1/F = 1/U + 1/V = ${f4(R.iF)} cm⁻¹`],
      ['F', full ? `The reciprocal again gives the focal length from this one reading: 1 ÷ ${f4(R.iF)} = ${f2(R.F)} cm, close to the labelled 15 cm.` : `1 ÷ ${f4(R.iF)} = ${f2(R.F)} cm.`, `F = 1 ÷ ${f4(R.iF)} = ${f2(R.F)} cm`]
    ];
    for (let k = 0; k < 6; k++) {
      renderTable({ g, i }, k + 1);
      await Tt.teach(`Row: ${steps[k][0]}`, steps[k][1], { el: cell(g, i, COLS[k]), label: steps[k][2], f: steps[k][2], ms: hold });
    }
    renderTable();
  }
  const READS = [0, 1, 2, 3, 4, 5, 6].map(k => LENS.EX[k]);
  async function reading(Tt, idx) {
    const { u, v } = READS[idx], lampAt = +(55 - u).toFixed(1), g = LENS.group(u, v), first = idx === 0, mid = g === 'eq', firstMag = idx === 4;
    const where = g === 'gt' ? 'beyond 2F' : g === 'eq' ? 'at 2F' : 'between F and 2F';
    const tag = `Reading ${idx + 1} of 7`;
    await Tt.teach(`${tag}: lamp ${where}`, first ? `The lamp house is moved to the ${f1(lampAt)} cm mark, so u = 55.0 − ${f1(lampAt)} = ${f1(u)} cm: beyond 2F (${LENS.rough2 != null ? f1(LENS.rough2) : '30'} cm), for a diminished image.` : mid ? `For the middle row the lamp goes to 2F: the ${f1(lampAt)} cm mark, u = ${f1(u)} cm. The image should come out the same size as the object.` : firstMag ? `Now the magnified group: the lamp moves closer, between F and 2F, to the ${f1(lampAt)} cm mark (u = ${f1(u)} cm). The image will form beyond 2F, so the screen moves far out.` : `Lamp to the ${f1(lampAt)} cm mark: u = ${f1(u)} cm, ${where}.`, { box: SB(B.box.lamp), label: `lamp → ${f1(lampAt)} cm`, ms: first || mid || firstMag ? null : 2600 });
    B.setFocus('lamp'); await moveT('lamp', lampAt, 1800);
    if (first) await Tt.teach('The screen first', 'With the screen where it was, the patch of light is blurred. The screen is slid along the rail while the screen view and the sharpness ladder are watched.', { box: SB(B.box.screenInset), label: 'blurred patch' });
    else await Tt.teach('Slide the screen', mid ? 'The screen is slid through the focus again; the sharpest position is near 2F on the other side as well.' : 'The screen is slid in from beyond the image, through the sharpest point and back.', { box: SB(B.box.screen), label: 'slide the screen', ms: 2400 });
    B.setFocus('screen');
    await slideScreen(Tt, v, first ? 5200 : 3600);
    const vt = LENS.image(u), half = LENS.sharpC * vt / LENS.aperture;
    if (first) {
      await Tt.teach('Sharp: the range of sharpness', `Past the focus the image blurred again, so the screen came back. The F looks sharp for screen positions within about ±${f1(half)} cm of the image; the screen is set in the middle of that range.`, { box: SB(B.box.sharp), label: 'sharp', f: 'sharp range ≈ ±' + f1(half) + ' cm' });
      await Tt.teach('The image: real and inverted', `The F appears on the screen upside down and smaller than the object: real, inverted, diminished. Its size is m = v/u ≈ ${f1(v)} ÷ ${f1(u)} ≈ ${f2(v / u)} of the object.`, { box: SB(B.box.card), label: 'inverted, diminished', f: `m = v/u = ${f2(v / u)}` });
    } else if (mid || firstMag) {
      await Tt.teach('Sharp image', mid ? `Sharp at v = ${f1(v)} cm: inverted and the same size as the object (m = v/u ≈ ${f2(v / u)}).` : `Sharp at v = ${f1(v)} cm: inverted and larger than the object, m = v/u ≈ ${f2(v / u)}. The range of sharpness is wider here, about ±${f1(half)} cm, so the middle of it matters more.`, { box: SB(B.box.card), label: mid ? 'same size' : 'magnified', f: `m = v/u = ${f2(v / u)}` });
    }
    /* read the riders through the loupe */
    const r = B.read();
    B.setFocus('lamp');
    await Tt.teach('Lamp index', first ? `The loupe magnifies the scale under the lamp rider. With the eye square to the scale, the red hairline sits at ${f1(r.lamp)} cm.` : `Lamp rider: ${f1(r.lamp)} cm.`, { box: SB(B.box.loupe), label: `lamp ${f1(r.lamp)} cm`, ms: first ? null : 1800 });
    B.setFocus('screen');
    await Tt.teach('Screen index', first ? `The screen rider index reads ${f1(r.screen)} cm, again to the nearest millimetre.` : `Screen rider: ${f1(r.screen)} cm.`, { box: SB(B.box.loupe), label: `screen ${f1(r.screen)} cm`, ms: first ? null : 1800 });
    await Tt.teach('Read the scale', first ? `Read the scale turns the three rider positions into distances from the lens: u = ${f1(r.lens)} − ${f1(r.lamp)} = ${f1(u)} cm and v = ${f1(r.screen)} − ${f1(r.lens)} = ${f1(v)} cm.` : `u = ${f1(r.lens)} − ${f1(r.lamp)} = ${f1(u)} cm, v = ${f1(r.screen)} − ${f1(r.lens)} = ${f1(v)} cm.`, { el: $('lens-read'), focus: [rig, $('lens-rec')], alt: SB(B.box.scale), label: 'Read the scale', f: `u = ${f1(u)} cm · v = ${f1(v)} cm`, ms: first ? null : 2600 });
    readScale();
    await Tt.teach('Record', first ? `Record checks that the image is sharp and that u and v match the riders, then fills the next empty row of its group: here u > v, so the ${GN[g]} group.` : `Into the ${GN[g]} group.`, { el: $('lens-record'), focus: [rig, $('lens-rec')], alt: SB(B.box.screenInset), label: 'Record', ms: first ? null : 1800 });
    record(0);
    await fillRow(Tt, g, st.rows[g].length - 1, first);
  }
  async function run(Tt) {
    st.gN = 0; drawGraph();
    await Tt.teach('Two parts', 'First a rough focal length from a distant object, then the u–v method on the optical bench, the graph of 1/v against 1/u, and the calculation of F and the power.', { el: drig });
    /* part 1 */
    await Tt.teach('A distant object', 'A window across the room, about 10 m away. Rays from one point of something that far arrive at the lens almost parallel.', { box: SD(DS.box.window), label: 'window ≈ 10 m' });
    await Tt.teach('The lens and the card', 'The lens stands at the zero of a rule; a white card slides behind it. The card view on the right shows what falls on the card.', { box: SD(DS.box.lens), label: 'lens at 0' });
    await Tt.teach('Slide the card', 'The card moves towards the lens. The blurred patch shrinks into a small picture of the window as the card nears the focus.', { box: SD(DS.box.card), label: 'card' });
    await tween(3000, k => DS.move(24 + (14.4 - 24) * ease(k)));
    await tween(1600, k => DS.move(14.4 + (15.2 - 14.4) * ease(k)));
    await Tt.teach('Sharp on the card', 'At 15.2 cm the window is sharp: tiny, inverted and real. Parallel rays meet at the principal focus, so the card is about one focal length from the lens.', { box: SD(DS.box.inset), label: 'inverted, very small' });
    await Tt.teach('Read the rule', 'The card index reads 15.2 cm on the rule: a rough F. It is slightly more than f, because 10 m is not quite infinity (v = 1000 × 15 ÷ 985 ≈ 15.2 cm).', { box: SD(DS.box.index), label: 'F ≈ 15.2 cm', f: 'F ≈ 15.2 cm' });
    markF();
    await Tt.teach('F and 2F', 'Read F records F = 15.2 cm and 2F = 2 × 15.2 = 30.4 cm. These show where to place the lamp: beyond 2F for diminished images, between F and 2F for magnified ones.', { el: $('dist-obs'), label: 'F and 2F', f: '2F = 2 × 15.2 = 30.4 cm' });
    /* part 2: the bench */
    await Tt.teach('The optical bench', 'Each part of the bench is shown before it is used.', { el: rig });
    await Tt.teach('Rail', 'A straight metal rail on cast-iron feet keeps the lamp, the lens and the screen on one axis at the same height.', { box: SB(B.box.rail), label: 'rail' });
    await Tt.teach('Scale', 'A centimetre scale with millimetre divisions is printed along the rail, 0 to 120 cm.', { box: SB(B.box.scale), label: 'cm scale' });
    await Tt.teach('Lamp house', 'The lamp house is the object. Its front plate has an F-shaped cut-out lit from behind; an F is used because it shows at once whether the image is inverted or reversed.', { box: SB(B.box.lamp), label: 'lamp house' });
    await Tt.teach('The object', 'The lit F, as seen from the lens. It is 2 cm tall.', { box: SB(B.box.objInset), label: 'object: F, 2 cm' });
    await Tt.teach('Convex lens', 'The convex lens in its holder stays fixed at the 55.0 cm mark. Its label gives the theoretical value, f = 15 cm.', { box: SB(B.box.lens), label: 'lens at 55.0 cm' });
    await Tt.teach('Screen', 'A white screen on the other side of the lens catches the real image.', { box: SB(B.box.screen), label: 'screen' });
    await Tt.teach('Screen view', 'The screen as seen from the lens side, with a 1 cm grid. The sharpness ladder fills as the image sharpens and turns red when it is sharp; it is a hint only, not a reading.', { box: SB(B.box.screenInset), label: 'screen view' });
    await Tt.teach('Rider index', 'Each rider has a small window with a red hairline over the scale. The position of a part is read at the hairline.', { box: SB(B.box.riderLens), label: 'rider index' });
    B.setFocus('lens');
    await Tt.teach('Loupe', 'The loupe enlarges the scale under the selected rider. The lens rider reads 55.0 cm. Looking square to the scale avoids parallax.', { box: SB(B.box.loupe), label: 'lens 55.0 cm' });
    await Tt.teach('F and 2F marks', `Arrow marks from the rough F show F (${f1(55 - LENS.rough)} and ${f1(55 + LENS.rough)} cm) and 2F (${f1(55 - LENS.rough2)} and ${f1(55 + LENS.rough2)} cm) on both sides of the lens.`, { box: SB(B.box.rail), label: 'F · 2F marks' });
    for (let k = 0; k < 7; k++) await reading(Tt, k);
    /* aside: inside F */
    await Tt.teach('Aside: lamp inside F', 'What if the lamp is closer to the lens than F? The lamp moves to 45.0 cm, so u = 10 cm < F.', { box: SB(B.box.lamp), label: 'u = 10 cm', ms: 3000 });
    B.setFocus('lamp'); await moveT('lamp', 45, 1600); B.setRays(true);
    await Tt.teach('No real image', 'The rays still diverge after the lens and never meet: only a broad, dim patch reaches the screen wherever it is. Traced back, they appear to come from an upright, magnified virtual image on the lamp side, the magnifier case.', { el: $('lens-msg'), focus: [rig, $('lens-msg')], alt: SB(B.box.beam), label: 'virtual image only' });
    B.setRays(false);
    /* graph */
    const gp = $('lens-graph-panel'), pts = ptsOrder();
    await Tt.teach('The graph', 'Each row gives one point: 1/u across, 1/v up, both in cm⁻¹ from 0 to 0.08. The points are plotted one at a time.', { el: gp });
    for (let k = 0; k < pts.length; k++) {
      st.gN = k + 1; drawGraph();
      const p = pts[k], r = st.rows[p.g][p.i];
      await Tt.teach(`Point ${k + 1}`, `u = ${f1(r.u)}, v = ${f1(r.v)} cm: plotted at 1/u = ${f4(p.x)}, 1/v = ${f4(p.y)} cm⁻¹.`, { el: ptsG.lastChild, focus: [gsvg], label: `(${f4(p.x)}, ${f4(p.y)})`, ms: k < 2 ? null : 1700 });
    }
    st.gN = null; drawGraph();
    const F0 = fitNow(), x1 = 0.02, x2 = 0.05, y1 = F0.a + F0.b * x1, y2 = F0.a + F0.b * x2, h0 = st.h.map(q => Object.assign({}, q));
    await Tt.teach('Best-fit line', 'A straight line is drawn through the middle of the points, with about as many above as below. Its two handles are moved until it fits.', { el: gsvg, label: 'best fit' });
    await tween(2600, k => { const e = ease(k); st.h[0] = { x: h0[0].x + (x1 - h0[0].x) * e, y: h0[0].y + (y1 - h0[0].y) * e }; st.h[1] = { x: h0[1].x + (x2 - h0[1].x) * e, y: h0[1].y + (y2 - h0[1].y) * e }; drawGraph(); });
    const Lr = lineOf();
    await Tt.teach('Extended to both axes', `The dashed extension meets both axes. The slope is close to −1 (${Lr.m.toFixed(2)}), as 1/v = −1/u + 1/f predicts.`, { el: gsvg, label: 'slope ≈ −1' });
    await Tt.teach('Intercept a', `On the 1/u axis, where 1/v = 0: a = ${f4(Lr.a)} cm⁻¹.`, { el: aMark, focus: [gsvg], label: `a = ${f4(Lr.a)}` });
    await Tt.teach('Intercept b', `On the 1/v axis, where 1/u = 0: b = ${f4(Lr.b)} cm⁻¹. Both are estimates of 1/F.`, { el: bMark, focus: [gsvg], label: `b = ${f4(Lr.b)}` });
    const a4 = f4(Lr.a), b4 = f4(Lr.b), mi = ((+a4 + +b4) / 2).toFixed(5), fg = f2(1 / +mi);
    await Tt.teach('Graph readouts', `Mean intercept (${a4} + ${b4}) ÷ 2 = ${mi} cm⁻¹, so F = 1 ÷ ${mi} = ${fg} cm.`, { el: gread, focus: [gsvg, gread], label: 'readouts', f: `F<sub>graph</sub> = 1 ÷ ${mi} = ${fg} cm` });
    /* calculation */
    const mF = f2(meanF()), fm = (+mF / 100).toFixed(4), P = f2(1 / +fm), e1 = f2(Math.abs(+mF - 15) / 15 * 100), e2 = f2(Math.abs(+fg - 15) / 15 * 100);
    await Tt.teach('Calculation', 'In the order of the manual: the labelled value, the mean of the table, the two intercepts and their mean, F from the graph, then the power with f in metres and the percentage errors. A dotted line runs from each symbol or number to its source.', { el: calc });
    const type = async (k, v, title, text, f) => { await Tt.teach(title, text, { el: IN[k], ms: 1500, f }); await Tt.typeInto(IN[k], v); await Tt.wait(400); };
    await Tt.teach('', '', { trace: lSym('fth', 'fth') });
    await type('fth', '15', 'Theoretical f', 'The labelled value, in cm.');
    await Tt.teach('', '', { trace: lSym('fex', 'Fcol') });
    await Tt.traceLine(wk('fex'));
    await type('fex', mF, 'Mean (F)', `The average of the seven F values: ${mF} cm.`, `Mean (F) = ${mF} cm`);
    await Tt.teach('', '', { trace: lSym('a', 'a') });
    await type('a', a4, 'a', 'Read from the graph.');
    await Tt.teach('', '', { trace: lSym('b', 'b') });
    await type('b', b4, 'b', 'Read from the graph.');
    await Tt.teach('', '', { trace: lSym('mi', 'mi') });
    await Tt.traceLine(wk('mi'));
    await type('mi', mi, 'Mean intercept', 'The mean of a and b, not their sum.', `(${a4} + ${b4}) ÷ 2 = ${mi} cm⁻¹`);
    await Tt.teach('', '', { trace: lSym('fg', 'fg') });
    await Tt.traceLine(wk('fg'));
    await type('fg', fg, 'F from the graph', 'The reciprocal of the mean intercept.', `F<sub>graph</sub> = 1 ÷ ${mi} = ${fg} cm`);
    await Tt.teach('', '', { trace: lSym('fm', 'fm') });
    await Tt.traceLine(wk('fm'));
    await type('fm', fm, 'f in metres', 'The dioptre needs f in metres: divide by 100.', `${mF} ÷ 100 = ${fm} m`);
    await Tt.teach('', '', { trace: lSym('P', 'P') });
    await Tt.traceLine(wk('P'));
    await type('P', P, 'Power', `1 ÷ ${fm} = ${P} D; positive, as for any converging lens.`, `P = 1 ÷ ${fm} = +${P} D`);
    await Tt.teach('', '', { trace: lSym('e1', 'e1') });
    await Tt.traceLine(wk('e1'));
    await type('e1', e1, '% error, table', 'The table value against the label.', `|${mF} − 15| ÷ 15 × 100 = ${e1} %`);
    await Tt.teach('', '', { trace: lSym('e2', 'e2') });
    await Tt.traceLine(wk('e2'));
    await type('e2', e2, '% error, graph', 'The graph value against the label.', `|${fg} − 15| ÷ 15 × 100 = ${e2} %`);
    await Tt.teach('Check', 'Check compares each answer with the table, the graph and the label, and catches the usual slips: u and v swapped, a missing reciprocal, one intercept only, a sum for a mean, the power with f in cm.', { el: $('lens-check'), label: 'Check', ms: 4200 });
    check();
    await Tt.teach('Result', 'The theoretical, experimental and graphical focal lengths side by side, the power in dioptres and the percentage errors.', { el: res, label: 'Result' });
    for (const k of ['resT', 'resE', 'resG', 'resP']) { const n = rNum(k); if (n) await Tt.teach('', '', { trace: n }); }
    await Tt.teach('Done', `F = ${mF} cm from the table and ${fg} cm from the graph, against the labelled 15 cm; the power is +${P} D. Hovering (or tapping) any symbol or number in the Calculation shows its meaning and source. Start over to take the readings by hand.`, { el: chk });
  }
  L.registerLab('lens', {
    btn: $('lens-tut'), scope: $('view-lens-practical'), reset,
    seed: () => { st.h = DEF_H(); },
    run, cleanup: () => { st.gN = null; drawGraph(); }
  });
  reset();
  L.LAB = { st, record, readScale, check, reset, renderTable, meanF, lineOf, setH, fitNow, IN, cell, markF, undo, INFO, rmsOf, drawGraph };
  void tsub; void F_CAP;
})(window.SOL);
