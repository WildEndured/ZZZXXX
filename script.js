const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 4096, H = 4096;

// Ползунки
const el = id => document.getElementById(id);
const ui = {
  heads: el('heads'), headsVal: el('headsVal'),
  circleH: el('circleH'), circleHVal: el('circleHVal'),
  circleW: el('circleW'), circleWVal: el('circleWVal'),
  chinW: el('chinW'), chinWVal: el('chinWVal'),
  chinH: el('chinH'), chinHVal: el('chinHVal'),
  chinStyle: el('chinStyle'),
  jawY: el('jawY'), jawYVal: el('jawYVal'),
  jawAngle: el('jawAngle'), jawAngleVal: el('jawAngleVal'),
  jawW: el('jawW'), jawWVal: el('jawWVal'),
};

function readParams() {
  return {
    heads: +ui.heads.value,
    circleH: +ui.circleH.value,
    circleW: +ui.circleW.value,
    chinW: +ui.chinW.value,
    chinH: +ui.chinH.value,
    chinStyle: ui.chinStyle.value,
    jawY: +ui.jawY.value,
    jawAngle: +ui.jawAngle.value,
    jawW: +ui.jawW.value,
  };
}

function draw() {
  const p = readParams();

  // Обновляем подписи
  ui.headsVal.textContent = p.heads;
  ui.circleHVal.textContent = p.circleH.toFixed(2);
  ui.circleWVal.textContent = p.circleW.toFixed(2);
  ui.chinWVal.textContent = p.chinW.toFixed(2);
  ui.chinHVal.textContent = p.chinH.toFixed(2);
  ui.jawYVal.textContent = p.jawY.toFixed(2);
  ui.jawAngleVal.textContent = p.jawAngle + '°';
  ui.jawWVal.textContent = p.jawW.toFixed(2);

  // Очистка
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Отступ 5% сверху и снизу
  const top = H * 0.05;
  const bottom = H - H * 0.05;
  const usableH = bottom - top;
  const headH = usableH / p.heads; // высота одной "головы"
  const headW = headH;              // квадрат области
  const cx = W / 2;
  const topY = top;                 // верх области головы

  // Вспомогательные линии
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 4;
  ctx.setLineDash([30, 30]);

  // 1/X, 2/X, 3/X, 4/X, 5/X... до X
  for (let i = 1; i <= p.heads; i++) {
    const y = topY + headH * i;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, y);
    ctx.lineTo(W * 0.8, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Метки линий
  ctx.fillStyle = '#999';
  ctx.font = '50px system-ui';
  ctx.textAlign = 'left';
  for (let i = 0; i <= p.heads; i++) {
    const y = topY + headH * i;
    ctx.fillText(`${i}/${p.heads}`, W * 0.15, y + 18);
  }

  // ================= ГОЛОВА =================
  // Линия 1/5 — верх круга
  // Линия 3/5 — низ круга
  // Линия 4/5 — подбородок
  // Линия 5/5 — низ области (не используется)

  const line1 = topY + headH * 1; // 1/5
  const line3 = topY + headH * 3; // 3/5
  const line4 = topY + headH * 4; // 4/5
  const line5 = topY + headH * 5; // 5/5

  // ---- Круг головы ----
  // Верх круга на 1/5, низ на 3/5 => диаметр = 2/5 * headH
  const baseDiameter = line3 - line1; // = 2/5 headH
  const radius = (baseDiameter / 2) * p.circleH;
  const radiusX = (baseDiameter / 2) * p.circleW;
  const centerY = (line1 + line3) / 2;

  // Рисуем круг / эллипс
  ctx.beginPath();
  ctx.ellipse(cx, centerY, radiusX, radius, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Широчайшая точка (для челюсти) — по горизонтали на уровне центра
  const widestX = cx + radiusX;
  const widestY = centerY;

  // ---- Подбородок ----
  const chinY = line4 + headH * p.chinH * 0.5; // смещение
  const chinHalfW = headW * p.chinW;

  // Точка / линия подбородка
  ctx.fillStyle = '#1a1a1a';
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 8;

  if (p.chinStyle === 'dot') {
    ctx.beginPath();
    ctx.arc(cx, chinY, 30, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - chinHalfW, chinY);
    ctx.lineTo(cx + chinHalfW, chinY);
    ctx.stroke();
  }

  // ---- Челюсть (правая сторона) ----
  // Первая линия: от широчайшей точки круга вниз
  // Вторая линия: под углом к подбородку
  const jawAttachY = widestY + headH * p.jawY; // высота крепления челюсти
  const jawX = widestX * 0.95; // немного внутрь от края круга
  const jawAttachX = cx + radiusX * p.jawW;

  // Точка 1: крепление у "широчайшей" точки
  const P1 = { x: jawAttachX, y: jawAttachY };

  // Точка 2: низ челюсти (угол челюсти)
  const angle = p.jawAngle * Math.PI / 180;
  const segLen = headH * 0.35;
  const P2 = {
    x: P1.x - Math.sin(angle) * segLen,
    y: P1.y + Math.cos(angle) * segLen,
  };

  // Точка 3: подбородок
  const P3 = { x: cx + chinHalfW, y: chinY };

  ctx.beginPath();
  ctx.moveTo(P1.x, P1.y);
  ctx.lineTo(P2.x, P2.y);
  ctx.lineTo(P3.x, P3.y);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Зеркальная сторона (для наглядности)
  ctx.beginPath();
  ctx.moveTo(W - P1.x, P1.y);
  ctx.lineTo(W - P2.x, P2.y);
  ctx.lineTo(W - P3.x, P3.y);
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 4;
  ctx.stroke();
}

// Подписка на все изменения
['heads','circleH','circleW','chinW','chinH','chinStyle','jawY','jawAngle','jawW']
  .forEach(id => el(id).addEventListener('input', draw));

// Скачивание
document.getElementById('download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'head.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

draw();
