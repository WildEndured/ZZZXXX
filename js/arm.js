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

  // Кривая Катмулла-Рома (гладкая кривая через все точки)
  function catmullRom2bezier(points) {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y} `;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y} `;
    }
    return d;
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

    // === СУСТАВЫ ===
    const baseShoulderRadius = (chestH / 3) / 2;
    const shoulderRadius = baseShoulderRadius * params.shoulderRadiusMul;
    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftCx = torso.cx - curveWidth - shoulderRadius + params.leftX * headH;
    const rightCx = torso.cx + curveWidth + shoulderRadius + params.rightX * headH;
    const leftCy = shoulderCy + params.leftY * headH;
    const rightCy = shoulderCy + params.rightY * headH;

    const pelvisBottomY = torso.pelvisY0 + torso.pelvisH;
    const wristRadius = params.wristRadius * headH;
    const wristLeftCx = torso.cx - chestRx - shoulderRadius * 1.5 + params.wristLeftX * headH;
    const wristLeftCy = pelvisBottomY - wristRadius + params.wristLeftY * headH;
    const wristRightCx = torso.cx + chestRx + shoulderRadius * 1.5 + params.wristRightX * headH;
    const wristRightCy = pelvisBottomY - wristRadius + params.wristRightY * headH;

    const elbowRadius = params.elbowRadius * headH;
    const elbowLeftCx = (leftCx + wristLeftCx) / 2 + params.elbowLeftX * headH;
    const elbowLeftCy = (leftCy + wristLeftCy) / 2 + params.elbowLeftY * headH;
    const elbowRightCx = (rightCx + wristRightCx) / 2 + params.elbowRightX * headH;
    const elbowRightCy = (rightCy + wristRightCy) / 2 + params.elbowRightY * headH;

    armL.appendChild(svgEl('circle', { cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none' }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none' }));

    // === ТОЧКИ И ЛИНИИ ===
    const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

    function buildArmPaths(cx, cy, rSh, eCx, eCy, rEl, wCx, wCy, rWr, isLeft) {
      // Вектор плечо->локоть
      const dx1 = eCx - cx, dy1 = eCy - cy;
      const len1 = Math.hypot(dx1, dy1);
      // Нормаль (внешняя сторона)
      const nx1 = isLeft ? -dy1 / len1 : dy1 / len1;
      const ny1 = isLeft ? dx1 / len1 : -dx1 / len1;

      // Вектор локоть->запястье
      const dx2 = wCx - eCx, dy2 = wCy - eCy;
      const len2 = Math.hypot(dx2, dy2);
      // Нормаль (внешняя сторона)
      const nx2 = isLeft ? -dy2 / len2 : dy2 / len2;
      const ny2 = isLeft ? dx2 / len2 : -dx2 / len2;

      // Отступы
      const out1 = rSh * 0.85;
      const in1 = rSh * 0.4;
      const out2 = rEl * 1.1;
      const in2 = rEl * 0.5;

      // Внешний контур (UA3 -> UA2 -> UA1 -> FR4 -> FR3 -> FR2 -> FR1)
      const pUA3 = { x: cx + nx1 * rSh, y: cy + ny1 * rSh };
      const pUA2 = { x: lerp({x:cx,y:cy}, {x:eCx,y:eCy}, 0.66).x + nx1 * out1, y: lerp({x:cx,y:cy}, {x:eCx,y:eCy}, 0.66).y + ny1 * out1 };
      const pUA1 = { x: lerp({x:cx,y:cy}, {x:eCx,y:eCy}, 0.33).x + nx1 * out1, y: lerp({x:cx,y:cy}, {x:eCx,y:eCy}, 0.33).y + ny1 * out1 };
      
      const pFR4 = { x: eCx + nx2 * out2, y: eCy + ny2 * out2 };
      const pFR3 = { x: lerp({x:eCx,y:eCy}, {x:wCx,y:wCy}, 0.33).x + nx2 * out2, y: lerp({x:eCx,y:eCy}, {x:wCx,y:wCy}, 0.33).y + ny2 * out2 };
      const pFR2 = { x: lerp({x:eCx,y:eCy}, {x:wCx,y:wCy}, 0.66).x + nx2 * out2 * 0.6, y: lerp({x:eCx,y:eCy}, {x:wCx,y:wCy}, 0.66).y + ny2 * out2 * 0.6 };
      const pFR1 = { x: wCx + nx2 * rWr, y: wCy + ny2 * rWr };

      // Внутренний контур (UA3 -> UA4 -> UA5 -> FR8 -> FR7 -> FR6 -> FR5)
      const pUA4 = { x: lerp({x:cx,y:cy}, {x:eCx,y:eCy}, 0.66).x - nx1 * in1, y: lerp({x:cx,y:cy}, {x:eCx,y:eCy}, 0.66).y - ny1 * in1 };
      const pUA5 = { x: lerp({x:cx,y:cy}, {x:eCx,y:eCy}, 0.33).x - nx1 * in1, y: lerp({x:cx,y:cy}, {x:eCx,y:eCy}, 0.33).y - ny1 * in1 };
      
      const pFR8 = { x: eCx - nx2 * in2, y: eCy - ny2 * in2 };
      const pFR7 = { x: lerp({x:eCx,y:eCy}, {x:wCx,y:wCy}, 0.33).x - nx2 * in2, y: lerp({x:eCx,y:eCy}, {x:wCx,y:wCy}, 0.33).y - ny2 * in2 };
      const pFR6 = { x: lerp({x:eCx,y:eCy}, {x:wCx,y:wCy}, 0.66).x - nx2 * in2 * 0.6, y: lerp({x:eCx,y:eCy}, {x:wCx,y:wCy}, 0.66).y - ny2 * in2 * 0.6 };
      const pFR5 = { x: wCx - nx2 * rWr, y: wCy - ny2 * rWr };

      // Пути
      const outerPath = catmullRom2bezier([pUA3, pUA2, pUA1, pFR4, pFR3, pFR2, pFR1]);
      const innerPath = catmullRom2bezier([pUA3, pUA4, pUA5, pFR8, pFR7, pFR6, pFR5]);

      // Возвращаем готовые пути и точки для отладки
      return { outerPath, innerPath, points: [pUA1, pUA2, pUA3, pUA4, pUA5, pFR1, pFR2, pFR3, pFR4, pFR5, pFR6, pFR7, pFR8] };
    }

    const leftArm = buildArmPaths(leftCx, leftCy, shoulderRadius, elbowLeftCx, elbowLeftCy, elbowRadius, wristLeftCx, wristLeftCy, wristRadius, true);
    armL.appendChild(svgEl('path', { d: leftArm.outerPath, fill: 'none' }));
    armL.appendChild(svgEl('path', { d: leftArm.innerPath, fill: 'none' }));

    const rightArm = buildArmPaths(rightCx, rightCy, shoulderRadius, elbowRightCx, elbowRightCy, elbowRadius, wristRightCx, wristRightCy, wristRadius, false);
    armR.appendChild(svgEl('path', { d: rightArm.outerPath, fill: 'none' }));
    armR.appendChild(svgEl('path', { d: rightArm.innerPath, fill: 'none' }));

    // Отладочные точки
    const tinyR = headH * 0.008;
    for (const pt of [...leftArm.points, ...rightArm.points]) {
      grid.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: tinyR, fill: '#ff0000', opacity: 0.8 }));
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
