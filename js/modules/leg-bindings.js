/* js/modules/leg-bindings.js — UI-биндинги ног */

(function () {
  'use strict';

  function fmtSignedPercent(v) {
    const p = Math.round(v * 1000) / 10;
    return p > 0 ? `+${p}` : String(p);
  }

  function bind(input, valEl, key, format) {
    if (!input || !valEl) return;
    input.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (!window.Leg) return;
      window.Leg.setParams({ [key]: v });
      valEl.textContent = format(v);
      window.applyState();
    });
  }

  function sync() {
    if (!window.Leg) return;
    const p = window.Leg.getParams();
    const d = window.dom;

    d.legKneeRadius.value = p.kneeRadius;   d.legKneeRadiusVal.textContent = Math.round(p.kneeRadius * 1000) / 10;
    d.legAnkleRadius.value = p.ankleRadius; d.legAnkleRadiusVal.textContent = Math.round(p.ankleRadius * 1000) / 10;

    d.legLeftKneeX.value = p.leftKneeX;   d.legLeftKneeXVal.textContent = fmtSignedPercent(p.leftKneeX);
    d.legLeftKneeY.value = p.leftKneeY;   d.legLeftKneeYVal.textContent = fmtSignedPercent(p.leftKneeY);
    d.legLeftAnkleX.value = p.leftAnkleX; d.legLeftAnkleXVal.textContent = fmtSignedPercent(p.leftAnkleX);
    d.legLeftAnkleY.value = p.leftAnkleY; d.legLeftAnkleYVal.textContent = fmtSignedPercent(p.leftAnkleY);

    d.legRightKneeX.value = p.rightKneeX;   d.legRightKneeXVal.textContent = fmtSignedPercent(p.rightKneeX);
    d.legRightKneeY.value = p.rightKneeY;   d.legRightKneeYVal.textContent = fmtSignedPercent(p.rightKneeY);
    d.legRightAnkleX.value = p.rightAnkleX; d.legRightAnkleXVal.textContent = fmtSignedPercent(p.rightAnkleX);
    d.legRightAnkleY.value = p.rightAnkleY; d.legRightAnkleYVal.textContent = fmtSignedPercent(p.rightAnkleY);

    d.legOuterThighAttach.value = p.outerThighAttachAngle; d.legOuterThighAttachVal.textContent = Math.round(p.outerThighAttachAngle);
    d.legOuterThighKnee.value = p.outerThighKneeAngle;     d.legOuterThighKneeVal.textContent = Math.round(p.outerThighKneeAngle);
    d.legOuterThighP1X.value = p.outerThighP1X;             d.legOuterThighP1XVal.textContent = fmtSignedPercent(p.outerThighP1X);
    d.legOuterThighP1Y.value = p.outerThighP1Y;             d.legOuterThighP1YVal.textContent = fmtSignedPercent(p.outerThighP1Y);

    d.legOuterCalfKnee.value = p.outerCalfKneeAngle; d.legOuterCalfKneeVal.textContent = Math.round(p.outerCalfKneeAngle);
    d.legOuterCalfP1X.value = p.outerCalfP1X;         d.legOuterCalfP1XVal.textContent = fmtSignedPercent(p.outerCalfP1X);
    d.legOuterCalfP1Y.value = p.outerCalfP1Y;         d.legOuterCalfP1YVal.textContent = fmtSignedPercent(p.outerCalfP1Y);
    d.legOuterCalfAnkle.value = p.outerCalfAnkleAngle;d.legOuterCalfAnkleVal.textContent = Math.round(p.outerCalfAnkleAngle);

    d.legInnerThighAttach.value = p.innerThighAttachX;
    d.legInnerThighAttachVal.textContent = Math.round(p.innerThighAttachX * 100);
    d.legInnerThighKnee.value = p.innerThighKneeAngle; d.legInnerThighKneeVal.textContent = Math.round(p.innerThighKneeAngle);
    d.legInnerThighP1X.value = p.innerThighP1X;        d.legInnerThighP1XVal.textContent = fmtSignedPercent(p.innerThighP1X);
    d.legInnerThighP1Y.value = p.innerThighP1Y;        d.legInnerThighP1YVal.textContent = fmtSignedPercent(p.innerThighP1Y);
    d.legInnerThighP2X.value = p.innerThighP2X;        d.legInnerThighP2XVal.textContent = fmtSignedPercent(p.innerThighP2X);
    d.legInnerThighP2Y.value = p.innerThighP2Y;        d.legInnerThighP2YVal.textContent = fmtSignedPercent(p.innerThighP2Y);

    d.legInnerCalfKnee.value = p.innerCalfKneeAngle; d.legInnerCalfKneeVal.textContent = Math.round(p.innerCalfKneeAngle);
    d.legInnerCalfAnkle.value = p.innerCalfAnkleAngle;d.legInnerCalfAnkleVal.textContent = Math.round(p.innerCalfAnkleAngle);
    d.legInnerCalfP1X.value = p.innerCalfP1X;         d.legInnerCalfP1XVal.textContent = fmtSignedPercent(p.innerCalfP1X);
    d.legInnerCalfP1Y.value = p.innerCalfP1Y;         d.legInnerCalfP1YVal.textContent = fmtSignedPercent(p.innerCalfP1Y);
    d.legInnerCalfP2X.value = p.innerCalfP2X;         d.legInnerCalfP2XVal.textContent = fmtSignedPercent(p.innerCalfP2X);
    d.legInnerCalfP2Y.value = p.innerCalfP2Y;         d.legInnerCalfP2YVal.textContent = fmtSignedPercent(p.innerCalfP2Y);
  }

  function init() {
    const d = window.dom;

    bind(d.legKneeRadius, d.legKneeRadiusVal, 'kneeRadius', (v) => Math.round(v * 1000) / 10);
    bind(d.legAnkleRadius, d.legAnkleRadiusVal, 'ankleRadius', (v) => Math.round(v * 1000) / 10);

    bind(d.legLeftKneeX, d.legLeftKneeXVal, 'leftKneeX', fmtSignedPercent);
    bind(d.legLeftKneeY, d.legLeftKneeYVal, 'leftKneeY', fmtSignedPercent);
    bind(d.legLeftAnkleX, d.legLeftAnkleXVal, 'leftAnkleX', fmtSignedPercent);
    bind(d.legLeftAnkleY, d.legLeftAnkleYVal, 'leftAnkleY', fmtSignedPercent);

    bind(d.legRightKneeX, d.legRightKneeXVal, 'rightKneeX', fmtSignedPercent);
    bind(d.legRightKneeY, d.legRightKneeYVal, 'rightKneeY', fmtSignedPercent);
    bind(d.legRightAnkleX, d.legRightAnkleXVal, 'rightAnkleX', fmtSignedPercent);
    bind(d.legRightAnkleY, d.legRightAnkleYVal, 'rightAnkleY', fmtSignedPercent);

    bind(d.legOuterThighAttach, d.legOuterThighAttachVal, 'outerThighAttachAngle', (v) => Math.round(v));
    bind(d.legOuterThighKnee, d.legOuterThighKneeVal, 'outerThighKneeAngle', (v) => Math.round(v));
    bind(d.legOuterThighP1X, d.legOuterThighP1XVal, 'outerThighP1X', fmtSignedPercent);
    bind(d.legOuterThighP1Y, d.legOuterThighP1YVal, 'outerThighP1Y', fmtSignedPercent);

    bind(d.legOuterCalfKnee, d.legOuterCalfKneeVal, 'outerCalfKneeAngle', (v) => Math.round(v));
    bind(d.legOuterCalfP1X, d.legOuterCalfP1XVal, 'outerCalfP1X', fmtSignedPercent);
    bind(d.legOuterCalfP1Y, d.legOuterCalfP1YVal, 'outerCalfP1Y', fmtSignedPercent);
    bind(d.legOuterCalfAnkle, d.legOuterCalfAnkleVal, 'outerCalfAnkleAngle', (v) => Math.round(v));

    bind(d.legInnerThighAttach, d.legInnerThighAttachVal, 'innerThighAttachX', (v) => v);
    bind(d.legInnerThighKnee, d.legInnerThighKneeVal, 'innerThighKneeAngle', (v) => Math.round(v));
    bind(d.legInnerThighP1X, d.legInnerThighP1XVal, 'innerThighP1X', fmtSignedPercent);
    bind(d.legInnerThighP1Y, d.legInnerThighP1YVal, 'innerThighP1Y', fmtSignedPercent);
    bind(d.legInnerThighP2X, d.legInnerThighP2XVal, 'innerThighP2X', fmtSignedPercent);
    bind(d.legInnerThighP2Y, d.legInnerThighP2YVal, 'innerThighP2Y', fmtSignedPercent);

    bind(d.legInnerCalfKnee, d.legInnerCalfKneeVal, 'innerCalfKneeAngle', (v) => Math.round(v));
    bind(d.legInnerCalfAnkle, d.legInnerCalfAnkleVal, 'innerCalfAnkleAngle', (v) => Math.round(v));
    bind(d.legInnerCalfP1X, d.legInnerCalfP1XVal, 'innerCalfP1X', fmtSignedPercent);
    bind(d.legInnerCalfP1Y, d.legInnerCalfP1YVal, 'innerCalfP1Y', fmtSignedPercent);
    bind(d.legInnerCalfP2X, d.legInnerCalfP2XVal, 'innerCalfP2X', fmtSignedPercent);
    bind(d.legInnerCalfP2Y, d.legInnerCalfP2YVal, 'innerCalfP2Y', fmtSignedPercent);
  }

  window.LegBindings = { init, sync, fmtSignedPercent };
})();
