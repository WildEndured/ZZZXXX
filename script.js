/* =========================================================
   SVG Векторный редактор
   ========================================================= */

// ---------- DOM ----------
const stage          = document.getElementById('stage');
const zoomContainer  = document.getElementById('zoomContainer');
const bgLayer        = document.getElementById('bgLayer');
const imgLayer       = document.getElementById('imgLayer');
const svg            = document.getElementById('svg');
const gridGroup      = document.getElementById('gridGroup');
const drawGroup      = document.getElementById('drawGroup');

const toolBrush      = document.getElementById('toolBrush');
const toolEraser     = document.getElementById('toolEraser');
const sizeRange      = document.getElementById('sizeRange');
const sizeVal        = document.getElementById('sizeVal');
const brushColor     = document.getElementById('brushColor');
const undoBtn        = document.getElementById('undoBtn');
const clearBtn       = document.getElementById('clearBtn');

const bgColor        = document.getElementById('bgColor');
const uploadBtn      = document.getElementById('uploadBtn');
const fileInput      = document.getElementById('fileInput');
const imgScale       = document.getElementById('imgScale');
const imgScaleVal    = document.getElementById('imgScaleVal');
const imgOpacity     = document.getElementById('imgOpacity');
const imgOpacityVal  = document.getElementById('imgOpacityVal');

const marginRange    = document.getElementById('marginRange');
const marginVal      = document.getElementById('marginVal');
const headsRange     = document.getElementById('headsRange');
const headsVal       = document.getElementById('headsVal');

const exportSvgBtn   = document.getElementById('exportSvg');
const exportPngBtn   = document.getElementById('exportPng');

// ---------- Состояние ----------
const state = {
  scale: 1,          // зум
  tx: 0,             // смещение X (px)
  ty: 0,             // смещение Y (px)
  baseSize: 0,       // базовый размер контейнера (px, квадрат)
  tool: 'brush',     // 'brush' | 'eraser'
  color: '#000000',
  bgColor: '#ffffff',
  strokeWidth: 0.005,
  imgData: null,     // base64 подложки
  imgScale: 1,       // масштаб подложки (1 = 100%)
  imgOpacity: 1,
  margin: 0.05,      // 0..0.10
  heads: 4,
};

const MAX_SCALE = 20;
const MIN_SCALE = 1;

// ---------- Инициализация размеров ----------
function computeBaseSize() {
  const rect = stage.getBoundingClientRect();
  // Квадрат по меньшей стороне с небольшим отступом
  const pad = 16;
  const size = Math.max(50, Math.min(rect.width, rect.height) - pad);
  state.baseSize = size;
  zoomContainer.style.width  = size + 'px';
  zoomContainer.style.height = size + 'px';
}

// Пересчёт трансформации с жёстким clamp
function applyTransform() {
  const rect = stage.getBoundingClientRect();
  const size = state.baseSize * state.scale;

  // Ограничение: нельзя увести холст за края контейнера
  // Если холст меньше контейнера — центрируем, иначе clamp в границах
  let tx, ty;

  if (size <= rect.width) {
    tx = (rect.width - size) / 2;
  } else {
    // Разрешаем сдвиг от (rect.width - size) до 0
    tx = Math.min(0, Math.max(rect.width - size, state.tx));
  }

  if (size <= rect.height) {
    ty = (rect.height - size) / 2;
  } else {
    ty = Math.min(0, Math.max(rect.height - size, state.ty));
  }

  state.tx = tx;
  state.ty = ty;

  zoomContainer.style.transform =
    `translate(${tx}px, ${ty}px) scale(${state.scale})`;
}

// ---------- Зум ----------
function zoomAt(clientX, clientY, newScale) {
  const rect = stage.getBoundingClientRect();
  newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

  // Точка под курсором в координатах контейнера (до зума)
  const cx = (clientX - rect.left - state.tx) / state.scale;
  const cy = (clientY - rect.top  - state.ty) / state.scale;

  state.scale = newScale;
  // Сохраняем точку под курсором
  state.tx = clientX - rect.left - cx * state.scale;
  state.ty = clientY - rect.top  - cy * state.scale;

  applyTransform();
}

