const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W = canvas.width;
let H = canvas.height;

// Подложка
let bgImage = null;

// UI Элементы
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
  lineColor: el('lineColor'),
  lineWidth: el('lineWidth'), lineWidthVal: el('lineWidthVal'),
};

// Переключение вкладок
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// Загрузка подложки
ui.bgImage = el('bgImage');
ui.bgImage.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      bgImage = img;
      // Подстраиваем размер холста под подложку (макс 4096)
      const aspect = img.width / img.height;
      if (aspect > 1) {
        W = 4096;
        H = Math.round(4096 / aspect);
      } else {
        H = 4096;
        W = Math.round(4096 * aspect);
      }
      canvas.width = W;
      canvas.height = H;
      draw();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

el('clearBg').addEventListener('click', () => {
  bgImage = null;
  W = 4096; H = 4096;
  canvas.width = W;
  canvas.height = H;
  ui.bgImage.value = '';
  draw();
});

// Чтение параметров
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
    lineColor: ui.lineColor.value,
    lineWidth: +ui.lineWidth.value,
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
  ui.lineWidthVal.textContent = p.lineWidth + ' px';

  // Очистка
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Рисуем подложку (если есть)
  if (bgImage) {
    ctx.globalAlpha = 0.5; // Прозрачность подложки
    ctx.drawImage(bgImage, 0, 0, W, H);
    ctx.globalAlpha = 1.0;
  }

  // Настройки линий
  const cMain = p.lineColor;
  const cAux = '#cccccc'; // Цвет вспомогательных линий
  const lw = p.lineWidth;
  const lwAux = Math.max(1, lw * 0.5);

  // Отступ 5% сверху и снизу
  const top = H * 0.05;
  const bottom = H - H * 0.05;
  const usableH = bottom - top;
  const headH = usableH / p.heads;
  const headW = headH;
  const cx = W / 2;
  const topY = top;

  // Вспомогательные линии (сетка)
  ctx.strokeStyle = cAux;
  ctx.lineWidth = lwAux;
  ctx.setLineDash([lw * 5, lw * 5]);
  for (let i = 1; i <= p.heads; i++) {
    const y = topY + headH * i;
    ctx.beginPath();
    ctx.moveTo(W * 0.1, y);
    ctx.lineTo(W * 0.9, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Метки линий
  ctx.fillStyle = cMain;
  ctx.font = `${Math.max(20, lw * 4)}px system-ui`;
  ctx.textAlign = 'left';
  for (let i = 0; i <= p.heads; i++) {
    const y = topY + headH * i;
    ctx.fillText(`${i}/${p.heads}`, W * 0.05, y + lw * 2);
  }

  const line1 = topY + headH * 1;
  const line3 = topY + headH * 3;
  const line4 = topY + headH * 4;

  // ---- Круг головы ----
  const baseDiameter = line3 - line1;
  const radius = (baseDiameter / 2) * p.circleH;
  const radiusX = (baseDiameter / 2) * p.circleW;
  const centerY = (line1 + line3) / 2;

  ctx.beginPath();
  ctx.ellipse(cx, centerY, radiusX, radius, 0, 0, Math.PI * 2);
  ctx.strokeStyle = cMain;
  ctx.lineWidth = lw;
  ctx.stroke();

  const widestX = cx + radiusX;
  const widestY = centerY;

  // ---- Подбородок ----
  const chinY = line4 + headH * p.chinH * 0.5;
  const chinHalfW = headW * p.chinW;

  ctx.fillStyle = cMain;
  ctx.strokeStyle = cMain;
  ctx.lineWidth = lw;

  if (p.chinStyle === 'dot') {
    ctx.beginPath();
    ctx.arc(cx, chinY, lw * 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - chinHalfW, chinY);
    ctx.lineTo(cx + chinHalfW, chinY);
    ctx.stroke();
  }

  // ---- Челюсть (правая сторона) ----
  const jawAttachY = widestY + headH * p.jawY;
  const jawAttachX = cx + radiusX * p.jawW;
  const P1 = { x: jawAttachX, y: jawAttachY };

  const angle = p.jawAngle * Math.PI / 180;
  const segLen = headH * 0.35;
  const P2 = {
    x: P1.x - Math.sin(angle) * segLen,
    y: P1.y + Math.cos(angle) * segLen,
  };

  const P3 = { x: cx + chinHalfW, y: chinY };

  // Правая (основная) челюсть
  ctx.beginPath();
  ctx.moveTo(P1.x, P1.y);
  ctx.lineTo(P2.x, P2.y);
  ctx.lineTo(P3.x, P3.y);
  ctx.strokeStyle = cMain;
  ctx.lineWidth = lw;
  ctx.stroke();

  // Левая (зеркальная) челюсть
  ctx.beginPath();
  ctx.moveTo(W - P1.x, P1.y);
  ctx.lineTo(W - P2.x, P2.y);
  ctx.lineTo(W - P3.x, P3.y);
  ctx.strokeStyle = cAux;
  ctx.lineWidth = lwAux;
  ctx.stroke();
}

// Слушатели
['heads','circleH','circleW','chinW','chinH','chinStyle','jawY','jawAngle','jawW','lineColor','lineWidth']
  .forEach(id => el(id).addEventListener('input', draw));

// Скачивание
document.getElementById('download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'head.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

draw();
