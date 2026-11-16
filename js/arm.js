/* js/arm.js — Этап 2: Руки (внутренний контур плеча прямой линией) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
    elbowLeftX: 0,
    elbowLeftY: 0,
    elbowRightX: 0,
    elbowRightY: 0,
    wristRadius: 0.08,
    wristLeftX: -0.20,   // Смещено влево
    wristLeftY: 0,
    wristRightX: 0.20,   // Смещено вправо
    wristRightY: 0,
    leftX: 0,
    leftY: 0,
    rightX: 0,
    rightY: 0,
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
    const head = window.Head && window.Head.lastGeometry;
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
    const baseShoulderRadius = (chestH / 3) / 2;
    const shoulderRadius = baseShoulderRadius * params.shoulderRadiusMul;

    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftOffsetX = params.leftX * headH;
    const leftOffsetY = params.leftY * headH;
    const rightOffsetX = params.rightX * headH;
    const rightOffsetY = params.rightY * headH;

    const leftCx = torso.cx - curveWidth - shoulderRadius + leftOffsetX;
    const rightCx = torso.cx + curveWidth + shoulderRadius + rightOffsetX;
    const leftCy = shoulderCy + leftOffsetY;
    const rightCy = shoulderCy + rightOffsetY;

    armL.appendChild(svgEl('circle', {
      cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none'
    }));
    armR.appendChild(svgEl('circle', {
      cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none'
    }));

    // === ЛИНИИ ОТ ПЛЕЧ К СЕРЕДИНЕ ШЕИ ===
    if (head && torso) {
      const neckHalfW = (headH * (window.Torso.getParams().neckWidth || 0.20)) / 2;
      const neckTopY = head.l4;
      const neckBottomY = torso.chestY0;
      const neckMidY = (neckTopY + neckBottomY) / 2;

      const leftNeckMid = { x: torso.cx - neckHalfW, y: neckMidY };
      const rightNeckMid = { x: torso.cx + neckHalfW, y: neckMidY };

      const leftShoulderTop = { x: leftCx, y: leftCy - shoulderRadius };
      const rightShoulderTop = { x: rightCx, y: rightCy - shoulderRadius };

      armL.appendChild(svgEl('line', {
        x1: leftShoulderTop.x, y1: leftShoulderTop.y,
        x2: leftNeckMid.x, y2: leftNeckMid.y,
        fill: 'none',
      }));

      armR.appendChild(svgEl('line', {
        x1: rightShoulderTop.x, y1: rightShoulderTop.y,
        x2: rightNeckMid.x, y2: rightNeckMid.y,
        fill: 'none',
      }));
    }

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

    armL.appendChild(svgEl('circle', {
      cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none'
    }));
    armR.appendChild(svgEl('circle', {
      cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none'
    }));

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

    armL.appendChild(svgEl('circle', {
      cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none'
    }));
    armR.appendChild(svgEl('circle', {
      cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none'
    }));

    // === ВНЕШНИЙ КОНТУР: ПЛЕЧО -> ЛОКОТЬ ===
    const leftShoulderOuter = { x: leftCx - shoulderRadius, y: leftCy };
    const leftElbowOuter = { x: elbowLeftCx - elbowRadius, y: elbowLeftCy };
    const leftCtrl1_arm = { x: leftShoulderOuter.x - shoulderRadius * 0.5, y: leftShoulderOuter.y + (leftElbowOuter.y - leftShoulderOuter.y) * 0.33 };
    const leftCtrl2_arm = { x: leftShoulderOuter.x + (leftElbowOuter.x - leftShoulderOuter.x) * 0.66, y: leftShoulderOuter.y + (leftElbowOuter.y - leftShoulderOuter.y) * 0.66 };
    let leftArmPath = `M ${leftShoulderOuter.x} ${leftShoulderOuter.y} C ${leftCtrl1_arm.x} ${leftCtrl1_arm.y}, ${leftCtrl2_arm.x} ${leftCtrl2_arm.y}, ${leftElbowOuter.x} ${leftElbowOuter.y}`;
    armL.appendChild(svgEl('path', { d: leftArmPath, fill: 'none' }));

    const rightShoulderOuter = { x: rightCx + shoulderRadius, y: rightCy };
    const rightElbowOuter = { x: elbowRightCx + elbowRadius, y: elbowRightCy };
    const rightCtrl1_arm = { x: rightShoulderOuter.x + shoulderRadius * 0.5, y: rightShoulderOuter.y + (rightElbowOuter.y - rightShoulderOuter.y) * 0.33 };
    const rightCtrl2_arm = { x: rightShoulderOuter.x + (rightElbowOuter.x - rightShoulderOuter.x) * 0.66, y: rightShoulderOuter.y + (rightElbowOuter.y - rightShoulderOuter.y) * 0.66 };
    let rightArmPath = `M ${rightShoulderOuter.x} ${rightShoulderOuter.y} C ${rightCtrl1_arm.x} ${rightCtrl1_arm.y}, ${rightCtrl2_arm.x} ${rightCtrl2_arm.y}, ${rightElbowOuter.x} ${rightElbowOuter.y}`;
    armR.appendChild(svgEl('path', { d: rightArmPath, fill: 'none' }));

    // === ВНУТРЕННИЙ КОНТУР: ПЛЕЧО -> ЛОКОТЬ (ПРЯМАЯ ЛИНИЯ) ===
    const leftShoulderInner = { x: leftCx + shoulderRadius, y: leftCy };
    const leftElbowInner = { x: elbowLeftCx + elbowRadius, y: elbowLeftCy };
    armL.appendChild(svgEl('line', {
      x1: leftShoulderInner.x, y1: leftShoulderInner.y,
      x2: leftElbowInner.x, y2: leftElbowInner.y,
      fill: 'none',
    }));

    const rightShoulderInner = { x: rightCx - shoulderRadius, y: rightCy };
    const rightElbowInner = { x: elbowRightCx - elbowRadius, y: elbowRightCy };
    armR.appendChild(svgEl('line', {
      x1: rightShoulderInner.x, y1: rightShoulderInner.y,
      x2: rightElbowInner.x, y2: rightElbowInner.y,
      fill: 'none',
    }));

    // === ВНЕШНИЙ КОНТУР ПРЕДПЛЕЧЬЯ (Локоть -> Запястье) ===
    const leftForearmOuterStart = { x: elbowLeftCx - elbowRadius, y: elbowLeftCy };
    const leftWristOuter = { x: wristLeftCx - wristRadius, y: wristLeftCy };
    const leftCtrl1_outer = {
        x: leftForearmOuterStart.x - shoulderRadius * 0.2,
        y: leftForearmOuterStart.y + (leftWristOuter.y - leftForearmOuterStart.y) * 0.25
    };
    const leftCtrl2_outer = {
        x: leftForearmOuterStart.x + (leftWristOuter.x - leftForearmOuterStart.x) * 0.7,
        y: leftForearmOuterStart.y + (leftWristOuter.y - leftForearmOuterStart.y) * 0.7
    };
    let leftForearmOuterPath = `M ${leftForearmOuterStart.x} ${leftForearmOuterStart.y} `;
    leftForearmOuterPath += `C ${leftCtrl1_outer.x} ${leftCtrl1_outer.y}, ${leftCtrl2_outer.x} ${leftCtrl2_outer.y}, ${leftWristOuter.x} ${leftWristOuter.y}`;
    armL.appendChild(svgEl('path', { d: leftForearmOuterPath, fill: 'none' }));

    const rightForearmOuterStart = { x: elbowRightCx + elbowRadius, y: elbowRightCy };
    const rightWristOuter = { x: wristRightCx + wristRadius, y: wristRightCy };
    const rightCtrl1_outer = {
        x: rightForearmOuterStart.x + shoulderRadius * 0.2,
        y: rightForearmOuterStart.y + (rightWristOuter.y - rightForearmOuterStart.y) * 0.25
    };
    const rightCtrl2_outer = {
        x: rightForearmOuterStart.x + (rightWristOuter.x - rightForearmOuterStart.x) * 0.7,
        y: rightForearmOuterStart.y + (rightWristOuter.y - rightForearmOuterStart.y) * 0.7
    };
    let rightForearmOuterPath = `M ${rightForearmOuterStart.x} ${rightForearmOuterStart.y} `;
    rightForearmOuterPath += `C ${rightCtrl1_outer.x} ${rightCtrl1_outer.y}, ${rightCtrl2_outer.x} ${rightCtrl2_outer.y}, ${rightWristOuter.x} ${rightWristOuter.y}`;
    armR.appendChild(svgEl('path', { d: rightForearmOuterPath, fill: 'none' }));

    // === ВНУТРЕННИЙ КОНТУР ПРЕДПЛЕЧЬЯ (Локоть -> Запястье) ===
    const leftForearmInnerStart = { x: elbowLeftCx + elbowRadius, y: elbowLeftCy };
    const leftWristInner = { x: wristLeftCx + wristRadius, y: wristLeftCy };
    const leftCtrl1_inner = {
        x: leftForearmInnerStart.x - shoulderRadius * 0.1,
        y: leftForearmInnerStart.y + (leftWristInner.y - leftForearmInnerStart.y) * 0.25
    };
    const leftCtrl2_inner = {
        x: leftForearmInnerStart.x + (leftWristInner.x - leftForearmInnerStart.x) * 0.3,
        y: leftForearmInnerStart.y + (leftWristInner.y - leftForearmInnerStart.y) * 0.8
    };
    let leftForearmInnerPath = `M ${leftForearmInnerStart.x} ${leftForearmInnerStart.y} `;
    leftForearmInnerPath += `C ${leftCtrl1_inner.x} ${leftCtrl1_inner.y}, ${leftCtrl2_inner.x} ${leftCtrl2_inner.y}, ${leftWristInner.x} ${leftWristInner.y}`;
    armL.appendChild(svgEl('path', { d: leftForearmInnerPath, fill: 'none' }));

    const rightForearmInnerStart = { x: elbowRightCx - elbowRadius, y: elbowRightCy };
    const rightWristInner = { x: wristRightCx - wristRadius, y: wristRightCy };
    const rightCtrl1_inner = {
        x: rightForearmInnerStart.x + shoulderRadius * 0.1,
        y: rightForearmInnerStart.y + (rightWristInner.y - rightForearmInnerStart.y) * 0.25
    };
    const rightCtrl2_inner = {
        x: rightForearmInnerStart.x + (rightWristInner.x - rightForearmInnerStart.x) * 0.3,
        y: rightForearmInnerStart.y + (rightWristInner.y - rightForearmInnerStart.y) * 0.8
    };
    let rightForearmInnerPath = `M ${rightForearmInnerStart.x} ${rightForearmInnerStart.y} `;
    rightForearmInnerPath += `C ${rightCtrl1_inner.x} ${rightCtrl1_inner.y}, ${rightCtrl2_inner.x} ${rightCtrl2_inner.y}, ${rightWristInner.x} ${rightWristInner.y}`;
    armR.appendChild(svgEl('path', { d: rightForearmInnerPath, fill: 'none' }));

    // === ТОЧКИ ДЕЛЕНИЯ НА 3 ЧАСТИ ===
    const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

    const lShoulder = { x: leftCx, y: leftCy };
    const lElbow = { x: elbowLeftCx, y: elbowLeftCy };
    const lWrist = { x: wristLeftCx, y: wristLeftCy };

    const rShoulder = { x: rightCx, y: rightCy };
    const rElbow = { x: elbowRightCx, y: elbowRightCy };
    const rWrist = { x: wristRightCx, y: wristRightCy };

    const leftSE1 = lerp(lShoulder, lElbow, 1/3);
    const leftSE2 = lerp(lShoulder, lElbow, 2/3);
    const leftEW1 = lerp(lElbow, lWrist, 1/3);
    const leftEW2 = lerp(lElbow, lWrist, 2/3);

    const rightSE1 = lerp(rShoulder, rElbow, 1/3);
    const rightSE2 = lerp(rShoulder, rElbow, 2/3);
    const rightEW1 = lerp(rElbow, rWrist, 1/3);
    const rightEW2 = lerp(rElbow, rWrist, 2/3);

    const tinyR = headH * 0.008;
    const contourPoints = [
      leftSE1, leftSE2, leftEW1, leftEW2,
      rightSE1, rightSE2, rightEW1, rightEW2
    ];
    for (const pt of contourPoints) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: tinyR, fill: '#000000', opacity: 0.5
      }));
    }

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
