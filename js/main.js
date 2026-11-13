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
    common: {
      heads: 5,
      margin: 0,
      stroke: 6,
      color: '#000000',
    },
    underlay: {
      src: null,
      opacity: 0.5,
      scale: 1.0,
      naturalW: 0,
      naturalH: 0,
    },
    head: {
      top: 0,
      bottom: 0,
      width: 1.0,
      radius: 1.0,
      chinY: 0,
      chinW: 0.10,
      jawAttach: 0,
      jawLen: 0.40,
      jawAngle: 0.50,
    },
    torso: {},
    arm: {},
    leg: {},
  };
}

let state = defaultState();

/* ============================================================
   БЕЗОПАСНЫЙ DOM-ХЕЛПЕР
   ============================================================ */
const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) console.warn('[anecords] не найден элемент #' + id);
  return el;
};

const safeOn = (el, event, handler) => {
  if (el) el.addEventListener(event, handler);
  else console.warn('[anecords] пропущен обработчик: элемент отсутствует');
};

/* ============================================================
   DOM
   ============================================================ */
const svg         = $('stage');
const layerGrid   = $('layer-grid');
const layerFigure = $('layer-figure');
const layerUnder  = $('layer-underlay');

const UI = {
  heads:             $('inpHeads'),
  headsVal:          $('valHeads'),
  margin:            $('inpMargin'),
  marginVal:         $('valMargin'),
  stroke:            $('inpStroke'),
  strokeVal:         $('valStroke'),
  color:             $('inpColor'),
  underlay:          $('inpUnderlay'),
  underlayBtn:       $('btnUnderlay'),
  underlayOpacity:   $('inpUnderlayOpacity'),
  underlayOpacityVal:$('valUnderlayOpacity'),
  underlayScale:     $('inpUnderlayScale'),
  underlayScaleVal:  $('valUnderlayScale'),
  underlayRemove:    $('btnUnderlayRemove'),
  presetName:        $('inpPresetName'),
  presetSave:        $('btnPresetSave'),
  presetList:        $('presetList'),
  exportSvg:         $('btnExportSvg'),
  exportPng:         $('btnExportPng'),
};

/* ============================================================
   ГЕОМЕТРИЯ СЕТКИ ГОЛОВ
   ============================================================ */
export function computeGeometry(s = state) {
  const { heads, margin } = s.common;
  const marginPx = (margin / 100) * CANVAS;
  const usableH  = CANVAS - marginPx * 2;
  const headH    = usableH / heads;
  const cx       = CANVAS / 2;
  const topY     = marginPx;
  const baseR    = headH * 0.3;

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

  // Сетка
  try { renderGrid(geo); }
  catch (e) { console.error('[anecords] renderGrid error:', e); }

  // Фигура
  if (layerFigure) {
    layerFigure.innerHTML = '';
    const ctx = { svg, layer: layerFigure, state, geo, style };
    try { renderHead(ctx); }  catch (e) { console.error('[anecords] head error:', e); }
    try { renderTorso(ctx); } catch (e) { console.error('[anecords] torso error:', e); }
    try { renderArm(ctx); }   catch (e) { console.error('[anecords] arm error:', e); }
    try { renderLeg(ctx); }   catch (e) { console.error('[anecords] leg error:', e); }
  }

  // Подложка
  try { renderUnderlay(geo); }
  catch (e) { console.error('[anecords] renderUnderlay error:', e); }

  // Синхронизация значений в UI
  if (UI.headsVal)  UI.headsVal.textContent  = String(state.common.heads);
  if (UI.marginVal) UI.marginVal.textContent = `${state.common.margin}%`;
  if (UI.strokeVal) UI.strokeVal.textContent = String(state.common.stroke);
  if (UI.underlayOpacityVal)
    UI.underlayOpacityVal.textContent = `${Math.round(state.underlay.opacity * 100)}%`;
  if (UI.underlayScaleVal)
    UI.underlayScaleVal.textContent = `${Math.round(state.underlay.scale * 100)}%`;

  console.log('[anecords] render: heads=', state.common.heads,
              'margin=', state.common.margin,
              'stroke=', state.common.stroke);
}

/* ---------- Сетка голов ---------- */
function renderGrid(geo) {
  if (!layerGrid) return;
  const { cx, topY, headH, L } = geo;
  let s = '';
  const gridColor = 'rgba(47,111,237,0.45)';
  const gridStroke = 3;

  for (let i = 0; i <= 5; i++) {
    const y = L[i];
    s += `<line x1="0" y1="${y}" x2="${CANVAS}" y2="${y}"
              stroke="${gridColor}" stroke-width="${gridStroke}" />`;
  }

  if (state.common.heads > 1) {
    for (let h = 1; h < state.common.heads; h++) {
      const y = topY + headH * h;
      s += `<line x1="0" y1="${y}" x2="${CANVAS}" y2="${y}"
                stroke="rgba(47,111,237,0.22)" stroke-width="${gridStroke}"
                stroke-dasharray="12 12" />`;
    }
  }

  s += `<line x1="${cx}" y1="0" x2="${cx}" y2="${CANVAS}"
            stroke="rgba(214,69,69,0.55)" stroke-width="${gridStroke}"
            stroke-dasharray="16 12" />`;

  layerGrid.innerHTML = s;
}

