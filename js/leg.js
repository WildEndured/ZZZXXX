/* js/leg.js — Этап 2: Ноги (колени и лодышки) */

(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  const params = {
    // Радиусы
    kneeRadius: 0.09,
    ankleRadius: 0.06,

    // Смещения для левой ноги (в долях headH)
    leftKneeX: 0, leftKneeY: 0,
    leftAnkleX: 0, leftAnkleY: 0,

    // Смещения для правой ноги
    rightKneeX: 0, rightKneeY: 0,
    rightAnkleX: 0, rightAnkleY: 0,
  };

  const DEFAULT_PARAMS = Object.freeze({ ...params });
  let els = null;

  function ensureDom() {
    if (els) return els;
    const legL = document.getElementById('legLeftGroup');
    const legR = document.getElementById('legRightGroup');
    const headsLayer = document.getElementById('headsLayer');
    if (!legL || !legR || !headsLayer) return null;

    let grid = document.getElementById('legGridLayer');
    if (!grid) {
      grid = document.createElementNS(NS, 'g');
      grid.setAttribute('id', 'legGridLayer');
      grid.setAttribute('class', 'no-export');
      headsLayer.appendChild(grid);
    }
    els = { legL, legR, headsLayer, grid };
    return els;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function svgEl(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function drawLegs(geo) {
    const torso = window.Torso && window.Torso.lastGeometry;
    if (!torso) return;

    const { legL, legR, grid } = els;
    clear(legL);
    clear(legR);
    clear(grid);

    const headH = torso.headH;
    const canvasH = geo.canvas;
    const canvasW = geo.canvas;

    // Базовые координаты левой ноги (из твоих точек на скриншоте)
    // Переводим нормализованные координаты в пиксели
    const leftAnkleBaseX = 0.4804 * canvasW;
    const leftAnkleBaseY = 0.8868 * canvasH;
    const leftKneeBaseX = 0.4652 * canvasW;
    const leftKneeBaseY = 0.6789 * canvasH;

    // Зеркальные координаты для правой ноги
    const rightAnkleBaseX = (1 - 0.4804) * canvasW; // 0.5196 * canvasW
    const rightAnkleBaseY = leftAnkleBaseY;
    const rightKneeBaseX = (1 - 0.4652) * canvasW; // 0.5348 * canvasW
    const rightKneeBaseY = leftKneeBaseY;

    // Применяем смещения из ползунков (в долях headH)
    const leftAnkleX = leftAnkleBaseX + params.leftAnkleX * headH;
    const leftAnkleY = leftAnkleBaseY + params.leftAnkleY * headH;
    const leftKneeX = leftKneeBaseX + params.leftKneeX * headH;
    const leftKneeY = leftKneeBaseY + params.leftKneeY * headH;

    const rightAnkleX = rightAnkleBaseX + params.rightAnkleX * headH;
    const rightAnkleY = rightAnkleBaseY + params.rightAnkleY * headH;
    const rightKneeX = rightKneeBaseX + params.rightKneeX * headH;
    const rightKneeY = rightKneeBaseY + params.rightKneeY * headH;

    const kneeRadius = params.kneeRadius * headH;
    const ankleRadius = params.ankleRadius * headH;

    // Рисуем левую ногу
    legL.appendChild(svgEl('circle', { cx: leftKneeX, cy: leftKneeY, r: kneeRadius, fill: 'none' }));
    legL.appendChild(svgEl('circle', { cx: leftAnkleX, cy: leftAnkleY, r: ankleRadius, fill: 'none' }));

    // Рисуем правую ногу
    legR.appendChild(svgEl('circle', { cx: rightKneeX, cy: rightKneeY, r: kneeRadius, fill: 'none' }));
    legR.appendChild(svgEl('circle', { cx: rightAnkleX, cy: rightAnkleY, r: ankleRadius, fill: 'none' }));

    // Отладочные маркеры
    const mR = headH * 0.012;
    const markers = [
      { x: leftKneeX, y: leftKneeY, c: '#f59e0b' },
      { x: leftAnkleX, y: leftAnkleY, c: '#16a34a' },
      { x: rightKneeX, y: rightKneeY, c: '#f59e0b' },
      { x: rightAnkleX, y: rightAnkleY, c: '#16a34a' },
    ];
    for (const pt of markers) {
      grid.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: mR, fill: pt.c, opacity: 0.85 }));
    }
  }

  function update(geo) {
    if (!ensureDom()) return;
    drawLegs(geo);
  }

  function getParams() { return { ...params }; }
  function setParams(patch) {
    if (!patch) return;
    for (const k in params) {
      if (typeof patch[k] === 'number' && isFinite(patch[k])) params[k] = patch[k];
    }
  }
  function resetParams() { Object.assign(params, DEFAULT_PARAMS); }

  window.Leg = { update, getParams, setParams, resetParams, DEFAULT_PARAMS };
})();
