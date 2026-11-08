window.App = (function () {
  'use strict';

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

  // === НОВЫЕ DOM ЭЛЕМЕНТЫ (добавлены) ===
  const headWidth = document.getElementById('headWidth');
  const headWidthVal = document.getElementById('headWidthVal');
  const headHeight = document.getElementById('headHeight');
  const headHeightVal = document.getElementById('headHeightVal');
  const headOffset = document.getElementById('headOffset');
  const headOffsetVal = document.getElementById('headOffsetVal');
  
  const chinY = document.getElementById('chinY');
  const chinYVal = document.getElementById('chinYVal');
  const chinWidth = document.getElementById('chinWidth');
  const chinWidthVal = document.getElementById('chinWidthVal');

  const jawAttachY = document.getElementById('jawAttachY');
  const jawAttachYVal = document.getElementById('jawAttachYVal');
  const jawHeight = document.getElementById('jawHeight');
  const jawHeightVal = document.getElementById('jawHeightVal');
  const jawAngle = document.getElementById('jawAngle');
  const jawAngleVal = document.getElementById('jawAngleVal');
  const jawRound = document.getElementById('jawRound');
  const jawRoundVal = document.getElementById('jawRoundVal');

  const chestHeight = document.getElementById('chestHeight');
  const chestHeightVal = document.getElementById('chestHeightVal');
  const chestWidth = document.getElementById('chestWidth');
  const chestWidthVal = document.getElementById('chestWidthVal');
  const chestOffset = document.getElementById('chestOffset');
  const chestOffsetVal = document.getElementById('chestOffsetVal');
  const chestTopNarrow = document.getElementById('chestTopNarrow');
  const chestTopNarrowVal = document.getElementById('chestTopNarrowVal');
  const chestBottomWide = document.getElementById('chestBottomWide');
  const chestBottomWideVal = document.getElementById('chestBottomWideVal');

  const pelvisWidthMod = document.getElementById('pelvisWidthMod');
  const pelvisWidthModVal = document.getElementById('pelvisWidthModVal');
  const pelvisHeightMod = document.getElementById('pelvisHeightMod');
  const pelvisHeightModVal = document.getElementById('pelvisHeightModVal');
  const pelvisOffset = document.getElementById('pelvisOffset');
  const pelvisOffsetVal = document.getElementById('pelvisOffsetVal');
  const pelvisRound = document.getElementById('pelvisRound');
  const pelvisRoundVal = document.getElementById('pelvisRoundVal');

  const elbowLeftX = document.getElementById('elbowLeftX');
  const elbowLeftXVal = document.getElementById('elbowLeftXVal');
  const elbowLeftY = document.getElementById('elbowLeftY');
  const elbowLeftYVal = document.getElementById('elbowLeftYVal');
  const elbowLeftR = document.getElementById('elbowLeftR');
  const elbowLeftRVal = document.getElementById('elbowLeftRVal');

  const elbowRightX = document.getElementById('elbowRightX');
  const elbowRightXVal = document.getElementById('elbowRightXVal');
  const elbowRightY = document.getElementById('elbowRightY');
  const elbowRightYVal = document.getElementById('elbowRightYVal');
  const elbowRightR = document.getElementById('elbowRightR');
  const elbowRightRVal = document.getElementById('elbowRightRVal');

  const wristLeftX = document.getElementById('wristLeftX');
  const wristLeftXVal = document.getElementById('wristLeftXVal');
  const wristLeftY = document.getElementById('wristLeftY');
  const wristLeftYVal = document.getElementById('wristLeftYVal');
  const wristLeftR = document.getElementById('wristLeftR');
  const wristLeftRVal = document.getElementById('wristLeftRVal');

  const wristRightX = document.getElementById('wristRightX');
  const wristRightXVal = document.getElementById('wristRightXVal');
  const wristRightY = document.getElementById('wristRightY');
  const wristRightYVal = document.getElementById('wristRightYVal');
  const wristRightR = document.getElementById('wristRightR');
  const wristRightRVal = document.getElementById('wristRightRVal');

  const forearmOuterBulge = document.getElementById('forearmOuterBulge');
  const forearmOuterBulgeVal = document.getElementById('forearmOuterBulgeVal');
  const forearmOuterAttach = document.getElementById('forearmOuterAttach');
  const forearmOuterAttachVal = document.getElementById('forearmOuterAttachVal');
  const forearmInnerBulge = document.getElementById('forearmInnerBulge');
  const forearmInnerBulgeVal = document.getElementById('forearmInnerBulgeVal');
  const forearmInnerAttach = document.getElementById('forearmInnerAttach');
  const forearmInnerAttachVal = document.getElementById('forearmInnerAttachVal');

  const kneeLeftX = document.getElementById('kneeLeftX');
  const kneeLeftXVal = document.getElementById('kneeLeftXVal');
  const kneeLeftY = document.getElementById('kneeLeftY');
  const kneeLeftYVal = document.getElementById('kneeLeftYVal');
  const kneeLeftR = document.getElementById('kneeLeftR');
  const kneeLeftRVal = document.getElementById('kneeLeftRVal');

  const kneeRightX = document.getElementById('kneeRightX');
  const kneeRightXVal = document.getElementById('kneeRightXVal');
  const kneeRightY = document.getElementById('kneeRightY');
  const kneeRightYVal = document.getElementById('kneeRightYVal');
  const kneeRightR = document.getElementById('kneeRightR');
  const kneeRightRVal = document.getElementById('kneeRightRVal');

  const ankleLeftX = document.getElementById('ankleLeftX');
  const ankleLeftXVal = document.getElementById('ankleLeftXVal');
  const ankleLeftY = document.getElementById('ankleLeftY');
  const ankleLeftYVal = document.getElementById('ankleLeftYVal');
  const ankleLeftR = document.getElementById('ankleLeftR');
  const ankleLeftRVal = document.getElementById('ankleLeftRVal');

  const ankleRightX = document.getElementById('ankleRightX');
  const ankleRightXVal = document.getElementById('ankleRightXVal');
  const ankleRightY = document.getElementById('ankleRightY');
  const ankleRightYVal = document.getElementById('ankleRightYVal');
  const ankleRightR = document.getElementById('ankleRightR');
  const ankleRightRVal = document.getElementById('ankleRightRVal');
  // === КОНЕЦ НОВЫХ ЭЛЕМЕНТОВ ===

  const state = {
    canvasSize: 800, scale: 1, tx: 0, ty: 0, minScale: 1, maxScale: 20,
    bgColor: '#ffffff', underlay: { src: null, imgW: 0, imgH: 0, scale: 1.0, opacity: 1.0 },
    gridPad: 0.00, heads: 5,
    head: { width: 0.65, height: 0.65, offset: 0.00, chinY: 0.85, chinWidth: 0.01 },
    jaw: { attachY: 0.55, height: 0.80, angle: 0.20, round: 0.00 },
    chest: { height: 0.85, width: 1.00, offset: 0.00, topNarrow: 0.70, bottomWide: 1.00 },
    pelvis: { widthMod: 1.00, heightMod: 1.00, offset: 0.00, round: 0.20 },
    elbowLeft: { x: 0, y: 0, r: 0.08 }, elbowRight: { x: 0, y: 0, r: 0.08 },
    wristLeft: { x: -0.20, y: 0, r: 0.10 }, wristRight: { x: 0.20, y: 0, r: 0.10 },
    forearmOuter: { bulge: 0.15, attach: -1.15 }, forearmInner: { bulge: 0.30, attach: -0.10 },
    kneeLeft: { x: 0.50, y: 0.25, r: 0.15 }, kneeRight: { x: -0.50, y: 0.25, r: 0.15 },
    ankleLeft: { x: 0.50, y: 0.50, r: 0.10 }, ankleRight: { x: -0.50, y: 0.50, r: 0.10 },
    brush: { color: '#000000', width: 3 }, paths: []
  };

  function getBaseOffset() {
    const vp = viewport.getBoundingClientRect();
    const size = state.canvasSize;
    return { x: (vp.width - size) / 2, y: (vp.height - size) / 2 };
  }

  function updateCanvasSize() {
    const vp = viewport.getBoundingClientRect();
    const size = Math.max(1, Math.min(vp.width, vp.height));
    state.canvasSize = size;
    zoomContainer.style.width = size + 'px';
    zoomContainer.style.height = size + 'px';
    state.scale = 1; state.tx = 0; state.ty = 0;
    applyTransform();
  }

  function applyTransform() {
    const size = state.canvasSize;
    const s = state.scale;
    const base = getBaseOffset();
    const vp = viewport.getBoundingClientRect();
    const scaled = size * s;
    let minTx, maxTx, minTy, maxTy;

    if (scaled >= vp.width) {
      minTx = 0 - base.x; maxTx = vp.width - scaled - base.x;
    } else {
      minTx = (vp.width - scaled) / 2 - base.x; maxTx = minTx;
    }
    if (scaled >= vp.height) {
      minTy = 0 - base.y; maxTy = vp.height - scaled - base.y;
    } else {
      minTy = (vp.height - scaled) / 2 - base.y; maxTy = minTy;
    }

    state.tx = Math.min(maxTx, Math.max(minTx, state.tx));
    state.ty = Math.min(maxTy, Math.max(minTy, state.ty));

    const left = base.x + state.tx;
    const top = base.y + state.ty;
    zoomContainer.style.transform = `translate(${left}px, ${top}px) scale(${s})`;
  }

  function renderAll() {
    while (gridGroup.firstChild) gridGroup.removeChild(gridGroup.firstChild);
    if (window.App) {
      if (App.Head && App.Head.render) App.Head.render(gridGroup, state);
      if (App.Torso && App.Torso.render) App.Torso.render(gridGroup, state);
      if (App.Arm && App.Arm.render) App.Arm.render(gridGroup, state);
      if (App.Leg && App.Leg.render) App.Leg.render(gridGroup, state);
    }
  }

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
    underlayLayer.style.objectFit = 'fill';
  }

  function clientToLocal(clientX, clientY) {
    const rect = zoomContainer.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function clientToCanvas(clientX, clientY) {
    const p = clientToLocal(clientX, clientY);
    return { x: p.x / state.canvasSize, y: p.y / state.canvasSize };
  }

  const pointers = new Map();
  let drawing = false, currentPath = null, currentPathEl = null, activePointerId = null;
  let gestureActive = false, gestureStart = null, panning = false, panStart = null;

  function beginPath(clientX, clientY) {
    const c = clientToCanvas(clientX, clientY);
    currentPath = { d: `M ${c.x} ${c.y}`, color: state.brush.color, width: state.brush.width };
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
    currentPath = null; currentPathEl = null; drawing = false; activePointerId = null;
  }

  function cancelPath() {
    if (currentPathEl && currentPathEl.parentNode) currentPathEl.parentNode.removeChild(currentPathEl);
    currentPath = null; currentPathEl = null; drawing = false; activePointerId = null;
  }

  function startGesture() {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return;
    gestureActive = true;
    const [a, b] = pts;
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
    const local = clientToLocal(midX, midY);
    const worldX = local.x / state.scale, worldY = local.y / state.scale;
    gestureStart = { dist, scale: state.scale, worldX, worldY };
  }

  function updateGesture() {
    const pts = Array.from(pointers.values());
    if (pts.length < 2 || !gestureStart) return;
    const [a, b] = pts;
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
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
        panning = true; panStart = { x: e.clientX, y: e.clientY, tx: state.tx, ty: state.ty };
      } else if (pointers.size >= 2) {
        if (drawing) cancelPath(); panning = false; startGesture();
      }
      return;
    }

    if (!isTouch && !isLeft) return;
    e.preventDefault();
    if (drawing && activePointerId !== null && e.pointerId !== activePointerId) cancelPath();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    zoomContainer.setPointerCapture(e.pointerId);
    if (pointers.size >= 2) {
      if (drawing) cancelPath(); panning = false; startGesture(); return;
    }
    drawing = true; activePointerId = e.pointerId; beginPath(e.clientX, e.clientY);
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2) {
      if (gestureActive) { e.preventDefault(); updateGesture(); }
      return;
    }
    if (panning && panStart) {
      e.preventDefault();
      state.tx = panStart.tx + (e.clientX - panStart.x);
      state.ty = panStart.ty + (e.clientY - panStart.y);
      applyTransform(); return;
    }
    if (drawing && e.pointerId === activePointerId) {
      e.preventDefault(); extendPath(e.clientX, e.clientY);
    }
  }

  function onPointerUp(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (drawing && e.pointerId === activePointerId) commitPath();
    if (pointers.size < 2) { gestureActive = false; gestureStart = null; }
    if (pointers.size === 0) { panning = false; panStart = null; }
    try { zoomContainer.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  zoomContainer.addEventListener('pointerdown', onPointerDown);
  zoomContainer.addEventListener('pointermove', onPointerMove);
  zoomContainer.addEventListener('pointerup', onPointerUp);
  zoomContainer.addEventListener('pointercancel', onPointerUp);
  zoomContainer.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });

  zoomContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const local = clientToLocal(e.clientX, e.clientY);
    const worldX = local.x / state.scale, worldY = local.y / state.scale;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    let newScale = state.scale * factor;
    newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
    const base = getBaseOffset();
    const newLeft = e.clientX - worldX * newScale;
    const newTop = e.clientY - worldY * newScale;
    state.scale = newScale; state.tx = newLeft - base.x; state.ty = newTop - base.y;
    applyTransform();
  }, { passive: false });

  // ===== Обработчики UI =====
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
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
    renderAll();
  });

  heads.addEventListener('input', () => {
    state.heads = parseInt(heads.value, 10);
    headsVal.textContent = String(state.heads);
    renderAll();
  });

  brushColor.addEventListener('input', () => { state.brush.color = brushColor.value; });
  brushWidth.addEventListener('input', () => {
    state.brush.width = parseInt(brushWidth.value, 10);
    brushWidthVal.textContent = String(state.brush.width);
  });

  undoBtn.addEventListener('click', () => {
    if (state.paths.length === 0) return;
    state.paths.pop();
    redrawAllPaths();
  });

  clearBtn.addEventListener('click', () => { state.paths = []; redrawAllPaths(); });

  // === НОВЫЕ ОБРАБОТЧИКИ (добавлены) ===
  headWidth.addEventListener('input', () => { state.head.width = parseInt(headWidth.value, 10) / 100; headWidthVal.textContent = headWidth.value + '%'; renderAll(); });
  headHeight.addEventListener('input', () => { state.head.height = parseInt(headHeight.value, 10) / 100; headHeightVal.textContent = headHeight.value + '%'; renderAll(); });
  headOffset.addEventListener('input', () => { state.head.offset = parseInt(headOffset.value, 10) / 100; headOffsetVal.textContent = headOffset.value + '%'; renderAll(); });
  chinY.addEventListener('input', () => { state.head.chinY = parseInt(chinY.value, 10) / 100; chinYVal.textContent = chinY.value + '%'; renderAll(); });
  chinWidth.addEventListener('input', () => { state.head.chinWidth = parseInt(chinWidth.value, 10) / 100; chinWidthVal.textContent = chinWidth.value + '%'; renderAll(); });
  jawAttachY.addEventListener('input', () => { state.jaw.attachY = parseInt(jawAttachY.value, 10) / 100; jawAttachYVal.textContent = jawAttachY.value + '%'; renderAll(); });
  jawHeight.addEventListener('input', () => { state.jaw.height = parseInt(jawHeight.value, 10) / 100; jawHeightVal.textContent = jawHeight.value + '%'; renderAll(); });
  jawAngle.addEventListener('input', () => { state.jaw.angle = parseInt(jawAngle.value, 10) / 100; jawAngleVal.textContent = jawAngle.value + '%'; renderAll(); });
  jawRound.addEventListener('input', () => { state.jaw.round = parseInt(jawRound.value, 10) / 100; jawRoundVal.textContent = jawRound.value + '%'; renderAll(); });

  chestHeight.addEventListener('input', () => { state.chest.height = parseInt(chestHeight.value, 10) / 100; chestHeightVal.textContent = chestHeight.value + '%'; renderAll(); });
  chestWidth.addEventListener('input', () => { state.chest.width = parseInt(chestWidth.value, 10) / 100; chestWidthVal.textContent = chestWidth.value + '%'; renderAll(); });
  chestOffset.addEventListener('input', () => { state.chest.offset = parseInt(chestOffset.value, 10) / 100; chestOffsetVal.textContent = chestOffset.value + '%'; renderAll(); });
  chestTopNarrow.addEventListener('input', () => { state.chest.topNarrow = parseInt(chestTopNarrow.value, 10) / 100; chestTopNarrowVal.textContent = chestTopNarrow.value + '%'; renderAll(); });
  chestBottomWide.addEventListener('input', () => { state.chest.bottomWide = parseInt(chestBottomWide.value, 10) / 100; chestBottomWideVal.textContent = chestBottomWide.value + '%'; renderAll(); });

  pelvisWidthMod.addEventListener('input', () => { state.pelvis.widthMod = parseInt(pelvisWidthMod.value, 10) / 100; pelvisWidthModVal.textContent = pelvisWidthMod.value + '%'; renderAll(); });
  pelvisHeightMod.addEventListener('input', () => { state.pelvis.heightMod = parseInt(pelvisHeightMod.value, 10) / 100; pelvisHeightModVal.textContent = pelvisHeightMod.value + '%'; renderAll(); });
  pelvisOffset.addEventListener('input', () => { state.pelvis.offset = parseInt(pelvisOffset.value, 10) / 100; pelvisOffsetVal.textContent = pelvisOffset.value + '%'; renderAll(); });
  pelvisRound.addEventListener('input', () => { state.pelvis.round = parseInt(pelvisRound.value, 10) / 100; pelvisRoundVal.textContent = pelvisRound.value + '%'; renderAll(); });

  elbowLeftX.addEventListener('input', () => { state.elbowLeft.x = parseInt(elbowLeftX.value, 10) / 100; elbowLeftXVal.textContent = elbowLeftX.value + '%'; renderAll(); });
  elbowLeftY.addEventListener('input', () => { state.elbowLeft.y = parseInt(elbowLeftY.value, 10) / 100; elbowLeftYVal.textContent = elbowLeftY.value + '%'; renderAll(); });
  elbowLeftR.addEventListener('input', () => { state.elbowLeft.r = parseInt(elbowLeftR.value, 10) / 100; elbowLeftRVal.textContent = elbowLeftR.value + '%'; renderAll(); });
  elbowRightX.addEventListener('input', () => { state.elbowRight.x = parseInt(elbowRightX.value, 10) / 100; elbowRightXVal.textContent = elbowRightX.value + '%'; renderAll(); });
  elbowRightY.addEventListener('input', () => { state.elbowRight.y = parseInt(elbowRightY.value, 10) / 100; elbowRightYVal.textContent = elbowRightY.value + '%'; renderAll(); });
  elbowRightR.addEventListener('input', () => { state.elbowRight.r = parseInt(elbowRightR.value, 10) / 100; elbowRightRVal.textContent = elbowRightR.value + '%'; renderAll(); });

  wristLeftX.addEventListener('input', () => { state.wristLeft.x = parseInt(wristLeftX.value, 10) / 100; wristLeftXVal.textContent = wristLeftX.value + '%'; renderAll(); });
  wristLeftY.addEventListener('input', () => { state.wristLeft.y = parseInt(wristLeftY.value, 10) / 100; wristLeftYVal.textContent = wristLeftY.value + '%'; renderAll(); });
  wristLeftR.addEventListener('input', () => { state.wristLeft.r = parseInt(wristLeftR.value, 10) / 100; wristLeftRVal.textContent = wristLeftR.value + '%'; renderAll(); });
  wristRightX.addEventListener('input', () => { state.wristRight.x = parseInt(wristRightX.value, 10) / 100; wristRightXVal.textContent = wristRightX.value + '%'; renderAll(); });
  wristRightY.addEventListener('input', () => { state.wristRight.y = parseInt(wristRightY.value, 10) / 100; wristRightYVal.textContent = wristRightY.value + '%'; renderAll(); });
  wristRightR.addEventListener('input', () => { state.wristRight.r = parseInt(wristRightR.value, 10) / 100; wristRightRVal.textContent = wristRightR.value + '%'; renderAll(); });

  forearmOuterBulge.addEventListener('input', () => { state.forearmOuter.bulge = parseInt(forearmOuterBulge.value, 10) / 100; forearmOuterBulgeVal.textContent = forearmOuterBulge.value + '%'; renderAll(); });
  forearmOuterAttach.addEventListener('input', () => { state.forearmOuter.attach = parseInt(forearmOuterAttach.value, 10) / 100; forearmOuterAttachVal.textContent = forearmOuterAttach.value + '%'; renderAll(); });
  forearmInnerBulge.addEventListener('input', () => { state.forearmInner.bulge = parseInt(forearmInnerBulge.value, 10) / 100; forearmInnerBulgeVal.textContent = forearmInnerBulge.value + '%'; renderAll(); });
  forearmInnerAttach.addEventListener('input', () => { state.forearmInner.attach = parseInt(forearmInnerAttach.value, 10) / 100; forearmInnerAttachVal.textContent = forearmInnerAttach.value + '%'; renderAll(); });

  kneeLeftX.addEventListener('input', () => { state.kneeLeft.x = parseInt(kneeLeftX.value, 10) / 100; kneeLeftXVal.textContent = kneeLeftX.value + '%'; renderAll(); });
  kneeLeftY.addEventListener('input', () => { state.kneeLeft.y = parseInt(kneeLeftY.value, 10) / 100; kneeLeftYVal.textContent = kneeLeftY.value + '%'; renderAll(); });
  kneeLeftR.addEventListener('input', () => { state.kneeLeft.r = parseInt(kneeLeftR.value, 10) / 100; kneeLeftRVal.textContent = kneeLeftR.value + '%'; renderAll(); });
  kneeRightX.addEventListener('input', () => { state.kneeRight.x = parseInt(kneeRightX.value, 10) / 100; kneeRightXVal.textContent = kneeRightX.value + '%'; renderAll(); });
  kneeRightY.addEventListener('input', () => { state.kneeRight.y = parseInt(kneeRightY.value, 10) / 100; kneeRightYVal.textContent = kneeRightY.value + '%'; renderAll(); });
  kneeRightR.addEventListener('input', () => { state.kneeRight.r = parseInt(kneeRightR.value, 10) / 100; kneeRightRVal.textContent = kneeRightR.value + '%'; renderAll(); });

  ankleLeftX.addEventListener('input', () => { state.ankleLeft.x = parseInt(ankleLeftX.value, 10) / 100; ankleLeftXVal.textContent = ankleLeftX.value + '%'; renderAll(); });
  ankleLeftY.addEventListener('input', () => { state.ankleLeft.y = parseInt(ankleLeftY.value, 10) / 100; ankleLeftYVal.textContent = ankleLeftY.value + '%'; renderAll(); });
  ankleLeftR.addEventListener('input', () => { state.ankleLeft.r = parseInt(ankleLeftR.value, 10) / 100; ankleLeftRVal.textContent = ankleLeftR.value + '%'; renderAll(); });
  ankleRightX.addEventListener('input', () => { state.ankleRight.x = parseInt(ankleRightX.value, 10) / 100; ankleRightXVal.textContent = ankleRightX.value + '%'; renderAll(); });
  ankleRightY.addEventListener('input', () => { state.ankleRight.y = parseInt(ankleRightY.value, 10) / 100; ankleRightYVal.textContent = ankleRightY.value + '%'; renderAll(); });
  ankleRightR.addEventListener('input', () => { state.ankleRight.r = parseInt(ankleRightR.value, 10) / 100; ankleRightRVal.textContent = ankleRightR.value + '%'; renderAll(); });
  // === КОНЕЦ НОВЫХ ОБРАБОТЧИКОВ ===

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

  function buildExportSVG() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('viewBox', '0 0 1 1');
    svg.setAttribute('width', '1024');
    svg.setAttribute('height', '1024');

    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
    bg.setAttribute('width', '1'); bg.setAttribute('height', '1');
    bg.setAttribute('fill', state.bgColor);
    svg.appendChild(bg);

    if (state.underlay.src) {
      const mul = state.underlay.scale;
      const ratio = state.underlay.imgW / state.underlay.imgH;
      const h = mul, w = ratio * h;
      const x = (1 - w) / 2, y = (1 - h) / 2;
      const img = document.createElementNS(NS, 'image');
      img.setAttribute('href', state.underlay.src);
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', state.underlay.src);
      img.setAttribute('x', String(x)); img.setAttribute('y', String(y));
      img.setAttribute('width', String(w)); img.setAttribute('height', String(h));
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
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
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
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => { if (blob) downloadBlob(blob, 'drawing.png'); }, 'image/png');
    };
    img.onerror = (err) => { console.error('PNG export error', err); URL.revokeObjectURL(url); };
    img.src = url;
  });

  function init() {
    bgLayer.style.background = state.bgColor;
    underlayLayer.style.display = 'none';
    renderAll();
    requestAnimationFrame(() => updateCanvasSize());
    window.addEventListener('resize', () => requestAnimationFrame(updateCanvasSize));
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('#panel')) return;
      e.preventDefault();
    }, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
  }

  return {
    state: state,
    renderAll: renderAll,
    init: init
  };
})();
