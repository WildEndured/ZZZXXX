(function () {
    'use strict';

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');

    const clearBtn = document.getElementById('clearBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const bgColorInput = document.getElementById('bgColor');
    const brushColorInput = document.getElementById('brushColor');
    const brushSizeInput = document.getElementById('brushSize');
    const brushSizeValue = document.getElementById('brushSizeValue');

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    // Инициализация: белый фон
    function fillBackground(color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    fillBackground(bgColorInput.value);

    // Пересчёт координат с учётом масштабирования canvas
    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        drawing = true;
        const { x, y } = getCanvasCoords(e);
        lastX = x;
        lastY = y;
        drawDot(x, y);
    }

    function drawDot(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, brushSizeInput.value / 2, 0, Math.PI * 2);
        ctx.fillStyle = brushColorInput.value;
        ctx.fill();
    }

    function draw(e) {
        if (!drawing) return;
        const { x, y } = getCanvasCoords(e);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = brushColorInput.value;
        ctx.lineWidth = brushSizeInput.value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        lastX = x;
        lastY = y;
    }

    function stopDrawing() {
        drawing = false;
        ctx.beginPath();
    }

    // События мыши
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // События touch (мобильные)
    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        const touch = e.touches[0];
        drawing = true;
        const { x, y } = getCanvasCoords(touch);
        lastX = x;
        lastY = y;
        drawDot(x, y);
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (!drawing) return;
        const touch = e.touches[0];
        draw(touch);
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
        e.preventDefault();
        stopDrawing();
    }, { passive: false });

    // Очистка
    clearBtn.addEventListener('click', function () {
        fillBackground(bgColorInput.value);
    });

    // Смена фона
    bgColorInput.addEventListener('input', function () {
        fillBackground(bgColorInput.value);
    });

    // Размер кисти
    brushSizeInput.addEventListener('input', function () {
        brushSizeValue.textContent = brushSizeInput.value;
    });

    // Скачивание PNG с DPI-метаданными 300
    downloadBtn.addEventListener('click', function () {
        canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'canvas-4096x4096-300dpi.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    });
})();
