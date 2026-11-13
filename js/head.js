// ════════════════════════════════════════════════════════════
// head.js — модуль головы (круг + подбородок + челюсть)
// ════════════════════════════════════════════════════════════

const NS = 'http://www.w3.org/2000/svg';

export const headState = {
    // круг
    top:    0,
    bottom: 0,
    width:  1,
    radius: 1,
    // подбородок
    chinHeight:   0,
    chinWidth:    0.4,
    chinRounding: 0,
    // челюсть
    jawAttach: 0.2, // Высота крепления (0 = L3, 0.3 = выше)
    jawLength: 0.1, // Длина челюсти (0 = вертикально, 0.4 = сильно в стороны)
    jawAngle:  0.5, // Угол (0 = прямо, 1 = разведено)
    jawWidth:  0.4  // Ширина подбородка для челюсти
};

let els = null;

const INPUT_KEYS = [
    'top', 'bottom', 'width', 'radius',
    'chinHeight', 'chinWidth', 'chinRounding',
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
        chinRounding: { input: document.getElementById('chinRounding'),  output: document.getElementById('chinRoundingOut') },
        jawAttach:    { input: document.getElementById('jawAttach'),     output: document.getElementById('jawAttachOut') },
        jawLength:    { input: document.getElementById('jawLength'),     output: document.getElementById('jawLengthOut') },
        jawAngle:     { input: document.getElementById('jawAngle'),      output: document.getElementById('jawAngleOut') },
        jawWidth:     { input: document.getElementById('jawWidth'),      output: document.getElementById('jawWidthOut') }
    };

    if (!els.top.input) return;

    for (const k of INPUT_KEYS) bind(k);
    document.addEventListener('head:applyState', syncUIFromState);
}

function bind(key) {
    const { input, output } = els[key];
    if (!input || !output) return;

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
    for (const k of INPUT_KEYS) {
        const { input, output } = els[k];
        if (!input || !output) continue;
        input.value  = headState[k];
        output.value = Number(headState[k]).toFixed(2);
    }
    dispatchRender();
}

function dispatchRender() {
    document.dispatchEvent(new CustomEvent('head:changed'));
}

function computeEllipse(layout, s) {
    const { headLines, headH, canvasSize } = layout;
    const yL0 = headLines[0];
    const yL3 = headLines[0] + headH * 0.6;
    const shiftTop    = s.top    * headH;
    const shiftBottom = s.bottom * headH;
    const yTop    = yL0 + shiftTop;
    const yBottom = yL3 + shiftBottom;
    const cy     = (yTop + yBottom) / 2;
    const ryBase = Math.abs(yBottom - yTop) / 2;
    const cx    = canvasSize / 2;
    const baseR = headH * 0.3;
    const rx = baseR * s.width * s.radius;
    const ry = ryBase * s.radius;
    return { cx, cy, rx, ry, yL3 };
}

function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
}

export function renderHead(g, layout, state) {
    initHeadUI();
    if (!g) return;

    const { cx, cy, rx, ry, yL3 } = computeEllipse(layout, headState);
    const { headLines, headH, canvasSize } = layout;

    // 1. Подбородок (горизонтальная линия на L4)
    const yL4 = headLines[0] + headH * 0.8;
    const chinY = yL4 + headState.chinHeight * headH;
    const chinHalfW = (headState.chinWidth * headH) / 2;
    const chinLeftX  = cx - chinHalfW;
    const chinRightX = cx + chinHalfW;

    // 2. Челюсть
    // Верхняя точка крепления челюсти к голове.
    // Берем базовую точку на L3 (низ круга) и поднимаем её на jawAttach.
    const attachY = yL3 - (headState.jawAttach * headH);
    
    // Разводим точки по X.
    // jawWidth — базовая ширина крепления. 
    // jawAngle (0..1) добавляет расширение.
    const jawBaseW = (headState.jawWidth * headH) / 2;
    const jawSpread = (headState.jawAngle * headH) * 0.5; 
    
    // Итоговые координаты крепления (справа и слева)
    // jawLength (0..0.4) позволяет вытянуть челюсть шире, чем подбородок
    const jawLeftX  = cx - jawBaseW - (headState.jawLength * headH) - jawSpread;
    const jawRightX = cx + jawBaseW + (headState.jawLength * headH) + jawSpread;

    g.innerHTML = '';

    // Рисуем круг головы
    g.appendChild(el('ellipse', {
        cx, cy, rx, ry,
        fill:           '#e8e8e8',
        stroke:         '#1e1f22',
        'stroke-width': 6
    }));

    // Рисуем левую линию челюсти
    g.appendChild(el('line', {
        x1: jawLeftX,
        y1: attachY,
        x2: chinLeftX,
        y2: chinY,
        stroke:          '#1e1f22',
        'stroke-width':  6,
        'stroke-linecap':'round'
    }));

    // Рисуем правую линию челюсти
    g.appendChild(el('line', {
        x1: jawRightX,
        y1: attachY,
        x2: chinRightX,
        y2: chinY,
        stroke:          '#1e1f22',
        'stroke-width':  6,
        'stroke-linecap':'round'
    }));

    // Рисуем линию подбородка
    g.appendChild(el('line', {
        x1: chinLeftX,
        y1: chinY,
        x2: chinRightX,
        y2: chinY,
        stroke:          '#1e1f22',
        'stroke-width':  6,
        'stroke-linecap':'round'
    }));
}
