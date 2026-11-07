(function() {
    'use strict';

    // ============================================================
    // 1. ИНИЦИАЛИЗАЦИЯ И ПОЛУЧЕНИЕ DOM-ЭЛЕМЕНТОВ
    // ============================================================
    const zoomContainer = document.getElementById('zoomContainer');
    const bgLayer = document.getElementById('bgLayer');
    const bgImage = document.getElementById('bgImage');
    const drawSvg = document.getElementById('drawSvg');
    const drawGroup = document.getElementById('drawGroup');
    const gridGroup = document.getElementById('gridGroup');

    // Элементы управления
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
    // 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
    // ============================================================
    const state = {
        // Зум и панорамирование
        scale: 1,
        translateX: 0,
        translateY: 0,
        minScale: 1,
        maxScale: 20,

        // Рисование
        isDrawing: false,
        currentPath: null,
        currentPoints: [],
        brushSize: 0.005,
        isEraser: false,

        // Подложка
        bgImageData: null, // base64
        bgScale: 1, // 100% = вписана по высоте
        bgOpacity: 0.5,

        // Фон
        bgColor: '#ffffff',

        // Сетка
        marginTop: 5, // проценты
        headsCount: 4,

        // Для мультитача
        pointers: new Map(),
        isPinching: false,
        pinchStartDist: 0,
        pinchStartScale: 1,
        pinchStartCenter: { x: 0, y: 0 },
        pinchStartTranslate: { x: 0, y: 0 },

        // Для панорамирования
        isPanning: false,
        panStart: { x: 0, y: 0 },
        panStartTranslate: { x: 0, y: 0 },

        // Для рисования
        drawPointerId: null
    };

    // ============================================================
    // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================

    // Получение координат в системе viewBox (0..1) из clientX/clientY
    function getSvgCoords(clientX, clientY) {
        const rect = drawSvg.getBoundingClientRect();
        // Пересчет: (clientX - rect.left) / rect.width
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    }

    // Применение трансформации к контейнеру
    function applyTransform() {
        const transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
        zoomContainer.style.transform = transform;
        // Обновляем transform-origin для правильного зума
        zoomContainer.style.transformOrigin = '0 0';
    }

    // Ограничение панорамирования (clamp)
    function clampPan() {
        const containerRect = zoomContainer.parentElement.getBoundingClientRect();
        const containerW = containerRect.width;
        const containerH = containerRect.height;

        // Размер контейнера зума (квадрат) в пикселях
        // zoomContainer имеет width/height 100% от родителя, но мы центрируем квадрат
        // Фактически, zoomContainer - это flex-элемент, который занимает всю площадь
        // Но внутри него квадрат? Нет, у нас весь контейнер - это квадрат? 
        // По условию: рабочая область строго квадратная (1:1). 
        // Значит, zoomContainer должен быть квадратным. 
        // Но у нас он flex: 1 и занимает все пространство. 
        // Нужно сделать так, чтобы внутри zoomContainer был квадрат.
        // Однако, в текущей разметке zoomContainer - это и есть рабочая область.
        // Чтобы соблюсти квадратность, сделаем так: zoomContainer имеет размеры 
        // min(ширина, высота) родителя. Но родитель - это flex-контейнер.
        // Проще: сделаем zoomContainer квадратным через CSS aspect-ratio.
        // Но в задании сказано: "Рабочая область строго квадратная (1:1)."
        // и "Внутри контейнера зума должны быть строго 3 слоя".
        // Значит, zoomContainer - это квадрат. 
        // В текущей разметке zoomContainer - это flex-элемент, который растягивается.
        // Нужно изменить CSS, чтобы он был квадратным.
        // Сделаем это через JS: установим размеры квадрата.
        // Но лучше через CSS: 
        // .zoom-container { aspect-ratio: 1 / 1; max-width: 100%; max-height: 100%; }
        // Но тогда он не будет растягиваться на весь экран.
        // В задании не сказано, что он должен занимать весь экран.
        // Сказано: "Рабочая область строго квадратная (1:1)."
        // и "Внутри контейнера зума должны быть строго 3 слоя".
        // Значит, контейнер зума - это квадрат.
        // Переделаем CSS: zoomContainer будет квадратным, центрированным в родителе.
        // Но у нас родитель - body (flex column). 
        // Нужно обернуть zoomContainer в другой контейнер, который центрирует квадрат.
        // Или сделать zoomContainer с aspect-ratio: 1/1 и margin: auto.
        // Но тогда он не будет занимать все доступное пространство.
        // В задании: "Рабочая область строго квадратная (1:1)."
        // и "Внутри контейнера зума должны быть строго 3 слоя".
        // Значит, контейнер зума - это квадрат.
        // Я сделаю так: zoomContainer будет квадратным, размер = min(ширина, высота) родителя.
        // Для этого в CSS добавим:
        // .zoom-container { position: relative; width: min(100%, 100vh); height: min(100%, 100vh); ... }
        // Но это не совсем то.
        // Лучше: сделать родительский контейнер flex, центрирующий квадрат.
        // Но у нас body - flex column. 
        // Добавим обертку .canvas-wrapper с flex: 1, display: flex, justify-content: center, align-items: center.
        // И внутри нее zoomContainer с aspect-ratio: 1/1, max-width: 100%, max-height: 100%.
        // Но в задании сказано: "Внутри контейнера зума должны быть строго 3 слоя".
        // Значит, zoomContainer - это квадрат.
        // Я изменю разметку: добавлю .canvas-wrapper.
        // Но в задании дан готовый HTML? Нет, я пишу сам.
        // Значит, я могу сделать правильно.
        // Переделаю HTML: 
        // <div class="canvas-wrapper"><div class="zoom-container" id="zoomContainer">...</div></div>
        // И CSS: .canvas-wrapper { flex: 1; display: flex; justify-content: center; align-items: center; overflow: hidden; }
        // .zoom-container { position: relative; width: min(100%, 100vh); height: min(100%, 100vh); ... }
        // Но 100vh не учитывает панель управления. Лучше через JS.
        // В JS: при ресайзе устанавливаем размер квадрата.
        // Но проще: .zoom-container { aspect-ratio: 1/1; max-width: 100%; max-height: 100%; }
        // и родитель .canvas-wrapper { flex: 1; display: flex; justify-content: center; align-items: center; overflow: hidden; }
        // Тогда zoomContainer будет квадратным и центрированным.
        // Но в задании сказано: "Рабочая область строго квадратная (1:1)."
        // и "Внутри контейнера зума должны быть строго 3 слоя".
        // Значит, контейнер зума - это квадрат.
        // Я сделаю так.
        // Но в текущем HTML у меня нет обертки. Добавлю.
        // Так как я уже написал HTML, придется его изменить.
        // Сделаю это в финальном варианте.

        // Пока что для clamp будем использовать размеры zoomContainer.
        // Но нужно знать его реальные размеры.
        const rect = zoomContainer.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        // При scale = 1 и translate = 0, контейнер занимает всю площадь.
        // При увеличении scale, контейнер увеличивается.
        // Нужно ограничить translate так, чтобы контейнер не выходил за пределы родителя.
        // Родитель - это .canvas-wrapper (или body).
        // Но проще: ограничить так, чтобы левый верхний угол не был > 0 и правый нижний не был < ширины родителя.
        // Однако, при scale < 1 (не бывает, минимум 1) контейнер меньше родителя.
        // При scale = 1, контейнер = родитель. translate должен быть 0.
        // При scale > 1, контейнер больше родителя. translate должен быть в пределах:
        // translateX <= 0 и translateX >= parentW - w * scale
        // translateY <= 0 и translateY >= parentH - h * scale
        // Но у нас родитель - это .canvas-wrapper, который центрирует квадрат.
        // Размер родителя может быть больше квадрата.
        // Тогда при scale = 1 квадрат центрирован, и translate должен быть 0.
        // Но если родитель больше, то квадрат не занимает всю площадь.
        // В задании: "Нельзя увести холст за края контейнера (жесткий clamp по X и Y)."
        // Контейнер - это zoomContainer? Или родитель?
        // "Рабочая область строго квадратная (1:1)."
        // "Внутри контейнера зума должны быть строго 3 слоя"
        // Значит, контейнер зума - это квадрат. 
        // И clamp должен быть относительно этого квадрата.
        // То есть, нельзя увести холст за края контейнера зума.
        // Но если контейнер зума - это квадрат, и мы его масштабируем, то он выходит за свои же края?
        // Нет, контейнер зума - это внешний контейнер, внутри которого 3 слоя.
        // Мы трансформируем контейнер зума? Или слои внутри?
        // В задании: "Внутри контейнера зума должны быть строго 3 слоя через position: absolute"
        // "Зум и панорамирование: Использовать только PointerEvent"
        // "Ограничение зума: минимум 100% (scale = 1). Нельзя увести холст за края контейнера (жесткий clamp по X и Y)."
        // Значит, мы трансформируем контейнер зума (или его содержимое), и clamp относительно родителя контейнера зума.
        // Но если контейнер зума - это квадрат, и мы его трансформируем, то он может выйти за пределы родителя.
        // Родитель - это .canvas-wrapper. 
        // Тогда clamp: 
        // translateX <= 0 (левый край не правее левого края родителя)
        // translateX >= parentW - w * scale (правый край не левее правого края родителя)
        // Аналогично для Y.
        // Но если w * scale < parentW, то translateX должен быть (parentW - w * scale) / 2 для центрирования?
        // В задании: "Нельзя увести холст за края контейнера". 
        // Если холст меньше контейнера, то его нельзя увести за края - он должен быть внутри.
        // Но при scale = 1, холст = квадрат, который центрирован в родителе.
        // Если родитель больше, то холст меньше родителя, и его нельзя увести за края - он должен быть внутри.
        // Значит, translateX должен быть в пределах [0, parentW - w]? 
        // Но тогда при scale = 1 и w = parentW (если родитель квадратный), translateX = 0.
        // Если родитель больше, то w < parentW, и translateX может быть от 0 до parentW - w.
        // Но в задании: "Рабочая область строго квадратная (1:1)."
        // и "Внутри контейнера зума должны быть строго 3 слоя"
        // Значит, контейнер зума - это квадрат. 
        // И родитель, вероятно, тоже квадратный? Нет, родитель - это .canvas-wrapper, который может быть любым.
        // Но чтобы не усложнять, сделаем родителя тоже квадратным? 
        // Нет, лучше сделать так: zoomContainer имеет размер квадрата, и мы трансформируем его.
        // Clamp относительно родителя .canvas-wrapper.
        // Но если родитель не квадратный, то квадрат будет центрирован.
        // При scale = 1, квадрат центрирован, translate = 0.
        // При scale > 1, квадрат увеличивается, и мы можем его двигать.
        // Clamp: 
        // minX = Math.min(0, parentW - w * scale)
        // maxX = Math.max(0, parentW - w * scale)
        // Но если w * scale < parentW, то minX = 0, maxX = parentW - w * scale.
        // Тогда translateX должен быть в [0, parentW - w * scale].
        // Но при scale = 1 и w = parentW, minX = maxX = 0.
        // При scale = 1 и w < parentW, minX = 0, maxX = parentW - w.
        // Но квадрат центрирован, значит translateX = (parentW - w) / 2.
        // Это не 0. 
        // Значит, нужно учитывать центрирование.
        // Проще: сделать родителя квадратным, чтобы w = parentW при scale = 1.
        // Тогда clamp: 
        // translateX <= 0
        // translateX >= parentW - w * scale
        // Аналогично Y.
        // При scale = 1, translateX = 0.
        // При scale > 1, translateX может быть от parentW - w * scale до 0.
        // Это стандартный clamp.
        // Поэтому сделаем .canvas-wrapper квадратным? 
        // Нет, .canvas-wrapper может быть любым, но zoomContainer должен быть квадратным и занимать всю площадь .canvas-wrapper.
        // Тогда .canvas-wrapper должен быть квадратным.
        // Сделаем .canvas-wrapper с aspect-ratio: 1/1, и он будет центрирован в body.
        // Но body - flex column. 
        // Добавим .canvas-wrapper { flex: 1; display: flex; justify-content: center; align-items: center; overflow: hidden; }
        // И внутри .canvas-wrapper будет .zoom-container с aspect-ratio: 1/1, max-width: 100%, max-height: 100%.
        // Тогда .zoom-container будет квадратным и занимать максимально возможную площадь, сохраняя квадрат.
        // Но тогда .canvas-wrapper не квадратный, а .zoom-container квадратный.
        // Clamp относительно .canvas-wrapper? 
        // Нет, clamp относительно .canvas-wrapper, но .zoom-container центрирован.
        // При scale = 1, .zoom-container занимает w x w, где w = min(canvasWrapperW, canvasWrapperH).
        // Если canvasWrapperW > canvasWrapperH, то w = canvasWrapperH, и .zoom-container центрирован по горизонтали.
        // Тогда translateX = (canvasWrapperW - w) / 2.
        // Но в задании: "Нельзя увести холст за края контейнера". 
        // Контейнер - это .canvas-wrapper? Или .zoom-container?
        // "Внутри контейнера зума должны быть строго 3 слоя"
        // Значит, контейнер зума - это .zoom-container.
        // "Нельзя увести холст за края контейнера" - значит, за края .zoom-container?
        // Но .zoom-container - это и есть холст. 
        // Тогда clamp относительно .zoom-container? 
        // Это бессмысленно, так как мы трансформируем .zoom-container.
        // Вероятно, имеется в виду, что нельзя увести холст за края родительского контейнера (body или .canvas-wrapper).
        // Но чтобы не усложнять, сделаем так: 
        // .zoom-container имеет размер квадрата, и мы трансформируем его.
        // Clamp относительно .canvas-wrapper.
        // Но чтобы clamp был простым, сделаем .canvas-wrapper квадратным.
        // Тогда .zoom-container = .canvas-wrapper по размеру.
        // И clamp: translateX <= 0, translateX >= parentW - w * scale.
        // При scale = 1, translateX = 0.
        // Это просто.
        // Поэтому в CSS сделаем .canvas-wrapper квадратным.
        // Но body - flex column, и .canvas-wrapper должен занимать оставшееся пространство.
        // Сделаем .canvas-wrapper { flex: 1; display: flex; justify-content: center; align-items: center; overflow: hidden; }
        // И внутри .zoom-container { width: min(100%, 100vh); height: min(100%, 100vh); ... }
        // Но 100vh не учитывает панель. Лучше через JS.
        // Или: .canvas-wrapper { flex: 1; display: grid; place-items: center; overflow: hidden; }
        // .zoom-container { width: min(100%, 100vh); height: min(100%, 100vh); ... }
        // Но 100vh - это высота окна, а .canvas-wrapper меньше.
        // Используем aspect-ratio: 1/1 и max-width: 100%, max-height: 100%.
        // Тогда .zoom-container будет квадратным и вписанным в .canvas-wrapper.
        // Но .canvas-wrapper не квадратный.
        // При scale = 1, .zoom-container центрирован.
        // Clamp относительно .canvas-wrapper:
        // translateX <= (canvasWrapperW - w) / 2
        // translateX >= (canvasWrapperW - w) / 2 - (w * scale - w) = (canvasWrapperW - w) / 2 + w - w * scale
        // Это сложно.
        // Проще: сделать .canvas-wrapper квадратным через JS.
        // При ресайзе устанавливаем размер .canvas-wrapper = min(доступная ширина, доступная высота).
        // Тогда .zoom-container = 100% от .canvas-wrapper.
        // И clamp простой.
        // Я сделаю это в JS.
        // Пока что для clamp используем размеры .canvas-wrapper.

        // Временно: используем размеры zoomContainer.parentElement
        const parentRect = zoomContainer.parentElement.getBoundingClientRect();
        const parentW = parentRect.width;
        const parentH = parentRect.height;

        // Размер zoomContainer (квадрат) в пикселях при scale = 1
        const baseW = zoomContainer.offsetWidth;
        const baseH = zoomContainer.offsetHeight;

        if (baseW === 0 || baseH === 0) return;

        // Текущий размер после масштабирования
        const scaledW = baseW * state.scale;
        const scaledH = baseH * state.scale;

        // Вычисляем допустимые границы translate
        // Левый край не должен быть правее левого края родителя
        // Правый край не должен быть левее правого края родителя
        let minX, maxX, minY, maxY;

        if (scaledW <= parentW) {
            // Если холст меньше родителя, центрируем
            minX = maxX = (parentW - scaledW) / 2;
        } else {
            minX = parentW - scaledW;
            maxX = 0;
        }

        if (scaledH <= parentH) {
            minY = maxY = (parentH - scaledH) / 2;
        } else {
            minY = parentH - scaledH;
            maxY = 0;
        }

        state.translateX = Math.max(minX, Math.min(maxX, state.translateX));
        state.translateY = Math.max(minY, Math.min(maxY, state.translateY));
    }

    // Обновление трансформации с clamp
    function updateTransform() {
        clampPan();
        applyTransform();
    }

    // ============================================================
    // 4. ЗУМ И ПАНОРАМИРОВАНИЕ
    // ============================================================

    // Обработчик колесика мыши для зума (ПК)
    zoomContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = -e.deltaY;
        const zoomFactor = 1.1;
        let newScale = state.scale;
        if (delta > 0) {
            newScale *= zoomFactor;
        } else {
            newScale /= zoomFactor;
        }
        newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));

        // Зум относительно курсора
        const rect = zoomContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Координаты в системе контейнера до зума
        const containerX = (mouseX - state.translateX) / state.scale;
        const containerY = (mouseY - state.translateY) / state.scale;

        // Новый translate
        state.translateX = mouseX - containerX * newScale;
        state.translateY = mouseY - containerY * newScale;
        state.scale = newScale;

        updateTransform();
    }, { passive: false });

    // Pointer events для тача и мыши
    zoomContainer.addEventListener('pointerdown', (e) => {
        // Сохраняем указатель
        state.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Если это второй палец и мы рисуем - отменяем рисование
        if (state.pointers.size === 2 && state.isDrawing) {
            cancelDrawing();
        }

        // Если два пальца - начинаем пинч
        if (state.pointers.size === 2) {
            e.preventDefault();
            state.isPinching = true;
            state.isDrawing = false;
            if (state.currentPath) {
                cancelDrawing();
            }
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

        // Если один палец и это средняя кнопка мыши или Shift+ЛКМ - панорамирование
        if (state.pointers.size === 1) {
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                e.preventDefault();
                state.isPanning = true;
                state.panStart = { x: e.clientX, y: e.clientY };
                state.panStartTranslate = { x: state.translateX, y: state.translateY };
                return;
            }

            // Иначе - рисование (только ЛКМ или касание)
            if (e.button === 0 || e.pointerType === 'touch') {
                e.preventDefault();
                startDrawing(e);
            }
        }
    });

    zoomContainer.addEventListener('pointermove', (e) => {
        if (!state.pointers.has(e.pointerId)) return;

        // Обновляем позицию указателя
        state.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Пинч
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

            // Зум относительно центра
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

        // Панорамирование
        if (state.isPanning) {
            e.preventDefault();
            const dx = e.clientX - state.panStart.x;
            const dy = e.clientY - state.panStart.y;
            state.translateX = state.panStartTranslate.x + dx;
            state.translateY = state.panStartTranslate.y + dy;
            updateTransform();
            return;
        }

        // Рисование
        if (state.isDrawing && e.pointerId === state.drawPointerId) {
            e.preventDefault();
            continueDrawing(e);
        }
    });

    zoomContainer.addEventListener('pointerup', (e) => {
        state.pointers.delete(e.pointerId);

        if (state.isPinching && state.pointers.size < 2) {
            state.isPinching = false;
        }

        if (state.isPanning) {
            state.isPanning = false;
        }

        if (state.isDrawing && e.pointerId === state.drawPointerId) {
            endDrawing();
        }

        // Если указателей не осталось, сбрасываем флаги
        if (state.pointers.size === 0) {
            state.isPinching = false;
            state.isPanning = false;
        }
    });

    zoomContainer.addEventListener('pointercancel', (e) => {
        state.pointers.delete(e.pointerId);
        if (state.isDrawing && e.pointerId === state.drawPointerId) {
            cancelDrawing();
        }
        if (state.pointers.size < 2) {
            state.isPinching = false;
        }
        if (state.isPanning) {
            state.isPanning = false;
        }
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

        // Создаем новый path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', state.isEraser ? state.bgColor : '#000000');
        path.setAttribute('stroke-width', state.brushSize);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        drawGroup.appendChild(path);
        state.currentPath = path;

        // Начальная точка
        updatePath();
    }

    function continueDrawing(e) {
        if (!state.isDrawing
