export function drawArms(r, L, cfg, torsoA){
  const { moduleH } = L;
  const h = moduleH;

  // ——— плечи ———
  const shL = torsoA.shoulderL, shR = torsoA.shoulderR;
  const shR_L = h * 0.09 * (1 + cfg.shoulder.radius / 100);
  r.ellipse(shL.x, shL.y, shR_L, shR_L);
  r.ellipse(shR.x, shR.y, shR_L, shR_L);

  // ——— запястья ———
  const wrL = torsoA.wristL, wrR = torsoA.wristR;
  const wShiftX = cfg.wrist.dx / 100 * h * 0.2;
  const wShiftY = cfg.wrist.dy / 100 * h * 0.2;
  const wrRadius = h * 0.06 * (1 + cfg.wrist.radius / 100);

  const wL = { x: wrL.x - wShiftX, y: wrL.y + wShiftY };
  const wR = { x: wrR.x + wShiftX, y: wrR.y + wShiftY };
  r.ellipse(wL.x, wL.y, wrRadius, wrRadius);
  r.ellipse(wR.x, wR.y, wrRadius, wrRadius);

  // ——— локти ———
  const eShiftX = cfg.elbow.dx / 100 * h * 0.2;
  const eShiftY = cfg.elbow.dy / 100 * h * 0.2;
  const eRadius = h * 0.07 * (1 + cfg.elbow.radius / 100);

  const eL = {
    x: (shL.x + wL.x) / 2 - Math.abs(eShiftX),
    y: (shL.y + wL.y) / 2 + eShiftY
  };
  const eR = {
    x: (shR.x + wR.x) / 2 + Math.abs(eShiftX),
    y: (shR.y + wR.y) / 2 + eShiftY
  };
  r.ellipse(eL.x, eL.y, eRadius, eRadius);
  r.ellipse(eR.x, eR.y, eRadius, eRadius);

  // ——— линии с делением на 3 ———
  const seg3 = (a, b, markerR) => {
    // сама линия
    r.path([ [a.x,a.y], [b.x,b.y] ]);
    // маркеры 1/3 и 2/3
    for (let i = 1; i <= 2; i++){
      const t = i / 3;
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      r.ellipse(px, py, markerR, markerR);
    }
  };

  const mR = h * 0.02;
  seg3(shL, eL, mR);  seg3(eL, wL, mR);   // левая рука
  seg3(shR, eR, mR);  seg3(eR, wR, mR);   // правая рука

  return { shoulderL: shL, shoulderR: shR, elbowL: eL, elbowR: eR, wristL: wL, wristR: wR };
}
