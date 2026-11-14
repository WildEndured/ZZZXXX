(function () {
  'use strict';

  const CANVAS = 4096;
  const DPI = 300;
  const STORAGE_KEY = 'figure-presets-v2';

  const $ = (id) => document.getElementById(id);

  const dom = {
    svg: $('svg'),
    headsLayer: $('headsLayer'),
    underlayImage: $('underlayImage'),

    headsRange: $('headsRange'),
    headsVal: $('headsVal'),
    marginRange: $('marginRange'),
    marginVal: $('marginVal'),

    headGroup: $('headGroup'),
    headSliders: $('headSliders'),
    lineSliders: $('lineSliders'),

    underlayFile: $('underlayFile'),
    opacityRange: $('opacityRange'),
    opacityVal: $('opacityVal'),
    scaleRange: $('scaleRange'),
    scaleVal: $('scaleVal'),
    removeUnderlay: $('removeUnderlay'),

    presetName: $('presetName'),
    savePreset: $('savePreset'),
    presetList: $('presetList'),

    exportSvg: $('exportSvg'),
    exportPng: $('exportPng'),
  };

  const state = {
    heads: 5,
    margin: 0,
    shape: (window.Head ? window.Head.defaultShape() : {}),
    line: (window.Head ? window.Head.LINE_PARAM.def : 0.012),
    underlay: { src: null, opacity: 0.5, scale: 1.0, naturalWidth: 0, naturalHeight: 0 },
  };

  // ---------- Форматтеры ----------
  const shapeFmt = (p) => (v) => {
    if (p.unit === '°') return `${Math.round(v)}°`;
    if (p.unit === '%') return `${Math.round(v * 100)}%`;
    return Number(v).toFixed(2);
  };
  const lineFmt = (v) => Number(v).toFixed(3);

  // ---------- Геометрия холста ----------
  function computeGeometry() {
    const marginPx = Math.round((state.margin / 100) * CANVAS);
    const usableTop = marginPx;
    const usableBottom = CANVAS - marginPx;
    const usableHeight = usableBottom - usableTop;
    const headHeight = usableHeight / state.heads;

    const headTop = usableTop;
    const headBottom = usableTop + headHeight;

    return {
      canvas: CANVAS, dpi: DPI,
      marginPx, usableTop, usableBottom, usableHeight,
      headHeight, heads: state.heads,
      centerX: CANVAS / 2,
      headTop, headBottom,
      topY: usableTop,
    };
  }

  function renderHeadsGrid(geo) {
    const ns = 'http://www.w3.org/2000/svg';
    dom.headsLayer.innerHTML = '';
    for (let i = 0; i <= Math.ceil(geo.heads); i++) {
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

  function applyState() {
    const geo = computeGeometry();
    renderHeadsGrid(geo);
    if (window.Head) {
      window.Head.shape = state.shape;
      window.Head.update(geo);
      window.Head.setLine(state.line);
    }
    renderUnderlay();
    if (dom.headsVal) dom.headsVal.textContent = state.heads;
    if (dom.marginVal) dom.marginVal.textContent = state.margin;
  }

  // ---------- Подложка ----------
  function renderUnderlay() {
    if (!dom.underlayImage) return;
    const u = state.underlay;
    if (!u.src) {
      dom.underlayImage.style.display = 'none';
      if (dom.removeUnderlay) dom.removeUnderlay.disabled = true;
      return;
    }
    dom.underlayImage.style.display = 'block';
    dom.underlayImage.setAttribute('href', u.src);
    dom.underlayImage.setAttribute('opacity', String(u.opacity));

    const box = CANVAS;
    const iw = u.naturalWidth || box;
    const ih = u.naturalHeight || box;
    const fit = Math.min(box / iw, box / ih);
    const k = fit * u.scale;
    const w = iw * k;
    const h = ih * k;
    dom.underlayImage.setAttribute('x', (box - w) / 2);
    dom.underlayImage.setAttribute('y', (box - h) / 2);
    dom.underlayImage.setAttribute('width', w);
    dom.underlayImage.setAttribute('height', h);
    dom.underlayImage.setAttribute('preserveAspectRatio', 'none');
    if (dom.removeUnderlay) dom.removeUnderlay.disabled = false;
  }

  // ---------- Фабрика ползунков ----------
  function makeSlider(host, p, idPrefix, get, set, fmt) {
    const row = document.createElement('div');
    row.className = 'slider';
    const id = `${idPrefix}-${p.key}`;
    row.innerHTML =
      `<label for="${id}">${p.label}</label>` +
      `<input type="range" id="${id}">` +
      `<output for="${id}"></output>`;
    const [label, input, out] = row.children;
    Object.assign(input, { min: p.min, max: p.max, step: p.step });
    host.appendChild(row);

    const sync = () => { const v = get(); input.value = v; out.textContent = fmt(v); };

    input.addEventListener('input', () => {
      const v = Number(input.value);
      set(v);
      out.textContent = fmt(v);
    });

    const reset = () => { set(p.def); sync(); };
    row.addEventListener('dblclick', reset);

    let timer = 0, start = null;
    input.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      start = { x: e.clientX, y: e.clientY };
      timer = setTimeout(() => { reset(); navigator.vibrate?.(15); }, 600);
    });
    input.addEventListener('pointermove', (e) => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) clearTimeout(timer);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave'])
      input.addEventListener(ev, () => { clearTimeout(timer); start = null; });

    sync();
    return sync;
  }

  // ---------- Ползунки ----------
  const syncers = [];

  function buildHeadSliders() {
    if (!window.Head || !dom.headSliders) return;
    dom.headSliders.innerHTML = '';
    syncers.length = 0;

    let currentGroup = null;
    for (const p of window.Head.PARAMS) {
      if (p.group && p.group !== currentGroup) {
        currentGroup = p.group;
        const h = document.createElement('h3');
        h.className = 'group-h';
        h.textContent = p.group;
        dom.headSliders.appendChild(h);
      }
      syncers.push(makeSlider(
        dom.headSliders, p, 'head',
        () => state.shape[p.key],
        (v) => {
          state.shape[p.key] = v;
          if (window.Head) {
            window.Head.shape = state.shape;
            window.Head.build();
          }
        },
        shapeFmt(p)
      ));
    }
  }

  function buildLineSliders() {
    if (!window.Head || !dom.lineSliders) return;
    dom.lineSliders.innerHTML = '';
    const p = window.Head.LINE_PARAM;
    syncers.push(makeSlider(
      dom.lineSliders, p, 'line',
      () => state.line,
      (v) => {
        state.line = v;
        if (window.Head) window.Head.setLine(v);
      },
      lineFmt
    ));
  }

  // ---------- Общее ----------
  if (dom.headsRange) {
    dom.headsRange.addEventListener('input', (e) => {
      state.heads = parseFloat(e.target.value);
      applyState();
    });
  }
  if (dom.marginRange) {
    dom.marginRange.addEventListener('input', (e) => {
      state.margin = parseInt(e.target.value, 10);
      applyState();
    });
  }

  // ---------- Подложка ----------
  if (dom.underlayFile) {
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
          if (dom.scaleRange) dom.scaleRange.value = 100;
          if (dom.scaleVal) dom.scaleVal.textContent = 100;
          applyState();
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
  }
  if (dom.opacityRange) {
    dom.opacityRange.addEventListener('input', (e) => {
      state.underlay.opacity = parseInt(e.target.value, 10) / 100;
      if (dom.opacityVal) dom.opacityVal.textContent = e.target.value;
      renderUnderlay();
    });
  }
  if (dom.scaleRange) {
    dom.scaleRange.addEventListener('input', (e) => {
      state.underlay.scale = parseInt(e.target.value, 10) / 100;
      if (dom.scaleVal) dom.scaleVal.textContent = e.target.value;
      renderUnderlay();
    });
  }
  if (dom.removeUnderlay) {
    dom.removeUnderlay.addEventListener('click', () => {
      state.underlay = { src: null, opacity: 0.5, scale: 1.0, naturalWidth: 0, naturalHeight: 0 };
      if (dom.opacityRange) dom.opacityRange.value = 50;
      if (dom.opacityVal) dom.opacityVal.textContent = 50;
      if (dom.scaleRange) dom.scaleRange.value = 100;
      if (dom.scaleVal) dom.scaleVal.textContent = 100;
      renderUnderlay();
    });
  }

  // ---------- Пресеты ----------
  function loadPresets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return obj && typeof obj === 'object' ? obj : {};
    } catch { return {}; }
  }
  function savePresets(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
    catch (err) { console.error('Не удалось сохранить пресеты:', err); }
  }
  function snapshotState() {
    return {
      heads: state.heads,
      margin: state.margin,
      shape: { ...state.shape },
      line: state.line,
    };
  }
  function applySnapshot(snap) {
    if (!snap) return;
    if (typeof snap.heads === 'number') {
      state.heads = snap.heads;
      if (dom.headsRange) dom.headsRange.value = snap.heads;
    }
    if (typeof snap.margin === 'number') {
      state.margin = snap.margin;
      if (dom.marginRange) dom.marginRange.value = snap.margin;
    }
    if (snap.shape && window.Head) {
      state.shape = window.Head.clampShape(snap.shape);
      window.Head.shape = state.shape;
    }
    if (typeof snap.line === 'number' && window.Head) {
      const lp = window.Head.LINE_PARAM;
      state.line = Math.min(lp.max, Math.max(lp.min, snap.line));
    }
    for (const s of syncers) s();
    applyState();
  }
  function renderPresets() {
    if (!dom.presetList) return;
    const presets = loadPresets();
    const names = Object.keys(presets).sort((a, b) => a.localeCompare(b, 'ru'));
    dom.presetList.innerHTML = '';
    if (names.length === 0) {
      const li = document.createElement('li');
      li.className = 'preset-empty';
      li.textContent = 'Пресетов нет';
      dom.presetList.appendChild(li);
      return;
    }
    for (const name of names) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.className = 'preset-name';
      span.textContent = name;
      span.title = name;

      const applyBtn = document.createElement('button');
      applyBtn.className = 'preset-btn';
      applyBtn.textContent = 'Применить';
      applyBtn.addEventListener('click', () => applySnapshot(presets[name]));

      const delBtn = document.createElement('button');
      delBtn.className = 'preset-btn remove';
      delBtn.textContent = 'Удалить';
      delBtn.addEventListener('click', () => {
        const all = loadPresets();
        delete all[name];
        savePresets(all);
        renderPresets();
      });

      li.appendChild(span);
      li.appendChild(applyBtn);
      li.appendChild(delBtn);
      dom.presetList.appendChild(li);
    }
  }
  if (dom.savePreset) {
    dom.savePreset.addEventListener('click', () => {
      const name = (dom.presetName.value || '').trim();
      if (!name) { alert('Введите название пресета'); return; }
      const all = loadPresets();
      all[name] = snapshotState();
      savePresets(all);
      dom.presetName.value = '';
      renderPresets();
    });
  }

  // ---------- Экспорт ----------
  function buildExportSvg() {
    const clone = dom.svg.cloneNode(true);
    clone.querySelectorAll('.no-export').forEach((el) => el.remove());
    const g = clone.querySelector('#gridRect'); if (g) g.remove();
    const h = clone.querySelector('#headsLayer'); if (h) h.remove();

    // Сетка L0..L5 — служебная, в экспорт не идёт
    const headGroupEl = clone.querySelector('#headGroup');
    if (headGroupEl) {
      headGroupEl.querySelectorAll('[data-part="head-grid"]').forEach((el) => el.remove());
    }

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(CANVAS));
    clone.setAttribute('height', String(CANVAS));
    clone.setAttribute('viewBox', `0 0 ${CANVAS} ${CANVAS}`);
    return clone;
  }
  function serializeSvg(el) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(el);
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (dom.exportSvg) {
    dom.exportSvg.addEventListener('click', () => {
      const xml = serializeSvg(buildExportSvg());
      download(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }), 'figure.svg');
    });
  }
  if (dom.exportPng) {
    dom.exportPng.addEventListener('click', () => {
      const xml = serializeSvg(buildExportSvg());
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = CANVAS;
        c.height = CANVAS;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS, CANVAS);
        ctx.drawImage(img, 0, 0, CANVAS, CANVAS);
        URL.revokeObjectURL(url);
        c.toBlob((b) => { if (b) download(b, 'figure.png'); }, 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); alert('Не удалось экспортировать PNG'); };
      img.src = url;
    });
  }

  // ---------- Инициализация ----------
  function init() {
    if (dom.headsRange) dom.headsRange.value = state.heads;
    if (dom.marginRange) dom.marginRange.value = state.margin;
    if (dom.opacityRange) dom.opacityRange.value = 50;
    if (dom.opacityVal) dom.opacityVal.textContent = 50;
    if (dom.scaleRange) dom.scaleRange.value = 100;
    if (dom.scaleVal) dom.scaleVal.textContent = 100;

    if (window.Head && dom.headGroup) {
      window.Head.shape = state.shape;
      window.Head.line = state.line;
      window.Head.init(dom.headGroup);
    }

    buildHeadSliders();
    buildLineSliders();
    renderPresets();
    applyState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
