/* js/arm.js — Этап 2: Плечи, локти, запястья (по эталону) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Параметры (пока зашиты по эталону, ползунки добавим позже)
  const params = {
    // Радиусы (в долях от headHeight, как в эталоне r = state.x.r * sectionH)
    wristRadius: 0.035,   // радиус запястья
    elbowRadius: 0.045,   // радиус локтя

    // Смещения (в долях headHeight, как state.x.x * sectionH)
    wristLeftX: 0,
    wristLeftY: 0,
    wristRightX: 0,
    wristRightY: 0,
    elbowLeftX: 0,
    elbowLeftY: 0,
    elbowRightX: 0,
    elbowRightY: 0,
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

  // Ширина груди на высоте Y (та же формула синуса, что в эталоне)
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

    const headH = torso.headH;
    const chestH = torso.chestHeightPx;
    const chestRx = torso.chestRx;
    const topNarrow = torso.cpTopX / chestRx;

    // === ПЛЕЧИ ===
    const shoulderRadius = (chestH / 3) / 2;
    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftCx = torso.cx - curveWidth - shoulderRadius;
    const rightCx = torso.cx + curveWidth + shoulderRadius;

    armL.appendChild(svgEl('circle', {
      cx: leftCx, cy: shoulderCy, r: shoulderRadius, fill: 'none'
    }));
    armR.appendChild(svgEl('circle', {
      cx: rightCx, cy: shoulderCy, r: shoulderRadius, fill: 'none'
    }));

    // === НИЗ ТАЗА (для позиции запястий) ===
    const pelvisBottomY = torso.pelvisY0 + torso.pelvisH;

    // === ЛЕВОЕ ЗАПЯСТЬЕ ===
    const wristLeftRadius = params.wristRadius * headH;
    const wristLeftCy = pelvisBottomY - wristLeftRadius + (params.wristLeftY * headH);
    const wristLeftCx = torso.cx - chestRx - shoulderRadius * 1.5 + (params.wristLeftX * headH);

    armL.appendChild(svgEl('circle', {
      cx: wristLeftCx, cy: wristLeftCy, r: wristLeftRadius, fill: 'none'
    }));

    // === ЛЕВЫЙ ЛОКОТЬ ===
    const elbowLeftRadius = params.elbowRadius * headH;
    const elbowLeftCxBase = (leftCx + wristLeftCx) / 2;
    const elbowLeftCyBase = (shoulderCy + wristLeftCy) / 2;
    const elbowLeftCx = elbowLeftCxBase + (params.elbowLeftX * headH);
    const elbowLeftCy = elbowLeftCyBase + (params.elbowLeftY * headH);

    armL.appendChild(svgEl('circle', {
      cx: elbowLeftCx, cy: elbowLeftCy, r: elbowLeftRadius, fill: 'none'
    }));

    // === ПРАВОЕ ЗАПЯСТЬЕ ===
    const wristRightRadius = params.wristRadius * headH;
    const wristRightCy = pelvisBottomY - wristRightRadius + (params.wristRightY * headH);
    const wristRightCx = torso.cx + chestRx + shoulderRadius * 1.5 + (params.wristRightX * headH);

    armR.appendChild(svgEl('circle', {
      cx: wristRightCx, cy: wristRightCy, r: wristRightRadius, fill: 'none'
    }));

    // === ПРАВЫЙ ЛОКОТЬ ===
    const elbowRightRadius = params.elbowRadius * headH;
    const elbowRightCxBase = (rightCx + wristRightCx) / 2;
    const elbowRightCyBase = (shoulderCy + wristRightCy) / 2;
    const elbowRightCx = elbowRightCxBase + (params.elbowRightX * headH);
    const elbowRightCy = elbowRightCyBase + (params.elbowRightY * headH);

    armR.appendChild(svgEl('circle', {
      cx: elbowRightCx, cy: elbowRightCy, r: elbowRightRadius, fill: 'none'
    }));

    // === ОТЛАДОЧНЫЕ МАРКЕРЫ (центры всех суставов) ===
    const mR = headH * 0.012;
    const markers = [
      { x: leftCx, y: shoulderCy, c: '#2563eb' },
      { x: rightCx, y: shoulderCy, c: '#2563eb' },
      { x: elbowLeftCx, y: elbowLeftCy, c: '#f59e0b' },
      { x: elbowRightCx, y: elbowRightCy, c: '#f59e0b' },
      { x: wristLeftCx, y: wristLeftCy, c: '#16a34a' },
      { x: wristRightCx, y: wristRightCy, c: '#16a34a' },
    ];
    for (const pt of markers) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: mR, fill: pt.c, opacity: 0.85
      }));
    }
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
