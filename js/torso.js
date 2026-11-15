/* js/torso.js — Этап 2: Шея + Грудь + Таз + Диагонали */

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

  // Точки P0...P6 на нижней грани таза
  function computePelvisBottomPoints(h) {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push({
        x: h.pelvisX0 + h.pelvisW * t,
        y: h.pelvisY0 + h.pelvisH,
        label: 'P' + i,
      });
    }
    return pts;
  }

  // Верхние углы таза (с учётом скругления)
  function computePelvisTopCorners(h) {
    const r = h.rad;
    return {
      topLeft: { x: h.pelvisX0, y: h.pelvisY0 + r },
      topRight: { x: h.pelvisX0 + h.pelvisW, y: h.pelvisY0 + r },
    };
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

    // --- Отладочные маркеры для точек таза ---
    const bottomPts = computePelvisBottomPoints(h);
    const topCorners = computePelvisTopCorners(h);
    const mR = h.headH * 0.008;

    for (const pt of bottomPts) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: mR,
        fill: '#2563eb', opacity: 0.85,
      }));
      const t = svgEl('text', {
        x: pt.x, y: pt.y + 28,
        'text-anchor': 'middle',
        'font-size': 22,
        'font-family': 'system-ui, sans-serif',
        fill: '#2563eb',
      });
      t.textContent = pt.label;
      grid.appendChild(t);
    }

    // Маркеры верхних углов
    grid.appendChild(svgEl('circle', {
      cx: topCorners.topLeft.x, cy: topCorners.topLeft.y, r: mR,
      fill: '#dc2626', opacity: 0.85,
    }));
    grid.appendChild(svgEl('circle', {
      cx: topCorners.topRight.x, cy: topCorners.topRight.y, r: mR,
      fill: '#dc2626', opacity: 0.85,
    }));
  }

  function drawTorso(h) {
    const { torsoGroup } = els;
    clear(torsoGroup);

    const headGeo = window.Head && window.Head.lastGeometry;
    const neckHalfW = (h.headH * params.neckWidth) / 2;

    // --- Шея ---
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

    // --- Грудь ---
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

    // --- Таз (прямоугольник) ---
    torsoGroup.appendChild(svgEl('rect', {
      x: h.pelvisX0, y: h.pelvisY0,
      width: h.pelvisW, height: h.pelvisH,
      rx: h.rad, ry: h.rad, fill: 'none',
    }));

    // --- Диагонали от P2 и P3 ---
    const bottomPts = computePelvisBottomPoints(h);
    const topCorners = computePelvisTopCorners(h);

    const P2 = bottomPts[2];
    const P3 = bottomPts[3];

    // 1. От P2 к верхнему левому углу
    torsoGroup.appendChild(svgEl('line', {
      x1: P2.x, y1: P2.y,
      x2: topCorners.topLeft.x, y2: topCorners.topLeft.y,
      fill: 'none',
    }));

    // 2. От P3 к верхнему правому углу
    torsoGroup.appendChild(svgEl('line', {
      x1: P3.x, y1: P3.y,
      x2: topCorners.topRight.x, y2: topCorners.topRight.y,
      fill: 'none',
    }));

    // 3. От P2 под 30° к левому краю таза
    // Угол 30° от горизонтали, идем влево и вверх.
    // Пересечение с левой гранью таза (x = pelvisX0)
    const leftDx = P2.x - h.pelvisX0;
    const leftDy = leftDx * Math.tan((30 * Math.PI) / 180);
    const leftTarget = { x: h.pelvisX0, y: P2.y - leftDy };

    torsoGroup.appendChild(svgEl('line', {
      x1: P2.x, y1: P2.y,
      x2: leftTarget.x, y2: leftTarget.y,
      fill: 'none',
    }));

    // 4. От P3 под 30° к правому краю таза
    const rightDx = (h.pelvisX0 + h.pelvisW) - P3.x;
    const rightDy = rightDx * Math.tan((30 * Math.PI) / 180);
    const rightTarget = { x: h.pelvisX0 + h.pelvisW, y: P3.y - rightDy };

    torsoGroup.appendChild(svgEl('line', {
      x1: P3.x, y1: P3.y,
      x2: rightTarget.x, y2: rightTarget.y,
      fill: 'none',
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

  window.Torso = { update, getParams, setParams, resetParams, DEFAULT_PARAMS, lastGeometry: null };
})();
