/* js/arm.js — Этап 2: Руки (плавные кривые по точкам) */

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

  // Функция для построения плавной кривой (Catmull-Rom -> Cubic Bezier)
  function buildSmoothPath(points, closePath = false) {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i > 0 ? i - 1 : i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
      
      // Контрольные точки для кубической кривой (Catmull-Rom)
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    if (closePath) d += ' Z';
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

    // === ФУНКЦИЯ СМЕЩЕНИЯ ===
    function getPt(baseX, baseY, side, ptName) {
      const keyX = `${side}${ptName}_dx`;
      const keyY = `${side}${ptName}_dy`;
      return {
        x: baseX + (params[keyX] || 0) * headH,
        y: baseY + (params[keyY] || 0) * headH
      };
    }

    // === ЛЕВАЯ РУКА ===
    const l_UA1 = getPt(leftCx - shoulderRadius, leftCy + shoulderRadius * 0.6, 'left', 'UA1');
    const l_UA2 = getPt(leftCx - shoulderRadius, leftCy, 'left', 'UA2');
    const l_UA3 = getPt(leftCx - shoulderRadius * 0.5, leftCy - shoulderRadius, 'left', 'UA3');
    const l_UA4 = getPt(leftCx + shoulderRadius * 0.5, leftCy + shoulderRadius, 'left', 'UA4');
    const l_UA5 = getPt(leftCx + shoulderRadius, leftCy, 'left', 'UA5');
    
    const l_FR1 = getPt(wristLeftCx - wristRadius, wristLeftCy, 'left', 'FR1');
    const l_FR2 = getPt(wristLeftCx - wristRadius * 0.5 - (wristLeftCx - elbowLeftCx) * 0.33, wristLeftCy - (wristLeftCy - elbowLeftCy) * 0.33, 'left', 'FR2');
    const l_FR3 = getPt(elbowLeftCx - elbowRadius * 0.5 - (wristLeftCx - elbowLeftCx) * 0.33, elbowLeftCy - (wristLeftCy - elbowLeftCy) * 0.33, 'left', 'FR3');
    const l_FR4 = getPt(elbowLeftCx - elbowRadius, elbowLeftCy, 'left', 'FR4');
    const l_FR5 = getPt(wristLeftCx + wristRadius, wristLeftCy, 'left', 'FR5');
    const l_FR6 = getPt(wristLeftCx + wristRadius * 0.5 + (elbowLeftCx - wristLeftCx) * 0.33, wristLeftCy + (elbowLeftCy - wristLeftCy) * 0.33, 'left', 'FR6');
    const l_FR7 = getPt(elbowLeftCx + elbowRadius * 0.5 + (wristLeftCx - elbowLeftCx) * 0.33, elbowLeftCy + (wristLeftCy - elbowLeftCy) * 0.33, 'left', 'FR7');
    const l_FR8 = getPt(elbowLeftCx + elbowRadius, elbowLeftCy, 'left', 'FR8');

    // Внешний контур левой руки (плавная кривая)
    const leftOuterPts = [l_UA3, l_UA2, l_UA1, l_FR4, l_FR3, l_FR2, l_FR1];
    armL.appendChild(svgEl('path', { d: buildSmoothPath(leftOuterPts), fill: 'none' }));

    // Внутренний контур левой руки
    const leftInnerPts = [l_UA5, l_UA4, l_FR8, l_FR7, l_FR6, l_FR5];
    armL.appendChild(svgEl('path', { d: buildSmoothPath(leftInnerPts), fill: 'none' }));

    // === ПРАВАЯ РУКА ===
    const r_UA1 = getPt(rightCx + shoulderRadius, rightCy + shoulderRadius * 0.6, 'right', 'UA1');
    const r_UA2 = getPt(rightCx + shoulderRadius, rightCy, 'right', 'UA2');
    const r_UA3 = getPt(rightCx + shoulderRadius * 0.5, rightCy - shoulderRadius, 'right', 'UA3');
    const r_UA4 = getPt(rightCx - shoulderRadius * 0.5, rightCy + shoulderRadius, 'right', 'UA4');
    const r_UA5 = getPt(rightCx - shoulderRadius, rightCy, 'right', 'UA5');
    
    const r_FR1 = getPt(wristRightCx + wristRadius, wristRightCy, 'right', 'FR1');
    const r_FR2 = getPt(wristRightCx + wristRadius * 0.5 + (elbowRightCx - wristRightCx) * 0.33, wristRightCy + (elbowRightCy - wristRightCy) * 0.33, 'right', 'FR2');
    const r_FR3 = getPt(elbowRightCx + elbowRadius * 0.5 + (wristRightCx - elbowRightCx) * 0.33, elbowRightCy + (wristRightCy - elbowRightCy) * 0.33, 'right', 'FR3');
    const r_FR4 = getPt(elbowRightCx + elbowRadius, elbowRightCy, 'right', 'FR4');
    const r_FR5 = getPt(wristRightCx - wristRadius, wristRightCy, 'right', 'FR5');
    const r_FR6 = getPt(wristRightCx - wristRadius * 0.5 - (wristRightCx - elbowRightCx) * 0.33, wristRightCy - (wristRightCy - elbowRightCy) * 0.33, 'right', 'FR6');
    const r_FR7 = getPt(elbowRightCx - elbowRadius * 0.5 - (wristRightCx - elbowRightCx) * 0.33, elbowRightCy - (wristRightCy - elbowRightCy) * 0.33, 'right', 'FR7');
    const r_FR8 = getPt(elbowRightCx - elbowRadius, elbowRightCy, 'right', 'FR8');

    // Внешний контур правой руки
    const rightOuterPts = [r_UA3, r_UA2, r_UA1, r_FR4, r_FR3, r_FR2, r_FR1];
    armR.appendChild(svgEl('path', { d: buildSmoothPath(rightOuterPts), fill: 'none' }));

    // Внутренний контур правой руки
    const rightInnerPts = [r_UA5, r_UA4, r_FR8, r_FR7, r_FR6, r_FR5];
    armR.appendChild(svgEl('path', { d: buildSmoothPath(rightInnerPts), fill: 'none' }));

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
      const text = svgEl('text', {
        x: item.p.x + tinyR * 2, y: item.p.y + tinyR,
        'font-size': headH * 0.02, fill: '#2563eb',
        'font-family': 'monospace'
      });
      text.textContent = item.name;
      grid.appendChild(text);
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
