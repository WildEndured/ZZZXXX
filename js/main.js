(function () {
  'use strict';

  const CANVAS = 4096;
  const DPI = 300;
  const STORAGE_KEY = 'figure-presets-v1';

  const state = {
    heads: 5,
    margin: 0,
    underlay: { src: null, opacity: 0.5, scale: 1.0, naturalWidth: 0, naturalHeight: 0 },
    head: null, torso: null, arm: null,
  };

  const $ = (id) => document.getElementById(id);

  const dom = {
    svg: $('svg'), gridRect: $('gridRect'), headsLayer: $('headsLayer'),
    underlayImage: $('underlayImage'), underlayLayer: $('underlayLayer'),

    headsRange: $('headsRange'), headsVal: $('headsVal'),
    marginRange: $('marginRange'), marginVal: $('marginVal'),

    headTopShift: $('headTopShift'), headTopShiftVal: $('headTopShiftVal'),
    headBottomShift: $('headBottomShift'), headBottomShiftVal: $('headBottomShiftVal'),
    headWidthMul: $('headWidthMul'), headWidthMulVal: $('headWidthMulVal'),
    headRadiusMul: $('headRadiusMul'), headRadiusMulVal: $('headRadiusMulVal'),
    headChinShift: $('headChinShift'), headChinShiftVal: $('headChinShiftVal'),
    headChinWidth: $('headChinWidth'), headChinWidthVal: $('headChinWidthVal'),
    headJawAttach: $('headJawAttach'), headJawAttachVal: $('headJawAttachVal'),
    headJawLength: $('headJawLength'), headJawLengthVal: $('headJawLengthVal'),
    headJawAngleWidth: $('headJawAngleWidth'), headJawAngleWidthVal: $('headJawAngleWidthVal'),

    torsoNeckWidth: $('torsoNeckWidth'), torsoNeckWidthVal: $('torsoNeckWidthVal'),
    torsoChestWidth: $('torsoChestWidth'), torsoChestWidthVal: $('torsoChestWidthVal'),
    torsoChestHeightCorr: $('torsoChestHeightCorr'), torsoChestHeightCorrVal: $('torsoChestHeightCorrVal'),
    torsoChestTop: $('torsoChestTop'), torsoChestTopVal: $('torsoChestTopVal'),
    torsoChestBottom: $('torsoChestBottom'), torsoChestBottomVal: $('torsoChestBottomVal'),
    torsoPelvisWidthCorr: $('torsoPelvisWidthCorr'), torsoPelvisWidthCorrVal: $('torsoPelvisWidthCorrVal'),
    torsoPelvisHeightCorr: $('torsoPelvisHeightCorr'), torsoPelvisHeightCorrVal: $('torsoPelvisHeightCorrVal'),
    torsoPelvisRounding: $('torsoPelvisRounding'), torsoPelvisRoundingVal: $('torsoPelvisRoundingVal'),

    armShoulderRadius: $('armShoulderRadius'), armShoulderRadiusVal: $('armShoulderRadiusVal'),
    armElbowRadius: $('armElbowRadius'), armElbowRadiusVal: $('armElbowRadiusVal'),
    armWristRadius: $('armWristRadius'), armWristRadiusVal: $('armWristRadiusVal'),

    armWristLeftX: $('armWristLeftX'), armWristLeftXVal: $('armWristLeftXVal'),
    armWristLeftY: $('armWristLeftY'), armWristLeftYVal: $('armWristLeftYVal'),
    armWristRightX: $('armWristRightX'), armWristRightXVal: $('armWristRightXVal'),
    armWristRightY: $('armWristRightY'), armWristRightYVal: $('armWristRightYVal'),

    underlayFile: $('underlayFile'), opacityRange: $('opacityRange'), opacityVal: $('opacityVal'),
    scaleRange: $('scaleRange'), scaleVal: $('scaleVal'), removeUnderlay: $('removeUnderlay'),

    presetName: $('presetName'), savePreset: $('savePreset'), presetList: $('presetList'),
    exportSvg: $('exportSvg'), exportPng: $('exportPng'),
  };

  function computeGeometry() {
    const marginPx = Math.round((state.margin / 100) * CANVAS);
    const usableTop = marginPx;
    const usableBottom = CANVAS - marginPx;
    const usableHeight = usableBottom - usableTop;
    const headHeight = usableHeight / state.heads;
    return { canvas: CANVAS, dpi: DPI, marginPx, usableTop, usableBottom, usableHeight, headHeight,
             heads: state.heads, centerX: CANVAS / 2, topY: usableTop };
  }

  function renderHeadsGrid(geo) {
    const ns = 'http://www.w3.org/2000/svg';
    dom.headsLayer.innerHTML = '';
    const maxHeads = Math.ceil(geo.heads);
    for (let i = 0; i <= maxHeads; i++) {
      const y = geo.usableTop + i * geo.headHeight;
      if (y > geo.usableBottom + 0.5) break;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('x2', CANVAS);
      line.setAttribute('y1', y);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#9aa0a6');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '16 12');
      dom.headsLayer.appendChild(line);
    }
  }

  function syncFigureModules(geo) {
    if (window.Head) window.Head.update(geo);
    if (window.Torso) window.Torso.update(geo);
    if (window.Arm) window.Arm.update(geo);
    if (window.Leg) window.Leg.update(geo);
  }

  window.applyState = function() {
    const geo = computeGeometry();
    renderHeadsGrid(geo);
    syncFigureModules(geo);
    renderUnderlay(geo);
    dom.headsVal.textContent = state.heads;
    dom.marginVal.textContent = state.margin;
  };

  function renderUnderlay(geo) {
    const u = state.underlay;
    if (!u.src) { dom.underlayImage.style.display = 'none'; dom.removeUnderlay.disabled = true; return; }
    dom.underlayImage.style.display = 'block';
    dom.underlayImage.setAttribute('href', u.src);
    dom.underlayImage.setAttribute('opacity', String(u.opacity));
    const box = CANVAS;
    const iw = u.naturalWidth || box;
    const ih = u.naturalHeight || box;
    const fit = Math.min(box / iw, box / ih);
    const k = fit * u.scale;
    const drawW = iw * k;
    const drawH = ih * k;
    const x = (box - drawW) / 2;
    const y = (box - drawH) / 2;
    dom.underlayImage.setAttribute('x', x);
    dom.underlayImage.setAttribute('y', y);
    dom.underlayImage.setAttribute('width', drawW);
    dom.underlayImage.setAttribute('height', drawH);
    dom.underlayImage.setAttribute('preserveAspectRatio', 'none');
    dom.removeUnderlay.disabled = false;
  }

  dom.headsRange.addEventListener('input', (e) => { state.heads = parseFloat(e.target.value); window.applyState(); });
  dom.marginRange.addEventListener('input', (e) => { state.margin = parseInt(e.target.value, 10); window.applyState(); });

  function fmtSignedPercent(v) { const p = Math.round(v * 1000) / 10; return p > 0 ? `+${p}` : String(p); }

  // --- Голова ---
  function syncHeadUIFromParams() {
    if (!window.Head) return;
    const p = window.Head.getParams();
    dom.headTopShift.value = p.topShift; dom.headTopShiftVal.textContent = fmtSignedPercent(p.topShift);
    dom.headBottomShift.value = p.bottomShift; dom.headBottomShiftVal.textContent = fmtSignedPercent(p.bottomShift);
    dom.headWidthMul.value = p.widthMul; dom.headWidthMulVal.textContent = Math.round(p.widthMul * 100);
    dom.headRadiusMul.value = p.radiusMul; dom.headRadiusMulVal.textContent = Math.round(p.radiusMul * 100);
    dom.headChinShift.value = p.chinHeightShift; dom.headChinShiftVal.textContent = fmtSignedPercent(p.chinHeightShift);
    dom.headChinWidth.value = p.chinWidth; dom.headChinWidthVal.textContent = Math.round(p.chinWidth * 100);
    dom.headJawAttach.value = p.jawAttach; dom.headJawAttachVal.textContent = fmtSignedPercent(p.jawAttach);
    dom.headJawLength.value = p.jawLength; dom.headJawLengthVal.textContent = Math.round(p.jawLength * 100);
    dom.headJawAngleWidth.value = p.jawAngleWidth; dom.headJawAngleWidthVal.textContent = fmtSignedPercent(p.jawAngleWidth);
  }

  function bindHeadInput(input, valEl, key, format) {
    if (!input || !valEl) return;
    input.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (!window.Head) return;
      window.Head.setParams({ [key]: v });
      valEl.textContent = format(v);
      window.applyState();
    });
  }

  bindHeadInput(dom.headTopShift, dom.headTopShiftVal, 'topShift', fmtSignedPercent);
  bindHeadInput(dom.headBottomShift, dom.headBottomShiftVal, 'bottomShift', fmtSignedPercent);
  bindHeadInput(dom.headWidthMul, dom.headWidthMulVal, 'widthMul', (v) => Math.round(v * 100));
  bindHeadInput(dom.headRadiusMul, dom.headRadiusMulVal, 'radiusMul', (v) => Math.round(v * 100));
  bindHeadInput(dom.headChinShift, dom.headChinShiftVal, 'chinHeightShift', fmtSignedPercent);
  bindHeadInput(dom.headChinWidth, dom.headChinWidthVal, 'chinWidth', (v) => Math.round(v * 100));
  bindHeadInput(dom.headJawAttach, dom.headJawAttachVal, 'jawAttach', fmtSignedPercent);
  bindHeadInput(dom.headJawLength, dom.headJawLengthVal, 'jawLength', (v) => Math.round(v * 100));
  bindHeadInput(dom.headJawAngleWidth, dom.headJawAngleWidthVal, 'jawAngleWidth', fmtSignedPercent);

  // --- Торс ---
  function syncTorsoUIFromParams() {
    if (!window.Torso) return;
    const p = window.Torso.getParams();
    dom.torsoNeckWidth.value = p.neckWidth; dom.torsoNeckWidthVal.textContent = Math.round(p.neckWidth * 100);
    dom.torsoChestWidth.value = p.chestWidth; dom.torsoChestWidthVal.textContent = Math.round(p.chestWidth * 100);
    dom.torsoChestHeightCorr.value = p.chestHeightCorr; dom.torsoChestHeightCorrVal.textContent = fmtSignedPercent(p.chestHeightCorr);
    dom.torsoChestTop.value = p.topNarrow; dom.torsoChestTopVal.textContent = Math.round(p.topNarrow * 100);
    dom.torsoChestBottom.value = p.bottomWide; dom.torsoChestBottomVal.textContent = Math.round(p.bottomWide * 100);
    dom.torsoPelvisWidthCorr.value = p.pelvisWidthCorr; dom.torsoPelvisWidthCorrVal.textContent = fmtSignedPercent(p.pelvisWidthCorr);
    dom.torsoPelvisHeightCorr.value = p.pelvisHeightCorr; dom.torsoPelvisHeightCorrVal.textContent = fmtSignedPercent(p.pelvisHeightCorr);
    dom.torsoPelvisRounding.value = p.pelvisRounding; dom.torsoPelvisRoundingVal.textContent = Math.round(p.pelvisRounding * 100);
  }

  function bindTorsoInput(input, valEl, key, format) {
    if (!input || !valEl) return;
    input.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (!window.Torso) return;
      window.Torso.setParams({ [key]: v });
      valEl.textContent = format(v);
      window.applyState();
    });
  }

  bindTorsoInput(dom.torsoNeckWidth, dom.torsoNeckWidthVal, 'neckWidth', (v) => Math.round(v * 100));
  bindTorsoInput(dom.torsoChestWidth, dom.torsoChestWidthVal, 'chestWidth', (v) => Math.round(v * 100));
  bindTorsoInput(dom.torsoChestHeightCorr, dom.torsoChestHeightCorrVal, 'chestHeightCorr', fmtSignedPercent);
  bindTorsoInput(dom.torsoChestTop, dom.torsoChestTopVal, 'topNarrow', (v) => Math.round(v * 100));
  bindTorsoInput(dom.torsoChestBottom, dom.torsoChestBottomVal, 'bottomWide', (v) => Math.round(v * 100));
  bindTorsoInput(dom.torsoPelvisWidthCorr, dom.torsoPelvisWidthCorrVal, 'pelvisWidthCorr', fmtSignedPercent);
  bindTorsoInput(dom.torsoPelvisHeightCorr, dom.torsoPelvisHeightCorrVal, 'pelvisHeightCorr', fmtSignedPercent);
  bindTorsoInput(dom.torsoPelvisRounding, dom.torsoPelvisRoundingVal, 'pelvisRounding', (v) => Math.round(v * 100));

  // --- Руки ---
  function syncArmUIFromParams() {
    if (!window.Arm) return;
    const p = window.Arm.getParams();
    dom.armShoulderRadius.value = p.shoulderRadiusMul; dom.armShoulderRadiusVal.textContent = Math.round(p.shoulderRadiusMul * 100);
    dom.armElbowRadius.value = p.elbowRadius; dom.armElbowRadiusVal.textContent = Math.round(p.elbowRadius * 1000) / 10;
    dom.armWristRadius.value = p.wristRadius; dom.armWristRadiusVal.textContent = Math.round(p.wristRadius * 1000) / 10;
    dom.armWristLeftX.value = p.wristLeftX; dom.armWristLeftXVal.textContent = fmtSignedPercent(p.wristLeftX);
    dom.armWristLeftY.value = p.wristLeftY; dom.armWristLeftYVal.textContent = fmtSignedPercent(p.wristLeftY);
    dom.armWristRightX.value = p.wristRightX; dom.armWristRightXVal.textContent = fmtSignedPercent(p.wristRightX);
    dom.armWristRightY.value = p.wristRightY; dom.armWristRightYVal.textContent = fmtSignedPercent(p.wristRightY);
  }

  function bindArmInput(input, valEl, key, format) {
    if (!input || !valEl) return;
    input.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (!window.Arm) return;
      window.Arm.setParams({ [key]: v });
      valEl.textContent = format(v);
      window.applyState();
    });
  }

  bindArmInput(dom.armShoulderRadius, dom.armShoulderRadiusVal, 'shoulderRadiusMul', (v) => Math.round(v * 100));
  bindArmInput(dom.armElbowRadius, dom.armElbowRadiusVal, 'elbowRadius', (v) => Math.round(v * 1000) / 10);
  bindArmInput(dom.armWristRadius, dom.armWristRadiusVal, 'wristRadius', (v) => Math.round(v * 1000) / 10);
  bindArmInput(dom.armWristLeftX, dom.armWristLeftXVal, 'wristLeftX', fmtSignedPercent);
  bindArmInput(dom.armWristLeftY, dom.armWristLeftYVal, 'wristLeftY', fmtSignedPercent);
  bindArmInput(dom.armWristRightX, dom.armWristRightXVal, 'wristRightX', fmtSignedPercent);
  bindArmInput(dom.armWristRightY, dom.armWristRightYVal, 'wristRightY', fmtSignedPercent);

  // --- Подложка ---
  dom.underlayFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        state.underlay.src = dataUrl;
        state.underlay.naturalWidth = img.naturalWidth;
        state.underlay.naturalHeight = img.naturalHeight;
        state.underlay.scale = 1.0;
        dom.scaleRange.value = 100;
        dom.scaleVal.textContent = 100;
        window.applyState();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  dom.opacityRange.addEventListener('input', (e) => { state.underlay.opacity = parseInt(e.target.value, 10) / 100; dom.opacityVal.textContent = e.target.value; window.applyState(); });
  dom.scaleRange.addEventListener('input', (e) => { state.underlay.scale = parseInt(e.target.value, 10) / 100; dom.scaleVal.textContent = e.target.value; window.applyState(); });
  dom.removeUnderlay.addEventListener('click', () => {
    state.underlay.src = null; state.underlay.naturalWidth = 0; state.underlay.naturalHeight = 0;
    state.underlay.scale = 1.0; state.underlay.opacity = 0.5;
    dom.opacityRange.value = 50; dom.opacityVal.textContent = 50;
    dom.scaleRange.value = 100; dom.scaleVal.textContent = 100;
    window.applyState();
  });

  // --- Пресеты ---
  function loadPresets() { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return {}; const obj = JSON.parse(raw); return obj && typeof obj === 'object' ? obj : {}; } catch (_) { return {}; } }
  function savePresets(presets) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(presets)); } catch (err) { console.error('Не удалось сохранить пресеты:', err); } }

  function snapshotState() {
    return {
      heads: state.heads, margin: state.margin,
      head: window.Head ? window.Head.getParams() : null,
      torso: window.Torso ? window.Torso.getParams() : null,
      arm: window.Arm ? window.Arm.getParams() : null,
    };
  }

  function applySnapshot(snap) {
    if (!snap) return;
    if (typeof snap.heads === 'number') { state.heads = snap.heads; dom.headsRange.value = snap.heads; }
    if (typeof snap.margin === 'number') { state.margin = snap.margin; dom.marginRange.value = snap.margin; }
    if (window.Head) { if (snap.head && typeof snap.head === 'object') { window.Head.resetParams(); window.Head.setParams(snap.head); } else { window.Head.resetParams(); } syncHeadUIFromParams(); }
    if (window.Torso) { if (snap.torso && typeof snap.torso === 'object') { window.Torso.resetParams(); window.Torso.setParams(snap.torso); } else { window.Torso.resetParams(); } syncTorsoUIFromParams(); }
    if (window.Arm) { if (snap.arm && typeof snap.arm === 'object') { window.Arm.resetParams(); window.Arm.setParams(snap.arm); } else { window.Arm.resetParams(); } syncArmUIFromParams(); }
    window.applyState();
  }

  function renderPresets() {
    const presets = loadPresets();
    const names = Object.keys(presets);
    dom.presetList.innerHTML = '';
    if (names.length === 0) { const li = document.createElement('li'); li.className = 'preset-empty'; li.textContent = 'Пресетов нет'; dom.presetList.appendChild(li); return; }
    names.sort((a, b) => a.localeCompare(b, 'ru'));
    for (const name of names) {
      const li = document.createElement('li');
      const span = document.createElement('span'); span.className = 'preset-name'; span.textContent = name; span.title = name;
      const applyBtn = document.createElement('button'); applyBtn.className = 'preset-btn'; applyBtn.textContent = 'Применить'; applyBtn.addEventListener('click', () => applySnapshot(presets[name]));
      const delBtn = document.createElement('button'); delBtn.className = 'preset-btn remove'; delBtn.textContent = 'Удалить'; delBtn.addEventListener('click', () => { const all = loadPresets(); delete all[name]; savePresets(all); renderPresets(); });
      li.appendChild(span); li.appendChild(applyBtn); li.appendChild(delBtn); dom.presetList.appendChild(li);
    }
  }

  dom.savePreset.addEventListener('click', () => {
    const name = (dom.presetName.value || '').trim();
    if (!name) { alert('Введите название пресета'); return; }
    const all = loadPresets(); all[name] = snapshotState(); savePresets(all); dom.presetName.value = ''; renderPresets();
  });

  // --- Экспорт ---
  function buildExportSvg() {
    const clone = dom.svg.cloneNode(true);
    clone.querySelectorAll('.no-export').forEach((el) => el.remove());
    const g = clone.querySelector('#gridRect'); if (g) g.remove();
    const h = clone.querySelector('#headsLayer'); if (h) h.remove();
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(CANVAS)); clone.setAttribute('height', String(CANVAS)); clone.setAttribute('viewBox', `0 0 ${CANVAS} ${CANVAS}`);
    return clone;
  }

  function serializeSvg(svgEl) { return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svgEl); }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  dom.exportSvg.addEventListener('click', () => { const xml = serializeSvg(buildExportSvg()); downloadBlob(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }), 'figure.svg'); });
  dom.exportPng.addEventListener('click', () => {
    const xml = serializeSvg(buildExportSvg());
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = CANVAS; canvas.height = CANVAS;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CANVAS, CANVAS);
      ctx.drawImage(img, 0, 0, CANVAS, CANVAS); URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => { if (blob) downloadBlob(blob, 'figure.png'); }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(svgUrl); alert('Не удалось экспортировать PNG'); };
    img.src = svgUrl;
  });

  function init() {
    dom.headsRange.value = state.heads;
    dom.marginRange.value = state.margin;
    dom.opacityRange.value = Math.round(state.underlay.opacity * 100); dom.opacityVal.textContent = Math.round(state.underlay.opacity * 100);
    dom.scaleRange.value = Math.round(state.underlay.scale * 100); dom.scaleVal.textContent = Math.round(state.underlay.scale * 100);
    syncHeadUIFromParams();
    syncTorsoUIFromParams();
    syncArmUIFromParams();
    renderPresets();
    window.applyState();
  }

  init();
})();
