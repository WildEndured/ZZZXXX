/* js/torso.js — Этап 2: Плавающая шея (касание челюсти и груди) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    neckWidth: 0.20,
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

  // --- МАТЕМАТИКА ГРУДИ ---
  function getChestHalfWidthAtY(y, h) {
    const t = (y - h.chestY0) / h.chestHeightPx;
    if (t < 0 || t > 1) return 0;
    if (t <= 0.6) {
      const tNorm = t / 0.6;
      return h.cpTopX + (h.chestRx - h.cpTopX) * Math.sin(tNorm * Math.PI / 2);
    } else {
      const tNorm = (t - 0.6) / 0.4;
      return h.chestRx - (h.chestRx - h.cpBottomX) * Math.sin(tNorm * Math.PI / 2);
    }
  }

  // --- МАТЕМАТИКА ЧЕЛЮСТИ ---
  // Возвращает X-координату челюсти на заданной высоте Y (для правой стороны).
  // Челюсть — это ломаная: attach -> angle -> chin.
  function getJawXAtY(y, headGeo) {
    if (!headGeo) return headGeo.cx;
    
    const { jaw, cx, l4 } = headGeo;
    const right = jaw.attachRight;
    const angle = jaw.angleRight;
    const chin = jaw.chinRight;

    // 1. Если Y выше точки крепления — возвращаем точку крепления
    if (y <= right.y) return right.x;

    // 2. Если Y между точкой крепления и углом — интерполируем наклонную линию
    if (y <= angle.y) {
      const t = (y - right.y) / (angle.y - right.y);
      return right.x + (angle.x - right.x) * t;
    }

    // 3. Если Y между углом и подбородком — интерполируем вторую линию
    if (y <= chin.y) {
      const t = (y - angle.y) / (chin.y - angle.y);
      return angle.x + (chin.x - angle.x) * t;
    }

    // 4. Если Y ниже подбородка — возвращаем край подбородка
    return chin.x;
  }

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;

    const chestHeightPx = headH * (1 + params.chestHeightCorr);
    const chestY0 = geo.topY + headH;
    
    const chestRx = (headH * params.chestWidth) / 2; 
    const cpTopX = chestRx * params.topNarrow;
    const cpBottomX = chestRx * params.bottomWide;

    const pelvisH = (chestRx * 2) * (1 + params.pelvisHeightCorr);
    const pelvisW = chestHeightPx * (1 + params.pelvisWidthCorr);
    
    const chestYBot = chestY0 + chestHeightPx;
    const pelvisY0 = chestYBot;
    const pelvisX0 = cx - pelvisW / 2;
    
    const rad = Math.min(pelvisW, pelvisH) / 2 * params.pelvisRounding;

    return { headH, cx, chestY0, chestHeightPx, chestRx, cpTopX, cpBottomX,
             pelvisW, pelvisH, pelvisY0, pelvisX0, rad };
  }

  function drawGrid(h) {
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

  function drawTorso(h) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    // --- 1. Шея ---
    const headGeo = window.Head && window.Head.lastGeometry;
    const neckHalfW = (h.headH * params.neckWidth) / 2;

    // ВЕРХ: Ищем самую верхнюю точку, где X челюсти равен ширине шеи.
    // Проходимся сверху вниз по челюсти, пока не найдем точку, где ширина челюсти >= ширины шеи.
    let neckTopY = h.chestY0; 
    if (headGeo) {
      const startY = headGeo.l0;
      const endY = headGeo.l4;
      const step = h.headH * 0.005;
      
      for (let y = startY; y <= endY; y += step) {
        const jawX = getJawXAtY(y, headGeo);
        if (jawX >= neckHalfW) { // Нашли точку на челюсти, где она достаточно широкая
          neckTopY = y;
          break;
        }
      }
    }

    // НИЗ: Ищем точку, где ширина груди >= ширины шеи.
    let neckBottomY = h.chestY0 + h.chestHeightPx; // Fallback
    const step = h.headH * 0.005;
    for (let y = h.chestY0; y <= h.chestY0 + h.chestHeightPx; y += step) {
      const chestHalfW = getChestHalfWidthAtY(y, h);
      if (chestHalfW >= neckHalfW) {
        neckBottomY = y;
        break;
      }
    }

    // Рисуем шею, только если нашли валидные точки
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
    drawGrid(h);
    drawTorso(h);
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
