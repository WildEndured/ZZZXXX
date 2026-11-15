/* js/torso.js — Этап 2: Торс с направляющими для ног */

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

  function getChestTopCurvePoints(h) {
    const x0 = h.cx;
    const y0 = h.chestY0;
    const yMid = y0 + h.chestHeightPx * 0.6;
    const rx = h.chestRx;
    return [
      { x: x0, y: y0 },
      { x: x0 + h.cpTopX, y: y0 },
      { x: x0 + rx, y: y0 + h.chestHeightPx * 0.3 },
      { x: x0 + rx, y: yMid },
    ];
  }

  function bezierX(t, p) {
    const mt = 1 - t;
    return mt*mt*mt*p[0].x + 3*mt*mt*t*p[1].x + 3*mt*t*t*p[2].x + t*t*t*p[3].x;
  }

  function bezierY(t, p) {
    const mt = 1 - t;
    return mt*mt*mt*p[0].y + 3*mt*mt*t*p[1].y + 3*mt*t*t*p[2].y + t*t*t*p[3].y;
  }

  function findChestYByX(x, h) {
    const points = getChestTopCurvePoints(h);
    const dx = Math.abs(x - h.cx);
    if (dx > h.chestRx) return h.chestY0 + h.chestHeightPx;
    let low = 0, high = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      const midX = bezierX(mid, points) - h.cx;
      if (midX < dx) low = mid;
      else high = mid;
    }
    return bezierY(high, points);
  }

  function findJawYOnSecondSegment(x, headGeo) {
    if (!headGeo) return headGeo.l4;
    const ptAngle = headGeo.jaw.angleRight;
    const ptChin = headGeo.jaw.chinRight;
    const cx = headGeo.cx;
    const dxAngle = Math.abs(ptAngle.x - cx);
    const dxChin = Math.abs(ptChin.x - cx);
    const targetDx = Math.abs(x - cx);
    const minDx = Math.min(dxAngle, dxChin);
    const maxDx = Math.max(dxAngle, dxChin);
    const clampedDx = Math.max(minDx, Math.min(maxDx, targetDx));
    if (dxAngle === dxChin) return ptAngle.y;
    const t = (clampedDx - dxAngle) / (dxChin - dxAngle);
    return ptAngle.y + (ptChin.y - ptAngle.y) * t;
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
        stroke: '#9aa0a6', 'stroke-width': 2, 'stroke-dasharray': '16 12',
      }));
      const t = svgEl('text', {
        x: lineX1 - 12, y: y + 8, 'text-anchor': 'end',
        'font-size': 28, 'font-family': 'system-ui, sans-serif', fill: '#9aa0a6',
      });
      t.textContent = label;
      grid.appendChild(t);
    }

    // --- НАПРАВЛЯЮЩИЕ ДЛЯ НОГ ---
    const pBottomY = h.pelvisY0 + h.pelvisH;
    const step = h.pelvisW / 4; // 5 точек = 4 отрезка

    // Точки деления дна таза P0..P4
    const P = [
      { x: h.pelvisX0, y: pBottomY },                 // P0 (левый край)
      { x: h.pelvisX0 + step, y: pBottomY },          // P1
      { x: h.pelvisX0 + step * 2, y: pBottomY },      // P2 (центр)
      { x: h.pelvisX0 + step * 3, y: pBottomY },      // P3
      { x: h.pelvisX0 + step * 4, y: pBottomY },      // P4 (правый край)
    ];

    // Верхние углы таза
    const topLeft = { x: h.pelvisX0, y: h.pelvisY0 };
    const topRight = { x: h.pelvisX0 + h.pelvisW, y: h.pelvisY0 };

    // Угол 30 градусов от горизонтали (вниз-наружу)
    const angleRad = 30 * Math.PI / 180;
    const lineLength = h.pelvisH * 1.5; // Достаточная длина для наглядности

    // Линия от P2 в левый верхний угол
    grid.appendChild(svgEl('line', {
      x1: P[2].x, y1: P[2].y, x2: topLeft.x, y2: topLeft.y,
      stroke: '#dc2626', 'stroke-width': 2, 'stroke-dasharray': '8 6',
    }));

    // Линия от P3 в правый верхний угол
    grid.appendChild(svgEl('line', {
      x1: P[3].x, y1: P[3].y, x2: topRight.x, y2: topRight.y,
      stroke: '#dc2626', 'stroke-width': 2, 'stroke-dasharray': '8 6',
    }));

    // Линия от P2 влево-вниз под 30°
    const p2EndX = P[2].x - Math.cos(angleRad) * lineLength;
    const p2EndY = P[2].y + Math.sin(angleRad) * lineLength;
    grid.appendChild(svgEl('line', {
      x1: P[2].x, y1: P[2].y, x2: p2EndX, y2: p2EndY,
      stroke: '#2563eb', 'stroke-width': 2, 'stroke-dasharray': '8 6',
    }));

    // Линия от P3 вправо-вниз под 30°
    const p3EndX = P[3].x + Math.cos(angleRad) * lineLength;
    const p3EndY = P[3].y + Math.sin(angleRad) * lineLength;
    grid.appendChild(svgEl('line', {
      x1: P[3].x, y1: P[3].y, x2: p3EndX, y2: p3EndY,
      stroke: '#2563eb', 'stroke-width': 2, 'stroke-dasharray': '8 6',
    }));

    // Маркеры P0..P4
    const mR = h.headH * 0.012;
    for (const pt of P) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: mR, fill: '#9aa0a6', opacity: 0.85
      }));
    }
  }

  function drawTorso(h) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    const headGeo = window.Head && window.Head.lastGeometry;
    const neckHalfW = (h.headH * params.neckWidth) / 2;

    if (headGeo) {
      const leftX = h.cx - neckHalfW;
      const rightX = h.cx + neckHalfW;
      const topLeftY = findJawYOnSecondSegment(leftX, headGeo);
      const topRightY = findJawYOnSecondSegment(rightX, headGeo);
      const botLeftY = findChestYByX(leftX, h);
      const botRightY = findChestYByX(rightX, h);

      torsoGroup.appendChild(svgEl('line', {
        x1: leftX, y1: topLeftY, x2: leftX, y2: botLeftY, fill: 'none',
      }));
      torsoGroup.appendChild(svgEl('line', {
        x1: rightX, y1: topRightY, x2: rightX, y2: botRightY, fill: 'none',
      }));
    }

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
      d: dChest.replace(/\s+/g, ' ').trim(), fill: 'none',
    }));

    torsoGroup.appendChild(svgEl('rect', {
      x: h.pelvisX0, y: h.pelvisY0,
      width: h.pelvisW, height: h.pelvisH,
      rx: h.rad, ry: h.rad, fill: 'none',
    }));
  }

  function update(geo) {
    if (!ensureDom()) return;
    const h = computeTorso(geo);
    window.Torso.lastGeometry = h;
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

  window.Torso = { 
    update, getParams, setParams, resetParams, DEFAULT_PARAMS,
    lastGeometry: null 
  };
})();
