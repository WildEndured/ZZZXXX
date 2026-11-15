/* js/torso.js — Этап 2: Грудная клетка (Идеальный эллипс от T0 до T2) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestWidth: 0.9,      // Ширина (радиус по X)
    topNarrow: 0.4,       // Сужение верха (сжимает верхнюю половину)
    bottomExpand: 0.2,    // Расширение низа (растягивает нижнюю половину)
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });
  let els = null;

  function ensureDom() {
    if (els) return els;
    const torsoGroup = document.getElementById('torsoGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!torsoGroup || !headsLayer) return null;

    let grid = document.getElementById('torsoGridLayer');
    if (!grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'torsoGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }
    els = { torsoGroup, headsLayer, grid };
    return els;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;
    
    // Жесткие рамки от T0 до T2 (ровно 1 голова)
    const t0Y = geo.topY + headH; 
    const t2Y = t0Y + headH;
    
    // Центр эллипса строго посередине
    const cy = (t0Y + t2Y) / 2; 
    // Базовый радиус по Y (половина высоты)
    const baseRy = (t2Y - t0Y) / 2; 

    // Радиус по X (ширина)
    const maxRx = (params.chestWidth * headH) / 2;
    
    // Радиусы по X для верхней и нижней половин
    // Верх сужается (уменьшаем X), низ расширяется (увеличиваем X)
    const topRx = maxRx * (1 - params.topNarrow * 0.8);
    const botRx = maxRx * (1 + params.bottomExpand * 0.5);
    
    // Радиусы по Y (чтобы они вписывались ровно в T0 и T2)
    const topRy = baseRy;
    const botRy = baseRy;

    return { headH, t0Y, t2Y, midY: cy, cx, topRx, botRx, topRy, botRy };
  }

  function drawGrid(h) {
    const { grid } = els;
    clear(grid);

    const lineX1 = h.cx - h.headH * 0.75;
    const lineX2 = h.cx + h.headH * 0.75;

    const lines = [
      { y: h.t0Y, label: 'T0' },
      { y: h.midY, label: 'T1' },
      { y: h.t2Y, label: 'T2' },
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
  }

  function drawTorso(h) {
    const { torsoGroup, grid } = els;
    clear(torsoGroup);

    // Рисуем верхнюю половину (дуга сверху)
    // От левого бока (cx - topRx, cy) до правого бока (cx + topRx, cy) через верх (cx, t0Y)
    const dTop = `
      M ${h.cx - h.topRx} ${h.midY}
      A ${h.topRx} ${h.topRy} 0 0 1 ${h.cx + h.topRx} ${h.midY}
    `;

    // Рисуем нижнюю половину (дуга снизу)
    // От правого бока (cx + botRx, cy) до левого бока (cx - botRx, cy) через низ (cx, t2Y)
    const dBot = `
      M ${h.cx + h.botRx} ${h.midY}
      A ${h.botRx} ${h.botRy} 0 0 1 ${h.cx - h.botRx} ${h.midY}
    `;

    torsoGroup.appendChild(svgEl('path', {
      d: dTop.replace(/\s+/g, ' ').trim(),
      fill: 'none',
    }));

    torsoGroup.appendChild(svgEl('path', {
      d: dBot.replace(/\s+/g, ' ').trim(),
      fill: 'none',
    }));

    // Маркеры
    const mR = h.headH * 0.012;
    const debugPoints = [
      { x: h.cx, y: h.t0Y, c: '#dc2626' },          // Верх (T0)
      { x: h.cx + h.topRx, y: h.midY, c: '#2563eb' }, // Право верх
      { x: h.cx - h.topRx, y: h.midY, c: '#2563eb' }, // Лево верх
      { x: h.cx, y: h.t2Y, c: '#16a34a' },          // Низ (T2)
      { x: h.cx + h.botRx, y: h.midY, c: '#ea580c' }, // Право низ
      { x: h.cx - h.botRx, y: h.midY, c: '#ea580c' }, // Лево низ
    ];
    
    for (const pt of debugPoints) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: mR,
        fill: pt.c, opacity: 0.85,
      }));
    }
  }

  function update(geo) {
    if (!ensureDom()) return;
    const h = computeTorso(geo);
    drawGrid(h);
    drawTorso(h);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  window.Torso = { update, getParams, setParams, resetParams, DEFAULT_PARAMS };
})();
