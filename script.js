(function() {
    'use strict';

    // ============================================================
    // 1. ИНИЦИАЛИЗАЦИЯ И DOM
    // ============================================================
    const zoomContainer = document.getElementById('zoomContainer');
    const bgLayer = document.getElementById('bgLayer');
    const bgImage = document.getElementById('bgImage');
    const drawSvg = document.getElementById('drawSvg');
    const drawGroup = document.getElementById('drawGroup');
    const gridGroup = document.getElementById('gridGroup');

    const brushSizeInput = document.getElementById('brushSize');
    const undoBtn = document.getElementById('undoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const loadImgBtn = document.getElementById('loadImgBtn');
    const fileInput = document.getElementById('fileInput');
    const bgScaleInput = document.getElementById('bgScale');
    const bgOpacityInput = document.getElementById('bgOpacity');
    const bgColorInput = document.getElementById('bgColor');
    const marginTopInput = document.getElementById('marginTop');
    const headsCountInput = document.getElementById('headsCount');
    const downloadSvgBtn = document.getElementById('downloadSvgBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');

    // ============================================================
    // 2. СОСТОЯНИЕ
    // ============================================================
    const state = {
        scale: 1,
        translateX: 0,
        translateY: 0,
        minScale: 1,
        maxScale: 20,

        isDrawing: false,
        currentPath: null,
        currentPoints: [],
        brushSize: 0.005,
        isEraser: false,

        bgImageData: null,
        bgScale: 1, // 1 = 100%
        bgOpacity: 1,
        bgColor: '#ffffff',

        marginTop: 5,
        headsCount: 4,

        pointers: new Map(),
        isPinching: false,
        pinchStartDist: 0,
        pinchStartScale: 1,
        pinchStartCenter: { x: 0, y: 0 },
        pinchStartTranslate: { x: 0, y: 0 },

        isPanning: false,
        panStart: { x: 0, y: 0 },
        panStartTranslate: { x: 0, y: 0 },

        drawPointerId: null
    };

    // ============================================================
    // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================

    function getSvgCoords(clientX, clientY) {
        const rect = drawSvg.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    }

    function applyTransform() {
        zoomContainer.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
    }

    function clampPan() {
        const wrapper = zoomContainer.parentElement;
        const parentRect = wrapper.getBoundingClientRect();
        
        // Базовый размер контейнера (до масштабирования)
        const baseW = zoomContainer.offsetWidth;
        const baseH = zoomContainer.offsetHeight;
        if (!baseW || !baseH) return;

        const scaledW = baseW * state.scale;
        const scaledH = baseH * state.scale;

        let minX, maxX, minY, maxY;

        // Если холст меньше обертки — центрируем
        if (scaledW <= parentRect.width) {
            minX = maxX = (parentRect.width - scaledW) / 2;
        } else {
            minX = parentRect.width - scaledW;
            maxX = 0;
        }

        if (scaledH <= parentRect.height) {
            minY = maxY = (parentRect.height - scaledH) / 2;
        } else {
            minY = parentRect.height - scaledH;
            maxY = 0;
        }

        state.translateX = Math.max(minX, Math.min(maxX, state.translateX));
        state.translateY = Math.max(minY, Math.min(maxY, state.translateY));
    }

    function updateTransform() {
        clampPan();
        applyTransform();
    }

    // ============================================================
    // 4. ЗУМ И ПАНОРАМИРОВАНИЕ
    // ============================================================

    zoomContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = -e.deltaY;
        const zoomFactor = 1.1;
        let newScale = state.scale * (delta > 0 ? zoomFactor : 1 / zoomFactor);
        newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));

        const rect = zoomContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const containerX = (mouseX - state.translateX) / state.scale;
        const containerY = (mouseY - state.translateY) / state.scale;

        state.translateX = mouseX - containerX * newScale;
        state.translateY = mouseY - containerY * newScale;
        state.scale = newScale;

        updateTransform();
    }, { passive: false });

    zoomContainer.addEventListener('pointerdown', (e) => {
        state.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (state.pointers.size === 2 && state.isDrawing) {
            cancelDrawing();
        }

        if (state.pointers.size === 2) {
            e.preventDefault();
            state.isPinching = true;
            state.isDrawing = false;
            const pts = Array.from(state.pointers.values());
            state.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            state.pinchStartScale = state.scale;
            state.pinchStartCenter = {
                x: (pts[0].x + pts[1].x) / 2,
                y: (pts[0].y + pts[1].y) / 2
            };
            state.pinchStartTranslate = { x: state.translateX, y: state.translateY };
            return;
        }

        if (state.pointers.size === 1) {
            // Панорамирование: средняя кнопка или Shift+ЛКМ
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                e.preventDefault();
                state.isPanning = true;
                state.panStart = { x: e.clientX, y: e.clientY };
                state.panStartTranslate = { x: state.translateX, y: state.translateY };
                return;
            }
            // Рисование
            if (e.button === 0 || e.pointerType === 'touch') {
                e.preventDefault();
                startDrawing(e);
            }
        }
    });

    zoomContainer.addEventListener('pointermove', (e) => {
        if (!state.pointers.has(e.pointerId)) return;
        state.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (state.isPinching && state.pointers.size === 2) {
            e.preventDefault();
            const pts = Array.from(state.pointers.values());
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            const center = {
                x: (pts[0].x + pts[1].x) / 2,
                y: (pts[0].y + pts[1].y) / 2
            };

            let newScale = state.pinchStartScale * (dist / state.pinchStartDist);
            newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));

            const rect = zoomContainer.getBoundingClientRect();
            const centerX = center.x - rect.left;
            const centerY = center.y - rect.top;
            const startCenterX = state.pinchStartCenter.x - rect.left;
            const startCenterY = state.pinchStartCenter.y - rect.top;

            const containerX = (startCenterX - state.pinchStartTranslate.x) / state.pinchStartScale;
            const containerY = (startCenterY - state.pinchStartTranslate.y) / state.pinchStartScale;

            state.translateX = centerX - containerX * newScale;
            state.translateY = centerY - containerY * newScale;
            state.scale = newScale;

            updateTransform();
            return;
        }

        if (state.isPanning) {
            e.preventDefault();
            const dx = e.clientX - state.panStart.x;
            const dy = e.clientY - state.panStart.y;
            state.translateX = state.panStartTranslate.x + dx;
            state.translateY = state.panStartTranslate.y + dy;
            updateTransform();
            return;
        }

        if (state.isDrawing && e.pointerId === state.drawPointerId) {
            e.preventDefault();
            continueDrawing(e);
        }
    });

    const onPointerEnd = (e) => {
        state.pointers.delete(e.pointerId);
        if (state.isPinching && state.pointers.size < 2) state.isPinching = false;
        if (state.isPanning) state.isPanning = false;
        if (state.isDrawing && e.pointerId === state.drawPointerId) endDrawing();
        if (state.pointers.size === 0) {
            state.isPinching = false;
            state.isPanning = false;
        }
    };

    zoomContainer.addEventListener('pointerup', onPointerEnd);
    zoomContainer.addEventListener('pointercancel', (e) => {
        if (state.isDrawing && e.pointerId === state.drawPointerId) cancelDrawing();
        onPointerEnd(e);
    });

    // ============================================================
    // 5. РИСОВАНИЕ
    // ============================================================

    function startDrawing(e) {
        if (state.isDrawing) return;
        state.isDrawing = true;
        state.drawPointerId = e.pointerId;
        state.currentPoints = [];

        const coords = getSvgCoords(e.clientX, e.clientY);
        state.currentPoints.push(coords);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', state.isEraser ? state.bgColor : '#000000');
        path.setAttribute('stroke-width', state.brushSize);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        drawGroup.appendChild(path);
        state.currentPath = path;
        updatePath();
    }

    function continueDrawing(e) {
        if (!state.isDrawing || !state.currentPath) return;
        state.currentPoints.push(getSvgCoords(e.clientX, e.clientY));
        updatePath();
    }

    function updatePath() {
        if (!state.currentPath || state.currentPoints.length < 2) return;
        const pts = state.currentPoints;
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const xc = (pts[i - 1].x + pts[i].x) / 2;
            const yc = (pts[i - 1].y + pts[i].y) / 2;
            d += ` Q ${pts[i - 1].x} ${pts[i - 1].y} ${xc} ${yc}`;
        }
        if (pts.length > 1) d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
        state.currentPath.setAttribute('d', d);
    }

    function endDrawing() {
        state.isDrawing = false;
        state.drawPointerId = null;
        state.currentPath = null;
        state.currentPoints = [];
    }

    function cancelDrawing() {
        if (state.currentPath) state.currentPath.remove();
        state.isDrawing = false;
        state.drawPointerId = null;
        state.currentPath = null;
        state.currentPoints = [];
    }

    // ============================================================
    // 6. ИНТЕРФЕЙС
    // ============================================================

    undoBtn.addEventListener('click', () => {
        const paths = drawGroup.querySelectorAll('path');
        if (paths.length > 0) paths[paths.length - 1].remove();
    });

    clearBtn.addEventListener('click', () => drawGroup.innerHTML = '');

    brushSizeInput.addEventListener('input', (e) => {
        state.brushSize = parseFloat(e.target.value);
    });

    // ============================================================
    // 7. ПОДЛОЖКА И ФОН
    // ============================================================

    loadImgBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            state.bgImageData = ev.target.result;
            bgImage.src = state.bgImageData;
            bgImage.style.display = 'block';
            updateBgImage();
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    });

    function updateBgImage() {
        if (!state.bgImageData) return;
        // 100% = высота картинки равна высоте холста
        bgImage.style.height = `${state.bgScale * 100}%`;
        bgImage.style.opacity = state.bgOpacity;
    }

    bgScaleInput.addEventListener('input', (e) => {
        state.bgScale = parseFloat(e.target.value) / 100;
        updateBgImage();
    });

    bgOpacityInput.addEventListener('input', (e) => {
        state.bgOpacity = parseFloat(e.target.value) / 100;
        updateBgImage();
    });

    bgColorInput.addEventListener('input', (e) => {
        state.bgColor = e.target.value;
        bgLayer.style.backgroundColor = state.bgColor;
    });

    // ============================================================
    // 8. СЕТКА
    // ============================================================

    function updateGrid() {
        gridGroup.innerHTML = '';
        const margin = state.marginTop / 100;
        const heads = state.headsCount;
        const zoneTop = margin;
        const zoneHeight = 1 - margin * 2;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', zoneTop);
        rect.setAttribute('width', '1');
        rect.setAttribute('height', zoneHeight);
        rect.classList.add('grid-border');
        gridGroup.appendChild(rect);

        for (let i = 1; i < heads; i++) {
            const y = zoneTop + (zoneHeight * i) / heads;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', y);
            line.setAttribute('x2', '1');
            line.setAttribute('y2', y);
            line.classList.add('grid-line');
            gridGroup.appendChild(line);
        }
    }

    marginTopInput.addEventListener('input', (e) => {
        state.marginTop = parseFloat(e.target.value);
        updateGrid();
    });

    headsCountInput.addEventListener('input', (e) => {
        state.headsCount = parseInt(e.target.value);
        updateGrid();
    });

    // ============================================================
    // 9. ЭКСПОРТ
    // ============================================================

    function buildExportSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('viewBox', '0 0 1 1');
        svg.setAttribute('width', '4096');
        svg.setAttribute('height', '4096');

        // Фон
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', '1');
        bgRect.setAttribute('height', '1');
        bgRect.setAttribute('fill', state.bgColor);
        svg.appendChild(bgRect);

        // Подложка
        if (state.bgImageData && bgImage.naturalWidth) {
            const aspect = bgImage.naturalWidth / bgImage.naturalHeight;
            const imgHeight = state.bgScale;
            const imgWidth = imgHeight * aspect;
            const x = (1 - imgWidth) / 2;
            
            const imageEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            imageEl.setAttribute('x', x);
            imageEl.setAttribute('y', '0');
            imageEl.setAttribute('width', imgWidth);
            imageEl.setAttribute('height', imgHeight);
            imageEl.setAttribute('opacity', state.bgOpacity);
            imageEl.setAttribute('preserveAspectRatio', 'none');
            imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', state.bgImageData);
            svg.appendChild(imageEl);
        }

        // Пути
        drawGroup.querySelectorAll('path').forEach(p => {
            svg.appendChild(p.cloneNode(true));
        });

        return svg;
    }

    downloadSvgBtn.addEventListener('click', () => {
        const svgString = new XMLSerializer().serializeToString(buildExportSVG());
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drawing.svg';
        a.click();
        URL.revokeObjectURL(url);
    });

    downloadPngBtn.addEventListener('click', () => {
        const svgString = new XMLSerializer().serializeToString(buildExportSVG());
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 4096;
            canvas.height = 4096;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 4096, 4096);

            canvas.toBlob((pngBlob) => {
                const pngUrl = URL.createObjectURL(pngBlob);
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = 'drawing.png';
                a.click();
                URL.revokeObjectURL(pngUrl);
                URL.revokeObjectURL(url);
            }, 'image/png');
        };
        img.src = url;
    });

    // ============================================================
    // 10. СТАРТ
    // ============================================================
    bgLayer.style.backgroundColor = state.bgColor;
    updateGrid();
    
    // Первичный расчет трансформации после полной загрузки DOM
    setTimeout(updateTransform, 50);
    window.addEventListener('resize', updateTransform);

})();
