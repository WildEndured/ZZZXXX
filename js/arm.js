/* js/arm.js — Этап 2: Редактор кривой Безье для рук */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
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

  // Точки Безье (для отладки контура)
  // По умолчанию ставим их в виде прямой линии, чтобы было от чего отталкиваться
  const bezierPoints = [
    { x: 0.1, y: 0.2, label: 'P0', color: '#dc2626' }, // Например, от плеча
    { x: 0.3, y: 0.1, label: 'P1', color: '#f59e0b' }, // Контрольная 1
    { x: 0.6, y: 0.4, label: 'P2', color: '#f59e0b' }, // Контрольная 2
    { x: 0.8, y: 0.5, label: 'P3', color: '#16a34a' }  // К запястью
  ];

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

  // Функция для отрисовки кривой Безье по 4 точкам
  function drawBezierPath(group, p0, p1, p2, p3, color = '#000') {
    const d = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
    group.appendChild(svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 3 }));
    
    // Рисуем опорные точки для наглядности
    for (const p of [p0, p1, p2, p3]) {
      group.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 10, fill: 'white', stroke: p.color, 'stroke-width': 2 }));
    }
    
    // Рисуем линии от P0 к P1 и от P2 к P3 (усики)
    group.appendChild(svgEl('line', { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, stroke: '#ccc', 'stroke-dasharray': '5,5' }));
    group.appendChild(svgEl('line', { x1: p3.x, y1: p3.y, x2: p2.x, y2: p2.y, stroke: '#ccc', 'stroke-dasharray': '5,5' }));
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

    // --- Базовые центры суставов (для справки) ---
    const baseShoulderRadius = (chestH / 3) / 2;
    const shoulderRadius = baseShoulderRadius * params.shoulderRadiusMul;

    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftCx = torso.cx - curveWidth - shoulderRadius;
    const rightCx = torso.cx + curveWidth + shoulderRadius;
    const leftCy = shoulderCy;
    const rightCy = shoulderCy;

    const pelvisBottomY = torso.pelvisY0 + torso.pelvisH;
    const wristRadius = params.wristRadius * headH;
    const wristLeftCy = pelvisBottomY - wristRadius;
    const wristLeftCx = torso.cx - chestRx - shoulderRadius * 1.5;
    const wristRightCy = pelvisBottomY - wristRadius;
    const wristRightCx = torso.cx + chestRx + shoulderRadius * 1.5;

    const elbowRadius = params.elbowRadius * headH;
    const elbowLeftCx = (leftCx + wristLeftCx) / 2;
    const elbowLeftCy = (leftCy + wristLeftCy) / 2;
    const elbowRightCx = (rightCx + wristRightCx) / 2;
    const elbowRightCy = (rightCy + wristRightCy) / 2;

    // Рисуем суставы (полупрозрачные)
    armL.appendChild(svgEl('circle', { cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none', 'stroke-opacity': 0.2 }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none', 'stroke-opacity': 0.2 }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none', 'stroke-opacity': 0.2 }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none', 'stroke-opacity': 0.2 }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none', 'stroke-opacity': 0.2 }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none', 'stroke-opacity': 0.2 }));

    // --- РИСУЕМ КРИВУЮ БЕЗЬЕ ---
    // Используем нормализованные координаты (0..1) и переводим в пиксели относительно холста
    const canvasW = geo.canvas;
    const canvasH = geo.canvas;

    const pixels = bezierPoints.map(p => ({
      x: p.x * canvasW,
      y: p.y * canvasH,
      label: p.label,
      color: p.color
    }));

    drawBezierPath(armL, pixels[0], pixels[1], pixels[2], pixels[3], '#dc2626');

    // Выводим в консоль информацию о точках в формате, готовом для копирования
    console.log('=== ХАРАКТЕРИСТИКИ КРИВОЙ ===');
    pixels.forEach((p, i) => {
      console.log(`${p.label}: x=${(p.x / canvasW).toFixed(3)}, y=${(p.y / canvasH).toFixed(3)} (px: ${p.x.toFixed(0)}, ${p.y.toFixed(0)})`);
    });
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

  window.Arm = { update, getParams, setParams, resetParams, DEFAULT_PARAMS, bezierPoints };
})();
