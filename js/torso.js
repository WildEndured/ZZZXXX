/* js/torso.js — Этап 2: торс (честный эллипс) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestWidth: 1.0,        // 0.5 … 1.5
    chestHeight: 1.0,       // 0.5 … 1.5
    chestTopTaper: 0.2,     // 0.0 … 0.5 (сдвиг центра вниз)
    chestBottomExpand: 1.0, // 0.8 … 1.5
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });
  let els = null;

  function ensureDom() {
    if (els) return els;
    const torsoGroup = document.getElementById('torsoGroup');
    if (!torsoGroup) return null;
    els = { torsoGroup };
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
    const topY = geo.topY + headH; // Начало торса (L5)
    
    // Высота секции ровно 1 голова
    const torsoH = headH * params.chestHeight;
    
    // Радиус по X
    const baseRx = headH * 0.35;
    const rx = baseRx * params.chestWidth * params.chestBottomExpand;
    
    // Радиус по Y (половина высоты секции)
    const ry = torsoH / 2;
    
    // Сдвигаем центр эллипса вниз, чтобы сверху он казался уже
    const offsetY = ry * params.chestTopTaper;
    const cy = topY + ry + offsetY;

    return { cx, cy, rx, ry, topY, torsoH };
  }

  function drawTorso(t) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    // Просто рисуем эллипс, никаких кривых Безье
    torsoGroup.appendChild(svgEl('ellipse', {
      cx: t.cx,
      cy: t.cy,
      rx: t.rx,
      ry: t.ry,
      fill: 'none',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    const t = computeTorso(geo);
    drawTorso(t);
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
