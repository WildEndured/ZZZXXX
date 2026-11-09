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
    const chestY0 = y0 + sectionH + (state.chest.offset * sectionH);
    const chestHeightPx = sectionH * state.chest.height;
    const chestRx = (baseHeadW * state.chest.width) / 2;

    const pelvisW = chestHeightPx * state.pelvis.widthMod;
    const pelvisH = (chestRx * 2) * state.pelvis.heightMod;
    const pelvisY0 = chestY0 + chestHeightPx + (state.pelvis.offset * sectionH);
    const pelvisBottomY = pelvisY0 + pelvisH;

    const shoulderRadius = (chestHeightPx / 3) / 2;

    const wristLeftRadiusPx = state.wristLeft.r * sectionH;
    const wristLeftCy = pelvisBottomY - wristLeftRadiusPx + (state.wristLeft.y * sectionH);
    const wristLeftCx = 0.5 - chestRx - shoulderRadius * 1.5 + (state.wristLeft.x * sectionH);

    const wristRightRadiusPx = state.wristRight.r * sectionH;
    const wristRightCy = pelvisBottomY - wristRightRadiusPx + (state.wristRight.y * sectionH);
    const wristRightCx = 0.5 + chestRx + shoulderRadius * 1.5 + (state.wristRight.x * sectionH);

    const kneeOffsetY = headH;
    const ankleOffsetY = headH;

    // --- Левая нога ---
    const kneeLeftRadiusPx = state.kneeLeft.r * sectionH;
    const kneeLeftCy_base = pelvisBottomY + kneeOffsetY;
    const kneeLeftCx_base = wristLeftCx;
    const kneeLeftCx = kneeLeftCx_base + (state.kneeLeft.x * sectionH);
    const kneeLeftCy = kneeLeftCy_base + (state.kneeLeft.y * sectionH);
    const kneeLeftEdgeX = kneeLeftCx - kneeLeftRadiusPx;
    const kneeLeftInnerX = kneeLeftCx + kneeLeftRadiusPx;

    const ankleLeftRadiusPx = state.ankleLeft.r * sectionH;
    const ankleLeftCy_base = kneeLeftCy_base + ankleOffsetY;
    const ankleLeftCx_base = kneeLeftCx_base;
    const ankleLeftCx = ankleLeftCx_base + (state.ankleLeft.x * sectionH);
    const ankleLeftCy = ankleLeftCy_base + (state.ankleLeft.y * sectionH);
    const ankleLeftEdgeX = ankleLeftCx - ankleLeftRadiusPx;
    const ankleLeftInnerX = ankleLeftCx + ankleLeftRadiusPx;

    // --- Правая нога ---
    const kneeRightRadiusPx = state.kneeRight.r * sectionH;
    const kneeRightCy_base = pelvisBottomY + kneeOffsetY;
    const kneeRightCx_base = wristRightCx;
    const kneeRightCx = kneeRightCx_base + (state.kneeRight.x * sectionH);
    const kneeRightCy = kneeRightCy_base + (state.kneeRight.y * sectionH);
    const kneeRightEdgeX = kneeRightCx + kneeRightRadiusPx;
    const kneeRightInnerX = kneeRightCx - kneeRightRadiusPx;

    const ankleRightRadiusPx = state.ankleRight.r * sectionH;
    const ankleRightCy_base = kneeRightCy_base + ankleOffsetY;
    const ankleRightCx_base = kneeRightCx_base;
    const ankleRightCx = ankleRightCx_base + (state.ankleRight.x * sectionH);
    const ankleRightCy = ankleRightCy_base + (state.ankleRight.y * sectionH);
    const ankleRightEdgeX = ankleRightCx + ankleRightRadiusPx;
    const ankleRightInnerX = ankleRightCx - ankleRightRadiusPx;

    // --- Внешние линии ---
    const leftThighEnd = drawThigh(group, state, 'left', sectionH);
    const rightThighEnd = drawThigh(group, state, 'right', sectionH);
    drawLine(group, leftThighEnd.x, leftThighEnd.y, kneeLeftEdgeX, kneeLeftCy);
    drawLine(group, rightThighEnd.x, rightThighEnd.y, kneeRightEdgeX, kneeRightCy);

    // Внешняя икра (от колена к стопе)
    drawCalf(group, state, 'left', kneeLeftEdgeX, kneeLeftCy, ankleLeftEdgeX, ankleLeftCy);
    drawCalf(group, state, 'right', kneeRightEdgeX, kneeRightCy, ankleRightEdgeX, ankleRightCy);

    // --- Внутренние линии ---
    const leftInnerThighStart = { x: (0.5 - pelvisW / 2) + pelvisW * state.innerThighLeft.attachX, y: pelvisBottomY };
    const rightInnerThighStart = { x: (0.5 + pelvisW / 2) - pelvisW * state.innerThighRight.attachX, y: pelvisBottomY };

    const leftInnerThighEnd = drawInnerThigh(group, state, 'left', leftInnerThighStart, sectionH);
    const rightInnerThighEnd = drawInnerThigh(group, state, 'right', rightInnerThighStart, sectionH);
    drawLine(group, leftInnerThighEnd.x, leftInnerThighEnd.y, kneeLeftInnerX, kneeLeftCy);
    drawLine(group, rightInnerThighEnd.x, rightInnerThighEnd.y, kneeRightInnerX, kneeRightCy);

    // Внутренняя икра (от колена к стопе)
    drawInnerCalf(group, state, 'left', { x: kneeLeftInnerX, y: kneeLeftCy }, { x: ankleLeftInnerX, y: ankleLeftCy });
    drawInnerCalf(group, state, 'right', { x: kneeRightInnerX, y: kneeRightCy }, { x: ankleRightInnerX, y: ankleRightCy });

    // --- Точки ---
    const kneeLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    kneeLeft.setAttribute('cx', String(kneeLeftCx));
    kneeLeft.setAttribute('cy', String(kneeLeftCy));
    kneeLeft.setAttribute('r', String(kneeLeftRadiusPx));
    kneeLeft.setAttribute('fill', 'none');
    kneeLeft.setAttribute('stroke', '#ff0000');
    kneeLeft.setAttribute('stroke-width', '1');
    kneeLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(kneeLeft);

    const ankleLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ankleLeft.setAttribute('cx', String(ankleLeftCx));
    ankleLeft.setAttribute('cy', String(ankleLeftCy));
    ankleLeft.setAttribute('r', String(ankleLeftRadiusPx));
    ankleLeft.setAttribute('fill', 'none');
    ankleLeft.setAttribute('stroke', '#ff0000');
    ankleLeft.setAttribute('stroke-width', '1');
    ankleLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(ankleLeft);

    const kneeRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    kneeRight.setAttribute('cx', String(kneeRightCx));
    kneeRight.setAttribute('cy', String(kneeRightCy));
    kneeRight.setAttribute('r', String(kneeRightRadiusPx));
    kneeRight.setAttribute('fill', 'none');
    kneeRight.setAttribute('stroke', '#ff0000');
    kneeRight.setAttribute('stroke-width', '1');
    kneeRight.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(kneeRight);

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

  function drawThigh(group, state, side, sectionH) {
    const pad = state.gridPad;
    const n = state.heads;
    const y0 = pad;
    const y1 = 1 - pad;

    const baseHeadW = state.baseHeadWidth * sectionH;
    const chestY0 = y0 + sectionH + (state.chest.offset * sectionH);
    const chestHeightPx = sectionH * state.chest.height;
    const chestRx = (baseHeadW * state.chest.width) / 2;

    const pelvisW = chestHeightPx * state.pelvis.widthMod;
    const pelvisH = (chestRx * 2) * state.pelvis.heightMod;
    const pelvisY0 = chestY0 + chestHeightPx + (state.pelvis.offset * sectionH);

    const attachX = side === 'left' ? (0.5 - pelvisW / 2) : (0.5 + pelvisW / 2);

    const thigh = side === 'left' ? state.thighLeft : state.thighRight;
    const attachY = pelvisY0 + thigh.attachY * pelvisH;

    const rad = thigh.angle * Math.PI / 180;
    const len = thigh.length * sectionH;
    const outwardSign = side === 'left' ? -1 : 1;

    const endX = attachX + outwardSign * Math.sin(rad) * len;
    const endY = attachY + Math.cos(rad) * len;

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
    path.setAttribute('d', `M ${attachX} ${attachY} Q ${cpX} ${cpY} ${endX} ${endY}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ff0000');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(path);

    return { x: endX, y: endY };
  }

  // Внешняя икра: плавная дуга от колена к лодыжке
  function drawCalf(group, state, side, startX, startY, endX, endY) {
    const calf = side === 'left' ? state.calfLeft : state.calfRight;
    
    // Вычисляем середину
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Вектор направления
    const dx = endX - startX;
    const dy = endY - startY;
    
    // Перпендикуляр (наружу от центра)
    let perpX = dy;
    let perpY = -dx;
    const isLeft = side === 'left';
    // Для левой ноги наружу - это влево (минус), для правой - вправо (плюс)
    if ((isLeft && perpX > 0) || (!isLeft && perpX < 0)) {
      perpX = -perpX;
      perpY = -perpY;
    }

    // Контрольная точка (выпуклость)
    const bulge = (dx * dx + dy * dy) * calf.length * 0.5; // масштабируем длину
    const cpX = midX + perpX * bulge;
    const cpY = midY + perpY * bulge;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ff0000');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(path);
  }

  function drawInnerThigh(group, state, side, startPoint, sectionH) {
    const thigh = side === 'left' ? state.innerThighLeft : state.innerThighRight;

    const rad = thigh.angle * Math.PI / 180;
    const len = thigh.length * sectionH;
    const outwardSign = side === 'left' ? -1 : 1;

    const endX = startPoint.x + outwardSign * Math.sin(rad) * len;
    const endY = startPoint.y + Math.cos(rad) * len;

    const midX = (startPoint.x + endX) / 2;
    const midY = (startPoint.y + endY) / 2;
    const dx = endX - startPoint.x;
    const dy = endY - startPoint.y;

    let perpX = dy;
    let perpY = -dx;
    // Выгибаем внутрь
    if ((midX < 0.5 && perpX < 0) || (midX > 0.5 && perpX > 0)) {
      perpX = -perpX;
      perpY = -perpY;
    }

    const k = 0.5 * thigh.round;
    const cpX = midX + perpX * k;
    const cpY = midY + perpY * k;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${startPoint.x} ${startPoint.y} Q ${cpX} ${cpY} ${endX} ${endY}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ff0000');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(path);

    return { x: endX, y: endY };
  }

  // Внутренняя икра: плавная дуга от колена к лодыжке
  function drawInnerCalf(group, state, side, start, end) {
    const calf = side === 'left' ? state.innerCalfLeft : state.innerCalfRight;
    
    // Вычисляем середину
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Вектор направления
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Перпендикуляр (внутрь к центру)
    let perpX = dy;
    let perpY = -dx;
    const isLeft = side === 'left';
    // Для левой ноги внутрь - это вправо (плюс), для правой - влево (минус)
    if ((isLeft && perpX < 0) || (!isLeft && perpX > 0)) {
      perpX = -perpX;
      perpY = -perpY;
    }

    // Контрольная точка (выпуклость)
    const bulge = (dx * dx + dy * dy) * calf.length * 0.5;
    const cpX = midX + perpX * bulge;
    const cpY = midY + perpY * bulge;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${start.x} ${start.y} Q ${cpX} ${cpY} ${end.x} ${end.y}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ff0000');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(path);
  }

  function drawLine(group, x1, y1, x2, y2) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ff0000');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(path);
  }

  return { render };
})();
