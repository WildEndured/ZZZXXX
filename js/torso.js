/* js/torso.js — Этап 2: Грудная клетка по формуле Безье */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestWidth: 0.8,   // 0.8 → радиус = 0.9 головы
    topNarrow: 0.6,    // 0..1: 1 — верх сужен в точку, 0 — как у низа
    bottomWide: 1.0,   // 0..1: 1 — низ максимально раздут
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

    // T0 = L5 (низ первой головы), высота = ровно одна голова
    const t0Y = geo.topY + headH;
    const t2Y = t0Y + headH;
    const h = headH;

    // Радиус по X (максимальная ширина, на середине)
    const chestRx = (headH * params.chestWidth) / 2;

    // Контрольные точки для верхней и нижней половины
    // cpTopX < cpBottomX при topNarrow > 0 и bottomWide = 1 — получаем «каплю»
    const cpTopX = chestRx * params.topNarrow;
    const cpBottomX = chestRx * params.bottomWide;

    return { headH, t0Y, t2Y, h, cx, chestRx, cpTopX, cpBottomX };
  }

  function drawGrid(h) {
    const { grid } = els;
    clear(grid);

    const lineX1 = h.cx - h.headH * 0.75;
    const lineX2 = h.cx + h.headH * 0.75;

    const lines = [
      { y: h.t0Y, label: 'T0' },
      { y: h.t0Y + h.h / 2, label: 'T1' },
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

    // Маркеры T0 / T1 / T2 по центру
    const mR = h.headH * 0.012;
    const marks = [
      { x: h.cx, y: h.t0Y, c: '#dc2626' },
      { x: h.cx, y: h.t0Y + h.h / 2, c: '#2563eb' },
      { x: h.cx, y: h.t2Y, c: '#16a34a' },
    ];
    for (const pt of marks) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: mR,
        fill: pt.c, opacity: 0.85,
      }));
    }
  }

  function drawTorso(h) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    // Все координаты в пространстве viewBox 0…4096.
    // Адаптация формулы из эталонного кода:
    //   M cx t0Y
    //   C (cx + cpTopX)    t0Y,                     (cx + chestRx) (t0Y + H*0.3), (cx + chestRx) (t0Y + H*0.6)
    //   C (cx + chestRx)   (t0Y + H*0.9),           (cx + cpBottomX) (t0Y + H),   cx (t2Y)
    //   C (cx - cpBottomX) (t0Y + H),               (cx - chestRx) (t0Y + H*0.9), (cx - chestRx) (t0Y + H*0.6)
    //   C (cx - chestRx)   (t0Y + H*0.3),           (cx - cpTopX)  t0Y,           cx t0Y
    //   Z
    const H = h.h;
    const d = `
      M ${h.cx} ${h.t0Y}
      C ${h.cx + h.cpTopX}    ${h.t0Y},              ${h.cx + h.chestRx} ${h.t0Y + H * 0.3}, ${h.cx + h.chestRx} ${h.t0Y + H * 0.6}
      C ${h.cx + h.chestRx}   ${h.t0Y + H * 0.9},    ${h.cx + h.cpBottomX} ${h.t0Y + H},      ${h.cx} ${h.t2Y}
      C ${h.cx - h.cpBottomX} ${h.t0Y + H},          ${h.cx - h.chestRx} ${h.t0Y + H * 0.9},   ${h.cx - h.chestRx} ${h.t0Y + H * 0.6}
      C ${h.cx - h.chestRx}   ${h.t0Y + H * 0.3},    ${h.cx - h.cpTopX}  ${h.t0Y},             ${h.cx} ${h.t0Y}
      Z
    `;

    torsoGroup.appendChild(svgEl('path', {
      d: d.replace(/\s+/g, ' ').trim(),
      fill: 'none',
      // stroke и stroke-width наследуются от #figureLayer — не задаём
    }));
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
