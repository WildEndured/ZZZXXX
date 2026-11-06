(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.getElementById('mainSvg');
    const zoomContainer = document.getElementById('zoomContainer');
    const drawLayer = document.getElementById('drawLayer');
    const measureLayer = document.getElementById('measureLayer');
    const bgRect = document.getElementById('bgRect');
    const bgImage = document.getElementById('bgImage');

    const clearBtn = document.getElementById('clearBtn');
    const downloadSvgBtn = document.getElementById('downloadSvgBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');
    
    // Элементы подложки
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

    // --- Зум ---
    let scale = 1, translateX = 0, translateY = 0;
    let isPanning = false, startPanX = 0, startPanY = 0;
    let initialPinchDistance = 0, initialScale = 1;

    // --- Подложка ---
    function updateBgStyle() {
        const opacity = Number(bgOpacity.value) / 100;
        const scaleVal = Number(bgScale.value) / 100;
        
        bgOpacityValue.textContent = bgOpacity.value + '%';
        bgScaleValue.textContent = bgScale.value + '%';
        
        bgImage.setAttribute('opacity', opacity);
        
        // Масштабирование подложки относительно центра (0.5, 0.5)
        const w = scaleVal;
        const h = scaleVal;
        const x = 0.5 - w / 2;
        const y = 0.5 - h / 2;
        
        bgImage.setAttribute('x', x);
        bgImage.setAttribute('y', y);
        bgImage.setAttribute('width', w);
        bgImage.setAttribute('height', h);
    }

    uploadBg.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            bgImage.setAttribute('href', event.target.result);
            bgImage.style.display = 'block';
            bgControls.style.display = 'flex';
            removeBgBtn.style.display = 'inline-block';
            
            // Сбрасываем ползунки при новой загрузке
            bgOpacity.value = 100;
            bgScale.value = 100;
            updateBgStyle();
        };
        reader.readAsDataURL(file);
        
        // Очищаем инпут, чтобы можно было загрузить тот же файл снова
        e.target.value = '';
    });

    removeBgBtn.addEventListener('click', () => {
        bgImage.removeAttribute('href');
        bgImage.style.display = 'none';
        bgControls.style.display = 'none';
        removeBgBtn.style.display = 'none';
    });

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

    // --- Мышь ---
    svg.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (e.button === 1 || e.shiftKey) {
            isPanning = true;
            startPanX = e.clientX - translateX;
            startPanY = e.clientY - translateY;
            zoomContainer.style.cursor = 'grabbing';
        } else {
            drawing = true;
            startPath(toSvgCoords(e));
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isPanning) {
            translateX = e.clientX - startPanX;
            translateY = e.clientY - startPanY;
            applyTransform();
        } else if (drawing) {
            extendPath(toSvgCoords(e));
        }
    });

    window.addEventListener('mouseup', () => {
        drawing = false;
        isPanning = false;
        zoomContainer.style.cursor = 'default';
        currentPath = null;
        currentPoints = [];
    });

    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        const rect = svg.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;
        const newScale = Math.max(1, Math.min(scale * delta, 20));
        translateX -= (mouseX * rect.width) * (newScale - scale);
        translateY -= (mouseY * rect.height) * (newScale - scale);
        scale = newScale;
        applyTransform();
    }, { passive: false });

    // --- Тач ---
    let touchMode = 'none';

    svg.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length === 2) {
            touchMode = 'pan';
            drawing = false;
            currentPath = null;
            const t1 = e.touches[0], t2 = e.touches[1];
            initialPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            initialScale = scale;
            startPanX = (t1.clientX + t2.clientX) / 2 - translateX;
            startPanY = (t1.clientY + t2.clientY) / 2 - translateY;
        } else if (e.touches.length === 1 && touchMode !== 'pan') {
            touchMode = 'draw';
            const t = e.touches[0];
            drawing = true;
            startPath(toSvgCoords(t));
        }
    }, { passive: false });

    svg.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (touchMode === 'pan' && e.touches.length === 2) {
            const t1 = e.touches[0], t2 = e.touches[1];
            const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            let newScale = initialScale * (currentDistance / initialPinchDistance);
            newScale = Math.max(1, Math.min(newScale, 20));
            const centerX = (t1.clientX + t2.clientX) / 2;
            const centerY = (t1.clientY + t2.clientY) / 2;
            translateX = centerX - (centerX - translateX) * (newScale / scale);
            translateY = centerY - (centerY - translateY) * (newScale / scale);
            scale = newScale;
            applyTransform();
        } else if (touchMode === 'draw' && e.touches.length === 1 && drawing) {
            const t = e.touches[0];
            extendPath(toSvgCoords(t));
        }
    }, { passive: false });

    svg.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (e.touches.length === 0) {
            touchMode = 'none';
            drawing = false;
            currentPath = null;
            currentPoints = [];
        }
    }, { passive: false });

    function applyTransform() {
        zoomContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    resetZoomBtn.addEventListener('click', () => {
        scale = 1; translateX = 0; translateY = 0;
        applyTransform();
    });

    // --- UI ---
    clearBtn.addEventListener('click', () => { drawLayer.innerHTML = ''; });
    bgColorInput.addEventListener('input', () => { bgRect.setAttribute('fill', bgColorInput.value); });
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
    downloadSvgBtn.addEventListener('click', () => {
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', SVG_NS);
        clone.setAttribute('width', '4096');
        clone.setAttribute('height', '4096');
        clone.setAttribute('viewBox', '0 0 1 1');
        clone.querySelectorAll('[data-eraser]').forEach(el => el.removeAttribute('data-eraser'));

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(clone);
        source = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + source;

        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, 'drawing.svg');
    });

    downloadPngBtn.addEventListener('click', () => {
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', SVG_NS);
        clone.setAttribute('width', PNG_SIZE);
        clone.setAttribute('height', PNG_SIZE);
        clone.setAttribute('viewBox', '0 0 1 1');
        clone.querySelectorAll('[data-eraser]').forEach(el => el.removeAttribute('data-eraser'));

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clone);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = PNG_SIZE; canvas.height = PNG_SIZE;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = bgColorInput.value;
            ctx.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
            ctx.drawImage(img, 0, 0, PNG_SIZE, PNG_SIZE);
            URL.revokeObjectURL(url);

            canvas.toBlob((blob) => {
                downloadBlob(blob, 'drawing-4096.png');
            }, 'image/png');
        };
        img.onerror = () => {
            alert('Ошибка при создании PNG.');
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
