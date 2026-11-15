/* js/torso.js — Этап 2: Вертикальная шея, адаптирующаяся под контуры */

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

  // Ширина (половина) груди на высоте y
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

  // Нижняя граница головы на данном X:
  // нижняя огибающая эллипса, челюсти и линии подбородка.
  function headBottomYAtX(x, headGeo) {
    if (!headGeo) return 0;
    const { cx, cy, rx, ry, l4, jaw } = headGeo;

    // Эллипс (нижняя половина)
    let yEllipse = -Infinity;
    const dxN = (x - cx) / rx;
    if (Math.abs(dxN) <= 1) {
      yEllipse = cy + ry * Math.sqrt(1 - dxN * dxN);
    }

    // Челюсть — по стороне, к которой относится X
    const side = x >= cx ? 1 : -1;
    const attach = side === 1 ? jaw.attachRight : jaw.attachLeft;
    const angle  = side === 1 ? jaw.angleRight  : jaw.angleLeft;
    const chin   = side === 1 ? jaw.chinRight   : jaw.chinLeft;

    const ax  = Math.abs(attach.x - cx);
    const bx  = Math.abs(angle.x  - cx);
    const cxx = Math.abs(chin.x   - cx);
    const dxAbs = Math.abs(x - cx);

    const lerpY = (x0, y0, x1, y1) => {
      const span = x1 - x0;
      if (Math.abs(span) < 1e-9) return y0;
      const t = (dxAbs - x0) / span;
      return y0 + (y1 - y0) * t;
    };

    let yJaw = -Infinity;
    const s1min = Math.min(ax, bx), s1max = Math.max(ax, bx);
    if (dxAbs >= s1min && dxAbs <= s1max) {
      yJaw = Math.max(yJaw, lerpY(ax, attach.y, bx, angle.y));
    }
    const s2min = Math.min(bx, cxx), s2max = Math.max(bx, cxx);
    if (dxAbs >= s2min && dxAbs <= s2max) {
      yJaw = Math.max(yJaw, lerpY(bx, angle.y, cxx, chin.y));
    }

    return Math.max(yEllipse, yJaw, l4);
  }

  // Верхняя граница груди на данном X.
  // Ищем только на расширяющемся участке (t ∈ [0, 0.6]).
  // Если X уже верхней точки (dx ≤ cpTopX) или вне груди — верхняя кромка.
  function chestTopYAtX(x, h) {
    const dx = Math.abs(x - h.cx);
    if (dx >= h.chestRx) return h.chestY0;
    if (dx <= h.cpTopX)  return h.chestY0;

    let low = h.chestY0;
    let high = h.chestY0 + h.chestHeightPx * 0.6;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      const halfW = getChestHalfWidthAtY(mid, h);
      if (halfW < dx) low = mid;
      else high = mid;
    }
    return high;
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

    const headGeo = window.Head && window.Head.lastGeometry;
    const neckHalfW = (h.headH * params.neckWidth) / 2;

    if (headGeo) {
      const leftX  = h.cx - neckHalfW;
      const rightX = h.cx + neckHalfW;

      const topLeftY  = headBottomYAtX(leftX,  headGeo);
      const topRightY = headBottomYAtX(rightX, headGeo);
      const botLeftY  = chestTopYAtX(leftX,  h);
      const botRightY = chestTopYAtX(rightX, h);

      torsoGroup.appendChild(svgEl('line', {
        x1: leftX, y1: topLeftY,
        x2: leftX, y2: botLeftY,
        fill: 'none',
      }));

      torsoGroup.appendChild(svgEl('line', {
        x1: rightX, y1: topRightY,
        x2: rightX, y2: botRightY,
        fill: 'none',
      }));
    }

    // Грудь
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

    // Таз
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