/* ---------- Подложка ---------- */
function renderUnderlay(geo) {
  if (!layerUnder) return;
  const u = state.underlay;
  layerUnder.innerHTML = '';
  if (!u.src || !u.naturalW || !u.naturalH) return;

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
   UI: ОБЩИЕ
   ============================================================ */
safeOn(UI.heads, 'input', (e) => {
  state.common.heads = parseFloat(e.target.value);
  render();
});
safeOn(UI.margin, 'input', (e) => {
  state.common.margin = parseFloat(e.target.value);
  render();
});
safeOn(UI.stroke, 'input', (e) => {
  state.common.stroke = parseFloat(e.target.value);
  render();
});
safeOn(UI.color, 'input', (e) => {
  state.common.color = e.target.value;
  render();
});

/* ============================================================
   UI: ПОДЛОЖКА
   ============================================================ */
safeOn(UI.underlayBtn, 'click', () => UI.underlay && UI.underlay.click());

safeOn(UI.underlay, 'change', (e) => {
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
    img.onerror = () => console.error('[anecords] не удалось загрузить изображение');
    img.src = reader.result;
  };
  reader.onerror = () => console.error('[anecords] FileReader error');
  reader.readAsDataURL(file);
  e.target.value = '';
});

safeOn(UI.underlayOpacity, 'input', (e) => {
  state.underlay.opacity = parseFloat(e.target.value) / 100;
  render();
});
safeOn(UI.underlayScale, 'input', (e) => {
  state.underlay.scale = parseFloat(e.target.value) / 100;
  render();
});
safeOn(UI.underlayRemove, 'click', () => {
  state.underlay = { src: null, opacity: 0.5, scale: 1.0, naturalW: 0, naturalH: 0 };
  if (UI.underlayOpacity) UI.underlayOpacity.value = 50;
  if (UI.underlayScale) UI.underlayScale.value = 100;
  render();
});

/* ============================================================
   ПРЕСЕТЫ
   ============================================================ */
function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}
function savePresets(presets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('[anecords] не удалось сохранить пресеты:', e);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function readPresetList() {
  if (!UI.presetList) return;
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

safeOn(UI.presetSave, 'click', () => {
  const name = UI.presetName?.value.trim();
  if (!name) return;
  const presets = loadPresets();
  presets[name] = {
    common: { ...state.common },
    head:   { ...state.head },
    torso:  { ...state.torso },
    arm:    { ...state.arm },
    leg:    { ...state.leg },
  };
  savePresets(presets);
  if (UI.presetName) UI.presetName.value = '';
  readPresetList();
});

safeOn(UI.presetList, 'click', (e) => {
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
  if (action === 'apply' || e.target.classList.contains('preset-name')) {
    applyPreset(preset);
  }
});

function applyPreset(preset) {
  state.common = { ...defaultState().common, ...preset.common };
  state.head   = { ...defaultState().head,   ...preset.head };
  state.torso  = { ...defaultState().torso,  ...preset.torso };
  state.arm    = { ...defaultState().arm,    ...preset.arm };
  state.leg    = { ...defaultState().leg,    ...preset.leg };

  if (UI.heads)  UI.heads.value  = state.common.heads;
  if (UI.margin) UI.margin.value = state.common.margin;
  if (UI.stroke) UI.stroke.value = state.common.stroke;
  if (UI.color)  UI.color.value  = state.common.color;
  render();
}

/* ============================================================
   ЭКСПОРТ
   ============================================================ */
function buildExportSvg() {
  const { stroke, color } = state.common;
  const clone = layerFigure ? layerFigure.cloneNode(true) : document.createElementNS(
    'http://www.w3.org/2000/svg', 'g'
  );
  clone.querySelectorAll('*').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (['line','path','circle','rect','ellipse','polyline','polygon'].includes(tag)) {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', color);
      el.setAttribute('stroke-width', String(stroke));
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${CANVAS}" height="${CANVAS}"
     viewBox="0 0 ${CANVAS} ${CANVAS}">
  <g fill="none" stroke="${color}" stroke-width="${stroke}"
     stroke-linecap="round" stroke-linejoin="round">
    ${clone.innerHTML}
  </g>
</svg>`;
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

safeOn(UI.exportSvg, 'click', () => {
  const svgString = buildExportSvg();
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  downloadBlob(blob, 'anecords-figure.svg');
});

safeOn(UI.exportPng, 'click', async () => {
  const svgString = buildExportSvg();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS;
    canvas.height = CANVAS;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS, CANVAS);
    ctx.drawImage(img, 0, 0, CANVAS, CANVAS);

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'anecords-figure.png');
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.onerror = () => {
    console.error('[anecords] не удалось отрисовать SVG для PNG');
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
   ============================================================ */
function init() {
  try {
    if (UI.heads)  UI.heads.value  = state.common.heads;
    if (UI.margin) UI.margin.value = state.common.margin;
    if (UI.stroke) UI.stroke.value = state.common.stroke;
    if (UI.color)  UI.color.value  = state.common.color;
    if (UI.underlayOpacity)
      UI.underlayOpacity.value = Math.round(state.underlay.opacity * 100);
    if (UI.underlayScale)
      UI.underlayScale.value = Math.round(state.underlay.scale * 100);

    readPresetList();
    render();
    console.log('[anecords] init OK');
  } catch (err) {
    console.error('[anecords] init failed:', err);
  }
}

init();
