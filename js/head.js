/* js/head.js — App.Head (архитектура 0..1) */

window.App = window.App || {};

App.Head = (function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function render(group, state) {
    const pad = state.gridPad;
    const n = state.heads;
    const y0 = pad;
    const y1 = 1 - pad;
    const span = y1 - y0;
    const sectionH = span / n;

    // Размеры и центр головы
    const headH = state.head.height * sectionH;
    const headW = state.head.width * sectionH;
    const rx = headW / 2;
    const ry = headH / 2;
    const cx = 0.5;
    const cy = y0 + state.head.offset * sectionH + ry;

    // 1. Эллипс
    group.appendChild(el('ellipse', {
      cx, cy, rx, ry,
      fill: 'none',
      stroke: '#ff0000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    }));

    // 2. Подбородок
    const chinYPos = y0 + state.head.chinY * sectionH;
    const chinHalfW = state.head.chinWidth / 2;
    group.appendChild(el('line', {
      x1: 0.5 - chinHalfW, x2: 0.5 + chinHalfW,
      y1: chinYPos, y2: chinYPos,
      stroke: '#ff0000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    }));

    // 3. Челюсть
    const attachDy = (state.jaw.attachY - 0.5) * headH;
    const ratioSq = 1 - Math.pow(attachDy / ry, 2);
    const attachX = rx * Math.sqrt(Math.max(0, ratioSq));

    const attachL = { x: cx - attachX, y: cy + attachDy };
    const attachR = { x: cx + attachX, y: cy + attachDy };
    const chinL = { x: 0.5 - chinHalfW, y: chinYPos };
    const chinR = { x: 0.5 + chinHalfW, y: chinYPos };

    const distToChin = chinYPos - attachL.y;
    const verticalDrop = distToChin * state.jaw.height;
    const angleShift = state.jaw.angle * headW;

    const midL = { x: attachL.x + angleShift, y: attachL.y + verticalDrop };
    const midR = { x: attachR.x - angleShift, y: attachR.y + verticalDrop };

    let pathData = '';
    const roundFactor = state.jaw.round;

    if (roundFactor > 0.01) {
      const cp1L = { x: attachL.x + (midL.x - attachL.x) * 0.4, y: attachL.y + verticalDrop * 0.6 };
      const cp1R = { x: attachR.x + (midR.x - attachR.x) * 0.4, y: attachR.y + verticalDrop * 0.6 };
      const cp2L = { x: midL.x + (chinL.x - midL.x) * 0.6, y: midL.y + (chinL.y - midL.y) * 0.4 };
      const cp2R = { x: midR.x + (chinR.x - midR.x) * 0.6, y: midR.y + (chinR.y - midR.y) * 0.4 };

      pathData = `
        M ${attachL.x} ${attachL.y}
        C ${cp1L.x} ${cp1L.y}, ${cp2L.x} ${cp2L.y}, ${chinL.x} ${chinL.y}
        L ${chinR.x} ${chinR.y}
        C ${cp2R.x} ${cp2R.y}, ${cp1R.x} ${cp1R.y}, ${attachR.x} ${attachR.y}
      `;
    } else {
      pathData = `
        M ${attachL.x} ${attachL.y}
        L ${midL.x} ${midL.y}
        L ${chinL.x} ${chinL.y}
        L ${chinR.x} ${chinR.y}
        L ${midR.x} ${midR.y}
        L ${attachR.x} ${attachR.y}
      `;
    }

    group.appendChild(el('path', {
      d: pathData.replace(/\s+/g, ' ').trim(),
      fill: 'none',
      stroke: '#ff0000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    }));

    // 4. Сетка (L0..L5)
    for (let i = 1; i < n; i++) {
      const y = y0 + span * (i / n);
      group.appendChild(el('line', {
        x1: 0, x2: 1, y1: y, y2: y,
        stroke: '#ff0000',
        'stroke-width': 1,
        'stroke-dasharray': '4 4',
        'vector-effect': 'non-scaling-stroke',
      }));
    }

    // 5. Рамка
    const rect = el('rect', {
      x: 0, y: pad,
      width: 1, height: 1 - 2 * pad,
      fill: 'none',
      stroke: '#ff0000',
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
    });
    group.insertBefore(rect, group.firstChild);
  }

  return { render };
})();
