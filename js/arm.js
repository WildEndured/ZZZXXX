/* js/arm.js — Этап 2: Плечи (два круга) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderHeightCorr: 0.3, // 30% от верха груди
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });
  let els = null;

  function ensureDom() {
    if (els) return els;
    const armL = document.getElementById('armLeftGroup');
    const armR = document.getElementById('armRightGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!armL || !armR || !headsLayer) return null;

    let grid = document.getElementById('armGridLayer');
    if (!grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'armGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }
    els = { armL, armR, headsLayer, grid };
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

  // Функция для поиска X на кривой Безье по заданному Y
  // (Для плеч нам нужно найти, насколько широко грудь на высоте плеч)
  function findChestXByY(targetY, h) {
    // Если Y вне груди, возвращаем 0
    if (targetY < h.chestY0 || targetY > h.chestY0 + h.chestHeightPx) return 0;

    // Бинарный поиск по T
    const points = [
      { x: h.cx, y: h.chestY0 },
      { x: h.cx + h.cpTopX, y: h.chestY0 },
      { x: h.cx + h.chestRx, y: h.chestY0 + h.chestHeightPx * 0.3 },
      { x: h.cx + h.chestRx, y: h.chestY0 + h.chestHeightPx * 0.6 },
    ];

    let low = 0, high = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      const mt = 1 - mid;
      const midY = mt*mt*mt*points[0].y + 3*mt*mt*mid*points[1].y + 3*mt*mid*mid*points[2].y + mid*mid*mid*points[3].y;
      
      if (midY < targetY) low = mid;
      else high = mid;
    }

    const mt = 1 - high;
    const finalX = mt*mt*mt*points[0].x + 3*mt*mt*high*points[1].x + 3*mt*high*high*points[2].x + high*high*high*points[3].x;
    return finalX - h.cx; // Возвращаем ширину (расстояние от центра)
  }

  function drawArms(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    if (!torso) return;

    const { armL, armR, grid } = els;
    clear(armL);
    clear(armR);
    clear(grid);

    const chestH = torso.chestHeightPx;
    const radius = chestH / 3;

    // Y-координата центра плеча (верхняя треть груди)
    const shoulderY = torso.chestY0 + (chestH * params.shoulderHeightCorr);

    // X-координата контура груди на этой высоте
    const halfWidthAtShoulderY = findChestXByY(shoulderY, torso);

    // Центры плеч (сдвинуты на радиус наружу от груди)
    const leftCx = torso.cx - halfWidthAtShoulderY - radius;
    const rightCx = torso.cx + halfWidthAtShoulderY + radius;

    // Рисуем левое плечо
    armL.appendChild(svgEl('circle', {
      cx: leftCx, cy: shoulderY, r: radius, fill: 'none'
    }));

    // Рисуем правое плечо
    armR.appendChild(svgEl('circle', {
      cx: rightCx, cy: shoulderY, r: radius, fill: 'none'
    }));

    // Маркеры для отладки
    const mR = torso.headH * 0.012;
    grid.appendChild(svgEl('circle', {
      cx: leftCx, cy: shoulderY, r: mR, fill: '#2563eb', opacity: 0.85
    }));
    grid.appendChild(svgEl('circle', {
      cx: rightCx, cy: shoulderY, r: mR, fill: '#2563eb', opacity: 0.85
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    drawArms(geo);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  window.Arm = { update, getParams, setParams, resetParams, DEFAULT_PARAMS };
})();
