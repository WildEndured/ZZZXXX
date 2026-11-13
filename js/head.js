const NS = 'http://www.w3.org/2000/svg';

export const headState = {
    top:    0,
    bottom: 0,
    width:  1,
    radius: 1,
    chinHeight:   0.1,
    chinWidth:    0.4,
    chinRounding: 0.05
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

    if (!els.top.input) {
        console.warn('head.js: не найдены элементы headTop — проверь index.html');
        return;
    }

    for (const k of INPUT_KEYS) bind(k);
    document.addEventListener('head:applyState', syncUIFromState);
}

function bind(key) {
    const { input, output } = els[key];
    if (!input || !output) {
        console.warn(`head.js: не найден input/output для "${key}"`);
        return;
    }

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

function computeChin(layout, s) {
    const { headLines, headH, canvasSize } = layout;
    const cx  = canvasSize / 2;
    const yL4 = headLines[0] + headH * 0.8;

    const width    = s.chinWidth    * headH;
    const height   = s.chinHeight   * headH;
    const rounding = s.chinRounding * headH;

    const halfW = width / 2;
    const baseY = yL4 + height;

    return {
        leftX:   cx - halfW,
        rightX:  cx + halfW,
        leftY:   baseY,
        rightY:  baseY,
        bottomY: baseY + rounding
    };
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
    const chin = computeChin(layout, headState);

    console.log('head.js renderHead:', { cx, cy, rx, ry, chin });

    g.innerHTML = '';

    // 1. Подбородок (КРАСНЫЙ, чтобы был виден на отладке)
    const d = `M ${chin.leftX} ${chin.leftY} ` +
              `Q ${cx} ${chin.bottomY} ` +
              `  ${chin.rightX} ${chin.rightY}`;

    g.appendChild(el('path', {
        d,
        fill:             'none',
        stroke:           'red',
        'stroke-width':   12,
        'stroke-linecap': 'round'
    }));

    // 2. Круг головы
    g.appendChild(el('ellipse', {
        cx, cy, rx, ry,
        fill:           'none',
        stroke:         '#1e1f22',
        'stroke-width': 6
    }));
}
