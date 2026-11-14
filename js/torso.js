(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Параметры
  const params = {
    chestWidth: 1.0,        // Базовая ширина
    chestHeight: 1.0,       // Высота
    chestTopTaper: 0.4,     // Сужение верха: 0 - широкий, 0.9 - узкий
    chestBottomExpand: 1.0, // Расширение низа: 0.8 - узкий, 1.5 - широкий
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
    const topY = geo.topY + headH; // L5
    const torsoH = headH * params.chestHeight;
    const bottomY = topY + torsoH;

    // Базовая ширина 35% от головы
    const baseHalfWidth = (headH * 0.35) * params.chestWidth;

    // Верхняя ширина: зависит от сужения. 
    // 0.4 означает, что верх в 2.5 раза уже базы. (1 - 0.4 = 0.6)
    const topHalfWidth = baseHalfWidth * (1 - params.chestTopTaper);

    // Нижняя ширина: зависит от расширения.
    const bottomHalfWidth = baseHalfWidth * params.chestBottomExpand;

    // Точки:
    // Верхняя левая / правая (без скругления, просто для начала)
    const topLeft = { x: cx - topHalfWidth, y: topY };
    const topRight = { x: cx + topHalfWidth, y: topY };
    
    // Нижняя левая / правая
    const botLeft = { x: cx - bottomHalfWidth, y: bottomY };
    const botRight = { x: cx + bottomHalfWidth, y: bottomY };

    // Чтобы это выглядело как яйцо, а не как трапеция, 
    // мы используем кривые, но контролируем их строго по ширине.
    
    // Коэффициент кривизны для боков (чтобы были выпуклыми)
    const curve = torsoH * 0.2;

    const d = `
      M ${topLeft.x} ${topLeft.y}
      C ${topLeft.x - curve * 0.5} ${topLeft.y + torsoH * 0.2}, 
        ${botLeft.x - curve * 0.5} ${botLeft.y - torsoH * 0.2}, 
        ${botLeft.x} ${botLeft.y}
      
      L ${botRight.x} ${botRight.y}
      
      C ${botRight.x + curve * 0.5} ${botRight.y - torsoH * 0.2}, 
        ${topRight.x + curve * 0.5} ${topRight.y + torsoH * 0.2}, 
        ${topRight.x} ${topRight.y}
      
      Z
    `;

    torsoGroup.appendChild(svgEl('path', {
      d: d,
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
