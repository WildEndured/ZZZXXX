window.App = window.App || {};

App.Torso = (function () {
  'use strict';

  function render(group, state) {
    const pad = state.gridPad;
    const n = state.heads;
    const y0 = pad;
    const y1 = 1 - pad;
    const span = y1 - y0;
    const sectionH = span / n;
    
    const baseHeadW = state.baseHeadWidth * sectionH;
    
    // --- Шея ---
    // Голова (чтобы понять, где её низ)
    const headH = state.head.height * sectionH;
    const headRy = headH / 2;
    const headCy = y0 + state.head.offset * sectionH + headRy;
    const headBottomY = headCy + headRy; // Самая нижняя точка эллипса головы

    // Грудная клетка
    const chestY0 = y0 + sectionH + (state.chest.offset * sectionH);
    
    // Ширина шеи (в долях baseHeadW)
    const neckHalfWidth = (state.neck.width * baseHeadW) / 2;

    // Рисуем две вертикальные линии шеи
    const neckLeft = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    neckLeft.setAttribute('x1', String(0.5 - neckHalfWidth));
    neckLeft.setAttribute('y1', String(headBottomY));
    neckLeft.setAttribute('x2', String(0.5 - neckHalfWidth));
    neckLeft.setAttribute('y2', String(chestY0));
    neckLeft.setAttribute('stroke', '#ff0000');
    neckLeft.setAttribute('stroke-width', '1');
    neckLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(neckLeft);

    const neckRight = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    neckRight.setAttribute('x1', String(0.5 + neckHalfWidth));
    neckRight.setAttribute('y1', String(headBottomY));
    neckRight.setAttribute('x2', String(0.5 + neckHalfWidth));
    neckRight.setAttribute('y2', String(chestY0));
    neckRight.setAttribute('stroke', '#ff0000');
    neckRight.setAttribute('stroke-width', '1');
    neckRight.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(neckRight);

    // --- Грудная клетка ---
    const chestHeightPx = sectionH * state.chest.height;
    const chestRx = (baseHeadW * state.chest.width) / 2;
    const narrowFactor = state.chest.topNarrow;
    const wideFactor = state.chest.bottomWide;
    const cpTopX = chestRx * narrowFactor;
    const cpBottomX = chestRx * wideFactor;

    const chestPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `
      M 0.5 ${chestY0}
      C ${0.5 + cpTopX} ${chestY0}, ${0.5 + chestRx} ${chestY0 + chestHeightPx * 0.3}, ${0.5 + chestRx} ${chestY0 + chestHeightPx * 0.6}
      C ${0.5 + chestRx} ${chestY0 + chestHeightPx * 0.9}, ${0.5 + cpBottomX} ${chestY0 + chestHeightPx}, 0.5 ${chestY0 + chestHeightPx}
      C ${0.5 - cpBottomX} ${chestY0 + chestHeightPx}, ${0.5 - chestRx} ${chestY0 + chestHeightPx * 0.9}, ${0.5 - chestRx} ${chestY0 + chestHeightPx * 0.6}
      C ${0.5 - chestRx} ${chestY0 + chestHeightPx * 0.3}, ${0.5 - cpTopX} ${chestY0}, 0.5 ${chestY0}
      Z
    `;
    chestPath.setAttribute('d', d.trim());
    chestPath.setAttribute('fill', 'none');
    chestPath.setAttribute('stroke', '#ff0000');
    chestPath.setAttribute('stroke-width', '1');
    chestPath.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(chestPath);

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

    const shoulderLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    shoulderLeft.setAttribute('cx', String(shoulderLeftCx));
    shoulderLeft.setAttribute('cy', String(shoulderCy));
    shoulderLeft.setAttribute('r', String(shoulderRadius));
    shoulderLeft.setAttribute('fill', 'none');
    shoulderLeft.setAttribute('stroke', '#ff0000');
    shoulderLeft.setAttribute('stroke-width', '1');
    shoulderLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(shoulderLeft);

    const shoulderRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    shoulderRight.setAttribute('cx', String(shoulderRightCx));
    shoulderRight.setAttribute('cy', String(shoulderCy));
    shoulderRight.setAttribute('r', String(shoulderRadius));
    shoulderRight.setAttribute('fill', 'none');
    shoulderRight.setAttribute('stroke', '#ff0000');
    shoulderRight.setAttribute('stroke-width', '1');
    shoulderRight.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(shoulderRight);

    // --- Таз ---
    const pelvisW = chestHeightPx * state.pelvis.widthMod;
    const pelvisH = (chestRx * 2) * state.pelvis.heightMod;
    const pelvisY0 = chestY0 + chestHeightPx + (state.pelvis.offset * sectionH);
    const pelvisX0 = 0.5 - pelvisW / 2;
    const rxRadius = Math.min(pelvisW * state.pelvis.round, pelvisH / 2);

    const pelvisRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    pelvisRect.setAttribute('x', String(pelvisX0));
    pelvisRect.setAttribute('y', String(pelvisY0));
    pelvisRect.setAttribute('width', String(pelvisW));
    pelvisRect.setAttribute('height', String(pelvisH));
    pelvisRect.setAttribute('rx', String(rxRadius));
    pelvisRect.setAttribute('ry', String(rxRadius));
    pelvisRect.setAttribute('fill', 'none');
    pelvisRect.setAttribute('stroke', '#ff0000');
    pelvisRect.setAttribute('stroke-width', '1');
    pelvisRect.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(pelvisRect);
  }

  return { render };
})();
