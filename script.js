'use strict';

/* =========================================================
   ЛОГИКА АККОРДЕОНОВ
   ========================================================= */
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    header.parentElement.classList.toggle('open');
  });
});

/* =========================================================
   1. ХОЛСТ И СЛОИ — ссылки на DOM
   ========================================================= */
const container    = document.getElementById('canvasContainer');
const zoomLayer    = document.getElementById('zoomLayer');
const bgLayer      = document.getElementById('bgLayer');
const backImage    = document.getElementById('backImage');
const drawSvg      = document.getElementById('drawSvg');
const drawGroup    = document.getElementById('drawGroup');
const guidesGroup  = document.getElementById('guidesGroup');

/* =========================================================
   2. ЗУМ И ПАНОРАМИРОВАНИЕ
   ========================================================= */
const zoomState = { scale: 1, tx: 0, ty: 0 };

function clampTransform() {
  const rect = container.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  if (zoomState.scale < 1) zoomState.scale = 1;

  const minTx = w * (1 - zoomState.scale);
  const minTy = h * (1 - zoomState.scale);

  if (zoomState.tx > 0) zoomState.tx = 0;
  if (zoomState.tx < minTx) zoomState.tx = minTx;
  if (zoomState.ty > 0) zoomState.ty = 0;
  if (zoomState.ty < minTy) zoomState.ty = minTy;
}

function applyTransform() {
  clampTransform();
  zoomLayer.style.transform = `translate(${zoomState.tx}px, ${zoomState.ty}px) scale(${zoomState.scale})`;
}

/* =========================================================
   3. РИСОВАНИЕ
   ========================================================= */
const brush = { color: '#e63946', size: 0.005, eraser: false };

let currentPath = null;
let currentPoints = [];
let isDrawing = false;
let activePointerId = null;
const history = [];

function toSvgCoords(clientX, clientY) {
  const rect = drawSvg.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height
  };
}

