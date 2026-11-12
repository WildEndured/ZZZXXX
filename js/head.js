// ════════════════════════════════════════════════════════════
// head.js — модуль отрисовки головы
// ════════════════════════════════════════════════════════════

const NS = 'http://www.w3.org/2000/svg';

function el(name, attrs = {}) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) {
        node.setAttribute(k, v);
    }
    return node;
}

export function renderHead(g, layout, state) {
    g.innerHTML = '';
    if (!state.figure) state.figure = {};
    if (!state.figure.head) state.figure.head = {};
    const p = state.figure.head;

    // Привязка UI (выполняется один раз)
    bindHeadUI(state, () => renderHead(g, layout, state));

    // ── Геометрия ──────────────────────────────────────────────
    const headTopY = layout.headLines[0];
    const headH = layout.headH;
    const step = headH / 5;
    const cx = layout.canvasSize / 2;

    const y0 = headTopY;
    const y3 = headTopY + step * 3;
    const y4 = headTopY + step * 4;
    const y5 = headTopY + step * 5;

    // Базовый радиус круга = 3/5 от step
    const baseR = step * 3;

    // Модификаторы
    const radiusMod = p.radius / 100;
    const widthMod  = p.width / 100;

    // rx/ry эллипса
    const rx = baseR * radiusMod * widthMod;
    const ry = baseR * radiusMod;

    // Смещение центра эллипса по Y (верх/низ головы)
    const shiftY = ((p.bottom - p.top) / 100) * step * 0.5;
    const cy = y3 + shiftY;

    // Границы эллипса
    const ellipseTop = cy - ry;
    const ellipseBottom = cy + ry;
    const ellipseLeft = cx - rx;
    const ellipseRight = cx + rx;

    // Точки крепления челюсти (на эллипсе слева/справа)
    const attachRatio = 0.6 + (p.jawAttach / 100) * 0.4; // 0.2..1.0
    const attachY = ellipseTop + (ellipseBottom - ellipseTop) * attachRatio;
    const attachDy = attachY - cy;
    let attachDx = 0;
    if (Math.abs(attachDy) < ry) {
        attachDx = rx * Math.sqrt(1 - (attachDy * attachDy) / (ry * ry));
    }

    // Подбородок
    const chinHalfW = rx * (p.chinWidth / 100);
    const chinRoundRatio = p.chinRound / 50;
    const chinBaseY = y4 + (p.chinHeight / 100) * step;
    const chinTipY = chinBaseY + (p.jawLength / 100) * step;

    // Угол челюсти: 0 — широкая, 100 — узкая
    const jawAngleMod = 0.4 + (p.jawAngle / 100) * 0.6; // 0.4..1.0
    const chinTipX = chinHalfW * jawAngleMod;

    // ── Отрисовка ─────────────────────────────────────────────

    // 1. Череп
    const skull = el('ellipse', {
        cx, cy, rx, ry,
        fill: '#e8eaf0',
        stroke: '#2a2c30',
        'stroke-width': 6
    });
    g.appendChild(skull);

    // 2. Челюсть и подбородок
    // Контрольные точки для кубической кривой Безье
    const jawCtrlY = attachY + (chinBaseY - attachY) * 0.6;

    // Правая сторона (от подбородка к правому креплению)
    const jawRight = el('path', {
        d: `M ${cx + attachDx} ${attachY}
            C ${cx + attachDx + (chinTipX - attachDx) * 0.2} ${jawCtrlY}
              ${cx + chinTipX + (attachDx - chinTipX) * 0.4} ${chinBaseY}
              ${cx + chinTipX} ${chinTipY}
            L ${cx - chinTipX} ${chinTipY}
            C ${cx - chinTipX - (attachDx - chinTipX) * 0.4} ${chinBaseY}
              ${cx - attachDx - (chinTipX - attachDx) * 0.2} ${jawCtrlY}
              ${cx - attachDx} ${attachY}`,
        fill: '#e8eaf0',
        stroke: '#2a2c30',
        'stroke-width': 6,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round'
    });
    g.appendChild(jawRight);

    // 3. Шея (под подбородком)
    const neckHalfW = rx * (p.neckWidth / 100);
    const neckTopY = chinTipY;
    const neck = el('path', {
        d: `M ${cx - neckHalfW} ${neckTopY}
            L ${cx - neckHalfW} ${y5}
            L ${cx + neckHalfW} ${y5}
            L ${cx + neckHalfW} ${neckTopY} Z`,
        fill: '#d0d4dd',
        stroke: '#2a2c30',
        'stroke-width': 6,
        'stroke-linejoin': 'round'
    });
    g.appendChild(neck);

    // 4. Линия подбородка (поверх шеи, чтобы стык был чистым)
    const chinLine = el('path', {
        d: `M ${cx - chinTipX} ${chinTipY}
            Q ${cx} ${chinTipY + (1 - chinRoundRatio) * step * 0.15}
              ${cx + chinTipX} ${chinTipY}`,
        fill: 'none',
        stroke: '#2a2c30',
        'stroke-width': 6,
        'stroke-linecap': 'round'
    });
    g.appendChild(chinLine);
}

// ════════════════════════════════════════════════════════════
// Привязка UI
// ════════════════════════════════════════════════════════════

let uiBound = false;

function bindHeadUI(state, onChange) {
    if (uiBound) return;
    uiBound = true;

    const map = {
        head_top:    'top',
        head_bottom: 'bottom',
        head_width:  'width',
        head_radius: 'radius',
        chin_height: 'chinHeight',
        chin_width:  'chinWidth',
        chin_round:  'chinRound',
        jaw_attach:  'jawAttach',
        jaw_length:  'jawLength',
        jaw_angle:   'jawAngle',
        jaw_width:   'jawWidth',
        neck_width:  'neckWidth'
    };

    for (const [id, key] of Object.entries(map)) {
        const input = document.getElementById(id);
        const out   = document.getElementById(id + '_out');
        if (!input) continue;

        if (state.figure.head[key] !== undefined) {
            input.value = state.figure.head[key];
            if (out) out.value = state.figure.head[key];
        }

        input.addEventListener('input', () => {
            const v = parseFloat(input.value);
            state.figure.head[key] = v;
            if (out) out.value = v;
            onChange();
        });
    }
}
