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
    head: {
      width: 0.65,
      height: 0.65,
      offset: 0.00,
      chinY: 0.85,
      chinWidth: 0.01
    },
    jaw: {
      attachY: 0.55,
      height: 0.80,
      angle: 0.20,
      round: 0.00
    },
    chest: {
      height: 0.85,
      width: 1.00,
      offset: 0.00,
      topNarrow: 0.70,
      bottomWide: 1.00
    },
    pelvis: {
      widthMod: 1.00,
      heightMod: 1.00,
      offset: 0.00,
      round: 0.20
    },
    elbowLeft: { x: 0, y: 0, r: 0.08 },
    elbowRight: { x: 0, y: 0, r: 0.08 },
    wristLeft: { x: -0.20, y: 0, r: 0.10 },
    wristRight: { x: 0.20, y: 0, r: 0.10 },
    kneeLeft: { x: 0.50, y: 0.25, r: 0.15 },
    kneeRight: { x: -0.50, y: 0.25, r: 0.15 },
    ankleLeft: { x: 0.50, y: 0.50, r: 0.10 },
    ankleRight: { x: -0.50, y: 0.50, r: 0.10 },
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

    // ===== Голова (эллипс в первой секции) =====
    const sectionH = span / n;

    const headH = state.head.height * sectionH;
    const headW = state.head.width * sectionH;
    const rx = headW / 2;
    const ry = headH / 2;
    const cx = 0.5;
    const cy = y0 + state.head.offset * sectionH + ry;

    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', String(cx));
    ellipse.setAttribute('cy', String(cy));
    ellipse.setAttribute('rx', String(rx));
    ellipse.setAttribute('ry', String(ry));
    ellipse.setAttribute('fill', 'none');
    ellipse.setAttribute('stroke', '#ff0000');
    ellipse.setAttribute('stroke-width', '1');
    ellipse.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(ellipse);

    // ===== Грудная клетка (яйцо во второй секции) =====
    const chestY0 = y0 + sectionH + (state.chest.offset * sectionH);
    const chestHeightPx = sectionH * state.chest.height;
    const chestRx = (headW * state.chest.width) / 2;
    
    const narrowFactor = state.chest.topNarrow;
    const wideFactor = state.chest.bottomWide;

    const cpTopX = chestRx * narrowFactor;
    const cpBottomX = chestRx * wideFactor;

    const chestPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    const d = `
      M ${cx} ${chestY0}
      C ${cx + cpTopX} ${chestY0}, ${cx + chestRx} ${chestY0 + chestHeightPx * 0.3}, ${cx + chestRx} ${chestY0 + chestHeightPx * 0.6}
      C ${cx + chestRx} ${chestY0 + chestHeightPx * 0.9}, ${cx + cpBottomX} ${chestY0 + chestHeightPx}, ${cx} ${chestY0 + chestHeightPx}
      C ${cx - cpBottomX} ${chestY0 + chestHeightPx}, ${cx - chestRx} ${chestY0 + chestHeightPx * 0.9}, ${cx - chestRx} ${chestY0 + chestHeightPx * 0.6}
      C ${cx - chestRx} ${chestY0 + chestHeightPx * 0.3}, ${cx - cpTopX} ${chestY0}, ${cx} ${chestY0}
      Z
    `;
    chestPath.setAttribute('d', d.trim());
    chestPath.setAttribute('fill', 'none');
    chestPath.setAttribute('stroke', '#ff0000');
    chestPath.setAttribute('stroke-width', '1');
    chestPath.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(chestPath);

    // ===== Плечи (круги) =====
    const shoulderRadius = (chestHeightPx / 3) / 2;
    const shoulderCy = chestY0 + shoulderRadius;
    
    const t = (shoulderCy - chestY0) / chestHeightPx;
    let curveWidth;
    if (t <= 0.6) {
      const tNorm = t / 0.6;
      curveWidth = cpTopX + (chestRx - cpTopX) * Math.sin(tNorm * Math.PI / 2);
    } else {
      curveWidth = chestRx;
    }
    
    const shoulderLeftCx = cx - curveWidth - shoulderRadius;
    const shoulderRightCx = cx + curveWidth + shoulderRadius;

    const shoulderLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    shoulderLeft.setAttribute('cx', String(shoulderLeftCx));
    shoulderLeft.setAttribute('cy', String(shoulderCy));
    shoulderLeft.setAttribute('r', String(shoulderRadius));
    shoulderLeft.setAttribute('fill', 'none');
    shoulderLeft.setAttribute('stroke', '#ff0000');
    shoulderLeft.setAttribute('stroke-width', '1');
    shoulderLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(shoulderLeft);

    const shoulderRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    shoulderRight.setAttribute('cx', String(shoulderRightCx));
    shoulderRight.setAttribute('cy', String(shoulderCy));
    shoulderRight.setAttribute('r', String(shoulderRadius));
    shoulderRight.setAttribute('fill', 'none');
    shoulderRight.setAttribute('stroke', '#ff0000');
    shoulderRight.setAttribute('stroke-width', '1');
    shoulderRight.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(shoulderRight);

    // ===== Таз =====
    const pelvisW = chestHeightPx * state.pelvis.widthMod;
    const pelvisH = (chestRx * 2) * state.pelvis.heightMod;
    const pelvisY0 = chestY0 + chestHeightPx + (state.pelvis.offset * sectionH);
    const pelvisX0 = cx - pelvisW / 2;

    const rxRadius = Math.min(pelvisW * state.pelvis.round, pelvisH / 2);

    const pelvisRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    pelvisRect.setAttribute('x', String(pelvisX0));
    pelvisRect.setAttribute('y', String(pelvisY0));
    pelvisRect.setAttribute('width', String(pelvisW));
    pelvisRect.setAttribute('height', String(pelvisH));
    pelvisRect.setAttribute('rx', String(rxRadius));
    pelvisRect.setAttribute('ry', String(rxRadius));
    pelvisRect.setAttribute('fill', 'none');
    pelvisRect.setAttribute('stroke', '#ff0000');
    pelvisRect.setAttribute('stroke-width', '1');
    pelvisRect.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(pelvisRect);

    // ===== Руки (Запястья и Локти) =====
    const pelvisBottomY = pelvisY0 + pelvisH;

    // Левая рука
    const wristLeftRadiusPx = state.wristLeft.r * sectionH;
    const wristLeftCy = pelvisBottomY - wristLeftRadiusPx + (state.wristLeft.y * sectionH);
    const wristLeftCx = cx - chestRx - shoulderRadius * 1.5 + (state.wristLeft.x * sectionH);

    const wristLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    wristLeft.setAttribute('cx', String(wristLeftCx));
    wristLeft.setAttribute('cy', String(wristLeftCy));
    wristLeft.setAttribute('r', String(wristLeftRadiusPx));
    wristLeft.setAttribute('fill', 'none');
    wristLeft.setAttribute('stroke', '#ff0000');
    wristLeft.setAttribute('stroke-width', '1');
    wristLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(wristLeft);

    const shoulderLeftCy = shoulderCy;
    const elbowLeftRadiusPx = state.elbowLeft.r * sectionH;
    const elbowLeftCx_base = (shoulderLeftCx + wristLeftCx) / 2;
    const elbowLeftCy_base = (shoulderLeftCy + wristLeftCy) / 2;
    const elbowLeftCx = elbowLeftCx_base + (state.elbowLeft.x * sectionH);
    const elbowLeftCy = elbowLeftCy_base + (state.elbowLeft.y * sectionH);

    const elbowLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    elbowLeft.setAttribute('cx', String(elbowLeftCx));
    elbowLeft.setAttribute('cy', String(elbowLeftCy));
    elbowLeft.setAttribute('r', String(elbowLeftRadiusPx));
    elbowLeft.setAttribute('fill', 'none');
    elbowLeft.setAttribute('stroke', '#ff0000');
    elbowLeft.setAttribute('stroke-width', '1');
    elbowLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(elbowLeft);

    // Правая рука
    const wristRightRadiusPx = state.wristRight.r * sectionH;
    const wristRightCy = pelvisBottomY - wristRightRadiusPx + (state.wristRight.y * sectionH);
    const wristRightCx = cx + chestRx + shoulderRadius * 1.5 + (state.wristRight.x * sectionH);

    const wristRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    wristRight.setAttribute('cx', String(wristRightCx));
    wristRight.setAttribute('cy', String(wristRightCy));
    wristRight.setAttribute('r', String(wristRightRadiusPx));
    wristRight.setAttribute('fill', 'none');
    wristRight.setAttribute('stroke', '#ff0000');
    wristRight.setAttribute('stroke-width', '1');
    wristRight.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(wristRight);

    const shoulderRightCy = shoulderCy;
    const elbowRightRadiusPx = state.elbowRight.r * sectionH;
    const elbowRightCx_base = (shoulderRightCx + wristRightCx) / 2;
    const elbowRightCy_base = (shoulderRightCy + wristRightCy) / 2;
    const elbowRightCx = elbowRightCx_base + (state.elbowRight.x * sectionH);
    const elbowRightCy = elbowRightCy_base + (state.elbowRight.y * sectionH);

    const elbowRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    elbowRight.setAttribute('cx', String(elbowRightCx));
    elbowRight.setAttribute('cy', String(elbowRightCy));
    elbowRight.setAttribute('r', String(elbowRightRadiusPx));
    elbowRight.setAttribute('fill', 'none');
    elbowRight.setAttribute('stroke', '#ff0000');
    elbowRight.setAttribute('stroke-width', '1');
    elbowRight.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(elbowRight);

    // ===== Ноги (Колени и Лодыжки) =====
    
    // Колени: 1 голова вниз от таза
    const kneeOffsetY = headH;
    
    // Лодыжки: на нижней границе рабочей зоны (y1)
    const ankleBaseY = y1;

    // --- Левая нога ---
    const kneeLeftRadiusPx = state.kneeLeft.r * sectionH;
    const kneeLeftCy_base = pelvisBottomY + kneeOffsetY;
    const kneeLeftCx_base = wristLeftCx; // Выравниваем по X запястья
    
    const kneeLeftCx = kneeLeftCx_base + (state.kneeLeft.x * sectionH);
    const kneeLeftCy = kneeLeftCy_base + (state.kneeLeft.y * sectionH);

    const kneeLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    kneeLeft.setAttribute('cx', String(kneeLeftCx));
    kneeLeft.setAttribute('cy', String(kneeLeftCy));
    kneeLeft.setAttribute('r', String(kneeLeftRadiusPx));
    kneeLeft.setAttribute('fill', 'none');
    kneeLeft.setAttribute('stroke', '#ff0000');
    kneeLeft.setAttribute('stroke-width', '1');
    kneeLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(kneeLeft);

    const ankleLeftRadiusPx = state.ankleLeft.r * sectionH;
    const ankleLeftCy_base = ankleBaseY - ankleLeftRadiusPx; // Касается низа
    const ankleLeftCx_base = kneeLeftCx_base;

    const ankleLeftCx = ankleLeftCx_base + (state.ankleLeft.x * sectionH);
    const ankleLeftCy = ankleLeftCy_base + (state.ankleLeft.y * sectionH);

    const ankleLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ankleLeft.setAttribute('cx', String(ankleLeftCx));
    ankleLeft.setAttribute('cy', String(ankleLeftCy));
    ankleLeft.setAttribute('r', String(ankleLeftRadiusPx));
    ankleLeft.setAttribute('fill', 'none');
    ankleLeft.setAttribute('stroke', '#ff0000');
    ankleLeft.setAttribute('stroke-width', '1');
    ankleLeft.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(ankleLeft);

    // --- Правая нога ---
    const kneeRightRadiusPx = state.kneeRight.r * sectionH;
    const kneeRightCy_base = pelvisBottomY + kneeOffsetY;
    const kneeRightCx_base = wristRightCx;

    const kneeRightCx = kneeRightCx_base + (state.kneeRight.x * sectionH);
    const kneeRightCy = kneeRightCy_base + (state.kneeRight.y * sectionH);

    const kneeRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    kneeRight.setAttribute('cx', String(kneeRightCx));
    kneeRight.setAttribute('cy', String(kneeRightCy));
    kneeRight.setAttribute('r', String(kneeRightRadiusPx));
    kneeRight.setAttribute('fill', 'none');
    kneeRight.setAttribute('stroke', '#ff0000');
    kneeRight.setAttribute('stroke-width', '1');
    kneeRight.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(kneeRight);

    const ankleRightRadiusPx = state.ankleRight.r * sectionH;
    const ankleRightCy_base = ankleBaseY - ankleRightRadiusPx;
    const ankleRightCx_base = kneeRightCx_base;

    const ankleRightCx = ankleRightCx_base + (state.ankleRight.x * sectionH);
    const ankleRightCy = ankleRightCy_base + (state.ankleRight.y * sectionH);

    const ankleRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ankleRight.setAttribute('cx', String(ankleRightCx));
    ankleRight.setAttribute('cy', String(ankleRightCy));
    ankleRight.setAttribute('r', String(ankleRightRadiusPx));
    ankleRight.setAttribute('fill', 'none');
    ankleRight.setAttribute('stroke', '#ff0000');
    ankleRight.setAttribute('stroke-width', '1');
    ankleRight.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(ankleRight);

    // ===== Подбородок =====
    const chinYPos = y0 + state.head.chinY * sectionH;
    const chinHalfW = state.head.chinWidth / 2;
    const chinLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    chinLine.setAttribute('x1', String(0.5 - chinHalfW));
    chinLine.setAttribute('x2', String(0.5 + chinHalfW));
    chinLine.setAttribute('y1', String(chinYPos));
    chinLine.setAttribute('y2', String(chinYPos));
    chinLine.setAttribute('stroke', '#ff0000');
    chinLine.setAttribute('stroke-width', '1');
    chinLine.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(chinLine);

    // ===== Челюсть =====
    const attachDy = (state.jaw.attachY - 0.5) * headH;
    const ratioSq = 1 - Math.pow(attachDy / ry, 2);
    const attachX = rx * Math.sqrt(Math.max(0, ratioSq));
    
    const attachLeft = { x: cx - attachX, y: cy + attachDy };
    const attachRight = { x: cx + attachX, y: cy + attachDy };

    const bottomLeft = { x: 0.5 - chinHalfW, y: chinYPos };
    const bottomRight = { x: 0.5 + chinHalfW, y: chinYPos };

    const distToChin = chinYPos - attachLeft.y; 
    const verticalDrop = distToChin * state.jaw.height;
    const angleShift = state.jaw.angle * headW;
    
    const midLeft = { 
      x: attachLeft.x + angleShift, 
      y: attachLeft.y + verticalDrop 
    };
    const midRight = { 
      x: attachRight.x - angleShift, 
      y: attachRight.y + verticalDrop 
    };

    let pathData = '';
    const roundFactor = state.jaw.round;

    if (roundFactor > 0.01) {
      const cp1Left = { x: attachLeft.x, y: attachLeft.y + verticalDrop * 0.6 };
      const cp1Right = { x: attachRight.x, y: attachRight.y + verticalDrop * 0.6 };
      
      const cp2Left = { x: bottomLeft.x + angleShift * 0.5, y: bottomLeft.y - verticalDrop * 0.4 };
      const cp2Right = { x: bottomRight.x - angleShift * 0.5, y: bottomRight.y - verticalDrop * 0.4 };

      const c1L = {
        x: attachLeft.x + (cp1Left.x - attachLeft.x) * roundFactor,
        y: attachLeft.y + (cp1Left.y - attachLeft.y) * roundFactor
      };
      const c2L = {
        x: midLeft.x + (cp2Left.x - midLeft.x) * roundFactor,
        y: midLeft.y + (cp2Left.y - midLeft.y) * roundFactor
      };
      
      const c1R = {
        x: attachRight.x + (cp1Right.x - attachRight.x) * roundFactor,
        y: attachRight.y + (cp1Right.y - attachRight.y) * roundFactor
      };
      const c2R = {
        x: midRight.x + (cp2Right.x - midRight.x) * roundFactor,
        y: midRight.y + (cp2Right.y - midRight.y) * roundFactor
      };

      pathData = `
        M ${attachLeft.x} ${attachLeft.y}
        C ${c1L.x} ${c1L.y}, ${c2L.x} ${c2L.y}, ${bottomLeft.x} ${bottomLeft.y}
        M ${attachRight.x} ${attachRight.y}
        C ${c1R.x} ${c1R.y}, ${c2R.x} ${c2R.y}, ${bottomRight.x} ${bottomRight.y}
      `;
    } else {
      pathData = `
        M ${attachLeft.x} ${attachLeft.y}
        L ${midLeft.x} ${midLeft.y}
        L ${bottomLeft.x} ${bottomLeft.y}
        M ${attachRight.x} ${attachRight.y}
        L ${midRight.x} ${midRight.y}
        L ${bottomRight.x} ${bottomRight.y}
      `;
    }

    const jawPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    jawPath.setAttribute('d', pathData.trim());
    jawPath.setAttribute('fill', 'none');
    jawPath.setAttribute('stroke', '#ff0000');
    jawPath.setAttribute('stroke-width', '1');
    jawPath.setAttribute('vector-effect', 'non-scaling-stroke');
    gridGroup.appendChild(jawPath);
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

    gestureStart = { dist, scale: state.scale, worldX, worldY };
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

  headWidth.addEventListener('input', () => {
    state.head.width = parseInt(headWidth.value, 10) / 100;
    headWidthVal.textContent = headWidth.value + '%';
    renderGrid();
  });

  headHeight.addEventListener('input', () => {
    state.head.height = parseInt(headHeight.value, 10) / 100;
    headHeightVal.textContent = headHeight.value + '%';
    renderGrid();
  });

  headOffset.addEventListener('input', () => {
    state.head.offset = parseInt(headOffset.value, 10) / 100;
    headOffsetVal.textContent = headOffset.value + '%';
    renderGrid();
  });

  chinY.addEventListener('input', () => {
    state.head.chinY = parseInt(chinY.value, 10) / 100;
    chinYVal.textContent = chinY.value + '%';
    renderGrid();
  });

  chinWidth.addEventListener('input', () => {
    state.head.chinWidth = parseInt(chinWidth.value, 10) / 100;
    chinWidthVal.textContent = chinWidth.value + '%';
    renderGrid();
  });

  jawAttachY.addEventListener('input', () => {
    state.jaw.attachY = parseInt(jawAttachY.value, 10) / 100;
    jawAttachYVal.textContent = jawAttachY.value + '%';
    renderGrid();
  });

  jawHeight.addEventListener('input', () => {
    state.jaw.height = parseInt(jawHeight.value, 10) / 100;
    jawHeightVal.textContent = jawHeight.value + '%';
    renderGrid();
  });

  jawAngle.addEventListener('input', () => {
    state.jaw.angle = parseInt(jawAngle.value, 10) / 100;
    jawAngleVal.textContent = jawAngle.value + '%';
    renderGrid();
  });

  jawRound.addEventListener('input', () => {
    state.jaw.round = parseInt(jawRound.value, 10) / 100;
    jawRoundVal.textContent = jawRound.value + '%';
    renderGrid();
  });

  chestHeight.addEventListener('input', () => {
    state.chest.height = parseInt(chestHeight.value, 10) / 100;
    chestHeightVal.textContent = chestHeight.value + '%';
    renderGrid();
  });

  chestWidth.addEventListener('input', () => {
    state.chest.width = parseInt(chestWidth.value, 10) / 100;
    chestWidthVal.textContent = chestWidth.value + '%';
    renderGrid();
  });

  chestOffset.addEventListener('input', () => {
    state.chest.offset = parseInt(chestOffset.value, 10) / 100;
    chestOffsetVal.textContent = chestOffset.value + '%';
    renderGrid();
  });

  chestTopNarrow.addEventListener('input', () => {
    state.chest.topNarrow = parseInt(chestTopNarrow.value, 10) / 100;
    chestTopNarrowVal.textContent = chestTopNarrow.value + '%';
    renderGrid();
  });

  chestBottomWide.addEventListener('input', () => {
    state.chest.bottomWide = parseInt(chestBottomWide.value, 10) / 100;
    chestBottomWideVal.textContent = chestBottomWide.value + '%';
    renderGrid();
  });

  pelvisWidthMod.addEventListener('input', () => {
    state.pelvis.widthMod = parseInt(pelvisWidthMod.value, 10) / 100;
    pelvisWidthModVal.textContent = pelvisWidthMod.value + '%';
    renderGrid();
  });

  pelvisHeightMod.addEventListener('input', () => {
    state.pelvis.heightMod = parseInt(pelvisHeightMod.value, 10) / 100;
    pelvisHeightModVal.textContent = pelvisHeightMod.value + '%';
    renderGrid();
  });

  pelvisOffset.addEventListener('input', () => {
    state.pelvis.offset = parseInt(pelvisOffset.value, 10) / 100;
    pelvisOffsetVal.textContent = pelvisOffset.value + '%';
    renderGrid();
  });

  pelvisRound.addEventListener('input', () => {
    state.pelvis.round = parseInt(pelvisRound.value, 10) / 100;
    pelvisRoundVal.textContent = pelvisRound.value + '%';
    renderGrid();
  });

  elbowLeftX.addEventListener('input', () => {
    state.elbowLeft.x = parseInt(elbowLeftX.value, 10) / 100;
    elbowLeftXVal.textContent = elbowLeftX.value + '%';
    renderGrid();
  });

  elbowLeftY.addEventListener('input', () => {
    state.elbowLeft.y = parseInt(elbowLeftY.value, 10) / 100;
    elbowLeftYVal.textContent = elbowLeftY.value + '%';
    renderGrid();
  });

  elbowLeftR.addEventListener('input', () => {
    state.elbowLeft.r = parseInt(elbowLeftR.value, 10) / 100;
    elbowLeftRVal.textContent = elbowLeftR.value + '%';
    renderGrid();
  });

  elbowRightX.addEventListener('input', () => {
    state.elbowRight.x = parseInt(elbowRightX.value, 10) / 100;
    elbowRightXVal.textContent = elbowRightX.value + '%';
    renderGrid();
  });

  elbowRightY.addEventListener('input', () => {
    state.elbowRight.y = parseInt(elbowRightY.value, 10) / 100;
    elbowRightYVal.textContent = elbowRightY.value + '%';
    renderGrid();
  });

  elbowRightR.addEventListener('input', () => {
    state.elbowRight.r = parseInt(elbowRightR.value, 10) / 100;
    elbowRightRVal.textContent = elbowRightR.value + '%';
    renderGrid();
  });

  wristLeftX.addEventListener('input', () => {
    state.wristLeft.x = parseInt(wristLeftX.value, 10) / 100;
    wristLeftXVal.textContent = wristLeftX.value + '%';
    renderGrid();
  });

  wristLeftY.addEventListener('input', () => {
    state.wristLeft.y = parseInt(wristLeftY.value, 10) / 100;
    wristLeftYVal.textContent = wristLeftY.value + '%';
    renderGrid();
  });

  wristLeftR.addEventListener('input', () => {
    state.wristLeft.r = parseInt(wristLeftR.value, 10) / 100;
    wristLeftRVal.textContent = wristLeftR.value + '%';
    renderGrid();
  });

  wristRightX.addEventListener('input', () => {
    state.wristRight.x = parseInt(wristRightX.value, 10) / 100;
    wristRightXVal.textContent = wristRightX.value + '%';
    renderGrid();
  });

  wristRightY.addEventListener('input', () => {
    state.wristRight.y = parseInt(wristRightY.value, 10) / 100;
    wristRightYVal.textContent = wristRightY.value + '%';
    renderGrid();
  });

  wristRightR.addEventListener('input', () => {
    state.wristRight.r = parseInt(wristRightR.value, 10) / 100;
    wristRightRVal.textContent = wristRightR.value + '%';
    renderGrid();
  });

  kneeLeftX.addEventListener('input', () => {
    state.kneeLeft.x = parseInt(kneeLeftX.value, 10) / 100;
    kneeLeftXVal.textContent = kneeLeftX.value + '%';
    renderGrid();
  });

  kneeLeftY.addEventListener('input', () => {
    state.kneeLeft.y = parseInt(kneeLeftY.value, 10) / 100;
    kneeLeftYVal.textContent = kneeLeftY.value + '%';
    renderGrid();
  });

  kneeLeftR.addEventListener('input', () => {
    state.kneeLeft.r = parseInt(kneeLeftR.value, 10) / 100;
    kneeLeftRVal.textContent = kneeLeftR.value + '%';
    renderGrid();
  });

  kneeRightX.addEventListener('input', () => {
    state.kneeRight.x = parseInt(kneeRightX.value, 10) / 100;
    kneeRightXVal.textContent = kneeRightX.value + '%';
    renderGrid();
  });

  kneeRightY.addEventListener('input', () => {
    state.kneeRight.y = parseInt(kneeRightY.value, 10) / 100;
    kneeRightYVal.textContent = kneeRightY.value + '%';
    renderGrid();
  });

  kneeRightR.addEventListener('input', () => {
    state.kneeRight.r = parseInt(kneeRightR.value, 10) / 100;
    kneeRightRVal.textContent = kneeRightR.value + '%';
    renderGrid();
  });

  ankleLeftX.addEventListener('input', () => {
    state.ankleLeft.x = parseInt(ankleLeftX.value, 10) / 100;
    ankleLeftXVal.textContent = ankleLeftX.value + '%';
    renderGrid();
  });

  ankleLeftY.addEventListener('input', () => {
    state.ankleLeft.y = parseInt(ankleLeftY.value, 10) / 100;
    ankleLeftYVal.textContent = ankleLeftY.value + '%';
    renderGrid();
  });

  ankleLeftR.addEventListener('input', () => {
    state.ankleLeft.r = parseInt(ankleLeftR.value, 10) / 100;
    ankleLeftRVal.textContent = ankleLeftR.value + '%';
    renderGrid();
  });

  ankleRightX.addEventListener('input', () => {
    state.ankleRight.x = parseInt(ankleRightX.value, 10) / 100;
    ankleRightXVal.textContent = ankleRightX.value + '%';
    renderGrid();
  });

  ankleRightY.addEventListener('input', () => {
    state.ankleRight.y = parseInt(ankleRightY.value, 10) / 100;
    ankleRightYVal.textContent = ankleRightY.value + '%';
    renderGrid();
  });

  ankleRightR.addEventListener('input', () => {
    state.ankleRight.r = parseInt(ankleRightR.value, 10) / 100;
    ankleRightRVal.textContent = ankleRightR.value + '%';
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
