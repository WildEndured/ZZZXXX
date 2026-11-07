(() => {
  'use strict';

  // ========== DOM ==========
  const workspace = document.getElementById('workspace');
  const viewport = document.getElementById('viewport');
  const zoomContainer = document.getElementById('zoomContainer');
  const bgLayer = document.getElementById('bgLayer');
  const overlayLayer = document.getElementById('overlayLayer');
  const drawLayer = document.getElementById('drawLayer');
  const drawGroup = document.getElementById('drawGroup');
  const gridGroup = document.getElementById('gridGroup');

  const fileInput = document.getElementById('fileInput');
  const imgScale = document.getElementById('imgScale');
  const imgOpacity = document.getElementById('imgOpacity');
  const bgColor = document.getElementById('bgColor');
  const marginRange = document.getElementById('marginRange');
  const headsRange = document.getElementById('headsRange');
  const brushSize = document.getElementById('brushSize');
  const brushColor = document.getElementById('brushColor');
  const undoBtn = document.getElementById('undoBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exportSvg = document.getElementById('exportSvg');
  const exportPng = document.getElementById('exportPng');

  const scaleVal = document.getElementById('scaleVal');
  const opacityVal = document.getElementById('opacityVal');
  const marginVal = document.getElementById('marginVal');
  const headsVal = document.getElementById('headsVal');
  const brushVal = document.getElementById('brushVal');

  // ========== Константы ==========
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MIN_SCALE = 1;
  const MAX_SCALE = 20;
  const WHEEL_ZOOM_STEP = 1.15;

  // ========== Состояние ==========
  const state = {
    scale: 1,
    tx: 0,
    ty: 0,
    imageDataUrl: null,
    imageNaturalRatio: 1, // w/h
    paths: [], // стек путей для undo
  };

  // ========== Геометрия холста ==========
  function resizeViewport() {
    const rect = workspace.getBoundingClientRect();
    const size = Math.max(50, Math.min(rect.width, rect.height) - 2);
    viewport.style.width = size + 'px';
    viewport.style.height = size + 'px';
    viewport.style.left = '';
    viewport.style.top = '';
    // Центрируем абсолютно
    viewport.style.position = 'relative';
    clampPan();
    applyTransform();
    redrawGrid();
  }

  // ========== Трансформация ==========
  function applyTransform() {
    zoomContainer.style.transform =
      `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
  }

  function clampPan() {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    const scaledW = w * state.scale;
    const scaledH = h * state.scale;
    const minTx = w - scaledW; // <= 0
    const minTy = h - scaledH;
    state.tx = Math.min(0, Math.max(minTx, state.tx));
    state.ty = Math.min(0, Math.max(minTy, state.ty));
  }

  function setScale(newScale, cx, cy) {
    // cx, cy - точка в координатах viewport, относительно которой масштабируем
    newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    const k = newScale / state.scale;
    state.tx = cx - k * (cx - state.tx);
    state.ty = cy - k * (cy - state.ty);
    state.scale = newScale;
    clampPan();
    applyTransform();
  }

  // ========== Указатели ==========
  const pointers = new Map(); // id -> {x, y}
  let gestureState = null; // {mode: 'pan'|'zoom'|'draw'|null, ...}

  function localPoint(clientX, clientY) {
    const r = viewport.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  // Экранные координаты -> координаты SVG (0..1)
  function toSvgCoords(clientX, clientY) {
    const r = viewport.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    // обратное преобразование: (px - tx) / scale
    const cx = (px - state.tx) / state.scale;
    const cy = (py - state.ty) / state.scale;
    return {
      x: cx / r.width,
      y: cy / r.height,
    };
  }

  // ========== Рисование ==========
  let currentPath = null;
  let currentPoints = null;

  function startDrawing(clientX, clientY) {
    const p = toSvgCoords(clientX, clientY);
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', brushColor.value);
    path.setAttribute('stroke-width', brushSize.value / 1000); // ~ визуально
    // Используем фиксированную толщину в единицах viewBox с vector-effect
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    // Реальная толщина через stroke-width на 1x1 viewBox: 
    // vector-effect: non-scaling-stroke => ширина в экранных пикселях, но 
    // чтобы она масштабировалась вместе с зумом правильно, зададим в масштабе viewBox.
    // Установим на основе размеров viewport (как пиксели на экране при scale=1).
    const w = viewport.clientWidth || 1;
    const sw = brushSize.value / w;
    path.setAttribute('stroke-width', sw);
    currentPoints = [p];
    path.setAttribute('d', `M ${p.x} ${p.y} L ${p.x} ${p.y}`);
    drawGroup.appendChild(path);
    currentPath = path;
  }

  function continueDrawing(clientX, clientY) {
    if (!currentPath) return;
    const p = toSvgCoords(clientX, clientY);
    currentPoints.push(p);
    const d = currentPoints
      .map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`))
      .join(' ');
    currentPath.setAttribute('d', d);
  }

  function endDrawing(keep = true) {
    if (!currentPath) return;
    if (keep && currentPoints && currentPoints.length > 1) {
      state.paths.push(currentPath);
    } else {
      currentPath.remove();
    }
    currentPath = null;
    currentPoints = null;
  }

  function cancelDrawing() {
    endDrawing(false);
  }

  // ========== Жесты ==========
  function onPointerDown(e) {
    viewport.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, localPoint(e.clientX, e.clientY));

    // Средняя кнопка или Shift+ЛКМ => панорамирование
    const isPanMouse = e.pointerType === 'mouse' && (e.button === 1 || (e.button === 0 && e.shiftKey));

    if (pointers.size === 1) {
      if (isPanMouse) {
        gestureState = {
          mode: 'pan',
          startX: e.clientX,
          startY: e.clientY,
          startTx: state.tx,
          startTy: state.ty,
        };
        e.preventDefault();
        return;
      }
      // Перо / мышь / палец => рисование
      if (e.pointerType !== 'touch' || pointers.size === 1) {
        gestureState = { mode: 'draw' };
        startDrawing(e.clientX, e.clientY);
      }
    } else if (pointers.size === 2) {
      // Второй палец — отменяем рисование, начинаем зум/панораму
      if (gestureState && gestureState.mode === 'draw') {
        cancelDrawing();
      }
      const pts = [...pointers.values()];
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      gestureState = {
        mode: 'zoom',
        startDist: Math.hypot(dx, dy),
        startScale: state.scale,
        startTx: state.tx,
        startTy: state.ty,
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
        startMidX: (pts[0].x + pts[1].x) / 2,
        startMidY: (pts[0].y + pts[1].y) / 2,
      };
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, localPoint(e.clientX, e.clientY));

    if (!gestureState) return;

    if (gestureState.mode === 'draw') {
      if (pointers.size > 1) {
        // появление второго пальца — отменяем рисование
        cancelDrawing();
        return;
      }
      continueDrawing(e.clientX, e.clientY);
      e.preventDefault();
    } else if (gestureState.mode === 'pan') {
      const dx = e.clientX - gestureState.startX;
      const dy = e.clientY - gestureState.startY;
      state.tx = gestureState.startTx + dx;
      state.ty = gestureState.startTy + dy;
      clampPan();
      applyTransform();
      e.preventDefault();
    } else if (gestureState.mode === 'zoom' && pointers.size === 2) {
      const pts = [...pointers.values()];
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const dist = Math.hypot(dx, dy);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;

      // Масштаб относительно стартовой точки
      const k = dist / gestureState.startDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, gestureState.startScale * k));
      const realK = newScale / gestureState.startScale;

      // Точка, относительно которой масштабируем: стартовая середина
      const ox = gestureState.startMidX;
      const oy = gestureState.startMidY;

      // Смещение середины пальцев
      const panDx = midX - gestureState.startMidX;
      const panDy = midY - gestureState.startMidY;

      state.scale = newScale;
      state.tx = ox - realK * (ox - gestureState.startTx) + panDx;
      state.ty = oy - realK * (oy - gestureState.startTy) + panDy;

      clampPan();
      applyTransform();
      e.preventDefault();
    }
  }

  function onPointerUp(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);

    if (!gestureState) return;

    if (gestureState.mode === 'draw') {
      endDrawing(true);
      gestureState = null;
    } else if (gestureState.mode === 'pan') {
      if (pointers.size === 0) gestureState = null;
    } else if (gestureState.mode === 'zoom') {
      if (pointers.size < 2) {
        // остался один палец => переходим в режим панорамы этим пальцем
        if (pointers.size === 1) {
          const [pt] = pointers.values();
          gestureState = {
            mode: 'pan',
            startX: pt.x, // это локальные координаты, но pan работает в client. Исправим ниже.
            startY: pt.y,
            startTx: state.tx,
            startTy: state.ty,
            localMode: true,
          };
        } else {
          gestureState = null;
        }
      }
    }
  }

  function onPointerCancel(e) {
    pointers.delete(e.pointerId);
    if (gestureState && gestureState.mode === 'draw') {
      cancelDrawing();
    }
    if (pointers.size === 0) gestureState = null;
  }

  // Для pan из локальных координат после зума — пересчитываем в client
  // Проще: обрабатывать pan всегда через client. Заменим логику ниже.

  // ========== Колесо мыши (зум) ==========
  function onWheel(e) {
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const factor = e.deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP;
    setScale(state.scale * factor, cx, cy);
  }

  // ========== Сетка ==========
  function redrawGrid() {
    while (gridGroup.firstChild) gridGroup.removeChild(gridGroup.firstChild);
    if (!viewport.clientWidth) return;

    const margin = parseFloat(marginRange.value) / 100;
    const heads = parseInt(headsRange.value, 10);

    const pxSize = viewport.clientWidth; // при scale=1
    const strokeW = 2 / (pxSize * state.scale); // для non-scaling — но у нас non-scaling, значит просто пиксели

    // Красная рамка зоны
    if (margin > 0) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', 0);
      rect.setAttribute('y', margin);
      rect.setAttribute('width', 1);
      rect.setAttribute('height', 1 - margin * 2);
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', 'red');
      rect.setAttribute('stroke-width', 2);
      rect.setAttribute('vector-effect', 'non-scaling-stroke');
      rect.setAttribute('pointer-events', 'none');
      gridGroup.appendChild(rect);
    }

    // Горизонтальные пунктирные линии
    const top = margin;
    const bottom = 1 - margin;
    const usable = bottom - top;
    for (let i = 1; i < heads; i++) {
      const y = top + (usable * i) / heads;
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', 1);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'red');
      line.setAttribute('stroke-width', 1.5);
      line.setAttribute('stroke-dasharray', '6 4');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      line.setAttribute('pointer-events', 'none');
      gridGroup.appendChild(line);
    }
  }

  // ========== Подложка ==========
  function applyOverlayStyles() {
    const s = parseInt(imgScale.value, 10) / 100;
    const o = parseInt(imgOpacity.value, 10) / 100;
    overlayLayer.style.opacity = o;
    // object-fit: contain при 100% = вписано по высоте? 
    // Требование: 100% = вписано ровно по высоте, пропорции сохранены.
    // Сделаем вручную через позиционирование.
    if (!state.imageDataUrl) {
      overlayLayer.style.transform = '';
      return;
    }
    // Контейнер квадратный, подложка должна быть вписана по высоте
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    // натуральные пропорции
    const r = state.imageNaturalRatio; // w/h
    // Высота = vh * s, ширина = vh * s * r
    const h = vh * s;
    const w = h * r;
    overlayLayer.style.position = 'absolute';
    overlayLayer.style.left = '50%';
    overlayLayer.style.top = '50%';
    overlayLayer.style.width = w + 'px';
    overlayLayer.style.height = h + 'px';
    overlayLayer.style.transform = 'translate(-50%, -50%)';
    overlayLayer.style.objectFit = 'contain';
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      state.imageDataUrl = ev.target.result;
      const img = new Image();
      img.onload = () => {
        state.imageNaturalRatio = img.naturalWidth / img.naturalHeight;
        overlayLayer.src = state.imageDataUrl;
        applyOverlayStyles();
      };
      img.src = state.imageDataUrl;
    };
    reader.readAsDataURL(file);
  });

  imgScale.addEventListener('input', () => {
    scaleVal.textContent = imgScale.value;
    applyOverlayStyles();
  });
  imgOpacity.addEventListener('input', () => {
    opacityVal.textContent = imgOpacity.value;
    applyOverlayStyles();
  });
  bgColor.addEventListener('input', () => {
    bgLayer.style.background = bgColor.value;
  });

  marginRange.addEventListener('input', () => {
    marginVal.textContent = marginRange.value;
    redrawGrid();
  });
  headsRange.addEventListener('input', () => {
    headsVal.textContent = headsRange.value;
    redrawGrid();
  });
  brushSize.addEventListener('input', () => {
    brushVal.textContent = brushSize.value;
  });

  // ========== Undo / Clear ==========
  undoBtn.addEventListener('click', () => {
    const last = state.paths.pop();
    if (last && last.parentNode) last.remove();
  });
  clearBtn.addEventListener('click', () => {
    while (drawGroup.firstChild) drawGroup.removeChild(drawGroup.firstChild);
    state.paths = [];
  });

  // ========== Экспорт ==========
  function buildExportSvg() {
    const w = 4096;
    const h = 4096;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);

    // Фон
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', 0);
    bg.setAttribute('y', 0);
    bg.setAttribute('width', w);
    bg.setAttribute('height', h);
    bg.setAttribute('fill', bgColor.value);
    svg.appendChild(bg);

    // Подложка
    if (state.imageDataUrl) {
      const s = parseInt(imgScale.value, 10) / 100;
      const o = parseInt(imgOpacity.value, 10) / 100;
      const r = state.imageNaturalRatio;
      const ih = h * s;
      const iw = ih * r;
      const ix = (w - iw) / 2;
      const iy = (h - ih) / 2;

      const img = document.createElementNS(SVG_NS, 'image');
      img.setAttribute('x', ix);
      img.setAttribute('y', iy);
      img.setAttribute('width', iw);
      img.setAttribute('height', ih);
      img.setAttribute('opacity', o);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', state.imageDataUrl);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', state.imageDataUrl);
      svg.appendChild(img);
    }

    // Слой рисования (пути масштабируем из viewBox 0..1 в 0..w)
    const g = document.createElementNS(SVG_NS, 'g');
    const paths = drawGroup.querySelectorAll('path');
    paths.forEach((p) => {
      const clone = p.cloneNode(true);
      // viewBox 0..1 -> 0..4096 => применение transform scale
      clone.setAttribute('transform', `scale(${w})`);
      // Для экспорта лучше перевести толщину в абсолютные единицы,
      // т.к. у нас vector-effect: non-scaling-stroke и в экспорте scale работает.
      // Заменим stroke-width на реальный.
      const sw = parseFloat(p.getAttribute('stroke-width') || '0.001');
      // Исходная толщина задавалась в долях viewBox (0..1)
      const realPx = sw * w;
      clone.removeAttribute('vector-effect');
      clone.setAttribute('stroke-width', realPx);
      g.appendChild(clone);
    });

    // Сетку тоже экспортируем? Обычно нет. Оставим только рисунок.
    // Но рамка/линии — часть разметки. Пользователь не просил экспортировать сетку.
    // Убираем.
    svg.appendChild(g);
    return { svg, w, h };
  }

  function serializeSvg(svg) {
    const xml = new XMLSerializer().serializeToString(svg);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  exportSvg.addEventListener('click', () => {
    const { svg } = buildExportSvg();
    const xml = serializeSvg(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'drawing.svg');
  });

  exportPng.addEventListener('click', () => {
    const { svg, w, h } = buildExportSvg();
    const xml = serializeSvg(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor.value;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (pngBlob) downloadBlob(pngBlob, 'drawing.png');
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert('Ошибка экспорта PNG');
    };
    img.src = url;
  });

  // ========== Инициализация ==========
  viewport.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
  viewport.addEventListener('wheel', onWheel, { passive: false });

  // Блокируем скролл страницы
  document.addEventListener('touchmove', (e) => {
    if (e.target.closest('#viewport') || e.target.closest('#drawLayer')) {
      e.preventDefault();
    }
  }, { passive: false });

  // Инициализация
  bgLayer.style.background = bgColor.value;
  window.addEventListener('resize', resizeViewport);
  window.addEventListener('orientationchange', () => setTimeout(resizeViewport, 100));

  // Стартовое состояние
  resizeViewport();
  applyOverlayStyles();
  redrawGrid();
  applyTransform();

  // Пересчёт при изменении масштаба — для толщины путей (если нужно)
  // Так как используется vector-effect: non-scaling-stroke, пересчёт не нужен.
})();
