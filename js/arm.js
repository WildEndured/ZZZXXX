/* js/arm.js — Этап 2: Руки (по точкам референса) */

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

  // Вспомогательная функция для получения точки на окружности под углом
  function getPointOnCircle(cx, cy, r, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // Функция для соединения массива точек прямыми линиями
  function drawPolyline(parent, points, fill = 'none') {
    if (points.length < 2) return;
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    parent.appendChild(svgEl('path', { d, fill }));
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

    // === БАЗОВЫЕ ЦЕНТРЫ ===
    const baseShoulderRadius = (chestH / 3) / 2;
    const shoulderRadius = baseShoulderRadius * params.shoulderRadiusMul;

    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const tNorm = Math.min(t / 0.6, 1);
    const curveWidth = (chestRx * (torso.cpTopX / chestRx)) + (chestRx - (chestRx * (torso.cpTopX / chestRx))) * Math.sin(tNorm * Math.PI / 2);

    // Смещения рук целиком
    const leftOffsetX = params.leftX * headH;
    const leftOffsetY = params.leftY * headH;
    const rightOffsetX = params.rightX * headH;
    const rightOffsetY = params.rightY * headH;

    const leftCx = torso.cx - curveWidth - shoulderRadius + leftOffsetX;
    const rightCx = torso.cx + curveWidth + shoulderRadius + rightOffsetX;
    const leftCy = shoulderCy + leftOffsetY;
    const rightCy = shoulderCy + rightOffsetY;

    // Запястья
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

    // Локти
    const elbowRadius = params.elbowRadius * headH;
    const elbowLeftCx = (leftCx + wristLeftCx) / 2 + params.elbowLeftX * headH;
    const elbowLeftCy = (leftCy + wristLeftCy) / 2 + params.elbowLeftY * headH;
    const elbowRightCx = (rightCx + wristRightCx) / 2 + params.elbowRightX * headH;
    const elbowRightCy = (rightCy + wristRightCy) / 2 + params.elbowRightY * headH;

    // === ЛЕВАЯ РУКА: ТОЧКИ ===

    // UA1-UA3 (Внешняя сторона плеча, слева)
    // UA1 - верхняя точка плеча, UA3 - нижняя (у локтя)
    const UA1 = getPointOnCircle(leftCx, leftCy, shoulderRadius, -150); // верхне-лево
    const UA3 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, 180); // лево от локтя
    
    // UA2 - точка на 1/3 пути от UA1 к UA3 (выпуклость)
    const UA2 = {
        x: UA1.x + (UA3.x - UA1.x) * 0.33 - shoulderRadius * 0.2,
        y: UA1.y + (UA3.y - UA1.y) * 0.33
    };

    // UA4-UA5 (Внутренняя сторона плеча, справа)
    // UA4 - верхняя точка (внутренняя), UA5 - нижняя (у локтя)
    const UA4 = getPointOnCircle(leftCx, leftCy, shoulderRadius, -30);
    const UA5 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, 0);

    // FR1-FR4 (Внешняя сторона предплечья)
    // FR1 - внешний край запястья
    const FR1 = getPointOnCircle(wristLeftCx, wristLeftCy, wristRadius, 180);
    // FR4 - внешний край локтя
    const FR4 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, 180);
    
    // FR2 и FR3 делят отрезок FR1-FR4 на 3 равные части
    const FR2 = { x: FR1.x + (FR4.x - FR1.x) * 0.33, y: FR1.y + (FR4.y - FR1.y) * 0.33 };
    const FR3 = { x: FR1.x + (FR4.x - FR1.x) * 0.66, y: FR1.y + (FR4.y - FR1.y) * 0.66 };

    // FR5-FR8 (Внутренняя сторона предплечья)
    // FR5 - внутренний край запястья
    const FR5 = getPointOnCircle(wristLeftCx, wristLeftCy, wristRadius, 0);
    // FR8 - внутренний край локтя
    const FR8 = getPointOnCircle(elbowLeftCx, elbowLeftCy, elbowRadius, 0);

    // FR6 и FR7 делят отрезок FR5-FR8 на 3 равные части
    const FR6 = { x: FR5.x + (FR8.x - FR5.x) * 0.33, y: FR5.y + (FR8.y - FR5.y) * 0.33 };
    const FR7 = { x: FR5.x + (FR8.x - FR5.x) * 0.66, y: FR5.y + (FR8.y - FR5.y) * 0.66 };

    // === ОТРИСОВКА ЛЕВОЙ РУКИ ===
    // Плечо (верхняя часть) - линиями по точкам
    drawPolyline(armL, [UA1, UA2, UA3]);
    drawPolyline(armL, [UA4, UA5]);
    
    // Предплечье (нижняя часть) - по точкам
    // Внешняя линия
    drawPolyline(armL, [FR4, FR3, FR2, FR1]);
    // Внутренняя линия (вогнутая)
    drawPolyline(armL, [FR8, FR7, FR6, FR5]);

    // === ПРАВАЯ РУКА (симметрично) ===
    // Для правой руки зеркалим углы
    const UA1_R = getPointOnCircle(rightCx, rightCy, shoulderRadius, -30);
    const UA3_R = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, 0);
    const UA2_R = {
        x: UA1_R.x + (UA3_R.x - UA1_R.x) * 0.33 + shoulderRadius * 0.2,
        y: UA1_R.y + (UA3_R.y - UA1_R.y) * 0.33
    };
    const UA4_R = getPointOnCircle(rightCx, rightCy, shoulderRadius, -150);
    const UA5_R = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, 180);

    const FR1_R = getPointOnCircle(wristRightCx, wristRightCy, wristRadius, 0);
    const FR4_R = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, 0);
    const FR2_R = { x: FR1_R.x + (FR4_R.x - FR1_R.x) * 0.33, y: FR1_R.y + (FR4_R.y - FR1_R.y) * 0.33 };
    const FR3_R = { x: FR1_R.x + (FR4_R.x - FR1_R.x) * 0.66, y: FR1_R.y + (FR4_R.y - FR1_R.y) * 0.66 };

    const FR5_R = getPointOnCircle(wristRightCx, wristRightCy, wristRadius, 180);
    const FR8_R = getPointOnCircle(elbowRightCx, elbowRightCy, elbowRadius, 180);
    const FR6_R = { x: FR5_R.x + (FR8_R.x - FR5_R.x) * 0.33, y: FR5_R.y + (FR8_R.y - FR5_R.y) * 0.33 };
    const FR7_R = { x: FR5_R.x + (FR8_R.x - FR5_R.x) * 0.66, y: FR5_R.y + (FR8_R.y - FR5_R.y) * 0.66 };

    drawPolyline(armR, [UA1_R, UA2_R, UA3_R]);
    drawPolyline(armR, [UA4_R, UA5_R]);
    
    drawPolyline(armR, [FR4_R, FR3_R, FR2_R, FR1_R]);
    drawPolyline(armR, [FR8_R, FR7_R, FR6_R, FR5_R]);

    // === ОТРИСОВКА КРУГОВ И ТОЧЕК ДЛЯ ОТЛАДКИ ===
    const allPoints = [
        { p: UA1, label: 'UA1' }, { p: UA2, label: 'UA2' }, { p: UA3, label: 'UA3' },
        { p: UA4, label: 'UA4' }, { p: UA5, label: 'UA5' },
        { p: FR1, label: 'FR1' }, { p: FR2, label: 'FR2' }, { p: FR3, label: 'FR3' },
        { p: FR4, label: 'FR4' }, { p: FR5, label: 'FR5' }, { p: FR6, label: 'FR6' },
        { p: FR7, label: 'FR7' }, { p: FR8, label: 'FR8' }
    ];

    for (const item of allPoints) {
        grid.appendChild(svgEl('circle', {
            cx: item.p.x, cy: item.p.y, r: headH * 0.005, fill: 'red'
        }));
        const text = svgEl('text', {
            x: item.p.x + headH * 0.01, y: item.p.y - headH * 0.01,
            'font-size': 20, 'font-family': 'sans-serif', fill: 'blue'
        });
        text.textContent = item.label;
        grid.appendChild(text);
    }

    // Контуры кругов для наглядности
    armL.appendChild(svgEl('circle', { cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none' }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none' }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none' }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none' }));
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
