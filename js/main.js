import { renderHead, headState } from './head.js';
import { renderTorso } from './torso.js';
import { renderArms }  from './arm.js';
import { renderLegs }  from './leg.js';

const CANVAS_SIZE = 4096;

const state = {
    growth:  5,
    padding: 0,
    bg: { src: null, image: null, opacity: 1, scale: 1, fitMode: 'height' },
    figure: {}
};

const svg       = document.getElementById('canvas');
const layerBg   = document.getElementById('layerBg');
const layerGrid = document.getElementById('layerGrid');

const growthIn   = document.getElementById('growth');
const growthOut  = document.getElementById('growthOut');
const paddingIn  = document.getElementById('padding');
const paddingOut = document.getElementById('paddingOut');

const bgFile     = document.getElementById('bgFile');
const bgOpacity  = document.getElementById('bgOpacity');
const bgOpacityO = document.getElementById('bgOpacityOut');
const bgScale    = document.getElementById('bgScale');
const bgScaleO   = document.getElementById('bgScaleOut');
const bgRemove   = document.getElementById('bgRemove');

const presetName = document.getElementById('presetName');
const presetSave = document.getElementById('presetSave');
const presetList = document.getElementById('presetList');

const exportSvgBtn = document.getElementById('exportSvg');
const exportPngBtn = document.getElementById('exportPng');

function computeLayout() {
    const padPx  = (state.padding / 100) * CANVAS_SIZE;
    const top    = padPx;
    const bottom = CANVAS_SIZE - padPx;
    const height = bottom - top;
    const headH  = height / state.growth;

    const headLines = [];
    for (let i = 0; i <= state.growth; i++) {
        headLines.push(top + i * headH);
    }

    return { top, bottom, height, headH, growth: state.growth, headLines, canvasSize: CANVAS_SIZE };
}

function renderAll() {
    const L = computeLayout();
    renderHead (document.getElementById('figureHead'),  L, state);
    renderTorso(document.getElementById('figureTorso'), L, state);
    renderArms (document.getElementById('figureArms'),  L, state);
    renderLegs (document.getElementById('figureLegs'),  L, state);
    renderGuides(L);
    renderBackground();
}

function renderGuides(L) {
    layerGrid.innerHTML = '';
    const NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i <= state.growth; i++) {
        const y = L.headLines[i];
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', y);
        line.setAttribute('x2', CANVAS_SIZE);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', (i === 0 || i === state.growth) ? '#4c8dff' : '#c8c8c8');
        line.setAttribute('stroke-width', (i === 0 || i === state.growth) ? 6 : 3);
        line.setAttribute('stroke-dasharray', (i === 0 || i === state.growth) ? '' : '16 16');
        line.setAttribute('data-guide', 'true');
        layerGrid.appendChild(line);
    }
}

function renderBackground() {
    layerBg.innerHTML = '';
    if (!state.bg.image) return;

    const NS = 'http://www.w3.org/2000/svg';
    const img = state.bg.image;
    const fit = state.bg.fitMode === 'height' ? CANVAS_SIZE / img.height : CANVAS_SIZE / img.width;
    const k = fit * state.bg.scale;
    const w = img.width * k;
    const h = img.height * k;
    const x = (CANVAS_SIZE - w) / 2;
    const y = (CANVAS_SIZE - h) / 2;

    const node = document.createElementNS(NS, 'image');
    node.setAttribute('href', state.bg.src);
    node.setAttribute('x', x);
    node.setAttribute('y', y);
    node.setAttribute('width', w);
    node.setAttribute('height', h);
    node.setAttribute('opacity', state.bg.opacity);
    node.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    node.setAttribute('data-bg', 'true');
    layerBg.appendChild(node);
}

function setBackgroundEnabled(enabled) {
    bgOpacity.disabled = !enabled;
    bgScale.disabled = !enabled;
    bgRemove.disabled = !enabled;
}

bgFile.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            state.bg.src = reader.result;
            state.bg.image = img;
            setBackgroundEnabled(true);
            renderBackground();
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});

