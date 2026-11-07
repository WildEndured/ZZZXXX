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

const bgColorInput   = document.getElementById('bgColor');
const uploadBtn      = document.getElementById('uploadBtn');
const fileInput      = document.getElementById('fileInput');
const imgScaleInput  = document.getElementById('imgScale');
const imgScaleVal    = document.getElementById('imgScaleVal');
const imgOpacityInp  = document.getElementById('imgOpacity');
const imgOpacityVal  = document.getElementById('imgOpacityVal');

const marginRange    = document.getElementById('marginRange');
const marginVal      = document.getElementById('marginVal');
const headsRange     = document.getElementById('headsRange');
const headsVal       = document.getElementById('headsVal');

const exportSvgBtn   = document.getElementById('exportSvg');
const exportPngBtn   = document.getElementById('exportPng');

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

// ---------- Состояние ----------
const state = {
  scale: 1,
  tx: 0,
  ty: 0,
  baseSize: 0,
  tool: 'brush',
  color: '#000000',
  bgColor: '#ffffff',
  strokeWidth: 0.005,
  imgData: null,
  imgNatural: null,
  imgScale: 1,
  imgOpacity: 1,
  margin: 0.05,
  heads: 4,
};

const MAX_SCALE = 20;
const MIN_SCALE = 1;

// ---------- Размеры ----------
function stageSize() {
  const r = stage.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) return { w: r.width, h: r.height };
  const isMobile = window.innerWidth <= 720;
  const panelW = isMobile ? 0 : 260;
  const panelH = isMobile ? window.innerHeight * 0.45 : 0;
  return {
    w: window.innerWidth  - panelW,
    h: window.innerHeight - panelH,
  };
}

function computeBaseSize() {
  const { w, h } = stageSize();
  const pad = 16;
  const size = Math.max(50, Math.min(w, h) - pad);
  state.baseSize = size;
  zoomContainer.style.width  = size + 'px';
  zoomContainer.style.height = size + 'px';
}

function applyTransform() {
  const { w: rectW, h: rectH } = stageSize();
  const size = state.baseSize * state.scale;

  let tx, ty;

  if (size <= rectW) {
    tx = (rectW - size) / 2;
  } else {
    tx = Math.min(0, Math.max(rectW - size, state.tx));
  }

  if (size <= rectH) {
    ty = (rectH - size) / 2;
  } else {
    ty = Math.min(0, Math.max(rectH - size, state.ty));
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

  const cx = (clientX - rect.left - state.tx) / state.scale;
  const cy = (clientY - rect.top  - state.ty) / state.scale;

  state.scale = newScale;
  state.tx = clientX - rect.left - cx * state.scale;
  state.ty = clientY - rect.top  - cy * state.scale;

  applyTransform();
}

// ---------- Pointer-события ----------
const pointers = new Map();
let isDrawing = false;
let currentPath = null;
let currentPoints = [];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

stage.addEventListener('pointerdown', onPointerDown);
stage.addEventListener('pointermove', onPointerMove);
stage.addEventListener('pointerup', onPointerUp);
stage.addEventListener('pointercancel', onPointerUp);
stage.addEventListener('pointerleave', onPointerUp);
stage.addEventListener('contextmenu', e => e.preventDefault());

stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  zoomAt(e.clientX, e.clientY, state.scale * factor);
}, { passive: false });

function onPointerDown(e) {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  try { stage.setPointerCapture(e.pointerId); } catch (_) {}

  if (pointers.size >= 2 && isDrawing) {
    cancelDrawing();
  }

  if (pointers.size === 1 && !isDrawing) {
    const isMiddle = e.button === 1;
    const isShiftLeft = e.button === 0 && e.shiftKey;

    if (isMiddle || isShiftLeft) return;

    if (e.button === 0 || e.pointerType === 'touch') {
      startDrawing(e);
    }
  }
}

function onPointerMove(e) {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;

  const curr = { x: e.clientX, y: e.clientY };

  if (pointers.size === 2) {
    if (isDrawing) cancelDrawing();

    const ids = [...pointers.keys()];
    const otherId = ids.find(id => id !== e.pointerId);
    const other = pointers.get(otherId);

    const prevDist = dist(prev, other);
    const currDist = dist(curr, other);

    const prevMid = midpoint(prev, other);
    const currMid = midpoint(curr, other);

    pointers.set(e.pointerId, curr);

    if (prevDist > 0) {
      const factor = currDist / prevDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, state.scale * factor));

      const rect = stage.getBoundingClientRect();
      const cx = (prevMid.x - rect.left - state.tx) / state.scale;
      const cy = (prevMid.y - rect.top  - state.ty) / state.scale;

      state.scale = newScale;
      state.tx = currMid.x - rect.left - cx * state.scale;
      state.ty = currMid.y - rect.top  - cy * state.scale;

      state.tx += currMid.x - prevMid.x;
      state.ty += currMid.y - prevMid.y;

      applyTransform();
    }
    return;
  }

  if ((e.buttons & 4) || (e.buttons & 1 && e.shiftKey)) {
    pointers.set(e.pointerId, curr);
    state.tx += curr.x - prev.x;
    state.ty += curr.y - prev.y;
    applyTransform();
    return;
  }

  if (isDrawing && pointers.size === 1) {
    pointers.set(e.pointerId, curr);
    continueDrawing(e);
  }
}

function onPointerUp(e) {
  const wasDrawing = isDrawing;
  pointers.delete(e.pointerId);
  try { stage.releasePointerCapture(e.pointerId); } catch (_) {}

  if (wasDrawing && pointers.size === 0) {
    finishDrawing();
  }
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

  currentPath = document.createElementNS(SVG_NS, 'path');
  currentPath.setAttribute('stroke', state.tool === 'eraser' ? state.bgColor : state.color);
  currentPath.setAttribute('stroke-width', state.strokeWidth);
  currentPath.setAttribute('vector-effect', 'non-scaling-stroke');
  currentPath.setAttribute('d', `M ${p.x.toFixed(5)} ${p.y.toFixed(5)}`);
  drawGroup.appendChild(currentPath);
}

