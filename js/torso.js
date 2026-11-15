/* js/torso.js — Этап 2: Грудная клетка (ЕДИНЫЙ ЭЛЛИПС) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestWidth: 0.9,      // Ширина
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
    
    // T0 (верх) и T2 (низ) — жестко 1 голова
    const t0Y = geo.topY + headH; 
    const t2Y = t0Y + headH;
    const midY = t0Y + headH / 2; // T1

    // Общая ширина (радиус X)
    const rx = (params.chestWidth * headH) / 2;
    
    // Как сильно сужается верх и расширяется низ
    // Если topNarrow=0 и bottomExpand=0, то это ровный круг/эллипс.
    const topShift = params.topNarrow * (headH / 2); 
    const botShift = params.bottomExpand * (headH / 2);

    // Высота эллипса зависит от сдвигов.
    // Чтобы фигура вписывалась в T0-T2, её центр сдвигается.
    const ry = (headH / 2) - (topShift * 0.5) + (botShift * 0.5);
    const cy = midY - (topShift * 0.5) + (botShift * 0.5);

    return { headH, t0Y, t2Y, midY, cx, cy, rx, ry };
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

    // Рисуем ОДИН цельный эллипс.
    // Он будет сужаться сверху, потому что центр (cy) смещен вниз.
    torsoGroup.appendChild(svgEl('ellipse', {
      cx: h.cx,
      cy: h.cy,
      rx: h.rx,
      ry: h.ry,
      fill: 'none',
    }));

    // Маркеры границ (для отладки)
    const mR = h.headH * 0.012;
    const debugPoints = [
      { x: h.cx, y: h.cy - h.ry, c: '#dc2626' }, // Верх эллипса
      { x: h.cx + h.rx, y: h.cy, c: '#2563eb' }, // Право
      { x: h.cx, y: h.cy + h.ry, c: '#16a34a' }, // Низ эллипса
      { x: h.cx - h.rx, y: h.cy, c: '#2563eb' }, // Лево
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
