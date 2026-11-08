window.App = window.App || {};

App.Arm = (function () {
  'use strict';

  function getNormal(dx, dy, dist, isLeft) {
    const nx = isLeft ? (dy / dist) : (-dy / dist);
    const ny = isLeft ? (-dx / dist) : (dx / dist);
    return { nx, ny };
  }

  function render(group, state) {
    const pad = state.gridPad;
    const n = state.heads;
    const y0 = pad;
    const y1 = 1 - pad;
    const span = y1 - y0;
    const sectionH = span / n;
    
    const baseHeadW = state.baseHeadWidth * sectionH;

    const chestY0 = y0 + sectionH + (state.chest.offset * sectionH);
    const chestHeightPx = sectionH * state.chest.height;
    const chestRx = (baseHeadW * state.chest.width) / 2;
    const pelvisH = (chestRx * 2) * state.pelvis.heightMod;
    const pelvisY0 = chestY0 + chestHeightPx + (state.pelvis.offset * sectionH);
    const pelvisBottomY = pelvisY0 + pelvisH;

    const shoulderRadius = (chestHeightPx / 3) / 2;
    const shoulderCy = chestY0 + shoulderRadius;
    const t = (shoulderCy - chestY0) / chestHeightPx;
    let curveWidth;
    if (t <= 0.6) {
      const tNorm = t / 0.6;
      curveWidth = (chestRx * state.chest.topNarrow) + (chestRx - (chestRx * state.chest.topNarrow)) * Math.sin(tNorm * Math.PI / 2);
    } else {
      curveWidth = chestRx;
    }
    const shoulderLeftCx = 0.5 - curveWidth - shoulderRadius;
    const shoulderRightCx = 0.5 + curveWidth + shoulderRadius;

    // --- Левая рука ---
    const wristLeftRadiusPx = state.wristLeft.r * sectionH;
    const wristLeftCy = pelvisBottomY - wristLeftRadiusPx + (state.wristLeft.y * sectionH);
    const wristLeftCx = 0.5 - chestRx - shoulderRadius * 1.5 + (state.wristLeft.x * sectionH);

    const wristLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    wristLeft.setAttribute('cx', String(wristLeftCx));
    wristLeft.setAttribute('cy', String(wristLeftCy));
    wristLeft.setAttribute('r', String(wristLeftRadiusPx));
    wristLeft.setAttribute('fill', 'none');
    wristLeft.setAttribute('stroke', '#ff0000');
    wristLeft.setAttribute('stroke-width', '1');
    wristLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(wristLeft);

    const elbowLeftRadiusPx = state.elbowLeft.r * sectionH;
    const elbowLeftCx_base = (shoulderLeftCx + wristLeftCx) / 2;
    const elbowLeftCy_base = (shoulderCy + wristLeftCy) / 2;
    const elbowLeftCx = elbowLeftCx_base + (state.elbowLeft.x * sectionH);
    const elbowLeftCy = elbowLeftCy_base + (state.elbowLeft.y * sectionH);

    const elbowLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    elbowLeft.setAttribute('cx', String(elbowLeftCx));
    elbowLeft.setAttribute('cy', String(elbowLeftCy));
    elbowLeft.setAttribute('r', String(elbowLeftRadiusPx));
    elbowLeft.setAttribute('fill', 'none');
    elbowLeft.setAttribute('stroke', '#ff0000');
    elbowLeft.setAttribute('stroke-width', '1');
    elbowLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(elbowLeft);

    const dxL = wristLeftCx - elbowLeftCx;
    const dyL = wristLeftCy - elbowLeftCy;
    const distL = Math.hypot(dxL, dyL) || 1;
    const { nx: nxL, ny: nyL } = getNormal(dxL, dyL, distL, true);

    const elLeftOuter = { x: elbowLeftCx + nxL * elbowLeftRadiusPx, y: elbowLeftCy + nyL * elbowLeftRadiusPx };
    const elLeftInner = { x: elbowLeftCx - nxL * elbowLeftRadiusPx, y: elbowLeftCy - nyL * elbowLeftRadiusPx };
    const wrLeftOuter = { x: wristLeftCx + nxL * wristLeftRadiusPx, y: wristLeftCy + nyL * wristLeftRadiusPx };
    const wrLeftInner = { x: wristLeftCx - nxL * wristLeftRadiusPx, y: wristLeftCy - nyL * wristLeftRadiusPx };

    // Базовые линии
    const armLeftLineOuter = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    armLeftLineOuter.setAttribute('x1', String(elLeftOuter.x));
    armLeftLineOuter.setAttribute('y1', String(elLeftOuter.y));
    armLeftLineOuter.setAttribute('x2', String(wrLeftOuter.x));
    armLeftLineOuter.setAttribute('y2', String(wrLeftOuter.y));
    armLeftLineOuter.setAttribute('stroke', '#ff0000');
    armLeftLineOuter.setAttribute('stroke-width', '0.5');
    armLeftLineOuter.setAttribute('stroke-dasharray', '2 2');
    armLeftLineOuter.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armLeftLineOuter);

    const armLeftLineInner = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    armLeftLineInner.setAttribute('x1', String(elLeftInner.x));
    armLeftLineInner.setAttribute('y1', String(elLeftInner.y));
    armLeftLineInner.setAttribute('x2', String(wrLeftInner.x));
    armLeftLineInner.setAttribute('y2', String(wrLeftInner.y));
    armLeftLineInner.setAttribute('stroke', '#ff0000');
    armLeftLineInner.setAttribute('stroke-width', '0.5');
    armLeftLineInner.setAttribute('stroke-dasharray', '2 2');
    armLeftLineInner.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armLeftLineInner);

    const bulgeOuterL = state.forearmOuter.bulge * shoulderRadius * 3;
    const bulgeInnerL = state.forearmInner.bulge * shoulderRadius * 3;
    const attachOuterShiftL = (state.forearmOuter.attach - 0.5) * 2 * wristLeftRadiusPx;
    const attachInnerShiftL = (state.forearmInner.attach - 0.5) * 2 * wristLeftRadiusPx;

    const wrLeftOuterCurve = { 
      x: wrLeftOuter.x + (dxL / distL) * attachOuterShiftL, 
      y: wrLeftOuter.y + (dyL / distL) * attachOuterShiftL 
    };
    const wrLeftInnerCurve = { 
      x: wrLeftInner.x + (dxL / distL) * attachInnerShiftL, 
      y: wrLeftInner.y + (dyL / distL) * attachInnerShiftL 
    };

    // === ЛЕВАЯ РУКА: ВНЕШНЯЯ КРИВАЯ ===
    const p1OuterL = { x: elLeftOuter.x, y: elLeftOuter.y };
    const p2OuterL = { x: wrLeftOuterCurve.x, y: wrLeftOuterCurve.y };
    
    // Точка перегиба на 1/3 пути от локтя к запястью
    const tOuterL = 0.33;
    const midOuterL = {
      x: p1OuterL.x + (p2OuterL.x - p1OuterL.x) * tOuterL,
      y: p1OuterL.y + (p2OuterL.y - p1OuterL.y) * tOuterL
    };
    
    // Контрольная точка для первой 1/3 (выпуклость наружу)
    const ctrlFirstOuterL = {
      x: p1OuterL.x + (midOuterL.x - p1OuterL.x) * 0.5 + nxL * bulgeOuterL,
      y: p1OuterL.y + (midOuterL.y - p1OuterL.y) * 0.5 + nyL * bulgeOuterL
    };
    
    // Контрольная точка для последних 2/3 (плавный спуск)
    const ctrlSecondOuterL = {
      x: midOuterL.x + (p2OuterL.x - midOuterL.x) * 0.5 - nxL * (bulgeOuterL * 0.2),
      y: midOuterL.y + (p2OuterL.y - midOuterL.y) * 0.5 - nyL * (bulgeOuterL * 0.2)
    };

    const armLeftCurveOuter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armLeftCurveOuter.setAttribute('d', `
      M ${p1OuterL.x} ${p1OuterL.y}
      Q ${ctrlFirstOuterL.x} ${ctrlFirstOuterL.y} ${midOuterL.x} ${midOuterL.y}
      Q ${ctrlSecondOuterL.x} ${ctrlSecondOuterL.y} ${p2OuterL.x} ${p2OuterL.y}
    `);
    armLeftCurveOuter.setAttribute('fill', 'none');
    armLeftCurveOuter.setAttribute('stroke', '#ff0000');
    armLeftCurveOuter.setAttribute('stroke-width', '1');
    armLeftCurveOuter.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armLeftCurveOuter);

    // === ЛЕВАЯ РУКА: ВНУТРЕННЯЯ КРИВАЯ ===
    const p1InnerL = { x: elLeftInner.x, y: elLeftInner.y };
    const p2InnerL = { x: wrLeftInnerCurve.x, y: wrLeftInnerCurve.y };
    
    const tInnerL = 0.33;
    const midInnerL = {
      x: p1InnerL.x + (p2InnerL.x - p1InnerL.x) * tInnerL,
      y: p1InnerL.y + (p2InnerL.y - p1InnerL.y) * tInnerL
    };
    
    // Контрольная точка для первой 1/3 (выпуклость внутрь, создавая мышечный объем)
    const ctrlFirstInnerL = {
      x: p1InnerL.x + (midInnerL.x - p1InnerL.x) * 0.5 - nxL * bulgeInnerL,
      y: p1InnerL.y + (midInnerL.y - p1InnerL.y) * 0.5 - nyL * bulgeInnerL
    };
    
    // Контрольная точка для последних 2/3 (ВОГНУТОСТЬ внутрь)
    // Для вогнутости сдвигаем контрольную точку в обратную сторону от bulgeInnerL
    const ctrlSecondInnerL = {
      x: midInnerL.x + (p2InnerL.x - midInnerL.x) * 0.5 + nxL * (bulgeInnerL * 0.8),
      y: midInnerL.y + (p2InnerL.y - midInnerL.y) * 0.5 + nyL * (bulgeInnerL * 0.8)
    };

    const armLeftCurveInner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armLeftCurveInner.setAttribute('d', `
      M ${p1InnerL.x} ${p1InnerL.y}
      Q ${ctrlFirstInnerL.x} ${ctrlFirstInnerL.y} ${midInnerL.x} ${midInnerL.y}
      Q ${ctrlSecondInnerL.x} ${ctrlSecondInnerL.y} ${p2InnerL.x} ${p2InnerL.y}
    `);
    armLeftCurveInner.setAttribute('fill', 'none');
    armLeftCurveInner.setAttribute('stroke', '#ff0000');
    armLeftCurveInner.setAttribute('stroke-width', '1');
    armLeftCurveInner.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armLeftCurveInner);

    // --- Правая рука ---
    const wristRightRadiusPx = state.wristRight.r * sectionH;
    const wristRightCy = pelvisBottomY - wristRightRadiusPx + (state.wristRight.y * sectionH);
    const wristRightCx = 0.5 + chestRx + shoulderRadius * 1.5 + (state.wristRight.x * sectionH);

    const wristRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    wristRight.setAttribute('cx', String(wristRightCx));
    wristRight.setAttribute('cy', String(wristRightCy));
    wristRight.setAttribute('r', String(wristRightRadiusPx));
    wristRight.setAttribute('fill', 'none');
    wristRight.setAttribute('stroke', '#ff0000');
    wristRight.setAttribute('stroke-width', '1');
    wristRight.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(wristRight);

    const elbowRightRadiusPx = state.elbowRight.r * sectionH;
    const elbowRightCx_base = (shoulderRightCx + wristRightCx) / 2;
    const elbowRightCy_base = (shoulderCy + wristRightCy) / 2;
    const elbowRightCx = elbowRightCx_base + (state.elbowRight.x * sectionH);
    const elbowRightCy = elbowRightCy_base + (state.elbowRight.y * sectionH);

    const elbowRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    elbowRight.setAttribute('cx', String(elbowRightCx));
    elbowRight.setAttribute('cy', String(elbowRightCy));
    elbowRight.setAttribute('r', String(elbowRightRadiusPx));
    elbowRight.setAttribute('fill', 'none');
    elbowRight.setAttribute('stroke', '#ff0000');
    elbowRight.setAttribute('stroke-width', '1');
    elbowRight.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(elbowRight);

    const dxR = wristRightCx - elbowRightCx;
    const dyR = wristRightCy - elbowRightCy;
    const distR = Math.hypot(dxR, dyR) || 1;
    const { nx: nxR, ny: nyR } = getNormal(dxR, dyR, distR, false);

    const elRightOuter = { x: elbowRightCx + nxR * elbowRightRadiusPx, y: elbowRightCy + nyR * elbowRightRadiusPx };
    const elRightInner = { x: elbowRightCx - nxR * elbowRightRadiusPx, y: elbowRightCy - nyR * elbowRightRadiusPx };
    const wrRightOuter = { x: wristRightCx + nxR * wristRightRadiusPx, y: wristRightCy + nyR * wristRightRadiusPx };
    const wrRightInner = { x: wristRightCx - nxR * wristRightRadiusPx, y: wristRightCy - nyR * wristRightRadiusPx };

    const armRightLineOuter = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    armRightLineOuter.setAttribute('x1', String(elRightOuter.x));
    armRightLineOuter.setAttribute('y1', String(elRightOuter.y));
    armRightLineOuter.setAttribute('x2', String(wrRightOuter.x));
    armRightLineOuter.setAttribute('y2', String(wrRightOuter.y));
    armRightLineOuter.setAttribute('stroke', '#ff0000');
    armRightLineOuter.setAttribute('stroke-width', '0.5');
    armRightLineOuter.setAttribute('stroke-dasharray', '2 2');
    armRightLineOuter.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armRightLineOuter);

    const armRightLineInner = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    armRightLineInner.setAttribute('x1', String(elRightInner.x));
    armRightLineInner.setAttribute('y1', String(elRightInner.y));
    armRightLineInner.setAttribute('x2', String(wrRightInner.x));
    armRightLineInner.setAttribute('y2', String(wrRightInner.y));
    armRightLineInner.setAttribute('stroke', '#ff0000');
    armRightLineInner.setAttribute('stroke-width', '0.5');
    armRightLineInner.setAttribute('stroke-dasharray', '2 2');
    armRightLineInner.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armRightLineInner);

    const bulgeOuterR = state.forearmOuter.bulge * shoulderRadius * 3;
    const bulgeInnerR = state.forearmInner.bulge * shoulderRadius * 3;
    const attachOuterShiftR = (state.forearmOuter.attach - 0.5) * 2 * wristRightRadiusPx;
    const attachInnerShiftR = (state.forearmInner.attach - 0.5) * 2 * wristRightRadiusPx;

    const wrRightOuterCurve = { 
      x: wrRightOuter.x + (dxR / distR) * attachOuterShiftR, 
      y: wrRightOuter.y + (dyR / distR) * attachOuterShiftR 
    };
    const wrRightInnerCurve = { 
      x: wrRightInner.x + (dxR / distR) * attachInnerShiftR, 
      y: wrRightInner.y + (dyR / distR) * attachInnerShiftR 
    };

    // === ПРАВАЯ РУКА: ВНЕШНЯЯ КРИВАЯ ===
    const p1OuterR = { x: elRightOuter.x, y: elRightOuter.y };
    const p2OuterR = { x: wrRightOuterCurve.x, y: wrRightOuterCurve.y };
    
    const tOuterR = 0.33;
    const midOuterR = {
      x: p1OuterR.x + (p2OuterR.x - p1OuterR.x) * tOuterR,
      y: p1OuterR.y + (p2OuterR.y - p1OuterR.y) * tOuterR
    };
    
    const ctrlFirstOuterR = {
      x: p1OuterR.x + (midOuterR.x - p1OuterR.x) * 0.5 + nxR * bulgeOuterR,
      y: p1OuterR.y + (midOuterR.y - p1OuterR.y) * 0.5 + nyR * bulgeOuterR
    };
    
    const ctrlSecondOuterR = {
      x: midOuterR.x + (p2OuterR.x - midOuterR.x) * 0.5 - nxR * (bulgeOuterR * 0.2),
      y: midOuterR.y + (p2OuterR.y - midOuterR.y) * 0.5 - nyR * (bulgeOuterR * 0.2)
    };

    const armRightCurveOuter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armRightCurveOuter.setAttribute('d', `
      M ${p1OuterR.x} ${p1OuterR.y}
      Q ${ctrlFirstOuterR.x} ${ctrlFirstOuterR.y} ${midOuterR.x} ${midOuterR.y}
      Q ${ctrlSecondOuterR.x} ${ctrlSecondOuterR.y} ${p2OuterR.x} ${p2OuterR.y}
    `);
    armRightCurveOuter.setAttribute('fill', 'none');
    armRightCurveOuter.setAttribute('stroke', '#ff0000');
    armRightCurveOuter.setAttribute('stroke-width', '1');
    armRightCurveOuter.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armRightCurveOuter);

    // === ПРАВАЯ РУКА: ВНУТРЕННЯЯ КРИВАЯ ===
    const p1InnerR = { x: elRightInner.x, y: elRightInner.y };
    const p2InnerR = { x: wrRightInnerCurve.x, y: wrRightInnerCurve.y };
    
    const tInnerR = 0.33;
    const midInnerR = {
      x: p1InnerR.x + (p2InnerR.x - p1InnerR.x) * tInnerR,
      y: p1InnerR.y + (p2InnerR.y - p1InnerR.y) * tInnerR
    };
    
    const ctrlFirstInnerR = {
      x: p1InnerR.x + (midInnerR.x - p1InnerR.x) * 0.5 - nxR * bulgeInnerR,
      y: p1InnerR.y + (midInnerR.y - p1InnerR.y) * 0.5 - nyR * bulgeInnerR
    };
    
    // Вогнутость для правой руки (сдвиг в ту же сторону, что и нормаль)
    const ctrlSecondInnerR = {
      x: midInnerR.x + (p2InnerR.x - midInnerR.x) * 0.5 + nxR * (bulgeInnerR * 0.8),
      y: midInnerR.y + (p2InnerR.y - midInnerR.y) * 0.5 + nyR * (bulgeInnerR * 0.8)
    };

    const armRightCurveInner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armRightCurveInner.setAttribute('d', `
      M ${p1InnerR.x} ${p1InnerR.y}
      Q ${ctrlFirstInnerR.x} ${ctrlFirstInnerR.y} ${midInnerR.x} ${midInnerR.y}
      Q ${ctrlSecondInnerR.x} ${ctrlSecondInnerR.y} ${p2InnerR.x} ${p2InnerR.y}
    `);
    armRightCurveInner.setAttribute('fill', 'none');
    armRightCurveInner.setAttribute('stroke', '#ff0000');
    armRightCurveInner.setAttribute('stroke-width', '1');
    armRightCurveInner.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armRightCurveInner);
  }

  return { render };
})();
