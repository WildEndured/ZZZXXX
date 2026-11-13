import './head.js';
import './torso.js';
import './arm.js';
import './leg.js';

/* ================== Константы / состояние ================== */
const CANVAS_SIZE = 4096;
const STORAGE_KEY = 'figure-presets-v1';

const state = {
  heads: 5,
  padding: 0,
  strokeColor: '#222222',
  strokeWidth: 3,
  bg: { src: null, img: null, opacity: 0.5, scale: 1 },
};

/* ================== DOM ================== */
const $ = (id) => document.getElementById(id);

const svg            = $('svg');
const gridLayer      = $('gridLayer');
const figureLayer    = $('figureLayer');
const bgImageEl      = $('bgImage');

const headsRange     = $('headsRange');
const headsOut       = $('headsOut');
const paddingRange   = $('paddingRange');
const paddingOut     = $('paddingOut');
const strokeColorIn  = $('strokeColor');
const strokeWidthIn  = $('strokeWidthRange');
const strokeWidthOut = $('strokeWidthOut');

const bgInput        = $('bgInput');
const bgOpacityRange = $('bgOpacityRange');
const bgOpacityOut   = $('bgOpacityOut');
const bgScaleRange   = $('bgScaleRange');
const bgScaleOut     = $('bgScaleOut');
const bgRemoveBtn    = $('bgRemoveBtn');

const presetNameIn   = $('presetName');
const presetSaveBtn  = $('presetSaveBtn');
const presetList     = $('presetList');

const exportSvgBtn   = $('exportSvgBtn');
const exportPngBtn   = $('exportPngBtn');

