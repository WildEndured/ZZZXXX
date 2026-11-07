(function () {
    'use strict';

    // ---------- DOM ----------
    const workspace = document.getElementById('workspace');
    const viewport = document.getElementById('viewport');
    const zoomContainer = document.getElementById('zoomContainer');
    const bgLayer = document.getElementById('bgLayer');
    const underlayLayer = document.getElementById('underlayLayer');
    const drawSvg = document.getElementById('drawSvg');
    const staticGroup = document.getElementById('staticGroup');
    const drawGroup = document.getElementById('drawGroup');

    const bgColorInput = document.getElementById('bgColor');
    const underlayFileInput = document.getElementById('underlayFile');
    const underlayScaleInput = document.getElementById('underlayScale');
    const underlayScaleVal = document.getElementById('underlayScaleVal');
    const underlayOpacityInput = document.getElementById('underlayOpacity');
    const underlayOpacityVal = document.getElementById('underlayOpacityVal');
    const gridMarginInput = document.getElementById('gridMargin');
    const gridMarginVal = document.getElementById('gridMarginVal');
    const headsInput = document.getElementById('heads');
    const headsVal = document.getElementById('headsVal');
    const brushSizeInput = document.getElementById('brushSize');
    const brushSizeVal = document.getElementById('brushSizeVal');
    const brushColorInput = document.getElementById('brushColor');

    const undoBtn = document.getElementById('undoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exportSvgBtn = document.getElementById('exportSvgBtn');
    const exportPngBtn = document.getElementById('exportPngBtn');

    // ---------- State ----------
    const state = {
        scale: 1,
        tx: 0,
        ty: 0,
        bgColor: '#ffffff',
        underlayDataUrl: null,
        underlayImg: null,
        underlayScale: 1,      // 100% = вписана по высоте
        underlayOpacity: 1,
        gridMargin: 0.05,
        heads: 4,
        brushSize: 4,
        brushColor: '#000000',
        paths: []              // массив SVG path элементов
    };

    const MIN_SCALE = 1;
    const MAX_SCALE = 20;

    // ---------- Viewport (квадрат) ----------
    function resizeViewport() {
        const rect = workspace.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        viewport.style.width = size + 'px';
        viewport.style.height = size + 'px';
        applyTransform();
    }

    // ---------- Transform ----------
    function applyTransform() {
        zoomContainer.style.transform =
            `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
    }

    function clampPan() {
        const vRect = viewport.getBoundingClientRect();
        const w = vRect.width;
        const h = vRect.height;
        const scaledW = w * state.scale;
        const scaledH = h * state.scale;

        const minTx = w - scaledW; // <= 0
        const minTy = h - scaledH;
        const maxTx = 0;
        const maxTy = 0;

        state.tx = Math.min(maxTx, Math.max(minTx, state.tx));
        state.ty = Math.min(maxTy, Math.max(minTy, state.ty));
    }

    function zoomAt(clientX, clientY, newScale) {
        const vRect = viewport.getBoundingClientRect();
        const localX = clientX - vRect.left;
        const localY = clientY - vRect.top;

        newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
        if (newScale === state.scale) return;

        // Точка в координатах контейнера (до зума)
        const cx = (localX - state.tx) / state.scale;
        const cy = (localY - state.ty) / state.scale;

        state.scale = newScale;
        state.tx = localX - cx * state.scale;
        state.ty = localY - cy * state.scale;

        clampPan();
        applyTransform();
    }

    // ---------- Pointer handling ----------
    const pointers = new Map();
    let mode = null; // 'draw' | 'pan' | 'pinch' | null
    let activeDrawPointerId = null;
    let currentPath = null;
    let currentPathD = '';

    // pinch state
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchStartCenter = { x: 0, y: 0 };
    let pinchStartTx = 0;
    let pinchStartTy = 0;

    // pan state
    let panStart = { x: 0, y: 0, tx: 0, ty: 0 };

    function svgPointFromEvent(evt) {
        // Преобразуем клиентские координаты в SVG координаты (0..1)
        const vRect = viewport.getBoundingClientRect();
        const localX = evt.clientX - vRect.left;
        const localY = evt.clientY - vRect.top;
        // В координатах контейнера
        const cx = (localX - state.tx) / state.scale;
        const cy = (localY - state.ty) / state.scale;
        // viewport — квадрат, size = vRect.width (== height)
        const size = vRect.width;
        return { x: cx / size, y: cy / size };
    }

    function isInsideViewport(evt) {
        const r = viewport.getBoundingClientRect();
        return evt.clientX >= r.left && evt.clientX <= r.right &&
               evt.clientY >= r.top && evt.clientY <= r.bottom;
    }

    function getDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.hypot(dx, dy);
    }

    function getCenter(p1, p2) {
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    function cancelCurrentPath() {
        if (currentPath && currentPath.parentNode) {
            currentPath.parentNode.removeChild(currentPath);
        }
        currentPath = null;
        currentPathD = '';
    }

    function startDraw(evt) {
        cancelCurrentPath();
        const p = svgPointFromEvent(evt);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', state.brushColor);
        path.setAttribute('stroke-width', state.brushSize);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        currentPathD = `M ${p.x.toFixed(5)} ${p.y.toFixed(5)}`;
        path.setAttribute('d', currentPathD);
        drawGroup.appendChild(path);
        currentPath = path;
        activeDrawPointerId = evt.pointerId;
        mode = 'draw';
    }

    function extendDraw(evt) {
        if (!currentPath) return;
        const p = svgPointFromEvent(evt);
        currentPathD += ` L ${p.x.toFixed(5)} ${p.y.toFixed(5)}`;
        currentPath.setAttribute('d', currentPathD);
    }

    function endDraw() {
        if (currentPath) {
            const d = currentPath.getAttribute('d');
            const hasMotion = /\sL\s/.test(d);
            if (!hasMotion) {
                // Одиночная точка - рисуем маленький кружок
                const m = /M\s+([\d.]+)\s+([\d.]+)/.exec(d);
                if (m) {
                    const x = parseFloat(m[1]);
                    const y = parseFloat(m[2]);
                    const r = 0.0005 * state.brushSize;
                    currentPath.setAttribute('d', `M ${x} ${y} L ${x + 0.000001} ${y}`);
                }
            }
            state.paths.push(currentPath);
        }
        currentPath = null;
        currentPathD = '';
        activeDrawPointerId = null;
        if (mode === 'draw') mode = null;
    }

    function undo() {
        const last = state.paths.pop();
        if (last && last.parentNode) {
            last.parentNode.removeChild(last);
        }
    }

    function clearAll() {
        while (drawGroup.firstChild) drawGroup.removeChild(drawGroup.firstChild);
        state.paths = [];
        cancelCurrentPath();
    }

    // ---------- Pointer events ----------
    viewport.addEventListener('pointerdown', (evt) => {
        if (!isInsideViewport(evt)) return;

        // Начинаем захват
        try { viewport.setPointerCapture(evt.pointerId); } catch (e) {}

        pointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY, pointerType: evt.pointerType, button: evt.button });

        // Средняя кнопка мыши или Shift+ЛКМ -> pan
        const isPanButton = (evt.pointerType === 'mouse') && (evt.button === 1 || (evt.button === 0 && evt.shiftKey));
        // На тач: 2 пальца -> zoom/pan
        // Обычное рисование: ЛКМ мыши или 1 палец

        if (pointers.size >= 2) {
            // Второй палец — отменяем рисование и переходим в pinch
            if (mode === 'draw') {
                cancelCurrentPath();
                state.paths = state.paths.filter(p => p !== currentPath);
                activeDrawPointerId = null;
            }
            const pts = Array.from(pointers.values());
            const p1 = pts[0], p2 = pts[1];
            pinchStartDist = getDistance(p1, p2);
            pinchStartScale = state.scale;
            const c = getCenter(p1, p2);
            const vRect = viewport.getBoundingClientRect();
            pinchStartCenter = { x: c.x - vRect.left, y: c.y - vRect.top };
            pinchStartTx = state.tx;
            pinchStartTy = state.ty;
            mode = 'pinch';
            evt.preventDefault();
            return;
        }

        if (isPanButton) {
            mode = 'pan';
            panStart = { x: evt.clientX, y: evt.clientY, tx: state.tx, ty: state.ty };
            evt.preventDefault();
            return;
        }

        // Рисование
        if (evt.pointerType === 'mouse' && evt.button !== 0) return;
        if (mode === null || mode === 'draw') {
            startDraw(evt);
            evt.preventDefault();
        }
    });

    viewport.addEventListener('pointermove', (evt) => {
        if (!pointers.has(evt.pointerId)) return;
        pointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY, pointerType: evt.pointerType, button: evt.button });

        if (mode === 'pinch' && pointers.size >= 2) {
            const pts = Array.from(pointers.values());
            const p1 = pts[0], p2 = pts[1];
            const dist = getDistance(p1, p2);
            const center = getCenter(p1, p2);
            const vRect = viewport.getBoundingClientRect();
            const centerLocal = { x: center.x - vRect.left, y: center.y - vRect.top };

            if (pinchStartDist > 0) {
                const ratio = dist / pinchStartDist;
                let newScale = pinchStartScale * ratio;
                newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

                // Точка под центром в контейнере (изначально)
                const cx = (pinchStartCenter.x - pinchStartTx) / pinchStartScale;
                const cy = (pinchStartCenter.y - pinchStartTy) / pinchStartScale;

                // Также учитываем смещение центра
                const centerDeltaX = centerLocal.x - pinchStartCenter.x;
                const centerDeltaY = centerLocal.y - pinchStartCenter.y;

                state.scale = newScale;
                state.tx = centerLocal.x - cx * newScale;
                state.ty = centerLocal.y - cy * newScale;
                // Добавляем смещение центра (панорамирование)
                state.tx += centerDeltaX * 0; // уже учтено через centerLocal
                // На самом деле centerLocal - актуальный центр, используем его
                state.tx = centerLocal.x - cx * newScale;
                state.ty = centerLocal.y - cy * newScale;

                clampPan();
                applyTransform();
            }
            evt.preventDefault();
            return;
        }

        if (mode === 'pan') {
            const dx = evt.clientX - panStart.x;
            const dy = evt.clientY - panStart.y;
            state.tx = panStart.tx + dx;
            state.ty = panStart.ty + dy;
            clampPan();
            applyTransform();
            evt.preventDefault();
            return;
        }

        if (mode === 'draw' && evt.pointerId === activeDrawPointerId) {
            extendDraw(evt);
            evt.preventDefault();
        }
    });

    function handlePointerEnd(evt) {
        pointers.delete(evt.pointerId);

        if (mode === 'draw' && evt.pointerId === activeDrawPointerId) {
            endDraw();
        }

        if (mode === 'pinch') {
            if (pointers.size === 1) {
                // Остался один палец — переходим в pan с ним
                const remaining = Array.from(pointers.entries())[0];
                const [id, p] = remaining;
                panStart = { x: p.x, y: p.y, tx: state.tx, ty: state.ty };
                mode = 'pan';
            } else if (pointers.size === 0) {
                mode = null;
            }
        }

        if (mode === 'pan' && pointers.size === 0) {
            mode = null;
        }
    }

    viewport.addEventListener('pointerup', handlePointerEnd);
    viewport.addEventListener('pointercancel', handlePointerEnd);
    viewport.addEventListener('lostpointercapture', (evt) => {
        if (pointers.has(evt.pointerId)) handlePointerEnd(evt);
    });

    // Wheel zoom (ПК)
    viewport.addEventListener('wheel', (evt) => {
        evt.preventDefault();
        if (!isInsideViewport(evt)) return;
        const factor = Math.exp(-evt.deltaY * 0.0015);
        const newScale = state.scale * factor;
        zoomAt(evt.clientX, evt.clientY, newScale);
    }, { passive: false });

    // Запрет контекстного меню при рисовании
    viewport.addEventListener('contextmenu', (e) => e.preventDefault());

    // ---------- Static grid (красная рамка + головы) ----------
    function renderStatic() {
        staticGroup.innerHTML = '';

        // Красная рамка зоны
        const m = state.gridMargin;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', m);
        rect.setAttribute('y', m);
        rect.setAttribute('width', (1 - 2 * m).toFixed(5));
        rect.setAttribute('height', (1 - 2 * m).toFixed(5));
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', '#ff2b2b');
        rect.setAttribute('stroke-width', 1.5);
        rect.setAttribute('vector-effect', 'non-scaling-stroke');
        staticGroup.appendChild(rect);

        // Пунктирные линии голов (вертикальные) в пределах красной рамки
        const heads = state.heads;
        const y1 = m;
        const y2 = 1 - m;
        for (let i = 1; i < heads; i++) {
            const x = i / heads;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x.toFixed(5));
            line.setAttribute('y1', y1.toFixed(5));
            line.setAttribute('x2', x.toFixed(5));
            line.setAttribute('y2', y2.toFixed(5));
            line.setAttribute('stroke', '#ff2b2b');
            line.setAttribute('stroke-width', 1);
            line.setAttribute('stroke-dasharray', '6 4');
            line.setAttribute('vector-effect', 'non-scaling-stroke');
            staticGroup.appendChild(line);
        }
    }

    // ---------- UI bindings ----------
    bgColorInput.addEventListener('input', (e) => {
        state.bgColor = e.target.value;
        bgLayer.style.background = state.bgColor;
    });

    underlayFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            state.underlayDataUrl = reader.result;
            const img = new Image();
            img.onload = () => {
                state.underlayImg = img;
                underlayLayer.src = reader.result;
                underlayLayer.style.display = 'block';
                applyUnderlayStyle();
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });

    function applyUnderlayStyle() {
        underlayLayer.style.opacity = state.underlayOpacity;
        // Масштаб относительно «вписана по высоте»
        // object-fit: contain вписывает по обоим сторонам, но нам нужно ровно по высоте
        // Используем transform внутри абсолютного позиционирования
        underlayLayer.style.objectFit = 'fill';
        underlayLayer.style.width = '100%';
        underlayLayer.style.height = '100%';

        if (!state.underlayImg) {
            underlayLayer.style.transform = '';
            return;
        }
        // Базовая вписанность по высоте:
        // реальная ширина при object-fit: contain по высоте:
        const vw = 1; // условно
        const vh = 1;
        const iw = state.underlayImg.naturalWidth;
        const ih = state.underlayImg.naturalHeight;
        // размер при вписывании по высоте (100%)
        // высота = 1, ширина = iw/ih
        const baseW = iw / ih;
        // scale применяем к этому
        const finalScale = state.underlayScale;
        // Итоговые размеры в долях контейнера:
        const w = baseW * finalScale;
        const h = 1 * finalScale;
        // Центрирование
        underlayLayer.style.transformOrigin = 'center center';
        underlayLayer.style.transform = `scale(${finalScale})`;
        // Но scale от центра не даст желаемого для широких картинок при масштабе <1,
        // т.к. ширина уменьшится пропорционально. Это правильно: при 100% высота = контейнер.
        // Для точного контроля используем width/height + translate.
        underlayLayer.style.transform = '';
        // Пересчитаем через width/height:
        const pxW = (baseW * finalScale) * 100;
        const pxH = (1 * finalScale) * 100;
        underlayLayer.style.width = pxW + '%';
        underlayLayer.style.height = pxH + '%';
        underlayLayer.style.left = '50%';
        underlayLayer.style.top = '50%';
        underlayLayer.style.transform = 'translate(-50%, -50%)';
        underlayLayer.style.objectFit = 'fill';
    }

    underlayScaleInput.addEventListener('input', (e) => {
        state.underlayScale = parseInt(e.target.value, 10) / 100;
        underlayScaleVal.textContent = e.target.value;
        applyUnderlayStyle();
    });

    underlayOpacityInput.addEventListener('input', (e) => {
        state.underlayOpacity = parseInt(e.target.value, 10) / 100;
        underlayOpacityVal.textContent = e.target.value;
        applyUnderlayStyle();
    });

    gridMarginInput.addEventListener('input', (e) => {
        state.gridMargin = parseInt(e.target.value, 10) / 100;
        gridMarginVal.textContent = e.target.value;
        renderStatic();
    });

    headsInput.addEventListener('input', (e) => {
        state.heads = parseInt(e.target.value, 10);
        headsVal.textContent = e.target.value;
        renderStatic();
    });

    brushSizeInput.addEventListener('input', (e) => {
        state.brushSize = parseInt(e.target.value, 10);
        brushSizeVal.textContent = e.target.value;
    });

    brushColorInput.addEventListener('input', (e) => {
        state.brushColor = e.target.value;
    });

    undoBtn.addEventListener('click', undo);
    clearBtn.addEventListener('click', clearAll);

    // ---------- Экспорт ----------
    function buildExportSvg() {
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('xmlns', NS);
        svg.setAttribute('viewBox', '0 0 1 1');
        svg.setAttribute('width', '4096');
        svg.setAttribute('height', '4096');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // 1. Фон
        const bg = document.createElementNS(NS, 'rect');
        bg.setAttribute('x', '0');
        bg.setAttribute('y', '0');
        bg.setAttribute('width', '1');
        bg.setAttribute('height', '1');
        bg.setAttribute('fill', state.bgColor);
        svg.appendChild(bg);

        // 2. Подложка
        if (state.underlayDataUrl && state.underlayImg) {
            const iw = state.underlayImg.naturalWidth;
            const ih = state.underlayImg.naturalHeight;
            const baseW = iw / ih; // ширина при высоте 1
            const w = baseW * state.underlayScale;
            const h = 1 * state.underlayScale;
            const x = 0.5 - w / 2;
            const y = 0.5 - h / 2;

            const imgEl = document.createElementNS(NS, 'image');
            imgEl.setAttribute('href', state.underlayDataUrl);
            imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', state.underlayDataUrl);
            imgEl.setAttribute('x', x.toFixed(6));
            imgEl.setAttribute('y', y.toFixed(6));
            imgEl.setAttribute('width', w.toFixed(6));
            imgEl.setAttribute('height', h.toFixed(6));
            imgEl.setAttribute('preserveAspectRatio', 'none');
            imgEl.setAttribute('opacity', state.underlayOpacity);
            svg.appendChild(imgEl);
        }

        // 3. Статичные линии (рамка и головы) — переносим как есть
        // Клонируем staticGroup
        const staticClone = staticGroup.cloneNode(true);
        // Убедимся, что внутри все элементы SVG namespace (они уже)
        svg.appendChild(staticClone);

        // 4. Пути рисования
        const drawClone = drawGroup.cloneNode(true);
        svg.appendChild(drawClone);

        return svg;
    }

    function svgToString(svgEl) {
        const serializer = new XMLSerializer();
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(svgEl);
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    exportSvgBtn.addEventListener('click', () => {
        try {
            const svgEl = buildExportSvg();
            const str = svgToString(svgEl);
            const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
            downloadBlob(blob, 'canvas.svg');
        } catch (e) {
            console.error(e);
            alert('Ошибка экспорта SVG: ' + e.message);
        }
    });

    exportPngBtn.addEventListener('click', () => {
        try {
            const svgEl = buildExportSvg();
            const str = svgToString(svgEl);
            const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 4096;
                canvas.height = 4096;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 4096, 4096);
                ctx.drawImage(img, 0, 0, 4096, 4096);
                URL.revokeObjectURL(url);
                canvas.toBlob((pngBlob) => {
                    if (pngBlob) downloadBlob(pngBlob, 'canvas.png');
                }, 'image/png');
            };
            img.onerror = (e) => {
                URL.revokeObjectURL(url);
                alert('Ошибка загрузки SVG для PNG');
            };
            img.src = url;
        } catch (e) {
            console.error(e);
            alert('Ошибка экспорта PNG: ' + e.message);
        }
    });

    // ---------- Init ----------
    function init() {
        bgLayer.style.background = state.bgColor;
        underlayLayer.style.display = 'none';
        renderStatic();
        resizeViewport();

        window.addEventListener('resize', resizeViewport);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeViewport, 100);
        });

        // Запрещаем скролл/зум браузера при касаниях вне панели
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('touchmove', (e) => {
            // Разрешаем только внутри sidebar (для его скролла)
            if (e.target.closest && e.target.closest('.sidebar')) return;
            e.preventDefault();
        }, { passive: false });
    }

    init();
})();
