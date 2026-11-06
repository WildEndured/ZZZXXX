const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const state = {
  x: 7,
  circleW: 1.0,
  circleH: 1.0,
  chinW: 0.3,
  chinH: 0.3,
  jawH: 0.6,
  jawAngle: 60,
  jawW: 0.5,
};

function bind(id, key, valId, fmt) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    state[key] = parseFloat(el.value);
    document.getElementById(valId).textContent = fmt ? fmt(state[key]) : state[key];
    draw();
  });
}
bind('x-slider', 'x', 'x-val');
bind('circle-w-slider', 'circleW', 'circle-w-val', v => v.toFixed(2));
bind('circle-h-slider', 'circleH', 'circle-h-val', v => v.toFixed(2));
bind('chin-w-slider', 'chinW', 'chin-w-val', v => v.toFixed(2));
bind('chin-h-slider', 'chinH', 'chin-h-val', v => v.toFixed(2));
bind('jaw-h-slider', 'jawH', 'jaw-h-val', v => v.toFixed(2));
bind('jaw-angle-slider', 'jawAngle', 'jaw-angle-val');
bind('jaw-w-slider', 'jawW', 'jaw-w-val', v => v.toFixed(2));

function draw() {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, W, H);

  const margin = H * 0.05;
  const usableH = H - margin * 2;
  const headH = usableH / state.x;

  // Пропорции лица
  const line1 = margin;                       // 0/5 верх головы
  const line1_5 = margin + headH / 5;         // 1/5 вершина круга
  const line3 = margin + headH * 3 / 5;       // 3/5 низ круга
  const line4 = margin + headH * 4 / 5;       // 4/5 подбородок
  const line5 = margin + headH;               // 5/5 низ головы

  // Рисуем вспомогательные линии
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 5; i++) {
    const y = margin + (headH * i) / 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Центр по горизонтали
  const cx = W / 2;

  // --- Круг головы ---
  // Вершина на 1/5, низ на 3/5
  const circleTop = line1_5;
  const circleBottom = line3;
  const baseRadius = (circleBottom - circleTop) / 2;
  const circleCY = (circleTop + circleBottom) / 2;
  const radiusY = baseRadius * state.circleH;
  const radiusX = baseRadius * state.circleW;

  ctx.strokeStyle = '#4fc3f7';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(cx, circleCY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Широчайшая точка круга (по горизонтали)
  const widestX = cx + radiusX;
  const widestXLeft = cx - radiusX;

  // --- Подбородок ---
  // Расположен на линии 4/5
  const chinY = line4;
  const chinWidthPx = headH * state.chinW * 0.5;
  const chinHeightPx = headH * state.chinH * 0.3;

  ctx.strokeStyle = '#ffb74d';
  ctx.fillStyle = '#ffb74d';
  ctx.lineWidth = 6;

  // Подбородок в форме точки или линии (упрощённо — линия сверху + точка снизу)
  const chinLeft = cx - chinWidthPx;
  const chinRight = cx + chinWidthPx;

  // Рисуем как "U"-подобную форму: горизонтальная линия подбородка
  ctx.beginPath();
  ctx.moveTo(chinLeft, chinY);
  ctx.lineTo(chinRight, chinY);
  ctx.stroke();

  // Точка подбородка (низ)
  ctx.beginPath();
  ctx.arc(cx, chinY + chinHeightPx, 6, 0, Math.PI * 2);
  ctx.fill();

  // --- Челюсть ---
  // Крепление на широчайшей точке, но по высоте регулируется jawH
  // jawH определяет, на какой высоте от верха круга крепится начало челюсти
  // 0.2 = ниже вершины, 1.0 = низ круга
  const jawAttachY = circleTop + (circleBottom - circleTop) * state.jawH;
  // Широчайшая точка на этой высоте (находится на эллипсе)
  // параметрически: y = cy + rY*sin(t); x = cx + rX*cos(t)
  // Найдём точку пересечения горизонтали jawAttachY с эллипсом справа
  const dy = jawAttachY - circleCY;
  const sinT = dy / radiusY;
  const cosT = Math.sqrt(Math.max(0, 1 - sinT * sinT));
  const jawStartX = cx + radiusX * cosT;
  const jawStartY = jawAttachY;

  // Первая линия челюсти: вниз под углом 90° от широчайшей точки
  const jawW = headH * state.jawW * 0.5;
  // Угол в градусах между вертикалью и второй линией
  const angleRad = (state.jawAngle * Math.PI) / 180;

  // Длина первой линии (вниз) зависит от jawW
  const line1Len = Math.min(jawW, chinY - jawStartY);
  const jawMidX = jawStartX;
  const jawMidY = jawStartY + line1Len;

  // Вторая линия: от конца первой к подбородку
  // Конец второй линии — у подбородка, смещённый вправо
  const chinEndX = cx + chinWidthPx * 0.9;
  const chinEndY = chinY;

  // Но вторая линия должна идти под углом jawAngle от первой
  // Строим вектор от (jawMidX, jawMidY) к (chinEndX, chinEndY)
  // Корректируем точку подбородка так, чтобы угол соответствовал
  const dxToChin = chinEndX - jawMidX;
  const dyToChin = chinEndY - jawMidY;
  const lenToChin = Math.hypot(dxToChin, dyToChin);

  // Угол от вертикали (вниз) до направления на подбородок
  const baseAngle = Math.atan2(dyToChin, dxToChin); // от +X
  // Мы хотим, чтобы вторая линия шла под углом jawAngle от вертикали (вправо вниз)
  // Направление: вниз и вправо => angle = 90° - jawAngle от +X
  const desiredAngle = Math.PI / 2 - angleRad;
  const secondLen = lenToChin;
  const jawEndX = jawMidX + Math.cos(desiredAngle) * secondLen * (dxToChin >= 0 ? 1 : -1);
  const jawEndY = jawMidY + Math.sin(desiredAngle) * secondLen;

  ctx.strokeStyle = '#81c784';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(jawStartX, jawStartY);
  ctx.lineTo(jawMidX, jawMidY);
  ctx.lineTo(jawEndX, jawEndY);
  ctx.stroke();

  // Зеркально слева
  const jawStartXLeft = cx - radiusX * cosT;
  const jawMidXLeft = jawStartXLeft;
  const jawEndXLeft = cx - (jawEndX - cx);

  ctx.beginPath();
  ctx.moveTo(jawStartXLeft, jawStartY);
  ctx.lineTo(jawMidXLeft, jawMidY);
  ctx.lineTo(jawEndXLeft, jawEndY);
  ctx.stroke();

  // Центральная вертикаль
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, margin);
  ctx.lineTo(cx, margin + headH);
  ctx.stroke();
}

draw();
window.addEventListener('resize', () => {
  // canvas физически 4096x4096, CSS масштабирует
});