// ---------- Обработка Pointer-событий ----------
const pointers = new Map(); // id -> {x, y}
let isDrawing = false;
let currentPath = null;
let currentPoints = []; // точки текущего пути (для сглаживания)

// Расчёт расстояния между двумя точками
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Центр между точками
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

stage.addEventListener('pointerdown', onPointerDown);
stage.addEventListener('pointermove', onPointerMove);
stage.addEventListener('pointerup', onPointerUp);
stage.addEventListener('pointercancel', onPointerUp);
stage.addEventListener('pointerleave', onPointerUp);

// Отключаем контекстное меню на средней кнопке
stage.addEventListener('contextmenu', e => e.preventDefault());

// Колесо мыши — зум
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  zoomAt(e.clientX, e.clientY, state.scale * factor);
}, { passive: false });

function onPointerDown(e) {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  stage.setPointerCapture?.(e.pointerId);

  // Если появился второй палец — отменяем рисование
  if (pointers.size >= 2 && isDrawing) {
    cancelDrawing();
  }

  // Начало рисования: только один палец/ЛКМ, не средняя кнопка
  if (pointers.size === 1 && !isDrawing) {
    const isMiddle = e.button === 1;
    const isShiftLeft = e.button === 0 && e.shiftKey;

    if (isMiddle || isShiftLeft) {
      // Панорамирование
      return;
    }

    if (e.button === 0 || e.pointerType === 'touch') {
      startDrawing(e);
    }
  }
}

function onPointerMove(e) {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;

  // Обновляем точку
  const curr = { x: e.clientX, y: e.clientY };

  // --- Два пальца: зум + панорамирование ---
  if (pointers.size === 2) {
    if (isDrawing) cancelDrawing();

    // Получаем оба указателя
    const ids = [...pointers.keys()];
    const otherId = ids.find(id => id !== e.pointerId);
    const other = pointers.get(otherId);

    const prevDist = dist(prev, other);
    const currDist = dist(curr, other);

    const prevMid = midpoint(prev, other);
    const currMid = midpoint(curr, other);

    // Обновляем запись
    pointers.set(e.pointerId, curr);

    if (prevDist > 0) {
      // Зум вокруг середины
      const factor = currDist / prevDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, state.scale * factor));

      const rect = stage.getBoundingClientRect();
      const cx = (prevMid.x - rect.left - state.tx) / state.scale;
      const cy = (prevMid.y - rect.top  - state.ty) / state.scale;

      state.scale = newScale;
      state.tx = currMid.x - rect.left - cx * state.scale;
      state.ty = currMid.y - rect.top  - cy * state.scale;

      // Панорамирование за счёт смещения середины
      state.tx += currMid.x - prevMid.x;
      state.ty += currMid.y - prevMid.y;

      applyTransform();
    }
    return;
  }

  // --- Один палец ---
  // Панорамирование (средняя кнопка / shift+ЛКМ)
  if (e.buttons & 4 || (e.buttons & 1 && e.shiftKey)) {
    pointers.set(e.pointerId, curr);
    state.tx += curr.x - prev.x;
    state.ty += curr.y - prev.y;
    applyTransform();
    return;
  }

  // Рисование
  if (isDrawing && pointers.size === 1) {
    pointers.set(e.pointerId, curr);
    continueDrawing(e);
  }
}

function onPointerUp(e) {
  const wasDrawing = isDrawing;
  pointers.delete(e.pointerId);

  if (wasDrawing && pointers.size === 0) {
    finishDrawing();
  }
  // Если остался один палец после отмены зума — ничего не делаем
}

// ---------- Рисование ----------
function clientToSvg(clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top)  / rect.height,
  };
}

function startDrawing(e) {
  isDrawing = true;
  currentPoints = [];
  const p = clientToSvg(e.clientX, e.clientY);
  currentPoints.push(p);

  currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  currentPath.setAttribute('stroke', state.tool === 'eraser' ? state.bgColor : state.color);
  currentPath.setAttribute('stroke-width', state.strokeWidth);
  currentPath.setAttribute('vector-effect', 'non-scaling-stroke');
  currentPath.setAttribute('d', `M ${p.x} ${p.y}`);
  drawGroup.appendChild(currentPath);
}

