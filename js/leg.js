/* js/leg.js — Этап 2: Суставы + внешнее бедро + внешняя икра */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Радиусы
    kneeRadius: 0.09,
    ankleRadius: 0.06,

    // Смещения суставов
    leftKneeX: 0, leftKneeY: 0,
    leftAnkleX: 0, leftAnkleY: 0,
    rightKneeX: 0, rightKneeY: 0,
    rightAnkleX: 0, rightAnkleY: 0,

    // --- ВНЕШНЕЕ БЕДРО ---
    outerThighAttachAngle: 0,
    outerThighP1X: 0, outerThighP1Y: 0,
    outerThighKneeAngle: 0,

    // --- ВНЕШНЯЯ ИКРА ---
    outerCalfKneeAngle: 0,    // Угол на колене
    outerCalfP1X: 0, outerCalfP1Y: 0, // Смещение P1
    outerCalfAnkleAngle: 0,   // Угол на лодыжке
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
      cx: torso.cx,
      rad: torso.rad || 0
    };

    // === ПОЗИЦИИ СУСТАВОВ ===
    const leftKneeBaseX = torso.cx - headH * 0.25;
    const leftKneeBaseY = pelvis.y0 + pelvis.h + headH * 0.8; 
    const leftKneeX = leftKneeBaseX + params.leftKneeX * headH;
    const leftKneeY = leftKneeBaseY + params.leftKneeY * headH;

    const leftAnkleBaseX = leftKneeBaseX;
    const leftAnkleBaseY = leftKneeBaseY + headH * 1.2;
    const leftAnkleX = leftAnkleBaseX + params.leftAnkleX * headH;
    const leftAnkleY = leftAnkleBaseY + params.leftAnkleY * headH;

    const rightKneeX = torso.cx + headH * 0.25 + params.rightKneeX * headH;
    const rightKneeY = leftKneeBaseY + params.rightKneeY * headH;
    const rightAnkleX = torso.cx + headH * 0.25 + params.rightAnkleX * headH;
    const rightAnkleY = leftAnkleBaseY + params.rightAnkleY * headH;

    const kneeRadius = params.kneeRadius * headH;
    const ankleRadius = params.ankleRadius * headH;

    // === СУСТАВЫ ===
    legL.appendChild(svgEl('circle', { cx: leftKneeX, cy: leftKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legL.appendChild(svgEl('circle', { cx: leftAnkleX, cy: leftAnkleY, r: ankleRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legR.appendChild(svgEl('circle', { cx: rightKneeX, cy: rightKneeY, r: kneeRadius, fill: 'none', 'stroke-opacity': 0.3 }));
    legR.appendChild(svgEl('circle', { cx: rightAnkleX, cy: rightAnkleY, r: ankleRadius, fill: 'none', 'stroke-opacity': 0.3 }));

    // ==========================================
    // ВНЕШНЕЕ БЕДРО (ЛЕВАЯ)
    // ==========================================
    const p0OuterThigh = { 
      x: pelvis.x0, 
      y: pelvis.y0 + pelvis.h - pelvis.rad + (params.outerThighAttachAngle / 100) * headH 
    };
    if (p0OuterThigh.y < pelvis.y0) p0OuterThigh.y = pelvis.y0;
    if (p0OuterThigh.y > pelvis.y0 + pelvis.h) p0OuterThigh.y = pelvis.y0 + pelvis.h;

    const p2OuterThigh = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.outerThighKneeAngle, true);
    const p1OuterThigh = {
      x: (p0OuterThigh.x + p2OuterThigh.x) / 2 + params.outerThighP1X * headH,
      y: (p0OuterThigh.y + p2OuterThigh.y) / 2 + params.outerThighP1Y * headH
    };

    legL.appendChild(svgEl('path', {
      d: `M ${p0OuterThigh.x} ${p0OuterThigh.y} Q ${p1OuterThigh.x} ${p1OuterThigh.y} ${p2OuterThigh.x} ${p2OuterThigh.y}`,
      fill: 'none'
    }));

    // Внешнее бедро (ПРАВАЯ)
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

    // ==========================================
    // ВНЕШНЯЯ ИКРА (ЛЕВАЯ)
    // ==========================================
    const p0OuterCalf = getPointOnCircle(leftKneeX, leftKneeY, kneeRadius, params.outerCalfKneeAngle, true);
    const p2OuterCalf = getPointOnCircle(leftAnkleX, leftAnkleY, ankleRadius, params.outerCalfAnkleAngle, true);
    const p1OuterCalf = {
      x: (p0OuterCalf.x + p2OuterCalf.x) / 2 + params.outerCalfP1X * headH,
      y: (p0OuterCalf.y + p2OuterCalf.y) / 2 + params.outerCalfP1Y * headH
    };

    legL.appendChild(svgEl('path', {
      d: `M ${p0OuterCalf.x} ${p0OuterCalf.y} Q ${p1OuterCalf.x} ${p1OuterCalf.y} ${p2OuterCalf.x} ${p2OuterCalf.y}`,
      fill: 'none'
    }));

    // Внешняя икра (ПРАВАЯ)
    const p0OuterCalfR = getPointOnCircle(rightKneeX, rightKneeY, kneeRadius, params.outerCalfKneeAngle, false);
    const p2OuterCalfR = getPointOnCircle(rightAnkleX, rightAnkleY, ankleRadius, params.outerCalfAnkleAngle, false);
    const p1OuterCalfR = {
      x: (p0OuterCalfR.x + p2OuterCalfR.x) / 2 - params.outerCalfP1X * headH,
      y: (p0OuterCalfR.y + p2OuterCalfR.y) / 2 + params.outerCalfP1Y * headH
    };

    legR.appendChild(svgEl('path', {
      d: `M ${p0OuterCalfR.x} ${p0OuterCalfR.y} Q ${p1OuterCalfR.x} ${p1OuterCalfR.y} ${p2OuterCalfR.x} ${p2OuterCalfR.y}`,
      fill: 'none'
    }));

    // === МАРКЕРЫ ===
    const mR = headH * 0.012;
    const markers = [
      { x: leftKneeX, y: leftKneeY, c: '#f59e0b' },
      { x: leftAnkleX, y: leftAnkleY, c: '#16a34a' },
      { x: rightKneeX, y: rightKneeY, c: '#f59e0b' },
      { x: rightAnkleX, y: rightAnkleY, c: '#16a34a' },
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
