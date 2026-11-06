(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = document.getElementById('mainSvg');
    const drawLayer = document.getElementById('drawLayer');
    const bgRect = document.getElementById('bgRect');

    const clearBtn = document.getElementById('clearBtn');
    const downloadSvgBtn = document.getElementById('downloadSvgBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const bgColorInput = document.getElementById('bgColor');
    const brushColorInput = document.getElementById('brushColor');
    const brushSizeInput = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');
    const eraserMode = document.getElementById('eraserMode');

    const PNG_SIZE = 4096; // Жестко 4096х4096 для экспорта

    let drawing = false;
    let currentPath = null;
    let currentPoints = [];

    // Перевод координат мыши/пальца в систему viewBox (от 0 до 1)
    function toSvgCoords(e) {
        const rect = svg.getBoundingClientRect();
        // На случай если ширина или высота контейнера 0
        if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        return {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y))
        };
    }

    // Перевод толщины кисти (1-100) в единицы viewBox 0..1
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

    // --- Мышь ---
    svg.addEventListener('mousedown', (e) => {
        e.preventDefault();
        drawing = true;
        startPath(toSvgCoords(e));
    });
    svg.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        extendPath(toSvgCoords(e));
    });
    window.addEventListener('mouseup', () => {
        drawing = false;
        currentPath = null;
        currentPoints = [];
    });

    // --- Тач (мобилки) ---
    svg.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        drawing = true;
        startPath(toSvgCoords(t));
    }, { passive: false });

    svg.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!drawing) return;
        const t = e.touches[0];
        extendPath(toSvgCoords(t));
    }, { passive: false });

    svg.addEventListener('touchend', (e) => {
        e.preventDefault();
        drawing = false;
        currentPath = null;
        currentPoints = [];
    }, { passive: false });

    // --- UI ---
    clearBtn.addEventListener('click', () => { drawLayer.innerHTML = ''; });

    bgColorInput.addEventListener('input', () => {
        bgRect.setAttribute('fill', bgColorInput.value);
    });

    brushSizeInput.addEventListener('input', () => {
        brushSizeValue.textContent = brushSizeInput.value;
    });

    // --- Экспорт SVG ---
    downloadSvgBtn.addEventListener('click', () => {
        const clone = svg.cloneNode(true);
        // Для скачивания задаем реальные размеры 4096х4096, чтобы файл открывался нормально
        clone.setAttribute('xmlns', SVG_NS);
        clone.setAttribute('width', '4096');
        clone.setAttribute('height', '4096');
        clone.setAttribute('viewBox', '0 0 1 1');
        
        clone.querySelectorAll('[data-eraser]').forEach(el => el.removeAttribute('data-eraser'));

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(clone);
        source = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + source;

        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, 'drawing-1x1-4096.svg');
    });

    // --- Экспорт PNG 4096x4096 ---
    downloadPngBtn.addEventListener('click', () => {
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', SVG_NS);
        // Принудительно задаем размер 4096х4096 для растеризации
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
            // Заливаем фон на случай прозрачности
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
