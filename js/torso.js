/* js/torso.js — Этап 2: торс (грудная клетка) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestWidth: 1.0,        // 0.5 … 1.5 (общая ширина)
    chestHeight: 1.0,       // 0.5 … 1.5 (высота)
    chestTopTaper: 0.4,     // 0.1 … 0.9 (насколько узкий верх, 0.4 = умеренно)
    chestBottomExpand: 1.0, // 0.8 … 1.5 (насколько широкий низ)
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });

  let els = null;

  function ensureDom() {
    if (els) return els;
    const torsoGroup = document.getElementById('torsoGroup');
    if (!torsoGroup) return null;

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
    
    // Область торса: от L5 до L10 (высота ровно одна голова)
    const topY = geo.topY + headH; 
    const baseTorsoH = headH;      
    const torsoH = baseTorsoH * params.chestHeight;
    
    // Базовая ширина (радиус по X)
    const baseRx = headH * 0.35;
    const rx = baseRx * params.chestWidth;

    // Ширина в самой широкой части (чуть ниже середины)
    const bottomHalfWidth = rx * params.chestBottomExpand;
    
    // Ширина верхней части (где шея)
    const topHalfWidth = bottomHalfWidth * (1 - params.chestTopTaper);
    
    const bottomY = topY + torsoH;
    
    // Центр для кривых Безье (смещен вниз, чтобы яйцо было тяжелее к низу)
    const cy = topY + torsoH * 0.6;

    return {
      cx, topY, bottomY, torsoH, cy,
      topHalfWidth, bottomHalfWidth,
    };
  }

  function drawTorso(t) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    const { cx, topY, bottomY, torsoH, topHalfWidth, bottomHalfWidth } = t;

    // Формируем идеальное "яйцо":
    // 1. Верхняя дуга (полуэллипс от левого верха до правого верха)
    // 2. Правая сторона (плавно расширяется к низу)
    // 3. Нижняя дуга (плоская)
    // 4. Левая сторона (плавно сужается к верху)
    
    // Коэффициент для контрольных точек Безье
    const k = 0.552; 
    
    // Верхняя дуга (эллипс)
    const topRy = torsoH * 0.35; // Высота верхней скругленной части
    const dTop = `
      M ${cx - topHalfWidth}, ${topY + topRy}
      C ${cx - topHalfWidth}, ${topY + topRy - topRy * k}, ${cx - topHalfWidth * k}, ${topY}, ${cx}, ${topY}
      C ${cx + topHalfWidth * k}, ${topY}, ${cx + topHalfWidth}, ${topY + topRy - topRy * k}, ${cx + topHalfWidth}, ${topY + topRy}
    `;

    // Правая сторона (от верхнего скругления вниз до самой широкой точки)
    const midY = topY + torsoH * 0.75;
    const dRight = `
      C ${cx + topHalfWidth}, ${topY + topRy + (midY - topY - topRy) * 0.5}, ${cx + bottomHalfWidth}, ${midY - (midY - topY - topRy) * 0.5}, ${cx + bottomHalfWidth}, ${midY}
    `;

    // Нижняя дуга (плоская, соединяет правый и левый низ)
    // Используем квадратичную кривую для более плоского низа
    const dBottom = `
      Q ${cx}, ${bottomY + torsoH * 0.05} ${cx - bottomHalfWidth}, ${midY}
    `;

    // Левая сторона (зеркально правой)
    const dLeft = `
      C ${cx - bottomHalfWidth}, ${midY - (midY - topY - topRy) * 0.5}, ${cx - topHalfWidth}, ${topY + topRy + (midY - topY - topRy) * 0.5}, ${cx - topHalfWidth}, ${topY + topRy}
    `;

    const d = dTop + dRight + dBottom + dLeft + ' Z';

    torsoGroup.appendChild(svgEl('path', {
      d: d,
      fill: 'none',
    }));
  }

  function drawGrid(t) {
    if (!els.grid) return;
    clear(els.grid);

    els.grid.appendChild(svgEl('line', {
      x1: t.cx, x2: t.cx,
      y1: t.topY, y2: t.bottomY,
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
