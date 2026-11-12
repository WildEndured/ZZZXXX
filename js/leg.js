export function drawLegs(r, L, cfg, torsoA){
  const { moduleH, mTop, X } = L;
  const h = moduleH;
  const floorY = mTop + X * h;

  const pb = torsoA.pelvisBottom;
  const pelvisBottomY = pb.y;

  const ankleRadius = h * 0.06 * (1 + cfg.ankle.radius / 100);
  const aShiftX = cfg.ankle.dx / 100 * h * 0.2;

  const ankleL = { x: pb.x2of5 - aShiftX, y: floorY };
  const ankleR = { x: pb.x4of5 + aShiftX, y: floorY };
  r.ellipse(ankleL.x, ankleL.y, ankleRadius, ankleRadius);
  r.ellipse(ankleR.x, ankleR.y, ankleRadius, ankleRadius);

  const kneeRadius = h * 0.07 * (1 + cfg.knee.radius / 100);
  const kShiftX = cfg.knee.dx / 100 * h * 0.2;
  const kShiftY = cfg.knee.dy / 100 * h * 0.2;

  const kneeL = {
    x: (pb.x2of5 + ankleL.x) / 2 - Math.abs(kShiftX),
    y: (pelvisBottomY + floorY) / 2 + kShiftY
  };
  const kneeR = {
    x: (pb.x4of5 + ankleR.x) / 2 + Math.abs(kShiftX),
    y: (pelvisBottomY + floorY) / 2 + kShiftY
  };
  r.ellipse(kneeL.x, kneeL.y, kneeRadius, kneeRadius);
  r.ellipse(kneeR.x, kneeR.y, kneeRadius, kneeRadius);

  const hipL = { x: pb.x2of5, y: pelvisBottomY };
  const hipR = { x: pb.x4of5, y: pelvisBottomY };

  const seg3 = (a, b, markerR) => {
    r.path([[a.x,a.y],[b.x,b.y]]);
    if (cfg.showJoints){
      for (let i = 1; i <= 2; i++){
        const t = i / 3;
        r.ellipse(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, markerR, markerR);
      }
    }
  };
  const mR = h * 0.02;
  seg3(hipL, kneeL, mR);   seg3(kneeL, ankleL, mR);
  seg3(hipR, kneeR, mR);   seg3(kneeR, ankleR, mR);

  return { hipL, hipR, kneeL, kneeR, ankleL, ankleR, floorY };
}