bgOpacity.addEventListener('input', () => {
    state.bg.opacity = parseFloat(bgOpacity.value);
    bgOpacityO.value = state.bg.opacity.toFixed(2);
    renderBackground();
});

bgScale.addEventListener('input', () => {
    state.bg.scale = parseFloat(bgScale.value);
    bgScaleO.value = state.bg.scale.toFixed(2);
    renderBackground();
});

bgRemove.addEventListener('click', () => {
    state.bg.src = null;
    state.bg.image = null;
    bgFile.value = '';
    bgOpacity.value = 1;
    bgScale.value = 1;
    bgOpacityO.value = '1.00';
    bgScaleO.value = '1.00';
    setBackgroundEnabled(false);
    renderBackground();
});

growthIn.addEventListener('input', () => {
    state.growth = parseFloat(growthIn.value);
    growthOut.value = state.growth.toFixed(1);
    renderAll();
});

paddingIn.addEventListener('input', () => {
    state.padding = parseFloat(paddingIn.value);
    paddingOut.value = state.padding.toFixed(1);
    renderAll();
});

const PRESET_KEY = 'anacords.presets.v1';

function loadPresets() {
    try { return JSON.parse(localStorage.getItem(PRESET_KEY)) || []; }
    catch { return []; }
}

function savePresets(list) {
    localStorage.setItem(PRESET_KEY, JSON.stringify(list));
}

function renderPresetList() {
    const list = loadPresets();
    presetList.innerHTML = '';
    if (list.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Нет пресетов';
        li.style.opacity = '0.6';
        li.style.cursor = 'default';
        presetList.appendChild(li);
        return;
    }
    list.forEach((preset, index) => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.className = 'preset-name';
        name.textContent = preset.name;
        name.addEventListener('click', () => applyPreset(preset));
        const del = document.createElement('button');
        del.textContent = '✕';
        del.addEventListener('click', () => {
            const arr = loadPresets();
            arr.splice(index, 1);
            savePresets(arr);
            renderPresetList();
        });
        li.append(name, del);
        presetList.appendChild(li);
    });
}

function applyPreset(preset) {
    state.growth = preset.growth;
    state.padding = preset.padding;
    growthIn.value = preset.growth;
    growthOut.value = preset.growth.toFixed(1);
    paddingIn.value = preset.padding;
    paddingOut.value = preset.padding.toFixed(1);

    if (preset.figure) {
        Object.assign(state.figure, preset.figure);
        if (preset.figure.head) {
            Object.assign(headState, preset.figure.head);
            document.dispatchEvent(new CustomEvent('head:applyState'));
        }
    }
    renderAll();
}

presetSave.addEventListener('click', () => {
    const name = presetName.value.trim();
    if (!name) { presetName.focus(); return; }
    const list = loadPresets();
    list.push({
        name,
        growth: state.growth,
        padding: state.padding,
        figure: { head: { ...headState } }
    });
    savePresets(list);
    presetName.value = '';
    renderPresetList();
});

function makeExportSvg() {
    const clone = svg.cloneNode(true);
    const grid = clone.querySelector('#layerGrid');
    if (grid) grid.remove();
    const bg = clone.querySelector('#layerBg');
    if (bg) bg.remove();
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', CANVAS_SIZE);
    clone.setAttribute('height', CANVAS_SIZE);
    return new XMLSerializer().serializeToString(clone);
}

exportSvgBtn.addEventListener('click', () => {
    const xml = makeExportSvg();
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'figure.svg');
});

exportPngBtn.addEventListener('click', async () => {
    const xml = makeExportSvg();
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
        const img = await loadImage(url);
        const c = document.createElement('canvas');
        c.width = CANVAS_SIZE;
        c.height = CANVAS_SIZE;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const pngBlob = await new Promise(res => c.toBlob(res, 'image/png'));
        downloadBlob(pngBlob, 'figure.png');
    } finally {
        URL.revokeObjectURL(url);
    }
});

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
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

setBackgroundEnabled(false);
renderPresetList();
renderAll();

document.addEventListener('head:changed', renderAll);
