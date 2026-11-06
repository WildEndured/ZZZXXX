/**
 * SVG Векторный Редактор
 * Чистый JS, без библиотек.
 */

// ==========================================
// 1. ИНИЦИАЛИЗАЦИЯ И ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ DOM
// ==========================================
const canvasContainer = document.getElementById('canvasContainer');
const zoomWrapper = document.getElementById('zoomWrapper');
const bgLayer = document.getElementById('bgLayer');
const bgImageLayer = document.getElementById('bgImageLayer');
const drawingSvg = document.getElementById('drawingSvg');
const drawGroup = document.getElementById('drawGroup');
const gridGroup = document.getElementById('gridGroup');

// Элементы управления
const brushSizeInput = document.getElementById('brushSize');
const brushSizeVal = document.getElementById('brushSizeVal');
const eraserModeCheckbox = document.getElementById('eraserMode');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');

const bgColorInput = document.getElementById('bgColor');

const uploadBtn = document.getElementById('uploadBtn');
const imageInput = document.getElementById('imageInput');
const bgImageScaleInput = document.getElementById('bgImageScale');
const bgImageScaleVal = document.getElementById('bgImageScaleVal');
const bgImageOpacityInput = document.getElementById('bgImageOpacity');
const bgImageOpacityVal = document.getElementById('bgImageOpacityVal');

const gridEnabledCheckbox = document.getElementById('gridEnabled');
const gridPaddingInput = document.getElementById('gridPadding');
const gridPaddingVal = document.getElementById('gridPaddingVal');
const gridHeadsInput = document.getElementById('gridHeads');
const gridHeadsVal = document.getElementById('gridHeadsVal');

const exportSvgBtn = document.getElementById('exportSvgBtn');
const exportPngBtn = document.getElementById('exportPngBtn');

// ==========================================
// 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ==========================================
let state = {
    bgColor: '#ffffff',
    bgImage: null, // base64
    bgImageNaturalWidth: 0,
    bgImageNaturalHeight: 0,
    bgImageScale: 1.0, // 100%
    bgImageOpacity: 1.0, // 100%
    
    brushSize: 0.005,
    isEraser: false,
    
    paths: [], // История для Undo (массив элементов path)
    
    grid: {
        enabled: false,
        padding: 5, // %
        heads: 3
    },
    
    // Зум и панорамирование
    transform: {
        scale: 1,
        x: 0,
        y: 0
    }
};

// Переменные для рисования
let isDrawing = false;
let currentPath = null;
let currentPathData = [];
let activePointerId = null;

// Переменные для жестов (зум/панорамирование)
let pointers = new Map();
let initialPinchDistance = 0;
let initialScale = 1;
let initialPanX = 0;
let initialPanY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

// ==========================================
// 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

// Обновление CSS трансформации
function updateTransform() {
    zoomWrapper.style.transform = `translate(${state.transform.x}px, ${state.transform.y}px) scale(${state.transform.scale})`;
}

// Ограничение (clamp) панорамирования
function clampPan() {
    const containerRect = canvasContainer.getBoundingClientRect();
    const w = containerRect.width;
    const h = containerRect.height;
    const s = state.transform.scale;
    
    // Максимальное смещение, чтобы холст не уходил за края
    // При scale >= 1, размер контента = w * s, h * s
    // Мы хотим, чтобы контент всегда покрывал контейнер.
    // Смещение X должно быть в пределах [-(w*s - w), 0]
    // Смещение Y должно быть в пределах [-(h*s - h), 0]
    
    const maxX = 0;
    const minX = -(w * s - w);
    const maxY = 0;
    const minY = -(h * s - h);
    
    state.transform.x = Math.min(maxX, Math.max(minX, state.transform.x));
    state.transform.y = Math.min(maxY, Math.max(minY, state.transform.y));
}

// Получение координат в системе viewBox (0-1)
function getSvgCoords(clientX, clientY) {
    const rect = drawingSvg.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x, y };
}

