/* =========================================================
   main.js — состояние, ползунки, пресеты, экспорт
   ========================================================= */

/* ---------- Состояние ---------- */
export const state = {
  canvas: {
    X: 5,          // Рост в головах (по умолчанию 5)
    marginTop: 0,  // Отступ сверху (%) (по умолчанию 0)
    marginBottom: 0, // Отступ снизу (%) (по умолчанию 0)
  },
  head: {
    top: 0, bottom: 0, width: 0, radius: 0,
    chin:  { height: 0, width: 0, rounding: 0 },
    jaw:   { attach: 0, length: 0, angle: 0, width: 0 },
    neck:  { width: 0 },
  },
  torso: {
    chest:  { top: 0, bottom: 0, height: 0, width: 0 },
    pelvis: { width: 0, height: 0, rounding: 0 },
  },
  arms: {
    shoulder: { radius: 0 },
    elbow:    { radius: 0, dx: 0, dy: 0 },
    wrist:    { radius: 0, dx: 0, dy: 0 },
  },
  legs: {
    knee:  { radius: 0, dx: 0, dy: 0 },
    ankle: { radius: 0, dx: 0 },
  },
  underlay: {
    image: null,
    opacity: 40,
    scale: 100,
    x: 0, y: 0,
  },
};

/* ---------- Утилиты ---------- */
function getByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setByPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

/* ---------- DOM ---------- */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const viewport = document.getElementById('viewport');
const presetsContainer = document.getElementById('presetsContainer');
const inputPresetName = document.getElementById('presetName');
const btnSavePreset = document.getElementById('btnSavePreset');
const btnDeletePreset = document.getElementById('btnDeletePreset');
const underlayFile = document.getElementById('underlayFile');

/* ---------- Динамические пресеты ---------- */
// При первом запуске загружаем пустой объект
let customPresets = JSON.parse(localStorage.getItem('figurePresets')) || {};

function renderPresets() {
  presetsContainer.innerHTML = '';
  const presetNames = Object.keys(customPresets);

  if (presetNames.length === 0) {
    presetsContainer.innerHTML = '<div style="grid-column: 1/-1; font-size: 11px; color: var(--text-dim); text-align: center; padding: 10px;">Нет сохраненных пресетов</div>';
    return;
  }

  presetNames.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'preset';
    btn.textContent = name;
    btn.dataset.preset = name;
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyPreset(name);
    });

    presetsContainer.appendChild(btn);
  });
}

function applyPreset(name) {
  if (!customPresets[name]) return;
  
  const data = deepClone(customPresets[name]);
  for (const group in data) {
    if (state[group]) Object.assign(state[group], data[group]);
  }

  syncControlsFromState();
  requestRender();
}

btnSavePreset.addEventListener('click', () => {
  const name = inputPresetName.value.trim();
  if (!name) return alert('Введите название пресета');

  const newPreset = {
    canvas: deepClone(state.canvas),
    head:   deepClone(state.head),
    torso:  deepClone(state.torso),
    arms:   deepClone(state.arms),
    legs:   deepClone(state.legs)
  };

  customPresets[name] = newPreset;
  localStorage.setItem('figurePresets', JSON.stringify(customPresets));
  
  inputPresetName.value = '';
  renderPresets();
});

btnDeletePreset.addEventListener('click', () => {
  const activeBtn = document.querySelector('.preset.active');
  if (!activeBtn) return alert('Выберите пресет для удаления');
  
  const name = activeBtn.dataset.preset;
  
  if (confirm(`Удалить пресет "${name}"?`)) {
    delete customPresets[name];
    localStorage.setItem('figurePresets', JSON.stringify(customPresets));
    renderPresets();
  }
});

/* ---------- Привязка ползунков ---------- */
function bindControls() {
  document.querySelectorAll('input[type="range"][data-key]').forEach(input => {
    const key = input.dataset.key;
    const output = document.querySelector(`output[data-for="${key}"]`);

    const initial = getByPath(state, key);
    if (initial !== undefined) input.value = initial;
    if (output) output.textContent = input.value;

    input.addEventListener('input', () => {
      const value = Number(input.value);
      setByPath(state, key, value);
      if (output) output.textContent = value;
      requestRender();
    });
  });
}

function syncControlsFromState() {
  document.querySelectorAll('input[type="range"][data-key]').forEach(input => {
    const value = getByPath(state, input.dataset.key);
    if (value !== undefined) {
      input.value = value;
      const output = document.querySelector(`output[data-for="${input.dataset.key}"]`);
      if (output) output.textContent = value;
    }
  });
}

