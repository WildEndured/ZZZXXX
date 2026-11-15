/* js/torso.js — Этап 2: Грудная клетка */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestWidth: 1.0,      // Ширина (доля от headH)
    chestHeight: 0.8,     // Высота (доля от headH)
    topNarrow: 0.3,       // Сужение верха (0…1)
    bottomExpand: 0.2,    // Расширение низа (0…1)
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

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;
    
    // Верх грудной клетки начинается от основания шеи (L5 головы)
    const topY = geo.topY + headH; 

    const chestH = params.chestHeight * headH;
    const chestW = params.chestWidth * headH;
    
    // Базовые точки
    const maxHalfW = chestW / 2;
    const midY = topY + chestH / 2;
    const bottomY = topY + chestH;

    // Коэффициенты для верхней и нижней дуг
    // Если topNarrow = 0 -> верхний радиус = maxHalfW (ровный овал)
    // Если topNarrow = 1 -> верхний радиус = 0 (острый верх)
    const topHalfW = maxHalfW * (1 - params.topNarrow * 0.9); 
    
    // Если bottomExpand = 0 -> нижний радиус = maxHalfW (ровный овал)
    // Если bottomExpand = 1 -> нижний радиус = maxHalfW * 1.2 (широкий низ)
    const bottomHalfW = maxHalfW * (1 + params.bottomExpand * 0.5);

    return {
      headH, topY, cx,
      chestH, chestW,
      midY, bottomY,
      maxHalfW, topHalfW, bottomHalfW
    };
  }

  function drawGrid(h) {
    const { grid } = els;
    clear(grid);

    const lineX1 = h.cx - h.headH * 0.75;
    const lineX2 = h.cx + h.headH * 0.75;

    const lines = [
      { y: h.topY, label: 'T0' },
      { y: h.midY, label: 'T1' },
      { y: h.bottomY, label: 'T2' },
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
    const { torsoGroup } = els;
    clear(torsoGroup);

    const p = {
      // Верхняя точка (суженная)
      x1: h.cx - h.topHalfW, y1: h.topY,
      x2: h.cx + h.topHalfW, y2: h.topY,
      
      // Самая широкая точка (по центру)
      x3: h.cx + h.maxHalfW, y3: h.midY,
      x4: h.cx - h.maxHalfW, y4: h.midY,
      
      // Нижняя точка (расширенная)
      x5: h.cx - h.bottomHalfW, y5: h.bottomY,
      x6: h.cx + h.bottomHalfW, y6: h.bottomY,
    };

    // Строим путь с помощью кубических кривых Безье (C)
    // M (Move) — старт в левом верхнем углу
    // C — кривая до правого верхнего угла через контрольные точки
    // C — кривая до правого нижнего угла
    // C — кривая до левого нижнего угла
    // C — кривая обратно в левый верхний угол
    
    // Контрольные точки для верхней дуги (сужение)
    const ctrlTopY = h.topY + (h.midY - h.topY) * 0.55;
    // Контрольные точки для нижней дуги (расширение)
    const ctrlBotY = h.bottomY - (h.bottomY - h.midY) * 0.55;

    const d = `
      M ${p.x1} ${p.y1}
      C ${p.x1} ${ctrlTopY}, ${p.x3} ${ctrlTopY}, ${p.x3} ${p.y3}
      C ${p.x3} ${ctrlBotY}, ${p.x6} ${ctrlBotY}, ${p.x6} ${p.y6}
      L ${p.x5} ${p.y5}
      C ${p.x5} ${ctrlBotY}, ${p.x4} ${ctrlBotY}, ${p.x4} ${p.y4}
      C ${p.x4} ${ctrlTopY}, ${p.x1} ${ctrlTopY}, ${p.x1} ${p.y1}
      Z
    `;

    torsoGroup.appendChild(svgEl('path', {
      d: d.replace(/\s+/g, ' ').trim(),
      fill: 'none',
    }));

    // Маркеры (для отладки)
    const { grid } = els;
    const mR = h.headH * 0.012;
    const points = [
      { x: p.x1, y: p.y1, color: '#dc2626' },
      { x: p.x2, y: p.y2, color: '#dc2626' },
      { x: p.x3, y: p.y3, color: '#2563eb' },
      { x: p.x4, y: p.y4, color: '#2563eb' },
      { x: p.x5, y: p.y5, color: '#16a34a' },
      { x: p.x6, y: p.y6, color: '#16a34a' },
    ];
    for (const pt of points) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: mR,
        fill: pt.color, opacity: 0.85,
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
