/* js/arm.js — Этап 2: Суставы + контуры предплечья */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
    wristRadius: 0.08,

    wristLeftX: -0.25, wristLeftY: 0.05,
    wristRightX: 0.25, wristRightY: 0.05,

    elbowLeftX: 0, elbowLeftY: -0.05,
    elbowRightX: 0, elbowRightY: -0.05,

    leftX: 0, leftY: 0, rightX: 0, rightY: 0,

    // Внешняя линия
    forearmElbowAttachAngle: 0,
    forearmWristAttachAngle: 0,
    forearmP1OffsetX: 0.10,
    forearmP1OffsetY: -0.20,

    // Внутренняя линия
    forearmInnerWristAngle: 125,
    forearmInnerElbowAngle: 180,
    forearmInnerP1OffsetX: 0,
    forearmInnerP1OffsetY: -0.20,
    forearmInnerP2OffsetX: -0.20,
    forearmInnerP2OffsetY: 0,
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

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function getChestCurveWidth(t, chestRx, topNarrow) {
    if (t <= 0.6) {
      const tNorm = t / 0.6;
      return (chestRx * topNarrow) + (chestRx - (chestRx * topNarrow)) * Math.sin(tNorm * Math.PI / 2);
    } else {
      return chestRx;
    }
  }

  function getPointOnCircle(cx, cy, r, angleDeg, isLeftSide) {
    const rad = (angleDeg * Math.PI) / 180;
    const sign = isLeftSide ? -1 : 1;
    return {
      x: cx + sign * r * Math.cos(rad),
      y: cy - r * Math.sin(rad)
    };
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

    // Смещения
    const leftOffsetX = params.leftX * headH;
    const leftOffsetY = params.leftY * headH;
    const rightOffsetX = params.rightX * headH;
    const rightOffsetY = params.rightY * headH;

    // === ПЛЕЧИ ===
    const baseShoulderRadius = (chestH / 3) / 2;
    const shoulderRadius = baseShoulderRadius * params.shoulderRadiusMul;

    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftCx = torso.cx - curveWidth - shoulderRadius + leftOffsetX;
    const rightCx = torso.cx + curveWidth + shoulderRadius + rightOffsetX;
    const leftCy = shoulderCy + leftOffsetY;
    const rightCy = shoulderCy + rightOffsetY;

    // === ЗАПЯСТЬЯ ===
    const pelvisBottomY = torso.pelvisY0 + torso.pelvisH;
    const wristRadius = params.wristRadius * headH;

    const wristLeftOffsetX = params.wristLeftX * headH;
    const wristLeftOffsetY = params.wristLeftY * headH;
    const wristLeftCy = pelvisBottomY - wristRadius + wristLeftOffsetY + leftOffsetY;
    const wristLeftCx = torso.cx - chestRx - shoulderRadius * 1.5 + wristLeftOffsetX + leftOffsetX;

    const wristRightOffsetX = params.wristRightX * headH;
    const wristRightOffsetY = params.wristRightY * headH;
    const wristRightCy = pelvisBottomY - wristRadius + wristRightOffsetY + rightOffsetY;
    const wristRightCx = torso.cx + chestRx + shoulderRadius * 1.5 + wristRightOffsetX + rightOffsetX;

    // === ЛОКТИ ===
    const elbowRadius = params.elbowRadius * headH;
    const elbowLeftOffsetX = params.elbowLeftX * headH;
    const elbowLeftOffsetY = params.elbowLeftY * headH;
    const elbowLeftCx = (leftCx + wristLeftCx) / 2 + elbowLeftOffsetX;
    const elbowLeftCy = (leftCy + wristLeftCy) / 2 + elbowLeftOffsetY;

    const elbowRightOffsetX = params.elbowRightX * headH;
    const elbowRightOffsetY = params.elbowRightY * headH;
    const elbowRightCx = (rightCx + wristRightCx) / 2 + elbowRightOffsetX;
    const elbowRightCy = (rightCy + wristRightCy) / 2 + elbowRightOffsetY;

    // === РИСУЕМ СУСТАВЫ ===
    armL.appendChild(svgEl('circle', { cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    // ==========================================
    // ВНЕШНЯЯ ЛИНИЯ ПРЕДПЛЕЧЬЯ (Q)
    // ==========================================
    // Правая рука
    const rightOuterP0 = getPointOnCircle(wristRightCx, wristRightCy, wristRadius, params.forearmWristAttachAngle, false);
    const rightOuterP2 = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, params.forearmElbowAttachAngle, false);
    const rightOuterP1 = {
      x: (rightOuterP0.x + rightOuterP2.x) / 2 + params.forearmP1OffsetX * headH,
      y: (rightOuterP0.y + rightOuterP2.y) / 2 + params.forearmP1OffsetY * headH
    };
    armR.appendChild(svgEl('path', {
      d: `M ${rightOuterP0.x} ${rightOuterP0.y} Q ${rightOuterP1.x} ${rightOuterP1.y} ${rightOuterP2.x} ${rightOuterP2.y}`,
      fill: 'none'
    }));

    // Левая рука
    const leftOuterP0 = getPointOnCircle(wristLeftCx, wristLeftCy, wristRadius, params.forearmWristAttachAngle, true);
    const leftOuterP2 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, params.forearmElbowAttachAngle, true);
    const leftOuterP1 = {
      x: (leftOuterP0.x + leftOuterP2.x) / 2 - params.forearmP1OffsetX * headH,
      y: (leftOuterP0.y + leftOuterP2.y) / 2 + params.forearmP1OffsetY * headH
    };
    armL.appendChild(svgEl('path', {
      d: `M ${leftOuterP0.x} ${leftOuterP0.y} Q ${leftOuterP1.x} ${leftOuterP1.y} ${leftOuterP2.x} ${leftOuterP2.y}`,
      fill: 'none'
    }));

    // ==========================================
    // ВНУТРЕННЯЯ ЛИНИЯ ПРЕДПЛЕЧЬЯ (C)
    // ==========================================
    // Правая рука
    const rInP0 = getPointOnCircle(wristRightCx, wristRightCy, wristRadius, params.forearmInnerWristAngle, false);
    const rInP3 = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, params.forearmInnerElbowAngle, false);
    
    const rDx = rInP3.x - rInP0.x;
    const rDy = rInP3.y - rInP0.y;
    
    const rInP1 = { 
      x: rInP0.x + rDx * 0.33 + params.forearmInnerP1OffsetX * headH, 
      y: rInP0.y + rDy * 0.33 + params.forearmInnerP1OffsetY * headH 
    };
    const rInP2 = { 
      x: rInP0.x + rDx * 0.66 + params.forearmInnerP2OffsetX * headH, 
      y: rInP0.y + rDy * 0.66 + params.forearmInnerP2OffsetY * headH 
    };

    armR.appendChild(svgEl('path', {
      d: `M ${rInP0.x} ${rInP0.y} C ${rInP1.x} ${rInP1.y}, ${rInP2.x} ${rInP2.y}, ${rInP3.x} ${rInP3.y}`,
      fill: 'none'
    }));

    // Левая рука
    const lInP0 = getPointOnCircle(wristLeftCx, wristLeftCy, wristRadius, params.forearmInnerWristAngle, true);
    const lInP3 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, params.forearmInnerElbowAngle, true);
    
    const lDx = lInP3.x - lInP0.x;
    const lDy = lInP3.y - lInP0.y;
    
    const lInP1 = { 
      x: lInP0.x + lDx * 0.33 - params.forearmInnerP1OffsetX * headH, 
      y: lInP0.y + lDy * 0.33 + params.forearmInnerP1OffsetY * headH 
    };
    const lInP2 = { 
      x: lInP0.x + lDx * 0.66 - params.forearmInnerP2OffsetX * headH, 
      y: lInP0.y + lDy * 0.66 + params.forearmInnerP2OffsetY * headH 
    };

    armL.appendChild(svgEl('path', {
      d: `M ${lInP0.x} ${lInP0.y} C ${lInP1.x} ${lInP1.y}, ${lInP2.x} ${lInP2.y}, ${lInP3.x} ${lInP3.y}`,
      fill: 'none'
    }));

    // === МАРКЕРЫ СУСТАВОВ ===
    const mR = headH * 0.012;
    const markers = [
      { x: leftCx, y: leftCy, c: '#2563eb' },
      { x: rightCx, y: rightCy, c: '#2563eb' },
      { x: elbowLeftCx, y: elbowLeftCy, c: '#f59e0b' },
      { x: elbowRightCx, y: elbowRightCy, c: '#f59e0b' },
      { x: wristLeftCx, y: wristLeftCy, c: '#16a34a' },
      { x: wristRightCx, y: wristRightCy, c: '#16a34a' },
    ];
    for (const pt of markers) {
      grid.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: mR, fill: pt.c, opacity: 0.85 }));
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
