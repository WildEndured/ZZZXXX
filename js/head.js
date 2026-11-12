// ════════════════════════════════════════════════════════════
// head.js — модуль головы
// Экспортирует: renderHead(g, layout, state), initHeadUI()
// ════════════════════════════════════════════════════════════

const SVG_NS = 'http://www.w3.org/2000/svg';

// ────────────────────────────────────────────────
// СОСТОЯНИЕ ГОЛОВЫ
// Все значения в процентах от headH, кроме radius (множитель от базового)
// ────────────────────────────────────────────────
export const headState = {
    // Круг (основная масса)
    circleTop:    0,   // сдвиг верхней точки вверх (отрицательное) / вниз (положительное), %
    circleBottom: 0,   // сдвиг нижней точки
    circleWidth:  100, // ширина (100% = 0.6 * headH)
    circleRadius: 100, // радиус (100% = 0.3 * headH)

    // Подбородок
    chinHeight:   0,   // смещение по Y от 4/5
    chinWidth:    40,  // ширина в % от headH
    chinRound:    50,  // % скругления (0 = острый, 100 = круглый)

    // Челюсть
    jawAttachY:   50,  // % от высоты круга (где крепится челюсть)
    jawLength:    100, // % длины (влияет на X-координату подбородка)
    jawAngle:     0,   // -50..50 градусов (наклон)
    jawWidth:     100, // % ширины (толщина линии челюсти)

    // Шея
    neckWidth:    30   // % от headH
};

