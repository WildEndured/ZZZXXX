/* js/arm.js — Этап 2: Руки (по детальному референсу) */

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

  // Вспомогательная функция для поиска точки на окружности
  function getPointOnCircle(cx, cy, r, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
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

    // === ПЛЕЧИ ===
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

    armL.appendChild(svgEl('circle', {
      cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none'
    }));
    armR.appendChild(svgEl('circle', {
      cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none'
    }));

    // === ЛИНИИ ОТ ПЛЕЧ К СЕРЕДИНЕ ШЕИ ===
    if (head && torso) {
      const neckHalfW = (headH * (window.Torso.getParams().neckWidth || 0.20)) / 2;
      const neckTopY = head.l4;
      const neckBottomY = torso.chestY0;
      const neckMidY = (neckTopY + neckBottomY) / 2;

      const leftNeckMid = { x: torso.cx - neckHalfW, y: neckMidY };
      const rightNeckMid = { x: torso.cx + neckHalfW, y: neckMidY };

      const leftShoulderTop = { x: leftCx, y: leftCy - shoulderRadius };
      const rightShoulderTop = { x: rightCx, y: rightCy - shoulderRadius };

      armL.appendChild(svgEl('line', {
        x1: leftShoulderTop.x, y1: leftShoulderTop.y,
        x2: leftNeckMid.x, y2: leftNeckMid.y,
        fill: 'none',
      }));

      armR.appendChild(svgEl('line', {
        x1: rightShoulderTop.x, y1: rightShoulderTop.y,
        x2: rightNeckMid.x, y2: rightNeckMid.y,
        fill: 'none',
      }));
    }

    // === ЗАПЯСТЬЯ ===
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

    armL.appendChild(svgEl('circle', {
      cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none'
    }));
    armR.appendChild(svgEl('circle', {
      cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none'
    }));

    // === ЛОКТИ ===
    const elbowRadius = params.elbowRadius * headH;

    const elbowLeftOffsetX = params.elbowLeftX * headH;
    const elbowLeftOffsetY = params.elbowLeftY * headH;
    const elbowLeftCx = (leftCx + wristLeftCx) / 2 + elbowLeftOffsetX;
    const elbowLeftCy = (leftCy + wristLeftCy) / 2 + elbowLeftOffsetY;

    const elbowRightOffsetX = params.elbowRightX * headH;
    const elbowRightOffsetY = params.elbowRightY * headH;
    const elbowRightCx = (rightCx + wristRightCx) / 2 + elbowRightOffsetX;
    const elbowRightCy = (rightCy + wristRightCy) / 2 + elbowRightOffsetY;

    armL.appendChild(svgEl('circle', {
      cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none'
    }));
    armR.appendChild(svgEl('circle', {
      cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none'
    }));

    // === ПОСТРОЕНИЕ КОНТУРА ПО ТОЧКАМ КАСАНИЯ (как на референсе) ===
    
    // ЛЕВАЯ РУКА
    // Находим точки касания (синие маркеры на референсе)
    // Плечо: внешняя точка (слева) и внутренняя точка (справа)
    const lShOuter = getPointOnCircle(leftCx, leftCy, shoulderRadius, 180);
    const lShInner = getPointOnCircle(leftCx, leftCy, shoulderRadius, 0);
    
    // Локоть: внешняя (слева) и внутренняя (справа)
    const lElOuter = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, 180);
    const lElInner = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, 0);
    
    // Запястье: внешняя и внутренняя
    const lWrOuter = getPointOnCircle(wristLeftCx, wristLeftCy, wristRadius, 180);
    const lWrInner = getPointOnCircle(wristLeftCx, wristLeftCy, wristRadius, 0);

    // Внешний контур (слева): Плечо -> Локоть -> Запястье
    // Первая треть от плеча к локтю - выпуклость, остальное - прямая/вогнутая
    let lPathOuter = `M ${lShOuter.x} ${lShOuter.y} `;
    // Кривая от плеча к локтю (выпуклая наружу)
    lPathOuter += `Q ${lShOuter.x - shoulderRadius * 0.6} ${lShOuter.y + (lElOuter.y - lShOuter.y) * 0.5}, ${lElOuter.x} ${lElOuter.y} `;
    // Кривая от локтя к запястью (выпуклая наружу)
    lPathOuter += `Q ${lElOuter.x - shoulderRadius * 0.5} ${lElOuter.y + (lWrOuter.y - lElOuter.y) * 0.5}, ${lWrOuter.x} ${lWrOuter.y}`;
    
    armL.appendChild(svgEl('path', { d: lPathOuter, fill: 'none' }));

    // Внутренний контур (справа): Запястье -> Локоть -> Плечо
    // (в обратном порядке, чтобы замкнуть)
    let lPathInner = `M ${lWrInner.x} ${lWrInner.y} `;
    // Кривая от запястья к локтю (вогнутая внутрь)
    lPathInner += `Q ${lElInner.x + shoulderRadius * 0.2} ${lElInner.y + (lWrInner.y - lElInner.y) * 0.5}, ${lElInner.x} ${lElInner.y} `;
    // Кривая от локтя к плечу (выпуклая внутрь)
    lPathInner += `Q ${lShInner.x + shoulderRadius * 0.3} ${lShInner.y + (lElInner.y - lShInner.y) * 0.5}, ${lShInner.x} ${lShInner.y}`;
    
    armL.appendChild(svgEl('path', { d: lPathInner, fill: 'none' }));


    // ПРАВАЯ РУКА (симметрично)
    const rShOuter = getPointOnCircle(rightCx, rightCy, shoulderRadius, 0);
    const rShInner = getPointOnCircle(rightCx, rightCy, shoulderRadius, 180);
    const rElOuter = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, 0);
    const rElInner = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, 180);
    const rWrOuter = getPointOnCircle(wristRightCx, wristRightCy, wristRadius, 0);
    const rWrInner = getPointOnCircle(wristRightCx, wristRightCy, wristRadius, 180);

    let rPathOuter = `M ${rShOuter.x} ${rShOuter.y} `;
    rPathOuter += `Q ${rShOuter.x + shoulderRadius * 0.6} ${rShOuter.y + (rElOuter.y - rShOuter.y) * 0.5}, ${rElOuter.x} ${rElOuter.y} `;
    rPathOuter += `Q ${rElOuter.x + shoulderRadius * 0.5} ${rElOuter.y + (rWrOuter.y - rElOuter.y) * 0.5}, ${rWrOuter.x} ${rWrOuter.y}`;
    
    armR.appendChild(svgEl('path', { d: rPathOuter, fill: 'none' }));

    let rPathInner = `M ${rWrInner.x} ${rWrInner.y} `;
    rPathInner += `Q ${rElInner.x - shoulderRadius * 0.2} ${rElInner.y + (rWrInner.y - rElInner.y) * 0.5}, ${rElInner.x} ${rElInner.y} `;
    rPathInner += `Q ${rShInner.x - shoulderRadius * 0.3} ${rShInner.y + (rElInner.y - rShInner.y) * 0.5}, ${rShInner.x} ${rShInner.y}`;
    
    armR.appendChild(svgEl('path', { d: rPathInner, fill: 'none' }));

    // === ТОЧКИ КАСАНИЯ (СИНИЕ) для отладки ===
    const tinyR = headH * 0.012;
    const touchPoints = [
      lShOuter, lShInner, lElOuter, lElInner, lWrOuter, lWrInner,
      rShOuter, rShInner, rElOuter, rElInner, rWrOuter, rWrInner
    ];
    for (const pt of touchPoints) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: tinyR, fill: '#2563eb', opacity: 0.8
      }));
    }

    // === МАРКЕРЫ ЦЕНТРОВ СУСТАВОВ (для отладки) ===
    const mR = headH * 0.006;
    const markers = [
      { x: leftCx, y: leftCy }, { x: rightCx, y: rightCy },
      { x: elbowLeftCx, y: elbowLeftCy }, { x: elbowRightCx, y: elbowRightCy },
      { x: wristLeftCx, y: wristLeftCy }, { x: wristRightCx, y: wristRightCy },
    ];
    for (const pt of markers) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: mR, fill: '#9aa0a6', opacity: 0.85
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
