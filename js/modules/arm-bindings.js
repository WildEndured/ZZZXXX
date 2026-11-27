/* js/modules/arm-bindings.js — UI-биндинги рук */

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
      if (!window.Arm) return;
      window.Arm.setParams({ [key]: v });
      valEl.textContent = format(v);
      window.applyState();
    });
  }

  function sync() {
    if (!window.Arm) return;
    const p = window.Arm.getParams();
    const d = window.dom;

    d.armShoulderRadius.value = p.shoulderRadiusMul;  d.armShoulderRadiusVal.textContent = Math.round(p.shoulderRadiusMul * 100);
    d.armElbowRadius.value = p.elbowRadius;           d.armElbowRadiusVal.textContent = Math.round(p.elbowRadius * 1000) / 10;
    d.armWristRadius.value = p.wristRadius;           d.armWristRadiusVal.textContent = Math.round(p.wristRadius * 1000) / 10;

    d.armElbowLeftX.value = p.elbowLeftX;   d.armElbowLeftXVal.textContent = fmtSignedPercent(p.elbowLeftX);
    d.armElbowLeftY.value = p.elbowLeftY;   d.armElbowLeftYVal.textContent = fmtSignedPercent(p.elbowLeftY);
    d.armElbowRightX.value = p.elbowRightX; d.armElbowRightXVal.textContent = fmtSignedPercent(p.elbowRightX);
    d.armElbowRightY.value = p.elbowRightY; d.armElbowRightYVal.textContent = fmtSignedPercent(p.elbowRightY);

    d.armWristLeftX.value = p.wristLeftX;   d.armWristLeftXVal.textContent = fmtSignedPercent(p.wristLeftX);
    d.armWristLeftY.value = p.wristLeftY;   d.armWristLeftYVal.textContent = fmtSignedPercent(p.wristLeftY);
    d.armWristRightX.value = p.wristRightX; d.armWristRightXVal.textContent = fmtSignedPercent(p.wristRightX);
    d.armWristRightY.value = p.wristRightY; d.armWristRightYVal.textContent = fmtSignedPercent(p.wristRightY);

    d.armOuterUpperArmAttach.value = p.outerUpperArmAttachAngle; d.armOuterUpperArmAttachVal.textContent = Math.round(p.outerUpperArmAttachAngle);
    d.armOuterUpperArmElbow.value = p.outerUpperArmElbowAngle;   d.armOuterUpperArmElbowVal.textContent = Math.round(p.outerUpperArmElbowAngle);
    d.armOuterUpperArmP1X.value = p.outerUpperArmP1X;             d.armOuterUpperArmP1XVal.textContent = fmtSignedPercent(p.outerUpperArmP1X);
    d.armOuterUpperArmP1Y.value = p.outerUpperArmP1Y;             d.armOuterUpperArmP1YVal.textContent = fmtSignedPercent(p.outerUpperArmP1Y);

    d.armInnerUpperArmAttach.value = p.innerUpperArmAttachAngle; d.armInnerUpperArmAttachVal.textContent = Math.round(p.innerUpperArmAttachAngle);
    d.armInnerUpperArmElbow.value = p.innerUpperArmElbowAngle;   d.armInnerUpperArmElbowVal.textContent = Math.round(p.innerUpperArmElbowAngle);
    d.armInnerUpperArmP1X.value = p.innerUpperArmP1X;             d.armInnerUpperArmP1XVal.textContent = fmtSignedPercent(p.innerUpperArmP1X);
    d.armInnerUpperArmP1Y.value = p.innerUpperArmP1Y;             d.armInnerUpperArmP1YVal.textContent = fmtSignedPercent(p.innerUpperArmP1Y);

    d.armForearmElbowAngle.value = p.forearmElbowAttachAngle; d.armForearmElbowAngleVal.textContent = Math.round(p.forearmElbowAttachAngle);
    d.armForearmWristAngle.value = p.forearmWristAttachAngle; d.armForearmWristAngleVal.textContent = Math.round(p.forearmWristAttachAngle);
    d.armForearmP1X.value = p.forearmP1OffsetX;               d.armForearmP1XVal.textContent = fmtSignedPercent(p.forearmP1OffsetX);
    d.armForearmP1Y.value = p.forearmP1OffsetY;               d.armForearmP1YVal.textContent = fmtSignedPercent(p.forearmP1OffsetY);

    d.armForearmInnerElbowAngle.value = p.forearmInnerElbowAngle; d.armForearmInnerElbowAngleVal.textContent = Math.round(p.forearmInnerElbowAngle);
    d.armForearmInnerWristAngle.value = p.forearmInnerWristAngle; d.armForearmInnerWristAngleVal.textContent = Math.round(p.forearmInnerWristAngle);
    d.armForearmInnerP1X.value = p.forearmInnerP1OffsetX;         d.armForearmInnerP1XVal.textContent = fmtSignedPercent(p.forearmInnerP1OffsetX);
    d.armForearmInnerP1Y.value = p.forearmInnerP1OffsetY;         d.armForearmInnerP1YVal.textContent = fmtSignedPercent(p.forearmInnerP1OffsetY);
    d.armForearmInnerP2X.value = p.forearmInnerP2OffsetX;         d.armForearmInnerP2XVal.textContent = fmtSignedPercent(p.forearmInnerP2OffsetX);
    d.armForearmInnerP2Y.value = p.forearmInnerP2OffsetY;         d.armForearmInnerP2YVal.textContent = fmtSignedPercent(p.forearmInnerP2OffsetY);
  }

  function init() {
    const d = window.dom;

    bind(d.armShoulderRadius, d.armShoulderRadiusVal, 'shoulderRadiusMul', (v) => Math.round(v * 100));
    bind(d.armElbowRadius, d.armElbowRadiusVal, 'elbowRadius', (v) => Math.round(v * 1000) / 10);
    bind(d.armWristRadius, d.armWristRadiusVal, 'wristRadius', (v) => Math.round(v * 1000) / 10);

    bind(d.armElbowLeftX, d.armElbowLeftXVal, 'elbowLeftX', fmtSignedPercent);
    bind(d.armElbowLeftY, d.armElbowLeftYVal, 'elbowLeftY', fmtSignedPercent);
    bind(d.armElbowRightX, d.armElbowRightXVal, 'elbowRightX', fmtSignedPercent);
    bind(d.armElbowRightY, d.armElbowRightYVal, 'elbowRightY', fmtSignedPercent);

    bind(d.armWristLeftX, d.armWristLeftXVal, 'wristLeftX', fmtSignedPercent);
    bind(d.armWristLeftY, d.armWristLeftYVal, 'wristLeftY', fmtSignedPercent);
    bind(d.armWristRightX, d.armWristRightXVal, 'wristRightX', fmtSignedPercent);
    bind(d.armWristRightY, d.armWristRightYVal, 'wristRightY', fmtSignedPercent);

    bind(d.armOuterUpperArmAttach, d.armOuterUpperArmAttachVal, 'outerUpperArmAttachAngle', (v) => Math.round(v));
    bind(d.armOuterUpperArmElbow, d.armOuterUpperArmElbowVal, 'outerUpperArmElbowAngle', (v) => Math.round(v));
    bind(d.armOuterUpperArmP1X, d.armOuterUpperArmP1XVal, 'outerUpperArmP1X', fmtSignedPercent);
    bind(d.armOuterUpperArmP1Y, d.armOuterUpperArmP1YVal, 'outerUpperArmP1Y', fmtSignedPercent);

    bind(d.armInnerUpperArmAttach, d.armInnerUpperArmAttachVal, 'innerUpperArmAttachAngle', (v) => Math.round(v));
    bind(d.armInnerUpperArmElbow, d.armInnerUpperArmElbowVal, 'innerUpperArmElbowAngle', (v) => Math.round(v));
    bind(d.armInnerUpperArmP1X, d.armInnerUpperArmP1XVal, 'innerUpperArmP1X', fmtSignedPercent);
    bind(d.armInnerUpperArmP1Y, d.armInnerUpperArmP1YVal, 'innerUpperArmP1Y', fmtSignedPercent);

    bind(d.armForearmElbowAngle, d.armForearmElbowAngleVal, 'forearmElbowAttachAngle', (v) => Math.round(v));
    bind(d.armForearmWristAngle, d.armForearmWristAngleVal, 'forearmWristAttachAngle', (v) => Math.round(v));
    bind(d.armForearmP1X, d.armForearmP1XVal, 'forearmP1OffsetX', fmtSignedPercent);
    bind(d.armForearmP1Y, d.armForearmP1YVal, 'forearmP1OffsetY', fmtSignedPercent);

    bind(d.armForearmInnerElbowAngle, d.armForearmInnerElbowAngleVal, 'forearmInnerElbowAngle', (v) => Math.round(v));
    bind(d.armForearmInnerWristAngle, d.armForearmInnerWristAngleVal, 'forearmInnerWristAngle', (v) => Math.round(v));
    bind(d.armForearmInnerP1X, d.armForearmInnerP1XVal, 'forearmInnerP1OffsetX', fmtSignedPercent);
    bind(d.armForearmInnerP1Y, d.armForearmInnerP1YVal, 'forearmInnerP1OffsetY', fmtSignedPercent);
    bind(d.armForearmInnerP2X, d.armForearmInnerP2XVal, 'forearmInnerP2OffsetX', fmtSignedPercent);
    bind(d.armForearmInnerP2Y, d.armForearmInnerP2YVal, 'forearmInnerP2OffsetY', fmtSignedPercent);
  }

  window.ArmBindings = { init, sync, fmtSignedPercent };
})();
