/* js/arm.js — Этап 2: Руки (по точечному референсу) */

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

  function drawArms(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    const head = window.Head && window.Head.lastGeometry;
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

    // === ЛЕВАЯ РУКА (по твоему референсу) ===
    // Внешние точки плеча (UA1, UA2, UA3)
    const p_UA1 = { x: leftCx - shoulderRadius, y: leftCy + shoulderRadius * 0.6 }; // Низ внешней грани
    const p_UA2 = { x: leftCx - shoulderRadius, y: leftCy }; // Центр внешней грани
    const p_UA3 = { x: leftCx - shoulderRadius * 0.5, y: leftCy - shoulderRadius }; // Верх внешней грани (ближе к шее)

    // Внутренние точки плеча (UA4, UA5)
    const p_UA4 = { x: leftCx + shoulderRadius * 0.5, y: leftCy + shoulderRadius }; // Низ внутренней грани
    const p_UA5 = { x: leftCx + shoulderRadius, y: leftCy }; // Центр внутренней грани

    // Внешние точки предплечья (FR1...FR4)
    const p_FR1 = { x: wristLeftCx - wristRadius, y: wristLeftCy }; // Внешняя грань запястья
    const p_FR2 = { x: wristLeftCx - wristRadius * 0.5 - (wristLeftCx - elbowLeftCx) * 0.33, y: wristLeftCy - (wristLeftCy - elbowLeftCy) * 0.33 }; // 1/3 пути
    const p_FR3 = { x: elbowLeftCx - elbowRadius * 0.5 - (wristLeftCx - elbowLeftCx) * 0.33, y: elbowLeftCy - (wristLeftCy - elbowLeftCy) * 0.33 }; // 2/3 пути
    const p_FR4 = { x: elbowLeftCx - elbowRadius, y: elbowLeftCy }; // Внешняя грань локтя

    // Внутренние точки предплечья (FR5...FR8)
    const p_FR5 = { x: wristLeftCx + wristRadius, y: wristLeftCy }; // Внутренняя грань запястья
    const p_FR6 = { x: wristLeftCx + wristRadius * 0.5 + (elbowLeftCx - wristLeftCx) * 0.33, y: wristLeftCy + (elbowLeftCy - wristLeftCy) * 0.33 };
    const p_FR7 = { x: elbowLeftCx + elbowRadius * 0.5 + (wristLeftCx - elbowLeftCx) * 0.33, y: elbowLeftCy + (wristLeftCy - elbowLeftCy) * 0.33 };
    const p_FR8 = { x: elbowLeftCx + elbowRadius, y: elbowLeftCy }; // Внутренняя грань локтя

    // Рисуем контуры левой руки по точкам
    let leftOuterContour = `M ${p_UA3.x} ${p_UA3.y} L ${p_UA2.x} ${p_UA2.y} L ${p_UA1.x} ${p_UA1.y} L ${p_FR4.x} ${p_FR4.y} L ${p_FR3.x} ${p_FR3.y} L ${p_FR2.x} ${p_FR2.y} L ${p_FR1.x} ${p_FR1.y}`;
    armL.appendChild(svgEl('path', { d: leftOuterContour, fill: 'none' }));

    let leftInnerContour = `M ${p_UA5.x} ${p_UA5.y} L ${p_UA4.x} ${p_UA4.y} L ${p_FR8.x} ${p_FR8.y} L ${p_FR7.x} ${p_FR7.y} L ${p_FR6.x} ${p_FR6.y} L ${p_FR5.x} ${p_FR5.y}`;
    armL.appendChild(svgEl('path', { d: leftInnerContour, fill: 'none' }));

    // === ПРАВАЯ РУКА (Зеркально) ===
    // Внешние точки плеча
    const r_UA1 = { x: rightCx + shoulderRadius, y: rightCy + shoulderRadius * 0.6 };
    const r_UA2 = { x: rightCx + shoulderRadius, y: rightCy };
    const r_UA3 = { x: rightCx + shoulderRadius * 0.5, y: rightCy - shoulderRadius };

    // Внутренние точки плеча
    const r_UA4 = { x: rightCx - shoulderRadius * 0.5, y: rightCy + shoulderRadius };
    const r_UA5 = { x: rightCx - shoulderRadius, y: rightCy };

    // Внешние точки предплечья
    const r_FR1 = { x: wristRightCx + wristRadius, y: wristRightCy };
    const r_FR2 = { x: wristRightCx + wristRadius * 0.5 + (elbowRightCx - wristRightCx) * 0.33, y: wristRightCy + (elbowRightCy - wristRightCy) * 0.33 };
    const r_FR3 = { x: elbowRightCx + elbowRadius * 0.5 + (wristRightCx - elbowRightCx) * 0.33, y: elbowRightCy + (wristRightCy - elbowRightCy) * 0.33 };
    const r_FR4 = { x: elbowRightCx + elbowRadius, y: elbowRightCy };

    // Внутренние точки предплечья
    const r_FR5 = { x: wristRightCx - wristRadius, y: wristRightCy };
    const r_FR6 = { x: wristRightCx - wristRadius * 0.5 - (wristRightCx - elbowRightCx) * 0.33, y: wristRightCy - (wristRightCy - elbowRightCy) * 0.33 };
    const r_FR7 = { x: elbowRightCx - elbowRadius * 0.5 - (wristRightCx - elbowRightCx) * 0.33, y: elbowRightCy - (wristRightCy - elbowRightCy) * 0.33 };
    const r_FR8 = { x: elbowRightCx - elbowRadius, y: elbowRightCy };

    // Рисуем контуры правой руки по точкам
    let rightOuterContour = `M ${r_UA3.x} ${r_UA3.y} L ${r_UA2.x} ${r_UA2.y} L ${r_UA1.x} ${r_UA1.y} L ${r_FR4.x} ${r_FR4.y} L ${r_FR3.x} ${r_FR3.y} L ${r_FR2.x} ${r_FR2.y} L ${r_FR1.x} ${r_FR1.y}`;
    armR.appendChild(svgEl('path', { d: rightOuterContour, fill: 'none' }));

    let rightInnerContour = `M ${r_UA5.x} ${r_UA5.y} L ${r_UA4.x} ${r_UA4.y} L ${r_FR8.x} ${r_FR8.y} L ${r_FR7.x} ${r_FR7.y} L ${r_FR6.x} ${r_FR6.y} L ${r_FR5.x} ${r_FR5.y}`;
    armR.appendChild(svgEl('path', { d: rightInnerContour, fill: 'none' }));

    // === ОТЛАДОЧНЫЕ ТОЧКИ ===
    const tinyR = headH * 0.008;
    const debugPoints = [
      p_UA1, p_UA2, p_UA3, p_UA4, p_UA5,
      p_FR1, p_FR2, p_FR3, p_FR4, p_FR5, p_FR6, p_FR7, p_FR8,
      r_UA1, r_UA2, r_UA3, r_UA4, r_UA5,
      r_FR1, r_FR2, r_FR3, r_FR4, r_FR5, r_FR6, r_FR7, r_FR8
    ];
    for (const pt of debugPoints) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: tinyR, fill: '#2563eb', opacity: 0.85
      }));
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