/* ================== Утилиты SVG ================== */
function makeEl(name, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/* ================== Расчёт сетки ================== */
function computeLayout() {
  const padPx = (state.padding / 100) * CANVAS_SIZE;
  const usable = CANVAS_SIZE - padPx * 2;
  const headH = usable / state.heads;
  return {
    padPx,
    usable,
    headH,
    headTop: padPx,
    headBottom: padPx + usable,
  };
}

/* ================== Сетка ================== */
function drawGrid() {
  gridLayer.innerHTML = '';
  const { padPx, headH, headTop, headBottom } = computeLayout();

  if (state.padding > 0) {
    [padPx, CANVAS_SIZE - padPx].forEach((y) => {
      gridLayer.appendChild(makeEl('line', {
        x1: 0, y1: y, x2: CANVAS_SIZE, y2: y,
        stroke: '#b8bcc4', 'stroke-dasharray': '16 12',
      }));
    });
  }

  const count = Math.round(state.heads);
  for (let i = 0; i <= count; i++) {
    const y = headTop + i * headH;
    if (y > headBottom + 0.5) break;
    const isEdge = i === 0 || i === count;
    gridLayer.appendChild(makeEl('line', {
      x1: 0, y1: y, x2: CANVAS_SIZE, y2: y,
      stroke: isEdge ? '#9aa0a8' : '#c7ccd4',
      'stroke-dasharray': isEdge ? '' : '20 14',
      'stroke-width': isEdge ? 3 : 2,
    }));
  }
}

/* ================== Подложка ================== */
function updateBgImage() {
  if (!state.bg.img) {
    bgImageEl.style.display = 'none';
    return;
  }
  const img = state.bg.img;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const base = Math.min(CANVAS_SIZE / imgW, CANVAS_SIZE / imgH);
  const w = imgW * base * state.bg.scale;
  const h = imgH * base * state.bg.scale;

  bgImageEl.setAttribute('x', (CANVAS_SIZE - w) / 2);
  bgImageEl.setAttribute('y', (CANVAS_SIZE - h) / 2);
  bgImageEl.setAttribute('width', w);
  bgImageEl.setAttribute('height', h);
  bgImageEl.setAttribute('href', state.bg.src);
  bgImageEl.setAttribute('opacity', state.bg.opacity);
  bgImageEl.style.display = '';
}

/* ================== Отрисовка ================== */
function render() {
  drawGrid();
  updateBgImage();
  // figureLayer остаётся пустым — фигура будет в следующих этапах
}

/* ================== Общие параметры ================== */
headsRange.addEventListener('input', () => {
  state.heads = parseFloat(headsRange.value);
  headsOut.value = state.heads;
  render();
});

paddingRange.addEventListener('input', () => {
  state.padding = parseFloat(paddingRange.value);
  paddingOut.value = state.padding + '%';
  render();
});

strokeColorIn.addEventListener('input', () => {
  state.strokeColor = strokeColorIn.value;
});

strokeWidthIn.addEventListener('input', () => {
  state.strokeWidth = parseFloat(strokeWidthIn.value);
  strokeWidthOut.value = state.strokeWidth;
});

/* ================== Подложка ================== */
bgInput.addEventListener('change', () => {
  const file = bgInput.files && bgInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      state.bg.img = img;
      state.bg.src = reader.result;
      state.bg.scale = 1;
      state.bg.opacity = 0.5;

      bgScaleRange.value = 100;
      bgScaleOut.value = '100%';
      bgOpacityRange.value = 50;
      bgOpacityOut.value = '50%';
      bgScaleRange.disabled = false;
      bgOpacityRange.disabled = false;
      bgRemoveBtn.disabled = false;

      updateBgImage();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  bgInput.value = '';
});

bgScaleRange.addEventListener('input', () => {
  state.bg.scale = parseInt(bgScaleRange.value, 10) / 100;
  bgScaleOut.value = bgScaleRange.value + '%';
  updateBgImage();
});

bgOpacityRange.addEventListener('input', () => {
  state.bg.opacity = parseInt(bgOpacityRange.value, 10) / 100;
  bgOpacityOut.value = bgOpacityRange.value + '%';
  updateBgImage();
});

bgRemoveBtn.addEventListener('click', () => {
  state.bg.img = null;
  state.bg.src = null;
  bgImageEl.style.display = 'none';
  bgScaleRange.disabled = true;
  bgOpacityRange.disabled = true;
  bgRemoveBtn.disabled = true;
  bgScaleRange.value = 100;
  bgOpacityRange.value = 50;
  bgScaleOut.value = '100%';
  bgOpacityOut.value = '50%';
});

/* ================== Пресеты ================== */
function loadPresets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function savePresets(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function renderPresets() {
  const presets = loadPresets();
  presetList.innerHTML = '';

  if (presets.length === 0) {
    const li = document.createElement('li');
    li.className = 'preset-list__empty';
    li.textContent = 'Пресетов пока нет';
    presetList.appendChild(li);
    return;
  }

  presets.forEach((preset) => {
    const li = document.createElement('li');
    li.className = 'preset-item';

    const name = document.createElement('span');
    name.className = 'preset-item__name';
    name.textContent = preset.name;
    name.title = preset.name;

    const actions = document.createElement('div');
    actions.className = 'preset-item__actions';

    const applyBtn = document.createElement('button');
    applyBtn.className = 'preset-item__btn';
    applyBtn.type = 'button';
    applyBtn.textContent = 'Применить';
    applyBtn.addEventListener('click', () => applyPreset(preset));

    const delBtn = document.createElement('button');
    delBtn.className = 'preset-item__btn preset-item__btn--del';
    delBtn.type = 'button';
    delBtn.textContent = '✕';
    delBtn.title = 'Удалить';
    delBtn.addEventListener('click', () => {
      savePresets(loadPresets().filter((p) => p.id !== preset.id));
      renderPresets();
    });

    actions.appendChild(applyBtn);
    actions.appendChild(delBtn);
    li.appendChild(name);
    li.appendChild(actions);
    presetList.appendChild(li);
  });
}

presetSaveBtn.addEventListener('click', () => {
  const name = presetNameIn.value.trim();
  if (!name) { presetNameIn.focus(); return; }

  const preset = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    data: {
      heads: state.heads,
      padding: state.padding,
      strokeColor: state.strokeColor,
      strokeWidth: state.strokeWidth,
    },
  };

  const presets = loadPresets();
  presets.push(preset);
  savePresets(presets);
  presetNameIn.value = '';
  renderPresets();
});

function applyPreset(preset) {
  const d = preset.data || {};
  state.heads       = d.heads ?? 5;
  state.padding     = d.padding ?? 0;
  state.strokeColor = d.strokeColor ?? '#222222';
  state.strokeWidth = d.strokeWidth ?? 3;

  headsRange.value = state.heads;
  headsOut.value = state.heads;

  paddingRange.value = state.padding;
  paddingOut.value = state.padding + '%';

  strokeColorIn.value = state.strokeColor;

  strokeWidthIn.value = state.strokeWidth;
  strokeWidthOut.value = state.strokeWidth;

  render();
}

/* ================== Экспорт ================== */
function buildExportSvg() {
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', CANVAS_SIZE);
  clone.setAttribute('height', CANVAS_SIZE);

  clone.querySelector('#gridLayer')?.remove();
  clone.querySelector('#bgImage')?.remove();
  return new XMLSerializer().serializeToString(clone);
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
  const blob = new Blob([buildExportSvg()], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, 'figure.svg');
});

exportPngBtn.addEventListener('click', () => {
  const svgStr = buildExportSvg();
  const img = new Image();
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'figure.png');
    }, 'image/png');
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('Не удалось экспортировать PNG');
  };

  img.src = url;
});

/* ================== Старт ================== */
renderPresets();
render();
