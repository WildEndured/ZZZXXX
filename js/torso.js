/* js/torso.js — Этап 2: Грудная клетка (Капля/Яйцо через Безье) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestWidth: 0.9,      // Максимальная ширина (доля от headH)
    topNarrow: 0.4,       // Сужение верха (0…1)
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

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;
    
    // T0 = L5 (низ первой головы)
    const topY = geo.topY + headH; 
    // T2 = низ второй головы (высота = 1 голова)
    const bottomY = topY + headH;
    const midY = topY + headH / 2; 

    const maxHalfW = (params.chestWidth * headH) / 2;
    
    // Ширина в самой верхней точке (T0)
    const topHalfW = Math.max(2, maxHalfW * (1 - params.topNarrow * 0.95));
    // Ширина в самой нижней точке (T2)
    const bottomHalfW = maxHalfW * (0.7 + params.bottomExpand * 0.5);

    return { headH, topY, cx, midY, bottomY, maxHalfW, topHalfW, bottomHalfW };
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

    // Опорные точки для кривых Безье
    const pTopL = { x: h.cx - h.topHalfW, y: h.topY };
    const pTopR = { x: h.cx + h.topHalfW, y: h.topY };
    
    const pMidL = { x: h.cx - h.maxHalfW, y: h.midY };
    const pMidR = { x: h.cx + h.maxHalfW, y: h.midY };
    
    const pBotL = { x: h.cx - h.bottomHalfW, y: h.bottomY };
    const pBotR = { x: h.cx + h.bottomHalfW, y: h.bottomY };

    // Контрольные точки для плавности (выносим их по X чуть дальше, чтобы бока были круглыми)
    const ctrlOffsetX = h.maxHalfW * 0.55;
    
    // Верхняя дуга (от левого верха до правого верха через центр)
    const ctrlTopY = h.topY + (h.midY - h.topY) * 0.6;
    // Нижняя дуга (от левого низа до правого низа через центр)
    const ctrlBotY = h.midY + (h.bottomY - h.midY) * 0.4;

    // Собираем путь: 
    // Начинаем с левого верха -> идем в левый центр -> в левый низ -> в правый низ -> в правый центр -> в правый верх -> замыкаем верхнюю дугу.
    const d = `
      M ${pTopL.x} ${pTopL.y}
      C ${pTopL.x - ctrlOffsetX * 0.2} ${ctrlTopY}, ${pMidL.x} ${ctrlTopY}, ${pMidL.x} ${pMidL.y}
      C ${pMidL.x} ${ctrlBotY}, ${pBotL.x} ${ctrlBotY}, ${pBotL.x} ${pBotL.y}
      L ${pBotR.x} ${pBotR.y}
      C ${pBotR.x} ${ctrlBotY}, ${pMidR.x} ${ctrlBotY}, ${pMidR.x} ${pMidR.y}
      C ${pMidR.x} ${ctrlTopY}, ${pTopR.x + ctrlOffsetX * 0.2} ${ctrlTopY}, ${pTopR.x} ${pTopR.y}
      Z
    `;

    torsoGroup.appendChild(svgEl('path', {
      d: d.replace(/\s+/g, ' ').trim(),
      fill: 'none',
    }));

    // Маркеры
    const mR = h.headH * 0.012;
    const points = [
      { p: pTopL, c: '#dc2626' }, { p: pTopR, c: '#dc2626' },
      { p: pMidL, c: '#2563eb' }, { p: pMidR, c: '#2563eb' },
      { p: pBotL, c: '#16a34a' }, { p: pBotR, c: '#16a34a' },
    ];
    for (const pt of points) {
      grid.appendChild(svgEl('circle', {
        cx: pt.p.x, cy: pt.p.y, r: mR,
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
