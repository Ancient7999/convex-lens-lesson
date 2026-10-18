/* The optical bench and the distance-object scene: apparatus, image formation, dragging and the loupe */
(function (L) {
  'use strict';
  const { el, txt, $, clamp, C, F_BODY, F_CAP, svgPoint, LENS, tut } = L;
  const VS = 16;                         /* vertical drawing scale on the bench, px per cm (exaggerated for clarity) */
  const AXY = 400;                       /* optical axis height in the bench drawing */
  const X = cm => 60 + cm * 7.4, ICM = px => (px - 60) / 7.4;
  const LAMP_MIN = 8, LAMP_MAX = LENS.lensAt - 4, SCR_MIN = LENS.lensAt + 4, SCR_MAX = 118;
  const LIGHT = '#fff2cf', WARM = '#ffd98a';

  /* ---------- materials ---------- */
  let noiseURL = null;
  function noise() {
    if (noiseURL) return noiseURL;
    const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'), im = x.createImageData(96, 96), r = L.mulberry32(7);
    for (let i = 0; i < im.data.length; i += 4) { const v = 90 + r() * 165; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 30; }
    x.putImageData(im, 0, 0); noiseURL = c.toDataURL(); return noiseURL;
  }
  function materials(svg, id) {
    const d = el('defs', null, svg);
    const lin = (name, stops, x2, y2) => { const g = el('linearGradient', { id: `${id}-${name}`, x1: 0, y1: 0, x2: x2 || 0, y2: y2 == null ? 1 : y2 }, d); stops.forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op == null ? 1 : op }, g)); };
    const rad = (name, stops, cx, cy, r) => { const g = el('radialGradient', { id: `${id}-${name}`, cx: cx == null ? .5 : cx, cy: cy == null ? .5 : cy, r: r || .5 }, d); stops.forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op == null ? 1 : op }, g)); };
    lin('room', [[0, '#2b3027'], [.62, '#20241d'], [1, '#171a14']]);
    lin('table', [[0, '#3a3229'], [.08, '#4a3f33'], [1, '#2a241d']]);
    lin('alu', [[0, '#f4f6f2'], [.12, '#d5d9d3'], [.5, '#a9afa8'], [1, '#6f756f']]);
    lin('aluTop', [[0, '#8f958e'], [.4, '#e9ece7'], [1, '#b9beb7']]);
    lin('face', [[0, '#e4e7e1'], [.5, '#d2d6cf'], [1, '#bcc1ba']]);
    lin('lip', [[0, '#7c827c'], [1, '#3e433e']]);
    lin('anod', [[0, '#55595d'], [.18, '#3a3d41'], [.6, '#232528'], [1, '#121315']]);
    lin('anodH', [[0, '#000', .25], [.2, '#fff', .07], [.5, '#fff', 0], [.85, '#000', .15], [1, '#000', .35]], 1, 0);
    lin('chrome', [[0, '#4d5256'], [.3, '#eef1f2'], [.5, '#a7aeb2'], [.75, '#d9dee0'], [1, '#41464a']], 1, 0);
    lin('brass', [[0, '#f6dc98'], [.45, '#c79d48'], [1, '#76561c']]);
    lin('brassH', [[0, '#7a5a1f'], [.35, '#f3d48c'], [.6, '#c49a45'], [1, '#6c4f19']], 1, 0);
    lin('enamel', [[0, '#4a5243'], [.35, '#363d31'], [1, '#1f241c']]);
    lin('enamelH', [[0, '#000', .3], [.15, '#fff', .06], [.85, '#000', .05], [1, '#000', .35]], 1, 0);
    lin('plate', [[0, '#5b6158'], [1, '#2c302a']]);
    lin('card', [[0, '#d9d5c8'], [1, '#c3bfb1']]);
    lin('cardSide', [[0, '#a29e90'], [1, '#7f7b6f']]);
    lin('iron', [[0, '#3a3e3b'], [1, '#141615']]);
    lin('inset', [[0, '#2a2f26'], [1, '#1c1f19']]);
    rad('glow', [[0, '#fff7df', .95], [.35, '#ffd98a', .55], [1, '#ffb347', 0]]);
    rad('patch', [[0, '#fff3d0', .9], [.6, '#ffe2a0', .45], [1, '#ffd27a', 0]]);
    rad('lensRim', [[0, '#000', 0], [.82, '#000', 0], [.9, '#000', .35], [1, '#000', .7]]);
    rad('vig', [[0, '#000', 0], [.7, '#000', 0], [1, '#000', .45]]);
    const pt = el('pattern', { id: `${id}-grain`, patternUnits: 'userSpaceOnUse', width: 96, height: 96 }, d); el('image', { href: noise(), width: 96, height: 96 }, pt);
    const kn = el('pattern', { id: `${id}-knurl`, patternUnits: 'userSpaceOnUse', width: 2.6, height: 2.6, patternTransform: 'rotate(45)' }, d);
    el('path', { d: 'M0 0V2.6M0 0H2.6', stroke: '#000', 'stroke-width': .7, opacity: .45 }, kn);
    const sh = el('filter', { id: `${id}-sh`, x: '-20%', y: '-20%', width: '140%', height: '160%' }, d); el('feDropShadow', { dx: 0, dy: 5, stdDeviation: 5, 'flood-color': '#000', 'flood-opacity': .45 }, sh);
    const soft = el('filter', { id: `${id}-soft`, x: '-50%', y: '-200%', width: '200%', height: '500%' }, d); el('feGaussianBlur', { stdDeviation: 6 }, soft);
    const gl = el('filter', { id: `${id}-glowf`, x: '-60%', y: '-60%', width: '220%', height: '220%' }, d);
    el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 3, result: 'b' }, gl); const m = el('feMerge', null, gl); el('feMergeNode', { in: 'b' }, m); el('feMergeNode', { in: 'SourceGraphic' }, m);
    return d;
  }
  const screw = (g, x, y, r, id) => { el('circle', { cx: x, cy: y, r, fill: `url(#${id}-chrome)`, stroke: '#2a2d2b', 'stroke-width': .5 }, g); el('line', { x1: x - r * .6, y1: y + r * .3, x2: x + r * .6, y2: y - r * .3, stroke: '#2a2d2b', 'stroke-width': .8 }, g); };
  /* knurled locking screw seen from the side of a rider */
  function lockScrew(g, x, y, id) {
    el('rect', { x: x - 2, y: y - 3, width: 6, height: 6, fill: `url(#${id}-chrome)` }, g);
    el('rect', { x: x + 4, y: y - 7.5, width: 9, height: 15, rx: 2, fill: `url(#${id}-brassH)`, stroke: '#4d3910', 'stroke-width': .5 }, g);
    el('rect', { x: x + 4, y: y - 7.5, width: 9, height: 15, rx: 2, fill: `url(#${id}-knurl)` }, g);
    el('rect', { x: x + 4.5, y: y - 7, width: 8, height: 2, rx: 1, fill: '#fff', opacity: .35 }, g);
  }
  /* a rider (carriage) on the rail, with its index window over the scale */
  function rider(g, id, w) {
    w = w || 44; const h = w / 2;
    el('path', { d: `M${-h} 494 h${w} l4 6 v26 h${-w - 8} v-26 z`, fill: `url(#${id}-anod)`, stroke: '#0b0c0d', 'stroke-width': .8 }, g);
    el('path', { d: `M${-h} 494 h${w} l4 6 v26 h${-w - 8} v-26 z`, fill: `url(#${id}-anodH)` }, g);
    el('rect', { x: -h - 3, y: 499.5, width: w + 6, height: 1.2, fill: '#fff', opacity: .16 }, g);
    lockScrew(g, h + 4, 512, id);
    /* acrylic index window over the scale face, with a red hairline at the reading position */
    el('rect', { x: -9, y: 524, width: 18, height: 23, rx: 1.5, fill: '#dff1f4', opacity: .28, stroke: '#ffffff', 'stroke-opacity': .55, 'stroke-width': .7 }, g);
    el('line', { x1: 0, y1: 524, x2: 0, y2: 547, stroke: '#c8261b', 'stroke-width': 1.1 }, g);
    el('rect', { x: -9, y: 524, width: 18, height: 3, fill: '#ffffff', opacity: .35 }, g);
  }
  const post = (g, x, y1, y2, id, w) => { w = w || 8; el('rect', { x: x - w / 2, y: y1, width: w, height: y2 - y1, fill: `url(#${id}-chrome)` }, g); };
  const capLabel = (g, x, y, s, o) => txt(g, x, y, s, Object.assign({ 'text-anchor': 'middle', 'font-size': 10.5, 'font-family': F_CAP, 'font-weight': 600, 'letter-spacing': '.16em', fill: '#c9cfbf' }, o || {}));

  /* ============================== the u–v bench ============================== */
  function bench() {
    const svg = $('lens-rig'), id = 'lb'; materials(svg, id); const gidv = LENS.glassDefs(svg);
    const st = { lamp: 30, screen: 100, rays: false, focus: 'screen', drag: null };
    const room = el('g', null, svg);
    el('rect', { width: 1000, height: 640, fill: `url(#${id}-room)` }, room);
    el('rect', { width: 1000, height: 640, fill: `url(#${id}-grain)`, opacity: .55 }, room);
    el('rect', { y: 572, width: 1000, height: 68, fill: `url(#${id}-table)` }, room);
    el('rect', { y: 572, width: 1000, height: 68, fill: `url(#${id}-grain)`, opacity: .6 }, room);
    el('rect', { y: 572, width: 1000, height: 1.2, fill: '#fff', opacity: .12 }, room);
    el('ellipse', { cx: 500, cy: 578, rx: 470, ry: 9, fill: '#000', opacity: .5, filter: `url(#${id}-soft)` }, room);

    /* F and 2F marks on the rail top, from the rough focal length */
    const marks = el('g', null, svg);
    /* light: beam layer under the components */
    const beam = el('g', { style: 'mix-blend-mode:screen' }, svg);
    const beamA = el('path', { fill: WARM, opacity: .13 }, beam), beamB = el('path', { fill: WARM, opacity: .13 }, beam);
    const preA = el('path', { fill: WARM, opacity: .10 }, beam), preB = el('path', { fill: WARM, opacity: .10 }, beam);
    const raysG = el('g', null, svg);

    /* rail: extruded aluminium with a printed centimetre scale on its front face */
    const rail = el('g', null, svg);
    [[X(0) - 34, 'L'], [X(120) + 34, 'R']].forEach(([x]) => {
      el('path', { d: `M${x - 26} 572 L${x - 16} 548 h32 L${x + 26} 572 Z`, fill: `url(#${id}-iron)`, stroke: '#070807', 'stroke-width': .8 }, rail);
      el('rect', { x: x - 30, y: 568, width: 14, height: 5, rx: 1.5, fill: `url(#${id}-chrome)` }, rail); el('rect', { x: x + 16, y: 568, width: 14, height: 5, rx: 1.5, fill: `url(#${id}-chrome)` }, rail);
    });
    const RX0 = X(0) - 40, RX1 = X(120) + 40;
    el('rect', { x: RX0, y: 512, width: RX1 - RX0, height: 9, fill: `url(#${id}-aluTop)` }, rail);
    el('rect', { x: RX0, y: 520, width: RX1 - RX0, height: 29, fill: `url(#${id}-face)` }, rail);
    el('rect', { x: RX0, y: 520, width: RX1 - RX0, height: 29, fill: `url(#${id}-grain)`, opacity: .35 }, rail);
    el('rect', { x: RX0, y: 549, width: RX1 - RX0, height: 6, fill: `url(#${id}-lip)` }, rail);
    el('rect', { x: RX0, y: 520, width: RX1 - RX0, height: 1, fill: '#fff', opacity: .7 }, rail);
    [RX0 + 6, RX1 - 6].forEach(x => screw(rail, x, 534, 3.2, id));
    const sc = el('g', null, rail);
    for (let k = 0; k <= 120; k++) {
      const x = X(k), big = k % 10 === 0, mid = k % 5 === 0;
      el('line', { x1: x, y1: 521, x2: x, y2: 521 + (big ? 11 : mid ? 8 : 5), stroke: '#151815', 'stroke-width': big ? 1.1 : .7 }, sc);
      if (big) txt(sc, x, 543.5, String(k), { 'text-anchor': 'middle', 'font-size': 9.5, 'font-family': F_BODY, 'font-weight': 600, fill: '#151815' });
    }
    txt(sc, X(120) + 22, 543.5, 'cm', { 'text-anchor': 'middle', 'font-size': 8.5, 'font-family': F_BODY, fill: '#3a3f39' });

    /* ---- lamp house with the illuminated 'F' cut-out; the rider index marks the object plane ---- */
    const lamp = el('g', { class: 'drag kfocus', tabindex: 0, role: 'slider', 'aria-label': 'Lamp house rider (object). Arrow keys move it.' }, svg);
    el('rect', { x: -60, y: 300, width: 120, height: 270, fill: 'transparent' }, lamp);
    rider(lamp, id); post(lamp, -16, 456, 494, id, 9);
    el('rect', { x: -32, y: 452, width: 32, height: 8, fill: `url(#${id}-anod)` }, lamp);
    const body = el('g', { filter: `url(#${id}-sh)` }, lamp);
    el('path', { d: 'M-96 338 q0 -8 8 -8 h80 q4 0 4 4 v124 q0 4 -4 4 h-80 q-8 0 -8 -8 z', fill: `url(#${id}-enamel)`, stroke: '#0e100c', 'stroke-width': 1 }, body);
    el('path', { d: 'M-96 338 q0 -8 8 -8 h80 q4 0 4 4 v124 q0 4 -4 4 h-80 q-8 0 -8 -8 z', fill: `url(#${id}-grain)`, opacity: .8 }, body);
    el('path', { d: 'M-96 338 q0 -8 8 -8 h80 q4 0 4 4 v124 q0 4 -4 4 h-80 q-8 0 -8 -8 z', fill: `url(#${id}-enamelH)` }, body);
    /* chimney with louvres */
    el('path', { d: 'M-78 330 v-14 q0 -4 4 -4 h44 q4 0 4 4 v14 z', fill: `url(#${id}-plate)`, stroke: '#0e100c', 'stroke-width': .8 }, body);
    for (let k = 0; k < 4; k++) el('rect', { x: -72 + k * 11, y: 317, width: 7, height: 9, rx: 1, fill: '#0c0d0b' }, body);
    el('rect', { x: -78, y: 311.5, width: 52, height: 1, fill: '#fff', opacity: .18 }, body);
    for (let k = 0; k < 6; k++) el('rect', { x: -86, y: 360 + k * 10, width: 28, height: 3.2, rx: 1.6, fill: '#0c0d0b', opacity: .85 }, body);
    el('rect', { x: -88, y: 432, width: 46, height: 16, rx: 2, fill: '#c7c2ad', opacity: .9 }, body);
    txt(body, -65, 441.5, 'LAMP 12 V', { 'text-anchor': 'middle', 'font-size': 6.6, 'font-family': F_CAP, 'font-weight': 600, 'letter-spacing': '.08em', fill: '#252820' });
    txt(body, -65, 446.5, '24 W', { 'text-anchor': 'middle', 'font-size': 4.6, 'font-family': F_CAP, fill: '#3d4136' });
    /* front plate carrying the object */
    el('rect', { x: -8, y: 344, width: 8, height: 112, fill: `url(#${id}-plate)`, stroke: '#0e100c', 'stroke-width': .8 }, body);
    [352, 448].forEach(y => screw(body, -4, y, 2.2, id));
    const slot = el('rect', { x: -1.6, y: AXY - VS, width: 2.6, height: 2 * VS, fill: LIGHT }, lamp);
    const halo = el('ellipse', { cx: 2, cy: AXY, rx: 9, ry: VS + 8, fill: `url(#${id}-glow)`, opacity: .9 }, lamp);
    /* mains cable */
    el('path', { d: 'M-96 440 C-130 444 -126 560 -170 566', fill: 'none', stroke: '#0d0e0c', 'stroke-width': 5, 'stroke-linecap': 'round' }, lamp);
    el('path', { d: 'M-96 440 C-130 444 -126 560 -170 566', fill: 'none', stroke: '#fff', 'stroke-opacity': .1, 'stroke-width': 1.4 }, lamp);
    capLabel(lamp, -46, 296, 'LAMP HOUSE');
    el('rect', { class: 'focus-ring', x: -104, y: 282, width: 130, height: 270, fill: 'none', stroke: C.acc, 'stroke-width': 2 }, lamp);
    void slot; void halo;

    /* ---- lens in a ring holder: fixed ---- */
    const lens = el('g', { transform: `translate(${X(LENS.lensAt)} 0)` }, svg);
    rider(lens, id); post(lens, 0, 452, 494, id, 9);
    el('rect', { x: -12, y: 446, width: 24, height: 10, rx: 2, fill: `url(#${id}-anod)` }, lens);
    lockScrew(lens, 12, 451, id);
    el('path', { d: `M0 ${AXY - 50} q-10 0 -10 10 v80 q0 10 10 10 q10 0 10 -10 v-80 q0 -10 -10 -10z`, fill: 'none', stroke: '#141614', 'stroke-width': 5 }, lens);
    el('path', { d: `M0 ${AXY - 50} q-10 0 -10 10 v80 q0 10 10 10 q10 0 10 -10 v-80 q0 -10 -10 -10z`, fill: 'none', stroke: '#fff', 'stroke-opacity': .12, 'stroke-width': 1 }, lens);
    LENS.drawLens(lens, 0, AXY, 40, 6.5, gidv, { stroke: '#2f4a4e', sw: 1 });
    el('rect', { x: -3, y: AXY + 49, width: 6, height: 4, fill: '#141614' }, lens);
    el('rect', { x: -14, y: 462, width: 28, height: 12, rx: 1.5, fill: '#cfcab6', stroke: '#6c6855', 'stroke-width': .5 }, lens);
    const lensTag = txt(lens, 0, 470.6, 'f = 15 cm', { 'text-anchor': 'middle', 'font-size': 6.4, 'font-family': F_BODY, 'font-weight': 600, fill: '#22251f' });
    capLabel(lens, 0, AXY - 62, 'CONVEX LENS');

    /* ---- screen: matte card in a frame, turned a little towards the viewer ---- */
    const scr = el('g', { class: 'drag kfocus', tabindex: 0, role: 'slider', 'aria-label': 'Screen rider. Arrow keys move it.' }, svg);
    el('rect', { x: -40, y: 300, width: 80, height: 270, fill: 'transparent' }, scr);
    rider(scr, id); post(scr, 0, 476, 494, id, 9);
    el('rect', { x: -10, y: 472, width: 20, height: 8, rx: 1.5, fill: `url(#${id}-anod)` }, scr);
    const FACE = 'M-13 324 L13 332 L13 476 L-13 468 Z';
    el('path', { d: 'M13 332 L17 333 L17 477 L13 476 Z', fill: `url(#${id}-cardSide)` }, scr);
    el('path', { d: FACE, fill: `url(#${id}-card)`, stroke: '#151713', 'stroke-width': 3.2, 'stroke-linejoin': 'round' }, scr);
    el('path', { d: FACE, fill: `url(#${id}-grain)`, opacity: .45 }, scr);
    const faceImg = el('g', { 'clip-path': `url(#${id}-faceclip)` }, scr);
    const fcp = el('clipPath', { id: `${id}-faceclip` }, svg.querySelector('defs')); el('path', { d: FACE }, fcp);
    capLabel(scr, 0, 312, 'SCREEN');
    el('rect', { class: 'focus-ring', x: -34, y: 298, width: 68, height: 254, fill: 'none', stroke: C.acc, 'stroke-width': 2 }, scr);

    /* ============ insets: object, loupe, screen ============ */
    const insetFrame = (x, w, title) => {
      const g = el('g', null, svg);
      el('rect', { x, y: 16, width: w, height: 244, fill: `url(#${id}-inset)`, stroke: '#0c0e0a', 'stroke-width': 1 }, g);
      el('rect', { x: x + .5, y: 16.5, width: w - 1, height: 26, fill: '#000', opacity: .22 }, g);
      el('line', { x1: x, y1: 42.5, x2: x + w, y2: 42.5, stroke: '#8d957f', 'stroke-opacity': .35 }, g);
      txt(g, x + 12, 33.5, title, { 'font-size': 10.5, 'font-family': F_CAP, 'font-weight': 600, 'letter-spacing': '.18em', fill: '#d6dccb' });
      return g;
    };
    /* object inset: the front plate, seen from the lens, with the lit 'F' */
    const oi = insetFrame(16, 206, 'OBJECT · FROM THE LENS');
    el('rect', { x: 36, y: 56, width: 166, height: 188, fill: `url(#${id}-plate)`, stroke: '#0c0e0a' }, oi);
    el('rect', { x: 36, y: 56, width: 166, height: 188, fill: `url(#${id}-grain)`, opacity: .6 }, oi);
    [[46, 66], [192, 66], [46, 234], [192, 234]].forEach(([x, y]) => screw(oi, x, y, 3.4, id));
    el('circle', { cx: 119, cy: 150, r: 58, fill: '#171914', stroke: '#0a0b09', 'stroke-width': 1.2 }, oi);
    el('circle', { cx: 119, cy: 150, r: 54, fill: `url(#${id}-glow)`, opacity: .14 }, oi);
    el('path', { d: LENS.fGlyph, transform: 'translate(119 150) scale(26)', fill: LIGHT, filter: `url(#${id}-glowf)` }, oi);
    el('path', { d: 'M164 124 v52 M160 124 h8 M160 176 h8', stroke: '#c9cfbf', 'stroke-width': 1, fill: 'none' }, oi);
    txt(oi, 172, 154, '2 cm', { 'font-size': 10, 'font-family': F_BODY, fill: '#c9cfbf' });

    /* loupe inset: a magnified view of the scale under one rider's index */
    const li = insetFrame(236, 328, 'LOUPE');
    const tabs = {}; [['lamp', 'Lamp'], ['lens', 'Lens'], ['screen', 'Screen']].forEach(([k, s], i) => {
      const b = el('g', { class: 'live kfocus', tabindex: 0, role: 'button', 'aria-label': `Loupe on the ${s.toLowerCase()} rider index` }, li);
      const r = el('rect', { x: 330 + i * 76, y: 21, width: 70, height: 17, rx: 1, fill: 'none', stroke: '#8d957f', 'stroke-opacity': .5 }, b);
      const t = txt(b, 365 + i * 76, 33.4, s.toUpperCase(), { 'text-anchor': 'middle', 'font-size': 9.6, 'font-family': F_CAP, 'font-weight': 600, 'letter-spacing': '.14em', fill: '#d6dccb' });
      b.addEventListener('click', () => { if (!tut.on) { st.focus = k; update(); } });
      b.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !tut.on) { e.preventDefault(); st.focus = k; update(); } });
      tabs[k] = { r, t };
    });
    const LCX = 400, LCY = 152, LR = 98;
    const lcp = el('clipPath', { id: `${id}-loupe` }, svg.querySelector('defs')); el('circle', { cx: LCX, cy: LCY, r: LR }, lcp);
    el('circle', { cx: LCX, cy: LCY + 4, r: LR + 7, fill: '#000', opacity: .5, filter: `url(#${id}-soft)` }, li);
    const lv = el('g', { 'clip-path': `url(#${id}-loupe)` }, li);
    el('rect', { x: LCX - LR, y: LCY - LR, width: 2 * LR, height: 2 * LR, fill: '#262a23' }, lv);
    el('rect', { x: LCX - LR, y: 128, width: 2 * LR, height: 18, fill: `url(#${id}-aluTop)` }, lv);
    el('rect', { x: LCX - LR, y: 146, width: 2 * LR, height: 80, fill: `url(#${id}-face)` }, lv);
    el('rect', { x: LCX - LR, y: 146, width: 2 * LR, height: 80, fill: `url(#${id}-grain)`, opacity: .5 }, lv);
    el('rect', { x: LCX - LR, y: 226, width: 2 * LR, height: 30, fill: `url(#${id}-lip)` }, lv);
    const lTicks = el('g', null, lv);
    /* the rider, fixed at the centre of the loupe; the scale slides under it */
    el('path', { d: `M${LCX - 64} 54 h128 v86 h-128 z`, fill: `url(#${id}-anod)` }, lv);
    el('path', { d: `M${LCX - 64} 54 h128 v86 h-128 z`, fill: `url(#${id}-anodH)` }, lv);
    el('rect', { x: LCX - 64, y: 136, width: 128, height: 4, fill: '#000', opacity: .4 }, lv);
    el('rect', { x: LCX - 30, y: 140, width: 60, height: 74, rx: 3, fill: '#e5f4f6', opacity: .2, stroke: '#fff', 'stroke-opacity': .6, 'stroke-width': 1.2 }, lv);
    el('rect', { x: LCX - 30, y: 140, width: 60, height: 8, fill: '#fff', opacity: .3 }, lv);
    el('line', { x1: LCX, y1: 140, x2: LCX, y2: 214, stroke: '#c8261b', 'stroke-width': 1.6 }, lv);
    const lName = txt(lv, LCX, 100, '', { 'text-anchor': 'middle', 'font-size': 12, 'font-family': F_CAP, 'font-weight': 600, 'letter-spacing': '.2em', fill: '#c9cfbf' });
    el('circle', { cx: LCX, cy: LCY, r: LR, fill: `url(#${id}-lensRim)` }, li);
    el('path', { d: `M${LCX - 70} ${LCY - 62} A ${LR - 8} ${LR - 8} 0 0 1 ${LCX + 10} ${LCY - LR + 9}`, fill: 'none', stroke: '#fff', 'stroke-opacity': .35, 'stroke-width': 5, 'stroke-linecap': 'round' }, li);
    el('circle', { cx: LCX, cy: LCY, r: LR + 2.5, fill: 'none', stroke: `url(#${id}-brass)`, 'stroke-width': 6 }, li);
    el('circle', { cx: LCX, cy: LCY, r: LR + 5.5, fill: 'none', stroke: '#0b0c0a', 'stroke-width': 1.2 }, li);
    txt(li, 248, 250, 'mm divisions · eye square', { 'font-size': 9.5, 'font-family': F_BODY, fill: '#aeb5a2', 'font-style': 'italic' });
    txt(li, 248, 238, 'red line = reading', { 'font-size': 9.5, 'font-family': F_BODY, fill: '#aeb5a2', 'font-style': 'italic' });

    /* screen inset: the card face, seen from the lens side, with the image the lens actually forms */
    const si = insetFrame(578, 406, 'SCREEN · FROM THE LENS SIDE');
    const CX = 690, CY = 150, PXC = 19;   /* card centre and px per cm */
    el('rect', { x: CX - 96, y: CY - 96, width: 192, height: 192, fill: '#0f110d' }, si);
    el('rect', { x: CX - 92, y: CY - 92, width: 184, height: 184, fill: `url(#${id}-card)` }, si);
    el('rect', { x: CX - 92, y: CY - 92, width: 184, height: 184, fill: `url(#${id}-grain)`, opacity: .5 }, si);
    for (let k = -4; k <= 4; k++) { el('line', { x1: CX + k * PXC, y1: CY - 92, x2: CX + k * PXC, y2: CY + 92, stroke: '#8a8676', 'stroke-width': .5, opacity: .55 }, si); el('line', { x1: CX - 92, y1: CY + k * PXC, x2: CX + 92, y2: CY + k * PXC, stroke: '#8a8676', 'stroke-width': .5, opacity: .55 }, si); }
    el('rect', { x: CX - 92, y: CY - 92, width: 184, height: 184, fill: '#151711', opacity: .42 }, si);   /* dimmed room */
    const scp = el('clipPath', { id: `${id}-card` + 'clip' }, svg.querySelector('defs')); el('rect', { x: CX - 92, y: CY - 92, width: 184, height: 184 }, scp);
    /* the image group, drawn in card centimetres, y downwards; reused on the bench card */
    const defsEl = svg.querySelector('defs');
    const blurF = el('filter', { id: `${id}-imgblur`, x: '-300%', y: '-300%', width: '700%', height: '700%' }, defsEl);
    const blurP = el('feGaussianBlur', { stdDeviation: .001 }, blurF);
    const img = el('g', { id: `${id}-img` }, defsEl);
    const patch = el('circle', { cx: 0, cy: 0, r: 1, fill: `url(#${id}-patch)`, opacity: 0 }, img);
    const glyph = el('path', { d: LENS.fGlyph, fill: LIGHT, filter: `url(#${id}-imgblur)` }, img);
    el('use', { href: `#${id}-img`, transform: `translate(${CX} ${CY}) scale(${PXC})` }, el('g', { 'clip-path': `url(#${id}-cardclip)` }, si));
    el('use', { href: `#${id}-img`, transform: `matrix(${26 / 9.2} ${8 / 9.2} 0 ${VS} 0 ${AXY})` }, faceImg);
    /* sharpness hint: a ladder of cells, not a number */
    const SX = 806; txt(si, SX, 70, 'SHARPNESS', { 'font-size': 10.5, 'font-family': F_CAP, 'font-weight': 600, 'letter-spacing': '.18em', fill: '#d6dccb' });
    const cells = []; for (let k = 0; k < 12; k++) cells.push(el('rect', { x: SX + k * 13.5, y: 80, width: 10.5, height: 22, fill: '#3c4237', stroke: '#11130f', 'stroke-width': .6 }, si));
    txt(si, SX, 118, 'blurred', { 'font-size': 10, 'font-family': F_BODY, fill: '#aeb5a2', 'font-style': 'italic' });
    txt(si, SX + 160, 118, 'sharp', { 'text-anchor': 'end', 'font-size': 10, 'font-family': F_BODY, fill: '#aeb5a2', 'font-style': 'italic' });
    const nat1 = txt(si, SX, 150, '', { 'font-size': 12.5, 'font-family': F_BODY, 'font-weight': 600, fill: '#eef1e6' });
    const nat2 = txt(si, SX, 168, '', { 'font-size': 11, 'font-family': F_BODY, fill: '#c3c9b7' });
    const nat3 = txt(si, SX, 184, '', { 'font-size': 11, 'font-family': F_BODY, fill: '#c3c9b7' });
    txt(si, SX, 238, '1 cm grid on the card', { 'font-size': 9.5, 'font-family': F_BODY, fill: '#aeb5a2', 'font-style': 'italic' });

    /* ============ state → drawing ============ */
    const msg = $('lens-msg');
    function say(t, cls) { msg.className = 'rig-msg' + (cls ? ' ' + cls : ''); msg.innerHTML = t; }
    const optics = () => {
      const u = LENS.lensAt - st.lamp, s = st.screen - LENS.lensAt, f = LENS.f;
      const v = LENS.image(u, f), c = LENS.blur(u, s, f);
      return { u, s, v, c, real: u > f + 0.05, sharp: u > f + 0.05 && c <= LENS.sharpC };
    };
    function loupe() {
      const p = st.focus === 'lamp' ? st.lamp : st.focus === 'lens' ? LENS.lensAt : st.screen;
      lTicks.innerHTML = ''; const PX = 64;
      for (let mm = Math.floor((p - 1.8) * 10); mm <= Math.ceil((p + 1.8) * 10); mm++) {
        const cm = mm / 10, x = LCX + (cm - p) * PX, big = mm % 10 === 0, mid = mm % 5 === 0;
        el('line', { x1: x, y1: 147, x2: x, y2: 147 + (big ? 36 : mid ? 24 : 14), stroke: '#151815', 'stroke-width': big ? 2 : mid ? 1.4 : 1 }, lTicks);
        if (big) txt(lTicks, x, 207, String(mm / 10), { 'text-anchor': 'middle', 'font-size': 17, 'font-family': F_BODY, 'font-weight': 600, fill: '#151815' });
      }
      lName.textContent = st.focus === 'lamp' ? 'LAMP RIDER' : st.focus === 'lens' ? 'LENS RIDER' : 'SCREEN RIDER';
      Object.keys(tabs).forEach(k => { const on = k === st.focus; tabs[k].r.setAttribute('fill', on ? '#d6dccb' : 'none'); tabs[k].t.setAttribute('fill', on ? '#1c1f19' : '#d6dccb'); });
    }
    function beamPath(h, o) {
      const xL = X(LENS.lensAt), xS = X(st.screen), xO = X(st.lamp), f = LENS.f, A = LENS.aperture / 2, Y = y => AXY - y * VS;
      const ye = [A, -A].map(e => { const si = (e - h) / o.u, so = si - e / f; return e + so * o.s; });
      return { pre: `M${xO} ${Y(h)} L${xL} ${Y(A)} L${xL} ${Y(-A)} Z`, post: `M${xL} ${Y(A)} L${xS} ${Y(ye[0])} L${xS} ${Y(ye[1])} L${xL} ${Y(-A)} Z` };
    }
    function drawRays(o) {
      raysG.innerHTML = ''; if (!st.rays) return;
      const xL = X(LENS.lensAt), xS = X(st.screen), xO = X(st.lamp), f = LENS.f, u = o.u, s = o.s, Y = y => AXY - y * VS;
      const R = { fill: 'none', 'stroke-width': 1.4, 'stroke-linecap': 'round' };
      el('path', Object.assign({ d: `M${xO} ${Y(1)} L${xL} ${Y(1)} L${xS} ${Y(1 - s / f)}`, stroke: '#ff8a5c' }, R), raysG);
      el('path', Object.assign({ d: `M${xO} ${Y(1)} L${xS} ${Y(1 - (u + s) / u)}`, stroke: '#9fb8ff' }, R), raysG);
      if (u > f + .3) { const yl = 1 - u / (u - f); if (Math.abs(yl) < 2.5) el('path', Object.assign({ d: `M${xO} ${Y(1)} L${xL} ${Y(yl)} L${xS} ${Y(yl)}`, stroke: '#ffd36a' }, R), raysG); }
      [-1, 1].forEach(k => { const x = xL + k * f * 7.4; el('circle', { cx: x, cy: AXY, r: 2.6, fill: '#ffd36a' }, raysG); txt(raysG, x, AXY - 7, 'F', { 'text-anchor': 'middle', 'font-size': 10, 'font-family': F_BODY, 'font-weight': 600, fill: '#ffd36a' }); });
      el('line', { x1: X(0) - 30, y1: AXY, x2: X(120) + 30, y2: AXY, stroke: '#c9cfbf', 'stroke-width': .6, 'stroke-dasharray': '3 5', opacity: .6 }, raysG);
    }
    function drawMarks() {
      marks.innerHTML = ''; if (LENS.rough == null) return;
      [[-2, '2F'], [-1, 'F'], [1, 'F'], [2, '2F']].forEach(([k, s]) => {
        const cm = LENS.lensAt + k * LENS.rough; if (cm < 0 || cm > 120) return; const x = X(cm);
        el('path', { d: `M${x - 4} 505 L${x + 4} 505 L${x} 512 Z`, fill: '#e2593a' }, marks);
        txt(marks, x, 501, s, { 'text-anchor': 'middle', 'font-size': 9.5, 'font-family': F_BODY, 'font-weight': 700, fill: '#f08a6b' });
      });
    }
    LENS.onRough(drawMarks);
    function update() {
      lamp.setAttribute('transform', `translate(${X(st.lamp).toFixed(2)} 0)`);
      scr.setAttribute('transform', `translate(${X(st.screen).toFixed(2)} 0)`);
      lamp.setAttribute('aria-valuetext', 'lamp rider'); scr.setAttribute('aria-valuetext', 'screen rider');
      const o = optics();
      const a = beamPath(1, o), b = beamPath(-1, o);
      preA.setAttribute('d', a.pre); preB.setAttribute('d', b.pre); beamA.setAttribute('d', a.post); beamB.setAttribute('d', b.post);
      drawRays(o);
      /* image on the card: projection through the optical centre sets its size; defocus blurs it */
      const ms = o.s / o.u;
      let blurSd, gOp, pR, pOp;
      if (o.real) {
        blurSd = Math.max(.001, o.c / 2.4);
        const k = clamp(1.3 / Math.pow(Math.max(ms, .3), .75), .35, 1);
        gOp = clamp(1 / (1 + (o.c * o.c) / (0.35 * ms * ms + .02)), .1, 1) * k;
        pR = ms * 1.1 + o.c / 2; pOp = clamp(.55 * (1 - gOp / k), 0, .5) * k;
        glyph.setAttribute('transform', `scale(${ms.toFixed(4)} ${(-ms).toFixed(4)})`); glyph.setAttribute('opacity', gOp.toFixed(3));
      } else {
        blurSd = 2; gOp = 0; pR = Math.min(9, o.c / 2 + 1.2); pOp = .3;
        glyph.setAttribute('opacity', 0);
      }
      blurP.setAttribute('stdDeviation', blurSd.toFixed(4));
      patch.setAttribute('r', pR.toFixed(3)); patch.setAttribute('opacity', pOp.toFixed(3));
      /* sharpness ladder: exp(−c / 0.12 cm) */
      const q = o.real ? Math.exp(-o.c / .12) : 0, lit = Math.round(q * 12);
      cells.forEach((r, k) => r.setAttribute('fill', k < lit ? (o.sharp ? '#e2593a' : '#b9a46a') : '#3c4237'));
      if (!o.real) { nat1.textContent = Math.abs(o.u - LENS.f) <= .05 + 1e-9 ? 'Object at F' : 'No real image'; nat2.textContent = 'only a broad patch'; nat3.textContent = 'of light on the card'; }
      else if (o.sharp) { const m = o.v / o.u; nat1.textContent = 'Sharp image'; nat2.textContent = 'real, inverted'; nat3.textContent = m < .93 ? 'diminished' : m > 1.07 ? 'magnified' : 'same size'; }
      else { nat1.textContent = 'Blurred'; nat2.textContent = 'slide the screen'; nat3.textContent = ''; }
      if (!o.real) {
        if (Math.abs(o.u - LENS.f) <= .3) say('The object is at the focus (u = F). The rays leave the lens parallel, so the image is at infinity: the patch on the screen keeps the same size wherever the screen goes, and no image forms.', 'warn');
        else say('No real image: the object is inside the focal length (u < F). The rays leave the lens still diverging, so they never meet on the screen; only a broad, dim patch of light falls on it. Looking back through the lens shows an upright, magnified <b>virtual</b> image on the object side. Move the lamp further away than F.', 'warn');
      } else if (o.sharp) say(`Sharp image on the screen: real and inverted${o.v / o.u < .93 ? ', smaller than the object (diminished)' : o.v / o.u > 1.07 ? ', larger than the object (magnified)' : ', about the same size as the object'}. The readings can be taken.`, 'ok');
      else say('The image is blurred: the screen is not at the image distance. Slide the screen along the rail and watch the sharpness.', '');
      loupe();
      if (B.onChange) B.onChange(o);
    }
    /* dragging */
    function startDrag(which, e) {
      if (tut.on) return; e.preventDefault();
      const p = svgPoint(svg, e), cur = which === 'lamp' ? st.lamp : st.screen;
      st.drag = { which, off: ICM(p.x) - cur, id: e.pointerId }; st.focus = which;
      try { e.target.setPointerCapture(e.pointerId); } catch (_) { /* pointer capture unavailable */ }
      L.cursorTick();
    }
    [[lamp, 'lamp'], [scr, 'screen']].forEach(([g, k]) => {
      g.addEventListener('pointerdown', e => startDrag(k, e));
      g.addEventListener('keydown', e => {
        if (tut.on) return; const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
        e.preventDefault(); st.focus = k; move(k, (k === 'lamp' ? st.lamp : st.screen) + d * (e.shiftKey ? 1 : .1));
      });
    });
    svg.addEventListener('pointermove', e => { if (!st.drag || st.drag.id !== e.pointerId) return; const p = svgPoint(svg, e); move(st.drag.which, ICM(p.x) - st.drag.off); });
    const end = e => { if (st.drag && st.drag.id === e.pointerId) st.drag = null; };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    function move(which, cm) {
      cm = Math.round(cm * 100) / 100;
      if (which === 'lamp') st.lamp = clamp(cm, LAMP_MIN, LAMP_MAX); else st.screen = clamp(cm, SCR_MIN, SCR_MAX);
      update();
    }
    /* reading the scale: to the nearest 0.1 cm, as through the loupe */
    const r1 = v => Math.round(v * 10) / 10;
    function read() { return { lamp: r1(st.lamp), lens: r1(LENS.lensAt), screen: r1(st.screen) }; }
    const B = {
      st, svg, update, move, read, optics, say, X, AXY, VS, lensTag,
      setRays(on) { st.rays = !!on; update(); },
      setFocus(k) { st.focus = k; update(); },
      reset() { Object.assign(st, { lamp: 30, screen: 100, rays: false, focus: 'screen', drag: null }); update(); },
      /* boxes in drawing coordinates, for the tutorial spotlight */
      box: {
        rail: () => [RX0, 510, RX1 - RX0, 48], scale: () => [X(0) - 8, 519, X(120) - X(0) + 34, 31],
        lamp: () => [X(st.lamp) - 104, 284, 130, 272], object: () => [X(st.lamp) - 14, AXY - 34, 28, 68],
        lens: () => [X(LENS.lensAt) - 30, AXY - 72, 60, 180], lensTag: () => [X(LENS.lensAt) - 18, 458, 36, 20],
        screen: () => [X(st.screen) - 34, 298, 68, 254],
        riderLamp: () => [X(st.lamp) - 30, 490, 64, 62], riderScreen: () => [X(st.screen) - 30, 490, 64, 62], riderLens: () => [X(LENS.lensAt) - 30, 490, 64, 62],
        objInset: () => [16, 16, 206, 244], loupe: () => [236, 16, 328, 244], screenInset: () => [578, 16, 406, 244], card: () => [CX - 96, CY - 96, 192, 192], sharp: () => [SX - 6, 60, 172, 66],
        beam: () => [X(st.lamp), AXY - 60, X(st.screen) - X(st.lamp) + 20, 120]
      }
    };
    B.update(); return B;
  }

  /* ============================== distance-object scene ============================== */
  function distant() {
    const svg = $('dist-rig'), id = 'ds'; materials(svg, id); const gidv = LENS.glassDefs(svg);
    const D = 1000; /* window distance, cm */
    const st = { s: 24, drag: null };
    const XS = cm => 392 + cm * 12.6, IS = px => (px - 392) / 12.6, AY = 196;
    el('rect', { width: 1000, height: 330, fill: `url(#${id}-room)` }, svg);
    el('rect', { width: 1000, height: 330, fill: `url(#${id}-grain)`, opacity: .55 }, svg);
    /* the far wall and its window */
    const wall = el('g', null, svg);
    el('rect', { x: 0, y: 0, width: 300, height: 330, fill: '#2f342b' }, wall);
    el('rect', { x: 0, y: 0, width: 300, height: 330, fill: `url(#${id}-grain)`, opacity: .6 }, wall);
    const wx = 70, wy = 70, ww = 150, wh = 190;
    el('rect', { x: wx - 10, y: wy - 10, width: ww + 20, height: wh + 24, fill: '#cfc9b4' }, wall);
    const sky = el('linearGradient', { id: `${id}-sky`, x1: 0, y1: 0, x2: 0, y2: 1 }, svg.querySelector('defs'));
    [[0, '#d6e7ef'], [.6, '#f3f1e2'], [1, '#e9e4c9']].forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, sky));
    el('rect', { x: wx, y: wy, width: ww, height: wh, fill: `url(#${id}-sky)` }, wall);
    el('path', { d: `M${wx + 92} ${wy + wh} q4 -60 -10 -80 q-28 -6 -22 -34 q6 -30 34 -26 q20 -24 44 -2 q26 0 22 30 q12 26 -14 36 q-14 6 -30 2 q-8 24 -4 74 z`, fill: '#6f7f5b', opacity: .85 }, wall);
    el('rect', { x: wx + ww / 2 - 4, y: wy, width: 8, height: wh, fill: '#cfc9b4' }, wall);
    el('rect', { x: wx, y: wy + wh * .42 - 4, width: ww, height: 8, fill: '#cfc9b4' }, wall);
    el('rect', { x: wx - 14, y: wy + wh + 10, width: ww + 28, height: 8, fill: '#bdb6a0' }, wall);
    txt(wall, wx + ww / 2, 30, 'WINDOW · ABOUT 10 m AWAY', { 'text-anchor': 'middle', 'font-size': 10.5, 'font-family': F_CAP, 'font-weight': 600, 'letter-spacing': '.16em', fill: '#d6dccb' });
    /* light from the window, a long way off */
    const dbeam = el('path', { fill: WARM, opacity: .1, style: 'mix-blend-mode:screen' }, svg);
    el('path', { d: 'M300 196 h40 m8 -8 l-10 16 m14 -16 l-10 16 m8 -8 h34', stroke: '#c9cfbf', 'stroke-width': 1, fill: 'none', 'stroke-dasharray': '4 4' }, svg);
    /* table and metre rule */
    el('rect', { x: 300, y: 262, width: 700, height: 68, fill: `url(#${id}-table)` }, svg);
    el('rect', { x: 300, y: 262, width: 700, height: 68, fill: `url(#${id}-grain)`, opacity: .6 }, svg);
    el('rect', { x: 372, y: 266, width: 420, height: 22, fill: '#d9c99c', stroke: '#6b5a33', 'stroke-width': .8 }, svg);
    el('rect', { x: 372, y: 266, width: 420, height: 22, fill: `url(#${id}-grain)`, opacity: .45 }, svg);
    for (let k = 0; k <= 300; k++) { const x = XS(k / 10); if (x > 790) break; const big = k % 10 === 0, mid = k % 5 === 0; el('line', { x1: x, y1: 266, x2: x, y2: 266 + (big ? 9 : mid ? 6.5 : 3.6), stroke: '#2b2416', 'stroke-width': big ? .9 : .5 }, svg); if (big && k / 10 % 5 === 0) txt(svg, x, 285, String(k / 10), { 'text-anchor': 'middle', 'font-size': 8.5, 'font-family': F_BODY, 'font-weight': 600, fill: '#2b2416' }); }
    /* lens in a small stand at the zero of the rule */
    const lg = el('g', null, svg);
    el('rect', { x: XS(0) - 14, y: 258, width: 28, height: 10, rx: 2, fill: `url(#${id}-anod)` }, lg);
    post(lg, XS(0), 236, 260, id, 6);
    el('path', { d: `M${XS(0)} ${AY - 44} q-8 0 -8 8 v72 q0 8 8 8 q8 0 8 -8 v-72 q0 -8 -8 -8z`, fill: 'none', stroke: '#141614', 'stroke-width': 4 }, lg);
    LENS.drawLens(lg, XS(0), AY, 36, 6, gidv, { stroke: '#2f4a4e', sw: 1 });
    capLabel(lg, XS(0), 140, 'LENS');
    /* the screen card on a sliding foot */
    const card = el('g', { class: 'drag kfocus', tabindex: 0, role: 'slider', 'aria-label': 'Screen card. Arrow keys move it.' }, svg);
    el('rect', { x: -30, y: 130, width: 60, height: 160, fill: 'transparent' }, card);
    el('rect', { x: -16, y: 254, width: 32, height: 12, rx: 2, fill: `url(#${id}-anod)` }, card);
    el('rect', { x: -1, y: 266, width: 2, height: 22, fill: '#c8261b' }, card);
    post(card, 0, 240, 256, id, 5);
    const FACE = 'M-11 150 L11 156 L11 244 L-11 238 Z';
    el('path', { d: FACE, fill: `url(#${id}-card)`, stroke: '#151713', 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, card);
    capLabel(card, 0, 140, 'CARD');
    el('rect', { class: 'focus-ring', x: -30, y: 128, width: 60, height: 166, fill: 'none', stroke: C.acc, 'stroke-width': 2 }, card);
    /* inset: the card face with the window's image */
    const ix = 810, iw = 176;
    el('rect', { x: ix, y: 16, width: iw, height: 236, fill: `url(#${id}-inset)`, stroke: '#0c0e0a' }, svg);
    el('rect', { x: ix + .5, y: 16.5, width: iw - 1, height: 26, fill: '#000', opacity: .22 }, svg);
    txt(svg, ix + 12, 33.5, 'CARD · IMAGE', { 'font-size': 10.5, 'font-family': F_CAP, 'font-weight': 600, 'letter-spacing': '.18em', fill: '#d6dccb' });
    const KX = ix + iw / 2, KY = 132, KP = 20;
    el('rect', { x: KX - 74, y: KY - 74, width: 148, height: 148, fill: `url(#${id}-card)` }, svg);
    el('rect', { x: KX - 74, y: KY - 74, width: 148, height: 148, fill: `url(#${id}-grain)`, opacity: .5 }, svg);
    const dcp = el('clipPath', { id: `${id}-kc` }, svg.querySelector('defs')); el('rect', { x: KX - 74, y: KY - 74, width: 148, height: 148 }, dcp);
    const bf = el('filter', { id: `${id}-kb`, x: '-100%', y: '-100%', width: '300%', height: '300%' }, svg.querySelector('defs')); const bp = el('feGaussianBlur', { stdDeviation: .001 }, bf);
    /* window image in object centimetres (window 150 cm wide × 190 cm tall), scaled by m = s/D and inverted */
    const wi = el('g', { 'clip-path': `url(#${id}-kc)` }, svg);
    const wimg = el('g', { filter: `url(#${id}-kb)` }, wi);
    const inner = el('g', null, wimg);
    el('rect', { x: -75, y: -95, width: 150, height: 190, fill: '#fff4d8' }, inner);
    el('path', { d: 'M17 95 q4 -60 -10 -80 q-28 -6 -22 -34 q6 -30 34 -26 q20 -24 44 -2 q26 0 22 30 q12 26 -14 36 q-14 6 -30 2 q-8 24 -4 74 z', transform: 'translate(-75 -95) scale(1)', fill: '#b9ae84', opacity: .9 }, inner);
    el('rect', { x: -4, y: -95, width: 8, height: 190, fill: '#b5ad93' }, inner); el('rect', { x: -75, y: -19, width: 150, height: 8, fill: '#b5ad93' }, inner);
    txt(svg, ix + 12, 244, 'inverted, very small', { 'font-size': 9.5, 'font-family': F_BODY, fill: '#aeb5a2', 'font-style': 'italic' });
    const msg = $('dist-msg');
    function update() {
      card.setAttribute('transform', `translate(${XS(st.s).toFixed(2)} 0)`);
      const f = LENS.f, v = LENS.image(D, f), m = st.s / D, c = LENS.aperture * Math.abs(st.s - v) / v;
      inner.setAttribute('transform', `translate(${KX} ${KY}) scale(${(m * KP).toFixed(4)} ${(-m * KP).toFixed(4)})`);
      bp.setAttribute('stdDeviation', Math.max(.001, c / 2.4 * KP).toFixed(3));
      wimg.setAttribute('opacity', clamp(1 / (1 + c * c / 0.6), .25, 1).toFixed(3));
      const yE = [1.5, -1.5].map(e => AY - (e - e * st.s / f) * 14);
      dbeam.setAttribute('d', `M300 ${AY - 70} L${XS(0)} ${AY - 21} L${XS(st.s)} ${yE[0]} L${XS(st.s)} ${yE[1]} L${XS(0)} ${AY + 21} L300 ${AY + 70} Z`);
      const sharp = c <= LENS.sharpC; st.sharp = sharp;
      msg.className = 'rig-msg' + (sharp ? ' ok' : '');
      msg.innerHTML = sharp ? 'The window is sharp on the card: an inverted, much smaller image. The card is now about one focal length from the lens.' : 'Slide the card along the rule until the image of the window is sharp.';
      if (DS.onChange) DS.onChange();
    }
    card.addEventListener('pointerdown', e => { if (tut.on) return; e.preventDefault(); const p = svgPoint(svg, e); st.drag = { off: IS(p.x) - st.s, id: e.pointerId }; try { e.target.setPointerCapture(e.pointerId); } catch (_) { /* no capture */ } });
    svg.addEventListener('pointermove', e => { if (!st.drag || st.drag.id !== e.pointerId) return; const p = svgPoint(svg, e); move(IS(p.x) - st.drag.off); });
    const end = e => { if (st.drag && st.drag.id === e.pointerId) st.drag = null; }; svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    card.addEventListener('keydown', e => { if (tut.on) return; const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); move(st.s + d * (e.shiftKey ? 1 : .1)); });
    function move(s) { st.s = clamp(Math.round(s * 100) / 100, 5, 30); update(); }
    const DS = {
      st, svg, update, move, read: () => Math.round(st.s * 10) / 10,
      reset() { st.s = 24; st.drag = null; update(); },
      box: { wall: () => [0, 0, 300, 330], window: () => [56, 56, 178, 222], lens: () => [XS(0) - 26, 132, 52, 136], card: () => [XS(st.s) - 30, 128, 60, 166], rule: () => [368, 262, 428, 30], inset: () => [ix, 16, iw, 236], index: () => [XS(st.s) - 14, 250, 28, 42] }
    };
    update(); return DS;
  }
  L.BENCH = bench(); L.DIST = distant();
  void F_BODY;
})(window.SOL);
