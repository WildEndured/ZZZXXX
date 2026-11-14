/* js/torso.js — Этап 2: грудная клетка + таз */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    chestHeightMul: 1.0,    // Высота
    chestWidthMul: 1.0,     // Ширина
    chestTopExpand: 0.0,    // Расширение/сужение верха (-0.5 ... 0.5)
    chestBottomExpand: 0.0, // Расширение/сужение низа (-0.5 ... 0.5)

    pelvisWidthMul: 1.0,    // Корректировка ширины
    pelvisHeightMul: 1.0,   // Корректировка высоты
    pelvisRadius: 0.2,      // Скругление углов (по умолчанию 20%, как на скетче)
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
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;
    const topY = geo.shoulderY; // Начало торса (шея)

    // 1. Грудная клетка
    // Высота = 1 голова
    const baseRy = headH * 0.5; 
    // Ширина меньше высоты, чтобы овал был вертикальным
    const baseRx = headH * 0.35; 

    const ry = baseRy * params.chestHeightMul;
    const rx = baseRx * params.chestWidthMul;

    const cy = topY + ry; 

    // Симметричное расширение/сужение (не дает эллипсу перекосить)
    const rxTop = Math.max(1, rx * (1 + params.chestTopExpand));
    const rxBottom = Math.max(1, rx * (1 + params.chestBottomExpand));

    // 2. Таз
    // Ширина = высоте эллипса, Высота = ширине эллипса (по ТЗ)
    // Плюс небольшой бонус по X, чтобы таз не был уже грудной клетки
    const pelvisWBase = ry * 2.4; 
    const pelvisHBase = rx * 2; 

    const pelvisW = pelvisWBase * params.pelvisWidthMul;
    const pelvisH = pelvisHBase * params.pelvisHeightMul;

    // Таз рисуется впритык к грудной клетке
    const pelvisY = cy + ry;
    const pelvisX = cx - pelvisW / 2;

    const maxRad = Math.min(pelvisW, pelvisH) / 2;
    const rectRad = maxRad * params.pelvisRadius;

    return {
      headH, cx, topY,
      chest: { cx, cy, rx, ry, rxTop, rxBottom },
      pelvis: { x: pelvisX, y: pelvisY, w: pelvisW, h: pelvisH, rad: rectRad }
    };
  }

  function drawGrid(t) {
    const { grid } = els;
    clear(grid);

    // Осевая
    grid.appendChild(svgEl('line', {
      x1: t.cx, x2: t.cx,
      y1: t.topY, y2: t.pelvis.y + t.pelvis.h,
      stroke: '#c0c4c9', 'stroke-width': 2,
      'stroke-dasharray': '8 12',
    }));

    // Габариты грудной клетки
    grid.appendChild(svgEl('rect', {
      x: t.chest.cx - t.chest.rx,
      y: t.chest.cy - t.chest.ry,
      width: t.chest.rx * 2,
      height: t.chest.ry * 2,
      fill: 'none',
      stroke: '#9aa0a6', 'stroke-width': 2,
      'stroke-dasharray': '16 12',
    }));

    // Габариты таза
    grid.appendChild(svgEl('rect', {
      x: t.pelvis.x,
      y: t.pelvis.y,
      width: t.pelvis.w,
      height: t.pelvis.h,
      fill: 'none',
      stroke: '#9aa0a6', 'stroke-width': 2,
      'stroke-dasharray': '16 12',
    }));
  }

  function drawTorso(t) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    const c = t.chest;
    // Рисуем грудную клетку. 
    // Чтобы верх и низ были независимы, используем контрольные точки.
    const d = `
      M ${c.cx},${c.cy - c.ry}
      C ${c.cx + c.rxTop * 0.552},${c.cy - c.ry} ${c.cx + c.rxTop},${c.cy - c.ry * 0.552} ${c.cx + c.rxTop},${c.cy}
      C ${c.cx + c.rxBottom},${c.cy + c.ry * 0.552} ${c.cx + c.rxBottom * 0.552},${c.cy + c.ry} ${c.cx},${c.cy + c.ry}
      C ${c.cx - c.rxBottom * 0.552},${c.cy + c.ry} ${c.cx - c.rxBottom},${c.cy + c.ry * 0.552} ${c.cx - c.rxBottom},${c.cy}
      C ${c.cx - c.rxTop},${c.cy - c.ry * 0.552} ${c.cx - c.rxTop * 0.552},${c.cy - c.ry} ${c.cx},${c.cy - c.ry}
    `.replace(/\s+/g, ' ').trim();

    torsoGroup.appendChild(svgEl('path', {
      d: d,
      fill: 'none',
    }));

    // Таз
    const p = t.pelvis;
    torsoGroup.appendChild(svgEl('rect', {
      x: p.x,
      y: p.y,
      width: p.w,
      height: p.h,
      rx: p.rad,
      ry: p.rad,
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
