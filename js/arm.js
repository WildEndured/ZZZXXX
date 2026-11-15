/* js/arm.js — Этап 2: Плечи (два круга между T0 и T1) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  let els = null;

  function ensureDom() {
    if (els) return els;
    const leftGroup = document.getElementById('armLeftGroup');
    const rightGroup = document.getElementById('armRightGroup');
    if (!leftGroup || !rightGroup) return null;

    els = { leftGroup, rightGroup };
    return els;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function drawArms() {
    if (!ensureDom()) return;

    const torsoGeo = window.Torso && window.Torso.lastGeometry;
    if (!torsoGeo) return;

    const { leftGroup, rightGroup } = els;
    clear(leftGroup);
    clear(rightGroup);

    const { shoulderRadius, shoulderCy, shoulderLeftCx, shoulderRightCx } = torsoGeo;

    // Левое плечо
    leftGroup.appendChild(svgEl('circle', {
      cx: shoulderLeftCx,
      cy: shoulderCy,
      r: shoulderRadius,
      fill: 'none',
    }));

    // Правое плечо
    rightGroup.appendChild(svgEl('circle', {
      cx: shoulderRightCx,
      cy: shoulderCy,
      r: shoulderRadius,
      fill: 'none',
    }));
  }

  function update(geo) {
    drawArms();
  }

  window.Arm = { update };
})();
