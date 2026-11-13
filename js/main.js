// js/main.js
// Ядро приложения: состояние, сетка голов, подложка, пресеты, экспорт, UI.

import { renderHead } from './head.js';
import { renderTorso } from './torso.js';
import { renderArm } from './arm.js';
import { renderLeg } from './leg.js';

/* ============================================================
   КОНСТАНТЫ ХОЛСТА
   ============================================================ */
export const CANVAS = 4096;
export const DPI = 300;
const STORAGE_KEY = 'anecords.presets.v1';

/* ============================================================
   СОСТОЯНИЕ ПО УМОЛЧАНИЮ
   ============================================================ */
function defaultState() {
  return {
    // общие
    common: {
      heads: 5,          // рост в головах (шаг 0.5)
      margin: 0,         // % отступа сверху/снизу
      stroke: 6,         // толщина линий
      color: '#000000',  // цвет линий
    },
    // подложка (НЕ сохраняется в пресеты)
    underlay: {
      src: null,         // dataURL
      opacity: 0.5,
      scale: 1.0,
      naturalW: 0,
      naturalH: 0,
    },
    // модуль головы — параметры по умолчанию
    head: {
      top: 0,        // сдвиг L0
      bottom: 0,     // сдвиг L3
      width: 1.0,    // множитель ширины
      radius: 1.0,   // общий множитель радиуса
      chinY: 0,      // высота подбородка (сдвиг Y)
      chinW: 0.10,   // ширина подбородка
      jawAttach: 0,  // высота крепления к голове
      jawLen: 0.40,  // длина челюсти
      jawAngle: 0.50,// угол челюсти (сужение)
    },
    // будущие модули (заглушки-параметры)
    torso: {},
    arm: {},
    leg: {},
  };
}

let state = defaultState();

/* ============================================================
   DOM
   ============================================================ */
const $ = (id) => document.getElementById(id);
const svg        = $('stage');
const layerGrid  = $('layer-grid');
const layerFigure= $('layer-figure');
const layerUnder = $('layer-underlay');

const UI = {
  heads:          $('inpHeads'),
  headsVal:       $('valHeads'),
  margin:         $('inpMargin'),
  marginVal:      $('valMargin'),
  stroke:         $('inpStroke'),
  strokeVal:      $('valStroke'),
  color:          $('inpColor'),
  underlay:       $('inpUnderlay'),
  underlayBtn:    $('btnUnderlay'),
  underlayOpacity:$('inpUnderlayOpacity'),
  underlayOpacityVal:$('valUnderlayOpacity'),
  underlayScale:  $('inpUnderlayScale'),
  underlayScaleVal:$('valUnderlayScale'),
  underlayRemove: $('btnUnderlayRemove'),
  presetName:     $('inpPresetName'),
  presetSave:     $('btnPresetSave'),
  presetList:     $('presetList'),
  exportSvg:      $('btnExportSvg'),
  exportPng:      $('btnExportPng'),
};

/* ============================================================
   ГЕОМЕТРИЯ СЕТКИ ГОЛОВ
   Возвращает объект с расчётами, используемый модулями.
   ============================================================ */
export function computeGeometry(s = state) {
  const { heads, margin } = s.common;
  const marginPx = (margin / 100) * CANVAS;
  const usableH  = CANVAS - marginPx * 2;
  const headH    = usableH / heads;      // высота одной головы
  const cx       = CANVAS / 2;           // центральная ось
  const topY     = marginPx;             // y верха фигуры
  const baseR    = headH * 0.3;          // базовый радиус головы

  // границы L0..L5 внутри пространства головы (сверху вниз)
  const L = {};
  for (let i = 0; i <= 5; i++) L[i] = topY + (headH * i) / 5;

  return { heads, marginPx, usableH, headH, cx, topY, baseR, L };
}

/* ============================================================
   РЕНДЕР
   ============================================================ */
