/* js/head.js — Этап 2, шаг 2: круг + подбородок */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Базовые доли от headH
  const L0_BASE = 0 / 5;   // макушка
  const L3_BASE = 3 / 5;   // низ круга
  const L4_BASE = 4 / 5;   // линия подбородка
  const L5_BASE = 5 / 5;   // основание шеи

  const MIN_GAP_L0_L3 = 0.5;   // минимальный зазор L3 - L0 (в долях headH)
  const MIN_GAP_L3_L4 = 0.05;  // минимальный зазор L4 - L3
  const MIN_GAP_L4_L5 = 0.05;  // минимальный зазор L5 - L4

  // Параметры головы
  const params = {
    // Круг
    topShift: 0,        // L0, в долях headH: 0 … 0.20
    bottomShift: 0,     // L3, в долях headH: -0.20 … 0.20
    widthMul: 1.0,      // по X: 0.5 … 1.5
    radiusMul: 1.0,     // общий: 0.5 … 1.5

    // Подбородок
    chinHeightShift: 0, // L4, в долях headH: -0.15 … 0.15
    chinWidth: 0.30,    // в долях headH: 0.10 … 0.60
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

  /**
   * Геометрия головы в SVG-координатах.
   */
  function computeHead(geo) {
    const headH = geo.headHeight;
    const topY = geo.topY;
    const cx = geo.centerX;
    const bottomY = topY + headH;

    // --- L0 / L3 (круг) ---
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

    // --- L4 (подбородок) ---
    // База: 4/5 headH + сдвиг. Клип по L3 (снизу) и по L5 (сверху).
    let l4 = topY + L4_BASE * headH + params.chinHeightShift * headH;
    const l4Min = l3 + MIN_GAP_L3_L4 * headH;
    const l4Max = bottomY - MIN_GAP_L4_L5 * headH;
    if (l4 < l4Min) l4 = l4Min;
    if (l4 > l4Max) l4 = l4Max;
    // На случай, если l4Min > l4Max (круг «съел» подбородок) — берём середину
    if (l4Min > l4Max) l4 = (l3 + bottomY) / 2;

    // --- Ширина подбородка ---
    // База: chinWidth * headH. Клип по силуэту круга (rx * 1.1),
    // чтобы подбородок не вылезал за голову.
    let chinHalf = (params.chinWidth * headH) / 2;
    const chinHalfMax = Math.max(rx * 1.1, headH * 0.05);
    if (chinHalf > chinHalfMax) chinHalf = chinHalfMax;

    const chinLeftX = cx - chinHalf;
    const chinRightX = cx + chinHalf;

    return {
      headH, topY, bottomY, cx,
      l0, l3, l4,
      cy, rx, ry,
      chinY: l4,
      chinLeftX, chinRightX,
    };
  }

  function drawGrid(h) {
    const { grid } = els;
    clear(grid);

    const lineX1 = h.cx - h.headH * 0.75;
    const lineX2 = h.cx + h.headH * 0.75;

    // L0..L3 — производные от круга; L4 — своя линия; L5 — основание шеи
    const lines = [
      { y: h.l0, label: 'L0' },
      { y: h.l0 + (h.l3 - h.l0) / 3, label: 'L1' },
      { y: h.l0 + (2 * (h.l3 - h.l0)) / 3, label: 'L2' },
      { y: h.l3, label: 'L3' },
      { y: h.l4, label: 'L4' },
      { y: h.topY + (L5_BASE * h.headH), label: 'L5' },
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

    // Осевая линия
    grid.appendChild(svgEl('line', {
      x1: h.cx, x2: h.cx,
      y1: h.topY,
      y2: h.bottomY,
      stroke: '#c0c4c9', 'stroke-width': 2,
      'stroke-dasharray': '8 12',
    }));
  }

  function drawHead(h) {
    const { headGroup } = els;
    clear(headGroup);

    // Круг
    headGroup.appendChild(svgEl('ellipse', {
      cx: h.cx,
      cy: h.cy,
      rx: h.rx,
      ry: h.ry,
      fill: 'none',
    }));

    // Подбородок
    headGroup.appendChild(svgEl('line', {
      x1: h.chinLeftX,
      y1: h.chinY,
      x2: h.chinRightX,
      y2: h.chinY,
      fill: 'none',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    const h = computeHead(geo);
    drawGrid(h);
    drawHead(h);
  }

  function getParams() {
    return { ...params };
  }

  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) {
        params[k] = patch[k];
      }
    }
  }

  function resetParams() {
    Object.assign(params, DEFAULT_PARAMS);
  }

  window.Head = {
    update,
    getParams,
    setParams,
    resetParams,
    DEFAULT_PARAMS,
  };
})();
