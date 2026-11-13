// ════════════════════════════════════════════════════════════
// head.js — модуль головы (этап 2: круг + линия подбородка на L4)
// ════════════════════════════════════════════════════════════

const NS = 'http://www.w3.org/2000/svg';

export const headState = {
    top:    0,
    bottom: 0,
    width:  1,
    radius: 1,
    chinHeight:   0,     // сдвиг линии по Y относительно L4
    chinWidth:    0.4,   // ширина линии (в долях headH)
    chinRounding: 0      // пока не используем (для будущего скругления углов)
};

let els = null;

const INPUT_KEYS = [
    'top', 'bottom', 'width', 'radius',
    'chinHeight', 'chinWidth', 'chinRounding'
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
        chinRounding: { input: document.getElementById('chinRounding'),  output: document.getElementById('chinRoundingOut') }
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
    return { cx, cy, rx, ry };
}

function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
}

export function renderHead(g, layout, state) {
    initHeadUI();
    if (!g) return;

    const { cx, cy, rx, ry } = computeEllipse(layout, headState);
    const { headLines, headH, canvasSize } = layout;

    // Координаты линии подбородка
    const yL4 = headLines[0] + headH * 0.8;
    const chinY = yL4 + (headState.chinHeight * headH);
    const chinHalfW = (headState.chinWidth * headH) / 2;

    g.innerHTML = '';

    // 1. Круг головы
    g.appendChild(el('ellipse', {
        cx, cy, rx, ry,
        fill:           '#e8e8e8',
        stroke:         '#1e1f22',
        'stroke-width': 6
    }));

    // 2. Линия подбородка на L4 (горизонтальная)
    g.appendChild(el('line', {
        x1: cx - chinHalfW,
        y1: chinY,
        x2: cx + chinHalfW,
        y2: chinY,
        stroke:         '#1e1f22',
        'stroke-width': 6,
        'stroke-linecap':'round'
    }));
}
