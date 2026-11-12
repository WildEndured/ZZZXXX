// ════════════════════════════════════════════════════════════
// head.js — модуль головы (этап 1: эллипс по сетке 5 частей)
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

/**
 * Вычисляет параметры эллипса строго по сетке 1/5.
 * Базовая верхняя точка = 1/5, базовая нижняя = 3/5.
 * Центр = 2/5. Радиус = 1/5.
 */
function computeEllipse(layout, s) {
    const { headLines, headH, canvasSize } = layout;
    const headTopY = headLines[0];

    // Опорные линии (Y-координаты)
    const y1_5 = headTopY + headH * (1 / 5);  // верхняя граница круга
    const y3_5 = headTopY + headH * (3 / 5);  // нижняя граница круга

    // Базовый центр и радиус
    const baseCy = headTopY + headH * (2 / 5); 
    const baseRy = headH * (1 / 5);            

    // Ползунки "Верх" и "Низ" сдвигают соответствующие границы.
    // s.top < 0 тянет верхнюю границу вверх; s.bottom > 0 тянет нижнюю вниз.
    const shiftTop    = s.top    * headH;      // при -0.5 поднимает на 0.5*headH вверх
    const shiftBottom = s.bottom * headH;      // при +0.5 опускает на 0.5*headH вниз

    // Итоговые координаты верхней и нижней точек
    const yTop    = y1_5 + shiftTop;
    const yBottom = y3_5 + shiftBottom;

    // Итоговый центр и вертикальный радиус
    const cy = (yTop + yBottom) / 2;
    const ry = Math.abs(yBottom - yTop) / 2;

    // Ширина и общий радиус
    const cx = canvasSize / 2;
    const rx = baseRy * s.width * s.radius;
    
    // Применяем общий множитель к вертикальному радиусу тоже
    const finalRy = ry * s.radius;

    return { cx, cy, rx, ry: finalRy };
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
