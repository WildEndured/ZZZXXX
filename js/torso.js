/* js/torso.js — Этап 2: Шея + Грудная клетка + Таз */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    neckWidth: 0.20,      // Ширина шеи
    chestWidth: 0.7,
    chestHeightCorr: -0.15,
    topNarrow: 0.6,
    bottomWide: 0.8,
    pelvisWidthCorr: 0,
    pelvisHeightCorr: 0,
    pelvisRounding: 0.6,
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

  // Функция для проверки, находится ли X внутри контура груди на высоте Y
  function isInsideChest(x, y, h) {
    if (y < h.chestY0 || y > h.chestY0 + h.chestHeightPx) return false;
    
    const t = (y - h.chestY0) / h.chestHeightPx; // 0..1
    const x0 = h.cx;
    let halfWidth;

    // Аппроксимация ширины груди на высоте t (упрощенная для коллизии)
    if (t <= 0.6) {
      // Верхняя часть (от 0 до 0.6) — от cpTopX до rx
      const tNorm = t / 0.6;
      halfWidth = (h.cpTopX) + (h.chestRx - h.cpTopX) * Math.sin(tNorm * Math.PI / 2);
    } else {
      // Нижняя часть (от 0.6 до 1) — от rx до cpBottomX
      const tNorm = (t - 0.6) / 0.4;
      halfWidth = h.chestRx - (h.chestRx - h.cpBottomX) * Math.sin(tNorm * Math.PI / 2);
    }

    return Math.abs(x - x0) <= halfWidth;
  }

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;

    // --- Грудная клетка ---
    const chestHeightPx = headH * (1 + params.chestHeightCorr);
    const chestY0 = geo.topY + headH;
    
    const chestRx = (headH * params.chestWidth) / 2; 
    const cpTopX = chestRx * params.topNarrow;
    const cpBottomX = chestRx * params.bottomWide;

    // --- Таз ---
    const pelvisH = (chestRx * 2) * (1 + params.pelvisHeightCorr);
    const pelvisW = chestHeightPx * (1 + params.pelvisWidthCorr);
    
    const chestYBot = chestY0 + chestHeightPx;
    const pelvisY0 = chestYBot;
    const pelvisX0 = cx - pelvisW / 2;
    
    const rad = Math.min(pelvisW, pelvisH) / 2 * params.pelvisRounding;

    return { headH, cx, chestY0, chestHeightPx, chestRx, cpTopX, cpBottomX,
             pelvisW, pelvisH, pelvisY0, pelvisX0, rad };
  }

  function drawGrid(h, geo) {
    const { grid } = els;
    clear(grid);

    const lineX1 = h.cx - h.headH * 0.75;
    const lineX2 = h.cx + h.headH * 0.75;

    const lines = [
      { y: h.chestY0, label: 'T0' },
      { y: h.chestY0 + h.chestHeightPx / 2, label: 'T1' },
      { y: h.chestY0 + h.chestHeightPx, label: 'T2' },
      { y: h.pelvisY0 + h.pelvisH, label: 'T3' },
    ];

    for (const { y, label } of lines) {
      grid.appendChild(svgEl('line', {
        x1: lineX1, x2: lineX2, y1: y, y2: y,
        stroke: '#9aa0a6', 'stroke-width': 2,
        'stroke-dasharray': '16 12',
      }));
      const t = svgEl('text', {
        x: lineX1 - 12, y: y + 8,
        'text-anchor': 'end',
        'font-size': 28,
        'font-family': 'system-ui, sans-serif',
        fill: '#9aa0a6',
      });
      t.textContent = label;
      grid.appendChild(t);
    }
  }

  function drawTorso(h, geo) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    // --- 1. Шея ---
    // Получаем L4 из глобального состояния головы
    const headGeo = window.Head && window.Head.lastGeometry;
    const neckTopY = headGeo ? headGeo.l4 : h.chestY0; // Если головы нет, падаем на T0
    
    // Ищем, куда упрется шея
    const neckHalfW = (h.headH * params.neckWidth) / 2;
    let neckBottomY = h.chestY0; // По умолчанию до T0
    let foundCollision = false;

    for (let y = neckTopY; y < h.chestY0 + h.chestHeightPx; y += h.headH * 0.01) {
      if (isInsideChest(h.cx - neckHalfW, y, h) || isInsideChest(h.cx + neckHalfW, y, h)) {
        neckBottomY = y;
        foundCollision = true;
        break;
      }
    }
    
    // Если не нашли грудь (например, она сильно сужена), заканчиваем на T1
    if (!foundCollision) {
        neckBottomY = h.chestY0 + h.chestHeightPx * 0.2;
    }

    // Рисуем две линии шеи
    if (neckBottomY > neckTopY) {
      // Левая линия
      torsoGroup.appendChild(svgEl('line', {
        x1: h.cx - neckHalfW, y1: neckTopY,
        x2: h.cx - neckHalfW, y2: neckBottomY,
        fill: 'none',
      }));
      // Правая линия
      torsoGroup.appendChild(svgEl('line', {
        x1: h.cx + neckHalfW, y1: neckTopY,
        x2: h.cx + neckHalfW, y2: neckBottomY,
        fill: 'none',
      }));
    }

    // --- 2. Грудная клетка (Безье) ---
    const x0 = h.cx;
    const y0 = h.chestY0;
    const yMid = y0 + h.chestHeightPx * 0.6;
    const yBot = y0 + h.chestHeightPx;
    const rx = h.chestRx;
    const cpTopX = h.cpTopX;
    const cpBottomX = h.cpBottomX;

    const dChest = `
      M ${x0} ${y0}
      C ${x0 + cpTopX} ${y0}, ${x0 + rx} ${y0 + h.chestHeightPx * 0.3}, ${x0 + rx} ${yMid}
      C ${x0 + rx} ${yBot - h.chestHeightPx * 0.1}, ${x0 + cpBottomX} ${yBot}, ${x0} ${yBot}
      C ${x0 - cpBottomX} ${yBot}, ${x0 - rx} ${yBot - h.chestHeightPx * 0.1}, ${x0 - rx} ${yMid}
      C ${x0 - rx} ${y0 + h.chestHeightPx * 0.3}, ${x0 - cpTopX} ${y0}, ${x0} ${y0}
      Z
    `;

    torsoGroup.appendChild(svgEl('path', {
      d: dChest.replace(/\s+/g, ' ').trim(),
      fill: 'none',
    }));

    // --- 3. Таз (Прямоугольник) ---
    torsoGroup.appendChild(svgEl('rect', {
      x: h.pelvisX0,
      y: h.pelvisY0,
      width: h.pelvisW,
      height: h.pelvisH,
      rx: h.rad,
      ry: h.rad,
      fill: 'none',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    const h = computeTorso(geo);
    drawGrid(h, geo);
    drawTorso(h, geo);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  window.Torso = { update, getParams, setParams, resetParams, DEFAULT_PARAMS };
})();
