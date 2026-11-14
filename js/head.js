/* js/head.js */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const L0_BASE = 0 / 5;
  const L3_BASE = 3 / 5;
  const L4_BASE = 4 / 5;
  const L5_BASE = 5 / 5;

  const MIN_GAP_L0_L3 = 0.5;
  const MIN_GAP_L3_L4 = 0.05;
  const MIN_GAP_L4_L5 = 0.05;

  const params = {
    topShift: 0,
    bottomShift: 0,
    widthMul: 1.0,
    radiusMul: 1.0,
    chinHeightShift: 0,
    chinWidth: 0.10,
    jawAttach: 0.5,
    jawLength: 0.35,
    jawAngleWidth: -0.08,
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });

  let els = null;

  function ensureDom() {
    if (els) return els;
    const headGroup = document.getElementById('headGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!headGroup || !headsLayer) return null;

    let grid = document.getElementById('headGridLayer');
    if (!grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'headGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }

    els = { headGroup, headsLayer, grid };
    return els;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) {
      for (const k in attrs) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function computeHead(geo) {
    const headH = geo.headHeight;
    const topY = geo.topY;
    const cx = geo.centerX;
    const bottomY = topY + headH;

    let l0 = topY + L0_BASE * headH + params.topShift * headH;
    let l3 = topY + L3_BASE * headH + params.bottomShift * headH;
    if (l3 - l0 < MIN_GAP_L0_L3 * headH) {
      const mid = (l0 + l3) / 2;
      l0 = mid - (MIN_GAP_L0_L3 * headH) / 2;
      l3 = mid + (MIN_GAP_L0_L3 * headH) / 2;
    }

    const cy = (l0 + l3) / 2;
    const ry = ((l3 - l0) / 2) * params.radiusMul;
    const rx = ry * params.widthMul;

    let l4 = topY + L4_BASE * headH + params.chinHeightShift * headH;
    const l4Min = l3 + MIN_GAP_L3_L4 * headH;
    const l4Max = bottomY - MIN_GAP_L4_L5 * headH;
    if (l4 < l4Min) l4 = l4Min;
    if (l4 > l4Max) l4 = l4Max;
    if (l4Min > l4Max) l4 = (l3 + bottomY) / 2;

    let chinHalf = (params.chinWidth * headH) / 2;
    const chinHalfMax = Math.max(rx * 1.5, headH * 0.05);
    if (chinHalf > chinHalfMax) chinHalf = chinHalfMax;

    const chinLeftX = cx - chinHalf;
    const chinRightX = cx + chinHalf;

    const attachRatio = clamp(params.jawAttach, -0.98, 0.98);
    const baseTheta = Math.asin(attachRatio); 
    const angleDX = params.jawAngleWidth * rx; 

    const maxJawLen = Math.max(0, (l4 - cy) / headH - 0.05);
    const jawLen = Math.min(params.jawLength, maxJawLen);
    const jawDY = jawLen * headH;

    function getJawSide(sign) {
      const theta = sign === 1 ? baseTheta : Math.PI - baseTheta;
      const attachX = cx + sign * rx * Math.abs(Math.cos(theta));
      const attachY = cy + ry * Math.sin(theta);
      const angleX = clamp(attachX + sign * angleDX, cx - rx * 1.2, cx + rx * 1.2);
      const angleY = attachY + jawDY;
      return {
        attach: { x: attachX, y: attachY },
        angle: { x: angleX, y: angleY },
        chin: { x: sign === 1 ? chinRightX : chinLeftX, y: l4 }
      };
    }

    const right = getJawSide(1);
    const left = getJawSide(-1);

    return {
      headH, topY, bottomY, cx, l0, l3, l4, cy, rx, ry,
      chinY: l4, chinLeftX, chinRightX,
      jaw: {
        attachRight: right.attach,
        attachLeft: left.attach,
        angleRight: right.angle,
        angleLeft: left.angle,
        chinRight: right.chin,
        chinLeft: left.chin,
      },
    };
  }

  function drawGrid(h) {
    const { grid } = els;
    clear(grid);

    const lineX1 = h.cx - h.headH * 0.75;
    const lineX2 = h.cx + h.headH * 0.75;

    const lines = [
      { y: h.l0, label: 'L0' },
      { y: h.l0 + (h.l3 - h.l0) / 3, label: 'L1' },
      { y: h.l0 + (2 * (h.l3 - h.l0)) / 3, label: 'L2' },
      { y: h.l3, label: 'L3' },
      { y: h.l4, label: 'L4' },
      { y: h.topY + L5_BASE * h.headH, label: 'L5' },
    ];

    for (const { y, label } of lines) {
      grid.appendChild(svgEl('line', {
        x1: lineX1, x2: lineX2, y1: y, y2: y,
        stroke: '#9aa0a6', 'stroke-width': 2, 'stroke-dasharray': '16 12',
      }));
      const t = svgEl('text', {
        x: lineX1 - 12, y: y + 8, 'text-anchor': 'end',
        'font-size': 28, 'font-family': 'system-ui, sans-serif', fill: '#9aa0a6',
      });
      t.textContent = label;
      grid.appendChild(t);
    }

    grid.appendChild(svgEl('line', {
      x1: h.cx, x2: h.cx, y1: h.topY, y2: h.bottomY,
      stroke: '#c0c4c9', 'stroke-width': 2, 'stroke-dasharray': '8 12',
    }));

    const mR = h.headH * 0.012;
    const points = [
      { p: h.jaw.attachRight, color: '#2563eb' },
      { p: h.jaw.attachLeft, color: '#2563eb' },
      { p: h.jaw.angleRight, color: '#dc2626' },
      { p: h.jaw.angleLeft, color: '#dc2626' },
    ];
    for (const { p, color } of points) {
      grid.appendChild(svgEl('circle', {
        cx: p.x, cy: p.y, r: mR, fill: color, opacity: 0.85,
      }));
    }
  }

  function drawHead(h) {
    const { headGroup } = els;
    clear(headGroup);

    headGroup.appendChild(svgEl('ellipse', {
      cx: h.cx, cy: h.cy, rx: h.rx, ry: h.ry, fill: 'none',
    }));

    headGroup.appendChild(svgEl('line', {
      x1: h.chinLeftX, y1: h.chinY, x2: h.chinRightX, y2: h.chinY, fill: 'none',
    }));

    const r = h.jaw;
    headGroup.appendChild(svgEl('polyline', {
      points: `${r.attachRight.x},${r.attachRight.y} ${r.angleRight.x},${r.angleRight.y} ${r.chinRight.x},${r.chinRight.y}`,
      fill: 'none',
    }));
    headGroup.appendChild(svgEl('polyline', {
      points: `${r.attachLeft.x},${r.attachLeft.y} ${r.angleLeft.x},${r.angleLeft.y} ${r.chinLeft.x},${r.chinLeft.y}`,
      fill: 'none',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    const h = computeHead(geo);
    drawGrid(h);
    drawHead(h);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  window.Head = {
    update, getParams, setParams, resetParams, DEFAULT_PARAMS,
  };
})();
