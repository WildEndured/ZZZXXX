/* js/arm.js — Этап 2: Суставы + контур предплечья (по точкам P0-P2) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
    wristRadius: 0.08,

    wristLeftX: -0.20, wristLeftY: 0,
    wristRightX: 0.20, wristRightY: 0,

    elbowLeftX: 0, elbowLeftY: 0,
    elbowRightX: 0, elbowRightY: 0,

    leftX: 0, leftY: 0, rightX: 0, rightY: 0,

    // Коэффициент выпуклости предплечья
    forearmCurvature: 1.0, 
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

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

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

  // Функция для рисования контура предплечья по правилу P0 -> P1 -> P2
  function drawForearmContour(group, p0, p1, p2) {
    // Строим квадратичную кривую Безье
    const d = `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;
    group.appendChild(svgEl('path', { d, fill: 'none' }));
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

    // Смещения
    const leftOffsetX = params.leftX * headH;
    const leftOffsetY = params.leftY * headH;
    const rightOffsetX = params.rightX * headH;
    const rightOffsetY = params.rightY * headH;

    // === ПЛЕЧИ ===
    const baseShoulderRadius = (chestH / 3) / 2;
    const shoulderRadius = baseShoulderRadius * params.shoulderRadiusMul;

    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftCx = torso.cx - curveWidth - shoulderRadius + leftOffsetX;
    const rightCx = torso.cx + curveWidth + shoulderRadius + rightOffsetX;
    const leftCy = shoulderCy + leftOffsetY;
    const rightCy = shoulderCy + rightOffsetY;

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

    // === РИСУЕМ СУСТАВЫ ===
    armL.appendChild(svgEl('circle', { cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    // === КОНТУР ПРЕДПЛЕЧЬЯ (ПО ТВОИМ ТОЧКАМ) ===
    // Твои координаты были заданы для холста 4096x4096.
    // P0: (0.6783, 0.4887) - внешняя грань запястья
    // P1: (0.6707, 0.4075) - контрольная
    // P2: (0.6351, 0.3492) - внешняя грань локтя

    // Вычисляем координаты P0 и P2 динамически, исходя из наших суставов.
    // Для правой руки внешняя грань запястья (справа от центра) — это wristRightCx + wristRadius
    const rightP0 = { x: wristRightCx + wristRadius, y: wristRightCy };
    const rightP2 = { x: elbowRightCx + elbowRadius, y: elbowRightCy };
    
    // Контрольная точка P1: берем твою пропорцию смещения.
    // В твоих координатах P1 смещена от линии P0-P2 вправо.
    // Вычислим вектор P0->P2 и отложим от середины смещение.
    const midX = (rightP0.x + rightP2.x) / 2;
    const midY = (rightP0.y + rightP2.y) / 2;
    
    // Вектор от P0 к P2
    const dx = rightP2.x - rightP0.x;
    const dy = rightP2.y - rightP0.y;
    
    // Нормаль (перпендикуляр) к вектору
    const len = Math.sqrt(dx*dx + dy*dy);
    const nx = -dy / len;
    const ny = dx / len;
    
    // Смещение (коэффициент). Подбираем так, чтобы было похоже на твой референс.
    // У тебя P1 смещена примерно на 0.04 от прямой (в долях холста).
    // В пикселях это ~160px. При длине предплечья ~800px, коэффициент ~0.2.
    const curveOffset = len * 0.15 * params.forearmCurvature;
    
    const rightP1 = {
      x: midX + nx * curveOffset,
      y: midY + ny * curveOffset
    };

    // Рисуем правую внешнюю линию
    drawForearmContour(armR, rightP0, rightP1, rightP2);

    // Левая рука (симметрично, но нормаль направлена в другую сторону)
    const leftP0 = { x: wristLeftCx - wristRadius, y: wristLeftCy };
    const leftP2 = { x: elbowLeftCx - elbowRadius, y: elbowLeftCy };
    
    const midLeftX = (leftP0.x + leftP2.x) / 2;
    const midLeftY = (leftP0.y + leftP2.y) / 2;
    
    const dxL = leftP2.x - leftP0.x;
    const dyL = leftP2.y - leftP0.y;
    const lenL = Math.sqrt(dxL*dxL + dyL*dyL);
    const nxL = -dyL / lenL;
    const nyL = dxL / lenL;
    
    const leftP1 = {
      x: midLeftX + nxL * (lenL * 0.15 * params.forearmCurvature),
      y: midLeftY + nyL * (lenL * 0.15 * params.forearmCurvature)
    };

    drawForearmContour(armL, leftP0, leftP1, leftP2);

    // === МАРКЕРЫ ===
    const mR = headH * 0.012;
    const markers = [
      { x: leftCx, y: leftCy, c: '#2563eb' },
      { x: rightCx, y: rightCy, c: '#2563eb' },
      { x: elbowLeftCx, y: elbowLeftCy, c: '#f59e0b' },
      { x: elbowRightCx, y: elbowRightCy, c: '#f59e0b' },
      { x: wristLeftCx, y: wristLeftCy, c: '#16a34a' },
      { x: wristRightCx, y: wristRightCy, c: '#16a34a' },
    ];
    for (const pt of markers) {
      grid.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: mR, fill: pt.c, opacity: 0.85 }));
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
