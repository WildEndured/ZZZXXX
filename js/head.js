// ════════════════════════════════════════════════════════════
// head.js — модуль головы (этап 1: эллипс)
// ════════════════════════════════════════════════════════════

const NS = 'http://www.w3.org/2000/svg';

export const headState = {
    top:    0,
    bottom: 0,
    width:  1,
    radius: 1
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

    // Внешнее обновление ползунков (из пресета)
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
    const headTopY = headLines[0];

    // Центр круга смещен вверх (0.35 от высоты головы),
    // чтобы освободить место снизу для челюсти и шеи.
    const baseCy = headTopY + headH * 0.35;

    // Базовый радиус = 1.5/5 * headH (занимает 3/5 высоты головы)
    const baseRy = (headH / 5) * 1.5;

    const shiftY  = (s.top + s.bottom) * 0.5 * headH;
    const ryScale = 1 + (s.bottom - s.top) * 0.5;

    const cx = canvasSize / 2;
    const cy = baseCy + shiftY;
    const ry = baseRy * ryScale * s.radius;
    const rx = baseRy * s.width * s.radius;

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
