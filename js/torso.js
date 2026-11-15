/* js/torso.js — Этап 2: Грудная клетка (Исправленное яйцо) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestWidth: 0.9,      // Ширина (доля от headH)
    chestHeight: 1.1,     // Высота (доля от headH)
    topNarrow: 0.4,       // Сужение верха (0…1)
    bottomExpand: 0.1,    // Расширение низа (0…1)
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
    const topY = geo.topY + headH; // T0 привязан к L5
    
    const chestH = params.chestHeight * headH;
    const chestW = params.chestWidth * headH;
    
    const bottomY = topY + chestH;
    const midY = topY + chestH / 2; // Центр эллипса

    const rx = chestW / 2;
    
    // ВАЖНО: В SVG ось Y идет вниз.
    // Верхняя половина (от midY до topY) должна быть УЖЕ (для сужения).
    // Нижняя половина (от midY до bottomY) должна быть ШИРЕ (для расширения).
    
    // Радиус верхней половины (сужается)
    const ryTop = (chestH / 2) * (1 - params.topNarrow * 0.8);
    // Радиус нижней половины (расширяется)
    const ryBot = (chestH / 2) * (1 + params.bottomExpand * 0.5);

    return { headH, topY, cx, chestH, chestW, midY, bottomY, rx, ryTop, ryBot };
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
    const { torsoGroup, grid } = els;
    clear(torsoGroup);

    const points = [];
    const steps = 120;
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const sinA = Math.sin(angle);
      
      // ИСПРАВЛЕНИЕ: Если sinA > 0 (нижняя половина), используем ryBot (широкий).
      // Если sinA < 0 (верхняя половина), используем ryTop (узкий).
      const ry = sinA > 0 ? h.ryBot : h.ryTop;
      
      const x = h.cx + h.rx * Math.cos(angle);
      const y = h.midY + ry * sinA;
      
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    torsoGroup.appendChild(svgEl('polygon', {
      points: points.join(' '),
      fill: 'none',
    }));

    // Маркеры
    const mR = h.headH * 0.012;
    const debugPoints = [
      { x: h.cx, y: h.midY - h.ryTop, c: '#dc2626' }, // Верх (теперь узкий)
      { x: h.cx + h.rx, y: h.midY, c: '#2563eb' },    // Право
      { x: h.cx, y: h.midY + h.ryBot, c: '#16a34a' }, // Низ (теперь широкий)
      { x: h.cx - h.rx, y: h.midY, c: '#2563eb' },    // Лево
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
