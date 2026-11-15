/* js/torso.js — Этап 2: Грудная клетка и Таз (Адаптация) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Параметры (в процентах, как в твоем коде, но переведенные в доли)
  const params = {
    // Грудная клетка
    chestWidth: 0.9,      // baseRx = headH * 0.5 * (1 + chestWidth/100) -> ~0.9
    chestTop: 0.2,        // topEx (сужение верха)
    chestBottom: 0.0,     // botEx (расширение низа)
    chestHeight: 1.0,     // ry (высота)

    // Таз
    pelvisWidth: 1.0,
    pelvisHeight: 0.5,
    pelvisRounding: 0.5,
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

  // Вспомогательная функция для конвертации массива точек в path
  function pointsToPath(points, close) {
    if (points.length === 0) return '';
    let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
    }
    if (close) d += ' Z';
    return d;
  }

  function computeTorso(geo) {
    const headH = geo.headHeight;
    const cx = geo.centerX;
    
    // Начало торса (2/Х)
    const y1 = geo.topY + headH; 
    const h = headH; // 1 модуль

    // Грудная клетка
    // В твоем коде baseRx = h * 0.5 * (1 + cfg.chest.width / 100)
    // У нас params.chestWidth = 1.0 (то есть 100%), значит baseRx = h * 0.5 * 2 = h
    // Но чтобы было похоже на овал, сделаем чуть уже.
    const baseRx = h * 0.4 * (1 + params.chestWidth);
    const topEx = params.chestTop;
    const botEx = params.chestBottom;
    const ry = h * 0.5 * params.chestHeight;

    const chestCy = y1 + ry; // эллипс вписан в модуль
    const rxTop = baseRx * (1 + topEx);
    const rxBot = baseRx * (1 + botEx);

    // Таз
    const ellipseWidth = 2 * baseRx;
    const ellipseHeight = 2 * ry;

    const pelvisW = ellipseWidth * params.pelvisWidth;
    const pelvisH = ellipseHeight * params.pelvisHeight;

    const chestBottom = chestCy + ry;
    const gap = h * 0.05;
    const pelvisTop = chestBottom + gap;
    const pelvisX = cx - pelvisW / 2;

    return { headH, y1, h, cx, baseRx, topEx, botEx, ry, chestCy, rxTop, rxBot,
             ellipseWidth, ellipseHeight, pelvisW, pelvisH, chestBottom, gap, pelvisTop, pelvisX };
  }

  function drawGrid(h) {
    const { grid } = els;
    clear(grid);

    const lineX1 = h.cx - h.headH * 0.75;
    const lineX2 = h.cx + h.headH * 0.75;

    const lines = [
      { y: h.y1, label: 'T0' },
      { y: h.y1 + h.h / 2, label: 'T1' },
      { y: h.y1 + h.h, label: 'T2' },
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
    const { torsoGroup, grid } = els;
    clear(torsoGroup);

    // 1. Грудная клетка (две дуги)
    const steps = 64;
    const pts = [];
    
    // Верхняя половина (от π до 2π) с rxTop
    for (let i = 0; i <= steps; i++) {
      const t = Math.PI + Math.PI * i / steps;
      pts.push([h.cx + Math.cos(t) * h.rxTop, h.chestCy + Math.sin(t) * h.ry]);
    }
    // Нижняя половина (от 0 до π) с rxBot
    for (let i = 0; i <= steps; i++) {
      const t = Math.PI - Math.PI * i / steps;
      pts.push([h.cx + Math.cos(t) * h.rxBot, h.chestCy + Math.sin(t) * h.ry]);
    }

    torsoGroup.appendChild(svgEl('path', {
      d: pointsToPath(pts, true),
      fill: 'none',
    }));

    // 2. Таз (прямоугольник со скругленными углами)
    const rad = Math.min(h.pelvisW, h.pelvisH) / 2 * params.pelvisRounding;
    
    // В SVG нет простого тега "rect с радиусами", используем path
    const x = h.pelvisX;
    const y = h.pelvisTop;
    const w = h.pelvisW;
    const hh = h.pelvisH;
    
    // Рисуем прямоугольник с закруглениями через путь
    const rectPath = `
      M ${x + rad} ${y}
      L ${x + w - rad} ${y}
      A ${rad} ${rad} 0 0 1 ${x + w} ${y + rad}
      L ${x + w} ${y + hh - rad}
      A ${rad} ${rad} 0 0 1 ${x + w - rad} ${y + hh}
      L ${x + rad} ${y + hh}
      A ${rad} ${rad} 0 0 1 ${x} ${y + hh - rad}
      L ${x} ${y + rad}
      A ${rad} ${rad} 0 0 1 ${x + rad} ${y}
      Z
    `;
    
    torsoGroup.appendChild(svgEl('path', {
      d: rectPath.replace(/\s+/g, ' ').trim(),
      fill: 'none',
    }));

    // Маркеры
    const mR = h.headH * 0.012;
    
    // Плечи
    const shoulderY = h.chestCy - h.ry + (2 * h.ry) / 3;
    const shoulderL = { x: h.cx - h.rxTop, y: shoulderY };
    const shoulderR = { x: h.cx + h.rxTop, y: shoulderY };

    // Запястья
    const wristY = h.pelvisTop + h.pelvisH * 0.1;
    const wristL = { x: h.pelvisX, y: wristY };
    const wristR = { x: h.pelvisX + h.pelvisW, y: wristY };

    // Ноги
    const p25 = h.pelvisX + h.pelvisW * 0.4;
    const p45 = h.pelvisX + h.pelvisW * 0.8;
    const pelvisBottomY = h.pelvisTop + h.pelvisH;

    const debugPoints = [
      { x: shoulderL.x, y: shoulderL.y, c: '#2563eb' },
      { x: shoulderR.x, y: shoulderR.y, c: '#2563eb' },
      { x: wristL.x, y: wristL.y, c: '#f59e0b' },
      { x: wristR.x, y: wristR.y, c: '#f59e0b' },
      { x: p25, y: pelvisBottomY, c: '#16a34a' },
      { x: p45, y: pelvisBottomY, c: '#16a34a' },
    ];

    for (const pt of debugPoints) {
      grid.appendChild(svgEl('circle', {
        cx: pt.x, cy: pt.y, r: mR,
        fill: pt.c, opacity: 0.85,
      }));
    }
  }

  function update(geo) {
    if (!ensureDom()) return;
    const h = computeTorso(geo);
    drawGrid(h);
    drawTorso(h);

    // Сохраняем якоря для рук и ног
    const shoulderY = h.chestCy - h.ry + (2 * h.ry) / 3;
    const wristY = h.pelvisTop + h.pelvisH * 0.1;
    const pelvisBottomY = h.pelvisTop + h.pelvisH;
    
    window.Torso.anchors = {
      shoulderL: { x: h.cx - h.rxTop, y: shoulderY },
      shoulderR: { x: h.cx + h.rxTop, y: shoulderY },
      wristL: { x: h.pelvisX, y: wristY },
      wristR: { x: h.pelvisX + h.pelvisW, y: wristY },
      pelvisBottom: { 
        y: pelvisBottomY, 
        x2of5: h.pelvisX + h.pelvisW * 0.4, 
        x4of5: h.pelvisX + h.pelvisW * 0.8,
        left: h.pelvisX, 
        right: h.pelvisX + h.pelvisW 
      }
    };
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
    update, 
    getParams, 
    setParams, 
    resetParams, 
    DEFAULT_PARAMS,
    anchors: null 
  };
})();
