/* js/torso.js — Этап 2: Шея + Грудь + Таз (с линиями и скруглением) */

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

  // Пересечение отрезка (px,py)-(tx,ty) с окружностью (cx,cy,r)
  function findArcIntersection(px, py, tx, ty, cx, cy, r) {
    const dx = tx - px;
    const dy = ty - py;
    const ox = px - cx;
    const oy = py - cy;

    const a = dx*dx + dy*dy;
    const b = 2 * (ox*dx + oy*dy);
    const c = ox*ox + oy*oy - r*r;

    const disc = b*b - 4*a*c;
    if (disc < 0) return { x: tx, y: ty };

    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2*a);
    const t2 = (-b + sqrtDisc) / (2*a);

    let t = t1 > 0 ? t1 : (t2 > 0 ? t2 : 1);
    if (t > 1) t = 1;

    return { x: px + t * dx, y: py + t * dy };
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

    // Таз
    torsoGroup.appendChild(svgEl('rect', {
      x: h.pelvisX0, y: h.pelvisY0,
      width: h.pelvisW, height: h.pelvisH,
      rx: h.rad, ry: h.rad, fill: 'none',
    }));

    // --- ЛИНИИ ВНУТРИ ТАЗА ---
    const p2x = h.pelvisX0 + h.pelvisW * (2 / 5);
    const p2y = h.pelvisY0 + h.pelvisH;
    const p3x = h.pelvisX0 + h.pelvisW * (3 / 5);
    const p3y = h.pelvisY0 + h.pelvisH;

    // 1. От P2 к верхнему левому углу (с учётом скругления)
    const arcCxLeft = h.pelvisX0 + h.rad;
    const arcCyLeft = h.pelvisY0 + h.rad;
    const hitLeft = findArcIntersection(
      p2x, p2y,
      h.pelvisX0, h.pelvisY0,
      arcCxLeft, arcCyLeft, h.rad
    );
    torsoGroup.appendChild(svgEl('line', {
      x1: p2x, y1: p2y, x2: hitLeft.x, y2: hitLeft.y, fill: 'none',
    }));

    // 2. От P3 к верхнему правому углу
    const arcCxRight = h.pelvisX0 + h.pelvisW - h.rad;
    const arcCyRight = h.pelvisY0 + h.rad;
    const hitRight = findArcIntersection(
      p3x, p3y,
      h.pelvisX0 + h.pelvisW, h.pelvisY0,
      arcCxRight, arcCyRight, h.rad
    );
    torsoGroup.appendChild(svgEl('line', {
      x1: p3x, y1: p3y, x2: hitRight.x, y2: hitRight.y, fill: 'none',
    }));

    // 3. От P2 влево-вверх под 30°
    const tan30 = Math.tan(Math.PI / 6);
    const dx2 = p2x - h.pelvisX0;
    let dy2 = dx2 * tan30;
    if (p2y - dy2 < h.pelvisY0) dy2 = p2y - h.pelvisY0;
    const leftHitX = p2x - dy2 / tan30;
    const leftHitY = p2y - dy2;
    torsoGroup.appendChild(svgEl('line', {
      x1: p2x, y1: p2y, x2: leftHitX, y2: leftHitY, fill: 'none',
    }));

    // 4. От P3 вправо-вверх под 30°
    const dx3 = h.pelvisX0 + h.pelvisW - p3x;
    let dy3 = dx3 * tan30;
    if (p3y - dy3 < h.pelvisY0) dy3 = p3y - h.pelvisY0;
    const rightHitX = p3x + dy3 / tan30;
    const rightHitY = p3y - dy3;
    torsoGroup.appendChild(svgEl('line', {
      x1: p3x, y1: p3y, x2: rightHitX, y2: rightHitY, fill: 'none',
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