function continueDrawing(e) {
  if (!currentPath) return;
  const p = clientToSvg(e.clientX, e.clientY);
  const prev = currentPoints[currentPoints.length - 1];
  if (Math.hypot(p.x - prev.x, p.y - prev.y) < 0.0005) return;

  currentPoints.push(p);

  const mid = midpoint(prev, p);
  let d = currentPath.getAttribute('d');
  d += ` Q ${prev.x.toFixed(5)} ${prev.y.toFixed(5)} ${mid.x.toFixed(5)} ${mid.y.toFixed(5)}`;
  currentPath.setAttribute('d', d);
}

function finishDrawing() {
  if (!currentPath) return;
  const last = currentPoints[currentPoints.length - 1];
  let d = currentPath.getAttribute('d');
  d += ` L ${last.x.toFixed(5)} ${last.y.toFixed(5)}`;
  currentPath.setAttribute('d', d);

  isDrawing = false;
  currentPath = null;
  currentPoints = [];
}

function cancelDrawing() {
  if (currentPath) currentPath.remove();
  isDrawing = false;
  currentPath = null;
  currentPoints = [];
}

// ---------- Undo / Clear ----------
undoBtn.addEventListener('click', () => {
  const paths = drawGroup.querySelectorAll('path');
  if (paths.length) paths[paths.length - 1].remove();
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
bgColorInput.addEventListener('input', () => {
  state.bgColor = bgColorInput.value;
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
    imgLayer.onload = () => {
      state.imgNatural = { w: imgLayer.naturalWidth, h: imgLayer.naturalHeight };
      imgLayer.style.display = 'block';
      updateImageTransform();
    };
    imgLayer.src = state.imgData;
  };
  reader.readAsDataURL(file);
});

imgScaleInput.addEventListener('input', () => {
  state.imgScale = parseInt(imgScaleInput.value) / 100;
  imgScaleVal.textContent = imgScaleInput.value;
  updateImageTransform();
});

imgOpacityInp.addEventListener('input', () => {
  state.imgOpacity = parseInt(imgOpacityInp.value) / 100;
  imgOpacityVal.textContent = imgOpacityInp.value;
  imgLayer.style.opacity = state.imgOpacity;
});

function updateImageTransform() {
  if (!state.imgData) return;
  imgLayer.style.transform = `scale(${state.imgScale})`;
  imgLayer.style.transformOrigin = 'center center';
}

// ---------- Разметка (Сетка) ----------
function drawGrid() {
  gridGroup.innerHTML = '';
  const m = state.margin;
  const heads = state.heads;

  // Красная рамка зоны (отступ сверху и снизу)
  const frame = document.createElementNS(SVG_NS, 'rect');
  frame.setAttribute('x', 0);
  frame.setAttribute('y', m);
  frame.setAttribute('width', 1);
  frame.setAttribute('height', Math.max(0.0001, 1 - 2 * m));
  frame.setAttribute('fill', 'none');
  frame.setAttribute('stroke', '#ff2d2d');
  frame.setAttribute('stroke-width', 0.003);
  frame.setAttribute('pointer-events', 'none');
  gridGroup.appendChild(frame);

  // Горизонтальные пунктирные линии — делят зону на heads частей
  const innerHeight = 1 - 2 * m;
  if (heads > 1 && innerHeight > 0) {
    for (let i = 1; i < heads; i++) {
      const y = m + (innerHeight * i) / heads;
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', 1);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#ff2d2d');
      line.setAttribute('stroke-width', 0.0025);
      line.setAttribute('stroke-dasharray', '0.02 0.015');
      line.setAttribute('pointer-events', 'none');
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
function buildExportSvg() {
  const out = document.createElementNS(SVG_NS, 'svg');
  out.setAttribute('xmlns', SVG_NS);
  out.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', XLINK_NS);
  out.setAttribute('viewBox', '0 0 1 1');
  out.setAttribute('width', '1024');
  out.setAttribute('height', '1024');

  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', 0);
  bg.setAttribute('y', 0);
  bg.setAttribute('width', 1);
  bg.setAttribute('height', 1);
  bg.setAttribute('fill', state.bgColor);
  out.appendChild(bg);

  if (state.imgData && state.imgNatural) {
    const aspect = state.imgNatural.w / state.imgNatural.h;
    let baseW = aspect;
    let baseH = 1;
    if (baseW > 1) {
      baseW = 1;
      baseH = 1 / aspect;
    }
    const finalW = baseW * state.imgScale;
    const finalH = baseH * state.imgScale;

    const img = document.createElementNS(SVG_NS, 'image');
    img.setAttribute('href', state.imgData);
    img.setAttributeNS(XLINK_NS, 'xlink:href', state.imgData);
    img.setAttribute('x', (1 - finalW) / 2);
    img.setAttribute('y', (1 - finalH) / 2);
    img.setAttribute('width', finalW);
    img.setAttribute('height', finalH);
    img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    img.setAttribute('opacity', state.imgOpacity);
    out.appendChild(img);
  }

  const paths = drawGroup.querySelectorAll('path');
  paths.forEach(p => out.appendChild(p.cloneNode(true)));

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
  bgLayer.style.background = state.bgColor;
  drawGrid();

  requestAnimationFrame(() => {
    computeBaseSize();
    applyTransform();
    requestAnimationFrame(() => {
      computeBaseSize();
      applyTransform();
    });
  });
}

init();
