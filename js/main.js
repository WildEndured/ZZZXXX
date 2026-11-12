import { drawHead, headAnchors } from './head.js';
import { drawTorso, torsoAnchors } from './torso.js';
// import { drawArms } from './arm.js';
// import { drawLegs } from './leg.js';
import { CanvasRenderer, SVGRenderer } from './renderer.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const PRESETS = {
  default:   {},
  heroic:    { canvas:{X:8}, torso:{chest:{width:15}}, head:{radius:-5} },
  stylized7: { canvas:{X:7} },
  chibi:     { canvas:{X:3}, head:{radius:25, chin:{height:30}} },
};

const state = {
  color: '#d32f2f',
  canvas: { X: 5, marginTopPct: 3, marginBottomPct: 3 },
  head: {
    top: 0, bottom: 0, width: 0, radius: 0,
    chin: { height: 50, width: 50, rounding: 0.5 },
    jaw:  { attach: 40, length: 50, angle: 0, width: 50 },
    neck: { width: 0 }
  },
  torso: {
    chest:  { top: 0, bottom: 0, height: 0, width: 0 },
    pelvis: { width: 0, height: 0, rounding: 0.3 }
  },
  underlay: { img: null, opacity: 0.4, scale: 1, x: 0, y: 0, flip: false }
};

// ---------- привязка UI ----------
function getDeep(obj, path){ return path.split('.').reduce((o,k)=>o[k], obj); }
function setDeep(obj, path, v){
  const keys = path.split('.'); const last = keys.pop();
  const t = keys.reduce((o,k)=>o[k], obj); t[last] = v;
}
function syncInputs(){
  document.querySelectorAll('[data-key]').forEach(el=>{
    const v = getDeep(state, el.dataset.key);
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v;
    if (el.nextElementSibling?.tagName === 'OUTPUT') el.nextElementSibling.value = v;
  });
}
function bindInputs(){
  document.querySelectorAll('[data-key]').forEach(el=>{
    const ev = el.type === 'range' || el.type === 'color' ? 'input' : 'change';
    el.addEventListener(ev, ()=>{
      const k = el.dataset.key;
      let v = el.type === 'checkbox' ? el.checked
            : el.type === 'range' || el.type === 'color' ? el.value
            : el.value;
      if (el.type === 'range') v = +v;
      setDeep(state, k, v);
      if (el.nextElementSibling?.tagName === 'OUTPUT') el.nextElementSibling.value = v;
      render();
    });
  });
}
function applyPreset(name){
  const p = PRESETS[name];
  if (p && Object.keys(p).length) deepMerge(state, p);
  if (name === 'default') location.reload(); // простой сброс
  syncInputs(); render();
}
function deepMerge(a, b){
  for (const k in b){
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) deepMerge(a[k] ??= {}, b[k]);
    else a[k] = b[k];
  }
}

// ---------- геометрия ----------
function layout(){
  const X = state.canvas.X;
  const mTop = H * state.canvas.marginTopPct / 100;
  const mBot = H * state.canvas.marginBottomPct / 100;
  const usable = H - mTop - mBot;
  return { X, mTop, mBot, usable, moduleH: usable / X, cx: W / 2 };
}

// ---------- рендер ----------
function render(){
  ctx.clearRect(0, 0, W, H);

  // подложка
  if (state.underlay.img){
    const u = state.underlay, img = u.img;
    ctx.save();
    ctx.globalAlpha = u.opacity;
    const s = u.scale;
    ctx.translate(W/2 + u.x, H/2 + u.y);
    if (u.flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -img.width*s/2, -img.height*s/2, img.width*s, img.height*s);
    ctx.restore();
  }

  const L = layout();
  const r = new CanvasRenderer(ctx, state.color, 6);

  // направляющие модулей (тонкие, чтобы видеть сетку)
  r._ctx.save();
  r._ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  r._ctx.lineWidth = 2;
  for (let i = 0; i <= Math.ceil(L.X); i++){
    const y = L.mTop + i * L.moduleH;
    r._ctx.beginPath(); r._ctx.moveTo(0, y); r._ctx.lineTo(W, y); r._ctx.stroke();
  }
  r._ctx.restore();

  const headA = drawHead(r, L, state.head);
  drawTorso(r, L, state.torso, headA);
  // const torsoA = torsoAnchors(L, state.torso, headA);
  // drawArms(r, L, state.arms, torsoA);
  // drawLegs(r, L, state.legs, torsoA);
}

// ---------- экспорт ----------
function exportPNG(){
  canvas.toBlob(blob => {
    const buf = new Uint8Array(blob.size + 21);
    // (упрощённо) — без pHYs; для точных 300 dpi нужен доп. чанк.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'figure.png'; a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function exportSVG(){
  const svg = SVGRenderer.create(W, H);
  const L = layout();
  const r = new SVGRenderer.Renderer(svg, state.color, 6);

  const headA = drawHead(r, L, state.head);
  drawTorso(r, L, state.torso, headA);

  const blob = new Blob([SVGRenderer.serialize(svg)], {type:'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'figure.svg'; a.click();
  URL.revokeObjectURL(url);
}

// ---------- init ----------
document.getElementById('preset').addEventListener('change', e => applyPreset(e.target.value));
document.getElementById('exportPng').addEventListener('click', exportPNG);
document.getElementById('exportSvg').addEventListener('click', exportSVG);
document.getElementById('reset').addEventListener('click', ()=>location.reload());

document.getElementById('underlayFile').addEventListener('change', e=>{
  const f = e.target.files[0]; if (!f) return;
  const img = new Image();
  img.onload = ()=>{ state.underlay.img = img; render(); };
  img.src = URL.createObjectURL(f);
});

bindInputs(); syncInputs(); render();
window.__state = state;
