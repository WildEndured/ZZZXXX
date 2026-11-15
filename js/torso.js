/* js/torso.js — App.Torso (архитектура 0..1) */

window.App = window.App || {};

App.Torso = (function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function render(group, state) {
    const pad = state.gridPad;
    const n = state.heads;
    const y0 = pad;
    const y1 = 1 - pad;
    const span = y1 - y0;
    const sectionH = span / n;

    const baseHeadW = state.baseHeadWidth * sectionH;

    // 1. Грудная клетка
    const chestY0 = y0 + sectionH + state.chest.offset * sectionH;
    const chestHeightPx = sectionH * state.chest.height;
    const chestRx = (baseHeadW * state.chest.width) / 2;
    const narrowFactor = state.chest.topNarrow;
    const wideFactor = state.chest.bottomWide;
    const cpTopX = chestRx * narrowFactor;
    const cpBottomX = chestRx * wideFactor;

    const chestPath = el('path', {
      fill: 'none',
      stroke: '#ff0000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    });

    const chestD = `
      M 0.5 ${chestY0}
      C ${0.5 + cpTopX} ${chestY0}, ${0.5 + chestRx} ${chestY0 + chestHeightPx * 0.3}, ${0.5 + chestRx} ${chestY0 + chestHeightPx * 0.6}
      C ${0.5 + chestRx} ${chestY0 + chestHeightPx * 0.9}, ${0.5 + cpBottomX} ${chestY0 + chestHeightPx}, 0.5 ${chestY0 + chestHeightPx}
      C ${0.5 - cpBottomX} ${chestY0 + chestHeightPx}, ${0.5 - chestRx} ${chestY0 + chestHeightPx * 0.9}, ${0.5 - chestRx} ${chestY0 + chestHeightPx * 0.6}
      C ${0.5 - chestRx} ${chestY0 + chestHeightPx * 0.3}, ${0.5 - cpTopX} ${chestY0}, 0.5 ${chestY0}
      Z
    `;
    chestPath.setAttribute('d', chestD.replace(/\s+/g, ' ').trim());
    group.appendChild(chestPath);

    // 2. Плечи (круги по бокам)
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

    group.appendChild(el('circle', {
      cx: shoulderLeftCx, cy: shoulderCy, r: shoulderRadius,
      fill: 'none',
      stroke: '#ff0000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    }));

    group.appendChild(el('circle', {
      cx: shoulderRightCx, cy: shoulderCy, r: shoulderRadius,
      fill: 'none',
      stroke: '#ff0000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    }));

    // 3. Таз
    const pelvisW = chestHeightPx * state.pelvis.widthMod;
    const pelvisH = (chestRx * 2) * state.pelvis.heightMod;
    const pelvisY0 = chestY0 + chestHeightPx + state.pelvis.offset * sectionH;
    const pelvisX0 = 0.5 - pelvisW / 2;
    const rxRadius = Math.min(pelvisW * state.pelvis.round, pelvisH / 2);

    group.appendChild(el('rect', {
      x: pelvisX0, y: pelvisY0,
      width: pelvisW, height: pelvisH,
      rx: rxRadius, ry: rxRadius,
      fill: 'none',
      stroke: '#ff0000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    }));
  }

  return { render };
})();
