/* js/modules/head-bindings.js — UI-биндинги головы */

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
      if (!window.Head) return;
      window.Head.setParams({ [key]: v });
      valEl.textContent = format(v);
      window.applyState();
    });
  }

  function sync() {
    if (!window.Head) return;
    const p = window.Head.getParams();
    const d = window.dom;

    d.headTopShift.value = p.topShift;            d.headTopShiftVal.textContent = fmtSignedPercent(p.topShift);
    d.headBottomShift.value = p.bottomShift;      d.headBottomShiftVal.textContent = fmtSignedPercent(p.bottomShift);
    d.headWidthMul.value = p.widthMul;            d.headWidthMulVal.textContent = Math.round(p.widthMul * 100);
    d.headRadiusMul.value = p.radiusMul;          d.headRadiusMulVal.textContent = Math.round(p.radiusMul * 100);
    d.headChinShift.value = p.chinHeightShift;    d.headChinShiftVal.textContent = fmtSignedPercent(p.chinHeightShift);
    d.headChinWidth.value = p.chinWidth;          d.headChinWidthVal.textContent = Math.round(p.chinWidth * 100);
    d.headJawAttach.value = p.jawAttach;          d.headJawAttachVal.textContent = fmtSignedPercent(p.jawAttach);
    d.headJawLength.value = p.jawLength;          d.headJawLengthVal.textContent = Math.round(p.jawLength * 100);
    d.headJawAngleWidth.value = p.jawAngleWidth;  d.headJawAngleWidthVal.textContent = fmtSignedPercent(p.jawAngleWidth);
  }

  function init() {
    const d = window.dom;
    bind(d.headTopShift, d.headTopShiftVal, 'topShift', fmtSignedPercent);
    bind(d.headBottomShift, d.headBottomShiftVal, 'bottomShift', fmtSignedPercent);
    bind(d.headWidthMul, d.headWidthMulVal, 'widthMul', (v) => Math.round(v * 100));
    bind(d.headRadiusMul, d.headRadiusMulVal, 'radiusMul', (v) => Math.round(v * 100));
    bind(d.headChinShift, d.headChinShiftVal, 'chinHeightShift', fmtSignedPercent);
    bind(d.headChinWidth, d.headChinWidthVal, 'chinWidth', (v) => Math.round(v * 100));
    bind(d.headJawAttach, d.headJawAttachVal, 'jawAttach', fmtSignedPercent);
    bind(d.headJawLength, d.headJawLengthVal, 'jawLength', (v) => Math.round(v * 100));
    bind(d.headJawAngleWidth, d.headJawAngleWidthVal, 'jawAngleWidth', fmtSignedPercent);
  }

  window.HeadBindings = { init, sync, fmtSignedPercent };
})();
