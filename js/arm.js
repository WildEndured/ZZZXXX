/* js/arm.js — Этап 2: Руки по каркасному референсу */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
    elbowLeftX: 0, elbowLeftY: 0, elbowRightX: 0, elbowRightY: 0,
    wristRadius: 0.08,
    wristLeftX: -0.20, wristLeftY: 0, wristRightX: 0.20, wristRightY: 0,
    leftX: 0, leftY: 0, rightX: 0, rightY: 0,
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

  // Вспомогательная функция для получения точки на окружности по углу
  function getPoint(cx, cy, r, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // Вспомогательная функция для соединения массива точек в Path
  function createPath(points) {
    if (points.length === 0) return '';
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
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

    // === БАЗОВЫЕ ТОЧКИ СУСТАВОВ ===
    const baseShoulderRadius = (chestH / 3) / 2;
    const shoulderRadius = baseShoulderRadius * params.shoulderRadiusMul;
    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftOffsetX = params.leftX * headH;
    const leftOffsetY = params.leftY * headH;
    const rightOffsetX = params.rightX * headH;
    const rightOffsetY = params.rightY * headH;

    const leftShoulder = { x: torso.cx - curveWidth - shoulderRadius + leftOffsetX, y: shoulderCy + leftOffsetY };
    const rightShoulder = { x: torso.cx + curveWidth + shoulderRadius + rightOffsetX, y: shoulderCy + rightOffsetY };

    // Радиусы
    const wristRadius = params.wristRadius * headH;
    const elbowRadius = params.elbowRadius * headH;

    const pelvisBottomY = torso.pelvisY0 + torso.pelvisH;
    const wristLeftCy = pelvisBottomY - wristRadius + params.wristLeftY * headH + leftOffsetY;
    const wristLeftCx = torso.cx - chestRx - shoulderRadius * 1.5 + params.wristLeftX * headH + leftOffsetX;

    const wristRightCy = pelvisBottomY - wristRadius + params.wristRightY * headH + rightOffsetY;
    const wristRightCx = torso.cx + chestRx + shoulderRadius * 1.5 + params.wristRightX * headH + rightOffsetX;

    const leftWrist = { x: wristLeftCx, y: wristLeftCy };
    const rightWrist = { x: wristRightCx, y: wristRightCy };

    const leftElbow = { x: (leftShoulder.x + leftWrist.x) / 2 + params.elbowLeftX * headH, y: (leftShoulder.y + leftWrist.y) / 2 + params.elbowLeftY * headH };
    const rightElbow = { x: (rightShoulder.x + rightWrist.x) / 2 + params.elbowRightX * headH, y: (rightShoulder.y + rightWrist.y) / 2 + params.elbowRightY * headH };

    // === РИСУЕМ СУСТАВЫ ===
    armL.appendChild(svgEl('circle', { cx: leftShoulder.x, cy: leftShoulder.y, r: shoulderRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: leftElbow.x, cy: leftElbow.y, r: elbowRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: leftWrist.x, cy: leftWrist.y, r: wristRadius, fill: 'none' }));

    armR.appendChild(svgEl('circle', { cx: rightShoulder.x, cy: rightShoulder.y, r: shoulderRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: rightElbow.x, cy: rightElbow.y, r: elbowRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: rightWrist.x, cy: rightWrist.y, r: wristRadius, fill: 'none' }));

    // === ЛЕВАЯ РУКА (Внешняя сторона = левая) ===
    // Углы для внешней стороны (левая сторона круга)
    const outerAngles = [180, 225, 270, 315]; // П, UA3, UA2, UA1
    const outerInnerAngles = [135, 90, 45]; // UA4, UA5, Л

    const leftShoulderOuterPoints = outerAngles.map(a => getPoint(leftShoulder.x, leftShoulder.y, shoulderRadius, a));
    const leftShoulderInnerPoints = outerInnerAngles.map(a => getPoint(leftShoulder.x, leftShoulder.y, shoulderRadius, a));
    
    // Соединяем внешнюю часть плеча (П->УА3->УА2->УА1)
    armL.appendChild(svgEl('path', { d: createPath(leftShoulderOuterPoints), fill: 'none' }));

    // Соединяем внутреннюю часть плеча (Л->УА4->УА5) - у нас Л это центр локтя, поэтому начинаем с него
    const leftElbowOuterPoints = [180, 225, 270, 315].map(a => getPoint(leftElbow.x, leftElbow.y, elbowRadius, a));
    const leftElbowInnerPoints = [135, 90, 45].map(a => getPoint(leftElbow.x, leftElbow.y, elbowRadius, a));
    
    // От внешней точки плеча (315) к внешней точке локтя (180)
    armL.appendChild(svgEl('line', {
        x1: leftShoulderOuterPoints[3].x, y1: leftShoulderOuterPoints[3].y,
        x2: leftElbowOuterPoints[0].x, y2: leftElbowOuterPoints[0].y, fill: 'none'
    }));

    // Внутренний контур плеча (от внутренней точки плеча к внутренней точке локтя)
    // Точка UA5 на плече (угол 90) - это внутренняя нижняя точка.
    armL.appendChild(svgEl('line', {
        x1: leftShoulderInnerPoints[1].x, y1: leftShoulderInnerPoints[1].y, // UA5 (90°)
        x2: leftElbowInnerPoints[1].x, y2: leftElbowInnerPoints[1].y,       // Л (90°)
        fill: 'none'
    }));

    // Предплечье левое (внешняя сторона)
    const leftElbowForearmOuter = [180, 225, 270, 315].map(a => getPoint(leftElbow.x, leftElbow.y, elbowRadius, a));
    const leftWristOuter = [180, 225, 270, 315].map(a => getPoint(leftWrist.x, leftWrist.y, wristRadius, a));
    armL.appendChild(svgEl('line', { x1: leftElbowForearmOuter[3].x, y1: leftElbowForearmOuter[3].y, x2: leftWristOuter[0].x, y2: leftWristOuter[0].y, fill: 'none' }));

    // Предплечье левое (внутренняя сторона)
    const leftElbowForearmInner = [135, 90, 45].map(a => getPoint(leftElbow.x, leftElbow.y, elbowRadius, a));
    const leftWristInner = [135, 90, 45].map(a => getPoint(leftWrist.x, leftWrist.y, wristRadius, a));
    armL.appendChild(svgEl('line', { x1: leftElbowForearmInner[1].x, y1: leftElbowForearmInner[1].y, x2: leftWristInner[1].x, y2: leftWristInner[1].y, fill: 'none' }));

    // === ПРАВАЯ РУКА (Внешняя сторона = правая) ===
    // Углы для внешней стороны (правая сторона круга): 0, -45, -90, -135
    const rightOuterAngles = [0, 315, 270, 225]; // П, UA3, UA2, UA1
    const rightInnerAngles = [45, 90, 135]; // UA4, UA5, Л (внутренняя сторона)

    const rightShoulderOuterPoints = rightOuterAngles.map(a => getPoint(rightShoulder.x, rightShoulder.y, shoulderRadius, a));
    const rightShoulderInnerPoints = rightInnerAngles.map(a => getPoint(rightShoulder.x, rightShoulder.y, shoulderRadius, a));

    armR.appendChild(svgEl('path', { d: createPath(rightShoulderOuterPoints), fill: 'none' }));

    const rightElbowOuterPoints = [0, 315, 270, 225].map(a => getPoint(rightElbow.x, rightElbow.y, elbowRadius, a));
    const rightElbowInnerPoints = [45, 90, 135].map(a => getPoint(rightElbow.x, rightElbow.y, elbowRadius, a));

    // Внешняя линия плеча
    armR.appendChild(svgEl('line', { x1: rightShoulderOuterPoints[3].x, y1: rightShoulderOuterPoints[3].y, x2: rightElbowOuterPoints[0].x, y2: rightElbowOuterPoints[0].y, fill: 'none' }));

    // Внутренняя линия плеча
    armR.appendChild(svgEl('line', { x1: rightShoulderInnerPoints[1].x, y1: rightShoulderInnerPoints[1].y, x2: rightElbowInnerPoints[1].x, y2: rightElbowInnerPoints[1].y, fill: 'none' }));

    // Предплечье правое (внешняя сторона)
    const rightElbowForearmOuter = [0, 315, 270, 225].map(a => getPoint(rightElbow.x, rightElbow.y, elbowRadius, a));
    const rightWristOuter = [0, 315, 270, 225].map(a => getPoint(rightWrist.x, rightWrist.y, wristRadius, a));
    armR.appendChild(svgEl('line', { x1: rightElbowForearmOuter[3].x, y1: rightElbowForearmOuter[3].y, x2: rightWristOuter[0].x, y2: rightWristOuter[0].y, fill: 'none' }));

    // Предплечье правое (внутренняя сторона)
    const rightElbowForearmInner = [45, 90, 135].map(a => getPoint(rightElbow.x, rightElbow.y, elbowRadius, a));
    const rightWristInner = [45, 90, 135].map(a => getPoint(rightWrist.x, rightWrist.y, wristRadius, a));
    armR.appendChild(svgEl('line', { x1: rightElbowForearmInner[1].x, y1: rightElbowForearmInner[1].y, x2: rightWristInner[1].x, y2: rightWristInner[1].y, fill: 'none' }));

    // === ОТЛАДОЧНЫЕ МАРКЕРЫ ===
    // (Оставляем для наглядности, чтобы ты видел, как ложатся точки)
    const mR = headH * 0.012;
    const markers = [
      { x: leftShoulder.x, y: leftShoulder.y }, { x: leftElbow.x, y: leftElbow.y }, { x: leftWrist.x, y: leftWrist.y },
      { x: rightShoulder.x, y: rightShoulder.y }, { x: rightElbow.x, y: rightElbow.y }, { x: rightWrist.x, y: rightWrist.y },
    ];
    for (const pt of markers) {
      grid.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: mR, fill: '#2563eb', opacity: 0.85 }));
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
