// Торс: занимает 2 модуля (i=1..2)
export function drawTorso(r, L, cfg, headA){
  const { mTop, moduleH, cx } = L;
  const y1 = mTop + moduleH;   // начало торса (2/Х — второй модуль)
  const h  = moduleH;

  // --- грудная клетка: эллипс с расширением верха/низа ---
  const baseRx = h * 0.5 * (1 + cfg.chest.width / 100);
  const topEx  = cfg.chest.top / 100;
  const botEx  = cfg.chest.bottom / 100;
  const ry     = h * 0.5 * (1 + cfg.chest.height / 100);

  const chestCy = y1 + ry;        // эллипс вписан в модуль
  const rxTop   = baseRx * (1 + topEx);
  const rxBot   = baseRx * (1 + botEx);

  // рисуем верхнюю и нижнюю дуги
  const steps = 64;
  const pts = [];
  // верхняя половина (от π до 2π) с rxTop
  for (let i = 0; i <= steps; i++){
    const t = Math.PI + (Math.PI) * i / steps;
    pts.push([cx + Math.cos(t) * rxTop, chestCy + Math.sin(t) * ry]);
  }
  // нижняя половина (от 0 до π) с rxBot, добавляем в обратном порядке
  for (let i = 0; i <= steps; i++){
    const t = Math.PI - (Math.PI) * i / steps;
    pts.push([cx + Math.cos(t) * rxBot, chestCy + Math.sin(t) * ry]);
  }
  r.path(pts, true);

  // --- таз: прямоугольник ---
  // по ТЗ: h_rect = w_ellipse (ширина эллипса = 2*rx), w_rect = h_ellipse (высота = 2*ry)
  const ellipseWidth  = 2 * baseRx;
  const ellipseHeight = 2 * ry;

  const pelvisW = ellipseHeight * (1 + cfg.pelvis.width  / 100);
  const pelvisH = ellipseWidth  * (1 + cfg.pelvis.height / 100);

  const chestBottom = chestCy + ry;
  const gap = h * 0.05;
  const pelvisTop = chestBottom + gap;
  const pelvisX = cx - pelvisW / 2;

  const rad = Math.min(pelvisW, pelvisH) / 2 * cfg.pelvis.rounding;
  r.rect(pelvisX, pelvisTop, pelvisW, pelvisH, rad);

  return {
    chest: { cx, cy: chestCy, rxTop, rxBot, ry,
             top: chestCy - ry, bottom: chestBottom,
             left:  cx - Math.max(rxTop, rxBot),
             right: cx + Math.max(rxTop, rxBot) },
    pelvis: { x: pelvisX, y: pelvisTop, w: pelvisW, h: pelvisH,
              left: pelvisX, right: pelvisX + pelvisW,
              top: pelvisTop, bottom: pelvisTop + pelvisH }
  };
}

// Якоря для рук и ног
export function torsoAnchors(cfg, torso){
  const { chest, pelvis } = torso;
  // плечи: 1/3 высоты эллипса (сверху)
  const shoulderY = chest.top + (2 * chest.ry) / 3;
  const shoulderL = { x: chest.cx - chest.rxTop, y: shoulderY };
  const shoulderR = { x: chest.cx + chest.rxTop, y: shoulderY };

  // запястья: над нижней границей таза, по бокам
  const wristY = pelvis.top + pelvis.h * 0.1;   // чуть выше низа
  const wristL = { x: pelvis.left,  y: wristY };
  const wristR = { x: pelvis.right, y: wristY };

  // дно таза — 2/5 и 4/5 для ног
  const p25 = pelvis.left + pelvis.w * 0.4;
  const p45 = pelvis.left + pelvis.w * 0.8;
  const pelvisBottom = { y: pelvis.bottom, x2of5: p25, x4of5: p45,
                         left: pelvis.left, right: pelvis.right };

  return { shoulderL, shoulderR, wristL, wristR, pelvisBottom };
}
