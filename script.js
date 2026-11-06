(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.getElementById('mainSvg');
    const zoomContainer = document.getElementById('zoomContainer');
    const drawLayer = document.getElementById('drawLayer');
    const measureLayer = document.getElementById('measureLayer');
    
    const bgColorLayer = document.getElementById('bgColorLayer');
    const bgImage = document.getElementById('bgImage');

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

    const PNG_SIZE = 4096;

    let drawing = false;
    let currentPath = null;
    let currentPoints = [];
    let currentBgSrc = null; 

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
        const w = wrapperRect.width;
        const h = wrapperRect.height;
        const maxTranslateX = 0;
        const minTranslateX = w - (w * scale);
        const maxTranslateY = 0;
        const minTranslateY = h - (h * scale);

        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        } else {
            if (translateX > maxTranslateX) translateX = maxTranslateX;
            if (translateX < minTranslateX) translateX = minTranslateX;
            if (translateY > maxTranslateY) translateY = maxTranslateY;
            if (translateY < minTranslateY) translateY = minTranslateY;
        }
    }

    function applyTransform() {
        clampTransform();
        zoomContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    // --- Слой фона ---
    bgColorInput.addEventListener('input', () => {
        bgColorLayer.style.backgroundColor = bgColorInput.value;
    });

    // --- Слой подложки ---
    uploadBg.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            currentBgSrc = event.target.result;
            bgImage.src = currentBgSrc;
            bgImage.style.display = 'block';
            bgControls.style.display = 'flex';
            removeBgBtn.style.display = 'inline-block';
            
            bgOpacity.value = 100;
            bgScale.value = 100;
            updateBgStyle();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });

    removeBgBtn.addEventListener('click', () => {
        currentBgSrc = null;
        bgImage.removeAttribute('src');
        bgImage.style.display = 'none';
        bgControls.style.display = 'none';
        removeBgBtn.style.display = 'none';
    });

    function updateBgStyle() {
        const opacity = Number(bgOpacity.value) / 100;
        const scaleVal = Number(bgScale.value) / 100;
        
        bgOpacityValue.textContent = bgOpacity.value + '%';
        bgScaleValue.textContent = bgScale.value + '%';
        
        bgImage.style.opacity = opacity;
        // Масштабируем картинку из центра, не трогая остальные слои
        bgImage.style.transform = `scale(${scaleVal})`;
    }

    bgOpacity.addEventListener('input', updateBgStyle);
    bgScale.addEventListener('input', updateBgStyle);

    // --- Разметка ---
    function updateGrid() {
        measureLayer.innerHTML = '';
        if (!showGridInput.checked) return;

        const paddingPercent = Number(paddingSizeInput.value) / 100;
        const heads = Number(headCountInput.value);

        const topY = paddingPercent;
        const bottomY = 1 - paddingPercent;
        const drawingHeight = bottomY - topY;
        const headStep = drawingHeight / heads;

        for (let i = 0; i <= heads; i++) {
            const y = topY + (i * headStep);
            const line = document.createElementNS(SVG_NS, 'line');
            line.setAttribute('x1', '0'); line.setAttribute('y1', y);
            line.setAttribute('x2', '1'); line.setAttribute('y2', y);
            line.setAttribute('stroke', '#000000');
            line.setAttribute('stroke-width', '0.002'); 
            line.setAttribute('stroke-dasharray', '0.015, 0.015'); 
            line.setAttribute('opacity', '0.6'); 
            measureLayer.appendChild(line);
        }

        if (paddingPercent > 0) {
            const borderRect = document.createElementNS(SVG_NS, 'rect');
            borderRect.setAttribute('x', '0'); borderRect.setAttribute('y', topY);
            borderRect.setAttribute('width', '1'); borderRect.setAttribute('height', drawingHeight);
            borderRect.setAttribute('fill', 'none');
            borderRect.setAttribute('stroke', '#ff4444'); 
            borderRect.setAttribute('stroke-width', '0.003');
            borderRect.setAttribute('opacity', '0.8');
            measureLayer.appendChild(borderRect);
        }
    }

    // --- Рисование ---
    function toSvgCoords(e) {
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    }

    function getStrokeWidth() {
        return Number(brushSizeInput.value) / 4000; 
    }

    function startPath(p) {
        currentPath = document.createElementNS(SVG_NS, 'path');
        const color = eraserMode.checked ? bgColorInput.value : brushColorInput.value;
        currentPath.setAttribute('fill', 'none');
        currentPath.setAttribute('stroke', color);
        currentPath.setAttribute('stroke-width', getStrokeWidth());
        currentPath.setAttribute('stroke-linecap', 'round');
        currentPath.setAttribute('stroke-linejoin', 'round');
        if (eraserMode.checked) currentPath.setAttribute('data-eraser', 'true');
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
        if (currentPoints.length > 1) {
            const last = currentPoints[currentPoints.length - 1];
            d += ` L ${last.x} ${last.y}`;
        }
        currentPath.setAttribute('d', d);
    }

    // --- Pointer Events ---
    svg.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
        
        svg.setPointerCapture(e.pointerId);
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        
        if (activePointers.size === 1) {
            isGestureActive = false;
            drawing = true;
            startPath(toSvgCoords(e));
        } else if (activePointers.size === 2) {
            isGestureActive = true;
            drawing = false;
            if (currentPath) {
                currentPath.remove();
                currentPath = null;
            }

            const pointers = Array.from(activePointers.values());
            initialPinchDistance = Math.hypot(pointers[1].x - pointers[0].x, pointers[1].y - pointers[0].y);
            initialScale = scale;
            
            const centerX = (pointers[0].x + pointers[1].x) / 2;
            const centerY = (pointers[0].y + pointers[1].y) / 2;
            startPanX = centerX - translateX;
            startPanY = centerY - translateY;
        }
    });

    svg.addEventListener('pointermove', (e) => {
        if (!activePointers.has(e.pointerId)) return;
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (isGestureActive && activePointers.size === 2) {
            const pointers = Array.from(activePointers.values());
            const currentDistance = Math.hypot(pointers[1].x - pointers[0].x, pointers[1].y - pointers[0].y);
            
            let newScale = initialScale * (currentDistance / initialPinchDistance);
            newScale = Math.min(newScale, 20);
            
            const currentCenterX = (pointers[0].x + pointers[1].x) / 2;
            const currentCenterY = (pointers[0].y + pointers[1].y) / 2;

            translateX = currentCenterX - (currentCenterX - translateX) * (newScale / scale);
            translateY = currentCenterY - (currentCenterY - translateY) * (newScale / scale);
            scale = newScale;
            
            translateX += (currentCenterX - startPanX) - translateX;
            translateY += (currentCenterY - startPanY) - translateY;

            applyTransform();
        } else if (drawing && activePointers.size === 1) {
            extendPath(toSvgCoords(e));
        }
    });

    const pointerUpOrCancel = (e) => {
        if (activePointers.has(e.pointerId)) {
            activePointers.delete(e.pointerId);
        }
        if (activePointers.size === 0) {
            drawing = false;
            isGestureActive = false;
            currentPath = null;
            currentPoints = [];
        } else if (activePointers.size === 1 && isGestureActive) {
            const pointer = Array.from(activePointers.values())[0];
            startPanX = pointer.x - translateX;
            startPanY = pointer.y - translateY;
        }
    };

    svg.addEventListener('pointerup', pointerUpOrCancel);
    svg.addEventListener('pointercancel', pointerUpOrCancel);

    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        const rect = svg.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;
        
        const newScale = Math.min(Math.max(scale * delta, 1), 20);
        translateX -= (mouseX * rect.width) * (newScale - scale);
        translateY -= (mouseY * rect.height) * (newScale - scale);
        scale = newScale;
        applyTransform();
    }, { passive: false });

    resetZoomBtn.addEventListener('click', () => {
        scale = 1; translateX = 0; translateY = 0;
        applyTransform();
    });

    // --- UI ---
    clearBtn.addEventListener('click', () => { drawLayer.innerHTML = ''; });
    brushSizeInput.addEventListener('input', () => { brushSizeValue.textContent = brushSizeInput.value; });
    
    paddingSizeInput.addEventListener('input', (e) => {
        paddingSizeValue.textContent = e.target.value + '%';
        updateGrid();
    });
    headCountInput.addEventListener('input', (e) => {
        headCountValue.textContent = e.target.value;
        updateGrid();
    });
    showGridInput.addEventListener('change', updateGrid);

    updateGrid();

    // --- Экспорт ---
    // При экспорте мы собираем все 3 слоя в один SVG-файл
    async function getExportSvgString() {
        // Создаем чистый SVG размером 4096х4096
        const exportSvg = document.createElementNS(SVG_NS, 'svg');
        exportSvg.setAttribute('xmlns', SVG_NS);
        exportSvg.setAttribute('width', '4096');
        exportSvg.setAttribute('height', '4096');
        exportSvg.setAttribute('viewBox', '0 0 1 1');

        // 1. Слой фона
        const bgRect = document.createElementNS(SVG_NS, 'rect');
        bgRect.setAttribute('x', '0');
        bgRect.setAttribute('y', '0');
        bgRect.setAttribute('width', '1');
        bgRect.setAttribute('height', '1');
        bgRect.setAttribute('fill', bgColorInput.value);
        exportSvg.appendChild(bgRect);

        // 2. Слой подложки
        if (currentBgSrc) {
            const imgEl = document.createElementNS(SVG_NS, 'image');
            imgEl.setAttribute('href', currentBgSrc);
            
            const s = Number(bgScale.value) / 100;
            const w = s, h = s;
            const x = 0.5 - w/2, y = 0.5 - h/2;
            
            imgEl.setAttribute('x', x);
            imgEl.setAttribute('y', y);
            imgEl.setAttribute('width', w);
            imgEl.setAttribute('height', h);
            imgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            imgEl.setAttribute('opacity', Number(bgOpacity.value) / 100);
            exportSvg.appendChild(imgEl);
        }

        // 3. Слой разметки и рисования (клонируем из текущего SVG)
        const measureClone = measureLayer.cloneNode(true);
        const drawClone = drawLayer.cloneNode(true);
        drawClone.querySelectorAll('[data-eraser]').forEach(el => el.removeAttribute('data-eraser'));
        
        exportSvg.appendChild(measureClone);
        exportSvg.appendChild(drawClone);

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(exportSvg);
        return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + source;
    }

    downloadSvgBtn.addEventListener('click', async () => {
        const source = await getExportSvgString();
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, 'drawing.svg');
    });

    downloadPngBtn.addEventListener('click', async () => {
        const source = await getExportSvgString();
        const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = PNG_SIZE; canvas.height = PNG_SIZE;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, PNG_SIZE, PNG_SIZE);
            URL.revokeObjectURL(url);

            canvas.toBlob((blob) => {
                downloadBlob(blob, 'drawing-4096.png');
            }, 'image/png');
        };
        img.onerror = () => {
            alert('Ошибка при создании PNG. Браузер заблокировал рендеринг картинки (CORS/taint).');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
})();
