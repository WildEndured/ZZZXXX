/* js/torso.js — Этап 2: ТОЛЬКО Грудная клетка (по присланной формуле Безье) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Параметры (пока зашиты, ползунки добавим позже, когда форма встанет)
  const params = {
    chestWidth: 0.8,      // во сколько раз грудь шире одной головы (1.0 = ровно голова по ширине)
    chestHeight: 1.0,     // высота в долях одной головы
    topNarrow: 0.4,       // 0..1 — насколько сужен верх (0 = овал, 1 = острый верх)
    bottomWide: 0.6,      // 0..1 — насколько расширен низ
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

  function computeChest(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;
    const sectionH = headH;

    // Верх груди = L5 (низ первой головы)
    const chestY0 = geo.topY + sectionH;

    const chestHeightPx = sectionH * params.chestHeight;
    const chestRx = (headH * params.chestWidth) / 2;

    const cpTopX = chestRx * params.topNarrow;
    const cpBottomX = chestRx * params.bottomWide;

    return { headH, cx, chestY0, chestHeightPx, chestRx, cpTopX, cpBottomX };
  }

  function drawGrid(h) {
    const { grid } = els;
    clear(grid);

    const lineX1 = h.cx - h.headH * 0.75;
    const lineX2 = h.cx + h.headH * 0.75;

    const lines = [
      { y: h.chestY0, label: 'T0' },
      { y: h.chestY0 + h.chestHeightPx / 2, label: 'T1' },
      { y: h.chestY0 + h.chestHeightPx, label: 'T2' },
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

    // Координаты относительно нашего центра (вместо 0.5 из присланного кода)
    const x0 = h.cx;                               // осевая
    const y0 = h.chestY0;
    const yMid = y0 + h.chestHeightPx * 0.6;       // где максимальная ширина
    const yBot = y0 + h.chestHeightPx;
    const rx = h.chestRx;
    const cpTopX = h.cpTopX;
    const cpBottomX = h.cpBottomX;

    // Ровно та же схема Безье, что в присланном коде:
    // M центр сверху -> C вправо -> C в центр снизу -> C влево -> C обратно вверх
    const d = `
      M ${x0} ${y0}
      C ${x0 + cpTopX} ${y0}, ${x0 + rx} ${y0 + h.chestHeightPx * 0.3}, ${x0 + rx} ${yMid}
      C ${x0 + rx} ${yBot - h.chestHeightPx * 0.1}, ${x0 + cpBottomX} ${yBot}, ${x0} ${yBot}
      C ${x0 - cpBottomX} ${yBot}, ${x0 - rx} ${yBot - h.chestHeightPx * 0.1}, ${x0 - rx} ${yMid}
      C ${x0 - rx} ${y0 + h.chestHeightPx * 0.3}, ${x0 - cpTopX} ${y0}, ${x0} ${y0}
      Z
    `;

    torsoGroup.appendChild(svgEl('path', {
      d: d.replace(/\s+/g, ' ').trim(),
      fill: 'none',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    const h = computeChest(geo);
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
