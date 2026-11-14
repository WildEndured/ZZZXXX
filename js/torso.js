/* js/torso.js — Этап 2: грудная клетка */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Параметры по умолчанию
  const params = {
    chestWidth: 1.0,        // 0.5 … 1.5
    chestHeight: 1.0,       // 0.5 … 1.5
    chestTopTaper: 0.6,     // 0.1 … 0.9 (0.6 = верх уже низа в 2.5 раза)
    chestBottomExpand: 1.0, // 0.8 … 1.5
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });

  let els = null;

  function ensureDom() {
    if (els) return els;
    const torsoGroup = document.getElementById('torsoGroup');
    if (!torsoGroup) return null;

    // Опционально: создаём слой для сетки торса (не экспортируется)
    const headsLayer = document.getElementById('headsLayer');
    let grid = document.getElementById('torsoGridLayer');
    if (headsLayer && !grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'torsoGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }

    els = { torsoGroup, grid };
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

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;
    const topY = geo.topY + headH; // L5 (основание шеи)
    
    // Базовая высота торса = 2 головы (до L9)
    const baseTorsoH = headH * 2;
    const torsoH = baseTorsoH * params.chestHeight;
    
    // Базовая ширина (радиус по X)
    const baseRx = torsoH * 0.35;
    const rx = baseRx * params.chestWidth;

    // Сужение верха (чем больше taper, тем уже верх)
    // 0.1 = почти не сужается, 0.9 = сильно сужается
    const topHalfWidth = rx * (1 - params.chestTopTaper);
    
    // Расширение низа
    const bottomHalfWidth = rx * params.chestBottomExpand;
    
    // Критические точки по Y
    const topEdgeY = topY;
    const bottomEdgeY = topY + torsoH;
    const cy = topY + torsoH / 2;

    return {
      cx, topY, torsoH, cy,
      topHalfWidth, bottomHalfWidth, rx,
      topEdgeY, bottomEdgeY,
    };
  }

  function drawTorso(t) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    // Строим яйцевидный эллипс через кубические кривые Безье
    // Начинаем с верхней точки (cx, topEdgeY)
    // Идём вправо вниз до правой широкой части, затем до нижней точки (cx, bottomEdgeY)
    // Затем зеркально влево.
    
    const { cx, topEdgeY, bottomEdgeY, cy, topHalfWidth, bottomHalfWidth, torsoH } = t;

    // Управляющие точки для правой половины
    // Верхняя правая четверть (сужается к верху)
    const cp1x = cx + topHalfWidth * 0.8;
    const cp1y = topEdgeY + torsoH * 0.1;
    const cp2x = cx + bottomHalfWidth;
    const cp2y = cy - torsoH * 0.05;
    
    // Нижняя правая четверть (расширяется к низу)
    const cp3x = cx + bottomHalfWidth;
    const cp3y = cy + torsoH * 0.05;
    const cp4x = cx + bottomHalfWidth * 0.5;
    const cp4y = bottomEdgeY - torsoH * 0.1;

    // Левая половина (зеркально)
    const cp4Lx = cx - bottomHalfWidth * 0.5;
    const cp3Lx = cx - bottomHalfWidth;
    const cp2Lx = cx - bottomHalfWidth;
    const cp1Lx = cx - topHalfWidth * 0.8;

    const d = `
      M ${cx},${topEdgeY}
      C ${cp1x},${cp1y} ${cp2x},${cp2y} ${cx + bottomHalfWidth},${cy}
      C ${cp3x},${cp3y} ${cp4x},${cp4y} ${cx},${bottomEdgeY}
      C ${cp4Lx},${cp4y} ${cp3Lx},${cp3y} ${cx - bottomHalfWidth},${cy}
      C ${cp2Lx},${cp2y} ${cp1Lx},${cp1y} ${cx},${topEdgeY}
      Z
    `;

    torsoGroup.appendChild(svgEl('path', {
      d: d,
      fill: 'none',
    }));
  }

  function drawGrid(t) {
    if (!els.grid) return;
    clear(els.grid);

    // Осевая линия торса
    els.grid.appendChild(svgEl('line', {
      x1: t.cx, x2: t.cx,
      y1: t.topEdgeY, y2: t.bottomEdgeY,
      stroke: '#c0c4c9', 'stroke-width': 2,
      'stroke-dasharray': '8 12',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    const t = computeTorso(geo);
    drawTorso(t);
    drawGrid(t);
  }

  function getParams() { return { ...params }; }

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

  window.Torso = {
    update,
    getParams,
    setParams,
    resetParams,
    DEFAULT_PARAMS,
  };
})();
