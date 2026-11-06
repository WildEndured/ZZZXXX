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
    const skullHInput = document.getElementById('skullH');
    const skullWInput = document.getElementById('skullW');
    const chinYInput = document.getElementById('chinY');
    const chinWInput = document.getElementById('chinW');
    const chinRInput = document.getElementById('chinR');
    const jawYInput = document.getElementById('jawY');
    const jawWInput = document.getElementById('jawW');
    const jawBInput = document.getElementById('jawB');

    // Текстовые значения
    const vSkullH = document.getElementById('vSkullH');
    const vSkullW = document.getElementById('vSkullW');
    const vChinY = document.getElementById('vChinY');
    const vChinW = document.getElementById('vChinW');
    const vChinR = document.getElementById('vChinR');
    const vJawY = document.getElementById('vJawY');
    const vJawW = document.getElementById('vJawW');
    const vJawB = document.getElementById('vJawB');

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
    // МАТЕМАТИКА ГОЛОВЫ (С ПРЯМЫМИ ЛИНИЯМИ ЧЕЛЮСТИ)
    // ==========================================
    function updateHead() {
        headLayer.innerHTML = '';
        if (!showHeadInput.checked) return;

        const { startY, stepHeight } = getTopZone();
        
        // Базовые координаты
        const skullTopBase = startY; 
        const skullBotBase = startY + stepHeight * 3 / 5; 
        const baseR = (skullBotBase - skullTopBase) / 2;
        const skullCyBase = skullTopBase + baseR; 

        // Значения с ползунков
        const skullH = Number(skullHInput.value);
        const skullW = Number(skullWInput.value);
        const chinYOffset = Number(chinYInput.value);
        const chinWParam = Number(chinWInput.value);
        const jawYParam = Number(jawYInput.value);
        const jawWParam = Number(jawWInput.value);
        const jawBParam = Number(jawBInput.value);

        // Размеры черепа
        const rY = baseR * skullH;
        const rX = baseR * skullW;
        const headCx = 0.5; 
        const cy = skullCyBase;
        
        // Подбородок
        const chinBaseY = startY + stepHeight * 4 / 5;
        const chinCenterY = chinBaseY + chinYOffset * (stepHeight / 5);
        const chinHalfW = chinWParam * rX * 0.7;
        
        // Крепление челюсти
        const jawAttachY = skullBotBase - (skullBotBase - cy) * jawYParam;
        
        // Вычисляем ширину эллипса на высоте jawAttachY
        const normY = (jawAttachY - cy) / rY;
        const attachDx = Math.sqrt(Math.max(0, 1 - normY * normY));
        
        const attachLeft  = { x: headCx - rX * attachDx, y: jawAttachY };
        const attachRight = { x: headCx + rX * attachDx, y: jawAttachY };

        // Точки излома (углы) - здесь формируется вторая линия
        const cornerLeft  = { x: headCx - rX * jawWParam, y: jawAttachY + (chinCenterY - jawAttachY) * jawBParam };
        const cornerRight = { x: headCx + rX * jawWParam, y: jawAttachY + (chinCenterY - jawAttachY) * jawBParam };

        // Точки подбородка
        let chinLeft, chinRight;
        if (chinHalfW < 0.001) {
            chinLeft = { x: headCx, y: chinCenterY };
            chinRight = { x: headCx, y: chinCenterY };
        } else {
            chinLeft  = { x: headCx - chinHalfW, y: chinCenterY };
            chinRight = { x: headCx + chinHalfW, y: chinCenterY };
        }

        // Цвета и толщина
        const strokeColor = lineColorInput.value;
        const strokeWidth = Number(lineWidthInput.value) / 4096;

        // 1. ЧЕРЕП (Эллипс)
        const skull = document.createElementNS(SVG_NS, 'ellipse');
        skull.setAttribute('cx', headCx);
        skull.setAttribute('cy', cy);
        skull.setAttribute('rx', rX);
        skull.setAttribute('ry', rY);
        skull.setAttribute('fill', 'none');
        skull.setAttribute('stroke', strokeColor);
        skull.setAttribute('stroke-width', strokeWidth);
        headLayer.appendChild(skull);

        // 2. ЧЕЛЮСТЬ И ПОДБОРОДОК (Жесткие прямые линии L)
        let pathD = `M ${attachLeft.x} ${attachLeft.y} `;
        
        // Первая линия челюсти (от черепа вниз к углу)
        pathD += `L ${cornerLeft.x} ${cornerLeft.y} `;
        // Вторая линия челюсти (от угла к подбородку)
        pathD += `L ${chinLeft.x} ${chinLeft.y} `;
        
        // Сам подбородок
        pathD += `L ${chinRight.x} ${chinRight.y} `;
        
        // Правая челюсть (от подбородка к углу)
        pathD += `L ${cornerRight.x} ${cornerRight.y} `;
        // Правая челюсть (от угла к черепу)
        pathD += `L ${attachRight.x} ${attachRight.y}`;

        const jawPath = document.createElementNS(SVG_NS, 'path');
        jawPath.setAttribute('d', pathD);
        jawPath.setAttribute('fill', 'none');
        jawPath.setAttribute('stroke', strokeColor);
        jawPath.setAttribute('stroke-width', strokeWidth);
        jawPath.setAttribute('stroke-linecap', 'round');
        jawPath.setAttribute('stroke-linejoin', 'round');
        headLayer.appendChild(jawPath);
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
        [skullHInput, vSkullH, 2],
        [skullWInput, vSkullW, 2],
        [chinYInput, vChinY, 2],
        [chinWInput, vChinW, 2],
        [jawYInput, vJawY, 2],
        [jawWInput, vJawW, 2],
        [jawBInput, vJawB, 2]
    ];

    headControls.forEach(([input, span, decimals]) => {
        input.addEventListener('input', (e) => {
            span.textContent = Number(e.target.value).toFixed(decimals);
            updateHead();
        });
    });

    // chinR (округлость) в этой версии не используется для рисования, 
    // так как мы делаем прямые линии, но оставим слушатель, чтобы не было ошибок
    chinRInput.addEventListener('input', (e) => {
        vChinR.textContent = Number(e.target.value).toFixed(2);
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
