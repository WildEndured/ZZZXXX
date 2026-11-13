// ============================================================
//  Анекорды — ядро (Этап 1)
//  Общие настройки, подложка, пресеты, экспорт, UI.
// ============================================================

import { drawHead } from './head.js';
import { drawTorso } from './torso.js';
import { drawArms } from './arm.js';
import { drawLegs } from './leg.js';

// ---------- КОНСТАНТЫ ----------
const CANVAS_SIZE = 4096;
const STORAGE_KEY = 'anecords.presets.v1';

// ---------- СОСТОЯНИЕ ----------
const state = {
  headsCount: 5,
  margin: 0,          // %
  strokeWidth: 6,
  strokeColor: '#000000',

  backdrop: {
    dataUrl: null,    // исходная картинка
    opacity: 0.5,
    scale: 1,         // 1 = 100 %
  },

  // Параметры фигуры (заполняются модулями на следующих этапах)
  figure: {},
};

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const els = {
  stage:        $('stage'),
  gridLayer:    $('gridLayer'),
  figureLayer:  $('figureLayer'),
  backdropImage:$('backdropImage'),

  headsCount:   $('headsCount'),
  headsCountVal:$('headsCountVal'),
  margin:       $('margin'),
  marginVal:    $('marginVal'),
  strokeWidth:  $('strokeWidth'),
  strokeWidthVal:$('strokeWidthVal'),
  strokeColor:  $('strokeColor'),

  backdropFile: $('backdropFile'),
  backdropOpacity: $('backdropOpacity'),
  backdropOpacityVal: $('backdropOpacityVal'),
  backdropScale:$('backdropScale'),
  backdropScaleVal:$('backdropScaleVal'),
  backdropRemove:$('backdropRemove'),

  presetName:   $('presetName'),
  presetSave:   $('presetSave'),
  presetList:   $('presetList'),

  exportSVG:    $('exportSVG'),
  exportPNG:    $('exportPNG'),
};

// ============================================================
//  ГЕОМЕТРИЯ КАРКАСА
// ============================================================

/**
 * Возвращает геометрию базовой сетки головы.
 * headH — высота одной головы в px холста.
 * baseY — верхняя точка доступной области (после отступа).
 */
export function computeGeometry() {
  const marginPx = (state.margin / 100) * CANVAS_SIZE;
  const usableH = CANVAS_SIZE - marginPx * 2;
  const headH = usableH / state.headsCount;

  const topY = marginPx;
  const bottomY = CANVAS_SIZE - marginPx;

  const lines = []; // L0..L5 (нормированные внутри головы)
  for (let i = 0; i <= 5; i++) {
    lines.push(topY + (headH / 5) * i);
  }

  return {
    canvasSize: CANVAS_SIZE,
    cx: CANVAS_SIZE / 2,
    marginPx,
    topY,
    bottomY,
    usableH,
    headH,
    baseRadius: headH * 0.3,
    headTopY: topY,
    headLines: lines,
  };
}

// ============================================================
//  ОТРИСОВКА
// ============================================================

function drawGrid(geo) {
  const g = els.gridLayer;
  g.innerHTML = '';

  const common = {
    stroke: '#b9c6ff',
    'stroke-width': 2,
    'stroke-dasharray': '14 14',
    fill: 'none',
  };

  const line = (y) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    el.setAttribute('x1', 0);
    el.setAttribute('y1', y);
    el.setAttribute('x2', CANVAS_SIZE);
    el.setAttribute('y2', y);
    for (const k in common) el.setAttribute(k, common[k]);
    g.appendChild(el);
  };

  // Границы отступов
  line(geo.topY);
  line(geo.bottomY);

  // Деления «голов»
  for (let i = 0; i <= state.headsCount; i++) {
    line(geo.topY + geo.headH * i);
  }

  // Деления внутри каждой головы (L1..L4)
  const inner = {
    stroke: '#dfe6ff',
    'stroke-width': 1,
    'stroke-dasharray': '8 12',
    fill: 'none',
  };
  for (let h = 0; h < state.headsCount; h++) {
    const top = geo.topY + geo.headH * h;
    for (let i = 1; i <= 4; i++) {
      const y = top + (geo.headH / 5) * i;
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      el.setAttribute('x1', 0);
      el.setAttribute('y1', y);
      el.setAttribute('x2', CANVAS_SIZE);
      el.setAttribute('y2', y);
      for (const k in inner) el.setAttribute(k, inner[k]);
      g.appendChild(el);
    }
  }

  // Центральная ось
  const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  axis.setAttribute('x1', geo.cx);
  axis.setAttribute('y1', 0);
  axis.setAttribute('x2', geo.cx);
  axis.setAttribute('y2', CANVAS_SIZE);
  axis.setAttribute('stroke', '#c6d2ff');
  axis.setAttribute('stroke-width', 2);
  axis.setAttribute('stroke-dasharray', '20 12');
  g.appendChild(axis);
}

