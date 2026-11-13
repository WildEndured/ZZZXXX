(function () {
  'use strict';

  // ============================================================
  //  Константы
  // ============================================================
  const CANVAS = 4096;
  const DPI = 300;
  const STORAGE_KEY = 'figure-presets-v1';

  // ============================================================
  //  Состояние приложения
  // ============================================================
  const state = {
    // Общие настройки
    heads: 5,          // рост в головах (шаг 0.5)
    margin: 0,         // отступ сверху/снизу, %

    // Подложка
    underlay: {
      src: null,       // dataURL
      opacity: 0.5,
      scale: 1.0,
      naturalWidth: 0,
      naturalHeight: 0,
    },
  };

  // ============================================================
  //  DOM
  // ============================================================
  const $ = (id) => document.getElementById(id);

  const dom = {
    svg: $('svg'),
    gridRect: $('gridRect'),
    headsLayer: $('headsLayer'),
    underlayImage: $('underlayImage'),
    underlayLayer: $('underlayLayer'),

    headsRange: $('headsRange'),
    headsVal: $('headsVal'),
    marginRange: $('marginRange'),
    marginVal: $('marginVal'),

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

  // ============================================================
  //  Геометрия холста
  //  Возвращает объект с расчётными параметрами,
  //  который передаётся в модули Head/Torso/Arm/Leg.
  // ============================================================
  function computeGeometry() {
    const marginPx = Math.round((state.margin / 100) * CANVAS);
    const usableTop = marginPx;
    const usableBottom = CANVAS - marginPx;
    const usableHeight = usableBottom - usableTop;

    const headHeight = usableHeight / state.heads;

    return {
      canvas: CANVAS,
      dpi: DPI,
      marginPx,
      usableTop,
      usableBottom,
      usableHeight,
      headHeight,
      heads: state.heads,

      centerX: CANVAS / 2,

      // Производные (для модулей фигуры):
      topY: usableTop,
      torsoHeight: headHeight * 1.8,
      torsoWidth: headHeight * 1.4,
      shoulderY: usableTop + headHeight,
      hipY: usableTop + headHeight + headHeight * 1.8,
      armLength: headHeight * 2.2,
      armWidth: headHeight * 0.35,
      legLength: headHeight * 2.5,
      legWidth: headHeight * 0.45,
      legOffsetX: headHeight * 0.4,
    };
  }

  // ============================================================
  //  Отрисовка сетки-деления на головы
  // ============================================================
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

  // ============================================================
  //  Передача геометрии в модули фигуры
  // ============================================================
  function syncFigureModules(geo) {
    if (window.Head) window.Head.update(geo);
    if (window.Torso) window.Torso.update(geo);
    if (window.Arm) window.Arm.update(geo);
    if (window.Leg) window.Leg.update(geo);
  }

  // ============================================================
  //  Применение состояния к холсту
  // ============================================================
  function applyState() {
    const geo = computeGeometry();

    // Сетка голов
    renderHeadsGrid(geo);

    // Синхронизация модулей фигуры
    syncFigureModules(geo);

    // Подложка
    renderUnderlay(geo);

    // Индикаторы
    dom.headsVal.textContent = state.heads;
    dom.marginVal.textContent = state.margin;
  }

  // ============================================================
  //  Подложка
  // ============================================================
  function renderUnderlay(geo) {
    const u = state.underlay;

    if (!u.src) {
      dom.underlayImage.style.display = 'none';
      dom.removeUnderlay.disabled = true;
      return;
    }

    dom.underlayImage.style.display = 'block';
    dom.underlayImage.setAttribute('href', u.src);
    dom.underlayImage.setAttribute('opacity', String(u.opacity));

    // Масштаб подложки: подгонка под высоту или ширину холста
    // с учётом пользовательского масштаба.
    const box = CANVAS;
    const iw = u.naturalWidth || box;
    const ih = u.naturalHeight || box;

    // Базовый коэффициент — вписываем в квадрат холста (contain)
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

  // ============================================================
  //  Обработчики: общие
  // ============================================================
  dom.headsRange.addEventListener('input', (e) => {
    state.heads = parseFloat(e.target.value);
    applyState();
  });

  dom.marginRange.addEventListener('input', (e) => {
    state.margin = parseInt(e.target.value, 10);
    applyState();
  });

  // ============================================================
  //  Обработчики: подложка
  // ============================================================
  dom.underlayFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;

      // Узнаём натуральные размеры изображения
      const img = new Image();
      img.onload = () => {
        state.underlay.src = dataUrl;
        state.underlay.naturalWidth = img.naturalWidth;
        state.underlay.naturalHeight = img.naturalHeight;
        // Сбрасываем масштаб к 100% при загрузке новой подложки
        state.underlay.scale = 1.0;
        dom.scaleRange.value = 100;
        dom.scaleVal.textContent = 100;
        applyState();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Сбрасываем input, чтобы можно было загрузить тот же файл повторно
    e.target.value = '';
  });

  dom.opacityRange.addEventListener('input', (e) => {
    state.underlay.opacity = parseInt(e.target.value, 10) / 100;
    dom.opacityVal.textContent = e.target.value;
    applyState();
  });

  dom.scaleRange.addEventListener('input', (e) => {
    state.underlay.scale = parseInt(e.target.value, 10) / 100;
    dom.scaleVal.textContent = e.target.value;
    applyState();
  });

  dom.removeUnderlay.addEventListener('click', () => {
    state.underlay.src = null;
    state.underlay.naturalWidth = 0;
    state.underlay.naturalHeight = 0;
    state.underlay.scale = 1.0;
    state.underlay.opacity = 0.5;

    dom.opacityRange.value = 50;
    dom.opacityVal.textContent = 50;
    dom.scaleRange.value = 100;
    dom.scaleVal.textContent = 100;

    applyState();
  });

  // ============================================================
  //  Пресеты
  // ============================================================
  function loadPresets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return obj && typeof obj === 'object' ? obj : {};
    } catch (_) {
      return {};
    }
  }

  function savePresets(presets) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (err) {
      console.error('Не удалось сохранить пресеты:', err);
    }
  }

  function snapshotState() {
    return {
      heads: state.heads,
      margin: state.margin,
      // Подложка намеренно не сохраняется
    };
  }

  function applySnapshot(snap) {
    if (!snap) return;
    if (typeof snap.heads === 'number') {
      state.heads = snap.heads;
      dom.headsRange.value = snap.heads;
    }
    if (typeof snap.margin === 'number') {
      state.margin = snap.margin;
      dom.marginRange.value = snap.margin;
    }
    applyState();
  }

  function renderPresets() {
    const presets = loadPresets();
    const names = Object.keys(presets);

    dom.presetList.innerHTML = '';

    if (names.length === 0) {
      const li = document.createElement('li');
      li.className = 'preset-empty';
      li.textContent = 'Пресетов нет';
      dom.presetList.appendChild(li);
      return;
    }

    // Сортируем по имени
    names.sort((a, b) => a.localeCompare(b, 'ru'));

    for (const name of names) {
      const li = document.createElement('li');

      const span = document.createElement('span');
      span.className = 'preset-name';
      span.textContent = name;
      span.title = name;

      const applyBtn = document.createElement('button');
      applyBtn.className = 'preset-btn';
      applyBtn.textContent = 'Применить';
      applyBtn.addEventListener('click', () => {
        applySnapshot(presets[name]);
      });

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

  dom.savePreset.addEventListener('click', () => {
    const name = (dom.presetName.value || '').trim();
    if (!name) {
      alert('Введите название пресета');
      return;
    }

    const all = loadPresets();
    all[name] = snapshotState();
    savePresets(all);
    dom.presetName.value = '';
    renderPresets();
  });

  // ============================================================
  //  Экспорт
  // ============================================================

  // Клонирует SVG и убирает всё, что не должно попадать в экспорт.
  function buildExportSvg() {
    const clone = dom.svg.cloneNode(true);

    // Удаляем служебные слои
    clone.querySelectorAll('.no-export').forEach((el) => el.remove());

    // Убираем gridRect на случай, если он не в .no-export
    const g = clone.querySelector('#gridRect');
    if (g) g.remove();

    // Убираем слои голов
    const h = clone.querySelector('#headsLayer');
    if (h) h.remove();

    // Фиксируем размеры холста
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(CANVAS));
    clone.setAttribute('height', String(CANVAS));
    clone.setAttribute('viewBox', `0 0 ${CANVAS} ${CANVAS}`);

    return clone;
  }

  function serializeSvg(svgEl) {
    const xml = new XMLSerializer().serializeToString(svgEl);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
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

  dom.exportSvg.addEventListener('click', () => {
    const clone = buildExportSvg();
    const xml = serializeSvg(clone);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'figure.svg');
  });

  dom.exportPng.addEventListener('click', () => {
    const clone = buildExportSvg();
    const xml = serializeSvg(clone);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS;
      canvas.height = CANVAS;
      const ctx = canvas.getContext('2d');

      // Белый фон
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS, CANVAS);

      // Фигура
      ctx.drawImage(img, 0, 0, CANVAS, CANVAS);

      URL.revokeObjectURL(svgUrl);

      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, 'figure.png');
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      alert('Не удалось экспортировать PNG');
    };
    img.src = svgUrl;
  });

  // ============================================================
  //  Инициализация
  // ============================================================
  function init() {
    // Устанавливаем начальные значения контролов из state
    dom.headsRange.value = state.heads;
    dom.marginRange.value = state.margin;
    dom.opacityRange.value = Math.round(state.underlay.opacity * 100);
    dom.opacityVal.textContent = Math.round(state.underlay.opacity * 100);
    dom.scaleRange.value = Math.round(state.underlay.scale * 100);
    dom.scaleVal.textContent = Math.round(state.underlay.scale * 100);

    renderPresets();
    applyState();
  }

  init();
})();
