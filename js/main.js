/* =========================================================
   main.js — состояние, ползунки, пресеты, экспорт
   Отрисовка фигур будет подключаться в следующих шагах.
   ========================================================= */

/* ---------- Состояние ---------- */
export const state = {
  canvas: {
    X: 8,
    marginTop: 200,
    marginBottom: 200,
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
    image: null,      // HTMLImageElement
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

/* ---------- DOM ---------- */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const viewport = document.getElementById('viewport');
const presetsEl = document.getElementById('presets');
const underlayFile = document.getElementById('underlayFile');

/* ---------- Привязка ползунков ---------- */
function bindControls() {
  document.querySelectorAll('input[type="range"][data-key]').forEach(input => {
    const key = input.dataset.key;
    const output = document.querySelector(`output[data-for="${key}"]`);

    // начальное значение из state
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
  // Очистка холста (белый фон)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Подложка (если есть)
  if (state.underlay.image) {
    drawUnderlay(ctx);
  }

  // Вспомогательная сетка модулей
  drawModuleGrid(ctx);

  // ⬇⬇⬇ Здесь будут вызываться в будущем:
  // drawHead(ctx, state)
  // drawTorso(ctx, state)
  // drawArms(ctx, state)
  // drawLegs(ctx, state)
}

/* ---------- Подложка ---------- */
function drawUnderlay(ctx) {
  const img = state.underlay.image;
  const s = state.underlay.scale / 100;
  const w = img.width * s;
  const h = img.height * s;
  
  // Центрируем подложку и добавляем смещение ползунками
  const x = (canvas.width - w) / 2 + state.underlay.x;
  const y = (canvas.height - h) / 2 + state.underlay.y;

  ctx.save();
  ctx.globalAlpha = state.underlay.opacity / 100;
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

/* ---------- Вспомогательная сетка (временно) ---------- */
function drawModuleGrid(ctx) {
  const X = state.canvas.X;
  const top = state.canvas.marginTop;
  const bottom = state.canvas.marginBottom;
  const usable = canvas.height - top - bottom;
  const moduleH = usable / X;

  ctx.save();
  ctx.strokeStyle = 'rgba(91,141,239,0.35)';
  ctx.setLineDash([12, 12]);
  ctx.lineWidth = 3;

  // Горизонтальные линии модулей
  for (let i = 0; i <= X; i++) {
    const y = top + i * moduleH;
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

  // Подписи модулей
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(91,141,239,0.9)';
  ctx.font = 'bold 36px sans-serif';
  for (let i = 0; i < X; i++) {
    const y = top + i * moduleH;
    ctx.fillText(`1/${X}`, 20, y + 45);
  }
  ctx.restore();
}

/* ---------- Пресеты ---------- */
function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

const PRESETS = {
  default: () => deepClone({
    canvas: { X: 8, marginTop: 200, marginBottom: 200 },
    head: {
      top: 0, bottom: 0, width: 0, radius: 0,
      chin: { height: 0, width: 0, rounding: 0 },
      jaw:  { attach: 0, length: 0, angle: 0, width: 0 },
      neck: { width: 0 },
    },
    torso: {
      chest:  { top: 0, bottom: 0, height: 0, width: 0 },
      pelvis: { width: 0, height: 0, rounding: 0 },
    },
    arms: {
      shoulder: { radius: 0 },
      elbow: { radius: 0, dx: 0, dy: 0 },
      wrist: { radius: 0, dx: 0, dy: 0 },
    },
    legs: {
      knee:  { radius: 0, dx: 0, dy: 0 },
      ankle: { radius: 0, dx: 0 },
    },
  }),
  heroic: () => {
    const p = PRESETS.default();
    p.canvas.X = 9;
    p.head.width = 20;
    p.torso.chest.top = 30;
    p.torso.chest.bottom = 20;
    p.arms.shoulder.radius = 30;
    return p;
  },
  realistic: () => {
    const p = PRESETS.default();
    p.canvas.X = 8;
    return p;
  },
  chibi: () => {
    const p = PRESETS.default();
    p.canvas.X = 4;
    p.head.radius = 60;
    p.head.width = 40;
    return p;
  },
};

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  const data = preset();

  // Слияние с сохранением подложки
  for (const group in data) {
    Object.assign(state[group], data[group]);
  }

  syncControlsFromState();
  requestRender();
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

presetsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.preset');
  if (!btn) return;
  applyPreset(btn.dataset.preset);
});

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
  // Временная заглушка: PNG, упакованный в SVG.
  const dataUrl = canvas.toDataURL('image/png');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">` +
    `<image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>` +
    `</svg>`;
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
  applyPreset('default');
});

/* ---------- Автомасштаб холста под экран ---------- */
function fitCanvasToViewport() {
  // Получаем доступную ширину и высоту (минус отступы)
  const vw = viewport.clientWidth - 32;
  const vh = viewport.clientHeight - 32;
  
  // Считаем масштаб, чтобы холст полностью влез
  const scale = Math.min(vw / canvas.width, vh / canvas.height);
  
  // Применяем размеры через CSS
  canvas.style.width  = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
}

// Следим за изменением размера окна
window.addEventListener('resize', fitCanvasToViewport);

// Также следим за поворотом экрана на мобильных
window.addEventListener('orientationchange', () => {
  setTimeout(fitCanvasToViewport, 100);
});

/* ---------- Инициализация ---------- */
bindControls();
requestRender();

// Вызываем после небольшого таймаута, чтобы DOM точно прогрузился
setTimeout(fitCanvasToViewport, 50);
