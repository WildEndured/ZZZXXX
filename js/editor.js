/* js/editor.js — Инструмент "Кривая Безье" (устойчивый к перерисовкам) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const editor = {
    points: [],
  };

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

  function drawEditor() {
    const svg = document.getElementById('svg');
    if (!svg) return;

    let layer = document.getElementById('editorLayer');
    if (!layer) {
      layer = document.createElementNS(NS, 'g');
      layer.setAttribute('id', 'editorLayer');
      layer.setAttribute('class', 'no-export');
      svg.appendChild(layer);
    }
    
    while (layer.firstChild) layer.removeChild(layer.firstChild);

    const canvasW = 4096;
    const canvasH = 4096;

    if (editor.points.length > 0) {
      const pixels = editor.points.map(p => ({ x: p.x * canvasW, y: p.y * canvasH }));

      if (pixels.length >= 2) {
        const pathData = buildSmoothPath(pixels);
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#dc2626');
        path.setAttribute('stroke-width', '4');
        layer.appendChild(path);
      }

      pixels.forEach((p, i) => {
        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r', '10');
        circle.setAttribute('fill', '#f59e0b');
        circle.setAttribute('stroke', '#dc2626');
        circle.setAttribute('stroke-width', '2');
        layer.appendChild(circle);

        const text = document.createElementNS(NS, 'text');
        text.setAttribute('x', p.x + 14);
        text.setAttribute('y', p.y - 14);
        text.setAttribute('font-size', '24');
        text.setAttribute('fill', '#dc2626');
        text.setAttribute('font-family', 'monospace');
        text.textContent = `P${i}`;
        layer.appendChild(text);
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
        drawEditor();
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

  // Обработчик кликов через делегирование (вешается один раз на document)
  function handleCanvasClick(e) {
    const svg = document.getElementById('svg');
    if (!svg) return;
    if (!svg.contains(e.target)) return; // Клик не по SVG

    // Игнорируем клики по панели
    if (e.target.closest('.panel')) return;

    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / 4096, rect.height / 4096);
    const offsetX = (rect.width - 4096 * scale) / 2;
    const offsetY = (rect.height - 4096 * scale) / 2;

    const x = (e.clientX - rect.left - offsetX) / (4096 * scale);
    const y = (e.clientY - rect.top - offsetY) / (4096 * scale);

    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    editor.points.push({ x, y });
    renderPointsList();
    drawEditor();
  }

  function resetEditor() {
    editor.points = [];
    renderPointsList();
    drawEditor();
  }

  function init() {
    // Вешаем обработчик на document (делегирование)
    document.removeEventListener('click', handleCanvasClick);
    document.addEventListener('click', handleCanvasClick);

    const resetBtn = document.getElementById('bezierReset');
    if (resetBtn) {
      resetBtn.removeEventListener('click', resetEditor);
      resetBtn.addEventListener('click', resetEditor);
    }
    renderPointsList();
    drawEditor();
  }

  // Запуск после полной загрузки DOM
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 0);
  }

  window.Editor = { editor, drawEditor, renderPointsList, resetEditor };
})();
