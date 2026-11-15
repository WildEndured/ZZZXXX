/* js/torso.js — Этап 3: грудная клетка + таз */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Грудная клетка (эллипс L5..L10)
    chestWidthMul: 1.0,     // 0.5 … 1.5
    chestHeightMul: 1.0,    // 0.5 … 1.5
    chestTopTaper: 0.0,     // -0.5 … 0.5 — расширение/сужение верха
    chestBottomTaper: 0.0,  // -0.5 … 0.5 — расширение/сужение низа

    // Таз (прямоугольник)
    pelvisWidthMul: 1.0,    // 0.5 … 1.5
    pelvisHeightMul: 1.0,   // 0.5 … 1.5
    pelvisRadius: 0.0,      // 0 … 0.5 (доля от min(w,h)/2)
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });

  let els = null;

  function ensureDom() {
    if (els) return els;
    const torsoGroup = document.getElementById('torsoGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!torsoGroup || !headsLayer) return null;

    let grid = document.getElementById('torsoGridLayer');
    if (!grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'torsoGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }

    els = { torsoGroup, headsLayer, grid };
    return els;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) {
      for (const k in attrs) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /**
   * Строит path грудной клетки.
   * Четыре точки-«полюса»:
   *   top    — верх по центру
   *   bottom — низ по центру
   *   left   — левый «бок» (на уровне середины)
   *   right  — правый «бок»
   * Управляющие точки выносим по бокам, чтобы верх и низ
   * можно было независимо сужать/расширять.
   */
  function buildChestPath(cx, topY, bottomY, topHalfW, bottomHalfW) {
    const cy = (topY + bottomY) / 2;

    // Опорные точки
    const topPt    = { x: cx, y: topY };
    const bottomPt = { x: cx, y: bottomY };
    const rightPt  = { x: cx + topHalfW * 0.5 + bottomHalfW * 0.5, y: cy };
    const leftPt   = { x: cx - topHalfW * 0.5 - bottomHalfW * 0.5, y: cy };

    // Управляющие точки для правой половины
    const k = 0.5523; // константа для аппроксимации эллипса кубическими Безье
    const topRightCtrlY    = topY + (cy - topY) * k;
    const bottomRightCtrlY = bottomY - (bottomY - cy) * k;

    const topCtrlRightX    = cx + topHalfW * k;
    const topCtrlLeftX     = cx - topHalfW * k;
    const bottomCtrlRightX = cx + bottomHalfW * k;
    const bottomCtrlLeftX  = cx - bottomHalfW * k;

    const rightCtrlMidX = rightPt.x;
    const leftCtrlMidX  = leftPt.x;

    // Строим: сверху → вправо → вниз → влево → наверх
    return [
      `M ${topPt.x} ${topPt.y}`,
      // верх → правый бок
      `C ${topCtrlRightX} ${topY} ${rightCtrlMidX} ${topRightCtrlY} ${rightPt.x} ${rightPt.y}`,
      // правый бок → низ
      `C ${rightCtrlMidX} ${bottomRightCtrlY} ${bottomCtrlRightX} ${bottomY} ${bottomPt.x} ${bottomPt.y}`,
      // низ → левый бок
      `C ${bottomCtrlLeftX} ${bottomY} ${leftCtrlMidX} ${bottomRightCtrlY} ${leftPt.x} ${leftPt.y}`,
      // левый бок → верх
      `C ${leftCtrlMidX} ${topRightCtrlY} ${topCtrlLeftX} ${topY} ${topPt.x} ${topPt.y}`,
      'Z',
    ].join(' ');
  }

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;

    // --- Грудная клетка: L5 .. L10 ---
    const l5 = geo.topY + headH * 1.0;
    const l10Base = l5 + headH * 1.0;

    const chestHalfW = (headH * 0.5) * params.chestWidthMul;
    const chestHalfH = ((l10Base - l5) / 2) * params.chestHeightMul;
    const chestCy = (l5 + l10Base) / 2;
    const chestTopY = chestCy - chestHalfH;
    const chestBottomY = chestCy + chestHalfH;

    // Полуширины сверху и снизу (с учётом taper)
    // taper: + — расширяем, − — сужаем
    const topHalfW = chestHalfW * (1 + params.chestTopTaper);
    const bottomHalfW = chestHalfW * (1 + params.chestBottomTaper);

    // --- Таз ---
    // По правилу: ширина = высоте эллипса, высота = ширине эллипса.
    // Высота эллипса = 2 * chestHalfH, ширина эллипса = 2 * chestHalfW.
    const pelvisW = (chestHalfH * 2) * params.pelvisWidthMul;
    const pelvisH = (chestHalfW * 2) * params.pelvisHeightMul;
    const pelvisX = cx - pelvisW / 2;
    const pelvisY = chestBottomY;
    // Скругление: доля от половины меньшей стороны
    const rBase = Math.min(pelvisW, pelvisH) / 2;
    const radius = clamp(params.pelvisRadius, 0, 0.5) * rBase * 2;

    return {
      headH, cx,
      l5, l10: l10Base,
      chest: {
        topY: chestTopY,
        bottomY: chestBottomY,
        cy: chestCy,
        halfW: chestHalfW,
        halfH: chestHalfH,
        topHalfW,
        bottomHalfW,
      },
      pelvis: {
        x: pelvisX,
        y: pelvisY,
        w: pelvisW,
        h: pelvisH,
        radius,
      },
    };
  }

  function drawGrid(t) {
    const { grid } = els;
    clear(grid);

    const lineX1 = t.cx - t.headH * 0.9;
    const lineX2 = t.cx + t.headH * 0.9;

    const lines = [
      { y: t.l5, label: 'L5' },
      { y: t.l10, label: 'L10' },
    ];

    for (const { y, label } of lines) {
      grid.appendChild(svgEl('line', {
        x1: lineX1, x2: lineX2, y1: y, y2: y,
        stroke: '#9aa0a6', 'stroke-width': 2,
        'stroke-dasharray': '16 12',
      }));
      const tEl = svgEl('text', {
        x: lineX1 - 12, y: y + 8,
        'text-anchor': 'end',
        'font-size': 28,
        'font-family': 'system-ui, sans-serif',
        fill: '#9aa0a6',
      });
      tEl.textContent = label;
      grid.appendChild(tEl);
    }
  }

  function drawTorso(t) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    // Грудная клетка
    const chestD = buildChestPath(
      t.cx,
      t.chest.topY,
      t.chest.bottomY,
      t.chest.topHalfW,
      t.chest.bottomHalfW
    );
    torsoGroup.appendChild(svgEl('path', {
      d: chestD,
      fill: 'none',
    }));

    // Таз
    torsoGroup.appendChild(svgEl('rect', {
      x: t.pelvis.x,
      y: t.pelvis.y,
      width: t.pelvis.w,
      height: t.pelvis.h,
      rx: t.pelvis.radius,
      ry: t.pelvis.radius,
      fill: 'none',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    const t = computeTorso(geo);
    drawGrid(t);
    drawTorso(t);
  }

  function getParams() { return { ...params }; }

  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) {
        params[k] = patch[k];
      }
    }
  }

  function resetParams() {
    Object.assign(params, DEFAULT_PARAMS);
  }

  window.Torso = {
    update,
    getParams,
    setParams,
    resetParams,
    DEFAULT_PARAMS,
  };
})();
