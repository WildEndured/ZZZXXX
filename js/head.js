const NS = 'http://www.w3.org/2000/svg';

export const headState = {
    top:    0,
    bottom: 0,
    width:  1,
    radius: 1,
    chinHeight:   0,
    chinWidth:    0.10,
    jawAttach: 0,
    jawLength: 0.40,
    jawAngle:  0.50,
    neckWidth: 0.15
};

let els = null;

function initHeadUI() {
    if (els) return;

    els = {
        top:        { input: document.getElementById('headTop'),       output: document.getElementById('headTopOut') },
        bottom:     { input: document.getElementById('headBottom'),    output: document.getElementById('headBottomOut') },
        width:      { input: document.getElementById('headWidth'),     output: document.getElementById('headWidthOut') },
        radius:     { input: document.getElementById('headRadius'),    output: document.getElementById('headRadiusOut') },
        chinHeight: { input: document.getElementById('chinHeight'),    output: document.getElementById('chinHeightOut') },
        chinWidth:  { input: document.getElementById('chinWidth'),     output: document.getElementById('chinWidthOut') },
        jawAttach:  { input: document.getElementById('jawAttach'),     output: document.getElementById('jawAttachOut') },
        jawLength:  { input: document.getElementById('jawLength'),     output: document.getElementById('jawLengthOut') },
        jawAngle:   { input: document.getElementById('jawAngle'),      output: document.getElementById('jawAngleOut') },
        neckWidth:  { input: document.getElementById('neckWidth'),     output: document.getElementById('neckWidthOut') }
    };

    if (!els.top.input) return;

    for (const k in els) {
        if (els[k].input && els[k].output) bind(k);
    }
    document.addEventListener('head:applyState', syncUIFromState);
}

function bind(key) {
    const { input, output } = els[key];
    
    input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        headState[key] = v;
        output.value = v.toFixed(2);
        dispatchRender();
    });

    input.value  = headState[key];
    output.value = Number(headState[key]).toFixed(2);
}

function syncUIFromState() {
    if (!els) return;
    for (const k in els) {
        if (els[k].input && els[k].output) {
            els[k].input.value  = headState[k];
            els[k].output.value = Number(headState[k]).toFixed(2);
        }
    }
    dispatchRender();
}

function dispatchRender() {
    document.dispatchEvent(new CustomEvent('head:changed'));
}

function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
}

export function renderHead(g, layout, state) {
    initHeadUI();
    if (!g) return;

    const { headLines, headH, canvasSize } = layout;
    const cx = canvasSize / 2;

    // 1. Круг
    const yL0 = headLines[0];
    const yL3 = headLines[0] + headH * 0.6;
    
    const yTop = yL0 + (headState.top * headH);
    const yBottom = yL3 + (headState.bottom * headH);
    const cy = (yTop + yBottom) / 2;
    const ry = Math.abs(yBottom - yTop) / 2;

    const baseR = headH * 0.3;
    const rx = baseR * headState.width * headState.radius;
    const finalRy = ry * headState.radius;

    // 2. Челюсть
    const attachY = cy - (headState.jawAttach * headH);
    const yOffset = Math.max(-0.99, Math.min(0.99, (attachY - cy) / finalRy));
    const xScale = Math.sqrt(1 - yOffset * yOffset);
    const currentRx = rx * xScale;

    const leftAttachX = cx - currentRx;
    const rightAttachX = cx + currentRx;

    const cornerY = attachY + (headState.jawLength * headH);
    
    const angleOffset = (1 - headState.jawAngle) * (currentRx * 0.5);
    const cornerLeftX = leftAttachX + angleOffset;
    const cornerRightX = rightAttachX - angleOffset;

    // 3. Подбородок
    const yL4 = headLines[0] + headH * 0.8;
    const chinY = yL4 + headState.chinHeight * headH;
    const chinHalfW = (headState.chinWidth * headH) / 2;
    const chinLeftX = cx - chinHalfW;
    const chinRightX = cx + chinHalfW;

    // 4. Шея
    const yL5 = headLines[0] + headH;
    const neckHalfW = (headState.neckWidth * headH) / 2;
    const neckLeftX = cx - neckHalfW;
    const neckRightX = cx + neckHalfW;
    
    // Шея начинается от уровня подбородка
    const neckTopY = chinY; 

    g.innerHTML = '';

    // Отрисовка

    // Круг
    g.appendChild(el('ellipse', {
        cx, cy, rx, ry: finalRy,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6
    }));

    // Челюсть (левая вертикаль)
    g.appendChild(el('line', {
        x1: leftAttachX, y1: attachY,
        x2: cornerLeftX, y2: cornerY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // Челюсть (правая вертикаль)
    g.appendChild(el('line', {
        x1: rightAttachX, y1: attachY,
        x2: cornerRightX, y2: cornerY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // Диагональ к подбородку (левая)
    g.appendChild(el('line', {
        x1: cornerLeftX, y1: cornerY,
        x2: chinLeftX, y2: chinY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // Диагональ к подбородку (правая)
    g.appendChild(el('line', {
        x1: cornerRightX, y1: cornerY,
        x2: chinRightX, y2: chinY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // Линия подбородка
    g.appendChild(el('line', {
        x1: chinLeftX, y1: chinY,
        x2: chinRightX, y2: chinY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // Шея (левая линия)
    g.appendChild(el('line', {
        x1: neckLeftX, y1: neckTopY,
        x2: neckLeftX, y2: yL5,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // Шея (правая линия)
    g.appendChild(el('line', {
        x1: neckRightX, y1: neckTopY,
        x2: neckRightX, y2: yL5,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));
}
