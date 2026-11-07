(function () {
    'use strict';

    // ===== Константы =====
    const CANVAS_SIZE = 4096;
    const DPI = 300;
    const HISTORY_LIMIT = 15;

    // ===== DOM =====
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    const container = document.getElementById('canvas-container');
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnClear = document.getElementById('btn-clear');
    const btnEraser = document.getElementById('btn-eraser');
    const btnDownload = document.getElementById('btn-download');
    const colorPicker = document.getElementById('color-picker');
    const brushSize = document.getElementById('brush-size');
    const sizeLabel = document.getElementById('size-label');
    const coordInfo = document.getElementById('coord-info');
    const zoomInfo = document.getElementById('zoom-info');

    // ===== Состояние =====
    let drawing = false;
    let eraserMode = false;
    let lastX = 0;
    let lastY = 0;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let viewScale = 1;   // масштаб отображения
    let viewX = 0;
    let viewY = 0;
    let history = [];
    let historyIndex = -1;
    let isPanning = false;
    let pinchDist = 0;
    let panStartX = 0;
    let panStartY = 0;
    let panStartViewX = 0;
    let panStartViewY = 0;
    let activePointers = new Map();

    // ===== Инициализация холста =====
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // ===== Управление масштабом отображения =====
    function fitCanvasToScreen() {
        const rect = container.getBoundingClientRect();
        viewScale = Math.min(rect.width / CANVAS_SIZE, rect.height / CANVAS_SIZE) * 0.95;
        viewX = 0;
        viewY = 0;
        applyView();
    }

    function applyView() {
        const w = CANVAS_SIZE * viewScale;
        const h = CANVAS_SIZE * viewScale;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.style.transform = `translate(${viewX}px, ${viewY}px)`;
        zoomInfo.textContent = Math.round(viewScale * 100) + '%';
    }

    // ===== Преобразование координат =====
    function screenToCanvas(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left) / (rect.width) * CANVAS_SIZE;
        const y = (clientY - rect.top) / (rect.height) * CANVAS_SIZE;
        return { x: Math.max(0, Math.min(CANVAS_SIZE, x)), y: Math.max(0, Math.min(CANVAS_SIZE, y)) };
    }

    // ===== История =====
    function saveState() {
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        try {
            history.push(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
            if (history.length > HISTORY_LIMIT) history.shift();
            historyIndex = history.length - 1;
        } catch (e) {
            console.warn('История переполнена', e);
        }
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            ctx.putImageData(history[historyIndex], 0, 0);
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            ctx.putImageData(history[historyIndex], 0, 0);
        }
    }

    // ===== Рисование =====
    function startDraw(x, y) {
        drawing = true;
        lastX = x;
        lastY = y;
        ctx.beginPath();
        ctx.arc(x, y, getBrushSize() / 2, 0, Math.PI * 2);
        ctx.fillStyle = eraserMode ? '#ffffff' : colorPicker.value;
        ctx.fill();
    }

    function draw(x, y) {
        if (!drawing) return;
        ctx.beginPath();
        ctx.lineWidth = getBrushSize();
        ctx.strokeStyle = eraserMode ? '#ffffff' : colorPicker.value;
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        // круглые окончания уже заданы через lineCap
        lastX = x;
        lastY = y;
    }

    function getBrushSize() {
        return parseInt(brushSize.value, 10) * 4; // масштаб под 4096px
    }

    // ===== События указателей =====
    function getPointerPos(e) {
        const t = e.touches ? e.touches[0] : e;
        return screenToCanvas(t.clientX, t.clientY);
    }

    // --- Мышь ---
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            const p = getPointerPos(e);
            startDraw(p.x, p.y);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const p = getPointerPos(e);
        if (drawing) draw(p.x, p.y);
        coordInfo.textContent = Math.round(p.x) + ', ' + Math.round(p.y);
    });

    window.addEventListener('mouseup', () => {
        if (drawing) {
            drawing = false;
            saveState();
        }
    });

    // --- Touch / Pointer (объединено) ---
    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointers.size === 1) {
            if (e.button === 2 || e.ctrlKey) {
                // панорамирование
                isPanning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                panStartViewX = viewX;
                panStartViewY = viewY;
            } else {
                const p = screenToCanvas(e.clientX, e.clientY);
                startDraw(p.x, p.y);
            }
        } else if (activePointers.size === 2) {
            // жест щипка
            if (drawing) {
                drawing = false;
                saveState();
            }
            isPanning = false;
            const pts = Array.from(activePointers.values());
            pinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        }
    }, { passive: false });

    canvas.addEventListener('pointermove', (e) => {
        e.preventDefault();
        if (!activePointers.has(e.pointerId)) return;
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointers.size === 1) {
            if (drawing) {
                const p = screenToCanvas(e.clientX, e.clientY);
                draw(p.x, p.y);
                coordInfo.textContent = Math.round(p.x) + ', ' + Math.round(p.y);
            } else if (isPanning) {
                viewX = panStartViewX + (e.clientX - panStartX);
                viewY = panStartViewY + (e.clientY - panStartY);
                applyView();
            }
        } else if (activePointers.size === 2) {
            const pts = Array.from(activePointers.values());
            const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            if (pinchDist > 0) {
                const factor = dist / pinchDist;
                const oldScale = viewScale;
                viewScale = Math.max(0.05, Math.min(5, viewScale * factor));
                // масштабирование относительно центра между пальцами
                const rect = container.getBoundingClientRect();
                const cx = (pts[0].x + pts[1].x) / 2 - rect.left - rect.width / 2;
                const cy = (pts[0].y + pts[1].y) / 2 - rect.top - rect.height / 2;
                viewX = viewX * (viewScale / oldScale);
                viewY = viewY * (viewScale / oldScale);
                applyView();
            }
            pinchDist = dist;
        }
    }, { passive: false });

    canvas.addEventListener('pointerup', (e) => {
        activePointers.delete(e.pointerId);
        if (activePointers.size < 2) pinchDist = 0;
        if (activePointers.size === 0) {
            if (drawing) {
                drawing = false;
                saveState();
            }
            isPanning = false;
        }
    });

    canvas.addEventListener('pointercancel', (e) => {
        activePointers.delete(e.pointerId);
        if (drawing) {
            drawing = false;
            saveState();
        }
        isPanning = false;
    });

    // Запрет контекстного меню и скролла
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        viewScale = Math.max(0.05, Math.min(5, viewScale * factor));
        applyView();
    }, { passive: false });

    // ===== Панель инструментов =====
    btnUndo.addEventListener('click', undo);
    btnRedo.addEventListener('click', redo);

    btnClear.addEventListener('click', () => {
        if (confirm('Очистить холст?')) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            saveState();
        }
    });

    btnEraser.addEventListener('click', () => {
        eraserMode = !eraserMode;
        btnEraser.classList.toggle('active', eraserMode);
        btnEraser.textContent = eraserMode ? '✕' : '◻';
    });

    brushSize.addEventListener('input', () => {
        sizeLabel.textContent = brushSize.value;
    });

    btnDownload.addEventListener('click', () => {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas-4096-300dpi-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // ===== Инициализация =====
    window.addEventListener('load', () => {
        fitCanvasToScreen();
        saveState();
    });

    window.addEventListener('resize', () => {
        applyView();
    });
})();