function drawFigure(geo) {
  const g = els.figureLayer;
  g.innerHTML = '';

  const style = {
    stroke: state.strokeColor,
    'stroke-width': state.strokeWidth,
    fill: 'none',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  };

  // Модули фигуры (на Этапе 1 рисуют только каркас)
  drawHead(g, geo, state, style);
  drawTorso(g, geo, state, style);
  drawArms(g, geo, state, style);
  drawLegs(g, geo, state, style);
}

export function render() {
  const geo = computeGeometry();
  drawGrid(geo);
  drawFigure(geo);
}

// ============================================================
//  ПОДЛОЖКА
// ============================================================

function applyBackdrop() {
  const b = state.backdrop;
  if (!b.dataUrl) {
    els.backdropImage.style.display = 'none';
    els.backdropImage.removeAttribute('href');
    els.backdropRemove.disabled = true;
    return;
  }
  els.backdropImage.style.display = '';
  els.backdropImage.setAttribute('href', b.dataUrl);
  els.backdropImage.setAttribute('opacity', b.opacity);
  els.backdropRemove.disabled = false;

  // Масштаб: подгоняем под высоту или ширину холста (contain)
  // Применяем через transform вокруг центра, чтобы не терять пропорции.
  const w = CANVAS_SIZE;
  const h = CANVAS_SIZE;
  const s = b.scale;
  const tx = w / 2;
  const ty = h / 2;
  els.backdropImage.setAttribute(
    'transform',
    `translate(${tx} ${ty}) scale(${s}) translate(${-tx} ${-ty})`
  );
}

function loadBackdropFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.backdrop.dataUrl = e.target.result;
    applyBackdrop();
  };
  reader.readAsDataURL(file);
}

// ============================================================
//  ПРЕСЕТЫ
// ============================================================

function loadPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePresets(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function renderPresets() {
  const presets = loadPresets();
  const names = Object.keys(presets).sort((a, b) =>
    a.localeCompare(b, 'ru')
  );

  els.presetList.innerHTML = '';

  if (!names.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Пресетов пока нет';
    els.presetList.appendChild(li);
    return;
  }

  for (const name of names) {
    const li = document.createElement('li');
    li.className = 'preset-item';

    const span = document.createElement('span');
    span.className = 'name';
    span.textContent = name;
    span.title = name;

    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn mini primary';
    applyBtn.textContent = 'Применить';
    applyBtn.addEventListener('click', () => applyPreset(name));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn mini danger';
    delBtn.textContent = '✕';
    delBtn.title = 'Удалить';
    delBtn.addEventListener('click', () => {
      const p = loadPresets();
      delete p[name];
      savePresets(p);
      renderPresets();
    });

    li.append(span, applyBtn, delBtn);
    els.presetList.appendChild(li);
  }
}

function collectSettings() {
  return {
    headsCount: state.headsCount,
    margin: state.margin,
    strokeWidth: state.strokeWidth,
    strokeColor: state.strokeColor,
    figure: JSON.parse(JSON.stringify(state.figure)),
  };
}

function applySettings(data) {
  if (!data) return;
  if (typeof data.headsCount === 'number') state.headsCount = data.headsCount;
  if (typeof data.margin === 'number') state.margin = data.margin;
  if (typeof data.strokeWidth === 'number') state.strokeWidth = data.strokeWidth;
  if (typeof data.strokeColor === 'string') state.strokeColor = data.strokeColor;
  if (data.figure && typeof data.figure === 'object') {
    state.figure = data.figure;
  }
  syncUIFromState();
  render();
}

function applyPreset(name) {
  const presets = loadPresets();
  if (!presets[name]) return;
  applySettings(presets[name]);
}

function saveCurrentPreset() {
  const name = els.presetName.value.trim();
  if (!name) {
    els.presetName.focus();
    return;
  }
  const presets = loadPresets();
  presets[name] = collectSettings();
  savePresets(presets);
  els.presetName.value = '';
  renderPresets();
}

// ============================================================
//  ЭКСПОРТ
// ============================================================

function buildExportSVGString({ whiteBg = false } = {}) {
  const clone = els.stage.cloneNode(true);

  // Убираем подложку и сетку
  clone.querySelector('#backdropLayer')?.remove();
  clone.querySelector('#gridLayer')?.remove();

  // Устанавливаем размеры
  clone.setAttribute('width', CANVAS_SIZE);
  clone.setAttribute('height', CANVAS_SIZE);
  clone.setAttribute('viewBox', `0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`);

  // Убираем clip-path, который ссылается на defs (defs остаются в clone)
  // Просто гарантируем, что defs на месте:
  if (!clone.querySelector('defs')) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `<clipPath id="canvasClip"><rect x="0" y="0" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"/></clipPath>`;
    clone.prepend(defs);
  }

  if (whiteBg) {
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', 0);
    bg.setAttribute('y', 0);
    bg.setAttribute('width', CANVAS_SIZE);
    bg.setAttribute('height', CANVAS_SIZE);
    bg.setAttribute('fill', '#ffffff');
    clone.insertBefore(bg, clone.firstChild);
  }

  const xml = new XMLSerializer().serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSVG() {
  const str = buildExportSVGString();
  const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, 'anecords.svg');
}

