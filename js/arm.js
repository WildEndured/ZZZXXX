/* js/arm.js — Этап 2: Руки (квадратичные кривые) */

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

  const pointNames = ['UA1','UA2','UA3','UA4','UA5','FR1','FR2','FR3','FR4','FR5','FR6','FR7','FR8'];
  for (const side of ['left', 'right']) {
    for (const pt of pointNames) {
      params[`${side}${pt}_dx`] = 0;
      params[`${side}${pt}_dy`] = 0;
    }
  }

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

  // Построение плавной кривой через квадратичные Безье (Q)
  function buildQuadraticPath(points) {
    if (points.length < 2) return '';
    
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const prev = points[i - 1];
      
      if (i === 1) {
        // Первая кривая идет от точки 0 к точке 1
        // Контрольная точка - сама точка 0 (или середина)
        d += ` Q ${prev.x} ${prev.y}, ${curr.x} ${curr.y}`;
      } else {
        // Для последующих точек используем точку как контрольную для плавного перехода
        d += ` Q ${prev.x} ${prev.y}, ${curr.x} ${curr.y}`;
      }
    }
    return d;
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

    // --- РИСУЕМ КРУГИ СУСТАВОВ ---
    armL.appendChild(svgEl('circle', { cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none' }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none' }));

    function getPt(baseX, baseY, side, ptName) {
      const keyX = `${side}${ptName}_dx`;
      const keyY = `${side}${ptName}_dy`;
      return {
        x: baseX + (params[keyX] || 0) * headH,
        y: baseY + (params[keyY] || 0) * headH
      };
    }

    function lerp(a, b, t) {
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }

    // ==========================================
    // ЛЕВАЯ РУКА
    // ==========================================
    const l_UA1 = getPt(leftCx - shoulderRadius, leftCy + shoulderRadius * 0.6, 'left', 'UA1');
    const l_UA2 = getPt(leftCx - shoulderRadius, leftCy, 'left', 'UA2');
    const l_UA3 = getPt(leftCx - shoulderRadius * 0.5, leftCy - shoulderRadius, 'left', 'UA3');
    const l_UA4 = getPt(leftCx + shoulderRadius * 0.5, leftCy + shoulderRadius, 'left', 'UA4');
    const l_UA5 = getPt(leftCx + shoulderRadius, leftCy, 'left', 'UA5');

    const l_elbowOuter = { x: elbowLeftCx - elbowRadius, y: elbowLeftCy };
    const l_wristOuter = { x: wristLeftCx - wristRadius, y: wristLeftCy };
    const l_elbowInner = { x: elbowLeftCx + elbowRadius, y: elbowLeftCy };
    const l_wristInner = { x: wristLeftCx + wristRadius, y: wristLeftCy };

    const l_FR4 = getPt(l_elbowOuter.x, l_elbowOuter.y, 'left', 'FR4');
    const l_FR3 = getPt(lerp(l_elbowOuter, l_wristOuter, 1/3).x, lerp(l_elbowOuter, l_wristOuter, 1/3).y, 'left', 'FR3');
    const l_FR2 = getPt(lerp(l_elbowOuter, l_wristOuter, 2/3).x, lerp(l_elbowOuter, l_wristOuter, 2/3).y, 'left', 'FR2');
    const l_FR1 = getPt(l_wristOuter.x, l_wristOuter.y, 'left', 'FR1');

    const l_FR8 = getPt(l_elbowInner.x, l_elbowInner.y, 'left', 'FR8');
    const l_FR7 = getPt(lerp(l_elbowInner, l_wristInner, 1/3).x, lerp(l_elbowInner, l_wristInner, 1/3).y, 'left', 'FR7');
    const l_FR6 = getPt(lerp(l_elbowInner, l_wristInner, 2/3).x, lerp(l_elbowInner, l_wristInner, 2/3).y, 'left', 'FR6');
    const l_FR5 = getPt(l_wristInner.x, l_wristInner.y, 'left', 'FR5');

    // Контуры левой руки (Квадратичные Безье)
    // Внимание: для Q-кривой используются пары (контрольная, конечная)
    let leftOuter = `M ${l_UA3.x} ${l_UA3.y}`;
    leftOuter += ` Q ${l_UA2.x} ${l_UA2.y}, ${l_UA1.x} ${l_UA1.y}`;
    leftOuter += ` Q ${l_FR4.x} ${l_FR4.y}, ${l_FR3.x} ${l_FR3.y}`;
    leftOuter += ` Q ${l_FR2.x} ${l_FR2.y}, ${l_FR1.x} ${l_FR1.y}`;
    armL.appendChild(svgEl('path', { d: leftOuter, fill: 'none' }));

    let leftInner = `M ${l_UA5.x} ${l_UA5.y}`;
    leftInner += ` Q ${l_UA4.x} ${l_UA4.y}, ${l_FR8.x} ${l_FR8.y}`;
    leftInner += ` Q ${l_FR7.x} ${l_FR7.y}, ${l_FR6.x} ${l_FR6.y}`;
    leftInner += ` Q ${l_FR5.x} ${l_FR5.y}, ${l_FR5.x} ${l_FR5.y}`; // Упрощение для последней точки
    armL.appendChild(svgEl('path', { d: leftInner, fill: 'none' }));

    // ==========================================
    // ПРАВАЯ РУКА
    // ==========================================
    const r_UA1 = getPt(rightCx + shoulderRadius, rightCy + shoulderRadius * 0.6, 'right', 'UA1');
    const r_UA2 = getPt(rightCx + shoulderRadius, rightCy, 'right', 'UA2');
    const r_UA3 = getPt(rightCx + shoulderRadius * 0.5, rightCy - shoulderRadius, 'right', 'UA3');
    const r_UA4 = getPt(rightCx - shoulderRadius * 0.5, rightCy + shoulderRadius, 'right', 'UA4');
    const r_UA5 = getPt(rightCx - shoulderRadius, rightCy, 'right', 'UA5');

    const r_elbowOuter = { x: elbowRightCx + elbowRadius, y: elbowRightCy };
    const r_wristOuter = { x: wristRightCx + wristRadius, y: wristRightCy };
    const r_elbowInner = { x: elbowRightCx - elbowRadius, y: elbowRightCy };
    const r_wristInner = { x: wristRightCx - wristRadius, y: wristRightCy };

    const r_FR4 = getPt(r_elbowOuter.x, r_elbowOuter.y, 'right', 'FR4');
    const r_FR3 = getPt(lerp(r_elbowOuter, r_wristOuter, 1/3).x, lerp(r_elbowOuter, r_wristOuter, 1/3).y, 'right', 'FR3');
    const r_FR2 = getPt(lerp(r_elbowOuter, r_wristOuter, 2/3).x, lerp(r_elbowOuter, r_wristOuter, 2/3).y, 'right', 'FR2');
    const r_FR1 = getPt(r_wristOuter.x, r_wristOuter.y, 'right', 'FR1');

    const r_FR8 = getPt(r_elbowInner.x, r_elbowInner.y, 'right', 'FR8');
    const r_FR7 = getPt(lerp(r_elbowInner, r_wristInner, 1/3).x, lerp(r_elbowInner, r_wristInner, 1/3).y, 'right', 'FR7');
    const r_FR6 = getPt(lerp(r_elbowInner, r_wristInner, 2/3).x, lerp(r_elbowInner, r_wristInner, 2/3).y, 'right', 'FR6');
    const r_FR5 = getPt(r_wristInner.x, r_wristInner.y, 'right', 'FR5');

    let rightOuter = `M ${r_UA3.x} ${r_UA3.y}`;
    rightOuter += ` Q ${r_UA2.x} ${r_UA2.y}, ${r_UA1.x} ${r_UA1.y}`;
    rightOuter += ` Q ${r_FR4.x} ${r_FR4.y}, ${r_FR3.x} ${r_FR3.y}`;
    rightOuter += ` Q ${r_FR2.x} ${r_FR2.y}, ${r_FR1.x} ${r_FR1.y}`;
    armR.appendChild(svgEl('path', { d: rightOuter, fill: 'none' }));

    let rightInner = `M ${r_UA5.x} ${r_UA5.y}`;
    rightInner += ` Q ${r_UA4.x} ${r_UA4.y}, ${r_FR8.x} ${r_FR8.y}`;
    rightInner += ` Q ${r_FR7.x} ${r_FR7.y}, ${r_FR6.x} ${r_FR6.y}`;
    rightInner += ` Q ${r_FR5.x} ${r_FR5.y}, ${r_FR5.x} ${r_FR5.y}`;
    armR.appendChild(svgEl('path', { d: rightInner, fill: 'none' }));

    // === ОТЛАДОЧНЫЕ ТОЧКИ ===
    const tinyR = headH * 0.01;
    const debugPoints = [
      { p: l_UA1, name: 'lUA1' }, { p: l_UA2, name: 'lUA2' }, { p: l_UA3, name: 'lUA3' }, { p: l_UA4, name: 'lUA4' }, { p: l_UA5, name: 'lUA5' },
      { p: l_FR1, name: 'lFR1' }, { p: l_FR2, name: 'lFR2' }, { p: l_FR3, name: 'lFR3' }, { p: l_FR4, name: 'lFR4' },
      { p: l_FR5, name: 'lFR5' }, { p: l_FR6, name: 'lFR6' }, { p: l_FR7, name: 'lFR7' }, { p: l_FR8, name: 'lFR8' },
      
      { p: r_UA1, name: 'rUA1' }, { p: r_UA2, name: 'rUA2' }, { p: r_UA3, name: 'rUA3' }, { p: r_UA4, name: 'rUA4' }, { p: r_UA5, name: 'rUA5' },
      { p: r_FR1, name: 'rFR1' }, { p: r_FR2, name: 'rFR2' }, { p: r_FR3, name: 'rFR3' }, { p: r_FR4, name: 'rFR4' },
      { p: r_FR5, name: 'rFR5' }, { p: r_FR6, name: 'rFR6' }, { p: r_FR7, name: 'rFR7' }, { p: r_FR8, name: 'rFR8' },
    ];
    for (const item of debugPoints) {
      grid.appendChild(svgEl('circle', {
        cx: item.p.x, cy: item.p.y, r: tinyR, fill: '#2563eb', opacity: 0.8
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