function continueDrawing(e) {
  if (!currentPath) return;
  const p = clientToSvg(e.clientX, e.clientY);
  const prev = currentPoints[currentPoints.length - 1];
  // Пропускаем слишком близкие точки
  if (Math.hypot(p.x - prev.x, p.y - prev.y) < 0.0005) return;

  currentPoints.push(p);

  // Сглаживание: квадратичная кривая через середины
  const mid = midpoint(prev, p);
  let d = currentPath.getAttribute('d');
  d += ` Q ${prev.x} ${prev.y} ${mid.x} ${mid.y}`;
  currentPath.setAttribute('d', d);
}

function finishDrawing() {
  if (!currentPath) return;
  // Завершаем линию до последней точки
  const last = currentPoints[currentPoints.length - 1];
  let d = currentPath.getAttribute('d');
  d += ` L ${last.x} ${last.y}`;
  currentPath.setAttribute('d', d);

  isDrawing = false;
  currentPath = null;
  currentPoints = [];
}

function cancelDrawing() {
  if (currentPath) {
    currentPath.remove();
  }
  isDrawing = false;
  currentPath = null;
  currentPoints = [];
}

// ---------- Undo / Clear ----------
undoBtn.addEventListener('click', () => {
  // Удаляем последний нарисованный путь (не сетку)
  const paths = drawGroup.querySelectorAll('path');
  if (paths.length) {
    paths[paths.length - 1].remove();
  }
});

clearBtn.addEventListener('click', () => {
  drawGroup.innerHTML = '';
});

// ---------- Инструменты ----------
toolBrush.addEventListener('click', () => {
  state.tool = 'brush';
  toolBrush.classList.add('active');
  toolEraser.classList.remove('active');
});
toolEraser.addEventListener('click', () => {
  state.tool = 'eraser';
  toolEraser.classList.add('active');
  toolBrush.classList.remove('active');
});

sizeRange.addEventListener('input', () => {
  state.strokeWidth = parseFloat(sizeRange.value);
  sizeVal.textContent = state.strokeWidth.toFixed(5);
});

brushColor.addEventListener('input', () => {
  state.color = brushColor.value;
});

// ---------- Фон ----------
bgColor.addEventListener('input', () => {
  state.bgColor = bgColor.value;
  bgLayer.style.background = state.bgColor;
});

// ---------- Подложка ----------
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.imgData = reader.result;
    imgLayer.src = state.imgData;
    imgLayer.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

imgScale.addEventListener('input', () => {
  state.imgScale = parseInt(imgScale.value) / 100;
  imgScaleVal.textContent = imgScale.value;
  updateImageTransform();
});

imgOpacity.addEventListener('input', () => {
  state.imgOpacity = parseInt(imgOpacity.value) / 100;
  imgOpacityVal.textContent = imgOpacity.value;
  imgLayer.style.opacity = state.imgOpacity;
});

// Масштаб подложки: 100% = вписана по высоте, пропорции сохранены
function updateImageTransform() {
  if (!state.imgData) return;
  // object-fit: contain уже вписывает по одной из сторон.
  // Дополнительно масштабируем по высоте холста.
  imgLayer.style.transform = `scale(${state.imgScale})`;
  imgLayer.style.transformOrigin = 'center center';
}

// ---------- Разметка (сетка) ----------
function drawGrid() {
  gridGroup.innerHTML = '';
  const m = state.margin;
  const heads = state.heads;

  // Красная рамка зоны (верх и низ по отступу)
  const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  frame.setAttribute('x', 0);
  frame.setAttribute('y', m);
  frame.setAttribute('width', 1);
  frame.setAttribute('height', 1 - 2 * m);
  frame.setAttribute('fill', 'none');
  frame.setAttribute('stroke', '#ff2d2d');
  frame.setAttribute('stroke-width', 0.002);
  frame.setAttribute('vector-effect', 'non-scaling-stroke');
  gridGroup.appendChild(frame);

  // Горизонтальные пунктирные линии, делят зону между отступами на heads частей
  const innerHeight = 1 - 2 * m;
  if (heads > 1) {
    for (let i = 1; i < heads; i++) {
      const y = m + (innerHeight * i) / heads;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', 1);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#ff2d2d');
      line.setAttribute('stroke-width', 0.0015);
      line.setAttribute('stroke-dasharray', '0.01 0.01');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      gridGroup.appendChild(line);
    }
  }
}

