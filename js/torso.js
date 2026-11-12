export function drawTorso(r, L, cfg, headA){
  const { mTop, moduleH, cx } = L;
  const y1 = mTop + moduleH;
  const h  = moduleH;

  const baseRx = h * 0.5 * (1 + cfg.chest.width / 100);
  const topEx  = cfg.chest.top / 100;
  const botEx  = cfg.chest.bottom / 100;
  const ry     = h * 0.5 * (1 + cfg.chest.height / 100);

  const chestCy = y1 + ry;
  const rxTop   = baseRx * (1 + topEx);
  const rxBot   = baseRx * (1 + botEx);

  const steps = 64;
  const pts = [];
  for (let i = 0; i <= steps; i++){
    const t = Math.PI + Math.PI * i / steps;
    pts.push([cx + Math.cos(t) * rxTop, chestCy + Math.sin(t) * ry]);
  }
  for (let i = 0; i <= steps; i++){
    const t = Math.PI - Math.PI * i / steps;
    pts.push([cx + Math.cos(t) * rxBot, chestCy + Math.sin(t) * ry]);
  }
  r.path(pts, true);

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

export function torsoAnchors(cfg, torso){
  const { chest, pelvis } = torso;
  const shoulderY = chest.top + (2 * chest.ry) / 3;
  const shoulderL = { x: chest.cx - chest.rxTop, y: shoulderY };
  const shoulderR = { x: chest.cx + chest.rxTop, y: shoulderY };

  const wristY = pelvis.top + pelvis.h * 0.1;
  const wristL = { x: pelvis.left,  y: wristY };
  const wristR = { x: pelvis.right, y: wristY };

  const p25 = pelvis.left + pelvis.w * 0.4;
  const p45 = pelvis.left + pelvis.w * 0.8;
  const pelvisBottom = { y: pelvis.bottom, x2of5: p25, x4of5: p45,
                         left: pelvis.left, right: pelvis.right };

  return { shoulderL, shoulderR, wristL, wristR, pelvisBottom };
}
