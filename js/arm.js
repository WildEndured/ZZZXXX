/* js/arm.js — Этап 2: Руки (через окружности и касательные) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
    wristRadius: 0.08,
    r4: 0.07,
    r3: 0.06,
    r2: 0.055,
    r1: 0.05,
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
    const elbowLeftCx = (leftCx + wristLeftCx) / 2;
    const elbowLeftCy = (leftCy + wristLeftCy) / 2;
    const elbowRightCx = (rightCx + wristRightCx) / 2;
    const elbowRightCy = (rightCy + wristRightCy) / 2;

    // === ЛЕВАЯ РУКА ===
    // Список кругов сверху вниз: плечо, 4, локоть, 3, 2, 1, запястье
    const lCircles = [
      { cx: leftCx, cy: leftCy, r: shoulderRadius },
      { cx: (leftCx + elbowLeftCx) / 2, cy: (leftCy + elbowLeftCy) / 2, r: params.r4 * headH },
      { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius },
      { cx: elbowLeftCx + (wristLeftCx - elbowLeftCx) * 0.33, cy: elbowLeftCy + (wristLeftCy - elbowLeftCy) * 0.33, r: params.r3 * headH },
      { cx: elbowLeftCx + (wristLeftCx - elbowLeftCx) * 0.66, cy: elbowLeftCy + (wristLeftCy - elbowLeftCy) * 0.66, r: params.r2 * headH },
      { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius },
    ];

    // === ПРАВАЯ РУКА ===
    const rCircles = [
      { cx: rightCx, cy: rightCy, r: shoulderRadius },
      { cx: (rightCx + elbowRightCx) / 2, cy: (rightCy + elbowRightCy) / 2, r: params.r4 * headH },
      { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius },
      { cx: elbowRightCx + (wristRightCx - elbowRightCx) * 0.33, cy: elbowRightCy + (wristRightCy - elbowRightCy) * 0.33, r: params.r3 * headH },
      { cx: elbowRightCx + (wristRightCx - elbowRightCx) * 0.66, cy: elbowRightCy + (wristRightCy - elbowRightCy) * 0.66, r: params.r2 * headH },
      { cx: wristRightCx, cy: wristRightCy, r: wristRadius },
    ];

    // Рисуем сами круги (для отладки, полупрозрачные)
    for (const c of lCircles) {
      armL.appendChild(svgEl('circle', { cx: c.cx, cy: c.cy, r: c.r, fill: 'none', 'stroke-opacity': 0.3 }));
    }
    for (const c of rCircles) {
      armR.appendChild(svgEl('circle', { cx: c.cx, cy: c.cy, r: c.r, fill: 'none', 'stroke-opacity': 0.3 }));
    }

    // === ФУНКЦИЯ ПОСТРОЕНИЯ КАСАТЕЛЬНЫХ ===
    // Для простоты и стабильности соединяем крайние точки кругов через Q (квадратичные Безье)
    function buildOuterPath(circles, sign) {
      let path = '';
      for (let i = 0; i < circles.length - 1; i++) {
        const c1 = circles[i];
        const c2 = circles[i + 1];
        
        const x1 = c1.cx + sign * c1.r;
        const y1 = c1.cy;
        const x2 = c2.cx + sign * c2.r;
        const y2 = c2.cy;
        
        if (i === 0) path += `M ${x1} ${y1}`;
        
        // Контрольная точка для плавности (посередине)
        const midX = (x1 + x2) / 2 + sign * (c1.r + c2.r) * 0.1;
        const midY = (y1 + y2) / 2;
        
        path += ` Q ${midX} ${midY}, ${x2} ${y2}`;
      }
      return path;
    }

    // Левая рука: внешняя сторона (sign = -1), внутренняя (sign = 1)
    armL.appendChild(svgEl('path', { d: buildOuterPath(lCircles, -1), fill: 'none' }));
    armL.appendChild(svgEl('path', { d: buildOuterPath(lCircles, 1), fill: 'none' }));

    // Правая рука: внешняя (sign = 1), внутренняя (sign = -1)
    armR.appendChild(svgEl('path', { d: buildOuterPath(rCircles, 1), fill: 'none' }));
    armR.appendChild(svgEl('path', { d: buildOuterPath(rCircles, -1), fill: 'none' }));

    // === ОТЛАДОЧНЫЕ МАРКЕРЫ ЦЕНТРОВ ===
    const tinyR = headH * 0.012;
    const allCenters = [...lCircles, ...rCircles];
    for (const c of allCenters) {
      grid.appendChild(svgEl('circle', {
        cx: c.cx, cy: c.cy, r: tinyR, fill: '#2563eb', opacity: 0.8
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
