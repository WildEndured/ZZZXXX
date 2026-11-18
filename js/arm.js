/* js/arm.js — Этап 2: Руки (окружности и касательные) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
    wristRadius: 0.08,
    
    // Радиусы дополнительных кругов (в долях от headH)
    r4: 0.07, // круг 4 (между плечом и локтем)
    r3: 0.06, // круг 3 (между локтем и запястьем, верхний)
    r2: 0.055, // круг 2
    r1: 0.05, // круг 1 (ближе к запястью)

    // Позиционирование (как было)
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

    const elbowLeftCx = (leftCx + wristLeftCx) / 2;
    const elbowLeftCy = (leftCy + wristLeftCy) / 2;
    const elbowRightCx = (rightCx + wristRightCx) / 2;
    const elbowRightCy = (rightCy + wristRightCy) / 2;

    // Вспомогательная функция: рисуем круги и возвращаем их данные
    function drawJoints(cxList, cyList, rList, group) {
      for (let i = 0; i < cxList.length; i++) {
        group.appendChild(svgEl('circle', { cx: cxList[i], cy: cyList[i], r: rList[i], fill: 'none', 'stroke-opacity': 0.3 }));
      }
    }

    // === ЛЕВАЯ РУКА ===
    // Круги: П (0), 4 (1), Л (2), 3 (3), 2 (4), 1 (5), З (6)
    const lR = [shoulderRadius, params.r4 * headH, elbowRadius, params.r3 * headH, params.r2 * headH, params.r1 * headH, wristRadius];
    const lCx = [leftCx, (leftCx + elbowLeftCx) / 2, elbowLeftCx, (elbowLeftCx + wristLeftCx) / 2, elbowLeftCx + (wristLeftCx - elbowLeftCx) * 0.66, elbowLeftCx + (wristLeftCx - elbowLeftCx) * 0.33, wristLeftCx];
    const lCy = [leftCy, (leftCy + elbowLeftCy) / 2, elbowLeftCy, (elbowLeftCy + wristLeftCy) / 2, elbowLeftCy + (wristLeftCy - elbowLeftCy) * 0.66, elbowLeftCy + (wristLeftCy - elbowLeftCy) * 0.33, wristLeftCy];

    drawJoints(lCx, lCy, lR, armL);

    // === ПРАВАЯ РУКА ===
    const rR = [shoulderRadius, params.r4 * headH, elbowRadius, params.r3 * headH, params.r2 * headH, params.r1 * headH, wristRadius];
    const rCx = [rightCx, (rightCx + elbowRightCx) / 2, elbowRightCx, (elbowRightCx + wristRightCx) / 2, elbowRightCx + (wristRightCx - elbowRightCx) * 0.66, elbowRightCx + (wristRightCx - elbowRightCx) * 0.33, wristRightCx];
    const rCy = [rightCy, (rightCy + elbowRightCy) / 2, elbowRightCy, (elbowRightCy + wristRightCy) / 2, elbowRightCy + (wristRightCy - elbowRightCy) * 0.66, elbowRightCy + (wristRightCy - elbowRightCy) * 0.33, wristRightCy];

    drawJoints(rCx, rCy, rR, armR);

    // --- ФУНКЦИЯ ДЛЯ ПОСТРОЕНИЯ КАСАТЕЛЬНЫХ ---
    function buildTangentPath(cxList, cyList, rList, isLeft) {
      let path = '';
      
      // Внешняя сторона (для левой руки - это левая сторона, для правой - правая)
      const sign = isLeft ? -1 : 1;
      
      // Верхняя касательная (внешняя)
      for (let i = 0; i < cxList.length - 1; i++) {
        const x1 = cxList[i] + sign * rList[i];
        const y1 = cyList[i];
        const x2 = cxList[i+1] + sign * rList[i+1];
        const y2 = cyList[i+1];
        
        if (i === 0) path += `M ${x1} ${y1}`;
        // Квадратичная кривая для плавности (контрольная точка между ними)
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        // Для плавности используем Q с контрольной точкой посередине
        path += ` Q ${midX + sign * rList[i]*0.2} ${midY}, ${x2} ${y2}`;
      }
      return path;
    }

    // Рисуем внешние контуры
    armL.appendChild(svgEl('path', { d: buildTangentPath(lCx, lCy, lR, true), fill: 'none' }));
    armR.appendChild(svgEl('path', { d: buildTangentPath(rCx, rCy, rR, false), fill: 'none' }));

    // Рисуем внутренние контуры (просто зеркально)
    function buildInnerTangentPath(cxList, cyList, rList, isLeft) {
      let path = '';
      const sign = isLeft ? 1 : -1;
      
      for (let i = 0; i < cxList.length - 1; i++) {
        const x1 = cxList[i] + sign * rList[i];
        const y1 = cyList[i];
        const x2 = cxList[i+1] + sign * rList[i+1];
        const y2 = cyList[i+1];
        
        if (i === 0) path += `M ${x1} ${y1}`;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        path += ` Q ${midX + sign * rList[i]*0.2} ${midY}, ${x2} ${y2}`;
      }
      return path;
    }

    armL.appendChild(svgEl('path', { d: buildInnerTangentPath(lCx, lCy, lR, true), fill: 'none' }));
    armR.appendChild(svgEl('path', { d: buildInnerTangentPath(rCx, rCy, rR, false), fill: 'none' }));
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
