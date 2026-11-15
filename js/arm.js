/* js/arm.js — Этап 2: Плечи (по эталонной формуле) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Пока без ползунков. Параметры зашиты в формулу.
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

  // Ширина груди на высоте Y (аппроксимация, как в эталонном коде)
  function getChestCurveWidth(t, chestRx, topNarrow) {
    if (t <= 0.6) {
      const tNorm = t / 0.6;
      return (chestRx * topNarrow) + (chestRx - (chestRx * topNarrow)) * Math.sin(tNorm * Math.PI / 2);
    } else {
      return chestRx;
    }
  }

  function drawArms(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    if (!torso) return;

    const { armL, armR, grid } = els;
    clear(armL);
    clear(armR);
    clear(grid);

    const chestH = torso.chestHeightPx;
    const chestRx = torso.chestRx;
    const topNarrow = torso.cpTopX / chestRx; // доля сужения верха

    // --- ПЛЕЧИ (по эталону) ---
    // Радиус = (высота груди / 3) / 2
    const shoulderRadius = (chestH / 3) / 2;

    // Центр по Y = верх груди + радиус
    const shoulderCy = torso.chestY0 + shoulderRadius;

    // Находим ширину груди на этой высоте (t от 0 до 1)
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    // Центры плеч (снаружи груди)
    const leftCx = torso.cx - curveWidth - shoulderRadius;
    const rightCx = torso.cx + curveWidth + shoulderRadius;

    // Рисуем круги
    armL.appendChild(svgEl('circle', {
      cx: leftCx, cy: shoulderCy, r: shoulderRadius, fill: 'none'
    }));
    armR.appendChild(svgEl('circle', {
      cx: rightCx, cy: shoulderCy, r: shoulderRadius, fill: 'none'
    }));

    // Отладочные маркеры (центры)
    const mR = torso.headH * 0.012;
    grid.appendChild(svgEl('circle', {
      cx: leftCx, cy: shoulderCy, r: mR, fill: '#2563eb', opacity: 0.85
    }));
    grid.appendChild(svgEl('circle', {
      cx: rightCx, cy: shoulderCy, r: mR, fill: '#2563eb', opacity: 0.85
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
