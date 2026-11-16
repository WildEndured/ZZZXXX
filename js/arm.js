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

  // Генерация пути Катмулла-Рома (гладкая кривая через все точки)
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

    // === ТОЧКИ И ЛИНИИ ПО РЕФЕРЕНСУ ===
    
    // ЛЕВАЯ РУКА
    // Вектор от локтя к плечу (для верхней части)
    const dxShoulder = leftCx - elbowLeftCx;
    const dyShoulder = leftCy - elbowLeftCy;
    
    // Вектор от запястья к локтю (для предплечья)
    const dxWrist = wristLeftCx - elbowLeftCx;
    const dyWrist = wristLeftCy - elbowLeftCy;

    // Нормали (перпендикуляры для сдвига точек)
    // Для внешней стороны левой руки нормаль смотрит влево-вверх
    const lenShoulder = Math.sqrt(dxShoulder*dxShoulder + dyShoulder*dyShoulder);
    const nxShoulder = -dyShoulder / lenShoulder;
    const nyShoulder = dxShoulder / lenShoulder;

    const lenWrist = Math.sqrt(dxWrist*dxWrist + dyWrist*dyWrist);
    const nxWrist = -dyWrist / lenWrist;
    const nyWrist = dxWrist / lenWrist;

    // Устанавливаем отступы для точек (в долях от радиуса сустава)
    const outerOffset = shoulderRadius * 0.8;
    const innerOffset = shoulderRadius * 0.3;
    const frOuterOffset = shoulderRadius * 0.9;
    const frInnerOffset = shoulderRadius * 0.4;

    // UA точки (Плечо)
    // UA3 - верхняя точка (сдвиг от центра плеча вверх)
    const ua3 = { x: leftCx, y: leftCy - shoulderRadius };
    // UA1/UA2 - внешние (сдвигаем от локтя к внешней стороне)
    const ua1 = { x: elbowLeftCx + dxShoulder * 0.33 + nxShoulder * outerOffset, y: elbowLeftCy + dyShoulder * 0.33 + nyShoulder * outerOffset };
    const ua2 = { x: elbowLeftCx + dxShoulder * 0.66 + nxShoulder * outerOffset, y: elbowLeftCy + dyShoulder * 0.66 + nyShoulder * outerOffset };
    // UA4/UA5 - внутренние (сдвигаем к центру руки)
    const ua4 = { x: elbowLeftCx + dxShoulder * 0.66 - nxShoulder * innerOffset, y: elbowLeftCy + dyShoulder * 0.66 - nyShoulder * innerOffset };
    const ua5 = { x: elbowLeftCx + dxShoulder * 0.33 - nxShoulder * innerOffset, y: elbowLeftCy + dyShoulder * 0.33 - nyShoulder * innerOffset };

    // FR точки (Предплечье)
    // FR4/FR8 - у локтя
    const fr4 = { x: elbowLeftCx + nxWrist * frOuterOffset, y: elbowLeftCy + nyWrist * frOuterOffset };
    const fr8 = { x: elbowLeftCx - nxWrist * frInnerOffset, y: elbowLeftCy - nyWrist * frInnerOffset };
    // FR3/FR7 - средняя часть
    const fr3 = { x: elbowLeftCx + dxWrist * 0.33 + nxWrist * frOuterOffset, y: elbowLeftCy + dyWrist * 0.33 + nyWrist * frOuterOffset };
    const fr7 = { x: elbowLeftCx + dxWrist * 0.33 - nxWrist * frInnerOffset, y: elbowLeftCy + dyWrist * 0.33 - nyWrist * frInnerOffset };
    // FR2/FR6 - 2/3 предплечья
    const fr2 = { x: elbowLeftCx + dxWrist * 0.66 + nxWrist * frOuterOffset * 0.6, y: elbowLeftCy + dyWrist * 0.66 + nyWrist * frOuterOffset * 0.6 }; // Сужается
    const fr6 = { x: elbowLeftCx + dxWrist * 0.66 - nxWrist * frInnerOffset * 0.6, y: elbowLeftCy + dyWrist * 0.66 - nyWrist * frInnerOffset * 0.6 };
    // FR1/FR5 - у запястья
    const fr1 = { x: wristLeftCx + nxWrist * wristRadius, y: wristLeftCy + nyWrist * wristRadius };
    const fr5 = { x: wristLeftCx - nxWrist * wristRadius, y: wristLeftCy - nyWrist * wristRadius };

    // Рисуем ЛЕВУЮ РУКУ
    const leftOuterPath = catmullRom2bezier([ua3, ua2, ua1, fr4, fr3, fr2, fr1]);
    const leftInnerPath = catmullRom2bezier([ua3, ua4, ua5, fr8, fr7, fr6, fr5]);

    armL.appendChild(svgEl('path', { d: leftOuterPath, fill: 'none' }));
    armL.appendChild(svgEl('path', { d: leftInnerPath, fill: 'none' }));

    // Отрисовка точек для отладки (левая рука)
    const tinyR = headH * 0.008;
    const leftPoints = [ua3, ua2, ua1, ua4, ua5, fr4, fr3, fr2, fr1, fr8, fr7, fr6, fr5];
    for (const pt of leftPoints) {
      grid.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: tinyR, fill: '#ff0000', opacity: 0.8 }));
    }

    // ПРАВАЯ РУКА (Зеркально)
    const dxShoulderR = rightCx - elbowRightCx;
    const dyShoulderR = rightCy - elbowRightCy;
    const lenShoulderR = Math.sqrt(dxShoulderR*dxShoulderR + dyShoulderR*dyShoulderR);
    const nxShoulderR = dyShoulderR / lenShoulderR;
    const nyShoulderR = -dxShoulderR / lenShoulderR;

    const dxWristR = wristRightCx - elbowRightCx;
    const dyWristR = wristRightCy - elbowRightCy;
    const lenWristR = Math.sqrt(dxWristR*dxWristR + dyWristR*dyWristR);
    const nxWristR = dyWristR / lenWristR;
    const nyWristR = -dxWristR / lenWristR;

    const ua3R = { x: rightCx, y: rightCy - shoulderRadius };
    const ua1R = { x: elbowRightCx + dxShoulderR * 0.33 + nxShoulderR * outerOffset, y: elbowRightCy + dyShoulderR * 0.33 + nyShoulderR * outerOffset };
    const ua2R = { x: elbowRightCx + dxShoulderR * 0.66 + nxShoulderR * outerOffset, y: elbowRightCy + dyShoulderR * 0.66 + nyShoulderR * outerOffset };
    const ua4R = { x: elbowRightCx + dxShoulderR * 0.66 - nxShoulderR * innerOffset, y: elbowRightCy + dyShoulderR * 0.66 - nyShoulderR * innerOffset };
    const ua5R = { x: elbowRightCx + dxShoulderR * 0.33 - nxShoulderR * innerOffset, y: elbowRightCy + dyShoulderR * 0.33 - nyShoulderR * innerOffset };

    const fr4R = { x: elbowRightCx + nxWristR * frOuterOffset, y: elbowRightCy + nyWristR * frOuterOffset };
    const fr8R = { x: elbowRightCx - nxWristR * frInnerOffset, y: elbowRightCy - nyWristR * frInnerOffset };
    const fr3R = { x: elbowRightCx + dxWristR * 0.33 + nxWristR * frOuterOffset, y: elbowRightCy + dyWristR * 0.33 + nyWristR * frOuterOffset };
    const fr7R = { x: elbowRightCx + dxWristR * 0.33 - nxWristR * frInnerOffset, y: elbowRightCy + dyWristR * 0.33 - nyWristR * frInnerOffset };
    const fr2R = { x: elbowRightCx + dxWristR * 0.66 + nxWristR * frOuterOffset * 0.6, y: elbowRightCy + dyWristR * 0.66 + nyWristR * frOuterOffset * 0.6 };
    const fr6R = { x: elbowRightCx + dxWristR * 0.66 - nxWristR * frInnerOffset * 0.6, y: elbowRightCy + dyWristR * 0.66 - nyWristR * frInnerOffset * 0.6 };
    const fr1R = { x: wristRightCx + nxWristR * wristRadius, y: wristRightCy + nyWristR * wristRadius };
    const fr5R = { x: wristRightCx - nxWristR * wristRadius, y: wristRightCy - nyWristR * wristRadius };

    const rightOuterPath = catmullRom2bezier([ua3R, ua2R, ua1R, fr4R, fr3R, fr2R, fr1R]);
    const rightInnerPath = catmullRom2bezier([ua3R, ua4R, ua5R, fr8R, fr7R, fr6R, fr5R]);

    armR.appendChild(svgEl('path', { d: rightOuterPath, fill: 'none' }));
    armR.appendChild(svgEl('path', { d: rightInnerPath, fill: 'none' }));

    // Отрисовка точек для отладки (правая рука)
    const rightPoints = [ua3R, ua2R, ua1R, ua4R, ua5R, fr4R, fr3R, fr2R, fr1R, fr8R, fr7R, fr6R, fr5R];
    for (const pt of rightPoints) {
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
