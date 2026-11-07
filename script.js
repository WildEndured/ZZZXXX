(function () {
  'use strict';

  // ===== DOM =====
  const viewport = document.getElementById('viewport');
  const zoomContainer = document.getElementById('zoomContainer');
  const bgLayer = document.getElementById('bgLayer');
  const underlayLayer = document.getElementById('underlayLayer');
  const drawLayer = document.getElementById('drawLayer');
  const gridGroup = document.getElementById('gridGroup');
  const drawGroup = document.getElementById('drawGroup');

  const fileInput = document.getElementById('fileInput');
  const underlayScale = document.getElementById('underlayScale');
  const underlayScaleVal = document.getElementById('underlayScaleVal');
  const underlayOpacity = document.getElementById('underlayOpacity');
  const underlayOpacityVal = document.getElementById('underlayOpacityVal');
  const bgColorInput = document.getElementById('bgColor');
  const gridPad = document.getElementById('gridPad');
  const gridPadVal = document.getElementById('gridPadVal');
  const heads = document.getElementById('heads');
  const headsVal = document.getElementById('headsVal');
  const brushColor = document.getElementById('brushColor');
  const brushWidth = document.getElementById('brushWidth');
  const brushWidthVal = document.getElementById('brushWidthVal');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exportSvgBtn = document.getElementById('exportSvgBtn');
  const exportPngBtn = document.getElementById('exportPngBtn');

  // ===== Состояние =====
  const state = {
    canvasSize: 800,
    scale: 1,
    tx: 0,
    ty: 0,
    minScale: 1,
    maxScale: 20,
    bgColor: '#ffffff',
    underlay: { src: null, imgW: 0, imgH: 0, scale: 1.0, opacity: 1.0 },
    gridPad: 0.05,
    heads: 4,
    brush: { color: '#000000', width: 3 },
    paths: []
  };

  // ===== Вспомогательные =====
  function getBaseOffset() {
    const vp = viewport.getBoundingClientRect();
    const size = state.canvasSize;
    return {
      x: (vp.width - size) / 2,
      y: (vp.height - size) / 2
    };
  }

  // ===== Размер холста =====
  function updateCanvasSize() {
    const vp = viewport.getBoundingClientRect();
    const size = Math.max(1, Math.min(vp.width, vp.height));
    state.canvasSize = size;
    zoomContainer.style.width = size + 'px';
    zoomContainer.style.height = size + 'px';
    state.scale = 1;
    state.tx = 0;
    state.ty = 0;
    applyTransform();
  }

  // ===== Применение трансформа =====
  function applyTransform() {
    const size = state.canvasSize;
    const s = state.scale;
    const base = getBaseOffset();
    const vp = viewport.getBoundingClientRect();
    const scaled = size * s;

    let minTx, maxTx, minTy, maxTy;

    if (scaled >= vp.width) {
      minTx = 0 - base.x;
      maxTx = vp.width - scaled - base.x;
    } else {
      minTx = (vp.width - scaled) / 2 - base.x;
      maxTx = minTx;
    }
    if (scaled >= vp.height) {
      minTy = 0 - base.y;
      maxTy = vp.height - scaled - base.y;
    } else {
      minTy = (vp.height - scaled) / 2 - base.y;
      maxTy = minTy;
    }

    state.tx = Math.min(maxTx, Math.max(minTx, state.tx));
    state.ty = Math.min(maxTy, Math.max(minTy, state.ty));

    const left = base.x + state.tx;
    const top = base.y + state.ty;
    zoomContainer.style.transform =
      `translate(${left}px, ${top}px) scale(${s})`;
  }

  // ===== Сетка =====
  function renderGrid() {
    while (gridGroup.firstChild) gridGroup.removeChild(gridGroup.firstChild);
    const pad = state.gridPad;

    // Красная рамка зоны
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', String(pad));
    rect.setAttribute('width', '1');
    rect.setAttribute('height', String(1 - 2 * pad));
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', '#ff0000');
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(rect);

    // Горизонтальные пунктирные линии
    const n = state.heads;
    const y0 = pad;
    const y1 = 1 - pad;
    const span = y1 - y0;
    for (let i = 1; i < n; i++) {
      const y = y0 + span * (i / n);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('x2', '1');
      line.setAttribute('y1', String(y));
      line.setAttribute('y2', String(y));
      line.setAttribute('stroke', '#ff0000');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '4 4');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      gridGroup.appendChild(line);
    }

    // Круг: диаметр = 3/5 высоты секции, касается верхней линии секции
    const sectionH = span / n;
    const r = (3 / 10) * sectionH;      // половина от 3/5
    const cx = 0.5;
    const cy = y0 + r;                  // верхняя точка круга = y0

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#ff0000');
    circle.setAttribute('stroke-width', '1');
    circle.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(circle);
  }

  // ===== Подложка =====
  function applyUnderlay() {
    if (!state.underlay.src) {
      underlayLayer.style.display = 'none';
      return;
    }
    underlayLayer.style.display = 'block';
    underlayLayer.src = state.underlay.src;
    underlayLayer.style.opacity = String(state.underlay.opacity);

    const mul = state.underlay.scale;
    const ratio = state.underlay.imgW / state.underlay.imgH;
    const dispH = mul * 100;
    const dispW = ratio * dispH;
    underlayLayer.style.width = dispW + '%';
    underlayLayer.style.height = dispH + '%';
    underlayLayer.style.left = ((100 - dispW) / 2) + '%';
    underlayLayer.style.top = ((100 - dispH) / 2) + '%';
    underlayLayer.style.right = 'auto';
    underlayLayer.style.bottom = 'auto';
    underlayLayer.style.objectFit = 'fill';
    underlayLayer.style.transform = 'none';
  }

  // ===== Координаты =====
  function clientToLocal(clientX, clientY) {
    const rect = zoomContainer.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function clientToCanvas(clientX, clientY) {
    const p = clientToLocal(clientX, clientY);
    return {
      x: p.x / state.canvasSize,
      y: p.y / state.canvasSize
    };
  }

  // ===== Рисование =====
  const pointers = new Map();
  let drawing = false;
  let currentPath = null;
  let currentPathEl = null;
  let activePointerId = null;
  let gestureActive = false;
  let gestureStart = null;
  let panning = false;
  let panStart = null;

  function beginPath(clientX, clientY) {
    const c = clientToCanvas(clientX, clientY);
    currentPath = {
      d: `M ${c.x} ${c.y}`,
      color: state.brush.color,
      width: state.brush.width
    };
    currentPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    currentPathEl.setAttribute('fill', 'none');
    currentPathEl.setAttribute('stroke', currentPath.color);
    currentPathEl.setAttribute('stroke-width', String(currentPath.width));
    currentPathEl.setAttribute('stroke-linecap', 'round');
    currentPathEl.setAttribute('stroke-linejoin', 'round');
    currentPathEl.setAttribute('vector-effect', 'non-scaling-stroke');
    currentPathEl.setAttribute('d', currentPath.d);
    drawGroup.appendChild(currentPathEl);
  }

  function extendPath(clientX, clientY) {
    if (!currentPath) return;
    const c = clientToCanvas(clientX, clientY);
    currentPath.d += ` L ${c.x} ${c.y}`;
    currentPathEl.setAttribute('d', currentPath.d);
  }

  function commitPath() {
    if (currentPath && currentPathEl) state.paths.push(currentPath);
    currentPath = null;
    currentPathEl = null;
    drawing = false;
    activePointerId = null;
  }

  function cancelPath() {
    if (currentPathEl && currentPathEl.parentNode) {
      currentPathEl.parentNode.removeChild(currentPathEl);
    }
    currentPath = null;
    currentPathEl = null;
    drawing = false;
    activePointerId = null;
  }

  // ===== Жесты =====
  function startGesture() {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return;
    gestureActive = true;
    const [a, b] = pts;
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;

    const local = clientToLocal(midX, midY);
    const worldX = local.x / state.scale;
    const worldY = local.y / state.scale;

    gestureStart = {
      dist,
      scale: state.scale,
      worldX,
      worldY
    };
  }

  function updateGesture() {
    const pts = Array.from(pointers.values());
    if (pts.length < 2 || !gestureStart) return;
    const [a, b] = pts;
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;

    let newScale = gestureStart.scale * (dist / gestureStart.dist);
    newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));

    const base = getBaseOffset();
    const newLeft = midX - gestureStart.worldX * newScale;
    const newTop = midY - gestureStart.worldY * newScale;

    state.scale = newScale;
    state.tx = newLeft - base.x;
    state.ty = newTop - base.y;
    applyTransform();
  }

  // ===== Pointer events =====
  function onPointerDown(e) {
    const isMiddle = e.button === 1;
    const isShiftLeft = e.button === 0 && e.shiftKey;
    const isTouch = e.pointerType === 'touch';
    const isLeft = e.button === 0;

    if (isMiddle || isShiftLeft) {
      e.preventDefault();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      zoomContainer.setPointerCapture(e.pointerId);
      if (pointers.size === 1) {
        panning = true;
        panStart = { x: e.clientX, y: e.clientY, tx: state.tx, ty: state.ty };
      } else if (pointers.size >= 2) {
        if (drawing) cancelPath();
        panning = false;
        startGesture();
      }
      return;
    }

    if (!isTouch && !isLeft) return;
    e.preventDefault();

    if (drawing && activePointerId !== null && e.pointerId !== activePointerId) {
      cancelPath();
    }

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    zoomContainer.setPointerCapture(e.pointerId);

    if (pointers.size >= 2) {
      if (drawing) cancelPath();
      panning = false;
      startGesture();
      return;
    }

    drawing = true;
    activePointerId = e.pointerId;
    beginPath(e.clientX, e.clientY);
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size >= 2) {
      if (gestureActive) {
        e.preventDefault();
        updateGesture();
      }
      return;
    }

    if (panning && panStart) {
      e.preventDefault();
      state.tx = panStart.tx + (e.clientX - panStart.x);
      state.ty = panStart.ty + (e.clientY - panStart.y);
      applyTransform();
      return;
    }

    if (drawing && e.pointerId === activePointerId) {
      e.preventDefault();
      extendPath(e.clientX, e.clientY);
    }
  }

  function onPointerUp(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);

    if (drawing && e.pointerId === activePointerId) commitPath();

    if (pointers.size < 2) {
      gestureActive = false;
      gestureStart = null;
    }
    if (pointers.size === 0) {
      panning = false;
      panStart = null;
    }

    try { zoomContainer.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  zoomContainer.addEventListener('pointerdown', onPointerDown);
  zoomContainer.addEventListener('pointermove', onPointerMove);
  zoomContainer.addEventListener('pointerup', onPointerUp);
  zoomContainer.addEventListener('pointercancel', onPointerUp);
  zoomContainer.addEventListener('mousedown', (e) => {
    if (e.button === 1) e.preventDefault();
  });

  // ===== Колесо =====
  zoomContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const local = clientToLocal(e.clientX, e.clientY);
    const worldX = local.x / state.scale;
    const worldY = local.y / state.scale;

    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    let newScale = state.scale * factor;
    newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));

    const base = getBaseOffset();
    const newLeft = e.clientX - worldX * newScale;
    const newTop = e.clientY - worldY * newScale;

    state.scale = newScale;
    state.tx = newLeft - base.x;
    state.ty = newTop - base.y;
    applyTransform();
  }, { passive: false });

  // ===== UI =====
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        state.underlay.src = ev.target.result;
        state.underlay.imgW = img.naturalWidth;
        state.underlay.imgH = img.naturalHeight;
        applyUnderlay();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  underlayScale.addEventListener('input', () => {
    state.underlay.scale = parseInt(underlayScale.value, 10) / 100;
    underlayScaleVal.textContent = underlayScale.value + '%';
    applyUnderlay();
  });

  underlayOpacity.addEventListener('input', () => {
    state.underlay.opacity = parseInt(underlayOpacity.value, 10) / 100;
    underlayOpacityVal.textContent = underlayOpacity.value + '%';
    applyUnderlay();
  });

  bgColorInput.addEventListener('input', () => {
    state.bgColor = bgColorInput.value;
    bgLayer.style.background = state.bgColor;
  });

  gridPad.addEventListener('input', () => {
    state.gridPad = parseInt(gridPad.value, 10) / 100;
    gridPadVal.textContent = gridPad.value + '%';
    renderGrid();
  });

  heads.addEventListener('input', () => {
    state.heads = parseInt(heads.value, 10);
    headsVal.textContent = String(state.heads);
    renderGrid();
  });

  brushColor.addEventListener('input', () => {
    state.brush.color = brushColor.value;
  });

  brushWidth.addEventListener('input', () => {
    state.brush.width = parseInt(brushWidth.value, 10);
    brushWidthVal.textContent = String(state.brush.width);
  });

  undoBtn.addEventListener('click', () => {
    if (state.paths.length === 0) return;
    state.paths.pop();
    redrawAllPaths();
  });

  clearBtn.addEventListener('click', () => {
    state.paths = [];
    redrawAllPaths();
  });

  function redrawAllPaths() {
    while (drawGroup.firstChild) drawGroup.removeChild(drawGroup.firstChild);
    state.paths.forEach((p) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', p.color);
      el.setAttribute('stroke-width', String(p.width));
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
      el.setAttribute('vector-effect', 'non-scaling-stroke');
      el.setAttribute('d', p.d);
      drawGroup.appendChild(el);
    });
  }

  // ===== Экспорт =====
  function buildExportSVG() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('viewBox', '0 0 1 1');
    svg.setAttribute('width', '1024');
    svg.setAttribute('height', '1024');

    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', '1');
    bg.setAttribute('height', '1');
    bg.setAttribute('fill', state.bgColor);
    svg.appendChild(bg);

    if (state.underlay.src) {
      const mul = state.underlay.scale;
      const ratio = state.underlay.imgW / state.underlay.imgH;
      const h = mul;
      const w = ratio * h;
      const x = (1 - w) / 2;
      const y = (1 - h) / 2;
      const img = document.createElementNS(NS, 'image');
      img.setAttribute('href', state.underlay.src);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', state.underlay.src);
      img.setAttribute('x', String(x));
      img.setAttribute('y', String(y));
      img.setAttribute('width', String(w));
      img.setAttribute('height', String(h));
      img.setAttribute('preserveAspectRatio', 'none');
      img.setAttribute('opacity', String(state.underlay.opacity));
      svg.appendChild(img);
    }

    state.paths.forEach((p) => {
      const el = document.createElementNS(NS, 'path');
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', p.color);
      el.setAttribute('stroke-width', String(p.width));
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
      el.setAttribute('vector-effect', 'non-scaling-stroke');
      el.setAttribute('d', p.d);
      svg.appendChild(el);
    });

    return new XMLSerializer().serializeToString(svg);
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
    const svgString = buildExportSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'drawing.svg');
  });

  exportPngBtn.addEventListener('click', () => {
    const SIZE = 4096;
    const svgString = buildExportSVG();

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.documentElement;
    svgEl.setAttribute('width', String(SIZE));
    svgEl.setAttribute('height', String(SIZE));
    const finalSvg = new XMLSerializer().serializeToString(svgEl);

    const svgBlob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, 'drawing.png');
      }, 'image/png');
    };
    img.onerror = (err) => {
      console.error('PNG export error', err);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

  // ===== Инициализация =====
  function init() {
    bgLayer.style.background = state.bgColor;
    underlayLayer.style.display = 'none';
    renderGrid();
    requestAnimationFrame(() => {
      updateCanvasSize();
    });
  }

  let resizeRAF = null;
  window.addEventListener('resize', () => {
    if (resizeRAF) cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(updateCanvasSize);
  });

  document.addEventListener('touchmove', (e) => {
    if (e.target.closest('#panel')) return;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());

  init();
})();
