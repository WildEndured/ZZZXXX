/* js/torso.js — Этап 2: Адаптивная шея (по контуру) */

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

  // Ширина (половина) контура груди на высоте y
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

  // Ширина (половина) челюсти на высоте y
  function getJawHalfWidthAtY(y, headGeo) {
    if (!headGeo) return 0;
    
    const jaw = headGeo.jaw;
    const ptAttach = jaw.attachRight;
    const ptAngle = jaw.angleRight;
    const ptChin = jaw.chinRight;
    
    if (y >= ptAttach.y && y <= ptAngle.y) {
      const t = (y - ptAttach.y) / (ptAngle.y - ptAttach.y);
      const x = ptAttach.x + (ptAngle.x - ptAttach.x) * t;
      return Math.abs(x - headGeo.cx);
    }
    
    if (y > ptAngle.y && y <= ptChin.y) {
      const t = (y - ptAngle.y) / (ptChin.y - ptAngle.y);
      const x = ptAngle.x + (ptChin.x - ptAngle.x) * t;
      return Math.abs(x - headGeo.cx);
    }
    
    if (y > ptChin.y) {
      return Math.abs(ptChin.x - headGeo.cx);
    }
    
    return 0;
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

    // --- 1. Адаптивная шея ---
    const headGeo = window.Head && window.Head.lastGeometry;
    const neckHalfW = (h.headH * params.neckWidth) / 2;
    const STROKE_W = 6; // Толщина обводки из figureLayer

    if (headGeo) {
      let neckTopY = headGeo.l4;
      let neckBottomY = h.chestY0 + h.chestHeightPx;

      // Ищем точку на челюсти
      for (let y = headGeo.l3; y <= headGeo.l4 + h.headH; y += 1) {
        if (getJawHalfWidthAtY(y, headGeo) >= neckHalfW) {
          neckTopY = y;
          break;
        }
      }

      // Ищем точку на груди
      for (let y = h.chestY0; y <= h.chestY0 + h.chestHeightPx; y += 1) {
        if (getChestHalfWidthAtY(y, h) >= neckHalfW) {
          neckBottomY = y;
          break;
        }
      }

      // Адаптируем длину с учетом толщины линии, чтобы она перекрывала контуры
      const offset = STROKE_W / 2;

      if (neckBottomY > neckTopY) {
        // Левая линия
        torsoGroup.appendChild(svgEl('line', {
          x1: h.cx - neckHalfW, y1: neckTopY - offset,
          x2: h.cx - neckHalfW, y2: neckBottomY + offset,
          fill: 'none',
        }));
        // Правая линия
        torsoGroup.appendChild(svgEl('line', {
          x1: h.cx + neckHalfW, y1: neckTopY - offset,
          x2: h.cx + neckHalfW, y2: neckBottomY + offset,
          fill: 'none',
        }));
      }
    }

    // --- 2. Грудная клетка ---
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

    // --- 3. Таз ---
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
