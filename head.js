window.App = window.App || {};

App.Head = (function () {
  'use strict';

  function render(group, state) {
    const pad = state.gridPad;
    const n = state.heads;
    const y0 = pad;
    const y1 = 1 - pad;
    const span = y1 - y0;
    const sectionH = span / n;

    const headH = state.head.height * sectionH;
    const headW = state.head.width * sectionH;
    const rx = headW / 2;
    const ry = headH / 2;
    const cx = 0.5;
    const cy = y0 + state.head.offset * sectionH + ry;

    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', String(cx));
    ellipse.setAttribute('cy', String(cy));
    ellipse.setAttribute('rx', String(rx));
    ellipse.setAttribute('ry', String(ry));
    ellipse.setAttribute('fill', 'none');
    ellipse.setAttribute('stroke', '#ff0000');
    ellipse.setAttribute('stroke-width', '1');
    ellipse.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(ellipse);

    // Подбородок
    const chinYPos = y0 + state.head.chinY * sectionH;
    const chinHalfW = state.head.chinWidth / 2;
    const chinLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    chinLine.setAttribute('x1', String(0.5 - chinHalfW));
    chinLine.setAttribute('x2', String(0.5 + chinHalfW));
    chinLine.setAttribute('y1', String(chinYPos));
    chinLine.setAttribute('y2', String(chinYPos));
    chinLine.setAttribute('stroke', '#ff0000');
    chinLine.setAttribute('stroke-width', '1');
    chinLine.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(chinLine);

    // Челюсть
    const attachDy = (state.jaw.attachY - 0.5) * headH;
    const ratioSq = 1 - Math.pow(attachDy / ry, 2);
    const attachX = rx * Math.sqrt(Math.max(0, ratioSq));
    
    const attachLeft = { x: cx - attachX, y: cy + attachDy };
    const attachRight = { x: cx + attachX, y: cy + attachDy };
    const bottomLeft = { x: 0.5 - chinHalfW, y: chinYPos };
    const bottomRight = { x: 0.5 + chinHalfW, y: chinYPos };

    const distToChin = chinYPos - attachLeft.y; 
    const verticalDrop = distToChin * state.jaw.height;
    const angleShift = state.jaw.angle * headW;
    
    const midLeft = { x: attachLeft.x + angleShift, y: attachLeft.y + verticalDrop };
    const midRight = { x: attachRight.x - angleShift, y: attachRight.y + verticalDrop };

    let pathData = '';
    const roundFactor = state.jaw.round;

    if (roundFactor > 0.01) {
      const cp1Left = { x: attachLeft.x, y: attachLeft.y + verticalDrop * 0.6 };
      const cp1Right = { x: attachRight.x, y: attachRight.y + verticalDrop * 0.6 };
      const cp2Left = { x: bottomLeft.x + angleShift * 0.5, y: bottomLeft.y - verticalDrop * 0.4 };
      const cp2Right = { x: bottomRight.x - angleShift * 0.5, y: bottomRight.y - verticalDrop * 0.4 };

      const c1L = { x: attachLeft.x + (cp1Left.x - attachLeft.x) * roundFactor, y: attachLeft.y + (cp1Left.y - attachLeft.y) * roundFactor };
      const c2L = { x: midLeft.x + (cp2Left.x - midLeft.x) * roundFactor, y: midLeft.y + (cp2Left.y - midLeft.y) * roundFactor };
      const c1R = { x: attachRight.x + (cp1Right.x - attachRight.x) * roundFactor, y: attachRight.y + (cp1Right.y - attachRight.y) * roundFactor };
      const c2R = { x: midRight.x + (cp2Right.x - midRight.x) * roundFactor, y: midRight.y + (cp2Right.y - midRight.y) * roundFactor };

      pathData = `
        M ${attachLeft.x} ${attachLeft.y}
        C ${c1L.x} ${c1L.y}, ${c2L.x} ${c2L.y}, ${bottomLeft.x} ${bottomLeft.y}
        M ${attachRight.x} ${attachRight.y}
        C ${c1R.x} ${c1R.y}, ${c2R.x} ${c2R.y}, ${bottomRight.x} ${bottomRight.y}
      `;
    } else {
      pathData = `
        M ${attachLeft.x} ${attachLeft.y}
        L ${midLeft.x} ${midLeft.y}
        L ${bottomLeft.x} ${bottomLeft.y}
        M ${attachRight.x} ${attachRight.y}
        L ${midRight.x} ${midRight.y}
        L ${bottomRight.x} ${bottomRight.y}
      `;
    }

    const jawPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    jawPath.setAttribute('d', pathData.trim());
    jawPath.setAttribute('fill', 'none');
    jawPath.setAttribute('stroke', '#ff0000');
    jawPath.setAttribute('stroke-width', '1');
    jawPath.setAttribute('vector-effect', 'non-scaling-stroke');
    group.appendChild(jawPath);

    // Сетка
    for (let i = 1; i < n; i++) {
      const y = y0 + span * (i / n);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('x2', '1');
      line.setAttribute('y1', String(y));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', '#ff0000');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '4 4');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      group.appendChild(line);
    }

    // Рамка
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', String(pad));
    rect.setAttribute('width', '1');
    rect.setAttribute('height', String(1 - 2 * pad));
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#ff0000');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('vector-effect', 'non-scaling-stroke');
    group.insertBefore(rect, group.firstChild); // рамка под всем остальным
  }

  return { render };
})();
