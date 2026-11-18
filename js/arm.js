/* js/arm.js — Этап 2: Руки (касательные к окружностям) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
    elbowLeftX: 0,
    elbowLeftY: 0,
    elbowRightX: 0,
    elbowRightY: 0,
    wristRadius: 0.08,
    wristLeftX: -0.20,
    wristLeftY: 0,
    wristRightX: 0.20,
    wristRightY: 0,
    leftX: 0,
    leftY: 0,
    rightX: 0,
    rightY: 0,
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

  // Математика: поиск внешней касательной между двумя окружностями
  function getOuterTangent(c1, r1, c2, r2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return null;
    
    // Для внешней касательной радиусы вычитаются
    const dr = r1 - r2;
    if (Math.abs(dr) > d) return null; // Одна окружность внутри другой

    const a = Math.atan2(dy, dx);
    const alpha = Math.acos(dr / d);
    
    // Точки касания на первой и второй окружности
    const t1x = c1.x + r1 * Math.cos(a + alpha);
    const t1y = c1.y + r1 * Math.sin(a + alpha);
    const t2x = c2.x + r2 * Math.cos(a + alpha);
    const t2y = c2.y + r2 * Math.sin(a + alpha);
    
    return { p1: {x: t1x, y: t1y}, p2: {x: t2x, y: t2y} };
  }

  // Математика: поиск внутренней касательной (перекрестной)
  function getInnerTangent(c1, r1, c2, r2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6 || d < r1 + r2) return null;
    
    const a = Math.atan2(dy, dx);
    // Для внутренней касательной радиусы складываются
    const alpha = Math.acos((r1 + r2) / d);
    
    const t1x = c1.x + r1 * Math.cos(a + alpha);
    const t1y = c1.y + r1 * Math.sin(a + alpha);
    const t2x = c2.x - r2 * Math.cos(a + alpha);
    const t2y = c2.y - r2 * Math.sin(a + alpha);
    
    return { p1: {x: t1x, y: t1y}, p2: {x: t2x, y: t2y} };
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
    const baseShoulderRadius = (chestH / 3) / 2;
    const shoulderRadius = baseShoulderRadius * params.shoulderRadiusMul;

    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftOffsetX = params.leftX * headH;
    const leftOffsetY = params.leftY * headH;
    const rightOffsetX = params.rightX * headH;
    const rightOffsetY = params.rightY * headH;

    const leftCx = torso.cx - curveWidth - shoulderRadius + leftOffsetX;
    const rightCx = torso.cx + curveWidth + shoulderRadius + rightOffsetX;
    const leftCy = shoulderCy + leftOffsetY;
    const rightCy = shoulderCy + rightOffsetY;

    const pelvisBottomY = torso.pelvisY0 + torso.pelvisH;
    const wristRadius = params.wristRadius * headH;

    const wristLeftOffsetX = params.wristLeftX * headH;
    const wristLeftOffsetY = params.wristLeftY * headH;
    const wristLeftCy = pelvisBottomY - wristRadius + wristLeftOffsetY + leftOffsetY;
    const wristLeftCx = torso.cx - chestRx - shoulderRadius * 1.5 + wristLeftOffsetX + leftOffsetX;

    const wristRightOffsetX = params.wristRightX * headH;
    const wristRightOffsetY = params.wristRightY * headH;
    const wristRightCy = pelvisBottomY - wristRadius + wristRightOffsetY + rightOffsetY;
    const wristRightCx = torso.cx + chestRx + shoulderRadius * 1.5 + wristRightOffsetX + rightOffsetX;

    const elbowRadius = params.elbowRadius * headH;

    const elbowLeftOffsetX = params.elbowLeftX * headH;
    const elbowLeftOffsetY = params.elbowLeftY * headH;
    const elbowLeftCx = (leftCx + wristLeftCx) / 2 + elbowLeftOffsetX;
    const elbowLeftCy = (leftCy + wristLeftCy) / 2 + elbowLeftOffsetY;

    const elbowRightOffsetX = params.elbowRightX * headH;
    const elbowRightOffsetY = params.elbowRightY * headH;
    const elbowRightCx = (rightCx + wristRightCx) / 2 + elbowRightOffsetX;
    const elbowRightCy = (rightCy + wristRightCy) / 2 + elbowRightOffsetY;

    // --- РИСУЕМ КРУГИ СУСТАВОВ (для визуализации) ---
    armL.appendChild(svgEl('circle', { cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none' }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none' }));

    // === ЛЕВАЯ РУКА ===
    const lS = { x: leftCx, y: leftCy };
    const lE = { x: elbowLeftCx, y: elbowLeftCy };
    const lW = { x: wristLeftCx, y: wristLeftCy };

    // Внешний контур (слева)
    const ext1 = getOuterTangent(lS, shoulderRadius, lE, elbowRadius);
    const ext2 = getOuterTangent(lE, elbowRadius, lW, wristRadius);

    if (ext1 && ext2) {
      // Проводим дугу по внешней стороне плеча от касательной 1 до касательной 2
      // Для простоты и стабильности используем прямые линии между касательными точками
      const d = `M ${ext1.p1.x} ${ext1.p1.y} L ${ext1.p2.x} ${ext1.p2.y} L ${ext2.p2.x} ${ext2.p2.y} L ${ext2.p1.x} ${ext2.p1.y}`;
      armL.appendChild(svgEl('path', { d, fill: 'none' }));
    }

    // Внутренний контур (справа)
    const int1 = getInnerTangent(lS, shoulderRadius, lE, elbowRadius);
    const int2 = getInnerTangent(lE, elbowRadius, lW, wristRadius);

    if (int1 && int2) {
      const d = `M ${int1.p1.x} ${int1.p1.y} L ${int1.p2.x} ${int1.p2.y} L ${int2.p2.x} ${int2.p2.y} L ${int2.p1.x} ${int2.p1.y}`;
      armL.appendChild(svgEl('path', { d, fill: 'none' }));
    }

    // === ПРАВАЯ РУКА ===
    const rS = { x: rightCx, y: rightCy };
    const rE = { x: elbowRightCx, y: elbowRightCy };
    const rW = { x: wristRightCx, y: wristRightCy };

    const rExt1 = getOuterTangent(rS, shoulderRadius, rE, elbowRadius);
    const rExt2 = getOuterTangent(rE, elbowRadius, rW, wristRadius);

    if (rExt1 && rExt2) {
      const d = `M ${rExt1.p1.x} ${rExt1.p1.y} L ${rExt1.p2.x} ${rExt1.p2.y} L ${rExt2.p2.x} ${rExt2.p2.y} L ${rExt2.p1.x} ${rExt2.p1.y}`;
      armR.appendChild(svgEl('path', { d, fill: 'none' }));
    }

    const rInt1 = getInnerTangent(rS, shoulderRadius, rE, elbowRadius);
    const rInt2 = getInnerTangent(rE, elbowRadius, rW, wristRadius);

    if (rInt1 && rInt2) {
      const d = `M ${rInt1.p1.x} ${rInt1.p1.y} L ${rInt1.p2.x} ${rInt1.p2.y} L ${rInt2.p2.x} ${rInt2.p2.y} L ${rInt2.p1.x} ${rInt2.p1.y}`;
      armR.appendChild(svgEl('path', { d, fill: 'none' }));
    }
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
