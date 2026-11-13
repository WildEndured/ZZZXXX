// ════════════════════════════════════════════════════════════
// head.js — модуль головы с нуля
// ════════════════════════════════════════════════════════════

const NS = 'http://www.w3.org/2000/svg';

export const headState = {
    // Круг
    top:    0,
    bottom: 0,
    width:  1,
    radius: 1,
    // Подбородок
    chinHeight:   0,
    chinWidth:    0.4,
    // Челюсть
    jawAttach: 0,    // 0 = от самых широких краев круга (по центру), 0.3 = поднять выше
    jawLength: 0.15, // Длина вертикальных линий вниз (в долях высоты головы)
    jawAngle:  1,    // 1 = строго вертикально. Меньше 1 = сужается внутрь
    jawWidth:  1     // Не используется, оставлен для UI
};

let els = null;

const INPUT_KEYS = [
    'top', 'bottom', 'width', 'radius',
    'chinHeight', 'chinWidth',
    'jawAttach', 'jawLength', 'jawAngle', 'jawWidth'
];

function initHeadUI() {
    if (els) return;

    els = {
        top:          { input: document.getElementById('headTop'),       output: document.getElementById('headTopOut') },
        bottom:       { input: document.getElementById('headBottom'),    output: document.getElementById('headBottomOut') },
        width:        { input: document.getElementById('headWidth'),     output: document.getElementById('headWidthOut') },
        radius:       { input: document.getElementById('headRadius'),    output: document.getElementById('headRadiusOut') },
        chinHeight:   { input: document.getElementById('chinHeight'),    output: document.getElementById('chinHeightOut') },
        chinWidth:    { input: document.getElementById('chinWidth'),     output: document.getElementById('chinWidthOut') },
        jawAttach:    { input: document.getElementById('jawAttach'),     output: document.getElementById('jawAttachOut') },
        jawLength:    { input: document.getElementById('jawLength'),     output: document.getElementById('jawLengthOut') },
        jawAngle:     { input: document.getElementById('jawAngle'),      output: document.getElementById('jawAngleOut') },
        jawWidth:     { input: document.getElementById('jawWidth'),      output: document.getElementById('jawWidthOut') }
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

    // 1. РАСЧЕТ КРУГА (от L0 до L3)
    const yL0 = headLines[0];
    const yL3 = headLines[0] + headH * 0.6;
    
    const yTop = yL0 + (headState.top * headH);
    const yBottom = yL3 + (headState.bottom * headH);
    const cy = (yTop + yBottom) / 2;
    const ry = Math.abs(yBottom - yTop) / 2;

    const baseR = headH * 0.3;
    const rx = baseR * headState.width * headState.radius;
    const finalRy = ry * headState.radius;

    // 2. РАСЧЕТ ЧЕЛЮСТИ (от широчайших краев круга)
    // Самая широкая часть эллипса — это его центр по Y.
    // Ползунок jawAttach поднимает точки крепления вверх от центра.
    const attachY = cy - (headState.jawAttach * headH);
    
    // Находим X на эллипсе для этой высоты
    const yOffset = Math.max(-0.99, Math.min(0.99, (attachY - cy) / finalRy));
    const xScale = Math.sqrt(1 - yOffset * yOffset);
    const currentRx = rx * xScale;

    const leftAttachX = cx - currentRx;
    const rightAttachX = cx + currentRx;

    // Вертикальный спуск (строго вниз)
    const cornerY = attachY + (headState.jawLength * headH);
    
    // Смещение внутрь (если jawAngle < 1, линии челюсти будут сужаться)
    const angleOffset = (1 - headState.jawAngle) * (currentRx * 0.5);
    const cornerLeftX = leftAttachX + angleOffset;
    const cornerRightX = rightAttachX - angleOffset;

    // 3. РАСЧЕТ ПОДБОРОДКА (линия на L4)
    const yL4 = headLines[0] + headH * 0.8;
    const chinY = yL4 + headState.chinHeight * headH;
    const chinHalfW = (headState.chinWidth * headH) / 2;
    const chinLeftX = cx - chinHalfW;
    const chinRightX = cx + chinHalfW;

    g.innerHTML = '';

    // --- ОТРИСОВКА (только линии, fill="none") ---

    // 1. Круг
    g.appendChild(el('ellipse', {
        cx, cy, rx, ry: finalRy,
        fill: 'none',
        stroke: '#1e1f22',
        'stroke-width': 6
    }));

    // 2. Левая вертикаль челюсти
    g.appendChild(el('line', {
        x1: leftAttachX, y1: attachY,
        x2: cornerLeftX, y2: cornerY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // 3. Правая вертикаль челюсти
    g.appendChild(el('line', {
        x1: rightAttachX, y1: attachY,
        x2: cornerRightX, y2: cornerY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // 4. Диагональ к левому краю подбородка
    g.appendChild(el('line', {
        x1: cornerLeftX, y1: cornerY,
        x2: chinLeftX, y2: chinY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // 5. Диагональ к правому краю подбородка
    g.appendChild(el('line', {
        x1: cornerRightX, y1: cornerY,
        x2: chinRightX, y2: chinY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));

    // 6. Линия подбородка
    g.appendChild(el('line', {
        x1: chinLeftX, y1: chinY,
        x2: chinRightX, y2: chinY,
        fill: 'none', stroke: '#1e1f22', 'stroke-width': 6, 'stroke-linecap': 'round'
    }));
}
