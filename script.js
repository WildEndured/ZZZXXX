(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.getElementById('mainSvg');
    const zoomContainer = document.getElementById('zoomContainer');
    const drawLayer = document.getElementById('drawLayer');
    const measureLayer = document.getElementById('measureLayer');
    const headLayer = document.getElementById('headLayer');
    const bgColorLayer = document.getElementById('bgColorLayer');

    // UI
    const clearBtn = document.getElementById('clearBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');
    const bgColorInput = document.getElementById('bgColor');
    const lineColorInput = document.getElementById('lineColor');
    const lineWidthInput = document.getElementById('lineWidth');
    const lineWidthValue = document.getElementById('lineWidthValue');
    const paddingSizeInput = document.getElementById('paddingSize');
    const paddingSizeValue = document.getElementById('paddingSizeValue');
    const headCountInput = document.getElementById('headCount');
    const headCountValue = document.getElementById('headCountValue');
    const showGridInput = document.getElementById('showGrid');
    const showHeadInput = document.getElementById('showHead');
    
    // Параметры головы
    const skullWInput = document.getElementById('skullW');
    const skullHInput = document.getElementById('skullH');
    const chinWInput = document.getElementById('chinW');
    const chinYInput = document.getElementById('chinY');
    const jawBreakYInput = document.getElementById('jawBreakY');
    const jawBreakXInput = document.getElementById('jawBreakX');
    const jawAttachYInput = document.getElementById('jawAttachY');
    const jawAttachXInput = document.getElementById('jawAttachX');

    const vSkullW = document.getElementById('vSkullW');
    const vSkullH = document.getElementById('vSkullH');
    const vChinW = document.getElementById('vChinW');
    const vChinY = document.getElementById('vChinY');
    const vJawBreakY = document.getElementById('vJawBreakY');
    const vJawBreakX = document.getElementById('vJawBreakX');
    const vJawAttachY = document.getElementById('vJawAttachY');
    const vJawAttachX = document.getElementById('vJawAttachX');

    let drawing = false;
    let currentPath = null;
    let currentPoints = [];

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

    // Разметка и Зоны
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

    // Отрисовка головы (С НУЛЯ, С ЖЕСТКИМ ИЗЛОМОМ)
    function updateHead() {
        headLayer.innerHTML = '';
        if (!showHeadInput.checked) return;

        const { startY, stepHeight } = getTopZone();
        
        // Опорные точки зоны (1/5 шага)
        const step5 = stepHeight / 5;
        const yTop = startY;                    // 0/5
        const yCircleBot = startY + step5 * 3;  // 3/5
        const yChin = startY + step5 * 4;       // 4/5

        // Череп
        const skullH = Number(skullHInput.value);
        const skullW = Number(skullWInput.value);
        // Радиус эллипса по Y (чтобы макушка была на 0/5, а низ на 3/5)
        // Изначально радиус = 1.5 * step5. Если ползунок 1.0, он ровно вписывается.
        const baseRy = (yCircleBot - yTop) / 2;
        const ry = baseRy * skullH;
        const rx = baseRy * skullW;
        
        const cx = 0.5;
        // Центр эллипса
        const cy = yTop + ry; 

        // Отрисовка черепа
        const skull = document.createElementNS(SVG_NS, 'ellipse');
        skull.setAttribute('cx', cx);
        skull.setAttribute('cy', cy);
        skull.setAttribute('rx', rx);
        skull.setAttribute('ry', ry);
        skull.setAttribute('fill', 'none');
        skull.setAttribute('stroke', lineColorInput.value);
        skull.setAttribute('stroke-width', Number(lineWidthInput.value) / 4096);
        headLayer.appendChild(skull);

        // Подбородок
        const chinW = Number(chinWInput.value);
        const chinYOffset = Number(chinYInput.value) * step5;
        const actualChinY = yChin + chinYOffset;
        const chinHalfW = rx * chinW;
        const chinLeftX = cx - chinHalfW;
        const chinRightX = cx + chinHalfW;

        const chinLine = document.createElementNS(SVG_NS, 'line');
        chinLine.setAttribute('x1', chinLeftX); chinLine.setAttribute('y1', actualChinY);
        chinLine.setAttribute('x2', chinRightX); chinLine.setAttribute('y2', actualChinY);
        chinLine.setAttribute('stroke', lineColorInput.value);
        chinLine.setAttribute('stroke-width', Number(lineWidthInput.value) / 4096);
        headLayer.appendChild(chinLine);

        // Точки крепления к черепу
        // attachYParam: 0 = центр, 1 = самый низ. Берем от 0 до ry вниз от центра.
        const attachYParam = Number(jawAttachYInput.value);
        const attachXParam = Number(jawAttachXInput.value);
        
        const attachY = cy + (ry * attachYParam); // Y крепления
        // X крепления вычисляем по формуле эллипса (чтобы точка всегда была на границе)
        const normY = (attachY - cy) / ry;
        const maxXAtY = rx * Math.sqrt(Math.max(0, 1 - normY * normY));
        const actualAttachX = maxXAtY * attachXParam; // Если 1.0, то ровно на границе

        const attachLeft = { x: cx - actualAttachX, y: attachY };
        const attachRight = { x: cx + actualAttachX, y: attachY };

        // Точки излома челюсти
        const breakYParam = Number(jawBreakYInput.value);
        const breakXParam = Number(jawBreakXInput.value);

        // Y излома: интерполируем между Y крепления и Y подбородка
        const breakY = attachY + (actualChinY - attachY) * breakYParam;
        
        // X излома: интерполируем между X крепления и X подбородка
        const breakLeftX = attachLeft.x + (chinLeftX - attachLeft.x) * breakXParam;
        const breakRightX = attachRight.x + (chinRightX - attachRight.x) * breakXParam;

        const breakLeft = { x: breakLeftX, y: breakY };
        const breakRight = { x: breakRightX, y: breakY };

        // Отрисовка челюсти (ДВЕ ЖЕСТКИЕ ЛИНИИ: L)
        let pathD = `M ${attachLeft.x} ${attachLeft.y} `;
        pathD += `L ${breakLeft.x} ${breakLeft.y} `; // Первая линия
        pathD += `L ${chinLeftX} ${actualChinY} `;   // Вторая линия

        pathD += `M ${attachRight.x} ${attachRight.y} `;
        pathD += `L ${breakRight.x} ${breakRight.y} `;
        pathD += `L ${chinRightX} ${actualChinY}`;

        const jawPath = document.createElementNS(SVG_NS, 'path');
        jawPath.setAttribute('d', pathD);
        jawPath.setAttribute('fill', 'none');
        jawPath.setAttribute('stroke', lineColorInput.value);
        jawPath.setAttribute('stroke-width', Number(lineWidthInput.value) / 4096);
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
    lineWidthInput.addEventListener('input', (e) => { lineWidthValue.textContent = e.target.value; updateHead(); });
    lineColorInput.addEventListener('input', updateHead);

    const headControls = [
        [skullWInput, vSkullW], [skullHInput, vSkullH],
        [chinWInput, vChinW], [chinYInput, vChinY],
        [jawBreakYInput, vJawBreakY], [jawBreakXInput, vJawBreakX],
        [jawAttachYInput, vJawAttachY], [jawAttachXInput, vJawAttachX]
    ];

    headControls.forEach(([input, span]) => {
        input.addEventListener('input', (e) => {
            span.textContent = Number(e.target.value).toFixed(2);
            updateHead();
        });
    });

    updateAll();

    // Рисование и Зум
    function toSvgCoords(e) {
        const rect = svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    }

    function startPath(p) {
        currentPath = document.createElementNS(SVG_NS, 'path');
        currentPath.setAttribute('fill', 'none');
        currentPath.setAttribute('stroke', '#000');
        currentPath.setAttribute('stroke-width', Number(lineWidthInput.value) / 4096);
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
    
    svg.addEventListener('pointerup', upCancel); 
    svg.addEventListener('pointercancel', upCancel);
    resetZoomBtn.addEventListener('click', () => { scale = 1; translateX = 0; translateY = 0; applyTransform(); });
    clearBtn.addEventListener('click', () => { drawLayer.innerHTML = ''; });

    // Экспорт
    document.getElementById('downloadPngBtn').addEventListener('click', async () => {
        const exportSvg = document.createElementNS(SVG_NS, 'svg');
        exportSvg.setAttribute('xmlns', SVG_NS); exportSvg.setAttribute('width', '4096'); exportSvg.setAttribute('height', '4096'); exportSvg.setAttribute('viewBox', '0 0 1 1');
        const bgRect = document.createElementNS(SVG_NS, 'rect');
        bgRect.setAttribute('x', '0'); bgRect.setAttribute('y', '0'); bgRect.setAttribute('width', '1'); bgRect.setAttribute('height', '1'); bgRect.setAttribute('fill', bgColorInput.value);
        exportSvg.appendChild(bgRect);
        exportSvg.appendChild(measureLayer.cloneNode(true)); exportSvg.appendChild(headLayer.cloneNode(true));
        exportSvg.appendChild(drawLayer.cloneNode(true));
        
        const source = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + new XMLSerializer().serializeToString(exportSvg);
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas'); c.width = 4096; c.height = 4096;
            c.getContext('2d').drawImage(img, 0, 0, 4096, 4096);
            c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'head.png'; a.click(); }, 'image/png');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });
})();
