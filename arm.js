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

    const bulgeOuterL = state.forearmOuter.bulge * shoulderRadius * 4; // Увеличил множитель для наглядности
    const bulgeInnerL = state.forearmInner.bulge * shoulderRadius * 4;
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

    // === ЛЕВАЯ РУКА: ВНЕШНЯЯ КРИВАЯ (2 сегмента) ===
    // Точка перегиба на 1/3 пути
    const midOuterL = {
      x: elLeftOuter.x + (wrLeftOuterCurve.x - elLeftOuter.x) * 0.33,
      y: elLeftOuter.y + (wrLeftOuterCurve.y - elLeftOuter.y) * 0.33
    };
    
    // Контрольная точка для первой 1/3 (выпуклость)
    const cp1L = { 
      x: elLeftOuter.x + (midOuterL.x - elLeftOuter.x) * 0.5 + nxL * bulgeOuterL, 
      y: elLeftOuter.y + (midOuterL.y - elLeftOuter.y) * 0.5 + nyL * bulgeOuterL 
    };
    
    // Контрольная точка для последних 2/3 (плавное сужение к запястью)
    const cp2L = { 
      x: midOuterL.x + (wrLeftOuterCurve.x - midOuterL.x) * 0.5 - nxL * (bulgeOuterL * 0.2), 
      y: midOuterL.y + (wrLeftOuterCurve.y - midOuterL.y) * 0.5 - nyL * (bulgeOuterL * 0.2) 
    };

    const armLeftCurveOuter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armLeftCurveOuter.setAttribute('d', `
      M ${elLeftOuter.x} ${elLeftOuter.y}
      C ${cp1L.x} ${cp1L.y}, ${midOuterL.x + nxL * bulgeOuterL * 0.3} ${midOuterL.y + nyL * bulgeOuterL * 0.3}, ${midOuterL.x} ${midOuterL.y}
      C ${cp2L.x} ${cp2L.y}, ${wrLeftOuterCurve.x - nxL * bulgeOuterL * 0.1} ${wrLeftOuterCurve.y - nyL * bulgeOuterL * 0.1}, ${wrLeftOuterCurve.x} ${wrLeftOuterCurve.y}
    `);
    armLeftCurveOuter.setAttribute('fill', 'none');
    armLeftCurveOuter.setAttribute('stroke', '#ff0000');
    armLeftCurveOuter.setAttribute('stroke-width', '1');
    armLeftCurveOuter.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armLeftCurveOuter);

    // === ЛЕВАЯ РУКА: ВНУТРЕННЯЯ КРИВАЯ (2 сегмента) ===
    const midInnerL = {
      x: elLeftInner.x + (wrLeftInnerCurve.x - elLeftInner.x) * 0.33,
      y: elLeftInner.y + (wrLeftInnerCurve.y - elLeftInner.y) * 0.33
    };
    
    const cp1InnerL = { 
      x: elLeftInner.x + (midInnerL.x - elLeftInner.x) * 0.5 - nxL * bulgeInnerL, 
      y: elLeftInner.y + (midInnerL.y - elLeftInner.y) * 0.5 - nyL * bulgeInnerL 
    };
    
    const cp2InnerL = { 
      x: midInnerL.x + (wrLeftInnerCurve.x - midInnerL.x) * 0.5 + nxL * (bulgeInnerL * 0.2), 
      y: midInnerL.y + (wrLeftInnerCurve.y - midInnerL.y) * 0.5 + nyL * (bulgeInnerL * 0.2) 
    };

    const armLeftCurveInner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armLeftCurveInner.setAttribute('d', `
      M ${elLeftInner.x} ${elLeftInner.y}
      C ${cp1InnerL.x} ${cp1InnerL.y}, ${midInnerL.x - nxL * bulgeInnerL * 0.3} ${midInnerL.y - nyL * bulgeInnerL * 0.3}, ${midInnerL.x} ${midInnerL.y}
      C ${cp2InnerL.x} ${cp2InnerL.y}, ${wrLeftInnerCurve.x + nxL * bulgeInnerL * 0.1} ${wrLeftInnerCurve.y + nyL * bulgeInnerL * 0.1}, ${wrLeftInnerCurve.x} ${wrLeftInnerCurve.y}
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

    const bulgeOuterR = state.forearmOuter.bulge * shoulderRadius * 4;
    const bulgeInnerR = state.forearmInner.bulge * shoulderRadius * 4;
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

    // === ПРАВАЯ РУКА: ВНЕШНЯЯ КРИВАЯ (2 сегмента) ===
    const midOuterR = {
      x: elRightOuter.x + (wrRightOuterCurve.x - elRightOuter.x) * 0.33,
      y: elRightOuter.y + (wrRightOuterCurve.y - elRightOuter.y) * 0.33
    };
    
    const cp1R = { 
      x: elRightOuter.x + (midOuterR.x - elRightOuter.x) * 0.5 + nxR * bulgeOuterR, 
      y: elRightOuter.y + (midOuterR.y - elRightOuter.y) * 0.5 + nyR * bulgeOuterR 
    };
    
    const cp2R = { 
      x: midOuterR.x + (wrRightOuterCurve.x - midOuterR.x) * 0.5 - nxR * (bulgeOuterR * 0.2), 
      y: midOuterR.y + (wrRightOuterCurve.y - midOuterR.y) * 0.5 - nyR * (bulgeOuterR * 0.2) 
    };

    const armRightCurveOuter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armRightCurveOuter.setAttribute('d', `
      M ${elRightOuter.x} ${elRightOuter.y}
      C ${cp1R.x} ${cp1R.y}, ${midOuterR.x + nxR * bulgeOuterR * 0.3} ${midOuterR.y + nyR * bulgeOuterR * 0.3}, ${midOuterR.x} ${midOuterR.y}
      C ${cp2R.x} ${cp2R.y}, ${wrRightOuterCurve.x - nxR * bulgeOuterR * 0.1} ${wrRightOuterCurve.y - nyR * bulgeOuterR * 0.1}, ${wrRightOuterCurve.x} ${wrRightOuterCurve.y}
    `);
    armRightCurveOuter.setAttribute('fill', 'none');
    armRightCurveOuter.setAttribute('stroke', '#ff0000');
    armRightCurveOuter.setAttribute('stroke-width', '1');
    armRightCurveOuter.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armRightCurveOuter);

    // === ПРАВАЯ РУКА: ВНУТРЕННЯЯ КРИВАЯ (2 сегмента) ===
    const midInnerR = {
      x: elRightInner.x + (wrRightInnerCurve.x - elRightInner.x) * 0.33,
      y: elRightInner.y + (wrRightInnerCurve.y - elRightInner.y) * 0.33
    };
    
    const cp1InnerR = { 
      x: elRightInner.x + (midInnerR.x - elRightInner.x) * 0.5 - nxR * bulgeInnerR, 
      y: elRightInner.y + (midInnerR.y - elRightInner.y) * 0.5 - nyR * bulgeInnerR 
    };
    
    const cp2InnerR = { 
      x: midInnerR.x + (wrRightInnerCurve.x - midInnerR.x) * 0.5 + nxR * (bulgeInnerR * 0.2), 
      y: midInnerR.y + (wrRightInnerCurve.y - midInnerR.y) * 0.5 + nyR * (bulgeInnerR * 0.2) 
    };

    const armRightCurveInner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    armRightCurveInner.setAttribute('d', `
      M ${elRightInner.x} ${elRightInner.y}
      C ${cp1InnerR.x} ${cp1InnerR.y}, ${midInnerR.x - nxR * bulgeInnerR * 0.3} ${midInnerR.y - nyR * bulgeInnerR * 0.3}, ${midInnerR.x} ${midInnerR.y}
      C ${cp2InnerR.x} ${cp2InnerR.y}, ${wrRightInnerCurve.x + nxR * bulgeInnerR * 0.1} ${wrRightInnerCurve.y + nyR * bulgeInnerR * 0.1}, ${wrRightInnerCurve.x} ${wrRightInnerCurve.y}
    `);
    armRightCurveInner.setAttribute('fill', 'none');
    armRightCurveInner.setAttribute('stroke', '#ff0000');
    armRightCurveInner.setAttribute('stroke-width', '1');
    armRightCurveInner.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(armRightCurveInner);
  }

  return { render };
})();