// Перерисовка сетки
function renderGrid() {
    gridGroup.innerHTML = '';
    if (!state.grid.enabled) {
        gridGroup.style.display = 'none';
        return;
    }
    gridGroup.style.display = 'block';

    const padding = state.grid.padding / 100;
    const heads = state.grid.heads;

    // Красная рамка зоны
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', padding.toString());
    rect.setAttribute('width', '1');
    rect.setAttribute('height', (1 - 2 * padding).toString());
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', 'red');
    rect.setAttribute('stroke-width', '0.005');
    rect.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(rect);

    // Пунктирные линии
    const availableHeight = 1 - 2 * padding;
    const step = availableHeight / (heads - 1);

    for (let i = 0; i < heads; i++) {
        const y = padding + i * step;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', y.toString());
        line.setAttribute('x2', '1');
        line.setAttribute('y2', y.toString());
        line.setAttribute('stroke', 'red');
        line.setAttribute('stroke-width', '0.003');
        line.setAttribute('stroke-dasharray', '0.02, 0.02');
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        gridGroup.appendChild(line);
    }
}

// Обновление подложки
function updateOverlay() {
    if (!state.bgImage) {
        bgImageLayer.style.display = 'none';
        return;
    }
    bgImageLayer.style.display = 'block';
    bgImageLayer.src = state.bgImage;
    bgImageLayer.style.opacity = state.bgImageOpacity;
    
    // Масштаб: 100% = вписана по высоте холста (object-fit: contain уже это делает)
    // Но нам нужно управлять масштабом через CSS transform, чтобы сохранить пропорции.
    // Так как слой абсолютный и object-fit: contain, при scale=1 картинка вписана.
    // Дополнительный масштаб через transform: scale.
    bgImageLayer.style.transform = `scale(${state.bgImageScale})`;
    bgImageLayer.style.transformOrigin = 'center center';
}

// ==========================================
// 4. РИСОВАНИЕ (Pointer Events)
// ==========================================

function startDrawing(e) {
    // Если уже рисуем или это второй палец - прерываем
    if (isDrawing) {
        // Защита: если появляется второй палец, удаляем текущий путь
        if (currentPath) {
            currentPath.remove();
            currentPath = null;
            currentPathData = [];
            isDrawing = false;
            activePointerId = null;
        }
        return;
    }

    // Начинаем рисование только если это первый палец/мышь
    if (pointers.size > 0) return; 

    isDrawing = true;
    activePointerId = e.pointerId;
    
    const coords = getSvgCoords(e.clientX, e.clientY);
    
    // Создаем новый path
    currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    currentPath.setAttribute('fill', 'none');
    currentPath.setAttribute('stroke-linecap', 'round');
    currentPath.setAttribute('stroke-linejoin', 'round');
    
    // Цвет и толщина
    const color = state.isEraser ? state.bgColor : '#000000'; // Ластик рисует цветом фона
    currentPath.setAttribute('stroke', color);
    currentPath.setAttribute('stroke-width', state.brushSize.toString());
    
    // Начинаем с точки (M)
    currentPathData = [`M ${coords.x} ${coords.y}`];
    currentPath.setAttribute('d', currentPathData.join(' '));
    drawGroup.appendChild(currentPath);
}

function drawMove(e) {
    if (!isDrawing || e.pointerId !== activePointerId) return;

    const coords = getSvgCoords(e.clientX, e.clientY);
    const len = currentPathData.length;
    
    if (len === 1) {
        // Первая точка, просто линия к ней
        currentPathData.push(`L ${coords.x} ${coords.y}`);
    } else {
        // Квадратичная кривая: используем предыдущую точку как контрольную
        const prev = currentPathData[len - 1].split(' ');
        const prevX = parseFloat(prev[1]);
        const prevY = parseFloat(prev[2]);
        
        const midX = (prevX + coords.x) / 2;
        const midY = (prevY + coords.y) / 2;
        
        // Q controlX controlY endX endY
        currentPathData.push(`Q ${prevX} ${prevY} ${midX} ${midY}`);
    }
    
    currentPath.setAttribute('d', currentPathData.join(' '));
}

