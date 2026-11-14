/* js/torso.js — Этап 2: торс (грудная клетка + таз) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Параметры по умолчанию (только для грудной клетки)
  const params = {
    chestWidth: 1.0,        // 0.5 … 1.5
    chestHeight: 1.0,       // 0.5 … 1.5
    chestTopTaper: 0.6,     // 0.1 … 0.9
    chestBottomExpand: 1.0, // 0.8 … 1.5
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
    const topY = geo.topY + headH; // L5
    const torsoH = headH;          // от L5 до L10
    
    // Базовая ширина яйца (в процентах от высоты головы)
    const baseRx = headH * 0.35;
    const rx = baseRx * params.chestWidth;

    // Параметры формы яйца
    const topHalfWidth = rx * (1 - params.chestTopTaper);
    const bottomHalfWidth = rx * params.chestBottomExpand;
    const actualH = torsoH * params.chestHeight;
    
    const cy = topY + actualH / 2;
    const bottomY = topY + actualH;

    return {
      cx, topY, bottomY, actualH, cy,
      topHalfWidth, bottomHalfWidth, rx,
    };
  }

  function drawTorso(t) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    const { cx, topY, bottomY, actualH, cy, topHalfWidth, bottomHalfWidth } = t;

    // 1. Грудная клетка (яйцо)
    // Управляющие точки для правой половины
    const cp1x = cx + topHalfWidth * 0.8;
    const cp1y = topY + actualH * 0.1;
    const cp2x = cx + bottomHalfWidth;
    const cp2y = cy - actualH * 0.05;
    
    const cp3x = cx + bottomHalfWidth;
    const cp3y = cy + actualH * 0.05;
    const cp4x = cx + bottomHalfWidth * 0.5;
    const cp4y = bottomY - actualH * 0.1;

    const cp4Lx = cx - bottomHalfWidth * 0.5;
    const cp3Lx = cx - bottomHalfWidth;
    const cp2Lx = cx - bottomHalfWidth;
    const cp1Lx = cx - topHalfWidth * 0.8;

    const d = `
      M ${cx},${topY}
      C ${cp1x},${cp1y} ${cp2x},${cp2y} ${cx + bottomHalfWidth},${cy}
      C ${cp3x},${cp3y} ${cp4x},${cp4y} ${cx},${bottomY}
      C ${cp4Lx},${cp4y} ${cp3Lx},${cp3y} ${cx - bottomHalfWidth},${cy}
      C ${cp2Lx},${cp2y} ${cp1Lx},${cp1y} ${cx},${topY}
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
