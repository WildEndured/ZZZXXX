/* js/arm.js — Этап 2: Суставы + редактор Безье */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    shoulderRadiusMul: 1.0,
    elbowRadius: 0.08,
    wristRadius: 0.08,
    wristLeftX: -0.20, wristLeftY: 0,
    wristRightX: 0.20, wristRightY: 0,
    leftX: 0, leftY: 0, rightX: 0, rightY: 0,
  };

  const editor = { points: [] };
  const DEFAULT_PARAMS = Object.freeze({ ...params });
  let els = null;

  function ensureDom() {
    if (els) return els;
    const armL = document.getElementById('armLeftGroup');
    const armR = document.getElementById('armRightGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!armL || !armR || !headsLayer) return null;

    let grid = document.getElementById('armGridLayer');
    if (!grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'armGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }
    els = { armL, armR, headsLayer, grid };
    return els;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function getChestCurveWidth(t, chestRx, topNarrow) {
    if (t <= 0.6) {
      const tNorm = t / 0.6;
      return (chestRx * topNarrow) + (chestRx - (chestRx * topNarrow)) * Math.sin(tNorm * Math.PI / 2);
    } else {
      return chestRx;
    }
  }

  // Плавная кривая через все точки (Catmull-Rom)
  function buildSmoothPath(points) {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i > 0 ? i - 1 : i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  function drawArms(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    if (!torso) return;

    const { armL, armR, grid } = els;
    clear(armL);
    clear(armR);
    clear(grid);

    const headH = torso.headH;
    const chestH = torso.chestHeightPx;
    const chestRx = torso.chestRx;
    const topNarrow = torso.cpTopX / chestRx;

    // === СУСТАВЫ ===
    const baseShoulderRadius = (chestH / 3) / 2;
    const shoulderRadius = baseShoulderRadius * params.shoulderRadiusMul;
    const shoulderCy = torso.chestY0 + shoulderRadius;
    const t = (shoulderCy - torso.chestY0) / chestH;
    const curveWidth = getChestCurveWidth(t, chestRx, topNarrow);

    const leftCx = torso.cx - curveWidth - shoulderRadius;
    const rightCx = torso.cx + curveWidth + shoulderRadius;
    const leftCy = shoulderCy;
    const rightCy = shoulderCy;

    const pelvisBottomY = torso.pelvisY0 + torso.pelvisH;
    const wristRadius = params.wristRadius * headH;
    const wristLeftCy = pelvisBottomY - wristRadius;
    const wristLeftCx = torso.cx - chestRx - shoulderRadius * 1.5;
    const wristRightCy = pelvisBottomY - wristRadius;
    const wristRightCx = torso.cx + chestRx + shoulderRadius * 1.5;

    const elbowRadius = params.elbowRadius * headH;
    const elbowLeftCx = (leftCx + wristLeftCx) / 2;
    const elbowLeftCy = (leftCy + wristLeftCy) / 2;
    const elbowRightCx = (rightCx + wristRightCx) / 2;
    const elbowRightCy = (rightCy + wristRightCy) / 2;

    // Рисуем суставы (видимые, не полупрозрачные, чтобы было видно)
    armL.appendChild(svgEl('circle', { cx: leftCx, cy: leftCy, r: shoulderRadius, fill: 'none', 'stroke-width': 3 }));
    armL.appendChild(svgEl('circle', { cx: elbowLeftCx, cy: elbowLeftCy, r: elbowRadius, fill: 'none', 'stroke-width': 3 }));
    armL.appendChild(svgEl('circle', { cx: wristLeftCx, cy: wristLeftCy, r: wristRadius, fill: 'none', 'stroke-width': 3 }));

    armR.appendChild(svgEl('circle', { cx: rightCx, cy: rightCy, r: shoulderRadius, fill: 'none', 'stroke-width': 3 }));
    armR.appendChild(svgEl('circle', { cx: elbowRightCx, cy: elbowRightCy, r: elbowRadius, fill: 'none', 'stroke-width': 3 }));
    armR.appendChild(svgEl('circle', { cx: wristRightCx, cy: wristRightCy, r: wristRadius, fill: 'none', 'stroke-width': 3 }));

    // === КРИВАЯ БЕЗЬЕ ===
    const canvasW = geo.canvas;
    const canvasH = geo.canvas;

    if (editor.points.length > 0) {
      const pixels = editor.points.map(p => ({ x: p.x * canvasW, y: p.y * canvasH }));

      if (pixels.length >= 2) {
        armL.appendChild(svgEl('path', {
          d: buildSmoothPath(pixels),
          fill: 'none',
          stroke: '#dc2626',
          'stroke-width': 4,
        }));
      }

      pixels.forEach((p, i) => {
        armL.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 10, fill: '#f59e0b', stroke: '#dc2626', 'stroke-width': 2 }));
        const text = svgEl('text', { x: p.x + 14, y: p.y - 14, 'font-size': 20, fill: '#dc2626', 'font-family': 'monospace' });
        text.textContent = `P${i}`;
        armL.appendChild(text);
      });
    }
  }

  function renderPointsList() {
    const container = document.getElementById('bezierPointsList');
    if (!container) return;
    container.innerHTML = '';

    editor.points.forEach((pt, i) => {
      const div = document.createElement('div');
      div.style.padding = '6px';
      div.style.border = '1px solid #eee';
      div.style.borderRadius = '4px';
      div.style.fontSize = '12px';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      
      const info = document.createElement('div');
      info.innerHTML = `<b style="color:#dc2626">P${i}</b> &nbsp; X: ${pt.x.toFixed(4)}, Y: ${pt.y.toFixed(4)}`;
      
      const delBtn = document.createElement('button');
      delBtn.textContent = '×';
      delBtn.style.padding = '2px 6px';
      delBtn.style.background = '#dc2626';
      delBtn.style.color = 'white';
      delBtn.style.border = 'none';
      delBtn.style.borderRadius = '4px';
      delBtn.style.cursor = 'pointer';
      delBtn.onclick = () => {
        editor.points.splice(i, 1);
        renderPointsList();
        if (window.applyState) window.applyState();
      };

      div.appendChild(info);
      div.appendChild(delBtn);
      container.appendChild(div);
    });

    if (editor.points.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'Точки не заданы. Кликните по холсту.';
      p.style.color = '#999';
      p.style.fontSize = '12px';
      container.appendChild(p);
    }
  }

  function handleCanvasClick(e) {
    const svg = document.getElementById('svg');
    const rect = svg.getBoundingClientRect();
    // Учитываем preserveAspectRatio (xMidYMid meet)
    const scale = Math.min(rect.width / 4096, rect.height / 4096);
    const offsetX = (rect.width - 4096 * scale) / 2;
    const offsetY = (rect.height - 4096 * scale) / 2;

    const x = (e.clientX - rect.left - offsetX) / (4096 * scale);
    const y = (e.clientY - rect.top - offsetY) / (4096 * scale);

    if (x < 0 || x > 1 || y < 0 || y > 1) return; // Клик вне холста

    editor.points.push({ x, y });
    renderPointsList();
    if (window.applyState) window.applyState();
  }

  function resetEditor() {
    editor.points = [];
    renderPointsList();
    if (window.applyState) window.applyState();
  }

  function initEditor() {
    const svg = document.getElementById('svg');
    if (svg) {
      svg.removeEventListener('click', handleCanvasClick);
      svg.addEventListener('click', handleCanvasClick);
    }
    const resetBtn = document.getElementById('bezierReset');
    if (resetBtn) {
      resetBtn.removeEventListener('click', resetEditor);
      resetBtn.addEventListener('click', resetEditor);
    }
    renderPointsList();
  }

  function update(geo) {
    if (!ensureDom()) return;
    drawArms(geo);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  // Инициализация обработчиков
  document.addEventListener('DOMContentLoaded', initEditor);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initEditor, 0);
  }

  window.Arm = { update, getParams, setParams, resetParams, DEFAULT_PARAMS, editor, initEditor };
})();