/* ---------- Рендер ---------- */
let rafId = null;

function requestRender() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    render();
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.underlay.image) {
    drawUnderlay(ctx);
  }

  drawMargins(ctx);
  drawModuleGrid(ctx);
}

/* ---------- Отрисовка отступов (Красные линии) ---------- */
function drawMargins(ctx) {
  const topPct = state.canvas.marginTop / 100;
  const bottomPct = state.canvas.marginBottom / 100;
  
  const topY = canvas.height * topPct;
  const bottomY = canvas.height * (1 - bottomPct);

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 60, 60, 0.8)';
  ctx.lineWidth = 8;
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(0, topY);
  ctx.lineTo(canvas.width, topY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, bottomY);
  ctx.lineTo(canvas.width, bottomY);
  ctx.stroke();
  ctx.restore();
}

/* ---------- Подложка ---------- */
function drawUnderlay(ctx) {
  const img = state.underlay.image;
  const s = state.underlay.scale / 100;
  const w = img.width * s;
  const h = img.height * s;
  const x = (canvas.width - w) / 2 + state.underlay.x;
  const y = (canvas.height - h) / 2 + state.underlay.y;

  ctx.save();
  ctx.globalAlpha = state.underlay.opacity / 100;
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

/* ---------- Сетка модулей ---------- */
function drawModuleGrid(ctx) {
  const X = state.canvas.X;
  const usableTop = canvas.height * (state.canvas.marginTop / 100);
  const usableBottom = canvas.height * (1 - state.canvas.marginBottom / 100);
  const usableHeight = usableBottom - usableTop;
  
  const moduleH = usableHeight / X;

  ctx.save();
  ctx.strokeStyle = 'rgba(91,141,239,0.4)';
  ctx.setLineDash([12, 12]);
  ctx.lineWidth = 3;

  const linesCount = Math.ceil(X);
  for (let i = 0; i <= linesCount; i++) {
    const y = usableTop + i * moduleH;
    if (y > usableBottom + 1) break; 
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Центральная вертикаль
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();

  // Подписи
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(91,141,239,0.9)';
  ctx.font = 'bold 36px sans-serif';
  for (let i = 0; i < X; i++) {
    const y = usableTop + i * moduleH;
    if (y + 45 > usableBottom) continue;
    ctx.fillText(`${i + 1}`, 20, y + 45);
  }
  ctx.restore();
}

/* ---------- Подложка: загрузка ---------- */
underlayFile.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    state.underlay.image = img;
    requestRender();
  };
  img.src = URL.createObjectURL(file);
});

/* ---------- Экспорт ---------- */
document.getElementById('btnExportPNG').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `figure-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
});

document.getElementById('btnExportSVG').addEventListener('click', () => {
  const dataUrl = canvas.toDataURL('image/png');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"><image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `figure-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
});

/* ---------- Сброс ---------- */
document.getElementById('btnReset').addEventListener('click', () => {
  const resetData = {
    canvas: { X: 5, marginTop: 0, marginBottom: 0 },
    head: { top: 0, bottom: 0, width: 0, radius: 0, chin: { height: 0, width: 0, rounding: 0 }, jaw: { attach: 0, length: 0, angle: 0, width: 0 }, neck: { width: 0 } },
    torso: { chest: { top: 0, bottom: 0, height: 0, width: 0 }, pelvis: { width: 0, height: 0, rounding: 0 } },
    arms: { shoulder: { radius: 0 }, elbow: { radius: 0, dx: 0, dy: 0 }, wrist: { radius: 0, dx: 0, dy: 0 } },
    legs: { knee: { radius: 0, dx: 0, dy: 0 }, ankle: { radius: 0, dx: 0 } }
  };

  for (const group in resetData) {
    if (state[group]) Object.assign(state[group], resetData[group]);
  }
  
  document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
  
  syncControlsFromState();
  requestRender();
});

/* ---------- Автомасштаб ---------- */
function fitCanvasToViewport() {
  const vw = viewport.clientWidth - 32;
  const vh = viewport.clientHeight - 32;
  const scale = Math.min(vw / canvas.width, vh / canvas.height);
  canvas.style.width  = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
}

window.addEventListener('resize', fitCanvasToViewport);
window.addEventListener('orientationchange', () => setTimeout(fitCanvasToViewport, 100));

/* ---------- Инициализация ---------- */
renderPresets();
bindControls();
requestRender();
setTimeout(fitCanvasToViewport, 50);
