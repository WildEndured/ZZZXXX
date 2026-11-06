const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const S = 4096;
const PAD = S * 0.05;          // 5% сверху и снизу
const TOP = PAD;
const BOT = S - PAD;
const HEIGHT = BOT - TOP;      // общая высота рабочей области
const CX = S / 2;

const els = {
  X: document.getElementById('X'),
  chH: document.getElementById('chH'),
  chW: document.getElementById('chW'),
  chinType: document.getElementById('chinType'),
  chinW: document.getElementById('chinW'),
  chinH: document.getElementById('chinH'),
  jawH: document.getElementById('jawH'),
  jawA: document.getElementById('jawA'),
  jawW: document.getElementById('jawW'),
};
const outs = {
  X: document.getElementById('vX'),
  chH: document.getElementById('vCh'),
  chW: document.getElementById('vCw'),
  chinW: document.getElementById('vChW'),
  chinH: document.getElementById('vChH'),
  jawH: document.getElementById('vJh'),
  jawA: document.getElementById('vJa'),
  jawW: document.getElementById('vJw'),
};

// Кривая Безье — упрощённая "прямая"
function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Плавная кривая через 3 точки (квадратичная)
function curve(x1, y1, cx, cy, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
}

function drawGrid(X) {
  const step = HEIGHT / X;
  ctx.strokeStyle = 'rgba(120,120,140,0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= X; i++) {
    const y = TOP + step * i;
    line(PAD, y, S - PAD, y);
  }
  // Отметка 1/5, 2/5, 3/5, 4/5 внутри первой головы — только для справки
  ctx.strokeStyle = 'rgba(255,150,80,0.25)';
  for (let k = 1; k <= 4; k++) {
    const y = TOP + step * k / 5;
    line(PAD, y, S - PAD, y);
  }
}

