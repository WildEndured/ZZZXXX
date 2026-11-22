/* js/leg.js — Этап 2: Ноги (гарантированная отрисовка) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    kneeRadius: 0.09,
    ankleRadius: 0.06,
    outerThighAttachAngle: 0,
    outerThighP1X: 0, outerThighP1Y: 0,
    outerThighKneeAngle: 0,
    innerThighAttachAngle: 0,
    innerThighP1X: 0, innerThighP1Y: 0,
    innerThighP2X: 0, innerThighP2Y: 0,
    innerThighKneeAngle: 180,
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });
  let els = null;

  function ensureDom() {
    if (els) return els;
    const legL = document.getElementById('legLeftGroup');
    const legR = document.getElementById('legRightGroup');
    if (!legL || !legR) {
      console.error('[Leg] Не найдены группы legLeftGroup или legRightGroup');
      return null;
    }
    els = { legL, legR };
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
    if (!torso) {
      console.warn('[Leg] Нет данных о торсе');
      return;
    }

    const { legL, legR } = els;
    clear(legL);
    clear(legR);

    const headH = torso.headH;
    const cx = geo.centerX || 2048;
    
    // Берем таз из torso
    const pelvisX0 = torso.pelvisX0 || (cx - headH * 0.5);
    const pelvisY0 = torso.pelvisY0 || (geo.topY + headH * 2.5);
    const pelvisW = torso.pelvisW || headH;
    const pelvisH = torso.pelvisH || headH * 0.5;

    // Суставы (колени) - примерное положение
    const leftKneeX = cx - headH * 0.25;
    const leftKneeY = pelvisY0 + pelvisH + headH * 0.8;
    const rightKneeX = cx + headH * 0.25;
    const rightKneeY = leftKneeY;
    const kneeRadius = params.kneeRadius * headH;

    // Рисуем колени (полупрозрачно)
    legL.appendChild(svgEl('circle', { cx: leftKneeX, cy: leftKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legR.appendChild(svgEl('circle', { cx: rightKneeX, cy: rightKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    // ==========================================
    // ЛЕВАЯ НОГА
    // ==========================================
    // Внешнее бедро
    const p0OuterThigh = { 
      x: pelvisX0, 
      y: (pelvisY0 + pelvisH) + (params.outerThighAttachAngle / 100) * headH 
    };
    const p2OuterThigh = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.outerThighKneeAngle, true);
    const p1OuterThigh = {
      x: (p0OuterThigh.x + p2OuterThigh.x) / 2 + params.outerThighP1X * headH,
      y: (p0OuterThigh.y + p2OuterThigh.y) / 2 + params.outerThighP1Y * headH
    };

    legL.appendChild(svgEl('path', {
      d: `M ${p0OuterThigh.x} ${p0OuterThigh.y} Q ${p1OuterThigh.x} ${p1OuterThigh.y} ${p2OuterThigh.x} ${p2OuterThigh.y}`,
      fill: 'none'
    }));

    // Внутреннее бедро
    const p0InnerThigh = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.innerThighKneeAngle, true);
    const p3InnerThigh = { 
      x: cx - headH * 0.05, 
      y: (pelvisY0 + pelvisH) + (params.innerThighAttachAngle / 100) * headH 
    };

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
    const p0OuterThighR = { x: pelvisX0 + pelvisW, y: p0OuterThigh.y };
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
      x: cx + headH * 0.05, 
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
