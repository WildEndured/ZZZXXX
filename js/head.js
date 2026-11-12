// ════════════════════════════════════════════════════════════
// head.js — модуль головы (этап 1: эллипс)
// ════════════════════════════════════════════════════════════

const NS = 'http://www.w3.org/2000/svg';

export const headState = {
    top:    0,  // сдвиг верхней границы (-0.5 … 0.5)
    bottom: 0,  // сдвиг нижней границы (-0.5 … 0.5)
    width:  1,  // множитель по X (0.5 … 1.5)
    radius: 1   // общий множитель (0.7 … 1.3)
};

let els = null;

function initHeadUI() {
    if (els) return;

    els = {
        top:       document.getElementById('headTop'),
        topOut:    document.getElementById('headTopOut'),
        bottom:    document.getElementById('headBottom'),
        bottomOut: document.getElementById('headBottomOut'),
        width:     document.getElementById('headWidth'),
        widthOut:  document.getElementById('headWidthOut'),
        radius:    document.getElementById('headRadius'),
        radiusOut: document.getElementById('headRadiusOut')
    };

    if (!els.top) return;

    bind('top',    'topOut');
    bind('bottom', 'bottomOut');
    bind('width',  'widthOut');
    bind('radius', 'radiusOut');

    document.addEventListener('head:applyState', syncUIFromState);
}

function bind(inputKey, outputKey) {
    const input  = els[inputKey];
    const output = els[outputKey];

    input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        headState[inputKey] = v;
        output.value = v.toFixed(2);
        dispatchRender();
    });

    input.value  = headState[inputKey];
    output.value = Number(headState[inputKey]).toFixed(2);
}

function syncUIFromState() {
    if (!els) return;
    for (const key of ['top', 'bottom', 'width', 'radius']) {
        els[key].value = headState[key];
        els[key + 'Out'].value = Number(headState[key]).toFixed(2);
    }
    dispatchRender();
}

function dispatchRender() {
    document.dispatchEvent(new CustomEvent('head:changed'));
}

function computeEllipse(layout, s) {
    const { headLines, headH, canvasSize } = layout;
    
    // Берем координаты строго внутри ПЕРВОЙ головы
    const yL0 = headLines[0];                  // Макушка (0/5)
    const yL3 = headLines[0] + headH * (3/5);  // Низ круга (3/5)

    // Ползунки "Верх" и "Низ" сдвигают соответствующие границы.
    // s.top < 0 тянет вверх, s.bottom > 0 тянет вниз.
    const shiftTop    = s.top    * headH; 
    const shiftBottom = s.bottom * headH; 

    // Итоговые координаты верхней и нижней точек круга
    const yTop    = yL0 + shiftTop;
    const yBottom = yL3 + shiftBottom;

    // Центр — ровно середина между верхней и нижней точками
    const cy = (yTop + yBottom) / 2;
    
    // Вертикальный радиус — половина расстояния между ними
    const ryBase = Math.abs(yBottom - yTop) / 2;

    // Центр по X
    const cx = canvasSize / 2;
    
    // Базовый горизонтальный радиус (1.5/5 от headH = 0.3 * headH)
    // Берем его равным идеальному вертикальному радиусу, чтобы круг был ровным
    const baseR = headH * 0.3;

    // Применяем множители ширины и общего радиуса
    const rx = baseR * s.width * s.radius;
    const ry = ryBase * s.radius;

    return { cx, cy, rx, ry };
}

export function renderHead(g, layout, state) {
    initHeadUI();
    if (!g) return;

    const { cx, cy, rx, ry } = computeEllipse(layout, headState);

    g.innerHTML = '';

    const ellipse = document.createElementNS(NS, 'ellipse');
    ellipse.setAttribute('cx', cx);
    ellipse.setAttribute('cy', cy);
    ellipse.setAttribute('rx', rx);
    ellipse.setAttribute('ry', ry);
    ellipse.setAttribute('fill', '#e8e8e8');
    ellipse.setAttribute('stroke', '#1e1f22');
    ellipse.setAttribute('stroke-width', 6);

    g.appendChild(ellipse);
}
