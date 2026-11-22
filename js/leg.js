/* js/leg.js — Этап 2: Ноги (суставы + контуры) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Суставы
    kneeRadius: 0.09,
    ankleRadius: 0.06,
    
    // Смещения суставов (в долях headH)
    leftKneeX: 0, leftKneeY: 0,
    leftAnkleX: 0, leftAnkleY: 0,
    rightKneeX: 0, rightKneeY: 0,
    rightAnkleX: 0, rightAnkleY: 0,

    // Внешнее бедро
    outerThighAttachAngle: 0, // Угол на тазе
    outerThighP1X: 0, outerThighP1Y: 0, // Смещение P1
    outerThighKneeAngle: 0, // Угол на колене

    // Внешняя икра
    outerCalfKneeAngle: 0, // Угол на колене
    outerCalfP1X: 0, outerCalfP1Y: 0, // Смещение P1
    outerCalfAnkleAngle: 0, // Угол на лодыжке

    // Внутреннее бедро
    innerThighAttachAngle: 180, // Угол на тазе
    innerThighP1X: 0, innerThighP1Y: 0,
    innerThighP2X: 0, innerThighP2Y: 0,
    innerThighKneeAngle: 180, // Угол на колене

    // Внутренняя икра
    innerCalfKneeAngle: 180, // Угол на колене
    innerCalfP1X: 0, innerCalfP1Y: 0,
    innerCalfP2X: 0, innerCalfP2Y: 0,
    innerCalfAnkleAngle: 180, // Угол на лодыжке
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });
  let els = null;

  function ensureDom() {
    if (els) return els;
    const legL = document.getElementById('legLeftGroup');
    const legR = document.getElementById('legRightGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!legL || !legR || !headsLayer) return null;

    let grid = document.getElementById('legGridLayer');
    if (!grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'legGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }
    els = { legL, legR, headsLayer, grid };
    return els;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function getPointOnCircle(cx, cy, r, angleDeg, isLeftSide) {
    const rad = (angleDeg * Math.PI) / 180;
    const sign = isLeftSide ? -1 : 1;
    return {
      x: cx + sign * r * Math.cos(rad),
      y: cy - r * Math.sin(rad)
    };
  }

  function drawLegs(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    if (!torso) return;

    const { legL, legR, grid } = els;
    clear(legL);
    clear(legR);
    clear(grid);

    const headH = torso.headH;
    
    // Базовые координаты берем из таза (он уже рассчитан в torso.js)
    const pelvis = {
      x0: torso.pelvisX0,
      y0: torso.pelvisY0,
      w: torso.pelvisW,
      h: torso.pelvisH,
      cx: torso.cx
    };

    // === ПОЗИЦИИ СУСТАВОВ ===
    // Левая нога (смещение от центра таза)
    const leftKneeBaseX = torso.cx - headH * 0.25; // Примерное положение
    const leftKneeBaseY = pelvis.y0 + pelvis.h + headH * 0.8; 
    
    const leftAnkleBaseX = torso.cx - headH * 0.25;
    const leftAnkleBaseY = leftKneeBaseY + headH * 1.2;

    // Применяем смещения
    const leftKneeX = leftKneeBaseX + params.leftKneeX * headH;
    const leftKneeY = leftKneeBaseY + params.leftKneeY * headH;
    const leftAnkleX = leftAnkleBaseX + params.leftAnkleX * headH;
    const leftAnkleY = leftAnkleBaseY + params.leftAnkleY * headH;

    // Правая нога (симметрично)
    const rightKneeX = torso.cx + headH * 0.25 + params.rightKneeX * headH;
    const rightKneeY = leftKneeBaseY + params.rightKneeY * headH;
    const rightAnkleX = torso.cx + headH * 0.25 + params.rightAnkleX * headH;
    const rightAnkleY = leftAnkleBaseY + params.rightAnkleY * headH;

    const kneeRadius = params.kneeRadius * headH;
    const ankleRadius = params.ankleRadius * headH;

    // === РИСУЕМ СУСТАВЫ ===
    legL.appendChild(svgEl('circle', { cx: leftKneeX, cy: leftKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legL.appendChild(svgEl('circle', { cx: leftAnkleX, cy: leftAnkleY, r: ankleRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    
    legR.appendChild(svgEl('circle', { cx: rightKneeX, cy: rightKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legR.appendChild(svgEl('circle', { cx: rightAnkleX, cy: rightAnkleY, r: ankleRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    // === КОНТУРЫ ЛЕВОЙ НОГИ ===
    // 1. Внешнее бедро
    const leftOuterThighP0 = getPointOnCircle(pelvis.x0, pelvis.y0 + pelvis.h - pelvis.h*0.1, pelvis.h*0.1, params.outerThighAttachAngle, true);
    const leftOuterThighP2 = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.outerThighKneeAngle, true);
    const leftOuterThighP1 = {
      x: (leftOuterThighP0.x + leftOuterThighP2.x) / 2 + params.outerThighP1X * headH,
      y: (leftOuterThighP0.y + leftOuterThighP2.y) / 2 + params.outerThighP1Y * headH
    };
    legL.appendChild(svgEl('path', {
      d: `M ${leftOuterThighP0.x} ${leftOuterThighP0.y} Q ${leftOuterThighP1.x} ${leftOuterThighP1.y} ${leftOuterThighP2.x} ${leftOuterThighP2.y}`,
      fill: 'none'
    }));

    // 2. Внешняя икра
    const leftOuterCalfP0 = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.outerCalfKneeAngle, true);
    const leftOuterCalfP2 = getPointOnCircle(leftAnkleX, leftAnkleY, ankleRadius, params.outerCalfAnkleAngle, true);
    const leftOuterCalfP1 = {
      x: (leftOuterCalfP0.x + leftOuterCalfP2.x) / 2 + params.outerCalfP1X * headH,
      y: (leftOuterCalfP0.y + leftOuterCalfP2.y) / 2 + params.outerCalfP1Y * headH
    };
    legL.appendChild(svgEl('path', {
      d: `M ${leftOuterCalfP0.x} ${leftOuterCalfP0.y} Q ${leftOuterCalfP1.x} ${leftOuterCalfP1.y} ${leftOuterCalfP2.x} ${leftOuterCalfP2.y}`,
      fill: 'none'
    }));

    // 3. Внутреннее бедро
    const leftInnerThighP0 = getPointOnCircle(pelvis.cx, pelvis.y0 + pelvis.h - pelvis.h*0.1, pelvis.h*0.1, params.innerThighAttachAngle, true);
    const leftInnerThighP3 = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.innerThighKneeAngle, true);
    
    const lDx = leftInnerThighP3.x - leftInnerThighP0.x;
    const lDy = leftInnerThighP3.y - leftInnerThighP0.y;
    
    const leftInnerThighP1 = { 
      x: leftInnerThighP0.x + lDx * 0.33 + params.innerThighP1X * headH, 
      y: leftInnerThighP0.y + lDy * 0.33 + params.innerThighP1Y * headH 
    };
    const leftInnerThighP2 = { 
      x: leftInnerThighP0.x + lDx * 0.66 + params.innerThighP2X * headH, 
      y: leftInnerThighP0.y + lDy * 0.66 + params.innerThighP2Y * headH 
    };

    legL.appendChild(svgEl('path', {
      d: `M ${leftInnerThighP0.x} ${leftInnerThighP0.y} C ${leftInnerThighP1.x} ${leftInnerThighP1.y}, ${leftInnerThighP2.x} ${leftInnerThighP2.y}, ${leftInnerThighP3.x} ${leftInnerThighP3.y}`,
      fill: 'none'
    }));

    // 4. Внутренняя икра
    const leftInnerCalfP0 = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.innerCalfKneeAngle, true);
    const leftInnerCalfP3 = getPointOnCircle(leftAnkleX, leftAnkleY, ankleRadius, params.innerCalfAnkleAngle, true);
    
    const cDx = leftInnerCalfP3.x - leftInnerCalfP0.x;
    const cDy = leftInnerCalfP3.y - leftInnerCalfP0.y;
    
    const leftInnerCalfP1 = { 
      x: leftInnerCalfP0.x + cDx * 0.33 + params.innerCalfP1X * headH, 
      y: leftInnerCalfP0.y + cDy * 0.33 + params.innerCalfP1Y * headH 
    };
    const leftInnerCalfP2 = { 
      x: leftInnerCalfP0.x + cDx * 0.66 + params.innerCalfP2X * headH, 
      y: leftInnerCalfP0.y + cDy * 0.66 + params.innerCalfP2Y * headH 
    };

    legL.appendChild(svgEl('path', {
      d: `M ${leftInnerCalfP0.x} ${leftInnerCalfP0.y} C ${leftInnerCalfP1.x} ${leftInnerCalfP1.y}, ${leftInnerCalfP2.x} ${leftInnerCalfP2.y}, ${leftInnerCalfP3.x} ${leftInnerCalfP3.y}`,
      fill: 'none'
    }));

    // === МАРКЕРЫ ===
    const mR = headH * 0.012;
    const markers = [
      { x: leftKneeX, y: leftKneeY, c: '#f59e0b' },
      { x: leftAnkleX, y: leftAnkleY, c: '#16a34a' },
      { x: rightKneeX, y: rightKneeY, c: '#f59e0b' },
      { x: rightAnkleX, y: rightAnkleY, c: '#16a34a' },
    ];
    for (const pt of markers) {
      grid.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: mR, fill: pt.c, opacity: 0.85 }));
    }
  }

  function update(geo) {
    if (!ensureDom()) return;
    drawLegs(geo);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  window.Leg = { update, getParams, setParams, resetParams, DEFAULT_PARAMS };
})();
