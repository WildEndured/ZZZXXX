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

  const skullW = document.getElementById('skullW');
  const skullH = document.getElementById('skullH');
  const chinW = document.getElementById('chinW');
  const chinH = document.getElementById('chinH');
  const jawAttach = document.getElementById('jawAttach');
  const jawW = document.getElementById('jawW');
  const jawRound = document.getElementById('jawRound');

  const skullWVal = document.getElementById('skullWVal');
  const skullHVal = document.getElementById('skullHVal');
  const chinWVal = document.getElementById('chinWVal');
  const chinHVal = document.getElementById('chinHVal');
  const jawAttachVal = document.getElementById('jawAttachVal');
  const jawWVal = document.getElementById('jawWVal');
  const jawRoundVal = document.getElementById('jawRoundVal');

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
    imageNaturalRatio: 1,
    paths: [],
  };

  // ========== Геометрия холста ==========
  function resizeViewport() {
    const rect = workspace.getBoundingClientRect();
    const size = Math.max(50, Math.min(rect.width, rect.height) - 2);
    viewport.style.width = size + 'px';
    viewport.style.height = size + 'px';
    viewport.style.position = 'relative';
    clampPan();
    applyTransform();
    redrawGrid();
    applyOverlayStyles();
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
    const minTx = w - scaledW;
    const minTy = h - scaledH;
    state.tx = Math.min(0, Math.max(minTx, state.tx));
    state.ty = Math.min(0, Math.max(minTy, state.ty));
  }

  function setScale(newScale, cx, cy) {
    newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    const k = newScale / state.scale;
    state.tx = cx - k * (cx - state.tx);
    state.ty = cy - k * (cy - state.ty);
    state.scale = newScale;
    clampPan();
    applyTransform();
  }

  // ========== Указатели ==========
  const pointers = new Map();
  let gestureState = null;

  function localPoint(clientX, clientY) {
    const r = viewport.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function toSvgCoords(clientX, clientY) {
    const r = viewport.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
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
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
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
      if (e.pointerType !== 'touch' || pointers.size === 1) {
        gestureState = { mode: 'draw' };
        startDrawing(e.clientX, e.clientY);
      }
    } else if (pointers.size === 2) {
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

      const k = dist / gestureState.startDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, gestureState.startScale * k));
      const realK = newScale / gestureState.startScale;

      const ox = gestureState.startMidX;
      const oy = gestureState.startMidY;

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
        if (pointers.size === 1) {
          const [pt] = pointers.values();
          gestureState = {
            mode: 'pan',
            startX: pt.x,
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

  // ========== Колесо мыши ==========
  function onWheel(e) {
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const factor = e.deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP;
    setScale(state.scale * factor, cx, cy);
  }

  // ========== Сетка + голова ==========
  function ellipseXAtY(cx, cy, rx, ry, y) {
    const t = (y - cy) / ry;
    const inside = 1 - t * t;
    if (inside <= 0) return 0;
    return rx * Math.sqrt(inside);
  }

  function redrawGrid() {
    while (gridGroup.firstChild) gridGroup.removeChild(gridGroup.firstChild);
    if (!viewport.clientWidth) return;

    const margin = parseFloat(marginRange.value) / 100;
    const heads = parseInt(headsRange.value, 10);
    const usable = 1 - margin * 2;

    // --- Красная рамка зоны ---
    if (margin > 0) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', 0);
      rect.setAttribute('y', margin);
      rect.setAttribute('width', 1);
      rect.setAttribute('height', usable);
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', 'red');
      rect.setAttribute('stroke-width', 2);
      rect.setAttribute('vector-effect', 'non-scaling-stroke');
      rect.setAttribute('pointer-events', 'none');
      gridGroup.appendChild(rect);
    }

    // --- Горизонтальные пунктирные линии ---
    for (let i = 1; i < heads; i++) {
      const y = margin + (usable * i) / heads;
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', 1);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'red');
      line.setAttribute('stroke-width', 1.5);
      line.setAttribute('stroke-dasharray', '6 4');
      line.setAttribute('fill', 'none');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      line.setAttribute('pointer-events', 'none');
      gridGroup.appendChild(line);
    }

    // --- ГОЛОВА (верхняя секция) ---
    drawHead(margin, usable / heads);
  }

  function drawHead(top, sectionH) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('pointer-events', 'none');
    g.setAttribute('stroke', '#00c0ff');
    g.setAttribute('fill', 'none');
    g.setAttribute('stroke-width', 2);
    g.setAttribute('vector-effect', 'non-scaling-stroke');
    g.setAttribute('stroke-linecap', 'round');
    g.setAttribute('stroke-linejoin', 'round');

    const H = sectionH;
    const cx = 0.5;

    const yTop5  = top + (1 / 5) * H;
    const yBot5  = top + (3 / 5) * H;

    // Череп
    const cy = (yTop5 + yBot5) / 2;
    const ryBase = (yBot5 - yTop5) / 2;
    const ry = ryBase * (parseFloat(skullH.value) / 100);
    const rx = ryBase * (parseFloat(skullW.value) / 100);

    const skull = document.createElementNS(SVG_NS, 'ellipse');
    skull.setAttribute('cx', cx);
    skull.setAttribute('cy', cy);
    skull.setAttribute('rx', rx);
    skull.setAttribute('ry', ry);
    skull.setAttribute('fill', 'none');
    g.appendChild(skull);

    // Крепление челюсти
    const attachPct = parseFloat(jawAttach.value) / 100;
    const yAttach = top + attachPct * H;
    const dxAttach = ellipseXAtY(cx, cy, rx, ry, yAttach);
    const leftAttach  = { x: cx - dxAttach, y: yAttach };
    const rightAttach = { x: cx + dxAttach, y: yAttach };

    // Подбородок
    const chinPct = parseFloat(chinH.value) / 100;
    const yChin = top + chinPct * H;
    const chinHalfW = rx * (parseFloat(chinW.value) / 100);
    const chinL = { x: cx - chinHalfW, y: yChin };
    const chinR = { x: cx + chinHalfW, y: yChin };

    const chin = document.createElementNS(SVG_NS, 'line');
    chin.setAttribute('x1', chinL.x);
    chin.setAttribute('y1', chinL.y);
    chin.setAttribute('x2', chinR.x);
    chin.setAttribute('y2', chinR.y);
    chin.setAttribute('stroke', '#00ff88');
    chin.setAttribute('stroke-width', 2);
    chin.setAttribute('fill', 'none');
    g.appendChild(chin);

    // Челюсть
    const round = parseFloat(jawRound.value) / 100;
    const jawHalfW = rx * (parseFloat(jawW.value) / 100);
    const jawL = { x: cx - jawHalfW, y: yChin };
    const jawR = { x: cx + jawHalfW, y: yChin };

    function jawPath(start, end) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const ctrlX = midX + (cx - midX) * round * 0.8;
      const ctrlY = midY;
      return `M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`;
    }

    const jawPathL = document.createElementNS(SVG_NS, 'path');
    jawPathL.setAttribute('d', jawPath(leftAttach, jawL));
    jawPathL.setAttribute('fill', 'none');
    g.appendChild(jawPathL);

    const jawPathR = document.createElementNS(SVG_NS, 'path');
    jawPathR.setAttribute('d', jawPath(rightAttach, jawR));
    jawPathR.setAttribute('fill', 'none');
    g.appendChild(jawPathR);

    // Вспомогательные метки уровней
    [1/5, 3/5, 3.5/5, 4/5].forEach((frac) => {
      const y = top + frac * H;
      const mk = document.createElementNS(SVG_NS, 'line');
      mk.setAttribute('x1', 0);
      mk.setAttribute('y1', y);
      mk.setAttribute('x2', 1);
      mk.setAttribute('y2', y);
      mk.setAttribute('stroke', 'rgba(0,192,255,0.25)');
      mk.setAttribute('stroke-width', 1);
      mk.setAttribute('stroke-dasharray', '2 4');
      mk.setAttribute('fill', 'none');
      mk.setAttribute('vector-effect', 'non-scaling-stroke');
      g.appendChild(mk);
    });

    gridGroup.appendChild(g);
  }

  // ========== Подложка ==========
  function applyOverlayStyles() {
    const s = parseInt(imgScale.value, 10) / 100;
    const o = parseInt(imgOpacity.value, 10) / 100;
    overlayLayer.style.opacity = o;
    if (!state.imageDataUrl) {
      overlayLayer.style.transform = '';
      return;
    }
    const vh = viewport.clientHeight;
    const r = state.imageNaturalRatio;
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

  const headControls = [
    [skullW, skullWVal], [skullH, skullHVal],
    [chinW, chinWVal], [chinH, chinHVal],
    [jawAttach, jawAttachVal], [jawW, jawWVal], [jawRound, jawRoundVal],
  ];
  headControls.forEach(([input, out]) => {
    input.addEventListener('input', () => {
      out.textContent = input.value;
      redrawGrid();
    });
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
    svg.setAttribute('fill', 'none');

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

    // Слой рисунка
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('fill', 'none');
    const paths = drawGroup.querySelectorAll('path');
    paths.forEach((p) => {
      const clone = p.cloneNode(true);
      clone.setAttribute('transform', `scale(${w})`);
      const sw = parseFloat(p.getAttribute('stroke-width') || '0.001');
      const realPx = sw * w;
      clone.removeAttribute('vector-effect');
      clone.setAttribute('stroke-width', realPx);
      g.appendChild(clone);
    });
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

  document.addEventListener('touchmove', (e) => {
    if (e.target.closest('#viewport') || e.target.closest('#drawLayer')) {
      e.preventDefault();
    }
  }, { passive: false });

  bgLayer.style.background = bgColor.value;
  window.addEventListener('resize', resizeViewport);
  window.addEventListener('orientationchange', () => setTimeout(resizeViewport, 100));

  resizeViewport();
  applyOverlayStyles();
  redrawGrid();
  applyTransform();
})();