function exportPNG() {
  const str = buildExportSVGString({ whiteBg: true });
  const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

    canvas.toBlob((pngBlob) => {
      if (pngBlob) downloadBlob(pngBlob, 'anecords.png');
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('Не удалось экспортировать PNG.');
  };
  img.src = url;
}

// ============================================================
//  СИНХРОНИЗАЦИЯ UI ↔ STATE
// ============================================================

function syncUIFromState() {
  els.headsCount.value = state.headsCount;
  els.headsCountVal.textContent = state.headsCount.toFixed(1);

  els.margin.value = state.margin;
  els.marginVal.textContent = `${state.margin}%`;

  els.strokeWidth.value = state.strokeWidth;
  els.strokeWidthVal.textContent = state.strokeWidth;

  els.strokeColor.value = state.strokeColor;

  els.backdropOpacity.value = Math.round(state.backdrop.opacity * 100);
  els.backdropOpacityVal.textContent = `${Math.round(state.backdrop.opacity * 100)}%`;

  els.backdropScale.value = Math.round(state.backdrop.scale * 100);
  els.backdropScaleVal.textContent = `${Math.round(state.backdrop.scale * 100)}%`;
}

// ============================================================
//  СОБЫТИЯ
// ============================================================

function bindEvents() {
  // Общее
  els.headsCount.addEventListener('input', (e) => {
    state.headsCount = parseFloat(e.target.value);
    els.headsCountVal.textContent = state.headsCount.toFixed(1);
    render();
  });

  els.margin.addEventListener('input', (e) => {
    state.margin = parseFloat(e.target.value);
    els.marginVal.textContent = `${state.margin}%`;
    render();
  });

  els.strokeWidth.addEventListener('input', (e) => {
    state.strokeWidth = parseInt(e.target.value, 10);
    els.strokeWidthVal.textContent = state.strokeWidth;
    render();
  });

  els.strokeColor.addEventListener('input', (e) => {
    state.strokeColor = e.target.value;
    render();
  });

  // Подложка
  els.backdropFile.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) loadBackdropFile(file);
    e.target.value = ''; // позволяет повторно выбрать тот же файл
  });

  els.backdropOpacity.addEventListener('input', (e) => {
    state.backdrop.opacity = parseInt(e.target.value, 10) / 100;
    els.backdropOpacityVal.textContent = `${e.target.value}%`;
    applyBackdrop();
  });

  els.backdropScale.addEventListener('input', (e) => {
    state.backdrop.scale = parseInt(e.target.value, 10) / 100;
    els.backdropScaleVal.textContent = `${e.target.value}%`;
    applyBackdrop();
  });

  els.backdropRemove.addEventListener('click', () => {
    state.backdrop.dataUrl = null;
    applyBackdrop();
  });

  // Пресеты
  els.presetSave.addEventListener('click', saveCurrentPreset);
  els.presetName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveCurrentPreset();
  });

  // Экспорт
  els.exportSVG.addEventListener('click', exportSVG);
  els.exportPNG.addEventListener('click', exportPNG);
}

// ============================================================
//  СТАРТ
// ============================================================

function init() {
  bindEvents();
  syncUIFromState();
  renderPresets();
  applyBackdrop();
  render();

  // Экспонируем для отладки и будущих модулей
  window.__anecords = { state, render, computeGeometry, CANVAS_SIZE };
}

init();
