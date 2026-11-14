/* js/torso.js — Этап 3: грудная клетка и таз */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Грудная клетка (яйцо)
    chestTopWidth: 1.0,    // Расширение/сужение верха
    chestBottomWidth: 1.0, // Расширение/сужение низа
    chestHeight: 1.0,      // Высота
    chestWidth: 1.0,       // Ширина

    // Таз (прямоугольник)
    pelvisWidthAdj: 1.0,   // Корректировка ширины
    pelvisHeightAdj: 1.0,  // Корректировка высоты
    pelvisRadius: 0.2,     // Скругление углов (в долях от меньшей стороны)
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

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;
    const topY = geo.topY + headH; // Торс начинается со второй головы
    const bottomY = topY + headH;

    // --- 1. Грудная клетка (эллипс) ---
    // Базовые размеры в долях headH
    let chestH = headH * 0.9 * params.chestHeight;
    let chestW = headH * 0.7 * params.chestWidth;
    
    // Центр яйца
    let chestCy = topY + chestH / 2 + (headH - chestH) * 0.2; // Чуть выше центра секции
    let chestRx = chestW / 2;
    let chestRy = chestH / 2;

    // Коэффициенты ширины верха и низа
    const topW = params.chestTopWidth;
    const botW = params.chestBottomWidth;

    // Рисуем яйцо через path
    // Верхняя точка
    const pTop = { x: cx, y: chestCy - chestRy };
    // Нижняя точка
    const pBot = { x: cx, y: chestCy + chestRy };
    // Крайние точки (уровень центра)
    const pRight = { x: cx + chestRx, y: chestCy };
    const pLeft = { x: cx - chestRx, y: chestCy };

    // Контрольные точки для Безье
    // Верхняя половина
    const cpTopRight = { x: cx + chestRx * topW, y: chestCy - chestRy * 0.8 };
    const cpTopLeft  = { x: cx - chestRx * topW, y: chestCy - chestRy * 0.8 };
    // Нижняя половина
    const cpBotRight = { x: cx + chestRx * botW, y: chestCy + chestRy * 0.8 };
    const cpBotLeft  = { x: cx - chestRx * botW, y: chestCy + chestRy * 0.8 };

    const chestPath = `
      M ${pTop.x} ${pTop.y}
      C ${cpTopRight.x} ${cpTopRight.y}, ${pRight.x} ${pRight.y}, ${pRight.x} ${pRight.y}
      C ${cpBotRight.x} ${cpBotRight.y}, ${pBot.x} ${pBot.y}, ${pBot.x} ${pBot.y}
      C ${cpBotLeft.x} ${cpBotLeft.y}, ${pLeft.x} ${pLeft.y}, ${pLeft.x} ${pLeft.y}
      C ${cpTopLeft.x} ${cpTopLeft.y}, ${pTop.x} ${pTop.y}, ${pTop.x} ${pTop.y}
      Z
    `;

    // --- 2. Таз (прямоугольник) ---
    // По правилу: ширина = высоте эллипса, высота = ширине эллипса
    let pelvisW = chestH * params.pelvisWidthAdj;
    let pelvisH = chestW * params.pelvisHeightAdj;
    
    // Позиция: сразу под эллипсом, выравниваем по центру
    let pelvisY = chestCy + chestRy + (headH * 0.05); // небольшой отступ

    // Скругление (rx) не больше половины меньшей стороны
    const maxR = Math.min(pelvisW, pelvisH) / 2;
    let radius = params.pelvisRadius * maxR;

    return {
      headH, cx, topY, bottomY,
      chest: { path: chestPath, cx, cy: chestCy, rx: chestRx, ry: chestRy },
      pelvis: {
        x: cx - pelvisW / 2,
        y: pelvisY,
        w: pelvisW,
        h: pelvisH,
        rx: radius
      }
    };
  }

  function drawGrid(h, geo) {
    const { grid } = els;
    clear(grid);

    // Осевая линия (для ориентира)
    grid.appendChild(svgEl('line', {
      x1: h.cx, x2: h.cx,
      y1: h.topY, y2: h.bottomY,
      stroke: '#c0c4c9', 'stroke-width': 2,
      'stroke-dasharray': '8 12',
    }));
  }

  function drawTorso(h) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    // Грудная клетка (Path)
    torsoGroup.appendChild(svgEl('path', {
      d: h.chest.path,
      fill: 'none',
    }));

    // Таз (Rect)
    torsoGroup.appendChild(svgEl('rect', {
      x: h.pelvis.x,
      y: h.pelvis.y,
      width: h.pelvis.w,
      height: h.pelvis.h,
      rx: h.pelvis.rx,
      ry: h.pelvis.rx,
      fill: 'none',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    const h = computeTorso(geo);
    drawGrid(h, geo);
    drawTorso(h);
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