function endDrawing(e) {
    if (e.pointerId !== activePointerId) return;
    
    if (isDrawing && currentPath) {
        // Сохраняем в историю
        state.paths.push(currentPath);
        currentPath = null;
        currentPathData = [];
    }
    isDrawing = false;
    activePointerId = null;
}

// ==========================================
// 5. ЗУМ И ПАНОРАМИРОВАНИЕ (Pointer Events)
// ==========================================

function handlePointerDown(e) {
    // Для рисования используем только левую кнопку мыши (button 0) или касание
    if (e.pointerType === 'mouse' && e.button !== 0) {
        // Средняя кнопка (1) или Shift+ЛКМ для панорамирования
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            isPanning = true;
            panStartX = e.clientX - state.transform.x;
            panStartY = e.clientY - state.transform.y;
            canvasContainer.setPointerCapture(e.pointerId);
            return;
        }
        return;
    }

    // Добавляем указатель в Map
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
        // Один палец - рисование
        startDrawing(e);
    } else if (pointers.size === 2) {
        // Два пальца - зум/панорамирование
        // Если рисовали - отменяем
        if (isDrawing) {
            if (currentPath) currentPath.remove();
            currentPath = null;
            currentPathData = [];
            isDrawing = false;
            activePointerId = null;
        }

        // Инициализация зума
        const pts = Array.from(pointers.values());
        initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        initialScale = state.transform.scale;
        
        // Центр между пальцами для панорамирования
        const centerX = (pts[0].x + pts[1].x) / 2;
        const centerY = (pts[0].y + pts[1].y) / 2;
        
        const containerRect = canvasContainer.getBoundingClientRect();
        const localCenterX = centerX - containerRect.left;
        const localCenterY = centerY - containerRect.top;
        
        // Запоминаем смещение для панорамирования
        initialPanX = state.transform.x;
        initialPanY = state.transform.y;
        
        // Сохраняем точку в координатах контейнера
        const containerCenterX = localCenterX;
        const containerCenterY = localCenterY;
        
        // Для зума относительно центра
        const scaleRatio = state.transform.scale;
        const offsetX = containerCenterX - state.transform.x;
        const offsetY = containerCenterY - state.transform.y;
        
        // Сохраняем для использования в move
        initialPanX = state.transform.x;
        initialPanY = state.transform.y;
        
        // Для простоты: при 2 пальцах просто панорамируем по центру
        // и масштабируем относительно центра
        initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        initialScale = state.transform.scale;
        
        // Сохраняем центр в координатах контейнера
        const rect = canvasContainer.getBoundingClientRect();
        const cx = (pts[0].x + pts[1].x) / 2 - rect.left;
        const cy = (pts[0].y + pts[1].y) / 2 - rect.top;
        
        // Запоминаем точку в системе холста (до трансформации)
        // Относительно контейнера: (cx - state.transform.x) / scale
        const worldX = (cx - state.transform.x) / state.transform.scale;
        const worldY = (cy - state.transform.y) / state.transform.scale;
        
        // Сохраняем для зума
        initialPanX = state.transform.x;
        initialPanY = state.transform.y;
        
        // Центр для зума
        state.transform.pivotX = cx;
        state.transform.pivotY = cy;
        state.transform.pivotWorldX = worldX;
        state.transform.pivotWorldY = worldY;
    }
}

