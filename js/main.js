import { drawHead, HEAD_DEFAULTS } from './head.js';
import { drawTorso, TORSO_DEFAULTS } from './torso.js';
import { drawArms, ARM_DEFAULTS } from './arm.js';
import { drawLegs, LEG_DEFAULTS } from './leg.js';

/* ============================================================
   КОНСТАНТЫ ХОЛСТА
   ============================================================ */
export const CANVAS_SIZE = 4096; // px @300 dpi
export const DPI = 300;

/* ============================================================
   СОСТОЯНИЕ
   ============================================================ */
export const state = {
  // общие настройки
  heads: 5,          // рост в головах
  padPercent: 0,     // отступ от верха/низа, %
  strokeWidth: 2,
  strokeColor: '#000000',

  // подложка (не сохраняется в пресетах, не экспортируется)
  bg: {
    src: null,       // dataURL
    alpha: 0.5,
    scale: 1.0,      // 1 = fit
    fitMode: 'height',
  },

  // модули фигуры
  head:  { ...HEAD_DEFAULTS },
  torso: { ...TORSO_DEFAULTS },
  arm:   { ...ARM_DEFAULTS },
  leg:   { ...LEG_DEFAULTS },
};

/* ============================================================
   ССЫЛКИ НА DOM
   ============================================================ */
const $ = (id) => document.getElementById(id);

const svg        = $('canvas');
const figure     = $('figure');
const grid       = $('grid');
const bgImage    = $('bgImage');
const canvasBg   = $('canvasBg');

/* ============================================================
   ГЕОМЕТРИЯ ХОЛСТА
   ============================================================ */
/**
 * Возвращает базовую геометрию области фигуры.
 *  - top / bottom: границы фигуры по Y
 *  - headH: высота одной "головы"
 *  - cx: центральная ось
 *  - L(n): ключевые линии головы (0..5)
 */
export function computeGeometry() {
  const pad = CANVAS_SIZE * (state.padPercent / 100);
  const top = pad;
  const bottom = CANVAS_SIZE - pad;
  const usableH = bottom - top;
  const headH = usableH / state.heads;
  const cx = CANVAS_SIZE / 2;

  const L = (n) => top + headH * n / 5;

  return { top, bottom, usableH, headH, cx, L };
}

/* ============================================================
   ОТРИСОВКА
   ============================================================ */
export function render() {
  const geo = computeGeometry();

  // 1. Сетка (служебная, не экспортируется)
  renderGrid(geo);

  // 2. Очистка фигуры
  figure.innerHTML = '';

  // 3. Модули (пока реализуем голову; остальные — заглушки)
  drawHead(figure, geo, state.head);
  drawTorso(figure, geo, state.torso);
  drawArms(figure, geo, state.arm);
  drawLegs(figure, geo, state.leg);

  // 4. Применение толщины/цвета
  figure.setAttribute('stroke', state.strokeColor);
  figure.setAttribute('stroke-width', String(state.strokeWidth));
  figure.setAttribute('fill', 'none');

  // 5. Подложка
  renderBackground(geo);
}

function renderGrid(geo) {
  grid.innerHTML = '';
  const line = (y) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    el.setAttribute('x1', 0);
    el.setAttribute('x2', CANVAS_SIZE);
    el.setAttribute('y1', y);
    el.setAttribute('y2', y);
    grid.appendChild(el);
  };
  for (let i = 0; i <= 5; i++) line(geo.L(i));
  // границы фигуры
  line(geo.top);
  line(geo.bottom);
  // центральная ось
  const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  axis.setAttribute('x1', geo.cx);
  axis.setAttribute('x2', geo.cx);
  axis.setAttribute('y1', geo.top);
  axis.setAttribute('y2', geo.bottom);
  axis.setAttribute('stroke-dasharray', '12 12');
  grid.appendChild(axis);
}

function renderBackground(geo) {
  if (!state.bg.src) {
    bgImage.setAttribute('href', '');
    bgImage.setAttribute('width', 0);
    bgImage.setAttribute('height', 0);
    return;
  }

  // подгонка под высоту холста
  const targetH = CANVAS_SIZE * state.bg.scale;
  const targetW = targetH; // квадратный viewBox, meet сохранит пропорции
  bgImage.setAttribute('href', state.bg.src);
  bgImage.setAttribute('width', targetW);
  bgImage.setAttribute('height', targetH);
  bgImage.setAttribute('x', (CANVAS_SIZE - targetW) / 2);
  bgImage.setAttribute('y', (CANVAS_SIZE - targetH) / 2);
  bgImage.setAttribute('opacity', String(state.bg.alpha));
}

/* ============================================================
   ПРИВЯЗКА UI
   ============================================================ */
function bindSlider(id, key, { scale = 1, labelId } = {}) {
  const el = $(id);
  const label = labelId ? $(labelId) : null;
  const apply = () => {
    const v = parseFloat(el.value) * scale;
    state[key] = v;
    if (label) {
      label.textContent = el.value + (id === 'pad' ? '%' : '');
    }
    render();
  };
  el.addEventListener('input', apply);
  apply();
}

