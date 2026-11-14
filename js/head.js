/* js/head.js — Этап 2, шаг 1: круг головы */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Опорные доли от headH (базовая математическая сетка)
  const L0_BASE = 0 / 5;   // макушка
  const L3_BASE = 3 / 5;   // низ круга
  const MIN_GAP = 0.5;     // минимальный зазор L3 - L0 в долях headH

  // Параметры головы (пока только круг)
  const params = {
    // Сдвиги опорных линий в долях headH
    topShift: 0,      // L0: 0 … 0.20
    bottomShift: 0,   // L3: -0.20 … 0.20
    // Множители
    widthMul: 1.0,    // по X: 0.5 … 1.5
    radiusMul: 1.0,   // общий: 0.5 … 1.5
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });

  // DOM-кэш заполняется при первом update
  let els = null;

  function ensureDom() {
    if (els) return els;
    const headGroup = document.getElementById('headGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!headGroup || !headsLayer) return null;

    // Группа для отладочной сетки головы (не экспортируется)
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

  /**
   * Вычисляем геометрию головы в SVG-координатах.
   * @param {object} geo — результат computeGeometry() из main.js
   * @returns {object} { headH, topY, cx, l0, l3, cy, rx, ry }
   */
  function computeHead(geo) {
    const headH = geo.headHeight;
    const topY = geo.topY;
    const cx = geo.centerX;

    // Абсолютные Y опорных линий
    let l0 = topY + L0_BASE * headH + params.topShift * headH;
    let l3 = topY + L3_BASE * headH + params.bottomShift * headH;

    // Гарантируем минимальный зазор
    if (l3 - l0 < MIN_GAP * headH) {
      // Раздвигаем симметрично вокруг середины
      const mid = (l0 + l3) / 2;
      l0 = mid - (MIN_GAP * headH) / 2;
      l3 = mid + (MIN_GAP * headH) / 2;
    }

    const cy = (l0 + l3) / 2;
    const ry = ((l3 - l0) / 2) * params.radiusMul;
    const rx = ry * params.widthMul;

    return { headH, topY, cx, l0, l3, cy, rx, ry };
  }

  function drawGrid(h) {
    const { grid } = els;
    clear(grid);

    const lineX1 = h.cx - h.headH * 0.75;
    const lineX2 = h.cx + h.headH * 0.75;

    // Горизонтальные линии L0, L1, L2, L3 (L1, L2 — производные от L0/L3)
    const ys = [
      { y: h.l0, label: 'L0' },
      { y: h.l0 + (h.l3 - h.l0) / 3, label: 'L1' },
      { y: h.l0 + (2 * (h.l3 - h.l0)) / 3, label: 'L2' },
      { y: h.l3, label: 'L3' },
    ];

    for (const { y, label } of ys) {
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

    // Осевая линия по центру
    grid.appendChild(svgEl('line', {
      x1: h.cx, x2: h.cx,
      y1: h.l0 - h.headH * 0.05,
      y2: h.l3 + h.headH * 0.05,
      stroke: '#c0c4c9', 'stroke-width': 2,
      'stroke-dasharray': '8 12',
    }));
  }

  function drawHead(h) {
    const { headGroup } = els;
    clear(headGroup);

    const ellipse = svgEl('ellipse', {
      cx: h.cx,
      cy: h.cy,
      rx: h.rx,
      ry: h.ry,
      fill: 'none',
    });
    headGroup.appendChild(ellipse);
  }

  /**
   * Главная точка входа — вызывается из main.js на каждую перерисовку.
   * @param {object} geo
   */
  function update(geo) {
    if (!ensureDom()) return;
    const h = computeHead(geo);
    drawGrid(h);
    drawHead(h);
  }

  function getParams() {
    return { ...params };
  }

  /**
   * Частичное обновление параметров. Неизвестные ключи игнорируются.
   * @param {object} patch
   */
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
