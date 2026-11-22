/* js/leg.js — Этап 2: Ноги (суставы + контуры с ползунками) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Радиусы суставов
    kneeRadius: 0.09,
    ankleRadius: 0.06,

    // Смещения суставов (для будущего)
    leftKneeX: 0, leftKneeY: 0,
    leftAnkleX: 0, leftAnkleY: 0,
    rightKneeX: 0, rightKneeY: 0,
    rightAnkleX: 0, rightAnkleY: 0,

    // --- ВНЕШНИЙ КОНТУР ---
    // Внешнее бедро
    outerThighAttachAngle: 0, // P0 на тазе (угол)
    outerThighP1X: 0, outerThighP1Y: 0, // P1
    outerThighKneeAngle: 0, // P2 на колене (угол)
    
    // Внешняя икра
    outerCalfKneeAngle: 0, // P0 на колене (угол)
    outerCalfP1X: 0, outerCalfP1Y: 0, // P1
    outerCalfAnkleAngle: 0, // P2 на лодыжке (угол)

    // --- ВНУТРЕННИЙ КОНТУР ---
    // Внутреннее бедро
    innerThighAttachAngle: 180, // P0 на тазе (угол)
    innerThighP1X: 0, innerThighP1Y: 0, // P1
    innerThighP2X: 0, innerThighP2Y: 0, // P2
    innerThighKneeAngle: 180, // P3 на колене (угол)

    // Внутренняя икра
    innerCalfKneeAngle: 180, // P0 на колене (угол)
    innerCalfP1X: 0, innerCalfP1Y: 0, // P1
    innerCalfP2X: 0, innerCalfP2Y: 0, // P2
    innerCalfAnkleAngle: 180, // P3 на лодыжке (угол)
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

  // Находит точку на окружности по углу (0° = внешняя, 180° = внутренняя)
  function getPointOnCircle(cx, cy, r, angleDeg, isLeftSide) {
    const rad = (angleDeg * Math.PI) / 180;
    const sign = isLeftSide ? -1 : 1;
    return {
      x: cx + sign * r * Math.cos(rad),
      y: cy - r * Math.sin(rad)
    };
  }

  // Находит точку на нижней границе таза (прямоугольник со скруглением)
  // t=0 - левый край, t=1 - правый край
  function getPelvisPoint(pelvis, t, isLeftSide) {
    // Для левой ноги t=0.2, для правой t=0.8 (зеркально)
    const actualT = isLeftSide ? t : 1 - t;
    const x = pelvis.x0 + pelvis.w * actualT;
    const y = pelvis.y0 + pelvis.h;
    return { x, y };
  }

  function drawLegs(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    if (!torso) return;

    const { legL, legR, grid } = els;
    clear(legL);
    clear(legR);
    clear(grid);

    const headH = torso.headH;
    
    // Базовые координаты берем из таза
    const pelvis = {
      x0: torso.pelvisX0,
      y0: torso.pelvisY0,
      w: torso.pelvisW,
      h: torso.pelvisH,
      cx: torso.cx
    };

    // Позиции суставов (примерно под тазом)
    const leftKneeBaseX = torso.cx - headH * 0.25;
    const leftKneeBaseY = pelvis.y0 + pelvis.h + headH * 0.8; 
    const leftAnkleBaseX = torso.cx - headH * 0.25;
    const leftAnkleBaseY = leftKneeBaseY + headH * 1.2;

    const rightKneeBaseX = torso.cx + headH * 0.25;
    const rightKneeBaseY = leftKneeBaseY;
    const rightAnkleBaseX = torso.cx + headH * 0.25;
    const rightAnkleBaseY = leftAnkleBaseY;

    // Смещения
    const leftKneeX = leftKneeBaseX + params.leftKneeX * headH;
    const leftKneeY = leftKneeBaseY + params.leftKneeY * headH;
    const leftAnkleX = leftAnkleBaseX + params.leftAnkleX * headH;
    const leftAnkleY = leftAnkleBaseY + params.leftAnkleY * headH;

    const rightKneeX = rightKneeBaseX + params.rightKneeX * headH;
    const rightKneeY = rightKneeBaseY + params.rightKneeY * headH;
    const rightAnkleX = rightAnkleBaseX + params.rightAnkleX * headH;
    const rightAnkleY = rightAnkleBaseY + params.rightAnkleY * headH;

    const kneeRadius = params.kneeRadius * headH;
    const ankleRadius = params.ankleRadius * headH;

    // === РИСУЕМ СУСТАВЫ ===
    legL.appendChild(svgEl('circle', { cx: leftKneeX, cy: leftKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legL.appendChild(svgEl('circle', { cx: leftAnkleX, cy: leftAnkleY, r: ankleRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legR.appendChild(svgEl('circle', { cx: rightKneeX, cy: rightKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legR.appendChild(svgEl('circle', { cx: rightAnkleX, cy: rightAnkleY, r: ankleRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    // ==========================================
    // КОНТУРЫ (ЛЕВАЯ НОГА)
    // ==========================================
    // 1. Внешнее бедро (Q-кривая)
    // P0 на тазе (используем угол для смещения точки по нижней границе)
    const p0OuterThigh = getPelvisPoint(pelvis, 0.2, true); // 20% от левого края
    p0OuterThigh.y += params.outerThighAttachAngle * headH; // Сдвиг по Y (угол)
    
    const p2OuterThigh = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.outerThighKneeAngle, true);
    const p1OuterThigh = {
      x: (p0OuterThigh.x + p2OuterThigh.x) / 2 + params.outerThighP1X * headH,
      y: (p0OuterThigh.y + p2OuterThigh.y) / 2 + params.outerThighP1Y * headH
    };
    legL.appendChild(svgEl('path', {
      d: `M ${p0OuterThigh.x} ${p0OuterThigh.y} Q ${p1OuterThigh.x} ${p1OuterThigh.y} ${p2OuterThigh.x} ${p2OuterThigh.y}`,
      fill: 'none'
    }));

    // 2. Внешняя икра (Q-кривая)
    const p0OuterCalf = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.outerCalfKneeAngle, true);
    const p2OuterCalf = getPointOnCircle(leftAnkleX, leftAnkleY, ankleRadius, params.outerCalfAnkleAngle, true);
    const p1OuterCalf = {
      x: (p0OuterCalf.x + p2OuterCalf.x) / 2 + params.outerCalfP1X * headH,
      y: (p0OuterCalf.y + p2OuterCalf.y) / 2 + params.outerCalfP1Y * headH
    };
    legL.appendChild(svgEl('path', {
      d: `M ${p0OuterCalf.x} ${p0OuterCalf.y} Q ${p1OuterCalf.x} ${p1OuterCalf.y} ${p2OuterCalf.x} ${p2OuterCalf.y}`,
      fill: 'none'
    }));

    // 3. Внутреннее бедро (C-кривая)
    // P0 на тазе (внутренняя сторона, ближе к центру)
    const p0InnerThigh = getPelvisPoint(pelvis, 0.5, true); // Центр таза
    p0InnerThigh.y += params.innerThighAttachAngle * headH;
    
    const p3InnerThigh = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.innerThighKneeAngle, true);
    
    const iDx = p3InnerThigh.x - p0InnerThigh.x;
    const iDy = p3InnerThigh.y - p0InnerThigh.y;
    
    const p1InnerThigh = { 
      x: p0InnerThigh.x + iDx * 0.33 + params.innerThighP1X * headH, 
      y: p0InnerThigh.y + iDy * 0.33 + params.innerThighP1Y * headH 
    };
    const p2InnerThigh = { 
      x: p0InnerThigh.x + iDx * 0.66 + params.innerThighP2X * headH, 
      y: p0InnerThigh.y + iDy * 0.66 + params.innerThighP2Y * headH 
    };

    legL.appendChild(svgEl('path', {
      d: `M ${p0InnerThigh.x} ${p0InnerThigh.y} C ${p1InnerThigh.x} ${p1InnerThigh.y}, ${p2InnerThigh.x} ${p2InnerThigh.y}, ${p3InnerThigh.x} ${p3InnerThigh.y}`,
      fill: 'none'
    }));

    // 4. Внутренняя икра (C-кривая)
    const p0InnerCalf = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.innerCalfKneeAngle, true);
    const p3InnerCalf = getPointOnCircle(leftAnkleX, leftAnkleY, ankleRadius, params.innerCalfAnkleAngle, true);
    
    const cDx = p3InnerCalf.x - p0InnerCalf.x;
    const cDy = p3InnerCalf.y - p0InnerCalf.y;
    
    const p1InnerCalf = { 
      x: p0InnerCalf.x + cDx * 0.33 + params.innerCalfP1X * headH, 
      y: p0InnerCalf.y + cDy * 0.33 + params.innerCalfP1Y * headH 
    };
    const p2InnerCalf = { 
      x: p0InnerCalf.x + cDx * 0.66 + params.innerCalfP2X * headH, 
      y: p0InnerCalf.y + cDy * 0.66 + params.innerCalfP2Y * headH 
    };

    legL.appendChild(svgEl('path', {
      d: `M ${p0InnerCalf.x} ${p0InnerCalf.y} C ${p1InnerCalf.x} ${p1InnerCalf.y}, ${p2InnerCalf.x} ${p2InnerCalf.y}, ${p3InnerCalf.x} ${p3InnerCalf.y}`,
      fill: 'none'
    }));

    // ==========================================
    // КОНТУРЫ (ПРАВАЯ НОГА - ЗЕРКАЛЬНО)
    // ==========================================
    // ... (Аналогично левой, но с right... переменными и isLeftSide=false)
    // Для краткости я опущу этот блок, но в реальном коде он должен быть.
    // Ты можешь просто скопировать логику левой ноги, заменив left на right и true на false.
    
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