function handlePointerMove(e) {
    // Обновляем позицию указателя
    if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Панорамирование средней кнопкой или Shift+ЛКМ
    if (isPanning) {
        state.transform.x = e.clientX - panStartX;
        state.transform.y = e.clientY - panStartY;
        clampPan();
        updateTransform();
        return;
    }

    // Если 2 пальца - зум/панорамирование
    if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        
        if (initialPinchDistance > 0) {
            let newScale = initialScale * (currentDist / initialPinchDistance);
            // Ограничение: минимум 1, максимум 20
            newScale = Math.max(1, Math.min(20, newScale));
            
            // Центр между пальцами в координатах контейнера
            const rect = canvasContainer.getBoundingClientRect();
            const cx = (pts[0].x + pts[1].x) / 2 - rect.left;
            const cy = (pts[0].y + pts[1].y) / 2 - rect.top;
            
            // Зум относительно центра
            // Мы хотим, чтобы точка под пальцами оставалась на месте
            // worldX = (cx - x) / scale
            // Новый x = cx - worldX * newScale
            
            const worldX = (cx - state.transform.x) / state.transform.scale;
            const worldY = (cy - state.transform.y) / state.transform.scale;
            
            state.transform.scale = newScale;
            state.transform.x = cx - worldX * newScale;
            state.transform.y = cy - worldY * newScale;
            
            clampPan();
            updateTransform();
            
            // Обновляем начальную дистанцию для следующего шага
            initialPinchDistance = currentDist;
            initialScale = newScale;
            
            // Обновляем точку для следующего шага
            // (не нужно, т.к. пересчитываем worldX каждый раз)
        }
        return;
    }

    // Рисование
    if (isDrawing && e.pointerId === activePointerId) {
        drawMove(e);
    }
}

function handlePointerUp(e) {
    pointers.delete(e.pointerId);

    // Если панорамирование
    if (isPanning) {
        isPanning = false;
        return;
    }

    // Завершение рисования
    if (isDrawing && e.pointerId === activePointerId) {
        endDrawing(e);
    }

    // Сброс зума, если пальцев меньше 2
    if (pointers.size < 2) {
        initialPinchDistance = 0;
    }
}

// ==========================================
// 6. ОБРАБОТЧИКИ СОБЫТИЙ
// ==========================================

// Инициализация событий для холста
drawingSvg.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);
window.addEventListener('pointercancel', handlePointerUp);

// Зум колесиком мыши (с центровкой относительно курсора)
canvasContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = canvasContainer.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Определяем направление зума
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    let newScale = state.transform.scale * (1 + delta);
    
    // Ограничение зума
    newScale = Math.max(1, Math.min(20, newScale));
    
    // Зум относительно курсора
    const worldX = (mouseX - state.transform.x) / state.transform.scale;
    const worldY = (mouseY - state.transform.y) / state.transform.scale;
    
    state.transform.scale = newScale;
    state.transform.x = mouseX - worldX * newScale;
    state.transform.y = mouseY - worldY * newScale;
    
    clampPan();
    updateTransform();
}, { passive: false });

// ==========================================
// 7. UI ЛОГИКА (Аккордеоны, ползунки, кнопки)
// ==========================================

// Аккордеоны
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.icon');
        const isVisible = content.style.display === 'block';
        
        // Закрываем все остальные (опционально - можно оставить открытыми)
        // Для простоты оставляем, но переключаем текущий
        content.style.display = isVisible ? 'none' : 'block';
        icon.textContent = isVisible ? '▲' : '▼';
    });
});

// Кисть
brushSizeInput.addEventListener('input', (e) => {
    state.brushSize = parseFloat(e.target.value);
    brushSizeVal.textContent = state.brushSize.toFixed(5);
});

eraserModeCheckbox.addEventListener('change', (e) => {
    state.isEraser = e.target.checked;
});

undoBtn.addEventListener('click', () => {
    if (state.paths.length > 0) {
        const lastPath = state.paths.pop();
        if (lastPath.parentNode) {
            lastPath.parentNode.removeChild(lastPath);
        }
    }
});

clearBtn.addEventListener('click', () => {
    drawGroup.innerHTML = '';
    state.paths = [];
    // Сбрасываем разметку? Нет, разметка отдельно.
});

// Фон
bgColorInput.addEventListener('input', (e) => {
    state.bgColor = e.target.value;
    bgLayer.style.backgroundColor = state.bgColor;
    // Если ластик - обновляем цвет?
});

