/* js/arm.js — Этап 2: Суставы + контуры рук */

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

    outerUpperArmAttachAngle: 0,
    outerUpperArmP1X: 0, outerUpperArmP1Y: 0,
    outerUpperArmElbowAngle: 0,
    innerUpperArmAttachAngle: 180,
    innerUpperArmP1X: 0, innerUpperArmP1Y: 0,
    innerUpperArmElbowAngle: 180,

    forearmElbowAttachAngle: 0,
    forearmWristAttachAngle: 0,
    forearmP1OffsetX: 0.10, forearmP1OffsetY: -0.20,

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

    // === СОХРАНЕНИЕ ГЕОМЕТРИИ ДЛЯ ТРАПЕЦИЙ ===
    window.Arm.lastGeometry = {
      leftCx, leftCy, shoulderRadius,
      rightCx, rightCy,
      elbowLeftCx, elbowLeftCy, elbowRadius,
      elbowRightCx, elbowRightCy
    };

    // === СУСТАВЫ ===
    armL.appendChild(svgEl('circle', { cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    // === ВЕРХНЯЯ ЧАСТЬ РУКИ ===
    const rOuterP0 = getPointOnCircle(rightCx, rightCy, shoulderRadius, params.outerUpperArmAttachAngle, false);
    const rOuterP2 = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, params.outerUpperArmElbowAngle, false);
    const rOuterP1 = {
      x: (rOuterP0.x + rOuterP2.x) / 2 + params.outerUpperArmP1X * headH,
      y: (rOuterP0.y + rOuterP2.y) / 2 + params.outerUpperArmP1Y * headH
    };
    armR.appendChild(svgEl('path', { d: `M ${rOuterP0.x} ${rOuterP0.y} Q ${rOuterP1.x} ${rOuterP1.y} ${rOuterP2.x} ${rOuterP2.y}`, fill: 'none' }));

    const lOuterP0 = getPointOnCircle(leftCx, leftCy, shoulderRadius, params.outerUpperArmAttachAngle, true);
    const lOuterP2 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, params.outerUpperArmElbowAngle, true);
    const lOuterP1 = {
      x: (lOuterP0.x + lOuterP2.x) / 2 - params.outerUpperArmP1X * headH,
      y: (lOuterP0.y + lOuterP2.y) / 2 + params.outerUpperArmP1Y * headH
    };
    armL.appendChild(svgEl('path', { d: `M ${lOuterP0.x} ${lOuterP0.y} Q ${lOuterP1.x} ${lOuterP1.y} ${lOuterP2.x} ${lOuterP2.y}`, fill: 'none' }));

    const rInnerP0 = getPointOnCircle(rightCx, rightCy, shoulderRadius, params.innerUpperArmAttachAngle, false);
    const rInnerP2 = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, params.innerUpperArmElbowAngle, false);
    const rInnerP1 = {
      x: (rInnerP0.x + rInnerP2.x) / 2 + params.innerUpperArmP1X * headH,
      y: (rInnerP0.y + rInnerP2.y) / 2 + params.innerUpperArmP1Y * headH
    };
    armR.appendChild(svgEl('path', { d: `M ${rInnerP0.x} ${rInnerP0.y} Q ${rInnerP1.x} ${rInnerP1.y} ${rInnerP2.x} ${rInnerP2.y}`, fill: 'none' }));

    const lInnerP0 = getPointOnCircle(leftCx, leftCy, shoulderRadius, params.innerUpperArmAttachAngle, true);
    const lInnerP2 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, params.innerUpperArmElbowAngle, true);
    const lInnerP1 = {
      x: (lInnerP0.x + lInnerP2.x) / 2 - params.innerUpperArmP1X * headH,
      y: (lInnerP0.y + lInnerP2.y) / 2 + params.innerUpperArmP1Y * headH
    };
    armL.appendChild(svgEl('path', { d: `M ${lInnerP0.x} ${lInnerP0.y} Q ${lInnerP1.x} ${lInnerP1.y} ${lInnerP2.x} ${lInnerP2.y}`, fill: 'none' }));

    // === ПРЕДПЛЕЧЬЕ ===
    const rForeP0 = getPointOnCircle(wristRightCx, wristRightCy, wristRadius, params.forearmWristAttachAngle, false);
    const rForeP2 = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, params.forearmElbowAttachAngle, false);
    const rForeP1 = {
      x: (rForeP0.x + rForeP2.x) / 2 + params.forearmP1OffsetX * headH,
      y: (rForeP0.y + rForeP2.y) / 2 + params.forearmP1OffsetY * headH
    };
    armR.appendChild(svgEl('path', { d: `M ${rForeP0.x} ${rForeP0.y} Q ${rForeP1.x} ${rForeP1.y} ${rForeP2.x} ${rForeP2.y}`, fill: 'none' }));

    const lForeP0 = getPointOnCircle(wristLeftCx, wristLeftCy, wristRadius, params.forearmWristAttachAngle, true);
    const lForeP2 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, params.forearmElbowAttachAngle, true);
    const lForeP1 = {
      x: (lForeP0.x + lForeP2.x) / 2 - params.forearmP1OffsetX * headH,
      y: (lForeP0.y + lForeP2.y) / 2 + params.forearmP1OffsetY * headH
    };
    armL.appendChild(svgEl('path', { d: `M ${lForeP0.x} ${lForeP0.y} Q ${lForeP1.x} ${lForeP1.y} ${lForeP2.x} ${lForeP2.y}`, fill: 'none' }));

    const rForeInP0 = getPointOnCircle(wristRightCx, wristRightCy, wristRadius, params.forearmInnerWristAngle, false);
    const rForeInP3 = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, params.forearmInnerElbowAngle, false);
    const rForeDx = rForeInP3.x - rForeInP0.x;
    const rForeDy = rForeInP3.y - rForeInP0.y;
    const rForeInP1 = { x: rForeInP0.x + rForeDx * 0.33 + params.forearmInnerP1OffsetX * headH, y: rForeInP0.y + rForeDy * 0.33 + params.forearmInnerP1OffsetY * headH };
    const rForeInP2 = { x: rForeInP0.x + rForeDx * 0.66 + params.forearmInnerP2OffsetX * headH, y: rForeInP0.y + rForeDy * 0.66 + params.forearmInnerP2OffsetY * headH };
    armR.appendChild(svgEl('path', { d: `M ${rForeInP0.x} ${rForeInP0.y} C ${rForeInP1.x} ${rForeInP1.y}, ${rForeInP2.x} ${rForeInP2.y}, ${rForeInP3.x} ${rForeInP3.y}`, fill: 'none' }));

    const lForeInP0 = getPointOnCircle(wristLeftCx, wristLeftCy, wristRadius, params.forearmInnerWristAngle, true);
    const lForeInP3 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, params.forearmInnerElbowAngle, true);
    const lForeDx = lForeInP3.x - lForeInP0.x;
    const lForeDy = lForeInP3.y - lForeInP0.y;
    const lForeInP1 = { x: lForeInP0.x + lForeDx * 0.33 - params.forearmInnerP1OffsetX * headH, y: lForeInP0.y + lForeDy * 0.33 + params.forearmInnerP1OffsetY * headH };
    const lForeInP2 = { x: lForeInP0.x + lForeDx * 0.66 - params.forearmInnerP2OffsetX * headH, y: lForeInP0.y + lForeDy * 0.66 + params.forearmInnerP2OffsetY * headH };
    armL.appendChild(svgEl('path', { d: `M ${lForeInP0.x} ${lForeInP0.y} C ${lForeInP1.x} ${lForeInP1.y}, ${lForeInP2.x} ${lForeInP2.y}, ${lForeInP3.x} ${lForeInP3.y}`, fill: 'none' }));

    // === МАРКЕРЫ ===
    const mR = headH * 0.012;
    const markers = [
      { x: leftCx, y: leftCy, c: '#2563eb' },
      { x: rightCx, y: rightCy, c: '#2563eb' },
      { x: elbowLeftCx, y: elbowLeftCy, c: '#f59e0b' },
      { x: elbowRightCx, y: elbowRightCy, c: '#f59e0b' },
      { x: wristLeftCx, y: wristLeftCy, c: '#16a34a' },
      { x: wristRightCx, y: wristRightCy, c: '#16a34a' },
    ];
    for (const pt of markers) grid.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: mR, fill: pt.c, opacity: 0.85 }));
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

  window.Arm = { update, getParams, setParams, resetParams, DEFAULT_PARAMS, lastGeometry: null };
})();
