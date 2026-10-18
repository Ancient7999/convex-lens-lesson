/* Optics shared by the bench, the figures and the worked example: the lens, materials and ray diagrams */
(function (L) {
  'use strict';
  const { el, txt, tsub, C, F_BODY, F_CAP } = L;
  const LENS = L.LENS = {
    f: 15.0,          /* focal length of the lens used on the bench, cm */
    label: 15,        /* the value printed on the holder, cm */
    aperture: 3.0,    /* clear diameter of the stop, cm: sets the depth of focus */
    sharpC: 0.05,     /* largest blur circle that still looks sharp, cm */
    lensAt: 55.0,     /* lens rider position on the bench, cm */
    rough: null, rough2: null, listeners: []
  };
  LENS.image = (u, f) => { f = f || LENS.f; return u > f + 1e-9 ? u * f / (u - f) : Infinity; };
  /* blur circle on a screen at distance s from the lens, for an object at u (all cm, real positive) */
  LENS.blur = (u, s, f) => {
    f = f || LENS.f; const A = LENS.aperture;
    if (u <= f + 1e-9) return A * (1 + s / Math.max(1e-6, u) - s / f) ; /* diverging beam: the patch only grows */
    const v = LENS.image(u, f); return A * Math.abs(s - v) / v;
  };
  LENS.onRough = fn => LENS.listeners.push(fn);
  LENS.setRough = (F) => { LENS.rough = F; LENS.rough2 = F == null ? null : +(2 * F).toFixed(1); LENS.listeners.forEach(fn => fn()); };

  /* the example data set: lens labelled 15 cm; lamp at fixed u; screen positions with small, seeded scatter */
  const EX = [
    { u: 45.0, v: 22.3 }, { u: 37.5, v: 25.2 }, { u: 33.0, v: 27.2 },
    { u: 30.0, v: 30.3 },
    { u: 25.0, v: 37.2 }, { u: 22.0, v: 47.5 }, { u: 20.0, v: 59.6 }
  ];
  LENS.EX = EX; LENS.EX_ROUGH = 15.2;
  LENS.group = (u, v) => (Math.abs(u - v) <= 1.0 ? 'eq' : u > v ? 'gt' : 'lt');
  LENS.row = (u, v) => { const iu = 1 / u, iv = 1 / v, iF = iu + iv; return { u, v, iu, iv, iF, F: 1 / iF }; };
  /* least-squares line through (1/u, 1/v) */
  LENS.fit = pts => {
    const n = pts.length; if (n < 2) return null;
    let sx = 0, sy = 0, sxx = 0, sxy = 0; pts.forEach(p => { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
    const b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
    return { a, b, xi: -a / b, yi: a };
  };

  /* ---------- glyphs and materials for SVG figures ---------- */
  /* a biconvex lens outline centred at (x, y), half-height h, half-thickness t */
  LENS.lensPath = (x, y, h, t) => `M${x} ${y - h} Q${x + 2 * t} ${y} ${x} ${y + h} Q${x - 2 * t} ${y} ${x} ${y - h} Z`;
  LENS.fGlyph = 'M-0.42 -1 H0.5 V-0.66 H-0.06 V-0.17 H0.36 V0.17 H-0.06 V1 H-0.42 Z'; /* the 'F' cut-out, 2 units tall, centred */
  let gid = 0;
  LENS.glassDefs = (svg) => {
    const d = svg.querySelector('defs') || el('defs', null, svg), id = 'gl' + (++gid);
    const g = el('linearGradient', { id: id + '-glass', x1: 0, y1: 0, x2: 1, y2: 0 }, d);
    [[0, '#6f9398', .75], [.18, '#cfe4e3', .55], [.42, '#f4fbf8', .35], [.62, '#d7e9e6', .4], [.85, '#9fc0c1', .6], [1, '#5f8489', .8]].forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, g));
    const h = el('linearGradient', { id: id + '-hi', x1: 0, y1: 0, x2: 0, y2: 1 }, d);
    [[0, '#ffffff', 0], [.25, '#ffffff', .85], [.5, '#ffffff', .15], [1, '#ffffff', 0]].forEach(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, h));
    return id;
  };
  LENS.drawLens = (g, x, y, h, t, gidv, o) => {
    o = o || {};
    el('path', { d: LENS.lensPath(x, y, h, t), fill: `url(#${gidv}-glass)`, stroke: o.stroke || '#3d5a5e', 'stroke-width': o.sw || 1.2 }, g);
    el('path', { d: `M${x - t * .35} ${y - h * .78} Q${x - t * .95} ${y - h * .2} ${x - t * .7} ${y + h * .25}`, fill: 'none', stroke: `url(#${gidv}-hi)`, 'stroke-width': Math.max(1.2, t * .28), 'stroke-linecap': 'round' }, g);
  };

  /* ---------- ray diagram: principal axis, lens, F and 2F on both sides, object, rays and image ---------- */
  /* o: x, y (axis), w (half-width of drawing), fpx (focal length in px), u (object distance in units of f), h (object height px) */
  LENS.rayDiagram = (svg, o) => {
    svg.innerHTML = ''; const gidv = LENS.glassDefs(svg);
    const g = el('g', null, svg), X0 = o.x, Y0 = o.y, f = o.fpx, u = o.u * f, h = o.h || 46, W = o.w;
    const AX = { stroke: C.ink, 'stroke-width': 1.3 }, RAY = { stroke: C.acc, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, RAY2 = { stroke: C.sec, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' };
    el('line', Object.assign({ x1: X0 - W, y1: Y0, x2: X0 + W, y2: Y0 }, AX), g);
    LENS.drawLens(g, X0, Y0, o.lh || 92, 9, gidv);
    [[-2, '2F'], [-1, 'F'], [1, 'F'], [2, '2F']].forEach(([k, s]) => {
      const x = X0 + k * f; if (Math.abs(x - X0) > W) return;
      el('line', { x1: x, y1: Y0 - 5, x2: x, y2: Y0 + 5, stroke: C.ink, 'stroke-width': 1.6 }, g);
      txt(g, x, Y0 + 22, s, { 'text-anchor': 'middle', 'font-size': 14, 'font-family': F_BODY, 'font-weight': 600, fill: C.ink2 });
    });
    const ox = X0 - u;
    const arrow = (x, y1, y2, col, dash) => {
      el('line', { x1: x, y1, x2: x, y2, stroke: col, 'stroke-width': 3, 'stroke-dasharray': dash ? '6 5' : null, 'stroke-linecap': 'round' }, g);
      const s = y2 < y1 ? -1 : 1; el('path', { d: `M${x - 6} ${y2 - s * 10} L${x} ${y2} L${x + 6} ${y2 - s * 10}`, fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': dash ? '6 5' : null }, g);
    };
    arrow(ox, Y0, Y0 - h, C.ink);
    if (o.labels !== false) txt(g, ox, Y0 - h - 10, 'object', { 'text-anchor': 'middle', 'font-size': 13, 'font-family': F_BODY, fill: C.muted, 'font-style': 'italic' });
    const right = X0 + W;
    if (Math.abs(u - f) < 1e-6) {
      /* object at F: parallel rays, image at infinity */
      el('path', Object.assign({ d: `M${ox} ${Y0 - h} L${X0} ${Y0 - h} L${right} ${Y0 - h - (right - X0) * h / f}` }, RAY), g);
      el('path', Object.assign({ d: `M${ox} ${Y0 - h} L${right} ${Y0 - h + (right - ox) * h / u}` }, RAY2), g);
      if (o.labels !== false) txt(g, right - 6, Y0 + 40, 'parallel rays: image at infinity', { 'text-anchor': 'end', 'font-size': 13, 'font-family': F_BODY, fill: C.acc2, 'font-style': 'italic' });
      return { g, v: Infinity };
    }
    const v = u * f / (u - f), hi = -h * v / u; /* v < 0: virtual */
    /* ray 1: parallel, then through the far focus */
    const r1 = (x) => Y0 - h + (x - X0) * h / f;
    el('path', Object.assign({ d: `M${ox} ${Y0 - h} L${X0} ${Y0 - h} L${right} ${r1(right)}` }, RAY), g);
    /* ray 2: through the optical centre, undeviated */
    const r2 = (x) => Y0 - h + (x - ox) * h / u;
    el('path', Object.assign({ d: `M${ox} ${Y0 - h} L${right} ${r2(right)}` }, RAY2), g);
    if (v > 0) {
      const ix = X0 + v;
      if (ix < right + 2) arrow(ix, Y0, Y0 - hi, C.acc2);
      if (o.labels !== false && ix < right) txt(g, ix, Y0 - hi + 22, 'image', { 'text-anchor': 'middle', 'font-size': 13, 'font-family': F_BODY, fill: C.acc2, 'font-style': 'italic' });
    } else {
      const ix = X0 + v; /* to the left of the lens */
      el('path', { d: `M${X0} ${Y0 - h} L${ix} ${Y0 - hi}`, stroke: C.acc, 'stroke-width': 1.4, 'stroke-dasharray': '4 5', fill: 'none' }, g);
      el('path', { d: `M${ox} ${Y0 - h} L${ix} ${Y0 - hi}`, stroke: C.sec, 'stroke-width': 1.4, 'stroke-dasharray': '4 5', fill: 'none' }, g);
      if (ix > X0 - W) { arrow(ix, Y0, Y0 - hi, C.acc2, true); if (o.labels !== false) txt(g, ix, Y0 - hi - 10, 'virtual image', { 'text-anchor': 'middle', 'font-size': 13, 'font-family': F_BODY, fill: C.acc2, 'font-style': 'italic' }); }
    }
    return { g, v };
  };
  void tsub; void F_CAP;
})(window.SOL);
