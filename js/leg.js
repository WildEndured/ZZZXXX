/* js/leg.js — Этап 2: Внешнее бедро (с нуля) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Радиус колена (для визуализации)
    kneeRadius: 0.09,
    // Радиус лодыжки (пока не используется, но пусть будет)
    ankleRadius: 0.06,

    // --- ВНЕШНЕЕ БЕДРО ---
    // Угол крепления к тазу (0° = бок, отрицательные = вниз)
    outerThighAttachAngle: 0,
    // Смещение P1
    outerThighP1X: 0, outerThighP1Y: 0,
    // Угол крепления к колену
    outerThighKneeAngle: 0,
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

  // Точка на окружности
  function getPointOnCircle(cx, cy, r, angleDeg, isLeftSide) {
    const rad = (angleDeg * Math.PI) / 180;
    const sign = isLeftSide ? -1 : 1;
    return {
      x: cx + sign * r * Math.cos(rad),
      y: cy - r * Math.sin(rad)
    };
  }

  function drawLegs(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    if (!torso) return;

    const { legL, legR, grid } = els;
    clear(legL);
    clear(legR);
    clear(grid);

    const headH = torso.headH;
    const pelvis = {
      x0: torso.pelvisX0,
      y0: torso.pelvisY0,
      w: torso.pelvisW,
      h: torso.pelvisH,
      cx: torso.cx
    };

    // === ПОЗИЦИИ СУСТАВОВ ===
    // Левое колено (пока примерное положение, позже добавим ползунки)
    const leftKneeX = torso.cx - headH * 0.25;
    const leftKneeY = pelvis.y0 + pelvis.h + headH * 0.8; 
    
    // Правое колено
    const rightKneeX = torso.cx + headH * 0.25;
    const rightKneeY = leftKneeY;

    const kneeRadius = params.kneeRadius * headH;

    // === РИСУЕМ СУСТАВЫ (полупрозрачно, для контекста) ===
    legL.appendChild(svgEl('circle', { cx: leftKneeX, cy: leftKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.2 }));
    legR.appendChild(svgEl('circle', { cx: rightKneeX, cy: rightKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.2 }));

    // ==========================================
    // ВНЕШНЕЕ БЕДРО (ЛЕВАЯ НОГА)
    // ==========================================
    // P0: на левом боку таза
    // Берем точку на левой границе таза. 
    // Чтобы она "плавала" по дуге, используем угол (0° - центр бока, 90° - верх, -90° - низ)
    // Но так как таз - это скругленный прямоугольник, мы просто сдвигаем Y от нижнего левого угла.
    
    // Центр левого скругления таза:
    const pelvisLeftArcCx = pelvis.x0 + (torso.rad || 0); 
    const pelvisLeftArcCy = pelvis.y0 + pelvis.h - (torso.rad || 0); // Нижнее скругление
    const pelvisRadius = torso.rad || 0;

    // P0: Угол 180° = левый бок. 
    // Но нам нужен низ таза. Поэтому угол будет где-то 225° (низ-лево) или мы просто берем точку на нижней границе.
    // Для простоты: берем левый нижний угол таза и сдвигаем по Y ползунком.
    const p0OuterThigh = { 
      x: pelvis.x0, 
      y: pelvis.y0 + pelvis.h - (torso.rad || 0) + (params.outerThighAttachAngle / 100) * headH 
    };
    // Ограничим, чтобы не вылезал за таз
    if (p0OuterThigh.y < pelvis.y0) p0OuterThigh.y = pelvis.y0;
    if (p0OuterThigh.y > pelvis.y0 + pelvis.h) p0OuterThigh.y = pelvis.y0 + pelvis.h;

    // P2: на внешней стороне колена
    const p2OuterThigh = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.outerThighKneeAngle, true);

    // P1: посередине + смещение
    const p1OuterThigh = {
      x: (p0OuterThigh.x + p2OuterThigh.x) / 2 + params.outerThighP1X * headH,
      y: (p0OuterThigh.y + p2OuterThigh.y) / 2 + params.outerThighP1Y * headH
    };

    // Рисуем кривую
    legL.appendChild(svgEl('path', {
      d: `M ${p0OuterThigh.x} ${p0OuterThigh.y} Q ${p1OuterThigh.x} ${p1OuterThigh.y} ${p2OuterThigh.x} ${p2OuterThigh.y}`,
      fill: 'none'
    }));

    // === ПРАВАЯ НОГА (ЗЕРКАЛЬНО) ===
    const p0OuterThighR = { 
      x: pelvis.x0 + pelvis.w, 
      y: p0OuterThigh.y 
    };
    const p2OuterThighR = getPointOnCircle(rightKneeX, rightKneeY, kneeRadius, params.outerThighKneeAngle, false);
    const p1OuterThighR = {
      x: (p0OuterThighR.x + p2OuterThighR.x) / 2 - params.outerThighP1X * headH, // Зеркально
      y: (p0OuterThighR.y + p2OuterThighR.y) / 2 + params.outerThighP1Y * headH
    };

    legR.appendChild(svgEl('path', {
      d: `M ${p0OuterThighR.x} ${p0OuterThighR.y} Q ${p1OuterThighR.x} ${p1OuterThighR.y} ${p2OuterThighR.x} ${p2OuterThighR.y}`,
      fill: 'none'
    }));

    // === МАРКЕРЫ ===
    const mR = headH * 0.012;
    const markers = [
      { x: leftKneeX, y: leftKneeY, c: '#f59e0b' },
      { x: rightKneeX, y: rightKneeY, c: '#f59e0b' },
      // Маркеры P0, P1, P2 для левой ноги
      { x: p0OuterThigh.x, y: p0OuterThigh.y, c: '#dc2626' }, // P0
      { x: p1OuterThigh.x, y: p1OuterThigh.y, c: '#2563eb' }, // P1
      { x: p2OuterThigh.x, y: p2OuterThigh.y, c: '#16a34a' }, // P2
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
