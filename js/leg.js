/* js/leg.js — Этап 2: Ноги (строго по точкам) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Радиусы суставов
    kneeRadius: 0.09,
    ankleRadius: 0.06,

    // Смещения суставов (для будущего)
    leftKneeX: 0, leftKneeY: 0,
    leftAnkleX: 0, leftAnkleY: 0,
    rightKneeX: 0, rightKneeY: 0,
    rightAnkleX: 0, rightAnkleY: 0,
  };

  // Координаты точек (нормализованные 0..1), которые ты дал на скриншотах
  // Для левой ноги
  const leftPoints = {
    // Внешнее бедро
    outerThigh: [
      { x: 0.4145, y: 0.4430 }, // P0
      { x: 0.3587, y: 0.5571 }, // P1
      { x: 0.4221, y: 0.6941 }  // P2
    ],
    // Внешняя икра
    outerCalf: [
      { x: 0.4221, y: 0.7093 }, // P0
      { x: 0.4069, y: 0.7879 }, // P1
      { x: 0.4601, y: 0.9224 }  // P2
    ],
    // Внутреннее бедро
    innerThigh: [
      { x: 0.4957, y: 0.7118 }, // P0
      { x: 0.4855, y: 0.6383 }, // P1
      { x: 0.4957, y: 0.5825 }, // P2
      { x: 0.4804, y: 0.5064 }  // P3
    ],
    // Внутренняя икра
    innerCalf: [
      { x: 0.4931, y: 0.9198 }, // P0
      { x: 0.4880, y: 0.8539 }, // P1
      { x: 0.4931, y: 0.7905 }, // P2
      { x: 0.4855, y: 0.7397 }  // P3
    ]
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });
  let els = null;

  function ensureDom() {
    if (els) return els;
    const legL = document.getElementById('legLeftGroup');
    const legR = document.getElementById('legRightGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!legL || !legR || !headsLayer) return null;

    let grid = document.getElementById('legGridLayer');
    if (!grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'legGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }
    els = { legL, legR, headsLayer, grid };
    return els;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  // Зеркалит точку по X для правой ноги
  function mirrorX(p) {
    return { x: 1 - p.x, y: p.y };
  }

  function drawPath(group, points, type) {
    if (points.length === 0) return;
    
    // Переводим нормализованные координаты в пиксели (холст 4096x4096)
    const pxPoints = points.map(p => ({ x: p.x * 4096, y: p.y * 4096 }));
    
    let d = `M ${pxPoints[0].x} ${pxPoints[0].y}`;
    
    if (type === 'Q' && pxPoints.length === 3) {
      // Квадратичная кривая для бедра/икры (3 точки)
      d += ` Q ${pxPoints[1].x} ${pxPoints[1].y} ${pxPoints[2].x} ${pxPoints[2].y}`;
    } else if (type === 'C' && pxPoints.length === 4) {
      // Кубическая кривая для внутренних контуров (4 точки)
      d += ` C ${pxPoints[1].x} ${pxPoints[1].y}, ${pxPoints[2].x} ${pxPoints[2].y}, ${pxPoints[3].x} ${pxPoints[3].y}`;
    }
    
    group.appendChild(svgEl('path', { d, fill: 'none' }));
  }

  function drawLegs(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    if (!torso) return;

    const { legL, legR, grid } = els;
    clear(legL);
    clear(legR);
    clear(grid);

    // === ЛЕВАЯ НОГА ===
    // Внешнее бедро (Q)
    drawPath(legL, leftPoints.outerThigh, 'Q');
    // Внешняя икра (Q)
    drawPath(legL, leftPoints.outerCalf, 'Q');
    // Внутреннее бедро (C)
    drawPath(legL, leftPoints.innerThigh, 'C');
    // Внутренняя икра (C)
    drawPath(legL, leftPoints.innerCalf, 'C');

    // === ПРАВАЯ НОГА (ЗЕРКАЛЬНО) ===
    const rightOuterThigh = leftPoints.outerThigh.map(mirrorX);
    const rightOuterCalf = leftPoints.outerCalf.map(mirrorX);
    const rightInnerThigh = leftPoints.innerThigh.map(mirrorX);
    const rightInnerCalf = leftPoints.innerCalf.map(mirrorX);

    drawPath(legR, rightOuterThigh, 'Q');
    drawPath(legR, rightOuterCalf, 'Q');
    drawPath(legR, rightInnerThigh, 'C');
    drawPath(legR, rightInnerCalf, 'C');

    // === СУСТАВЫ (РИСУЕМ ДЛЯ КОНТЕКСТА) ===
    // Координаты суставов берем из точек P2 бедра и P2 икры
    const headH = torso.headH;
    const kneeRadius = params.kneeRadius * headH;
    const ankleRadius = params.ankleRadius * headH;

    const leftKnee = { x: leftPoints.outerThigh[2].x * 4096, y: leftPoints.outerThigh[2].y * 4096 };
    const leftAnkle = { x: leftPoints.outerCalf[2].x * 4096, y: leftPoints.outerCalf[2].y * 4096 };
    
    const rightKnee = { x: rightOuterThigh[2].x * 4096, y: rightOuterThigh[2].y * 4096 };
    const rightAnkle = { x: rightOuterCalf[2].x * 4096, y: rightOuterCalf[2].y * 4096 };

    legL.appendChild(svgEl('circle', { cx: leftKnee.x, cy: leftKnee.y, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legL.appendChild(svgEl('circle', { cx: leftAnkle.x, cy: leftAnkle.y, r: ankleRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    
    legR.appendChild(svgEl('circle', { cx: rightKnee.x, cy: rightKnee.y, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legR.appendChild(svgEl('circle', { cx: rightAnkle.x, cy: rightAnkle.y, r: ankleRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    // === МАРКЕРЫ ===
    const mR = headH * 0.012;
    const markers = [
      { x: leftKnee.x, y: leftKnee.y, c: '#f59e0b' },
      { x: leftAnkle.x, y: leftAnkle.y, c: '#16a34a' },
      { x: rightKnee.x, y: rightKnee.y, c: '#f59e0b' },
      { x: rightAnkle.x, y: rightAnkle.y, c: '#16a34a' },
    ];
    for (const pt of markers) {
      grid.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: mR, fill: pt.c, opacity: 0.85 }));
    }
  }

  function update(geo) {
    if (!ensureDom()) return;
    drawLegs(geo);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  window.Leg = { update, getParams, setParams, resetParams, DEFAULT_PARAMS };
})();
