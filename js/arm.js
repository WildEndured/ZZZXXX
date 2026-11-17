/* js/arm.js — Этап 2: Руки (кривые Безье с ручным управлением) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Базовые размеры
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
    wristRadius: 0.08,
    wristLeftX: -0.20,
    wristRightX: 0.20,
    
    // Управление кривизной (внешняя сторона плеча)
    outerArmStartTension: 0.5,  // Выпуклость в начале
    outerArmEndTension: 0.5,    // Выпуклость в конце
    outerArmBulge: 0.2,         // Насколько выгибать наружу
    
    // Управление кривизной (внутренняя сторона плеча)
    innerArmStartTension: 0.5,
    innerArmEndTension: 0.5,
    innerArmBulge: -0.1,        // Внутрь (минус)

    // Управление кривизной (внешняя сторона предплечья)
    outerForearmStartTension: 0.5,
    outerForearmEndTension: 0.5,
    outerForearmBulge: 0.15,
    
    // Управление кривизной (внутренняя сторона предплечья)
    innerForearmStartTension: 0.5,
    innerForearmEndTension: 0.5,
    innerForearmBulge: -0.15,
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });
  let els = null;

  function ensureDom() {
    if (els) return els;
    const armL = document.getElementById('armLeftGroup');
    const armR = document.getElementById('armRightGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!armL || !armR || !headsLayer) return null;

    let grid = document.getElementById('armGridLayer');
    if (!grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'armGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }
    els = { armL, armR, headsLayer, grid };
    return els;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function getChestCurveWidth(t, chestRx, topNarrow) {
    if (t <= 0.6) {
      const tNorm = t / 0.6;
      return (chestRx * topNarrow) + (chestRx - (chestRx * topNarrow)) * Math.sin(tNorm * Math.PI / 2);
    } else {
      return chestRx;
    }
  }

  function drawArms(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    if (!torso) return;

    const { armL, armR, grid } = els;
    clear(armL);
    clear(armR);
    clear(grid);

    const headH = torso.headH;
    const chestH = torso.chestHeightPx;
    const chestRx = torso.chestRx;
    const topNarrow = torso.cpTopX / chestRx;

    // === БАЗОВЫЕ ЦЕНТРЫ ===
    const shoulderRadius = ((chestH / 3) / 2) * params.shoulderRadiusMul;
    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftCx = torso.cx - curveWidth - shoulderRadius;
    const rightCx = torso.cx + curveWidth + shoulderRadius;

    const wristRadius = params.wristRadius * headH;
    const pelvisBottomY = torso.pelvisY0 + torso.pelvisH;
    
    const wristLeftCx = leftCx + (params.wristLeftX * headH);
    const wristLeftCy = pelvisBottomY - wristRadius;
    
    const wristRightCx = rightCx + (params.wristRightX * headH);
    const wristRightCy = pelvisBottomY - wristRadius;

    const elbowRadius = params.elbowRadius * headH;
    
    // Локоть посередине между плечом и запястьем
    const elbowLeftCx = (leftCx + wristLeftCx) / 2;
    const elbowLeftCy = (shoulderCy + wristLeftCy) / 2;
    
    const elbowRightCx = (rightCx + wristRightCx) / 2;
    const elbowRightCy = (shoulderCy + wristRightCy) / 2;

    // --- РИСУЕМ КРУГИ СУСТАВОВ ---
    armL.appendChild(svgEl('circle', { cx: leftCx, cy: shoulderCy, r: shoulderRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none' }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: shoulderCy, r: shoulderRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none' }));

    // Вспомогательная функция для построения кривой с ползунками натяжения
    function buildBezierCurve(p1, p2, tensionStart, tensionEnd, bulge, sideDir) {
      // Вектор от p1 к p2
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      
      // Перпендикуляр для выгиба (наружу/внутрь)
      const len = Math.sqrt(dx*dx + dy*dy);
      const nx = -dy / len;
      const ny = dx / len;

      // Контрольная точка 1 (от p1)
      const cp1x = p1.x + dx * tensionStart + nx * bulge * len * sideDir;
      const cp1y = p1.y + dy * tensionStart + ny * bulge * len * sideDir;

      // Контрольная точка 2 (от p2)
      const cp2x = p2.x - dx * tensionEnd + nx * bulge * len * sideDir;
      const cp2y = p2.y - dy * tensionEnd + ny * bulge * len * sideDir;

      return `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    // ==========================================
    // ЛЕВАЯ РУКА
    // ==========================================
    // Опорные точки (внешняя сторона слева, внутренняя справа)
    const l_shoulderOuter = { x: leftCx - shoulderRadius, y: shoulderCy };
    const l_shoulderInner = { x: leftCx + shoulderRadius, y: shoulderCy };
    const l_elbowOuter = { x: elbowLeftCx - elbowRadius, y: elbowLeftCy };
    const l_elbowInner = { x: elbowLeftCx + elbowRadius, y: elbowLeftCy };
    const l_wristOuter = { x: wristLeftCx - wristRadius, y: wristLeftCy };
    const l_wristInner = { x: wristLeftCx + wristRadius, y: wristLeftCy };

    // Плечо левое (внешняя)
    const l_armOuterPath = buildBezierCurve(
      l_shoulderOuter, l_elbowOuter, 
      params.outerArmStartTension, params.outerArmEndTension, 
      params.outerArmBulge, 1 // 1 = наружу (влево)
    );
    armL.appendChild(svgEl('path', { d: l_armOuterPath, fill: 'none' }));

    // Плечо левое (внутренняя)
    const l_armInnerPath = buildBezierCurve(
      l_shoulderInner, l_elbowInner, 
      params.innerArmStartTension, params.innerArmEndTension, 
      params.innerArmBulge, -1 // -1 = внутрь (вправо)
    );
    armL.appendChild(svgEl('path', { d: l_armInnerPath, fill: 'none' }));

    // Предплечье левое (внешняя)
    const l_forearmOuterPath = buildBezierCurve(
      l_elbowOuter, l_wristOuter, 
      params.outerForearmStartTension, params.outerForearmEndTension, 
      params.outerForearmBulge, 1
    );
    armL.appendChild(svgEl('path', { d: l_forearmOuterPath, fill: 'none' }));

    // Предплечье левое (внутренняя)
    const l_forearmInnerPath = buildBezierCurve(
      l_elbowInner, l_wristInner, 
      params.innerForearmStartTension, params.innerForearmEndTension, 
      params.innerForearmBulge, -1
    );
    armL.appendChild(svgEl('path', { d: l_forearmInnerPath, fill: 'none' }));

    // ==========================================
    // ПРАВАЯ РУКА
    // ==========================================
    const r_shoulderOuter = { x: rightCx + shoulderRadius, y: shoulderCy };
    const r_shoulderInner = { x: rightCx - shoulderRadius, y: shoulderCy };
    const r_elbowOuter = { x: elbowRightCx + elbowRadius, y: elbowRightCy };
    const r_elbowInner = { x: elbowRightCx - elbowRadius, y: elbowRightCy };
    const r_wristOuter = { x: wristRightCx + wristRadius, y: wristRightCy };
    const r_wristInner = { x: wristRightCx - wristRadius, y: wristRightCy };

    // Плечо правое (внешняя)
    const r_armOuterPath = buildBezierCurve(
      r_shoulderOuter, r_elbowOuter, 
      params.outerArmStartTension, params.outerArmEndTension, 
      params.outerArmBulge, -1 // -1 = наружу (вправо)
    );
    armR.appendChild(svgEl('path', { d: r_armOuterPath, fill: 'none' }));

    // Плечо правое (внутренняя)
    const r_armInnerPath = buildBezierCurve(
      r_shoulderInner, r_elbowInner, 
      params.innerArmStartTension, params.innerArmEndTension, 
      params.innerArmBulge, 1
    );
    armR.appendChild(svgEl('path', { d: r_armInnerPath, fill: 'none' }));

    // Предплечье правое (внешняя)
    const r_forearmOuterPath = buildBezierCurve(
      r_elbowOuter, r_wristOuter, 
      params.outerForearmStartTension, params.outerForearmEndTension, 
      params.outerForearmBulge, -1
    );
    armR.appendChild(svgEl('path', { d: r_forearmOuterPath, fill: 'none' }));

    // Предплечье правое (внутренняя)
    const r_forearmInnerPath = buildBezierCurve(
      r_elbowInner, r_wristInner, 
      params.innerForearmStartTension, params.innerForearmEndTension, 
      params.innerForearmBulge, 1
    );
    armR.appendChild(svgEl('path', { d: r_forearmInnerPath, fill: 'none' }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    drawArms(geo);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  window.Arm = { update, getParams, setParams, resetParams, DEFAULT_PARAMS };
})();