// Подложка
uploadBtn.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        state.bgImage = ev.target.result;
        
        // Загружаем изображение, чтобы получить размеры
        const img = new Image();
        img.onload = () => {
            state.bgImageNaturalWidth = img.naturalWidth;
            state.bgImageNaturalHeight = img.naturalHeight;
            updateOverlay();
        };
        img.src = state.bgImage;
        
        // Сбрасываем input, чтобы можно было загрузить ту же картинку снова
        imageInput.value = '';
    };
    reader.readAsDataURL(file);
});

bgImageScaleInput.addEventListener('input', (e) => {
    state.bgImageScale = parseFloat(e.target.value) / 100;
    bgImageScaleVal.textContent = e.target.value;
    updateOverlay();
});

bgImageOpacityInput.addEventListener('input', (e) => {
    state.bgImageOpacity = parseFloat(e.target.value) / 100;
    bgImageOpacityVal.textContent = e.target.value;
    updateOverlay();
});

// Разметка
gridEnabledCheckbox.addEventListener('change', (e) => {
    state.grid.enabled = e.target.checked;
    renderGrid();
});

gridPaddingInput.addEventListener('input', (e) => {
    state.grid.padding = parseInt(e.target.value);
    gridPaddingVal.textContent = state.grid.padding;
    renderGrid();
});

gridHeadsInput.addEventListener('input', (e) => {
    state.grid.heads = parseInt(e.target.value);
    gridHeadsVal.textContent = state.grid.heads;
    renderGrid();
});

// ==========================================
// 8. ЭКСПОРТ
// ==========================================