function bindUI() {
  // --- Общие ---
  bindSlider('heads', 'heads', { labelId: 'valHeads' });
  bindSlider('pad', 'padPercent', { labelId: 'valPad' });

  const strokeEl = $('stroke');
  const valStroke = $('valStroke');
  strokeEl.addEventListener('input', () => {
    state.strokeWidth = parseFloat(strokeEl.value);
    valStroke.textContent = strokeEl.value;
    render();
  });

  $('strokeColor').addEventListener('input', (e) => {
    state.strokeColor = e.target.value;
    render();
  });

  // --- Подложка ---
  $('bgFile').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      state.bg.src = ev.target.result;
      render();
    };
    reader.readAsDataURL(file);
  });

  $('bgAlpha').addEventListener('input', (e) => {
    state.bg.alpha = parseFloat(e.target.value) / 100;
    $('valBgAlpha').textContent = e.target.value + '%';
    render();
  });

  $('bgScale').addEventListener('input', (e) => {
    state.bg.scale = parseFloat(e.target.value) / 100;
    $('valBgScale').textContent = e.target.value + '%';
    render();
  });

  $('bgRemove').addEventListener('click', () => {
    state.bg.src = null;
    $('bgFile').value = '';
    render();
  });

  // --- Экспорт ---
  $('exportSvg').addEventListener('click', exportSVG);
  $('exportPng').addEventListener('click', exportPNG);

  // --- Пресеты ---
  $('presetSave').addEventListener('click', savePreset);
  refreshPresetsList();
}

/* ============================================================
   ПРЕСЕТЫ
   ============================================================ */
const PRESET_KEY = 'anekordy.presets.v1';

function loadPresets() {
  try { return JSON.parse(localStorage.getItem(PRESET_KEY) || '[]'); }
  catch { return []; }
}
function storePresets(list) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(list));
}

function savePreset() {
  const name = ($('presetName').value || '').trim();
  if (!name) return alert('Введите название пресета');

  const preset = {
    id: Date.now().toString(36),
    name,
    // сохраняем только параметры фигуры и общих настроек
    data: {
      heads: state.heads,
      padPercent: state.padPercent,
      strokeWidth: state.strokeWidth,
      strokeColor: state.strokeColor,
      head:  { ...state.head },
      torso: { ...state.torso },
      arm:   { ...state.arm },
      leg:   { ...state.leg },
    },
  };

  const list = loadPresets();
  list.push(preset);
  storePresets(list);
  $('presetName').value = '';
  refreshPresetsList();
}

function applyPreset(id) {
  const p = loadPresets().find(x => x.id === id);
  if (!p) return;

  // восстанавливаем общие и параметры модулей
  Object.assign(state, p.data);
  Object.assign(state.head,  p.data.head  || {});
  Object.assign(state.torso, p.data.torso || {});
  Object.assign(state.arm,   p.data.arm   || {});
  Object.assign(state.leg,   p.data.leg   || {});

  // синхронизируем ползунки
  $('heads').value = state.heads;
  $('valHeads').textContent = state.heads;
  $('pad').value = state.padPercent;
  $('valPad').textContent = state.padPercent + '%';
  $('stroke').value = state.strokeWidth;
  $('valStroke').textContent = state.strokeWidth;
  $('strokeColor').value = state.strokeColor;

  // подложку НЕ трогаем (по ТЗ)
  render();
}

function deletePreset(id) {
  storePresets(loadPresets().filter(p => p.id !== id));
  refreshPresetsList();
}

function refreshPresetsList() {
  const ul = $('presetList');
  ul.innerHTML = '';
  const list = loadPresets();
  if (!list.length) {
    const li = document.createElement('li');
    li.textContent = 'Пресетов пока нет';
    li.style.cssText = 'font-size:12px;color:#6b7280;';
    ul.appendChild(li);
    return;
  }
  for (const p of list) {
    const li = document.createElement('li');
    li.className = 'preset-item';
    li.innerHTML = `
      <span title="${p.name}">${p.name}</span>
      <button class="apply">Применить</button>
      <button class="del">✕</button>
    `;
    li.querySelector('.apply').addEventListener('click', () => applyPreset(p.id));
    li.querySelector('.del').addEventListener('click', () => deletePreset(p.id));
    ul.appendChild(li);
  }
}

/* ============================================================
   ЭКСПОРТ
   ============================================================ */
function cloneExportSVG() {
  // Клонируем корневой svg, но только с фигурой + белым фоном.
  // Сетка и подложка не попадают в экспорт.
  const clone = svg.cloneNode(true);
  const gGrid = clone.querySelector('#grid');
  const gBg   = clone.querySelector('#bgImage');
  if (gGrid) gGrid.remove();
  if (gBg)   gBg.remove();

  // Гарантируем белый фон
  let bg = clone.querySelector('#canvasBg');
  if (!bg) {
    bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('id', 'canvasBg');
    clone.prepend(bg);
  }
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(CANVAS_SIZE));
  bg.setAttribute('height', String(CANVAS_SIZE));
  bg.setAttribute('fill', '#ffffff');

  // Проставляем xmlns и размеры
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(CANVAS_SIZE));
  clone.setAttribute('height', String(CANVAS_SIZE));
  clone.setAttribute('viewBox', `0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`);

  return clone;
}

function exportSVG() {
  const clone = cloneExportSVG();
  const serializer = new XMLSerializer();
  const src = '<?xml version="1.0" encoding="UTF-8"?>\n'
            + serializer.serializeToString(clone);
  downloadBlob(new Blob([src], { type: 'image/svg+xml;charset=utf-8' }), 'anekordy.svg');
}

async function exportPNG() {
  const clone = cloneExportSVG();
  const serializer = new XMLSerializer();
  const src = serializer.serializeToString(clone);

  // Растеризация через Image + Canvas
  const img = new Image();
  const blob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    // белый фон на всякий случай
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    URL.revokeObjectURL(url);

    canvas.toBlob((pngBlob) => {
      downloadBlob(pngBlob, 'anekordy.png');
    }, 'image/png');
  };

  img.onerror = (e) => {
    console.error('PNG export failed', e);
    URL.revokeObjectURL(url);
    alert('Не удалось экспортировать PNG');
  };

  img.src = url;
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ============================================================
   СТАРТ
   ============================================================ */
function init() {
  bindUI();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
