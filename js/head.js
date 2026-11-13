// ════════════════════════════════════════════════════════════
// head.js — модуль головы (круг + подбородок + челюсть, без заливки)
// ════════════════════════════════════════════════════════════

const NS = 'http://www.w3.org/2000/svg';

export const headState = {
    top:    0,
    bottom: 0,
    width:  1,
    radius: 1,
    chinHeight:   0,
    chinWidth:    0.4,
    chinRounding: 0,
    jawAttach: 0,
    jawLength: 0.1,
    jawAngle:  0.5,
    jawWidth:  0.4
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

    // ── 1. ГЕОМЕТРИЯ КРУГА ───────────────────────
    const yL0 = headLines[0];
    const yL3 = headLines[0] + headH * 0.6;
    
    const yTop = yL0 + (headState.top * headH);
    const yBottom = yL3 + (headState.bottom * headH);

    const cy = (yTop + yBottom) / 2;
    const ry = Math.abs(yBottom - yTop) / 2;
    
    const baseR = headH * 0.3;
    const rx = baseR * headState.width * headState.radius;
    const finalRy = ry * headState.radius;

    // ── 2. ГЕОМЕТРИЯ ЧЕЛЮСТИ ─────────────────────
    // Поднимаем точки крепления от экватора (cy) на величину jawAttach
    const attachY = cy - (headState.jawAttach * headH);
    
    // Пересчитываем X на эллипсе для новой высоты (чтобы линии начинались строго на контуре)
    const yOffset = Math.max(-0.99, Math.min(0.99, (attachY - cy) / finalRy));
    const xScale = Math.sqrt(1 - yOffset * yOffset);
    const currentRx = rx * xScale;

    const leftAttachX = cx - currentRx;
    const rightAttachX = cx + currentRx;

    // Конец вертикалей (длина челюсти)
    const cornerY = attachY + (headState.jawLength * headH);

    // ── 3. ГЕОМЕТРИЯ ПОДБОРОДКА ──────────────────
    const yL4 = headLines[0] + headH * 0.8;
    const chinY = yL4 + headState.chinHeight * headH;
    const chinHalfW = (headState.chinWidth * headH) / 2;
    const chinLeftX = cx - chinHalfW;
    const chinRightX = cx + chinHalfW;

    g.innerHTML = '';

    // ── РИСОВАНИЕ ────────────────────────────────

    // 1. Контур головы: верхняя часть круга, затем вниз по челюсти, подбородок, вверх и замыкаем.
    // Начинаем с левого крепления. Идем по дуге круга вверх до правого крепления.
    
    // Вычисляем углы для дуги (от левого крепления до правого через верх)
    // Так как мы используем эллипс, для точной дуги лучше применить SVG Arc (A).
    const arcD = `M ${leftAttachX} ${attachY} ` +
                 `A ${rx} ${finalRy} 0 0 1 ${rightAttachX} ${attachY} ` + // Дуга через верх
                 `L ${rightAttachX} ${cornerY} ` + // Вниз по правой вертикали
                 `L ${chinRightX} ${chinY} ` +     // Диагональ к правому подбородку
                 `L ${chinLeftX} ${chinY} ` +      // Линия подбородка
                 `L ${leftAttachX} ${cornerY} ` +  // Диагональ к левой вертикали
                 `Z`;                              // Замыкаем (линия вверх к началу)

    // Основной контур (без заливки)
    g.appendChild(el('path', {
        d: arcD,
        fill: 'none',
        stroke: '#1e1f22',
        'stroke-width': 6,
        'stroke-linejoin': 'round'
    }));

    // 2. Вспомогательные вертикальные линии челюсти (если нужно)
    // Поскольку мы только что нарисовали контур по кругу, 
    // старые отдельные линии челюсти больше не нужны, всё в одном path.
}
