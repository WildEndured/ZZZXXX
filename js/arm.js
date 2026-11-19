/* js/arm.js — Этап 2: Редактор кривой Безье (неограниченно) */

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

  const editor = {
    points: [], // { x, y }
  };

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

  // Построение плавной кривой через все точки (Catmull-Rom -> Bezier)
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

    const canvasW = geo.canvas;
    const canvasH = geo.canvas;

    // Отрисовка кривой по всем точкам
    if (editor.points.length > 0) {
      const pixels = editor.points.map(p => ({ x: p.x * canvasW, y: p.y * canvasH }));

      // Рисуем плавную кривую
      if (pixels.length >= 2) {
        const pathData = buildSmoothPath(pixels);
        armL.appendChild(svgEl('path', { d: pathData, fill: 'none', stroke: '#dc2626', 'stroke-width': 3 }));
      }

      // Рисуем точки и подписи
      pixels.forEach((p, i) => {
        armL.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 8, fill: '#f59e0b', stroke: '#dc2626', 'stroke-width': 2 }));
        const text = svgEl('text', { x: p.x + 12, y: p.y - 12, 'font-size': 16, fill: '#dc2626', 'font-family': 'monospace' });
        text.textContent = `P${i}`;
        armL.appendChild(text);
      });
    }
  }

  // --- ОБНОВЛЕНИЕ UI СПИСКА ТОЧЕК ---
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
      info.innerHTML = `<b style="color:#f59e0b">P${i}</b> &nbsp; X: ${pt.x.toFixed(4)}, Y: ${pt.y.toFixed(4)}`;
      
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

  // --- ОБРАБОТКА КЛИКОВ ---
  function handleCanvasClick(e) {
    const svg = document.getElementById('svg');
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    editor.points.push({ x, y });
    renderPointsList();
    if (window.applyState) window.applyState();
  }

  // --- СБРОС ---
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

  document.addEventListener('DOMContentLoaded', initEditor);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initEditor, 0);
  }

  window.Arm = { update, getParams, setParams, resetParams, DEFAULT_PARAMS, editor };
})();
