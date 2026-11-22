/* js/leg.js — Этап 2: Внешнее и внутреннее бедро */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    kneeRadius: 0.09,
    ankleRadius: 0.06,

    // --- ВНЕШНЕЕ БЕДРО ---
    outerThighAttachAngle: 0, // Угол на тазе (сдвиг по Y)
    outerThighP1X: 0, outerThighP1Y: 0,
    outerThighKneeAngle: 0, // Угол на колене

    // --- ВНУТРЕННЕЕ БЕДРО ---
    innerThighAttachAngle: 0, // Угол на тазе (сдвиг по Y, 0 = центр дна таза)
    innerThighP1X: 0, innerThighP1Y: 0,
    innerThighP2X: 0, innerThighP2Y: 0,
    innerThighKneeAngle: 180, // Угол на колене (180 = внутренняя сторона)
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
    // Левое колено
    const leftKneeX = torso.cx - headH * 0.25;
    const leftKneeY = pelvis.y0 + pelvis.h + headH * 0.8; 
    
    // Правое колено
    const rightKneeX = torso.cx + headH * 0.25;
    const rightKneeY = leftKneeY;

    const kneeRadius = params.kneeRadius * headH;

    // === РИСУЕМ СУСТАВЫ (полупрозрачно) ===
    legL.appendChild(svgEl('circle', { cx: leftKneeX, cy: leftKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.2 }));
    legR.appendChild(svgEl('circle', { cx: rightKneeX, cy: rightKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.2 }));

    // ==========================================
    // ВНЕШНЕЕ БЕДРО (ЛЕВАЯ НОГА)
    // ==========================================
    // P0 на левом боку таза (сдвигаем по Y ползунком)
    const p0OuterThigh = { 
      x: pelvis.x0, 
      y: (pelvis.y0 + pelvis.h) + (params.outerThighAttachAngle / 100) * headH 
    };
    // Клип по тазу
    if (p0OuterThigh.y < pelvis.y0) p0OuterThigh.y = pelvis.y0;
    if (p0OuterThigh.y > pelvis.y0 + pelvis.h) p0OuterThigh.y = pelvis.y0 + pelvis.h;

    // P2 на внешней стороне колена
    const p2OuterThigh = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.outerThighKneeAngle, true);

    // P1
    const p1OuterThigh = {
      x: (p0OuterThigh.x + p2OuterThigh.x) / 2 + params.outerThighP1X * headH,
      y: (p0OuterThigh.y + p2OuterThigh.y) / 2 + params.outerThighP1Y * headH
    };

    legL.appendChild(svgEl('path', {
      d: `M ${p0OuterThigh.x} ${p0OuterThigh.y} Q ${p1OuterThigh.x} ${p1OuterThigh.y} ${p2OuterThigh.x} ${p2OuterThigh.y}`,
      fill: 'none'
    }));

    // ==========================================
    // ВНУТРЕННЕЕ БЕДРО (ЛЕВАЯ НОГА)
    // ==========================================
    // P0 крепится к внутреннему контуру колена (правая сторона колена)
    const p0InnerThigh = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.innerThighKneeAngle, true);

    // P3 крепится к дну таза (центр дна + сдвиг)
    const p3InnerThigh = { 
      x: pelvis.cx - headH * 0.05, // Чуть левее центра таза
      y: pelvis.y0 + pelvis.h + (params.innerThighAttachAngle / 100) * headH 
    };

    // P1 и P2 (смещения относительно третей пути)
    const iDx = p0InnerThigh.x - p3InnerThigh.x;
    const iDy = p0InnerThigh.y - p3InnerThigh.y;
    
    const p1InnerThigh = { 
      x: p3InnerThigh.x + iDx * 0.33 + params.innerThighP1X * headH, 
      y: p3InnerThigh.y + iDy * 0.33 + params.innerThighP1Y * headH 
    };
    const p2InnerThigh = { 
      x: p3InnerThigh.x + iDx * 0.66 + params.innerThighP2X * headH, 
      y: p3InnerThigh.y + iDy * 0.66 + params.innerThighP2Y * headH 
    };

    legL.appendChild(svgEl('path', {
      d: `M ${p3InnerThigh.x} ${p3InnerThigh.y} C ${p1InnerThigh.x} ${p1InnerThigh.y}, ${p2InnerThigh.x} ${p2InnerThigh.y}, ${p0InnerThigh.x} ${p0InnerThigh.y}`,
      fill: 'none'
    }));

    // ==========================================
    // ПРАВАЯ НОГА (ЗЕРКАЛЬНО)
    // ==========================================
    // Внешнее бедро
    const p0OuterThighR = { x: pelvis.x0 + pelvis.w, y: p0OuterThigh.y };
    const p2OuterThighR = getPointOnCircle(rightKneeX, rightKneeY, kneeRadius, params.outerThighKneeAngle, false);
    const p1OuterThighR = {
      x: (p0OuterThighR.x + p2OuterThighR.x) / 2 - params.outerThighP1X * headH,
      y: (p0OuterThighR.y + p2OuterThighR.y) / 2 + params.outerThighP1Y * headH
    };
    legR.appendChild(svgEl('path', {
      d: `M ${p0OuterThighR.x} ${p0OuterThighR.y} Q ${p1OuterThighR.x} ${p1OuterThighR.y} ${p2OuterThighR.x} ${p2OuterThighR.y}`,
      fill: 'none'
    }));

    // Внутреннее бедро
    const p0InnerThighR = getPointOnCircle(rightKneeX, rightKneeY, kneeRadius, params.innerThighKneeAngle, false);
    const p3InnerThighR = { 
      x: pelvis.cx + headH * 0.05, 
      y: p3InnerThigh.y 
    };
    const iDxR = p0InnerThighR.x - p3InnerThighR.x;
    const iDyR = p0InnerThighR.y - p3InnerThighR.y;
    
    const p1InnerThighR = { 
      x: p3InnerThighR.x + iDxR * 0.33 - params.innerThighP1X * headH, 
      y: p3InnerThighR.y + iDyR * 0.33 + params.innerThighP1Y * headH 
    };
    const p2InnerThighR = { 
      x: p3InnerThighR.x + iDxR * 0.66 - params.innerThighP2X * headH, 
      y: p3InnerThighR.y + iDyR * 0.66 + params.innerThighP2Y * headH 
    };
    legR.appendChild(svgEl('path', {
      d: `M ${p3InnerThighR.x} ${p3InnerThighR.y} C ${p1InnerThighR.x} ${p1InnerThighR.y}, ${p2InnerThighR.x} ${p2InnerThighR.y}, ${p0InnerThighR.x} ${p0InnerThighR.y}`,
      fill: 'none'
    }));

    // === МАРКЕРЫ ===
    const mR = headH * 0.012;
    const markers = [
      { x: leftKneeX, y: leftKneeY, c: '#f59e0b' },
      { x: rightKneeX, y: rightKneeY, c: '#f59e0b' },
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