export function render() {
  const geo = computeGeometry();
  const style = {
    stroke: state.common.stroke,
    color: state.common.color,
  };

  // --- сетка голов (не экспортируется) ---
  renderGrid(geo);

  // --- фигура (экспортируется) ---
  layerFigure.innerHTML = '';
  const ctx = { svg, layer: layerFigure, state, geo, style };
  renderHead(ctx);
  renderTorso(ctx);
  renderArm(ctx);
  renderLeg(ctx);

  // --- подложка ---
  renderUnderlay(geo);

  // обновить значения в UI
  UI.headsVal.textContent = String(state.common.heads);
  UI.marginVal.textContent = `${state.common.margin}%`;
  UI.strokeVal.textContent = String(state.common.stroke);
  UI.underlayOpacityVal.textContent = `${Math.round(state.underlay.opacity * 100)}%`;
  UI.underlayScaleVal.textContent = `${Math.round(state.underlay.scale * 100)}%`;
}

/* ---------- Сетка голов ---------- */
function renderGrid(geo) {
  const { cx, topY, headH, L } = geo;
  let s = '';
  const gridColor = 'rgba(47,111,237,0.35)';
  const gridStroke = 2;

  // гориз. линии L0..L5 на всю высоту сетки
  for (let i = 0; i <= 5; i++) {
    const y = L[i];
    s += `<line x1="0" y1="${y}" x2="${CANVAS}" y2="${y}"
              stroke="${gridColor}" stroke-width="${gridStroke}" />`;
  }
  // при повторении голов (heads > 1) — тонкие линии между головами
  if (state.common.heads > 1) {
    for (let h = 1; h < state.common.heads; h++) {
      const y = topY + headH * h;
      s += `<line x1="0" y1="${y}" x2="${CANVAS}" y2="${y}"
                stroke="rgba(47,111,237,0.18)" stroke-width="${gridStroke}" stroke-dasharray="12 12" />`;
    }
  }
  // центральная ось
  s += `<line x1="${cx}" y1="0" x2="${cx}" y2="${CANVAS}"
            stroke="rgba(214,69,69,0.45)" stroke-width="${gridStroke}" stroke-dasharray="16 12" />`;

  layerGrid.innerHTML = s;
}

/* ---------- Подложка ---------- */
function renderUnderlay(geo) {
  const u = state.underlay;
  layerUnder.innerHTML = '';
  if (!u.src || !u.naturalW || !u.naturalH) return;

  // масштаб: подгоняем под высоту/ширину холста
  const fitScale = Math.min(CANVAS / u.naturalW, CANVAS / u.naturalH);
  const scale = fitScale * u.scale;
  const w = u.naturalW * scale;
  const h = u.naturalH * scale;
  const x = (CANVAS - w) / 2;
  const y = (CANVAS - h) / 2;

  layerUnder.innerHTML = `
    <image href="${u.src}" x="${x}" y="${y}" width="${w}" height="${h}"
           opacity="${u.opacity}" preserveAspectRatio="xMidYMid meet" />
  `;
}

/* ============================================================
   ОБРАБОТЧИКИ UI
   ============================================================ */

// --- общие ---
UI.heads.addEventListener('input', (e) => {
  state.common.heads = parseFloat(e.target.value);
  render();
});
UI.margin.addEventListener('input', (e) => {
  state.common.margin = parseFloat(e.target.value);
  render();
});
UI.stroke.addEventListener('input', (e) => {
  state.common.stroke = parseFloat(e.target.value);
  render();
});
UI.color.addEventListener('input', (e) => {
  state.common.color = e.target.value;
  render();
});

// --- подложка: загрузка ---
UI.underlayBtn.addEventListener('click', () => UI.underlay.click());
UI.underlay.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      state.underlay.src = reader.result;
      state.underlay.naturalW = img.naturalWidth;
      state.underlay.naturalH = img.naturalHeight;
      render();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  e.target.value = ''; // позволяет повторно выбрать тот же файл
});
UI.underlayOpacity.addEventListener('input', (e) => {
  state.underlay.opacity = parseFloat(e.target.value) / 100;
  render();
});
UI.underlayScale.addEventListener('input', (e) => {
  state.underlay.scale = parseFloat(e.target.value) / 100;
  render();
});
UI.underlayRemove.addEventListener('click', () => {
  state.underlay = { src: null, opacity: 0.5, scale: 1.0, naturalW: 0, naturalH: 0 };
  UI.underlayOpacity.value = 50;
  UI.underlayScale.value = 100;
  render();
});

