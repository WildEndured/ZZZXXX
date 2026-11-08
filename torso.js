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

    const headW = state.head.width * sectionH;
    
    // Грудная клетка
    const chestY0 = y0 + sectionH + (state.chest.offset * sectionH);
    const chestHeightPx = sectionH * state.chest.height;
    const chestRx = (headW * state.chest.width) / 2;
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

    // Плечи
    const shoulderRadius = (chestHeightPx / 3) / 2;
    const shoulderCy = chestY0 + shoulderRadius;
    const t = (shoulderCy - chestY0) / chestHeightPx;
    let curveWidth;
    if (t <= 0.6) {
      const tNorm = t / 0.6;
      curveWidth = cpTopX + (chestRx - cpTopX) * Math.sin(tNorm * Math.PI / 2);
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

    // Таз
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
