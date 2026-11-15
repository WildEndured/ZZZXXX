/* js/torso.js — Этап 2: Грудная клетка (Исправленная) */

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

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;
    
    // T0 привязан к основанию шеи (L5)
    const topY = geo.topY + headH; 

    const chestH = params.chestHeight * headH;
    const chestW = params.chestWidth * headH;
    
    const bottomY = topY + chestH;
    const midY = topY + chestH * 0.45; // Пик ширины смещен чуть выше середины

    const maxHalfW = chestW / 2;

    // Логика ширины на разных уровнях
    // Верх: если topNarrow = 0, ширина = max. Если 1, ширина = 0.
    const topHalfW = Math.max(2, maxHalfW * (1 - params.topNarrow * 0.95)); 
    
    // Низ: если bottomExpand = 0, ширина = max * 0.8 (овал). Если 1, ширина = max * 1.2 (расширение).
    const bottomHalfW = maxHalfW * (0.8 + params.bottomExpand * 0.4);

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
    const { torsoGroup, grid } = els;
    clear(torsoGroup);

    // Опорные точки
    const topL = { x: h.cx - h.topHalfW, y: h.topY };
    const topR = { x: h.cx + h.topHalfW, y: h.topY };
    
    const midL = { x: h.cx - h.maxHalfW, y: h.midY };
    const midR = { x: h.cx + h.maxHalfW, y: h.midY };
    
    const botL = { x: h.cx - h.bottomHalfW, y: h.bottomY };
    const botR = { x: h.cx + h.bottomHalfW, y: h.bottomY };

    // Контрольные точки для кривых (чтобы бока были плавными)
    // Верхняя часть
    const ctrlTopY = h.topY + (h.midY - h.topY) * 0.6;
    // Нижняя часть
    const ctrlBotY = h.bottomY - (h.bottomY - h.midY) * 0.4;

    // Строим симметричный путь
    const d = `
      M ${topL.x} ${topL.y}
      C ${topL.x} ${ctrlTopY}, ${midL.x} ${ctrlTopY}, ${midL.x} ${midL.y}
      C ${midL.x} ${ctrlBotY}, ${botL.x} ${ctrlBotY}, ${botL.x} ${botL.y}
      L ${botR.x} ${botR.y}
      C ${botR.x} ${ctrlBotY}, ${midR.x} ${ctrlBotY}, ${midR.x} ${midR.y}
      C ${midR.x} ${ctrlTopY}, ${topR.x} ${ctrlTopY}, ${topR.x} ${topR.y}
      Z
    `;

    torsoGroup.appendChild(svgEl('path', {
      d: d.replace(/\s+/g, ' ').trim(),
      fill: 'none',
    }));

    // Маркеры
    const mR = h.headH * 0.012;
    const points = [
      { p: topL, c: '#dc2626' }, { p: topR, c: '#dc2626' },
      { p: midL, c: '#2563eb' }, { p: midR, c: '#2563eb' },
      { p: botL, c: '#16a34a' }, { p: botR, c: '#16a34a' },
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