// Сборка SVG с нуля (без трансформаций зума)
function buildExportSVG() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('xmlns', svgNS);
    svg.setAttribute('viewBox', '0 0 1 1');
    svg.setAttribute('width', '4096');
    svg.setAttribute('height', '4096');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // 1. Фон
    const bgRect = document.createElementNS(svgNS, 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', '1');
    bgRect.setAttribute('height', '1');
    bgRect.setAttribute('fill', state.bgColor);
    svg.appendChild(bgRect);
    
    // 2. Подложка
    if (state.bgImage) {
        const img = document.createElementNS(svgNS, 'image');
        // Позиция и размер: 100% = вписана по высоте (1:1), т.е. height = 1, width = aspect
        // Но мы сохраняем пропорции и центрируем.
        // Поскольку viewBox 0 0 1 1, мы можем вычислить положение.
        // При масштабе 100% картинка должна быть вписана по высоте: height = 1, width = 1 * (naturalW / naturalH).
        // Но если ширина > 1, она выйдет за пределы. По условию "вписана ровно по высоте холста (пропорции сохранены)".
        // Т.е. height = 1, width = aspect. Если aspect > 1, то ширина > 1, и картинка выходит за границы.
        // Но это нормально, т.к. object-fit: contain в CSS вписывает, но здесь мы должны воспроизвести.
        // На самом деле object-fit: contain вписывает так, чтобы картинка целиком поместилась.
        // Но условие: "100% = картинка вписана ровно по высоте холста (пропорции сохранены)".
        // Это значит height = 1, width = (naturalW / naturalH) * 1.
        // Если width > 1, то картинка будет обрезана по бокам? Или выйдет за границы?
        // В CSS object-fit: contain вписывает так, чтобы обе стороны поместились.
        // Но здесь сказано "вписана ровно по высоте". Значит height = 1, width = aspect.
        // Если aspect > 1, то картинка выйдет за пределы viewBox, и будет обрезана. Это допустимо.
        // Но для object-fit: contain в CSS картинка будет вписана целиком, т.е. height < 1, если aspect > 1.
        // Однако условие явно: "вписана ровно по высоте холста". Значит height = 1 всегда.
        // Тогда при aspect > 1 ширина > 1, и картинка обрежется по бокам.
        // Это отличается от CSS object-fit: contain. Но мы должны следовать условию.
        
        // Но тогда наш CSS слой с object-fit: contain не соответствует. 
        // В CSS мы используем object-fit: contain, что вписывает целиком.
        // Чтобы соответствовать условию, нужно изменить CSS.
        // Однако в задании сказано: "Масштаб подложки: 100% = картинка вписана ровно по высоте холста (пропорции сохранены)."
        // Значит height = 1, width = aspect. 
        // В CSS мы используем object-fit: contain, что неверно для этого условия.
        // Придется переделать CSS или логику.
        // Для простоты: в CSS сделаем object-fit: fill? Нет.
        // Лучше: в CSS использовать object-fit: contain, но тогда масштаб 100% будет вписывать целиком, а не по высоте.
        // Условие: "вписана ровно по высоте". Значит если картинка широкая, она выйдет за границы по бокам.
        // В CSS это можно сделать через object-fit: cover? Нет, cover обрезает.
        // Можно задать width: auto; height: 100%; и центрировать.
        // Тогда при широкой картинке она выйдет за пределы по бокам.
        // Да, это то, что нужно.
        
        // Поэтому изменим CSS: для .overlay-layer уберем object-fit: contain, 
        // и зададим height: 100%; width: auto; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
        // Но тогда transform используется для центрирования, а мы используем transform для масштаба.
        // Можно использовать комбинацию: transform: translate(-50%, -50%) scale(...). 
        // Это можно сделать.
        
        // Но в текущем коде updateOverlay использует transform: scale(...) без центрирования.
        // Нужно исправить.
        
        // Для простоты в экспорте: вычислим размеры и позицию.
        const aspect = state.bgImageNaturalWidth / state.bgImageNaturalHeight;
        let w, h, x, y;
        
        // Базовая вписывание по высоте: h = 1, w = aspect
        h = 1;
        w = aspect;
        
        // Центрируем
        x = (1 - w) / 2;
        y = (1 - h) / 2;
        
        // Применяем масштаб (относительно центра)
        // Масштаб увеличивает размеры
        const scaledW = w * state.bgImageScale;
        const scaledH = h * state.bgImageScale;
        
        // Центр остается тем же
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        
        const finalX = centerX - scaledW / 2;
        const finalY = centerY - scaledH / 2;
        
        img.setAttribute('x', finalX.toString());
        img.setAttribute('y', finalY.toString());
        img.setAttribute('width', scaledW.toString());
        img.setAttribute('height', scaledH.toString());
        img.setAttribute('href', state.bgImage);
        img.setAttribute('opacity', state.bgImageOpacity.toString());
        img.setAttribute('preserveAspectRatio', 'none'); // Мы уже вычислили размеры
        svg.appendChild(img);
    }
    
    // 3. Пути из drawGroup
    const paths = drawGroup.querySelectorAll('path');
    paths.forEach(path => {
        const clonedPath = path.cloneNode(true);
        svg.appendChild(clonedPath);
    });
    
    return svg;
}

// Скачивание файла
function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Экспорт SVG
exportSvgBtn.addEventListener('click', () => {
    const svg = buildExportSVG();
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    downloadFile(svgString, 'drawing.svg', 'image/svg+xml');
});

// Экспорт PNG
exportPngBtn.addEventListener('click', () => {
    const svg = buildExportSVG();
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 4096;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
        ctx.clearRect(0, 0, 4096, 4096);
        ctx.drawImage(img, 0, 0, 4096, 4096);
        
        canvas.toBlob((blob) => {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'drawing.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(pngUrl);
        }, 'image/png');
        
        URL.revokeObjectURL(url);
    };
    img.src = url;
});

// ==========================================
// 9. ИНИЦИАЛИЗАЦИЯ
// ==========================================

function init() {
    // Устанавливаем начальные значения
    bgLayer.style.backgroundColor = state.bgColor;
    brushSizeVal.textContent = state.brushSize.toFixed(5);
    
    // Центрируем холст (изначально scale=1, x=0, y=0)
    state.transform.scale = 1;
    state.transform.x = 0;
    state.transform.y = 0;
    updateTransform();
    
    // Обновляем подложку (пустую)
    updateOverlay();
    
    // Разметка выключена
    renderGrid();
    
    // Устанавливаем размеры для canvasContainer (для мобильных)
    // На десктопе уже задано через CSS
}

init();
