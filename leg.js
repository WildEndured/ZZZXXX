window.App = window.App || {};

App.Leg = (function () {
  'use strict';

  function render(group, state) {
    const pad = state.gridPad;
    const n = state.heads;
    const y0 = pad;
    const y1 = 1 - pad;
    const span = y1 - y0;
    const sectionH = span / n;
    const headH = state.head.height * sectionH;

    const baseHeadW = state.baseHeadWidth * sectionH;

    // --- Грудная клетка (те же формулы, что и в torso.js) ---
    const chestY0 = y0 + sectionH + (state.chest.offset * sectionH);
    const chestHeightPx = sectionH * state.chest.height;
    const chestRx = (baseHeadW * state.chest.width) / 2;

    // --- Таз (те же формулы, что и в torso.js) ---
    const pelvisW = chestHeightPx * state.pelvis.widthMod;
    const pelvisH = (chestRx * 2) * state.pelvis.heightMod;
    const pelvisY0 = chestY0 + chestHeightPx + (state.pelvis.offset * sectionH);
    const pelvisBottomY = pelvisY0 + pelvisH;
    const pelvisX0 = 0.5 - pelvisW / 2;
    const pelvisX1 = 0.5 + pelvisW / 2;

    // --- Плечи / запястья ---
    const shoulderRadius = (chestHeightPx / 3) / 2;

    const wristLeftRadiusPx = state.wristLeft.r * sectionH;
    const wristLeftCy = pelvisBottomY - wristLeftRadiusPx + (state.wristLeft.y * sectionH);
    const wristLeftCx = 0.5 - chestRx - shoulderRadius * 1.5 + (state.wristLeft.x * sectionH);

    const wristRightRadiusPx = state.wristRight.r * sectionH;
    const wristRightCy = pelvisBottomY - wristRightRadiusPx + (state.wristRight.y * sectionH);
    const wristRightCx = 0.5 + chestRx + shoulderRadius * 1.5 + (state.wristRight.x * sectionH);

    // --- Бёдра: крепимся ровно к боковым граням таза ---
    drawThigh(group, state, {
      side: 'left',
      attachX: pelvisX0,        // левая грань таза
      pelvisY0,
      pelvisH,
      sectionH,
    });
    drawThigh(group, state, {
      side: 'right',
      attachX: pelvisX1,        // правая грань таза
      pelvisY0,
      pelvisH,
      sectionH,
    });

    // --- Колени и лодыжки ---
    const kneeOffsetY = headH;
    const ankleOffsetY = headH;

    const kneeLeftRadiusPx = state.kneeLeft.r * sectionH;
    const kneeLeftCy_base = pelvisBottomY + kneeOffsetY;
    const kneeLeftCx_base = wristLeftCx;
    const kneeLeftCx = kneeLeftCx_base + (state.kneeLeft.x * sectionH);
    const kneeLeftCy = kneeLeftCy_base + (state.kneeLeft.y * sectionH);

    const kneeLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    kneeLeft.setAttribute('cx', String(kneeLeftCx));
    kneeLeft.setAttribute('cy', String(kneeLeftCy));
    kneeLeft.setAttribute('r', String(kneeLeftRadiusPx));
    kneeLeft.setAttribute('fill', 'none');
    kneeLeft.setAttribute('stroke', '#ff0000');
    kneeLeft.setAttribute('stroke-width', '1');
    kneeLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(kneeLeft);

    const ankleLeftRadiusPx = state.ankleLeft.r * sectionH;
    const ankleLeftCy_base = kneeLeftCy_base + ankleOffsetY;
    const ankleLeftCx_base = kneeLeftCx_base;
    const ankleLeftCx = ankleLeftCx_base + (state.ankleLeft.x * sectionH);
    const ankleLeftCy = ankleLeftCy_base + (state.ankleLeft.y * sectionH);

    const ankleLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ankleLeft.setAttribute('cx', String(ankleLeftCx));
    ankleLeft.setAttribute('cy', String(ankleLeftCy));
    ankleLeft.setAttribute('r', String(ankleLeftRadiusPx));
    ankleLeft.setAttribute('fill', 'none');
    ankleLeft.setAttribute('stroke', '#ff0000');
    ankleLeft.setAttribute('stroke-width', '1');
    ankleLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(ankleLeft);

    const kneeRightRadiusPx = state.kneeRight.r * sectionH;
    const kneeRightCy_base = pelvisBottomY + kneeOffsetY;
    const kneeRightCx_base = wristRightCx;
    const kneeRightCx = kneeRightCx_base + (state.kneeRight.x * sectionH);
    const kneeRightCy = kneeRightCy_base + (state.kneeRight.y * sectionH);

    const kneeRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    kneeRight.setAttribute('cx', String(kneeRightCx));
    kneeRight.setAttribute('cy', String(kneeRightCy));
    kneeRight.setAttribute('r', String(kneeRightRadiusPx));
    kneeRight.setAttribute('fill', 'none');
    kneeRight.setAttribute('stroke', '#ff0000');
    kneeRight.setAttribute('stroke-width', '1');
    kneeRight.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(kneeRight);

    const ankleRightRadiusPx = state.ankleRight.r * sectionH;
    const ankleRightCy_base = kneeRightCy_base + ankleOffsetY;
    const ankleRightCx_base = kneeRightCx_base;
    const ankleRightCx = ankleRightCx_base + (state.ankleRight.x * sectionH);
    const ankleRightCy = ankleRightCy_base + (state.ankleRight.y * sectionH);

    const ankleRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ankleRight.setAttribute('cx', String(ankleRightCx));
    ankleRight.setAttribute('cy', String(ankleRightCy));
    ankleRight.setAttribute('r', String(ankleRightRadiusPx));
    ankleRight.setAttribute('fill', 'none');
    ankleRight.setAttribute('stroke', '#ff0000');
    ankleRight.setAttribute('stroke-width', '1');
    ankleRight.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(ankleRight);
  }

  // Верхняя линия бедра: кривая от боковой грани таза наружу и вниз
  function drawThigh(group, state, opts) {
    const { side, attachX, pelvisY0, pelvisH, sectionH } = opts;
    const thigh = side === 'left' ? state.thighLeft : state.thighRight;

    const attachY = pelvisY0 + thigh.attachY * pelvisH;

    // Угол: 0 = строго вниз; положительный = наружу
    const rad = thigh.angle * Math.PI / 180;
    const len = thigh.length * sectionH;
    const outwardSign = side === 'left' ? -1 : 1;

    const endX = attachX + outwardSign * Math.sin(rad) * len;
    const endY = attachY + Math.cos(rad) * len;

    // Выпуклость: квадратичная Безье, контрольная точка отходит от середины хорды
    // перпендикулярно ей, в сторону наружу от центра фигуры.
    const midX = (attachX + endX) / 2;
    const midY = (attachY + endY) / 2;
    const dx = endX - attachX;
    const dy = endY - attachY;

    let perpX = dy;
    let perpY = -dx;
    if ((midX < 0.5 && perpX > 0) || (midX > 0.5 && perpX < 0)) {
      perpX = -perpX;
      perpY = -perpY;
    }

    const k = 0.5 * thigh.round;
    const cpX = midX + perpX * k;
    const cpY = midY + perpY * k;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${attachX} ${attachY} Q ${cpX} ${cpY} ${endX} ${endY}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ff0000');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(path);
  }

  return { render };
})();
