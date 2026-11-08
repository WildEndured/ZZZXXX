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

    // Базовые линии (для отображения)
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

    // === НОВАЯ ЛОГИКА ДЛЯ ПРЕДПЛЕЧЬЯ ===
    
    // Внешняя кривая (1/3 расширение, 2/3 сужение/прямая)
    const elLeftOuterP1 = { x: elLeftOuter.x, y: elLeftOuter.y };
    const wrLeftOuterP1 = { x: wrLeftOuterCurve.x, y: wrLeftOuterCurve.y };
    // Точка перегиба (1/3 пути от локтя к запястью)
    const midOuterL = {
      x: elLeftOuterP1.x + (wrLeftOuterP1.x - elLeftOuterP1.x) * 0.33,
      y: elLeftOuterP1.y + (wrLeftOuterP1.y - elLeftOuterP1.y) * 0.33
    };
    
    // Контрольные точки для выпуклости
    const ctrlOuter1L = { 
      x: midOuterL.x + nxL * bulgeOuterL, 
      y: midOuterL.y + nyL * bulgeOuterL 
    };
    const ctrlOuter2L = { 
      x: wrLeftOuterP1.x + nxL * bulgeOuterL * 0.5, 
      y: wrLeftOuterP1.y + nyL * bulgeOuterL * 0.5 
    };

    const armLeftCurveOuter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armLeftCurveOuter.setAttribute('d', `M ${elLeftOuterP1.x} ${elLeftOuterP1.y} C ${ctrlOuter1L.x} ${ctrlOuter1L.y}, ${ctrlOuter2L.x} ${ctrlOuter2L.y}, ${wrLeftOuterP1.x} ${wrLeftOuterP1.y}`);
    armLeftCurveOuter.setAttribute('fill', 'none');
    armLeftCurveOuter.setAttribute('stroke', '#ff0000');
    armLeftCurveOuter.setAttribute('stroke-width', '1');
    armLeftCurveOuter.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armLeftCurveOuter);

    // Внутренняя кривая (1/3 расширение, 2/3 вогнутая)
    const elLeftInnerP1 = { x: elLeftInner.x, y: elLeftInner.y };
    const wrLeftInnerP1 = { x: wrLeftInnerCurve.x, y: wrLeftInnerCurve.y };
    const midInnerL = {
      x: elLeftInnerP1.x + (wrLeftInnerP1.x - elLeftInnerP1.x) * 0.33,
      y: elLeftInnerP1.y + (wrLeftInnerP1.y - elLeftInnerP1.y) * 0.33
    };
    
    const ctrlInner1L = { 
      x: midInnerL.x - nxL * bulgeInnerL, 
      y: midInnerL.y - nyL * bulgeInnerL 
    };
    const ctrlInner2L = { 
      x: wrLeftInnerP1.x - nxL * bulgeInnerL * 0.2, 
      y: wrLeftInnerP1.y - nyL * bulgeInnerL * 0.2 
    };

    const armLeftCurveInner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armLeftCurveInner.setAttribute('d', `M ${elLeftInnerP1.x} ${elLeftInnerP1.y} C ${ctrlInner1L.x} ${ctrlInner1L.y}, ${ctrlInner2L.x} ${ctrlInner2L.y}, ${wrLeftInnerP1.x} ${wrLeftInnerP1.y}`);
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

    // Внешняя кривая правой руки
    const elRightOuterP1 = { x: elRightOuter.x, y: elRightOuter.y };
    const wrRightOuterP1 = { x: wrRightOuterCurve.x, y: wrRightOuterCurve.y };
    const midOuterR = {
      x: elRightOuterP1.x + (wrRightOuterP1.x - elRightOuterP1.x) * 0.33,
      y: elRightOuterP1.y + (wrRightOuterP1.y - elRightOuterP1.y) * 0.33
    };
    
    const ctrlOuter1R = { 
      x: midOuterR.x + nxR * bulgeOuterR, 
      y: midOuterR.y + nyR * bulgeOuterR 
    };
    const ctrlOuter2R = { 
      x: wrRightOuterP1.x + nxR * bulgeOuterR * 0.5, 
      y: wrRightOuterP1.y + nyR * bulgeOuterR * 0.5 
    };

    const armRightCurveOuter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armRightCurveOuter.setAttribute('d', `M ${elRightOuterP1.x} ${elRightOuterP1.y} C ${ctrlOuter1R.x} ${ctrlOuter1R.y}, ${ctrlOuter2R.x} ${ctrlOuter2R.y}, ${wrRightOuterP1.x} ${wrRightOuterP1.y}`);
    armRightCurveOuter.setAttribute('fill', 'none');
    armRightCurveOuter.setAttribute('stroke', '#ff0000');
    armRightCurveOuter.setAttribute('stroke-width', '1');
    armRightCurveOuter.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armRightCurveOuter);

    // Внутренняя кривая правой руки
    const elRightInnerP1 = { x: elRightInner.x, y: elRightInner.y };
    const wrRightInnerP1 = { x: wrRightInnerCurve.x, y: wrRightInnerCurve.y };
    const midInnerR = {
      x: elRightInnerP1.x + (wrRightInnerP1.x - elRightInnerP1.x) * 0.33,
      y: elRightInnerP1.y + (wrRightInnerP1.y - elRightInnerP1.y) * 0.33
    };
    
    const ctrlInner1R = { 
      x: midInnerR.x - nxR * bulgeInnerR, 
      y: midInnerR.y - nyR * bulgeInnerR 
    };
    const ctrlInner2R = { 
      x: wrRightInnerP1.x - nxR * bulgeInnerR * 0.2, 
      y: wrRightInnerP1.y - nyR * bulgeInnerR * 0.2 
    };

    const armRightCurveInner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armRightCurveInner.setAttribute('d', `M ${elRightInnerP1.x} ${elRightInnerP1.y} C ${ctrlInner1R.x} ${ctrlInner1R.y}, ${ctrlInner2R.x} ${ctrlInner2R.y}, ${wrRightInnerP1.x} ${wrRightInnerP1.y}`);
    armRightCurveInner.setAttribute('fill', 'none');
    armRightCurveInner.setAttribute('stroke', '#ff0000');
    armRightCurveInner.setAttribute('stroke-width', '1');
    armRightCurveInner.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armRightCurveInner);
  }

  return { render };
})();
