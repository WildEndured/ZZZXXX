(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.getElementById('mainSvg');
    const zoomContainer = document.getElementById('zoomContainer');
    const drawLayer = document.getElementById('drawLayer');
    const measureLayer = document.getElementById('measureLayer');
    const headLayer = document.getElementById('headLayer');
    
    const bgColorLayer = document.getElementById('bgColorLayer');
    const bgImage = document.getElementById('bgImage');

    // UI
    const clearBtn = document.getElementById('clearBtn');
    const downloadSvgBtn = document.getElementById('downloadSvgBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');
    const uploadBg = document.getElementById('uploadBg');
    const removeBgBtn = document.getElementById('removeBgBtn');
    const bgControls = document.getElementById('bgControls');
    const bgOpacity = document.getElementById('bgOpacity');
    const bgOpacityValue = document.getElementById('bgOpacityValue');
    const bgScale = document.getElementById('bgScale');
    const bgScaleValue = document.getElementById('bgScaleValue');
    const bgColorInput = document.getElementById('bgColor');
    const lineColorInput = document.getElementById('lineColor');
    const lineWidthInput = document.getElementById('lineWidth');
    const lineWidthValue = document.getElementById('lineWidthValue');
    const paddingSizeInput = document.getElementById('paddingSize');
    const paddingSizeValue = document.getElementById('paddingSizeValue');
    const headCountInput = document.getElementById('headCount');
    const headCountValue = document.getElementById('headCountValue');
    const showGridInput = document.getElementById('showGrid');

    // Ползунки головы
    const showHeadInput = document.getElementById('showHead');
    const headWInput = document.getElementById('headW');
    const headWValue = document.getElementById('headWValue');
    const headHInput = document.getElementById('headH');
    const headHValue = document.getElementById('headHValue');
    const chinWInput = document.getElementById('chinW');
    const chinWValue = document.getElementById('chinWValue');
    const chinYInput = document.getElementById('chinY');
    const chinYValue = document.getElementById('chinYValue');
    const jawAngleInput = document.getElementById('jawAngle');
    const jawAngleValue = document.getElementById('jawAngleValue');
    const jawLenInput = document.getElementById('jawLen');
    const jawLenValue = document.getElementById('jawLenValue');

    const PNG_SIZE = 4096;
    let drawing = false;
    let currentPath = null;
    let currentPoints = [];
    let currentBgSrc = null; 
    let bgNaturalWidth = 0;
    let bgNaturalHeight = 0;

    // --- Зум ---
    let scale = 1, translateX = 0, translateY = 0;
    let startPanX = 0, startPanY = 0;
    const activePointers = new Map();
    let initialPinchDistance = 0;
    let initialScale = 1;
    let isGestureActive = false;

    function clampTransform() {
        if (scale < 1) scale = 1;
        const wrapperRect = document.getElementById('canvasWrapper').getBoundingClientRect();
        const w = wrapperRect.width, h = wrapperRect.height;
        if (scale === 1) { translateX = 0; translateY = 0; } 
        else {
            translateX = Math.max(Math.min(0, w - (w * scale)), Math.min(0, translateX));
            translateY = Math.max(Math.min(0, h - (h * scale)), Math.min(0, translateY));
        }
    }
    function applyTransform() {
        clampTransform();
        zoomContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    // --- Подложка ---
    uploadBg.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            currentBgSrc = event.target.result;
            const tempImg = new Image();
            tempImg.onload = () => {
                bgNaturalWidth = tempImg.naturalWidth;
                bgNaturalHeight = tempImg.naturalHeight;
                bgImage.src = currentBgSrc;
                bgImage.style.display = 'block';
                bgControls.style.display = 'flex';
                removeBgBtn.style.display = 'inline-block';
                bgOpacity.value = 100; bgScale.value = 100;
                updateBgStyle();
            };
            tempImg.src = currentBgSrc;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });
    removeBgBtn.addEventListener('click', () => {
        currentBgSrc = null; bgImage.removeAttribute('src'); bgImage.style.display = 'none';
        bgControls.style.display = 'none'; removeBgBtn.style.display = 'none';
    });
    function updateBgStyle() {
        if (!bgNaturalHeight) return;
        bgImage.style.opacity = Number(bgOpacity.value) / 100;
        bgImage.style.transform = `scale(${Number(bgScale.value) / 100})`;
        bgOpacityValue.textContent = bgOpacity.value + '%';
        bgScaleValue.textContent = bgScale.value + '%';
    }
    bgOpacity.addEventListener('input', updateBgStyle);
    bgScale.addEventListener('input', updateBgStyle);

    // --- Разметка ---
    function getTopZone() {
        const padding = Number(paddingSizeInput.value) / 100;
        const heads = Number(headCountInput.value);
        const step = (1 - padding * 2) / heads;
        return { startY: padding, stepHeight: step };
    }

    function updateGrid() {
        measureLayer.innerHTML = '';
        if (!showGridInput.checked) return;
        const { startY, stepHeight } = getTopZone();
        const heads = Number(headCountInput.value);

        for (let i = 0; i <= heads; i++) {
            const y = startY + (i * stepHeight);
            const line = document.createElementNS(SVG_NS, 'line');
            line.setAttribute('x1', '0'); line.setAttribute('y1', y);
            line.setAttribute('x2', '1'); line.setAttribute('y2', y);
            line.setAttribute('stroke', '#000'); line.setAttribute('stroke-width', '0.002'); 
            line.setAttribute('stroke-dasharray', '0.015, 0.015'); line.setAttribute('opacity', '0.6'); 
            measureLayer.appendChild(line);
        }
    }

    // ==========================================
    // С НУЛЯ: ОТРИСОВКА ГОЛОВЫ И ЧЕЛЮСТИ
    // ==========================================
    function updateHead() {
        headLayer.innerHTML = '';
        if (!showHeadInput.checked) return;

        const { startY, stepHeight } = getTopZone();
        const unit = stepHeight / 5;

        // Y-координаты опорных точек
        const yTop = startY;                     // Макушка (0/5)
        const yCircleBottom = startY + unit * 3; // Низ круга (3/5)
        const yChinBase = startY + unit * 4;     // Подбородок (4/5)

        // Центр круга
        const circleCenterY = (yTop + yCircleBottom) / 2;
        const baseRadius = (yCircleBottom - yTop) / 2;

        // Параметры
        const headW = Number(headWInput.value) / 100;
        const headH = Number(headHInput.value) / 100;
        const chinW = Number(chinWInput.value) / 100;
        const chinYOffset = Number(chinYInput.value) / 100;
        const jawAngle = Number(jawAngleInput.value);
        const jawLenPercent = Number(jawLenInput.value) / 100;

        const rx = baseRadius * headW;
        const ry = baseRadius * headH;
        const cx = 0.5;

        const strokeColor = lineColorInput.value;
        const strokeWidth = Number(lineWidthInput.value) / 4096;

        // 1. РИСУЕМ КРУГ
        const skull = document.createElementNS(SVG_NS, 'ellipse');
        skull.setAttribute('cx', cx);
        skull.setAttribute('cy', circleCenterY);
        skull.setAttribute('rx', rx);
        skull.setAttribute('ry', ry);
        skull.setAttribute('fill', 'none');
        skull.setAttribute('stroke', strokeColor);
        skull.setAttribute('stroke-width', strokeWidth);
        headLayer.appendChild(skull);

        // 2. РИСУЕМ ПОДБОРОДОК
        const chinY = yChinBase + (chinYOffset * unit);
        const chinHalfW = rx * chinW;
        const chinLeftX = cx - chinHalfW;
        const chinRightX = cx + chinHalfW;

        const chinLine = document.createElementNS(SVG_NS, 'line');
        chinLine.setAttribute('x1', chinLeftX); chinLine.setAttribute('y1', chinY);
        chinLine.setAttribute('x2', chinRightX); chinLine.setAttribute('y2', chinY);
        chinLine.setAttribute('stroke', strokeColor);
        chinLine.setAttribute('stroke-width', strokeWidth);
        headLayer.appendChild(chinLine);

        // 3. РИСУЕМ ЧЕЛЮСТЬ (ДВЕ ЛИНИИ)
        // Начинаем от широчайшей точки круга (по центру)
        const attachLeftX = cx - rx;
        const attachLeftY = circleCenterY;

        const attachRightX = cx + rx;
        const attachRightY = circleCenterY;

        // Первая линия: от круга строго вниз (или под углом)
        // Длина первой линии зависит от ползунка
        const totalDistToChin = chinY - attachLeftY;
        const line1Length = totalDistToChin * jawLenPercent;

        // Угол наклона первой линии
        const angleRad = (jawAngle * Math.PI) / 180;
        
        // Вычисляем точку излома (угол челюсти)
        // sin — отклонение по X внутрь, cos — вниз по Y
        const midLeftX = attachLeftX + Math.sin(angleRad) * line1Length;
        const midLeftY = attachLeftY + Math.cos(angleRad) * line1Length;

        const midRightX = attachRightX - Math.sin(angleRad) * line1Length;
        const midRightY = attachRightY + Math.cos(angleRad) * line1Length;

        // Путь левой челюсти: от круга -> к углу -> к подбородку
        const leftJaw = document.createElementNS(SVG_NS, 'path');
        leftJaw.setAttribute('d', `M ${attachLeftX} ${attachLeftY} L ${midLeftX} ${midLeftY} L ${chinLeftX} ${chinY}`);
        leftJaw.setAttribute('fill', 'none');
        leftJaw.setAttribute('stroke', strokeColor);
        leftJaw.setAttribute('stroke-width', strokeWidth);
        leftJaw.setAttribute('stroke-linejoin', 'round');
        headLayer.appendChild(leftJaw);

        // Путь правой челюсти
        const rightJaw = document.createElementNS(SVG_NS, 'path');
        rightJaw.setAttribute('d', `M ${attachRightX} ${attachRightY} L ${midRightX} ${midRightY} L ${chinRightX} ${chinY}`);
        rightJaw.setAttribute('fill', 'none');
        rightJaw.setAttribute('stroke', strokeColor);
        rightJaw.setAttribute('stroke-width', strokeWidth);
        rightJaw.setAttribute('stroke-linejoin', 'round');
        headLayer.appendChild(rightJaw);

        // ВИЗУАЛИЗАЦИЯ УГЛОВ (маленькие кружочки), чтобы было видно излом
        const dot1 = document.createElementNS(SVG_NS, 'circle');
        dot1.setAttribute('cx', midLeftX); dot1.setAttribute('cy', midLeftY);
        dot1.setAttribute('r', strokeWidth * 2);
        dot1.setAttribute('fill', '#00ff00');
        headLayer.appendChild(dot1);

        const dot2 = document.createElementNS(SVG_NS, 'circle');
        dot2.setAttribute('cx', midRightX); dot2.setAttribute('cy', midRightY);
        dot2.setAttribute('r', strokeWidth * 2);
        dot2.setAttribute('fill', '#00ff00');
        headLayer.appendChild(dot2);
    }

    function updateAll() { updateGrid(); updateHead(); }
    
    // Слушатели UI
    paddingSizeInput.addEventListener('input', (e) => { paddingSizeValue.textContent = e.target.value + '%'; updateAll(); });
    headCountInput.addEventListener('input', (e) => { headCountValue.textContent = e.target.value; updateAll(); });
    showGridInput.addEventListener('change', updateAll);
    showHeadInput.addEventListener('change', updateHead);
    bgColorInput.addEventListener('input', () => { bgColorLayer.style.backgroundColor = bgColorInput.value; });
    
    lineWidthInput.addEventListener('input', (e) => {
        lineWidthValue.textContent = e.target.value;
        updateHead();
    });
    lineColorInput.addEventListener('input', updateHead);

    // Слушатели для головы
    const headControls = [
        [headWInput, headWValue],
        [headHInput, headHValue],
        [chinWInput, chinWValue],
        [chinYInput, chinYValue],
        [jawAngleInput, jawAngleValue],
        [jawLenInput, jawLenValue]
    ];

    headControls.forEach(([input, span]) => {
        input.addEventListener('input', (e) => {
            span.textContent = e.target.value;
            updateHead();
        });
    });

    updateAll();

    // ==========================================
    // РИСОВАНИЕ И ЗУМ
    // ==========================================
    function toSvgCoords(e) {
        const rect = svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    }
    function getStrokeWidth() { return Number(lineWidthInput.value) / 4096; }
    
    function startPath(p) {
        currentPath = document.createElementNS(SVG_NS, 'path');
        currentPath.setAttribute('fill', 'none');
        currentPath.setAttribute('stroke', '#000000');
        currentPath.setAttribute('stroke-width', getStrokeWidth());
        currentPath.setAttribute('stroke-linecap', 'round');
        currentPath.setAttribute('stroke-linejoin', 'round');
        currentPoints = [p];
        currentPath.setAttribute('d', `M ${p.x} ${p.y}`);
        drawLayer.appendChild(currentPath);
    }
    function extendPath(p) {
        if (!currentPath) return;
        currentPoints.push(p);
        let d = `M ${currentPoints[0].x} ${currentPoints[0].y}`;
        for (let i = 1; i < currentPoints.length - 1; i++) {
            const midX = (currentPoints[i].x + currentPoints[i + 1].x) / 2;
            const midY = (currentPoints[i].y + currentPoints[i + 1].y) / 2;
            d += ` Q ${currentPoints[i].x} ${currentPoints[i].y} ${midX} ${midY}`;
        }
        if (currentPoints.length > 1) d += ` L ${currentPoints[currentPoints.length-1].x} ${currentPoints[currentPoints.length-1].y}`;
        currentPath.setAttribute('d', d);
    }

    svg.addEventListener('pointerdown', (e) => {
        svg.setPointerCapture(e.pointerId);
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activePointers.size === 1) { isGestureActive = false; drawing = true; startPath(toSvgCoords(e)); } 
        else if (activePointers.size === 2) {
            isGestureActive = true; drawing = false; if (currentPath) { currentPath.remove(); currentPath = null; }
            const p = Array.from(activePointers.values());
            initialPinchDistance = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y); initialScale = scale;
            startPanX = (p[0].x + p[1].x) / 2 - translateX; startPanY = (p[0].y + p[1].y) / 2 - translateY;
        }
    });
    svg.addEventListener('pointermove', (e) => {
        if (!activePointers.has(e.pointerId)) return;
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (isGestureActive && activePointers.size === 2) {
            const p = Array.from(activePointers.values());
            let newScale = initialScale * (Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) / initialPinchDistance);
            newScale = Math.min(newScale, 20);
            const cx = (p[0].x + p[1].x) / 2, cy = (p[0].y + p[1].y) / 2;
            translateX = cx - (cx - translateX) * (newScale / scale); translateY = cy - (cy - translateY) * (newScale / scale);
            scale = newScale;
            translateX += (cx - startPanX) - translateX; translateY += (cy - startPanY) - translateY;
            applyTransform();
        } else if (drawing && activePointers.size === 1) extendPath(toSvgCoords(e));
    });
    const upCancel = (e) => {
        if (activePointers.has(e.pointerId)) activePointers.delete(e.pointerId);
        if (activePointers.size === 0) { drawing = false; isGestureActive = false; currentPath = null; }
    };
    svg.addEventListener('pointerup', upCancel); svg.addEventListener('pointercancel', upCancel);
    resetZoomBtn.addEventListener('click', () => { scale = 1; translateX = 0; translateY = 0; applyTransform(); });
    clearBtn.addEventListener('click', () => { drawLayer.innerHTML = ''; });

    // Экспорт
    async function getExportSvgString() {
        const exportSvg = document.createElementNS(SVG_NS, 'svg');
        exportSvg.setAttribute('xmlns', SVG_NS); exportSvg.setAttribute('width', '4096'); exportSvg.setAttribute('height', '4096'); exportSvg.setAttribute('viewBox', '0 0 1 1');
        const bgRect = document.createElementNS(SVG_NS, 'rect');
        bgRect.setAttribute('x', '0'); bgRect.setAttribute('y', '0'); bgRect.setAttribute('width', '1'); bgRect.setAttribute('height', '1'); bgRect.setAttribute('fill', bgColorInput.value);
        exportSvg.appendChild(bgRect);
        if (currentBgSrc) {
            const imgEl = document.createElementNS(SVG_NS, 'image');
            imgEl.setAttribute('href', currentBgSrc);
            const s = Number(bgScale.value) / 100, w = 1 * (bgNaturalWidth/bgNaturalHeight), h = 1;
            imgEl.setAttribute('x', 0.5 - w / 2); imgEl.setAttribute('y', 0.5 - h / 2); imgEl.setAttribute('width', w); imgEl.setAttribute('height', h);
            imgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet'); imgEl.setAttribute('opacity', Number(bgOpacity.value) / 100);
            const g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('transform', `translate(0.5, 0.5) scale(${s}) translate(-0.5, -0.5)`);
            g.appendChild(imgEl); exportSvg.appendChild(g);
        }
        exportSvg.appendChild(measureLayer.cloneNode(true)); exportSvg.appendChild(headLayer.cloneNode(true));
        const drawClone = drawLayer.cloneNode(true); drawClone.querySelectorAll('[data-eraser]').forEach(el => el.removeAttribute('data-eraser'));
        exportSvg.appendChild(drawClone);
        return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + new XMLSerializer().serializeToString(exportSvg);
    }
    downloadSvgBtn.addEventListener('click', async () => {
        const blob = new Blob([await getExportSvgString()], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'drawing.svg'; a.click(); URL.revokeObjectURL(url);
    });
    downloadPngBtn.addEventListener('click', async () => {
        const blob = new Blob([await getExportSvgString()], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob); const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas'); c.width = PNG_SIZE; c.height = PNG_SIZE;
            c.getContext('2d').drawImage(img, 0, 0, PNG_SIZE, PNG_SIZE);
            c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'drawing.png'; a.click(); URL.revokeObjectURL(a.href); }, 'image/png');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });
})();
