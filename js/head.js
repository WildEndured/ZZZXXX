export function drawHead(r, L, cfg){
  const { mTop, moduleH, cx } = L;
  const y0 = mTop;
  const h  = moduleH;

  const radPct = (cfg.radius ?? 0) / 100;
  const radius = h * 0.3 * (1 + radPct);

  const topPct   = (cfg.top ?? 0)    / 100;
  const botPct   = (cfg.bottom ?? 0) / 100;
  const widthPct = (cfg.width ?? 0)  / 100;

  const cy = y0 + h * (0.5 + topPct * 0.15 - botPct * 0.15);
  const rx = radius * (1 + widthPct);
  const ry = radius * (1 - topPct * 0.3 + botPct * 0.3);

  r.ellipse(cx, cy, rx, ry);

  const chinY = y0 + h * 0.8 + (cfg.chin.height / 100 - 0.5) * h * 0.1;
  const chinHalfW = (cfg.chin.width / 100) * h * 0.2 + h * 0.05;
  const chinRound = cfg.chin.rounding * chinHalfW * 0.8;

  const chinPts = [
    [cx - chinHalfW, chinY],
    [cx - chinHalfW * 0.5, chinY + chinRound * 0.3],
    [cx, chinY + chinRound],
    [cx + chinHalfW * 0.5, chinY + chinRound * 0.3],
    [cx + chinHalfW, chinY]
  ];
  r.path(chinPts, false);

  const attachA = (cfg.jaw.attach / 100) * Math.PI;
  const jAngle  = (cfg.jaw.angle / 100) * 0.8;
  const jawLen  = (cfg.jaw.length / 100) * h * 0.25;
  const jawW    = 0.5 + cfg.jaw.width / 100;

  const aL = Math.PI - attachA - jAngle;
  const fromL = [cx + Math.cos(aL) * rx, cy + Math.sin(aL) * ry];

  const aR = Math.PI + attachA + jAngle;
  const fromR = [cx + Math.cos(aR) * rx, cy + Math.sin(aR) * ry];

  const toL = [cx - chinHalfW * jawW, chinY];
  const toR = [cx + chinHalfW * jawW, chinY];

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

  const neckY = y0 + h;
  const neckW = h * 0.12 * (1 + cfg.neck.width / 100);
  r.path([[cx - neckW, neckY], [cx + neckW, neckY]]);

  return {
    neckBottom: { x: cx, y: neckY, width: neckW * 2 },
    chinY,
    headBottom: cy + ry
  };
}
