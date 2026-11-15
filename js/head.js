/* js/head.js — Адаптация эталонной архитектуры (с округлением челюсти) */

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

    jawAttach: 0.20,
    jawLength: 0.35,
    jawAngleWidth: -0.30,
    jawRound: 0, // НОВЫЙ ПАРАМЕТР: 0 = угловатая челюсть, 1 = максимально скругленная
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

    // --- Эллипс ---
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

    // --- Подбородок ---
    let l4 = topY + L4_BASE * headH + params.chinHeightShift * headH;
    const l4Min = l3 + MIN_GAP_L3_L4 * headH;
    const l4Max = bottomY - MIN_GAP_L4_L5 * headH;
    if (l4 < l4Min) l4 = l4Min;
    if (l4 > l4Max) l4 = l4Max;
    if (l4Min > l4Max) l4 = (l3 + bottomY) / 2;

    let chinHalf = (params.chinWidth * headH) / 2;
    const chinHalfMax = Math.max(rx * 1.1, headH * 0.05);
    if (chinHalf > chinHalfMax) chinHalf = chinHalfMax;

    const chinLeftX = cx - chinHalf;
    const chinRightX = cx + chinHalf;

    // --- Челюсть (логика из твоего кода) ---
    const attachRatio = clamp(params.jawAttach, -0.98, 0.98);
    const baseTheta = Math.asin(attachRatio); 
    
    // Находим точку на эллипсе
    const attachRightX = cx + rx * Math.cos(baseTheta);
    const attachRightY = cy + ry * Math.sin(baseTheta);
    const attachLeftX = cx + rx * Math.cos(Math.PI - baseTheta);
    const attachLeftY = cy + ry * Math.sin(Math.PI - baseTheta);

    // Длина спуска и сдвиг угла
    const distToChin = l4 - attachRightY;
    const verticalDrop = Math.max(0, distToChin * params.jawLength);
    const angleShift = params.jawAngleWidth * (rx * 2); // используем полную ширину, как в твоем коде (headW)

    // Промежуточные точки (углы)
    const midLeft = { x: attachLeftX - angleShift, y: attachLeftY + verticalDrop };
    const midRight = { x: attachRightX + angleShift, y: attachRightY + verticalDrop };
    
    // Точки подбородка
    const bottomLeft = { x: chinLeftX, y: l4 };
    const bottomRight = { x: chinRightX, y: l4 };

    return {
      headH, topY, bottomY, cx,
      l0, l3, l4, cy, rx, ry,
      chinY: l4, chinLeftX, chinRightX,
      jaw: {
        attachLeft: { x: attachLeftX, y: attachLeftY },
        attachRight: { x: attachRightX, y: attachRightY },
        midLeft, midRight,
        bottomLeft, bottomRight,
        verticalDrop,
        angleShift
      }
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
        stroke: '#9aa0a6', 'stroke-width': 2,
        'stroke-dasharray': '16 12',
      }));
      const t = svgEl('text', {
        x: lineX1 - 12, y: y + 8,
        'text-anchor': 'end',
        'font-size': 28,
        'font-family': 'system-ui, sans-serif',
        fill: '#9aa0a6',
      });
      t.textContent = label;
      grid.appendChild(t);
    }

    grid.appendChild(svgEl('line', {
      x1: h.cx, x2: h.cx,
      y1: h.topY, y2: h.bottomY,
      stroke: '#c0c4c9', 'stroke-width': 2,
      'stroke-dasharray': '8 12',
    }));
  }

  function drawHead(h) {
    const { headGroup } = els;
    clear(headGroup);

    // 1. Эллипс
    headGroup.appendChild(svgEl('ellipse', {
      cx: h.cx, cy: h.cy, rx: h.rx, ry: h.ry, fill: 'none',
    }));

    // 2. Подбородок
    headGroup.appendChild(svgEl('line', {
      x1: h.chinLeftX, y1: h.chinY,
      x2: h.chinRightX, y2: h.chinY,
      fill: 'none',
    }));

    // 3. Челюсть с округлением (как в твоем коде)
    const { attachLeft, attachRight, midLeft, midRight, bottomLeft, bottomRight, verticalDrop } = h.jaw;
    
    let pathData = '';
    const roundFactor = params.jawRound;

    if (roundFactor > 0.01) {
      // Контрольные точки для Безье
      const cp1Left = { x: attachLeft.x, y: attachLeft.y + verticalDrop * 0.6 };
      const cp1Right = { x: attachRight.x, y: attachRight.y + verticalDrop * 0.6 };
      const cp2Left = { x: bottomLeft.x, y: bottomLeft.y - verticalDrop * 0.4 };
      const cp2Right = { x: bottomRight.x, y: bottomRight.y - verticalDrop * 0.4 };

      const c1L = { x: attachLeft.x + (cp1Left.x - attachLeft.x) * roundFactor, y: attachLeft.y + (cp1Left.y - attachLeft.y) * roundFactor };
      const c2L = { x: midLeft.x + (cp2Left.x - midLeft.x) * roundFactor, y: midLeft.y + (cp2Left.y - midLeft.y) * roundFactor };
      const c1R = { x: attachRight.x + (cp1Right.x - attachRight.x) * roundFactor, y: attachRight.y + (cp1Right.y - attachRight.y) * roundFactor };
      const c2R = { x: midRight.x + (cp2Right.x - midRight.x) * roundFactor, y: midRight.y + (cp2Right.y - midRight.y) * roundFactor };

      pathData = `
        M ${attachLeft.x} ${attachLeft.y}
        C ${c1L.x} ${c1L.y}, ${c2L.x} ${c2L.y}, ${bottomLeft.x} ${bottomLeft.y}
        M ${attachRight.x} ${attachRight.y}
        C ${c1R.x} ${c1R.y}, ${c2R.x} ${c2R.y}, ${bottomRight.x} ${bottomRight.y}
      `;
    } else {
      // Прямые линии (угловатая челюсть)
      pathData = `
        M ${attachLeft.x} ${attachLeft.y}
        L ${midLeft.x} ${midLeft.y}
        L ${bottomLeft.x} ${bottomLeft.y}
        M ${attachRight.x} ${attachRight.y}
        L ${midRight.x} ${midRight.y}
        L ${bottomRight.x} ${bottomRight.y}
      `;
    }

    headGroup.appendChild(svgEl('path', {
      d: pathData.replace(/\s+/g, ' ').trim(),
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

  window.Head = { update, getParams, setParams, resetParams, DEFAULT_PARAMS };
})();
