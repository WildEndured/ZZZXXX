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
    const brushColorInput = document.getElementById('brushColor');
    const brushSizeInput = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    const eraserMode = document.getElementById('eraserMode');
    const paddingSizeInput = document.getElementById('paddingSize');
    const paddingSizeValue = document.getElementById('paddingSizeValue');
    const headCountInput = document.getElementById('headCount');
    const headCountValue = document.getElementById('headCountValue');
    const showGridInput = document.getElementById('showGrid');

    // Голова
    const showHeadInput = document.getElementById('showHead');
    const headWidthInput = document.getElementById('headWidth');
    const headWidthValue = document.getElementById('headWidthValue');
    const headHeightInput = document.getElementById('headHeight');
    const headHeightValue = document.getElementById('headHeightValue');
    const chinWidthInput = document.getElementById('chinWidth');
    const chinWidthValue = document.getElementById('chinWidthValue');
    const chinYInput = document.getElementById('chinY');
    const chinYValue = document.getElementById('chinYValue');
    
    // Новые ползунки челюсти
    const jawAttachYInput = document.getElementById('jawAttachY');
    const jawAttachYValue = document.getElementById('jawAttachYValue');
    const jawWidthInput = document.getElementById('jawWidth');
    const jawWidthValue = document.getElementById('jawWidthValue');
    const jawAngleInput = document.getElementById('jawAngle');
    const jawAngleValue = document.getElementById('jawAngleValue');
    const jawRoundInput = document.getElementById('jawRound');
    const jawRoundValue = document.getElementById('jawRoundValue');

    const PNG_SIZE = 4096;
    let drawing = false;
    let currentPath = null;
    let currentPoints = [];
    let currentBgSrc = null; 
    let bgNaturalWidth = 0;
    let bgNaturalHeight = 0;

    // Зум
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

    // Подложка
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

    // Разметка
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

    // Отрисовка головы
    function updateHead() {
        headLayer.innerHTML = '';
        if (!showHeadInput.checked) return;

        const { startY, stepHeight } = getTopZone();
        const unit = stepHeight / 5; 

        // Опорные точки
        const yTop = startY;                     // 0/5
        const yCircleBottom = startY + unit * 3; // 3/5
        const yChinBase = startY + unit * 4;     // 4/5
        
        // Центр круга
        const circleCenterY = (yTop + yCircleBottom) / 2;
        const baseRadiusY = (yCircleBottom - yTop) / 2; 
        
        const headW = Number(headWidthInput.value) / 100;
        const headH = Number(headHeightInput.value) / 100;
        const chinW = Number(chinWidthInput.value) / 100;
        const chinYOffset = Number(chinYInput.value) / 100;
        
        const attachYPercent = Number(jawAttachYInput.value) / 100;
        const jawWidthPercent = Number(jawWidthInput.value) / 100;
        const jawAngleDeg = Number(jawAngleInput.value);
        const jawRound = Number(jawRoundInput.value) / 100; // Для скругления

        // Радиусы
        const rx = baseRadiusY * headW;
        const ry = baseRadiusY * headH;
        const cx = 0.5;

        const strokeColor = '#ff0000';
        const strokeWidth = '0.004';

        // 1. ЧЕРЕП (Круг)
        const skull = document.createElementNS(SVG_NS, 'ellipse');
        skull.setAttribute('cx', cx);
        skull.setAttribute('cy', circleCenterY);
        skull.setAttribute('rx', rx);
        skull.setAttribute('ry', ry);
        skull.setAttribute('fill', 'none');
        skull.setAttribute('stroke', strokeColor);
        skull.setAttribute('stroke-width', strokeWidth);
        headLayer.appendChild(skull);

        // 2. ПОДБОРОДОК
        const actualChinY = yChinBase + (chinYOffset * unit);
        const chinWidthHalf = rx * chinW; 
        const chinLeftX = cx - chinWidthHalf;
        const chinRightX = cx + chinWidthHalf;

        const chinLine = document.createElementNS(SVG_NS, 'line');
        chinLine.setAttribute('x1', chinLeftX); chinLine.setAttribute('y1', actualChinY);
        chinLine.setAttribute('x2', chinRightX); chinLine.setAttribute('y2', actualChinY);
        chinLine.setAttribute('stroke', strokeColor);
        chinLine.setAttribute('stroke-width', strokeWidth);
        headLayer.appendChild(chinLine);

        // 3. ЧЕЛЮСТЬ
        // Вычисляем высоту, на которой крепится челюсть (от 0% до 100% между центром круга и низом)
        const jawAttachY = circleCenterY + (ry * 2) * attachYPercent; // ry*2 — это полная высота круга
        
        // Ширина крепления (насколько далеко от центра по X)
        // Если jawWidth = 100, крепим к самому краю круга. Если 0 - к центру.
        const actualJawWidthX = rx * jawWidthPercent;

        const jawStartLeftX = cx - actualJawWidthX;
        const jawStartRightX = cx + actualJawWidthX;

        // Точка излома
        const angleRad = (jawAngleDeg * Math.PI) / 180;
        
        // Длина первой линии (до излома)
        const line1Length = (actualChinY - jawAttachY) * 0.6;

        // Левая челюсть
        // Первая линия идет вниз и немного вправо (угол)
        const jawMidLeftX = jawStartLeftX + Math.sin(angleRad) * line1Length;
        const jawMidLeftY = jawAttachY + Math.cos(angleRad) * line1Length;

        // Проверяем скругление
        let leftJawPathStr = `M ${jawStartLeftX} ${jawAttachY} L ${jawMidLeftX} ${jawMidLeftY} `;
        
        if (jawRound > 0) {
            // Квадратичная кривая (Q) для скругления перехода к подбородку
            const cpX = jawMidLeftX + (chinLeftX - jawMidLeftX) * jawRound;
            const cpY = actualChinY - (actualChinY - jawMidLeftY) * jawRound;
            leftJawPathStr += `Q ${cpX} ${cpY} ${chinLeftX} ${actualChinY}`;
        } else {
            // Жесткий угол
            leftJawPathStr += `L ${chinLeftX} ${actualChinY}`;
        }

        const leftJawPath = document.createElementNS(SVG_NS, 'path');
        leftJawPath.setAttribute('d', leftJawPathStr);
        leftJawPath.setAttribute('fill', 'none');
        leftJawPath.setAttribute('stroke', strokeColor);
        leftJawPath.setAttribute('stroke-width', strokeWidth);
        headLayer.appendChild(leftJawPath);

        // Правая челюсть (зеркально)
        const jawMidRightX = jawStartRightX - Math.sin(angleRad) * line1Length;
        const jawMidRightY = jawAttachY + Math.cos(angleRad) * line1Length;

        let rightJawPathStr = `M ${jawStartRightX} ${jawAttachY} L ${jawMidRightX} ${jawMidRightY} `;
        
        if (jawRound > 0) {
            const cpX = jawMidRightX + (chinRightX - jawMidRightX) * jawRound;
            const cpY = actualChinY - (actualChinY - jawMidRightY) * jawRound;
            rightJawPathStr += `Q ${cpX} ${cpY} ${chinRightX} ${actualChinY}`;
        } else {
            rightJawPathStr += `L ${chinRightX} ${actualChinY}`;
        }

        const rightJawPath = document.createElementNS(SVG_NS, 'path');
        rightJawPath.setAttribute('d', rightJawPathStr);
        rightJawPath.setAttribute('fill', 'none');
        rightJawPath.setAttribute('stroke', strokeColor);
        rightJawPath.setAttribute('stroke-width', strokeWidth);
        headLayer.appendChild(rightJawPath);
    }

    function updateAll() { updateGrid(); updateHead(); }
    
    // Слушатели
    paddingSizeInput.addEventListener('input', (e) => { paddingSizeValue.textContent = e.target.value + '%'; updateAll(); });
    headCountInput.addEventListener('input', (e) => { headCountValue.textContent = e.target.value; updateAll(); });
    showGridInput.addEventListener('change', updateAll);
    showHeadInput.addEventListener('change', updateHead);
    
    const headControls = [
        [headWidthInput, headWidthValue],
        [headHeightInput, headHeightValue],
        [chinWidthInput, chinWidthValue],
        [chinYInput, chinYValue],
        [jawAttachYInput, jawAttachYValue],
        [jawWidthInput, jawWidthValue],
        [jawAngleInput, jawAngleValue],
        [jawRoundInput, jawRoundValue]
    ];
    
    headControls.forEach(([input, span]) => {
        input.addEventListener('input', (e) => { span.textContent = e.target.value; updateHead(); });
    });

    updateAll();

    // --- Рисование и Зум ---
    function toSvgCoords(e) {
        const rect = svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    }
    function getStrokeWidth() { return Number(brushSizeInput.value) / 4000; }
    
    function startPath(p) {
        currentPath = document.createElementNS(SVG_NS, 'path');
        const color = eraserMode.checked ? bgColorInput.value : brushColorInput.value;
        currentPath.setAttribute('fill', 'none');
        currentPath.setAttribute('stroke', color);
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
    brushSizeInput.addEventListener('input', () => { brushSizeValue.textContent = brushSizeInput.value; });

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
