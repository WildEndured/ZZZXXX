window.App = window.App || {};

App.Arm = (function () {
  'use strict';

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
  }

  return { render };
})();