// ============================================================
// ПРЕСЕТЫ (localStorage)
// ============================================================
function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}
function savePresets(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function readPresetList() {
  const presets = loadPresets();
  const names = Object.keys(presets).sort();
  if (!names.length) {
    UI.presetList.innerHTML = `<li class="preset-empty">Пресетов пока нет</li>`;
    return;
  }
  UI.presetList.innerHTML = names.map((name) => `
    <li class="preset-item" data-name="${encodeURIComponent(name)}">
      <span class="preset-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
      <button class="preset-apply" data-action="apply" title="Применить">Применить</button>
      <button class="preset-del" data-action="del" title="Удалить">✕</button>
    </li>
  `).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

UI.presetSave.addEventListener('click', () => {
  const name = UI.presetName.value.trim();
  if (!name) return;
  const presets = loadPresets();
  // сохраняем общие и параметры фигуры, БЕЗ подложки
  presets[name] = {
    common: { ...state.common },
    head: { ...state.head },
    torso: { ...state.torso },
    arm: { ...state.arm },
    leg: { ...state.leg },
  };
  savePresets(presets);
  UI.presetName.value = '';
  readPresetList();
});

UI.presetList.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  const item = e.target.closest('.preset-item');
  if (!item) return;
  const name = decodeURIComponent(item.dataset.name);
  const presets = loadPresets();
  const preset = presets[name];
  if (!preset) return;

  const action = btn?.dataset.action;
  if (action === 'del') {
    delete presets[name];
    savePresets(presets);
    readPresetList();
    return;
  }
  // apply: по клику на кнопку «Применить» или на имя
  if (action === 'apply' || e.target.classList.contains('preset-name')) {
    applyPreset(preset);
  }
});

function applyPreset(preset) {
  // подложку не трогаем
  state.common = { ...defaultState().common, ...preset.common };
  state.head   = { ...defaultState().head,   ...preset.head };
  state.torso  = { ...defaultState().torso,  ...preset.torso };
  state.arm    = { ...defaultState().arm,    ...preset.arm };
  state.leg    = { ...defaultState().leg,    ...preset.leg };

  // синхронизировать UI
  UI.heads.value  = state.common.heads;
  UI.margin.value = state.common.margin;
  UI.stroke.value = state.common.stroke;
  UI.color.value  = state.common.color;
  render();
}

// ============================================================
// ЭКСПОРТ
// ============================================================

// SVG: только слой фигуры + параметры обводки
function buildExportSvg() {
  const { stroke, color } = state.common;
  // клонируем фигуру, проставляем обводку на каждом элементе
  const clone = layerFigure.cloneNode(true);
  clone.querySelectorAll('*').forEach((el) => {
    // не трогаем контейнеры без геометрии
    const tag = el.tagName.toLowerCase();
    if (['line','path','circle','rect','ellipse','polyline','polygon'].includes(tag)) {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', color);
      el.setAttribute('stroke-width', String(stroke));
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
    }
  });
  // если обводка задаётся через style/transform на g — всё равно проставим у детей

  const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${CANVAS}" height="${CANVAS}"
     viewBox="0 0 ${CANVAS} ${CANVAS}">
  <g fill="none" stroke="${color}" stroke-width="${stroke}"
     stroke-linecap="round" stroke-linejoin="round">
    ${clone.innerHTML}
  </g>
</svg>`;
  return svgString;
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

UI.exportSvg.addEventListener('click', () => {
  const svgString = buildExportSvg();
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  downloadBlob(blob, 'anecords-figure.svg');
});

// PNG: белый фон, без сетки и подложки
UI.exportPng.addEventListener('click', async () => {
  const svgString = buildExportSvg();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS;
    canvas.height = CANVAS;
    const ctx = canvas.getContext('2d');
    // белый фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS, CANVAS);
    ctx.drawImage(img, 0, 0, CANVAS, CANVAS);

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'anecords-figure.png');
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = () => {
    console.error('Не удалось отрисовать SVG для PNG');
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
function init() {
  // синхронизировать контролы с состоянием
  UI.heads.value  = state.common.heads;
  UI.margin.value = state.common.margin;
  UI.stroke.value = state.common.stroke;
  UI.color.value  = state.common.color;
  UI.underlayOpacity.value = Math.round(state.underlay.opacity * 100);
  UI.underlayScale.value   = Math.round(state.underlay.scale * 100);

  readPresetList();
  render();
}

init();