// ────────────────────────────────────────────────
// РЕНДЕРИНГ
// ────────────────────────────────────────────────
export function renderHead(g, layout, state) {
    if (!g) return;
    g.innerHTML = ''; // очистка

    const H = layout.headH;          // высота одной головы
    const top = layout.headLines[0]; // макушка (0/5)
    const cx = layout.canvasSize / 2;

    // Базовые точки уровней (0/5 ... 5/5)
    const y0 = top;                  // 0/5
    const y1 = top + H * 0.2;        // 1/5
    const y2 = top + H * 0.4;        // 2/5
    const y3 = top + H * 0.6;        // 3/5 (базовая линия круга)
    const y4 = top + H * 0.8;        // 4/5 (подбородок)
    const y5 = top + H;              // 5/5 (низ головы / шея)

    const s = headState;

    // ── 1. Расчёт КРУГА ──────────────────────────
    // Базовый радиус 0.3 * H (по ТЗ 3/5 от 1/2 головы)
    const baseR = H * 0.3;
    const r  = baseR * (s.circleRadius / 100);
    const rx = baseR * (s.circleWidth  / 100); // эллипс по X
    const ry = baseR * (s.circleRadius / 100); // эллипс по Y

    // Центр круга по Y: середина между y2 и y4 (2/5 и 4/5)
    // + сдвиги от «Верх» и «Низ» ползунков
    let circleCY = y3; // базовая линия 3/5
    circleCY += (s.circleTop    / 100) * H * 0.5;
    circleCY += (s.circleBottom / 100) * H * 0.5;

    // Крайние точки эллипса по вертикали
    const circleTopY    = circleCY - ry;
    const circleBottomY = circleCY + ry;

    // ── 2. Расчёт ПОДБОРОДКА ─────────────────────
    const chinY = y4 + (s.chinHeight / 100) * H;
    const chinHalfW = (s.chinWidth / 100) * H / 2; // половина ширины

    // Скругление подбородка: 0 = острый, 100 = максимально круглый
    // Через контрольные точки кривой Безье
    const chinRoundK = (s.chinRound / 100) * chinHalfW;

    // Точки подбородка (левая и правая)
    const chinLeft  = { x: cx - chinHalfW, y: chinY };
    const chinRight = { x: cx + chinHalfW, y: chinY };

    // ── 3. Расчёт ЧЕЛЮСТИ ────────────────────────
    // Точка крепления к кругу: доля от высоты круга
    const attachRatio = s.jawAttachY / 100;
    const attachY = circleTopY + (circleBottomY - circleTopY) * attachRatio;

    // Точка на круге (пересечение с горизонталью attachY)
    // x = cx ± rx * sqrt(1 - ((attachY - circleCY) / ry)^2)
    const dy = (attachY - circleCY) / ry;
    const dx = rx * Math.sqrt(Math.max(0, 1 - dy * dy));
    const attachLeft  = { x: cx - dx, y: attachY };
    const attachRight = { x: cx + dx, y: attachY };

    // Точки челюсти у подбородка — с учётом длины и угла
    // Длина: множитель к X (100% — на уровне краёв подбородка)
    // Угол: наклон в градусах
    const jawLen = (s.jawLength / 100);
    const jawAng = (s.jawAngle    * Math.PI) / 180;

    const jawDeltaX = (attachLeft.x - chinLeft.x) * jawLen;
    const jawDeltaY = (attachLeft.y - chinLeft.y) * jawLen;

    // Поворот точки вокруг подбородка на угол jawAngle
    const rotX = jawDeltaX * Math.cos(jawAng) - jawDeltaY * Math.sin(jawAng);
    const rotY = jawDeltaX * Math.sin(jawAng) + jawDeltaY * Math.cos(jawAng);

    // Итоговые точки челюсти у подбородка
    const jawLeft  = { x: chinLeft.x  + rotX, y: chinLeft.y  + rotY };
    const jawRight = { x: chinRight.x - rotX, y: chinRight.y + rotY };

    // Толщина челюсти (влияет на stroke-width линии)
    const jawStroke = Math.max(2, (s.jawWidth / 100) * H * 0.05);

    // ── 4. Расчёт ШЕИ ────────────────────────────
    const neckHalfW = (s.neckWidth / 100) * H / 2;
    const neckTop   = y5 - H * 0.1;  // чуть выше подбородка, чтобы перекрыть
    const neckBot   = y5 + H * 0.3;  // уходит за пределы своей зоны, в торс

    // ── 5. ОТРИСОВКА (порядок важен: сзади → спереди) ──

    // 5.1 Шея
    const neckPath = document.createElementNS(SVG_NS, 'path');
    neckPath.setAttribute('d', `
        M ${cx - neckHalfW} ${neckTop}
        L ${cx + neckHalfW} ${neckTop}
        L ${cx + neckHalfW} ${neckBot}
        L ${cx - neckHalfW} ${neckBot}
        Z
    `);
    neckPath.setAttribute('fill', 'none');
    neckPath.setAttribute('stroke', '#000');
    neckPath.setAttribute('stroke-width', Math.max(2, H * 0.008));
    neckPath.setAttribute('stroke-linejoin', 'round');
    g.appendChild(neckPath);

    // 5.2 Круг (голова)
    const head = document.createElementNS(SVG_NS, 'ellipse');
    head.setAttribute('cx', cx);
    head.setAttribute('cy', circleCY);
    head.setAttribute('rx', rx);
    head.setAttribute('ry', ry);
    head.setAttribute('fill', 'none');
    head.setAttribute('stroke', '#000');
    head.setAttribute('stroke-width', Math.max(2, H * 0.008));
    g.appendChild(head);

    // 5.3 Челюсти (левая и правая линии) — поверх круга
    const jawLine = (a, b) => {
        const l = document.createElementNS(SVG_NS, 'line');
        l.setAttribute('x1', a.x); l.setAttribute('y1', a.y);
        l.setAttribute('x2', b.x); l.setAttribute('y2', b.y);
        l.setAttribute('stroke', '#000');
        l.setAttribute('stroke-width', jawStroke);
        l.setAttribute('stroke-linecap', 'round');
        return l;
    };
    g.appendChild(jawLine(attachLeft,  jawLeft));
    g.appendChild(jawLine(attachRight, jawRight));

    // 5.4 Подбородок (закруглённая линия через Безье)
    const chin = document.createElementNS(SVG_NS, 'path');
    const chinD = `
        M ${jawLeft.x} ${jawLeft.y}
        C ${jawLeft.x + chinRoundK} ${chinY},
          ${jawRight.x - chinRoundK} ${chinY},
          ${jawRight.x} ${jawRight.y}
    `;
    chin.setAttribute('d', chinD);
    chin.setAttribute('fill', 'none');
    chin.setAttribute('stroke', '#000');
    chin.setAttribute('stroke-width', jawStroke);
    chin.setAttribute('stroke-linecap', 'round');
    g.appendChild(chin);
}

