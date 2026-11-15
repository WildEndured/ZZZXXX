/* js/arm.js — Этап 2: Плечи (два круга) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderOffset: 0.0, // Сдвиг плеч от края груди (0 = касаются груди)
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

  function update(geo) {
    if (!ensureDom()) return;
    const { armL, armR, grid } = els;
    clear(armL);
    clear(armR);
    clear(grid);

    // Получаем параметры груди из Torso (если он есть)
    const torsoParams = window.Torso ? window.Torso.getParams() : null;
    if (!torsoParams) return;

    const headH = geo.headHeight;
    const cx = geo.centerX;

    // --- 1. Вычисляем параметры груди (как в torso.js) ---
    const chestHeightPx = headH * (1 + torsoParams.chestHeightCorr);
    const chestY0 = geo.topY + headH;
    const chestRx = (headH * torsoParams.chestWidth) / 2;

    // --- 2. Параметры плеч (радиус = T0.5 - T0, то есть четверть высоты груди) ---
    // T0 = chestY0. T1 = chestY0 + chestHeightPx / 2. T0.5 = середина между ними.
    // Радиус = (T0.5 - T0) = chestHeightPx / 4.
    const shoulderRadius = chestHeightPx / 4;

    // Центр по Y = T0 + радиус (чтобы верхушка касалась T0)
    const shoulderCy = chestY0 + shoulderRadius;

    // Центр по X: касаемся краев груди снаружи
    const offset = params.shoulderOffset * headH;
    
    const leftCx = cx - chestRx - shoulderRadius + offset;
    const rightCx = cx + chestRx + shoulderRadius - offset;

    // --- 3. Рисуем круги ---
    armL.appendChild(svgEl('circle', {
      cx: leftCx, cy: shoulderCy, r: shoulderRadius,
      fill: 'none',
    }));

    armR.appendChild(svgEl('circle', {
      cx: rightCx, cy: shoulderCy, r: shoulderRadius,
      fill: 'none',
    }));

    // --- 4. Отладочные маркеры (не экспортируются) ---
    const mR = headH * 0.008;
    const debugPoints = [
      { x: leftCx, y: shoulderCy, c: '#2563eb' },
      { x: rightCx, y: shoulderCy, c: '#2563eb' },
    ];
    for (const pt of debugPoints) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: mR,
        fill: pt.c, opacity: 0.85,
      }));
    }
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
