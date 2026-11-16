/* js/arm.js — Этап 2: Руки (плечи, локти, запястья, плавный контур верхней части) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.045,
    elbowLeftX: 0,
    elbowLeftY: 0,
    elbowRightX: 0,
    elbowRightY: 0,
    wristRadius: 0.035,
    wristLeftX: 0,
    wristLeftY: 0,
    wristRightX: 0,
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

    // === ВНЕШНИЙ КОНТУР: ПЛЕЧО -> ЛОКОТЬ (Плавный переход) ===
    // Левая рука
    const leftShoulderOuter = { x: leftCx - shoulderRadius, y: leftCy };
    const leftElbowOuter = { x: elbowLeftCx - elbowRadius, y: elbowLeftCy };
    
    // Точка перехода (1/3 пути)
    const leftMid1 = { 
        x: leftShoulderOuter.x + (leftElbowOuter.x - leftShoulderOuter.x) / 3,
        y: leftShoulderOuter.y + (leftElbowOuter.y - leftShoulderOuter.y) / 3
    };

    // Контрольная точка для выпуклости (выносим наружу)
    const leftCtrl1 = { 
        x: leftShoulderOuter.x - shoulderRadius * 0.4, 
        y: leftShoulderOuter.y + (leftMid1.y - leftShoulderOuter.y) * 0.5 
    };
    
    // Контрольная точка для стыка (лежит на прямой линии, чтобы обеспечить плавность)
    // Берем точку на 1/3 пути от leftMid1 к leftElbowOuter
    const leftCtrl2 = {
        x: leftMid1.x + (leftElbowOuter.x - leftMid1.x) / 3,
        y: leftMid1.y + (leftElbowOuter.y - leftMid1.y) / 3
    };

    let leftArmPath = `M ${leftShoulderOuter.x} ${leftShoulderOuter.y} `;
    // Кубическая кривая: от плеча к точке 1/3, с плавным выходом
    leftArmPath += `C ${leftCtrl1.x} ${leftCtrl1.y}, ${leftCtrl2.x} ${leftCtrl2.y}, ${leftMid1.x} ${leftMid1.y} `;
    // Прямая линия до локтя
    leftArmPath += `L ${leftElbowOuter.x} ${leftElbowOuter.y}`;

    armL.appendChild(svgEl('path', { d: leftArmPath, fill: 'none' }));

    // Правая рука (симметрично)
    const rightShoulderOuter = { x: rightCx + shoulderRadius, y: rightCy };
    const rightElbowOuter = { x: elbowRightCx + elbowRadius, y: elbowRightCy };
    const rightMid1 = { 
        x: rightShoulderOuter.x + (rightElbowOuter.x - rightShoulderOuter.x) / 3,
        y: rightShoulderOuter.y + (rightElbowOuter.y - rightShoulderOuter.y) / 3
    };
    
    const rightCtrl1 = { 
        x: rightShoulderOuter.x + shoulderRadius * 0.4, 
        y: rightShoulderOuter.y + (rightMid1.y - rightShoulderOuter.y) * 0.5 
    };
    
    const rightCtrl2 = {
        x: rightMid1.x + (rightElbowOuter.x - rightMid1.x) / 3,
        y: rightMid1.y + (rightElbowOuter.y - rightMid1.y) / 3
    };

    let rightArmPath = `M ${rightShoulderOuter.x} ${rightShoulderOuter.y} `;
    rightArmPath += `C ${rightCtrl1.x} ${rightCtrl1.y}, ${rightCtrl2.x} ${rightCtrl2.y}, ${rightMid1.x} ${rightMid1.y} `;
    rightArmPath += `L ${rightElbowOuter.x} ${rightElbowOuter.y}`;

    armR.appendChild(svgEl('path', { d: rightArmPath, fill: 'none' }));

    // === ТОЧКИ ДЕЛЕНИЯ НА 3 ЧАСТИ (для отладки) ===
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