marginRange.addEventListener('input', () => {
  state.margin = parseInt(marginRange.value) / 100;
  marginVal.textContent = marginRange.value;
  drawGrid();
});

headsRange.addEventListener('input', () => {
  state.heads = parseInt(headsRange.value);
  headsVal.textContent = headsRange.value;
  drawGrid();
});

// ---------- Экспорт ----------
const SVG_NS = 'http://www.w3.org/2000/svg';

function buildExportSvg() {
  // Новый SVG с нуля, без зума/панорамирования
  const out = document.createElementNS(SVG_NS, 'svg');
  out.setAttribute('xmlns', SVG_NS);
  out.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  out.setAttribute('viewBox', '0 0 1 1');
  out.setAttribute('width', '1024');
  out.setAttribute('height', '1024');

  // 1. Фон
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', 0);
  bg.setAttribute('y', 0);
  bg.setAttribute('width', 1);
  bg.setAttribute('height', 1);
  bg.setAttribute('fill', state.bgColor);
  out.appendChild(bg);

  // 2. Подложка (если есть)
  if (state.imgData) {
    // Вписываем по высоте: 100% = высота холста, пропорции сохранены.
    // viewBox = 0 0 1 1, значит высота = 1.
    // Изображение масштабируется от центра.
    const img = document.createElementNS(SVG_NS, 'image');
    img.setAttribute('href', state.imgData);
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', state.imgData);

    // Используем вложенный <image> с центрированием.
    // Чтобы сохранить пропорции, ширину/высоту зададим через
    // вложенный <svg> с preserveAspectRatio="xMidYMid meet".
    // Но проще: загружаем размеры картинки асинхронно нельзя — 
    // поэтому используем паттерн через отдельный Image вне экспорта.
    // Здесь мы уже знаем, что объект вписан по высоте: 
    // реальная отрисовка в браузере через object-fit: contain.
    // Для экспорта аппроксимируем: используем image с width/height 1 
    // и preserveAspectRatio="xMidYMid meet".
    img.setAttribute('x', 0);
    img.setAttribute('y', 0);
    img.setAttribute('width', 1);
    img.setAttribute('height', 1);
    img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    img.setAttribute('opacity', state.imgOpacity);
    img.setAttribute('transform', `translate(0.5 0.5) scale(${state.imgScale}) translate(-0.5 -0.5)`);
    out.appendChild(img);
  }

  // 3. Все пути из drawGroup (клонируем)
  const paths = drawGroup.querySelectorAll('path');
  paths.forEach(p => {
    out.appendChild(p.cloneNode(true));
  });

  // 4. Разметка (опционально: экспортируем и сетку? По заданию — только фон, подложка, пути.
  // Сетка не входит в обязательный экспорт, но пользователь видит её.
  // Оставим сетку не включённой в экспорт согласно ТЗ.)
  return out;
}

function serializeSvg(svgEl) {
  return new XMLSerializer().serializeToString(svgEl);
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
  const svgEl = buildExportSvg();
  const str = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializeSvg(svgEl);
  const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, 'drawing.svg');
});

exportPngBtn.addEventListener('click', () => {
  const SIZE = 4096;
  const svgEl = buildExportSvg();
  svgEl.setAttribute('width', SIZE);
  svgEl.setAttribute('height', SIZE);
  const str = serializeSvg(svgEl);

  const svgBlob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, SIZE, SIZE);
    canvas.toBlob(blob => {
      if (blob) downloadBlob(blob, 'drawing.png');
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    alert('Ошибка экспорта PNG');
  };
  image.src = url;
});

// ---------- Ресайз ----------
function handleResize() {
  computeBaseSize();
  applyTransform();
}

window.addEventListener('resize', handleResize);

// ---------- Старт ----------
function init() {
  computeBaseSize();
  applyTransform();
  drawGrid();
  bgLayer.style.background = state.bgColor;
}

init();