function drawHead(X) {
  const H = HEIGHT / X;                // высота одной головы (рост в головах)
  const topOfHead = TOP;               // вершина головы
  const unit = H / 5;                  // 1/5 головы = "шаг" делений

  const chH = parseFloat(els.chH.value);
  const chW = parseFloat(els.chW.value);
  const chinW = parseFloat(els.chinW.value);
  const chinH = parseFloat(els.chinH.value);
  const jawH = parseFloat(els.jawH.value);
  const jawA = parseFloat(els.jawA.value) * Math.PI / 180;
  const jawW = parseFloat(els.jawW.value);
  const chinType = els.chinType.value;

  // 1/5 — вершина круга (верх черепа)
  const circleTopY = topOfHead + unit * 1;
  // 3/5 — низ круга (круг касается линии 3/5)
  const circleBotY = topOfHead + unit * 3;
  // 4/5 — линия подбородка
  const chinLineY = topOfHead + unit * 4;

  // ----- Параметры круга -----
  // По умолчанию: вершина на 1/5, низ на 3/5 → диаметр = 2*unit, радиус = unit
  const baseRadius = unit;             // = (3/5 - 1/5) * H / 2 = unit
  const baseCy = (circleTopY + circleBotY) / 2;

  // Высота/ширина через ползунки. Т.к. круг должен оставаться "круглым",
  // а ползунки отдельные — рисуем эллипс.
  const ry = baseRadius * chH;
  const rx = baseRadius * chW;
  const cy = circleTopY + ry;          // вершина всегда на 1/5
  const cx = CX;

  // ----- Подбородок -----
  // Ширина подбородка: относительно радиуса
  const chinHalf = rx * 0.18 * chinW;   // 0.18 — базовая доля ширины круга
  const chinY = chinLineY + (chinH - 1) * unit * 0.5; // смещение по высоте

  // ----- Крепление челюсти -----
  // jawH: 0 — на уровне центра круга, 1 — на уровне низа круга
  const jawAttachY = cy + ry * (jawH * 2 - 1) * 0.9;
  // Широчайшая точка круга на этом уровне:
  // x = cx ± rx * sqrt(1 - ((y - cy)/ry)^2)
  const ny = (jawAttachY - cy) / ry;
  const clamp = Math.max(-0.999, Math.min(0.999, ny));
  const halfW = rx * Math.sqrt(1 - clamp * clamp) * jawW;

  const attachLeft  = { x: cx - halfW, y: jawAttachY };
  const attachRight = { x: cx + halfW, y: jawAttachY };

  // Первая линия челюсти — вертикально вниз от широчайшей точки
  const jawDropLen = unit * 0.9;        // длина вертикального сегмента
  const left1  = { x: attachLeft.x,  y: attachLeft.y  + jawDropLen };
  const right1 = { x: attachRight.x, y: attachRight.y + jawDropLen };

  // Вторая линия: от конца первой к подбородку под углом.
  // Угол jawA — наклон относительно вертикали. Влияет на длину/направление.
  // Ограничим так, чтобы линия пришла в район подбородка.
  const chinPts = chinType === 'point'
    ? [{ x: cx, y: chinY }]
    : [{ x: cx - chinHalf, y: chinY }, { x: cx + chinHalf, y: chinY }];

  // Строим левую и правую вторые линии: цель — ближайшая точка подбородка
  function secondLine(from, target) {
    // Направление задаётся углом jawA относительно вертикальной линии вниз
    // (то есть вторая линия образует угол с первой, но нам важнее попасть в подбородок).
    // Используем угол для смещения контрольной точки кривой/прямой.
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    // Угол применяем как "искривление": смещаем прямую через контрольную точку
    const mx = (from.x + target.x) / 2;
    const my = (from.y + target.y) / 2;
    const bend = Math.sin(jawA) * unit * 0.8;
    return {
      p0: from,
      ctrl: { x: mx - bend, y: my },
      p1: target,
    };
  }

  // ----- Рендер -----
  ctx.clearRect(0, 0, S, S);
  ctx.lineCap = 'round';

  // Сетка
  drawGrid(X);

  // Контуры головы
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 8;

  // Круг (эллипс)
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Подбородок
  ctx.strokeStyle = '#c0392b';
  if (chinType === 'line') {
    line(cx - chinHalf, chinY, cx + chinHalf, chinY);
  } else {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(cx, chinY, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Линия челюсти — левая
  ctx.strokeStyle = '#2c7be5';
  line(attachLeft.x, attachLeft.y, left1.x, left1.y);
  let seg = secondLine(left1, chinPts[0]);
  curve(seg.p0.x, seg.p0.y, seg.ctrl.x, seg.ctrl.y, seg.p1.x, seg.p1.y);

  // правая (зеркально)
  line(attachRight.x, attachRight.y, right1.x, right1.y);
  const chinRightTarget = chinType === 'point' ? chinPts[0] : chinPts[1];
  seg = secondLine(right1, chinRightTarget);
  curve(seg.p0.x, seg.p0.y, seg.ctrl.x, seg.ctrl.y, seg.p1.x, seg.p1.y);

  // Пунктир: граница черепа, проходящая через точки крепления
  ctx.save();
  ctx.setLineDash([12, 12]);
  ctx.strokeStyle = 'rgba(44,123,229,0.4)';
  ctx.lineWidth = 3;
  line(attachLeft.x, attachLeft.y, attachRight.x, attachRight.y);
  ctx.restore();

  // Метки уровней 1/5..5/5
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.font = '28px monospace';
  for (let k = 1; k <= 5; k++) {
    const y = topOfHead + unit * k;
    ctx.fillText(`${k}/5`, PAD + 20, y - 8);
  }
  ctx.fillText(`X = ${X} голов`, S - PAD - 260, TOP - 20);
}

function render() {
  const X = parseFloat(els.X.value);
  outs.X.textContent = X.toFixed(1);
  outs.chH.textContent = parseFloat(els.chH.value).toFixed(2);
  outs.chW.textContent = parseFloat(els.chW.value).toFixed(2);
  outs.chinW.textContent = parseFloat(els.chinW.value).toFixed(2);
  outs.chinH.textContent = parseFloat(els.chinH.value).toFixed(2);
  outs.jawH.textContent = parseFloat(els.jawH.value).toFixed(2);
  outs.jawA.textContent = els.jawA.value;
  outs.jawW.textContent = parseFloat(els.jawW.value).toFixed(2);
  drawHead(X);
}

Object.values(els).forEach(el => {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
});

document.getElementById('reset').addEventListener('click', () => {
  els.X.value = 7.5;
  els.chH.value = 1;
  els.chW.value = 1;
  els.chinW.value = 1;
  els.chinH.value = 1;
  els.chinType.value = 'line';
  els.jawH.value = 0.5;
  els.jawA.value = 20;
  els.jawW.value = 1;
  render();
});

render();
