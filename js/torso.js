(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestWidth: 1.0,        // Общая ширина
    chestHeight: 1.0,       // Высота
    chestTopTaper: 0.3,     // Сдвиг центра вниз (сужение верха)
    chestBottomExpand: 1.0, // Общее расширение (ширина)
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

  function drawTorso(geo) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    const headH = geo.headHeight;
    const cx = geo.centerX;
    
    // Границы секции (от L5 до L10)
    const topY = geo.topY + headH; 
    const bottomY = topY + (headH * params.chestHeight);
    
    // Радиусы эллипса
    const rx = (headH * 0.35) * params.chestWidth * params.chestBottomExpand;
    const ry = (bottomY - topY) / 2;
    
    // Сдвигаем центр вниз. 
    // Если chestTopTaper = 0, центр ровно посередине (обычный эллипс).
    // Если chestTopTaper = 0.5, центр смещен вниз на половину радиуса.
    const offsetY = ry * params.chestTopTaper;
    const cy = topY + ry + offsetY;

    // Рисуем честный эллипс
    torsoGroup.appendChild(svgEl('ellipse', {
      cx: cx,
      cy: cy,
      rx: rx,
      ry: ry,
      fill: 'none',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    drawTorso(geo);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  window.Torso = {
    update,
    getParams,
    setParams,
    resetParams,
    DEFAULT_PARAMS,
  };
})();
