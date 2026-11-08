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

    // Точки крепления на запястье (с учетом ползунков высоты)
    const bulgeOuterL = state.forearmOuter.bulge * shoulderRadius * 3;
    const bulgeInnerL = state.forearmInner.bulge * shoulderRadius * 3;
    const attachOuterShiftL = (state.forearmOuter.attach - 0.5) * 2 * wristLeftRadiusPx;
    const attachInnerShiftL = (state.forearmInner.attach - 0.5) * 2 * wristLeftRadiusPx;

    const wrLeftOuterCurve = { x: wrLeftOuter.x + (dxL / distL) * attachOuterShiftL, y: wrLeftOuter.y + (dyL / distL) * attachOuterShiftL };
    const wrLeftInnerCurve = { x: wrLeftInner.x + (dxL / distL) * attachInnerShiftL, y: wrLeftInner.y + (dyL / distL) * attachInnerShiftL };

    // Разбиваем на 1/3 и 2/3
    const l_1_3_x = elLeftOuter.x + dxL * 0.33;
    const l_1_3_y = elLeftOuter.y + dyL * 0.33;
    const l_2_3_x = wrLeftOuterCurve.x;
    const l_2_3_y = wrLeftOuterCurve.y;

    // Внешняя сторона: 1/3 выпуклая, 2/3 прямая
    const pathOuterL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const dOuterL = `
      M ${elLeftOuter.x} ${elLeftOuter.y}
      Q ${(elLeftOuter.x + l_1_3_x) / 2 + nxL * bulgeOuterL} ${(elLeftOuter.y + l_1_3_y) / 2 + nyL * bulgeOuterL} ${l_1_3_x} ${l_1_3_y}
      L ${l_2_3_x} ${l_2_3_y}
    `;
    pathOuterL.setAttribute('d', dOuterL.trim());
    pathOuterL.setAttribute('fill', 'none');
    pathOuterL.setAttribute('stroke', '#ff0000');
    pathOuterL.setAttribute('stroke-width', '1');
    pathOuterL.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(pathOuterL);

    // Внутренняя сторона: 1/3 выпуклая, 2/3 вогнутая
    const pathInnerL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const l_inner_1_3_x = elLeftInner.x + dxL * 0.33;
    const l_inner_1_3_y = elLeftInner.y + dyL * 0.33;
    
    const dInnerL = `
      M ${elLeftInner.x} ${elLeftInner.y}
      Q ${(elLeftInner.x + l_inner_1_3_x) / 2 - nxL * bulgeInnerL} ${(elLeftInner.y + l_inner_1_3_y) / 2 - nyL * bulgeInnerL} ${l_inner_1_3_x} ${l_inner_1_3_y}
      Q ${(l_inner_1_3_x + wrLeftInnerCurve.x) / 2 - nxL * bulgeInnerL} ${(l_inner_1_3_y + wrLeftInnerCurve.y) / 2 - nyL * bulgeInnerL} ${wrLeftInnerCurve.x} ${wrLeftInnerCurve.y}
    `;
    pathInnerL.setAttribute('d', dInnerL.trim());
    pathInnerL.setAttribute('fill', 'none');
    pathInnerL.setAttribute('stroke', '#ff0000');
    pathInnerL.setAttribute('stroke-width', '1');
    pathInnerL.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(pathInnerL);

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

    const bulgeOuterR = state.forearmOuter.bulge * shoulderRadius * 3;
    const bulgeInnerR = state.forearmInner.bulge * shoulderRadius * 3;
    const attachOuterShiftR = (state.forearmOuter.attach - 0.5) * 2 * wristRightRadiusPx;
    const attachInnerShiftR = (state.forearmInner.attach - 0.5) * 2 * wristRightRadiusPx;

    const wrRightOuterCurve = { x: wrRightOuter.x + (dxR / distR) * attachOuterShiftR, y: wrRightOuter.y + (dyR / distR) * attachOuterShiftR };
    const wrRightInnerCurve = { x: wrRightInner.x + (dxR / distR) * attachInnerShiftR, y: wrRightInner.y + (dyR / distR) * attachInnerShiftR };

    // Разбиваем на 1/3 и 2/3
    const r_1_3_x = elRightOuter.x + dxR * 0.33;
    const r_1_3_y = elRightOuter.y + dyR * 0.33;
    const r_2_3_x = wrRightOuterCurve.x;
    const r_2_3_y = wrRightOuterCurve.y;

    // Внешняя сторона: 1/3 выпуклая, 2/3 прямая
    const pathOuterR = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const dOuterR = `
      M ${elRightOuter.x} ${elRightOuter.y}
      Q ${(elRightOuter.x + r_1_3_x) / 2 + nxR * bulgeOuterR} ${(elRightOuter.y + r_1_3_y) / 2 + nyR * bulgeOuterR} ${r_1_3_x} ${r_1_3_y}
      L ${r_2_3_x} ${r_2_3_y}
    `;
    pathOuterR.setAttribute('d', dOuterR.trim());
    pathOuterR.setAttribute('fill', 'none');
    pathOuterR.setAttribute('stroke', '#ff0000');
    pathOuterR.setAttribute('stroke-width', '1');
    pathOuterR.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(pathOuterR);

    // Внутренняя сторона: 1/3 выпуклая, 2/3 вогнутая
    const pathInnerR = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const r_inner_1_3_x = elRightInner.x + dxR * 0.33;
    const r_inner_1_3_y = elRightInner.y + dyR * 0.33;
    
    const dInnerR = `
      M ${elRightInner.x} ${elRightInner.y}
      Q ${(elRightInner.x + r_inner_1_3_x) / 2 - nxR * bulgeInnerR} ${(elRightInner.y + r_inner_1_3_y) / 2 - nyR * bulgeInnerR} ${r_inner_1_3_x} ${r_inner_1_3_y}
      Q ${(r_inner_1_3_x + wrRightInnerCurve.x) / 2 - nxR * bulgeInnerR} ${(r_inner_1_3_y + wrRightInnerCurve.y) / 2 - nyR * bulgeInnerR} ${wrRightInnerCurve.x} ${wrRightInnerCurve.y}
    `;
    pathInnerR.setAttribute('d', dInnerR.trim());
    pathInnerR.setAttribute('fill', 'none');
    pathInnerR.setAttribute('stroke', '#ff0000');
    pathInnerR.setAttribute('stroke-width', '1');
    pathInnerR.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(pathInnerR);
  }

  return { render };
})();
