// Голова: модуль i=0
export function drawHead(r, L, cfg){
  const { mTop, moduleH, cx } = L;
  const y0 = mTop;
  const h  = moduleH;

  // радиус круга
  const radPct = (cfg.radius ?? 0) / 100;
  const radius = h * 0.3 * (1 + radPct);

  // верх/низ/ширина головы — модифицируют форму через масштаб
  const topPct    = (cfg.top ?? 0)    / 100;
  const botPct    = (cfg.bottom ?? 0) / 100;
  const widthPct  = (cfg.width ?? 0)  / 100;

  const cy = y0 + h * (0.5 + topPct * 0.15 - botPct * 0.15);
  const rx = radius * (1 + widthPct);
  const ry = radius * (1 - topPct * 0.3 + botPct * 0.3);

  // 1) круг головы
  r.ellipse(cx, cy, rx, ry);

  // 2) подбородок
  const chinY = y0 + h * 0.8 + (cfg.chin.height / 100 - 0.5) * h * 0.1;
  const chinHalfW = (cfg.chin.width / 100) * h * 0.2 + h * 0.05;
  const chinRound = cfg.chin.rounding * chinHalfW * 0.8;

  // подбородок рисуем как кривую (линия)
  const chinPts = [
    [cx - chinHalfW, chinY],
    [cx - chinHalfW * 0.5, chinY + chinRound * 0.3],
    [cx, chinY + chinRound],
    [cx + chinHalfW * 0.5, chinY + chinRound * 0.3],
    [cx + chinHalfW, chinY]
  ];
  r.path(chinPts, false);

  // 3) челюсти: от круга к подбородку
  // точка крепления на круге (снизу), по углу
  const attachA = (cfg.jaw.attach / 100) * Math.PI; // 0..π (0=слева, π=справа)
  const jAngle  = (cfg.jaw.angle / 100) * 0.8;       // доп. угол наклона
  const jawLen  = (cfg.jaw.length / 100) * h * 0.25;
  const jawW    = 0.5 + cfg.jaw.width / 100;

  // левая челюсть
  const aL = Math.PI - attachA - jAngle;
  const fromL = [
    cx + Math.cos(aL) * rx,
    cy + Math.sin(aL) * ry
  ];
  // правая
  const aR = Math.PI + attachA + jAngle;
  const fromR = [
    cx + Math.cos(aR) * rx,
    cy + Math.sin(aR) * ry
  ];

  const toL = [cx - chinHalfW * jawW, chinY];
  const toR = [cx + chinHalfW * jawW, chinY];

  // слегка изогнутые линии челюсти
  r.path([
    fromL,
    [(fromL[0] + toL[0]) / 2 + jawLen * 0.1, (fromL[1] + toL[1]) / 2],
    toL
  ]);
  r.path([
    fromR,
    [(fromR[0] + toR[0]) / 2 - jawLen * 0.1, (fromR[1] + toR[1]) / 2],
    toR
  ]);

  // 4) шея
  const neckY = y0 + h;
  const neckW = h * 0.12 * (1 + cfg.neck.width / 100);
  r.path([[cx - neckW, neckY], [cx + neckW, neckY]]);

  return {
    neckBottom: { x: cx, y: neckY, width: neckW * 2 },
    chinY,
    headBottom: cy + ry
  };
}
