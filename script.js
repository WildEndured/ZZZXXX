(function () {
    'use strict';

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    const wrapper = document.getElementById('canvasWrapper');
    const statusEl = document.getElementById('status');
    const sizeLabel = document.getElementById('sizeLabel');
    const brushSizeInput = document.getElementById('brushSize');
    const btnClear = document.getElementById('btnClear');
    const btnSave = document.getElementById('btnSave');
    const btnEraser = document.getElementById('btnEraser');
    const colorBtns = document.querySelectorAll('.color');

    // ---- Логические размеры ----
    const W = 4096;
    const H = 4096;
    const DPI = 300;

    // Настраиваем физический размер холста строго 1:1 (4096×4096 px)
    canvas.width = W;
    canvas.height = H;

    // Заливка белым
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // ---- Состояние ----
    let drawing = false;
    let erasing = false;
    let lastX = 0;
    let lastY = 0;
    let currentColor = '#000000';
    let brushSize = 10;

    // ---- Преобразование координат экрана → координаты холста 4096×4096 ----
    function getPos(evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        // Масштаб: реальный размер / отображаемый размер
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    // ---- Рисование ----
    function startDraw(evt) {
        evt.preventDefault();
        drawing = true;
        const p = getPos(evt);
        lastX = p.x;
        lastY = p.y;
        // Точка при касании
        ctx.beginPath();
        ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = erasing ? '#ffffff' : currentColor;
        ctx.fill();
        // Немедленная отрисовка точки через линию
        drawLine(p.x, p.y, p.x, p.y);
    }

    function moveDraw(evt) {
        if (!drawing) return;
        evt.preventDefault();
        const p = getPos(evt);
        drawLine(lastX, lastY, p.x, p.y);
        lastX = p.x;
        lastY = p.y;
    }

    function endDraw(evt) {
        if (!drawing) return;
        if (evt) evt.preventDefault();
        drawing = false;
        ctx.beginPath();
    }

    function drawLine(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.strokeStyle = erasing ? '#ffffff' : currentColor;
        ctx.lineWidth = brushSize;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // ---- События мыши ----
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', () => {
        // не завершаем, чтобы не терять линию при выходе за пределы
    });

    // ---- События touch (мобильные) ----
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw, { passive: false });
    canvas.addEventListener('touchcancel', endDraw, { passive: false });

    // Блокировка прокрутки на обёртке
    wrapper.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // ---- Выбор цвета ----
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentColor = btn.dataset.color;
            erasing = false;
            btnEraser.classList.remove('active');
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ---- Ластик ----
    btnEraser.addEventListener('click', () => {
        erasing = !erasing;
        btnEraser.classList.toggle('active', erasing);
    });

    // ---- Размер кисти ----
    brushSizeInput.addEventListener('input', () => {
        brushSize = parseInt(brushSizeInput.value, 10);
        sizeLabel.textContent = brushSize;
    });

    // ---- Очистка ----
    btnClear.addEventListener('click', () => {
        if (confirm('Очистить холст?')) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);
        }
    });

    // ---- Сохранение ----
    btnSave.addEventListener('click', () => {
        // Экспорт без изменения размеров: 4096×4096
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `canvas_${W}x${H}_${DPI}dpi.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
    });

    // ---- Статус ----
    function updateStatus() {
        statusEl.textContent = `${W} × ${H} · ${DPI} DPI · 1:1`;
    }
    updateStatus();

    // ---- Масштабирование при ресайзе окна (адаптация, без изменения буфера) ----
    function fitCanvas() {
        // Ничего не делаем с размерами буфера — CSS отвечает за отображение
        // aspect-ratio 1/1 уже держит пропорции.
    }
    window.addEventListener('resize', fitCanvas);
    window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 100));

    // ---- Защита от контекстного меню при долгом тапе ----
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // ---- Защита от масштабирования жестами (pinch) ----
    let lastTouchDist = 0;
    wrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDist = Math.hypot(dx, dy);
        }
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            if (lastTouchDist) {
                // Ничего не масштабируем — строго 1:1
            }
            lastTouchDist = dist;
        }
    }, { passive: false });

    console.log(`Canvas ready: ${W}×${H} @ ${DPI} DPI (1:1)`);
})();
