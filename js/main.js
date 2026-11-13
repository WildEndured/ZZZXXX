(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CANVAS = 4096;
  const DPI = 300;
  const PPM = Math.round(DPI / 0.0254); // 300 dpi ≈ 11811 пикселей/метр

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);

  const figureG    = $('figure');
  const headGridG  = $('headGrid');
  const bgImage    = $('bgImage');

  const headsEl        = $('heads');
  const headsVal       = $('headsVal');
  const marginEl       = $('margin');
  const marginVal      = $('marginVal');
  const strokeColorEl  = $('strokeColor');
  const strokeWidthEl  = $('strokeWidth');
  const strokeWidthVal = $('strokeWidthVal');

  const bgFileEl     = $('bgFile');
  const bgOpacityEl  = $('bgOpacity');
  const bgOpacityVal = $('bgOpacityVal');
  const bgScaleEl    = $('bgScale');
  const bgScaleVal   = $('bgScaleVal');
  const bgRemoveEl   = $('bgRemove');

  const presetNameEl = $('presetName');
  const presetSaveEl = $('presetSave');
  const presetListEl = $('presetList');

  const exportSvgEl = $('exportSvg');
  const exportPngEl = $('exportPng');

  const STORAGE_KEY = 'figure-presets-v1';

  // ---------- Состояние ----------
  const state = {
    heads: 5,
    margin: 0,          // %
    strokeColor: '#222222',
    strokeWidth: 4,
    bg: {
      src: null,        // dataURL (не сохраняется в пресеты и не идёт в экспорт)
      opacity: 0.5,
      scale: 1.0
    }
  };

  // ---------- Layout / сетка ----------
  function computeLayout() {
    const marginPx = (CANVAS * state.margin) / 100;
    const topY = marginPx;
    const usableH = CANVAS - marginPx * 2;
    const headUnit = usableH / state.heads;
    return { cx: CANVAS / 2, topY, headUnit, totalHeight: usableH };
  }

  function renderHeadGrid(ctx) {
    headGridG.innerHTML = '';
    for (let i = 0; i <= state.heads; i++) {
      const y = ctx.topY + i * ctx.headUnit;
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', CANVAS);
      line.setAttribute('y2', y);
      headGridG.appendChild(line);
    }
  }

  // ---------- Фигура (пустая на Этапе-1) ----------
  function renderFigure(ctx) {
    figureG.innerHTML = '';

    // Модули на Этапе-1 — заглушки, возвращают []
    const parts = [
      window.FigureParts.legs(SVG_NS),
      window.FigureParts.torso(SVG_NS),
      window.FigureParts.arms(SVG_NS),
      window.FigureParts.head(SVG_NS)
    ];
    parts.forEach((part) => {
      part.build(ctx).forEach((el) => figureG.appendChild(el));
    });

    // Стиль контура применяем к группе (даже если она пуста)
    figureG.setAttribute('stroke', state.strokeColor);
    figureG.setAttribute('stroke-width', state.strokeWidth);
    figureG.setAttribute('fill', 'none');
  }

  // ---------- Подложка ----------
  function renderBg() {
    if (!state.bg.src) {
      bgImage.style.display = 'none';
      bgImage.removeAttribute('href');
      return;
    }
    bgImage.setAttribute('href', state.bg.src);
    bgImage.setAttribute('opacity', state.bg.opacity);

    const size = CANVAS * state.bg.scale;
    bgImage.setAttribute('x', (CANVAS - size) / 2);
    bgImage.setAttribute('y', (CANVAS - size) / 2);
    bgImage.setAttribute('width', size);
    bgImage.setAttribute('height', size);
    bgImage.style.display = 'inline';
  }

  // ---------- Полный рендер ----------
  function render() {
    const ctx = computeLayout();
    renderHeadGrid(ctx);
    renderFigure(ctx);
    renderBg();

    headsVal.textContent = state.heads;
    marginVal.textContent = state.margin;
    strokeWidthVal.textContent = state.strokeWidth;
    bgOpacityVal.textContent = Math.round(state.bg.opacity * 100);
    bgScaleVal.textContent = Math.round(state.bg.scale * 100);
  }

  // ---------- Общие настройки ----------
  headsEl.addEventListener('input', () => {
    state.heads = parseFloat(headsEl.value);
    render();
  });
  marginEl.addEventListener('input', () => {
    state.margin = parseFloat(marginEl.value);
    render();
  });
  strokeColorEl.addEventListener('input', () => {
    state.strokeColor = strokeColorEl.value;
    render();
  });
  strokeWidthEl.addEventListener('input', () => {
    state.strokeWidth = parseInt(strokeWidthEl.value, 10);
    render();
  });

  // ---------- Подложка ----------
  bgFileEl.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.bg.src = reader.result;
      render();
    };
    reader.readAsDataURL(file);
  });
  bgOpacityEl.addEventListener('input', () => {
    state.bg.opacity = parseInt(bgOpacityEl.value, 10) / 100;
    render();
  });
  bgScaleEl.addEventListener('input', () => {
    state.bg.scale = parseInt(bgScaleEl.value, 10) / 100;
    render();
  });
  bgRemoveEl.addEventListener('click', () => {
    state.bg.src = null;
    bgFileEl.value = '';
    render();
  });

  // ---------- Пресеты ----------
  function loadPresets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function savePresets(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function renderPresets() {
    const list = loadPresets();
    presetListEl.innerHTML = '';

    if (list.length === 0) {
      const li = document.createElement('li');
      li.className = 'preset-empty';
      li.textContent = 'Пресетов пока нет';
      li.style.border = 'none';
      li.style.background = 'transparent';
      presetListEl.appendChild(li);
      return;
    }

    list.forEach((preset, idx) => {
      const li = document.createElement('li');

      const name = document.createElement('span');
      name.className = 'preset-name';
      name.textContent = preset.name;
      name.title = preset.name;

      const applyBtn = document.createElement('button');
      applyBtn.textContent = 'Применить';
      applyBtn.addEventListener('click', () => applyPreset(preset));

      const delBtn = document.createElement('button');
      delBtn.className = 'del';
      delBtn.textContent = '×';
      delBtn.title = 'Удалить';
      delBtn.addEventListener('click', () => {
        const arr = loadPresets();
        arr.splice(idx, 1);
        savePresets(arr);
        renderPresets();
      });

      li.append(name, applyBtn, delBtn);
      presetListEl.appendChild(li);
    });
  }

  function applyPreset(preset) {
    const p = preset.data || {};
    if (typeof p.heads === 'number')       state.heads = p.heads;
    if (typeof p.margin === 'number')      state.margin = p.margin;
    if (typeof p.strokeColor === 'string') state.strokeColor = p.strokeColor;
    if (typeof p.strokeWidth === 'number') state.strokeWidth = p.strokeWidth;

    headsEl.value = state.heads;
    marginEl.value = state.margin;
    strokeColorEl.value = state.strokeColor;
    strokeWidthEl.value = state.strokeWidth;

    render();
  }

  presetSaveEl.addEventListener('click', () => {
    const name = (presetNameEl.value || '').trim();
    if (!name) { alert('Введите название пресета'); return; }
    const arr = loadPresets();
    arr.push({
      name,
      data: {
        heads: state.heads,
        margin: state.margin,
        strokeColor: state.strokeColor,
        strokeWidth: state.strokeWidth
      },
      createdAt: Date.now()
    });
    savePresets(arr);
    presetNameEl.value = '';
    renderPresets();
  });

  // ---------- Экспорт ----------
  function buildExportSvg({ whiteBg = false } = {}) {
    // Чистый SVG 4096x4096. Без сетки, без подложки.
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('width', CANVAS);
    svg.setAttribute('height', CANVAS);
    svg.setAttribute('viewBox', `0 0 ${CANVAS} ${CANVAS}`);

    if (whiteBg) {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', CANVAS);
      rect.setAttribute('height', CANVAS);
      rect.setAttribute('fill', '#ffffff');
      svg.appendChild(rect);
    }

    // Копия фигуры (на Этапе-1 — пустая группа со стилем контура)
    const fig = figureG.cloneNode(true);
    svg.appendChild(fig);

    return svg;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // Вставка pHYs-чанка в PNG (units=1 → метры, 300 dpi ≈ 11811 px/m)
  async function setPngDpi(blob, ppm) {
    const buf = new Uint8Array(await blob.arrayBuffer());

    // Ищем IHDR (всегда первым чанком после сигнатуры) и вставляем pHYs после него.
    // Сигнатура: 8 байт. Далее чанки: len(4) type(4) data(len) crc(4).
    const SIG_LEN = 8;

    // Читаем длину и тип первого чанка (IHDR)
    const view = new DataView(buf.buffer);
    const ihdrLen = view.getUint32(SIG_LEN);
    const ihdrTotal = 4 + 4 + ihdrLen + 4; // len + type + data + crc
    const insertAt = SIG_LEN + ihdrTotal;

    // Собираем pHYs: len=9, type='pHYs', data=X(4)+Y(4)+unit(1), crc(4)
    const phys = new Uint8Array(4 + 4 + 9 + 4);
    const dv = new DataView(phys.buffer);
    dv.setUint32(0, 9);                     // length
    phys.set([0x70, 0x48, 0x59, 0x73], 4);  // 'pHYs'
    dv.setUint32(8, ppm);                   // X pixels per unit
    dv.setUint32(12, ppm);                  // Y pixels per unit
    phys[16] = 1;                           // unit: 1 = meter
    // CRC32 над type+data
    const crc = crc32(phys.subarray(4, 4 + 4 + 9));
    dv.setUint32(17, crc);

    // Склейка
    const out = new Uint8Array(buf.length + phys.length);
    out.set(buf.subarray(0, insertAt), 0);
    out.set(phys, insertAt);
    out.set(buf.subarray(insertAt), insertAt + phys.length);
    return new Blob([out], { type: 'image/png' });
  }

  // CRC32 (стандартный полином PNG)
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  exportSvgEl.addEventListener('click', () => {
    const svg = buildExportSvg({ whiteBg: false });
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob(
      ['<?xml version="1.0" encoding="UTF-8"?>\n', xml],
      { type: 'image/svg+xml;charset=utf-8' }
    );
    downloadBlob(blob, 'figure.svg');
  });

  exportPngEl.addEventListener('click', () => {
    const svg = buildExportSvg({ whiteBg: true });
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
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
      URL.revokeObjectURL(url);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const withDpi = await setPngDpi(blob, PPM);
          downloadBlob(withDpi, 'figure-4096-300dpi.png');
        } catch {
          downloadBlob(blob, 'figure-4096.png');
        }
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert('Не удалось экспортировать PNG');
    };
    img.src = url;
  });

  // ---------- Старт ----------
  renderPresets();
  render();
})();