function buildPathD(points) {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const [p] = points;
    return `M ${p.x} ${p.y} L ${p.x} ${p.y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    d += ` L ${points[1].x} ${points[1].y}`;
    return d;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function startNewPath(pt) {
  currentPoints = [pt];
  currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  currentPath.setAttribute('fill', 'none');
  currentPath.setAttribute('stroke-linecap', 'round');
  currentPath.setAttribute('stroke-linejoin', 'round');

  if (brush.eraser) {
    currentPath.setAttribute('stroke', bgLayer.style.backgroundColor || '#ffffff');
  } else {
    currentPath.setAttribute('stroke', brush.color);
  }

  currentPath.setAttribute('stroke-width', brush.size);
  currentPath.setAttribute('d', buildPathD(currentPoints));
  drawGroup.appendChild(currentPath);
}

function updatePath(pt) {
  if (!currentPath) return;
  const last = currentPoints[currentPoints.length - 1];
  const dx = pt.x - last.x;
  const dy = pt.y - last.y;
  if (dx * dx + dy * dy < 0.00002) return;

  currentPoints.push(pt);
  currentPath.setAttribute('d', buildPathD(currentPoints));
}

function cancelCurrentPath() {
  if (currentPath && currentPath.parentNode) {
    currentPath.parentNode.removeChild(currentPath);
  }
  currentPath = null;
  currentPoints = [];
  isDrawing = false;
  activePointerId = null;
}

/* =========================================================
   4. POINTER EVENTS
   ========================================================= */
const activePointers = new Map();
let pinchStart = null;
let panStart = null;

drawSvg.addEventListener('pointerdown', (e) => {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size === 2) {
    if (isDrawing) cancelCurrentPath();
    drawSvg.setPointerCapture && drawSvg.setPointerCapture(e.pointerId);
    initPinch();
    return;
  }

  const isPan = (e.button === 1) || (e.shiftKey && e.button === 0);
  if (isPan && activePointers.size === 1) {
    drawSvg.setPointerCapture(e.pointerId);
    panStart = { x: e.clientX, y: e.clientY, tx: zoomState.tx, ty: zoomState.ty };
    return;
  }

  if (e.button !== 0 && e.pointerType === 'mouse') return;
  if (activePointers.size !== 1) return;

  e.preventDefault();
  drawSvg.setPointerCapture(e.pointerId);
  isDrawing = true;
  activePointerId = e.pointerId;
  startNewPath(toSvgCoords(e.clientX, e.clientY));
});

drawSvg.addEventListener('pointermove', (e) => {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size === 2) {
    handlePinch();
    return;
  }

  if (panStart) {
    zoomState.tx = panStart.tx + (e.clientX - panStart.x);
    zoomState.ty = panStart.ty + (e.clientY - panStart.y);
    applyTransform();
    return;
  }

  if (isDrawing && e.pointerId === activePointerId) {
    e.preventDefault();
    updatePath(toSvgCoords(e.clientX, e.clientY));
  }
});

function endPointer(e) {
  activePointers.delete(e.pointerId);

  if (isDrawing && e.pointerId === activePointerId) {
    if (currentPath) history.push(currentPath);
    currentPath = null;
    currentPoints = [];
    isDrawing = false;
    activePointerId = null;
  }

  if (panStart) panStart = null;
  if (activePointers.size < 2) pinchStart = null;
  if (activePointers.size === 0) {
    pinchStart = null;
    panStart = null;
  }
}

drawSvg.addEventListener('pointerup', endPointer);
drawSvg.addEventListener('pointercancel', endPointer);

container.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = container.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  const oldScale = zoomState.scale;
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  let newScale = oldScale * factor;
  if (newScale < 1) newScale = 1;
  if (newScale > 20) newScale = 20;

  zoomState.tx = cx - (cx - zoomState.tx) * (newScale / oldScale);
  zoomState.ty = cy - (cy - zoomState.ty) * (newScale / oldScale);
  zoomState.scale = newScale;
  applyTransform();
}, { passive: false });

function getPinchData() {
  const pts = [...activePointers.values()];
  if (pts.length < 2) return null;
  const [a, b] = pts;
  return { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
}

function initPinch() {
  const data = getPinchData();
  if (!data) return;
  const rect = container.getBoundingClientRect();
  pinchStart = {
    dist: data.dist, scale: zoomState.scale, tx: zoomState.tx, ty: zoomState.ty,
    cx: data.cx - rect.left, cy: data.cy - rect.top
  };
}

function handlePinch() {
  const data = getPinchData();
  if (!data || !pinchStart) return;
  const rect = container.getBoundingClientRect();
  const cx = data.cx - rect.left;
  const cy = data.cy - rect.top;

  let newScale = pinchStart.scale * (data.dist / pinchStart.dist);
  if (newScale < 1) newScale = 1;
  if (newScale > 20) newScale = 20;

  const ratio = newScale / pinchStart.scale;
  zoomState.scale = newScale;
  zoomState.tx = cx - (pinchStart.cx - pinchStart.tx) * ratio;
  zoomState.ty = cy - (pinchStart.cy - pinchStart.ty) * ratio;
  applyTransform();
}

/* =========================================================
   5. UI
   ========================================================= */
const brushColorInput = document.getElementById('brushColor');
const brushSizeInput  = document.getElementById('brushSize');
const brushSizeVal    = document.getElementById('brushSizeVal');
const bgColorInput    = document.getElementById('bgColor');
const eraserCheckbox  = document.getElementById('eraserMode');

brushColorInput.addEventListener('input', () => {
  brush.color = brushColorInput.value;
  eraserCheckbox.checked = false;
  brush.eraser = false;
});

brushSizeInput.addEventListener('input', () => {
  brush.size = parseFloat(brushSizeInput.value);
  brushSizeVal.textContent = brush.size.toFixed(5);
});

bgColorInput.addEventListener('input', () => {
  bgLayer.style.backgroundColor = bgColorInput.value;
  if (brush.eraser) brush.color = bgColorInput.value;
});

eraserCheckbox.addEventListener('change', () => {
  brush.eraser = eraserCheckbox.checked;
});

document.getElementById('btnUndo').addEventListener('click', () => {
  const last = history.pop();
  if (last && last.parentNode) last.parentNode.removeChild(last);
});

document.getElementById('btnClear').addEventListener('click', () => {
  drawGroup.innerHTML = '';
  history.length = 0;
  currentPath = null;
  currentPoints = [];
});

/* Подложка */
const imageInput    = document.getElementById('imageInput');
const uploadBtn     = document.getElementById('uploadImageBtn');
const imgScale      = document.getElementById('imgScale');
const imgScaleVal   = document.getElementById('imgScaleVal');
const imgOpacity    = document.getElementById('imgOpacity');
const imgOpacityVal = document.getElementById('imgOpacityVal');

let backImageData = null;
let backImageRatio = 1;

uploadBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    backImageData = ev.target.result;
    backImage.src = backImageData;
    backImage.onload = () => {
      backImageRatio = backImage.naturalWidth / backImage.naturalHeight;
      updateBackImage();
    };
  };
  reader.readAsDataURL(file);
});

function updateBackImage() {
  const scale = parseInt(imgScale.value, 10) / 100;
  const opacity = parseInt(imgOpacity.value, 10) / 100;
  const baseHeight = container.clientHeight;
  const h = baseHeight * scale;
  const w = h * backImageRatio;

  backImage.style.height = h + 'px';
  backImage.style.width  = w + 'px';
  backImage.style.opacity = opacity;

  imgScaleVal.textContent   = imgScale.value + '%';
  imgOpacityVal.textContent = imgOpacity.value + '%';
}

imgScale.addEventListener('input', updateBackImage);
imgOpacity.addEventListener('input', updateBackImage);

window.addEventListener('resize', () => {
  applyTransform();
  updateBackImage();
});

/* Разметка */
const marginInput = document.getElementById('marginSize');
const marginVal   = document.getElementById('marginVal');
const headsInput  = document.getElementById('headsCount');
const headsVal    = document.getElementById('headsVal');

function drawGuides() {
  guidesGroup.innerHTML = '';
  const margin = parseFloat(marginInput.value) / 100;
  const heads  = parseInt(headsInput.value, 10);

  marginVal.textContent = (margin * 100).toFixed(1) + '%';
  headsVal.textContent  = heads;

  const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  frame.setAttribute('x', '0');
  frame.setAttribute('y', margin);
  frame.setAttribute('width', '1');
  frame.setAttribute('height', 1 - margin * 2);
  frame.setAttribute('fill', 'none');
  frame.setAttribute('stroke', '#e63946');
  frame.setAttribute('stroke-width', '0.002');
  frame.setAttribute('vector-effect', 'non-scaling-stroke');
  guidesGroup.appendChild(frame);

  const areaTop = margin;
  const areaBottom = 1 - margin;
  const areaHeight = areaBottom - areaTop;
  const step = areaHeight / heads;

  for (let i = 1; i < heads; i++) {
    const y = areaTop + step * i;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', y);
    line.setAttribute('x2', '1');
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#e63946');
    line.setAttribute('stroke-width', '0.0015');
    line.setAttribute('stroke-dasharray', '0.01 0.01');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    guidesGroup.appendChild(line);
  }
}

marginInput.addEventListener('input', drawGuides);
headsInput.addEventListener('input', drawGuides);

/* =========================================================
   6. ЭКСПОРТ
   ========================================================= */
const SVG_NS = 'http://www.w3.org/2000/svg';
const EXPORT_SIZE = 4096;

function buildExportSvg() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  svg.setAttribute('viewBox', '0 0 1 1');
  svg.setAttribute('width', EXPORT_SIZE);
  svg.setAttribute('height', EXPORT_SIZE);

  const bgRect = document.createElementNS(SVG_NS, 'rect');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', '1');
  bgRect.setAttribute('height', '1');
  bgRect.setAttribute('fill', bgLayer.style.backgroundColor || '#ffffff');
  svg.appendChild(bgRect);

  if (backImageData) {
    const imgScaleVal_ = parseInt(imgScale.value, 10) / 100;
    const imgOpacityVal_ = parseInt(imgOpacity.value, 10) / 100;
    const imgH = imgScaleVal_;
    const imgW = imgScaleVal_ * backImageRatio;

    const imgEl = document.createElementNS(SVG_NS, 'image');
    imgEl.setAttribute('x', ((1 - imgW) / 2).toString());
    imgEl.setAttribute('y', ((1 - imgH) / 2).toString());
    imgEl.setAttribute('width', imgW.toString());
    imgEl.setAttribute('height', imgH.toString());
    imgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    imgEl.setAttribute('opacity', imgOpacityVal_.toString());
    imgEl.setAttribute('xlink:href', backImageData);
    imgEl.setAttribute('href', backImageData);
    svg.appendChild(imgEl);
  }

  drawGroup.querySelectorAll('path').forEach((p) => {
    svg.appendChild(p.cloneNode(true));
  });

  return svg;
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

document.getElementById('btnExportSvg').addEventListener('click', () => {
  const svg = buildExportSvg();
  let source = new XMLSerializer().serializeToString(svg);
  if (!source.includes('<?xml')) {
    source = '<?xml version="1.0" encoding="UTF-8"?>\n' + source;
  }
  downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), 'drawing.svg');
});

document.getElementById('btnExportPng').addEventListener('click', () => {
  const svg = buildExportSvg();
  const source = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
    ctx.drawImage(img, 0, 0, EXPORT_SIZE, EXPORT_SIZE);

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'drawing.png');
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.src = url;
});

/* Инициализация */
function init() {
  bgLayer.style.backgroundColor = bgColorInput.value;
  updateBackImage();
  drawGuides();
  applyTransform();
}

init();
