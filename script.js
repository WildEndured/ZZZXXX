(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.getElementById('mainSvg');
    const zoomContainer = document.getElementById('zoomContainer');
    const drawLayer = document.getElementById('drawLayer');
    const measureLayer = document.getElementById('measureLayer');
    const bgRect = document.getElementById('bgRect');

    const clearBtn = document.getElementById('clearBtn');
    const downloadSvgBtn = document.getElementById('downloadSvgBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');
    
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

    // --- Состояние зума и панорамирования ---
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isPanning = false;
    let startPanX = 0;
    let startPanY = 0;
    let initialPinchDistance = 0;
    let initialScale = 1;

    // --- Разметка (Поля и Головы) ---
    function updateGrid() {
        measureLayer.innerHTML = '';

        if (!showGridInput.checked) return;

        const paddingPercent = Number(paddingSizeInput.value) / 100;
        const heads = Number(headCountInput.value);

        const topY = paddingPercent;
        const bottomY = 1 - paddingPercent;
        const drawingHeight = bottomY - topY;
        
        const headStep = drawingHeight / heads;

        // 1. Пунктирные линии для "голов"
        for (let i = 0; i <= heads; i++) {
            const y = topY + (i * headStep);
            
            const line = document.createElementNS(SVG_NS, 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', y);
            line.setAttribute('x2', '1');
            line.setAttribute('y2', y);
            
            line.setAttribute('stroke', '#000000');
            line.setAttribute('stroke-width', '0.002'); 
            // Увеличили контрастность пунктира
            line.setAttribute('stroke-dasharray', '0.015, 0.015'); 
            line.setAttribute('opacity', '0.6'); 
            
            measureLayer.appendChild(line);
        }

        // 2. Рамка зоны рисования
        if (paddingPercent > 0) {
            const borderRect = document.createElementNS(SVG_NS, 'rect');
            borderRect.setAttribute('x', '0');
            borderRect.setAttribute('y', topY);
            borderRect.setAttribute('width', '1');
            borderRect.setAttribute('height', drawingHeight);
            borderRect.setAttribute('fill', 'none');
            borderRect.setAttribute('stroke', '#ff4444'); 
            borderRect.setAttribute('stroke-width', '0.003');
            borderRect.setAttribute('opacity', '0.8');
            measureLayer.appendChild(borderRect);
        }
    }

    // --- Перевод координат мыши/тача в SVG с учетом зума ---
    function toSvgCoords(e) {
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

        // Берем координаты клиента и вычитаем левый верхний угол SVG на экране
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        return {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y))
        };
    }

    function getStrokeWidth() {
        const v = Number(brushSizeInput.value); 
        return v / 4000; 
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

    // --- Логика Зума и Панорамирования (Мышь) ---
    svg.addEventListener('mousedown', (e) => {
        e.preventDefault();
        // Если зажат пробел или средняя кнопка мыши - панорамируем
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

    // Масштабирование колесиком мыши
    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        
        // Зум относительно курсора
        const rect = svg.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;

        const newScale = Math.max(1, Math.min(scale * delta, 20)); // Лимит от 1 до 20x
        
        translateX -= (mouseX * rect.width) * (newScale - scale);
        translateY -= (mouseY * rect.height) * (newScale - scale);
        
        scale = newScale;
        applyTransform();
    }, { passive: false });


    // --- Логика Тач-событий (Зум двумя пальцами и рисование) ---
    let touchMode = 'none'; // 'draw' или 'pan'

    svg.addEventListener('touchstart', (e) => {
        e.preventDefault();
        
        if (e.touches.length === 2) {
            // Два пальца -> Зум/Панорамирование
            touchMode = 'pan';
            drawing = false; // Останавливаем рисование
            currentPath = null;
            
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            initialPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            initialScale = scale;
            
            startPanX = (t1.clientX + t2.clientX) / 2 - translateX;
            startPanY = (t1.clientY + t2.clientY) / 2 - translateY;
            
        } else if (e.touches.length === 1 && touchMode !== 'pan') {
            // Один палец -> Рисование
            touchMode = 'draw';
            const t = e.touches[0];
            drawing = true;
            startPath(toSvgCoords(t));
        }
    }, { passive: false });

    svg.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        if (touchMode === 'pan' && e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            
            // Вычисляем новый масштаб
            const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            let newScale = initialScale * (currentDistance / initialPinchDistance);
            newScale = Math.max(1, Math.min(newScale, 20)); // Лимит от 1 до 20x
            
            // Центр между пальцами
            const centerX = (t1.clientX + t2.clientX) / 2;
            const centerY = (t1.clientY + t2.clientY) / 2;

            // Формула для зума относительно центра
            translateX = centerX - (centerX - translateX) * (newScale / scale);
            translateY = centerY - (centerY - translateY) * (newScale / scale);
            
            // Добавляем панорамирование (движение двумя пальцами)
            const newCenterX = centerX - startPanX;
            const newCenterY = centerY - startPanY;
            
            // Мы просто применяем зум, а панорамирование идет за счет смещения центра
            scale = newScale;
            translateX += (newCenterX - translateX) * 0.1; // Плавное смещение
            translateY += (newCenterY - translateY) * 0.1;
            
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
        } else if (e.touches.length === 1) {
            // Если остался один палец после зума, можно продолжить рисовать (но лучше сбросить)
            touchMode = 'none';
        }
    }, { passive: false });

    function applyTransform() {
        zoomContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    resetZoomBtn.addEventListener('click', () => {
        scale = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
    });

    // --- UI ---
    clearBtn.addEventListener('click', () => { drawLayer.innerHTML = ''; });

    bgColorInput.addEventListener('input', () => {
        bgRect.setAttribute('fill', bgColorInput.value);
    });

    brushSizeInput.addEventListener('input', () => {
        brushSizeValue.textContent = brushSizeInput.value;
    });

    paddingSizeInput.addEventListener('input', (e) => {
        paddingSizeValue.textContent = e.target.value + '%';
        updateGrid();
    });

    headCountInput.addEventListener('input', (e) => {
        headCountValue.textContent = e.target.value;
        updateGrid();
    });

    showGridInput.addEventListener('change', updateGrid);

    // Инициализация
    updateGrid();

    // --- Экспорт ---
    downloadSvgBtn.addEventListener('click', () => {
        // Клонируем, но перед этим сбрасываем зум для экспорта!
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
        downloadBlob(blob, 'drawing-with-grid.svg');
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
            canvas.width = PNG_SIZE;
            canvas.height = PNG_SIZE;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = bgColorInput.value;
            ctx.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
            ctx.drawImage(img, 0, 0, PNG_SIZE, PNG_SIZE);
            URL.revokeObjectURL(url);

            canvas.toBlob((blob) => {
                downloadBlob(blob, 'drawing-4096x4096.png');
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
