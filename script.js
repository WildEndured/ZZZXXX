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

    let drawing = false;
    let currentPath = null;
    let currentPoints = [];

    // Пересчёт координат клиента в координаты SVG (viewBox 0..4096)
    function toSvgCoords(e) {
        const rect = svg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 4096;
        const y = ((e.clientY - rect.top) / rect.height) * 4096;
        return { x, y };
    }

    function startPath(p) {
        currentPath = document.createElementNS(SVG_NS, 'path');
        const color = eraserMode.checked ? bgColorInput.value : brushColorInput.value;
        currentPath.setAttribute('fill', 'none');
        currentPath.setAttribute('stroke', color);
        currentPath.setAttribute('stroke-width', brushSizeInput.value);
        currentPath.setAttribute('stroke-linecap', 'round');
        currentPath.setAttribute('stroke-linejoin', 'round');
        if (eraserMode.checked) {
            currentPath.setAttribute('data-eraser', 'true');
        }
        currentPoints = [p];
        currentPath.setAttribute('d', `M ${p.x} ${p.y}`);
        drawLayer.appendChild(currentPath);
    }

    function extendPath(p) {
        if (!currentPath) return;
        currentPoints.push(p);
        // Сглаживание: квадратичные кривые через середины точек
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

    // --- Touch ---
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
    clearBtn.addEventListener('click', () => {
        drawLayer.innerHTML = '';
    });

    bgColorInput.addEventListener('input', () => {
        bgRect.setAttribute('fill', bgColorInput.value);
    });

    brushSizeInput.addEventListener('input', () => {
        brushSizeValue.textContent = brushSizeInput.value;
    });

    // --- Экспорт SVG ---
    downloadSvgBtn.addEventListener('click', () => {
        // Клонируем SVG без временных атрибутов
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', SVG_NS);
        clone.setAttribute('width', '4096');
        clone.setAttribute('height', '4096');
        clone.setAttribute('viewBox', '0 0 4096 4096');

        // Убираем служебные атрибуты ластика
        clone.querySelectorAll('[data-eraser]').forEach(el => {
            el.removeAttribute('data-eraser');
        });

        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(clone);
        // Добавляем XML-декларацию и DPI-метаданные через комментарий
        source = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
                 `<!-- Canvas 4096x4096, 300 DPI (14.47 x 14.47 inch) -->\n` +
                 source;

        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, 'drawing-4096.svg');
    });

    // --- Экспорт PNG (растеризация SVG) ---
    downloadPngBtn.addEventListener('click', () => {
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', SVG_NS);
        clone.setAttribute('width', '4096');
        clone.setAttribute('height', '4096');
        clone.setAttribute('viewBox', '0 0 4096 4096');
        clone.querySelectorAll('[data-eraser]').forEach(el => el.removeAttribute('data-eraser'));

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clone);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 4096;
            canvas.height = 4096;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 4096, 4096);
            URL.revokeObjectURL(url);

            canvas.toBlob((blob) => {
                downloadBlob(blob, 'drawing-4096-300dpi.png');
            }, 'image/png');
        };
        img.onerror = () => {
            alert('Не удалось растеризовать SVG в PNG.');
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
