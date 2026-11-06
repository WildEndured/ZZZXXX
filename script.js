// script.js
(function() {
    'use strict';

    // Константы
    const SVG_W = 4096;
    const SVG_H = 4096;
    const PADDING_PCT = 0.05; // 5% от верха и низа
    const TOP_Y = SVG_H * PADDING_PCT;      // 204.8
    const BOTTOM_Y = SVG_H * (1 - PADDING_PCT); // 3891.2
    const USABLE_H = BOTTOM_Y - TOP_Y;      // 3686.4

    // DOM
    const svg = document.getElementById('headSvg');
    const headGroup = document.getElementById('headGroup');
    const debugGrid = document.getElementById('debugGrid');

    // Ползунки
    const controls = {
        headsCount:   { el: document.getElementById('headsCount'),   val: document.getElementById('headsCountVal'),   format: v => v },
        skullWidth:   { el: document.getElementById('skullWidth'),   val: document.getElementById('skullWidthVal'),   format: v => v.toFixed(2) },
        skullHeight:  { el: document.getElementById('skullHeight'),  val: document.getElementById('skullHeightVal'),  format: v => v.toFixed(2) },
        chinWidth:    { el: document.getElementById('chinWidth'),    val: document.getElementById('chinWidthVal'),    format: v => v.toFixed(2) },
        chinHeight:   { el: document.getElementById('chinHeight'),   val: document.getElementById('chinHeightVal'),   format: v => v.toFixed(2) },
        chinType:     { el: document.getElementById('chinType'),     val: document.getElementById('chinTypeVal'),     format: v => v === '1' ? 'Точка' : 'Линия' },
        jawAttach:    { el: document.getElementById('jawAttach'),    val: document.getElementById('jawAttachVal'),    format: v => v.toFixed(2) },
        jawAngle:     { el: document.getElementById('jawAngle'),     val: document.getElementById('jawAngleVal'),     format: v => v + '°' },
        jawWidth:     { el: document.getElementById('jawWidth'),     val: document.getElementById('jawWidthVal'),     format: v => v.toFixed(2) }
    };

    // Состояние
    const state = {
        heads: 7,
        skullW: 1.0,
        skullH: 1.0,
        chinW: 0.5,
        chinH: 0.5,
        chinType: 0,
        jawAttach: 0.5,
        jawAngle: 45,
        jawW: 1.0
    };

    // Вспомогательные SVG-функции
    function makeLine(x1, y1, x2, y2, opts = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        el.setAttribute('x1', x1);
        el.setAttribute('y1', y1);
        el.setAttribute('x2', x2);
        el.setAttribute('y2', y2);
        el.setAttribute('stroke', opts.stroke || '#222');
        el.setAttribute('stroke-width', opts.width || 6);
        el.setAttribute('stroke-linecap', 'round');
        if (opts.dash) el.setAttribute('stroke-dasharray', opts.dash);
        return el;
    }

    function makeCircle(cx, cy, r, opts = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('cx', cx);
        el.setAttribute('cy', cy);
        el.setAttribute('r', r);
        el.setAttribute('fill', opts.fill || 'none');
        el.setAttribute('stroke', opts.stroke || '#222');
        el.setAttribute('stroke-width', opts.width || 6);
        return el;
    }

    function makePath(d, opts = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', d);
        el.setAttribute('fill', opts.fill || 'none');
        el.setAttribute('stroke', opts.stroke || '#222');
        el.setAttribute('stroke-width', opts.width || 6);
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        return el;
    }

    // Основная отрисовка
    function render() {
        headGroup.innerHTML = '';
        debugGrid.innerHTML = '';

        const X = state.heads;
        const headH = USABLE_H / X;
        const cx = SVG_W / 2;

        // === 1. Отладочная сетка (линии деления на головы) ===
        for (let i = 0; i <= X; i++) {
            const y = TOP_Y + i * headH;
            const ln = makeLine(0, y, SVG_W, y, { stroke: '#4a9eff', width: 2, dash: '12 12' });
            debugGrid.appendChild(ln);
        }
        // Верхняя и нижняя границы отступа
        debugGrid.appendChild(makeLine(0, TOP_Y, SVG_W, TOP_Y, { stroke: '#ff6b6b', width: 3 }));
        debugGrid.appendChild(makeLine(0, BOTTOM_Y, SVG_W, BOTTOM_Y, { stroke: '#ff6b6b', width: 3 }));

        // === 2. Голова ===
        // Верхняя область первой головы (от TOP_Y до TOP_Y + headH)
        const headTop = TOP_Y;
        const headBottom = TOP_Y + headH;

        // Пункт 1: область от 1/X делится на 5 равных частей
        // Т.е. headH делится на 5 частей
        const fifth = headH / 5;

        // Пункт 2: круг черепа
        // "В радиусе области 3/5 рисуется круг" — радиус = 3/5 от headH / 2? 
        // "вершина круга на 1/5, низина круга на линии 3/5"
        // => верх круга = headTop + 1*fifth, низ круга = headTop + 3*fifth
        // => диаметр = 2*fifth, радиус = fifth
        const baseRadius = fifth; // это "идеально ровный" радиус по умолчанию
        const radiusY = baseRadius * state.skullH;
        const radiusX = baseRadius * state.skullW;
        const circleCy = headTop + 2 * fifth; // центр на 2/5 (между 1/5 и 3/5)
        const circleCx = cx;

        // Пункт 3: подбородок на линии 4/5
        const chinY = headTop + 4 * fifth;

        // Подбородок: линия или точка
        // "подбородок может быть линией или точкой"
        // Ширина подбородка регулируется — для линии это длина горизонтального отрезка
        // Высота подбородка — сдвиг по Y (смещение вниз/вверх от линии 4/5)
        const chinCenterY = chinY + (state.chinH - 0.5) * fifth * 2; // смещение
        const chinHalfW = state.chinW * radiusX * 0.7;

        // Пункт 4: линия челюсти
        // "первая линия крепится в широчайшей точке круга и идет прямо вниз под углом 90°"
        // Широчайшая точка круга — это (cx ± radiusX, cy)
        // Но нужно учесть высоту крепления челюсти — ползунок jawAttach (0..1)
        // Смещаем точку крепления по вертикали в пределах круга
        const attachOffset = (state.jawAttach - 0.5) * radiusY; // от -r/2 до +r/2
        const jawStartY = circleCy + attachOffset;
        // Точка крепления на правой стороне круга
        const jawStartX = circleCx + radiusX;
        // "идет прямо вниз под углом 90°" — значит вертикально вниз
        // Длина этой линии зависит от jawW (ширина челюсти)
        const jawLine1Len = fifth * state.jawW * 1.2;
        const jawEnd1X = jawStartX;
        const jawEnd1Y = jawStartY + jawLine1Len;

        // Вторая линия идет от конца первой к подбородку под углом
        // Угол челюсти (jawAngle) — угол между вертикалью и второй линией
        // Направление к подбородку (chinCenterY)
        const chinTargetX = cx + chinHalfW; // правая точка подбородка (или центр если точка)
        const chinTargetY = chinCenterY;

        // Вычисляем вторую линию: от (jawEnd1X, jawEnd1Y) до точки на подбородке
        // Угол задаёт наклон. Аппроксимируем: вторая линия должна быть равна первой по длине
        // "челюсть строится из двух равных прямых линий"
        const len2 = Math.hypot(chinTargetX - jawEnd1X, chinTargetY - jawEnd1Y);
        // Но по условию линии равны, поэтому используем длину первой линии
        const len1 = jawLine1Len;
        // Направление от конца первой линии к подбородку, но с учётом угла
        const baseAngle = Math.atan2(chinTargetY - jawEnd1Y, chinTargetX - jawEnd1X);
        // Угол челюсти — отклонение от вертикали. 
        // Вторая линия должна идти "под углом к подбородку"
        // angleRad = (90 - jawAngle) в радианах от вертикали
        // Но проще: вторая линия направлена к подбородку, но с наклоном
        const angleFromVertical = (state.jawAngle * Math.PI) / 180;
        // Направление вниз-вправо от конца первой линии
        // Если jawAngle=45°, линия идёт под 45° к горизонтали? 
        // Уточним: "угол челюсти" — угол между вертикалью и второй линией
        const dirX = Math.sin(angleFromVertical);
        const dirY = Math.cos(angleFromVertical);
        // Вторая линия должна идти к подбородку, поэтому корректируем знак X в зависимости от chinTargetX
        const signX = (chinTargetX >= jawEnd1X) ? 1 : -1;
        const jawEnd2X = jawEnd1X + signX * len1 * dirX;
        const jawEnd2Y = jawEnd1Y + len1 * dirY;

        // === Рисуем ===

        // 1. Круг черепа
        headGroup.appendChild(makeCircle(circleCx, circleCy, 1, {
            fill: 'none', stroke: 'transparent' // невидимый, используем ellipse для ширины/высоты
        }));
        // Используем ellipse для независимой ширины и высоты
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', circleCx);
        ellipse.setAttribute('cy', circleCy);
        ellipse.setAttribute('rx', radiusX);
        ellipse.setAttribute('ry', radiusY);
        ellipse.setAttribute('fill', 'rgba(74,158,255,0.08)');
        ellipse.setAttribute('stroke', '#222');
        ellipse.setAttribute('stroke-width', 8);
        headGroup.appendChild(ellipse);

        // 2. Линия челюсти (две равные линии)
        headGroup.appendChild(makeLine(jawStartX, jawStartY, jawEnd1X, jawEnd1Y, { stroke: '#222', width: 8 }));
        headGroup.appendChild(makeLine(jawEnd1X, jawEnd1Y, jawEnd2X, jawEnd2Y, { stroke: '#222', width: 8 }));

        // Симметричная левая часть челюсти (зеркально)
        const jawStartX_L = circleCx - radiusX;
        const jawEnd1X_L = jawStartX_L;
        const jawEnd1Y_L = jawStartY + jawLine1Len;
        const jawEnd2X_L = jawEnd1X_L - signX * len1 * dirX;
        const jawEnd2Y_L = jawEnd1Y + len1 * dirY;
        headGroup.appendChild(makeLine(jawStartX_L, jawStartY, jawEnd1X_L, jawEnd1Y_L, { stroke: '#222', width: 8 }));
        headGroup.appendChild(makeLine(jawEnd1X_L, jawEnd1Y_L, jawEnd2X_L, jawEnd2Y_L, { stroke: '#222', width: 8 }));

        // 3. Подбородок
        if (state.chinType === 0) {
            // Линия — горизонтальный отрезок
            headGroup.appendChild(makeLine(
                cx - chinHalfW, chinCenterY,
                cx + chinHalfW, chinCenterY,
                { stroke: '#222', width: 8 }
            ));
            // Соединяем концы челюсти с подбородком
            headGroup.appendChild(makeLine(jawEnd2X, jawEnd2Y, cx + chinHalfW, chinCenterY, { stroke: '#222', width: 6 }));
            headGroup.appendChild(makeLine(jawEnd2X_L, jawEnd2Y_L, cx - chinHalfW, chinCenterY, { stroke: '#222', width: 6 }));
        } else {
            // Точка — маленький круг
            headGroup.appendChild(makeCircle(cx, chinCenterY, 10, { fill: '#222', stroke: '#222', width: 0 }));
            // Соединяем концы челюсти с точкой подбородка
            headGroup.appendChild(makeLine(jawEnd2X, jawEnd2Y, cx, chinCenterY, { stroke: '#222', width: 6 }));
            headGroup.appendChild(makeLine(jawEnd2X_L, jawEnd2Y_L, cx, chinCenterY, { stroke: '#222', width: 6 }));
        }

        // 4. Отладочные маркеры линий деления (1/5, 2/5, 3/5, 4/5)
        for (let i = 1; i <= 4; i++) {
            const y = headTop + i * fifth;
            debugGrid.appendChild(makeLine(cx - 100, y, cx + 100, y, { stroke: '#ffaa00', width: 2, dash: '6 6' }));
        }

        // 5. Отметка вершины и низа круга
        debugGrid.appendChild(makeCircle(circleCx, circleCy - radiusY, 12, { fill: '#4a9eff', stroke: 'none' }));
        debugGrid.appendChild(makeCircle(circleCx, circleCy + radiusY, 12, { fill: '#4a9eff', stroke: 'none' }));

        // 6. Отметка подбородка (линия 4/5)
        debugGrid.appendChild(makeCircle(cx, chinY, 8, { fill: '#ff6b6b', stroke: 'none' }));
    }

    // Обновление состояния из ползунков
    function updateStateFromControls() {
        state.heads = parseInt(controls.headsCount.el.value);
        state.skullW = parseFloat(controls.skullWidth.el.value);
        state.skullH = parseFloat(controls.skullHeight.el.value);
        state.chinW = parseFloat(controls.chinWidth.el.value);
        state.chinH = parseFloat(controls.chinHeight.el.value);
        state.chinType = parseInt(controls.chinType.el.value);
        state.jawAttach = parseFloat(controls.jawAttach.el.value);
        state.jawAngle = parseInt(controls.jawAngle.el.value);
        state.jawW = parseFloat(controls.jawWidth.el.value);

        // Обновляем отображение значений
        for (const key in controls) {
            if (controls[key].el && controls[key].val) {
                const v = controls[key].el.value;
                controls[key].val.textContent = controls[key].format(v);
            }
        }
    }

    // Инициализация
    function init() {
        updateStateFromControls();
        render();

        // Слушатели
        for (const key in controls) {
            if (controls[key].el) {
                controls[key].el.addEventListener('input', () => {
                    updateStateFromControls();
                    render();
                });
            }
        }

        // Кнопка сброса
        document.getElementById('resetBtn').addEventListener('click', () => {
            controls.headsCount.el.value = 7;
            controls.skullWidth.el.value = 1.0;
            controls.skullHeight.el.value = 1.0;
            controls.chinWidth.el.value = 0.5;
            controls.chinHeight.el.value = 0.5;
            controls.chinType.el.value = 0;
            controls.jawAttach.el.value = 0.5;
            controls.jawAngle.el.value = 45;
            controls.jawWidth.el.value = 1.0;
            updateStateFromControls();
            render();
        });

        // Скачивание SVG
        document.getElementById('downloadBtn').addEventListener('click', () => {
            const clone = svg.cloneNode(true);
            // Убираем сетку из экспорта
            const gridInClone = clone.querySelector('#debugGrid');
            if (gridInClone) gridInClone.remove();
            const serializer = new XMLSerializer();
            const svgStr = serializer.serializeToString(clone);
            const blob = new Blob([svgStr], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'head.svg';
            a.click();
            URL.revokeObjectURL(url);
        });

        // Сворачивание панели
        const toggleBtn = document.getElementById('toggleControls');
        const controlsPanel = document.getElementById('controls');
        toggleBtn.addEventListener('click', () => {
            controlsPanel.classList.toggle('collapsed');
        });
    }

    // Запуск
    document.addEventListener('DOMContentLoaded', init);
})();