// ────────────────────────────────────────────────
// UI ИНИЦИАЛИЗАЦИЯ
// Вызывается один раз из main.js
// ────────────────────────────────────────────────
export function initHeadUI(onChange) {
    const bind = (id, key, outId) => {
        const el  = document.getElementById(id);
        const out = document.getElementById(outId);
        if (!el) return;
        
        // начальная синхронизация
        el.value = headState[key];
        if (out) out.value = el.value;

        el.addEventListener('input', () => {
            headState[key] = parseFloat(el.value);
            if (out) out.value = el.value;
            onChange(); // → renderAll() в main.js
        });
    };

    bind('hCircleTop',    'circleTop',    'hCircleTopOut');
    bind('hCircleBottom', 'circleBottom', 'hCircleBottomOut');
    bind('hCircleWidth',  'circleWidth',  'hCircleWidthOut');
    bind('hCircleRadius', 'circleRadius', 'hCircleRadiusOut');

    bind('hChinHeight',   'chinHeight',   'hChinHeightOut');
    bind('hChinWidth',    'chinWidth',    'hChinWidthOut');
    bind('hChinRound',    'chinRound',    'hChinRoundOut');

    bind('hJawAttachY',   'jawAttachY',   'hJawAttachYOut');
    bind('hJawLength',    'jawLength',    'hJawLengthOut');
    bind('hJawAngle',     'jawAngle',     'hJawAngleOut');
    bind('hJawWidth',     'jawWidth',     'hJawWidthOut');

    bind('hNeckWidth',    'neckWidth',    'hNeckWidthOut');
}

// ────────────────────────────────────────────────
// ПРИМЕНЕНИЕ ПРЕСЕТА
// ────────────────────────────────────────────────
export function applyHeadPreset(preset) {
    if (!preset) return;
    Object.keys(headState).forEach(k => {
        if (preset[k] !== undefined) headState[k] = preset[k];
    });

    // обновляем UI, если он есть
    const keys = [
        ['hCircleTop', 'circleTop', 'hCircleTopOut'],
        ['hCircleBottom', 'circleBottom', 'hCircleBottomOut'],
        ['hCircleWidth', 'circleWidth', 'hCircleWidthOut'],
        ['hCircleRadius', 'circleRadius', 'hCircleRadiusOut'],
        ['hChinHeight', 'chinHeight', 'hChinHeightOut'],
        ['hChinWidth', 'chinWidth', 'hChinWidthOut'],
        ['hChinRound', 'chinRound', 'hChinRoundOut'],
        ['hJawAttachY', 'jawAttachY', 'hJawAttachYOut'],
        ['hJawLength', 'jawLength', 'hJawLengthOut'],
        ['hJawAngle', 'jawAngle', 'hJawAngleOut'],
        ['hJawWidth', 'jawWidth', 'hJawWidthOut'],
        ['hNeckWidth', 'neckWidth', 'hNeckWidthOut']
    ];
    keys.forEach(([id, key, out]) => {
        const el = document.getElementById(id);
        const o  = document.getElementById(out);
        if (el) el.value = headState[key];
        if (o)  o.value  = headState[key];
    });
}
