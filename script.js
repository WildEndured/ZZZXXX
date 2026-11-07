(() => {
  'use strict';
  
  const viewportWrapper = document.getElementById('viewportWrapper');
  const viewport = document.getElementById('viewport');
  const stage = document.getElementById('stage');
  const layerBg = document.getElementById('layerBg');
  const underlayImg = document.getElementById('underlayImg');
  const drawSvg = document.getElementById('drawSvg');
  const drawGroup = document.getElementById('drawGroup');
  const guideGroup = document.getElementById('guideGroup');
  const zoomInfo = document.getElementById('zoomInfo');
  
  const fileInput = document.getElementById('fileInput');
  const btnLoadImage = document.getElementById('btnLoadImage');
  const underlayScale = document.getElementById('underlayScale');
  const underlayScaleVal = document.getElementById('underlayScaleVal');
  const underlayOpacity = document.getElementById('underlayOpacity');
  const underlayOpacityVal = document.getElementById('underlayOpacityVal');
  const bgColor = document.getElementById('bgColor');
  const padding = document.getElementById('padding');
  const paddingVal = document.getElementById('paddingVal');
  const heads = document.getElementById('heads');
  const headsVal = document.getElementById('headsVal');
  const brushSize = document.getElementById('brushSize');
  const brushSizeVal = document.getElementById('brushSizeVal');
  const brushColor = document.getElementById('brushColor');
  const btnUndo = document.getElementById('btnUndo');
  const btnClear = document.getElementById('btnClear');
  const btnExportSVG = document.getElementById('btnExportSVG');
  const btnExportPNG = document.getElementById('btnExportPNG');
  
  // Новый чекбокс
  const chkShowCircle = document.getElementById('chkShowCircle');
  
  // ==== Состояние ====
  const state = {
    scale: 1,
    tx: 0,
    ty: 0,
    minScale: 1,
    maxScale: 20,
    underlayBase64: null,
    underlayNaturalW: 0,
    underlayNaturalH: 0,
    drawPaths: []
  };

  // ==== Подгонка квадратного холста ====
  function resizeCanvas() {
    const rect = viewportWrapper.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) - (window.innerWidth <= 768 ? 10 : 20);
    viewport.style.width = size + 'px';
    viewport.style.height = size + 'px';
    
    applyTransform();
    updateUnderlay();
    renderGuides();
  }
  
  // ==== Клампинг зума/панорамирования ====
  function clamp() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = vw * state.scale;
    const sh = vh * state.scale;
    
    if (sw <= vw) {
      state.tx = (vw - sw) / 2;
    } else {
      state.tx = Math.min(0, Math.max(vw - sw, state.tx));
    }
    if (sh <= vh) {
      state.ty = (vh - sh) / 2;
    } else {
      state.ty = Math.min(0, Math.max(vh - sh, state.ty));
    }
  }
  
  function applyTransform() {
    clamp();
    stage.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
    zoomInfo.textContent = Math.round(state.scale * 100) + '%';
  }
  
  function zoomAt(clientX, clientY, newScale) {
    newScale = Math.min(state.maxScale, Math.max(state.minScale, newScale));
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const sx = (px - state.tx) / state.scale;
    const sy = (py - state.ty) / state.scale;
    state.scale = newScale;
    state.tx = px - sx * state.scale;
    state.ty = py - sy * state.scale;
    applyTransform();
  }
  
  // ==== Руководство ====
  function renderGuides() {
    guideGroup.innerHTML = '';
    const pad = parseFloat(padding.value) / 100;
    const n = parseInt(heads.value, 10);
    const topY = pad;
    const botY = 1 - pad;
    
    if (pad > 0) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', topY);
      rect.setAttribute('width', '1');
      rect.setAttribute('height', botY - topY);
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', 'red');
      rect.setAttribute('stroke-width', '1');
      rect.setAttribute('vector-effect', 'non-scaling-stroke');
      guideGroup.appendChild(rect);
    }
    
    const zoneH = botY - topY;
    for (let i = 1; i < n; i++) {
      const y = topY + zoneH * (i / n);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', y);
      line.setAttribute('x2', '1');
      line.setAttribute('y2', y);
      line.setAttribute('stroke', 'red');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '6 4');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      guideGroup.appendChild(line);
    }
    
    // ==== НОВАЯ ЛОГИКА: Круг головы в верхней секции ====
    if (chkShowCircle.checked) {
      // 1. Берем самую верхнюю секцию (ее высота = zoneH / n)
      const sectionH = zoneH / n;
      const sectionTop = topY;
      
      // 2. Делим эту секцию на 5 равных частей
      const partH = sectionH / 5;
      
      // 3. Вершина на 1/5, низ на 3/5
      const circleTopY = sectionTop + partH * 1;
      const circleBotY = sectionTop + partH * 3;
      
      // 4. Радиус и центр
      const radiusY = (circleBotY - circleTopY) / 2;
      const cy = circleTopY + radiusY;
      const cx = 0.5; // По центру холста по горизонтали
      
      // ВАЖНО: Так как viewBox 0 0 1 1 (квадрат), радиус по X и Y одинаков в единицах viewBox
      const r = radiusY; 
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', 'blue'); // Синий, чтобы отличать от красных линий сетки
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('vector-effect', 'non-scaling-stroke');
      guideGroup.appendChild(circle);
    }
    // ========================================================
  }
  
  // ==== Подложка ====
  function updateUnderlay() {
    if (!state.underlayBase64) return;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const scalePct = parseFloat(underlayScale.value) / 100;
    const baseH = vh;
    const baseW = baseH * (state.underlayNaturalW / state.underlayNaturalH);
    const w = baseW * scalePct;
    const h = baseH * scalePct;
    underlayImg.style.width = w + 'px';
    underlayImg.style.height = h + 'px';
    underlayImg.style.opacity = parseFloat(underlayOpacity.value) / 100;
  }
  
  btnLoadImage.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        state.underlayBase64 = ev.target.result;
        state.underlayNaturalW = img.naturalWidth;
        state.underlayNaturalH = img.naturalHeight;
        underlayImg.src = ev.target.result;
        underlayImg.style.display = 'block';
        updateUnderlay();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
  
  underlayScale.addEventListener('input', () => {
    underlayScaleVal.textContent = underlayScale.value;
    updateUnderlay();
  });
  underlayOpacity.addEventListener('input', () => {
    underlayOpacityVal.textContent = underlayOpacity.value;
    updateUnderlay();
  });
  
  bgColor.addEventListener('input', () => {
    layerBg.style.background = bgColor.value;
  });
  
  padding.addEventListener('input', () => {
    paddingVal.textContent = padding.value;
    renderGuides();
  });
  heads.addEventListener('input', () => {
    headsVal.textContent = heads.value;
    renderGuides();
  });
  
  // Слушатель для нового чекбокса
  chkShowCircle.addEventListener('change', renderGuides);
  
  brushSize.addEventListener('input', () => {
    brushSizeVal.textContent = brushSize.value;
  });
  
  // ==== Рисование ====
  let isDrawing = false;
  let currentPath = null;
  let currentPoints = [];
  let activePointerId = null;
  
  const pointers = new Map();
  let gestureMode = null;
  let gestureStart = null;
  
  function screenToSvg(clientX, clientY) {
    const rect = drawSvg.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x, y };
  }
  
  function startPath(clientX, clientY) {
    const { x, y } = screenToSvg(clientX, clientY);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', brushColor.value);
    path.setAttribute('stroke-width', brushSize.value);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', 'none');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('d', `M ${x} ${y}`);
    drawGroup.appendChild(path);
    currentPath = path;
    currentPoints = [{ x, y }];
  }
  
  function extendPath(clientX, clientY) {
    if (!currentPath) return;
    const { x, y } = screenToSvg(clientX, clientY);
    currentPoints.push({ x, y });
    let d = `M ${currentPoints[0].x} ${currentPoints[0].y}`;
    for (let i = 1; i < currentPoints.length; i++) {
      d += ` L ${currentPoints[i].x} ${currentPoints[i].y}`;
    }
    currentPath.setAttribute('d', d);
  }
  
  function finishPath() {
    if (currentPath) {
      state.drawPaths.push({
        d: currentPath.getAttribute('d'),
        color: currentPath.getAttribute('stroke'),
        width: currentPath.getAttribute('stroke-width'),
        vectorEffect: 'non-scaling-stroke'
      });
    }
    currentPath = null;
    currentPoints = [];
  }
  
  function cancelPath() {
    if (currentPath && currentPath.parentNode) {
      currentPath.parentNode.removeChild(currentPath);
    }
    currentPath = null;
    currentPoints = [];
  }
  
  function getPinchInfo() {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return null;
    const [a, b] = pts;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return {
      dist: Math.hypot(dx, dy),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2
    };
  }
  
  drawSvg.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (pointers.size === 1) {
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
      if (e.pointerType === 'mouse' && (e.button === 1 || (e.button === 0 && e.shiftKey))) {
        gestureMode = 'pan';
        gestureStart = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startTx: state.tx, startTy: state.ty };
        drawSvg.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isDrawing = true;
      activePointerId = e.pointerId;
      drawSvg.setPointerCapture(e.pointerId);
      startPath(e.clientX, e.clientY);
      e.preventDefault();
    } else if (pointers.size === 2) {
      if (isDrawing) {
        cancelPath();
        isDrawing = false;
        activePointerId = null;
      }
      gestureMode = 'pinch';
      const info = getPinchInfo();
      gestureStart = { dist: info.dist, midX: info.midX, midY: info.midY, startScale: state.scale, startTx: state.tx, startTy: state.ty };
      e.preventDefault();
    }
  });
  
  drawSvg.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    
    if (gestureMode === 'pinch' && pointers.size >= 2) {
      const info = getPinchInfo();
      const ratio = info.dist / gestureStart.dist;
      const newScale = Math.min(state.maxScale, Math.max(state.minScale, gestureStart.startScale * ratio));
      
      const rect = viewport.getBoundingClientRect();
      const px = info.midX - rect.left;
      const py = info.midY - rect.top;
      const smx = (gestureStart.midX - rect.left - gestureStart.startTx) / gestureStart.startScale;
      const smy = (gestureStart.midY - rect.top - gestureStart.startTy) / gestureStart.startScale;
      
      state.scale = newScale;
      state.tx = px - smx * newScale;
      state.ty = py - smy * newScale;
      applyTransform();
      e.preventDefault();
      return;
    }
    
    if (gestureMode === 'pan' && gestureStart && gestureStart.pointerId === e.pointerId) {
      state.tx = gestureStart.startTx + (e.clientX - gestureStart.startX);
      state.ty = gestureStart.startTy + (e.clientY - gestureStart.startY);
      applyTransform();
      e.preventDefault();
      return;
    }
    
    if (isDrawing && e.pointerId === activePointerId) {
      extendPath(e.clientX, e.clientY);
      e.preventDefault();
    }
  });
  
  function handlePointerEnd(e) {
    pointers.delete(e.pointerId);
    if (gestureMode === 'pinch' && pointers.size < 2) {
      gestureMode = null;
      gestureStart = null;
    } else if (gestureMode === 'pan') {
      gestureMode = null;
      gestureStart = null;
    }
    if (isDrawing && e.pointerId === activePointerId) {
      finishPath();
      isDrawing = false;
      activePointerId = null;
    }
  }
  
  drawSvg.addEventListener('pointerup', handlePointerEnd);
  drawSvg.addEventListener('pointercancel', (e) => {
    if (isDrawing && e.pointerId === activePointerId) cancelPath();
    handlePointerEnd(e);
  });
  
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    zoomAt(e.clientX, e.clientY, state.scale * factor);
  }, { passive: false });
  
  // ==== Undo / Clear ====
  btnUndo.addEventListener('click', () => {
    if (state.drawPaths.length === 0) return;
    state.drawPaths.pop();
    redrawPaths();
  });
  
  function redrawPaths() {
    drawGroup.innerHTML = '';
    for (const p of state.drawPaths) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', p.d);
      path.setAttribute('stroke', p.color);
      path.setAttribute('stroke-width', p.width);
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('fill', 'none');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      drawGroup.appendChild(path);
    }
  }
  
  btnClear.addEventListener('click', () => {
    if (!confirm('Очистить всё?')) return;
    state.drawPaths = [];
    drawGroup.innerHTML = '';
  });
  
  // ==== Экспорт ====
  function buildExportSVG() {
    const SIZE = 4096;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('xmlns', ns);
    svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.setAttribute('width', SIZE);
    svg.setAttribute('height', SIZE);
    svg.setAttribute('viewBox', '0 0 1 1');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    const bg = document.createElementNS(ns, 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', '1');
    bg.setAttribute('height', '1');
    bg.setAttribute('fill', bgColor.value);
    svg.appendChild(bg);
    
    if (state.underlayBase64 && state.underlayNaturalW && state.underlayNaturalH) {
      const scalePct = parseFloat(underlayScale.value) / 100;
      const h = 1 * scalePct;
      const w = h * (state.underlayNaturalW / state.underlayNaturalH);
      const x = (1 - w) / 2;
      const y = (1 - h) / 2;
      const img = document.createElementNS(ns, 'image');
      img.setAttribute('x', x);
      img.setAttribute('y', y);
      img.setAttribute('width', w);
      img.setAttribute('height', h);
      img.setAttribute('opacity', parseFloat(underlayOpacity.value) / 100);
      img.setAttribute('preserveAspectRatio', 'none');
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', state.underlayBase64);
      img.setAttribute('href', state.underlayBase64);
      svg.appendChild(img);
    }
    
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('fill', 'none');
    for (const p of state.drawPaths) {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', p.d);
      path.setAttribute('stroke', p.color);
      path.setAttribute('stroke-width', p.width);
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('fill', 'none');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      g.appendChild(path);
    }
    svg.appendChild(g);
    
    return new XMLSerializer().serializeToString(svg);
  }
  
  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  
  btnExportSVG.addEventListener('click', () => {
    const svgStr = '<?xml version="1.0" encoding="UTF-8"?>\n' + buildExportSVG();
    download('drawing.svg', svgStr, 'image/svg+xml');
  });
  
  btnExportPNG.addEventListener('click', () => {
    const svgStr = buildExportSVG();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const SIZE = 4096;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) { alert('Ошибка экспорта PNG'); return; }
        const u = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = u;
        a.download = 'drawing.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(u), 1000);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); alert('Ошибка рендеринга SVG в PNG'); };
    img.src = url;
  });
  
  // ==== Инициализация ====
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  layerBg.style.background = bgColor.value;
  
  const ro = new ResizeObserver(resizeCanvas);
  ro.observe(viewportWrapper);
  
})();
