/* js/modules/torso-bindings.js — UI-биндинги торса и трапеций */

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
      if (!window.Torso) return;
      window.Torso.setParams({ [key]: v });
      valEl.textContent = format(v);
      window.applyState();
    });
  }

  function sync() {
    if (!window.Torso) return;
    const p = window.Torso.getParams();
    const d = window.dom;

    d.torsoNeckWidth.value = p.neckWidth;              d.torsoNeckWidthVal.textContent = Math.round(p.neckWidth * 100);
    d.torsoChestWidth.value = p.chestWidth;            d.torsoChestWidthVal.textContent = Math.round(p.chestWidth * 100);
    d.torsoChestHeightCorr.value = p.chestHeightCorr;  d.torsoChestHeightCorrVal.textContent = fmtSignedPercent(p.chestHeightCorr);
    d.torsoChestTop.value = p.topNarrow;               d.torsoChestTopVal.textContent = Math.round(p.topNarrow * 100);
    d.torsoChestBottom.value = p.bottomWide;           d.torsoChestBottomVal.textContent = Math.round(p.bottomWide * 100);
    d.torsoPelvisWidthCorr.value = p.pelvisWidthCorr;  d.torsoPelvisWidthCorrVal.textContent = fmtSignedPercent(p.pelvisWidthCorr);
    d.torsoPelvisHeightCorr.value = p.pelvisHeightCorr;d.torsoPelvisHeightCorrVal.textContent = fmtSignedPercent(p.pelvisHeightCorr);
    d.torsoPelvisRounding.value = p.pelvisRounding;    d.torsoPelvisRoundingVal.textContent = Math.round(p.pelvisRounding * 100);

    d.torsoTrapNeckAttach.value = p.trapNeckAttach;
    d.torsoTrapNeckAttachVal.textContent = Math.round(p.trapNeckAttach * 100);
    d.torsoTrapShoulderAttach.value = p.trapShoulderAttach;
    d.torsoTrapShoulderAttachVal.textContent = Math.round(p.trapShoulderAttach);
  }

  function init() {
    const d = window.dom;
    bind(d.torsoNeckWidth, d.torsoNeckWidthVal, 'neckWidth', (v) => Math.round(v * 100));
    bind(d.torsoChestWidth, d.torsoChestWidthVal, 'chestWidth', (v) => Math.round(v * 100));
    bind(d.torsoChestHeightCorr, d.torsoChestHeightCorrVal, 'chestHeightCorr', fmtSignedPercent);
    bind(d.torsoChestTop, d.torsoChestTopVal, 'topNarrow', (v) => Math.round(v * 100));
    bind(d.torsoChestBottom, d.torsoChestBottomVal, 'bottomWide', (v) => Math.round(v * 100));
    bind(d.torsoPelvisWidthCorr, d.torsoPelvisWidthCorrVal, 'pelvisWidthCorr', fmtSignedPercent);
    bind(d.torsoPelvisHeightCorr, d.torsoPelvisHeightCorrVal, 'pelvisHeightCorr', fmtSignedPercent);
    bind(d.torsoPelvisRounding, d.torsoPelvisRoundingVal, 'pelvisRounding', (v) => Math.round(v * 100));
    bind(d.torsoTrapNeckAttach, d.torsoTrapNeckAttachVal, 'trapNeckAttach', (v) => Math.round(v * 100));
    bind(d.torsoTrapShoulderAttach, d.torsoTrapShoulderAttachVal, 'trapShoulderAttach', (v) => Math.round(v));
  }

  window.TorsoBindings = { init, sync, fmtSignedPercent };
})();
