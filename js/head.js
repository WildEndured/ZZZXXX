(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // ============================================================
  //  Каталог параметров головы
  //  Модель: сетка L0..L5 (5 равных сегментов headH)
  //  Голова занимает ровно 1 ячейку сетки "рост в головах":
  //    headTop  = topY + index * headH
  //    headBottom = headTop + headH
  // ============================================================
  const HEAD_PARAMS = [
    // --- Круг ---
    { group: 'Круг',
      key: 'topOffset',     label: 'Верх головы (L0)',       min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'bottomOffset',  label: 'Низ головы (L3)',         min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'widthMul',      label: 'Ширина головы',           min: 0.5,  max: 2.0, step: 0.01, def: 1.0, unit: '%' },
    { key: 'radiusMul',     label: 'Радиус головы',           min: 0.5,  max: 2.0, step: 0.01, def: 1.0, unit: '%' },

    // --- Подбородок ---
    { group: 'Подбородок',
      key: 'chinYOffset',   label: 'Высота подбородка (L4)',  min: -0.3, max: 0.3, step: 0.01, def: 0 },
    { key: 'chinWidth',     label: 'Ширина подбородка',       min: 0.05, max: 1.2, step: 0.01, def: 0.55, unit: '%' },

    // --- Челюсть ---
    { group: 'Челюсть',
      key: 'jawAttachY',    label: 'Высота крепления к голове', min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'jawLength',     label: 'Длина челюсти',           min: 0,    max: 0.8, step: 0.01, def: 0.4 },
    { key: 'jawCorner',     label: 'Ширина углов челюсти',    min: 0,    max: 0.4, step: 0.01, def: 0.15 },
  ];

  const LINE_PARAM = { key: 'line', label: 'Толщина линии', min: 0.001, max: 0.05, step: 0.001, def: 0.012 };

  function defaultShape() {
    const s = {};
    for (const p of HEAD_PARAMS) s[p.key] = p.def;
    return s;
  }

  function clampShape(input) {
    const s = defaultShape();
    if (!input || typeof input !== 'object') return s;
    for (const p of HEAD_PARAMS) {
      const v = Number(input[p.key]);
      s[p.key] = Number.isFinite(v) ? Math.min(p.max, Math.max(p.min, v)) : p.def;
    }
    return s;
  }

  // ============================================================
  //  Модуль головы
  // ============================================================
  const Head = {
    name: 'head',
    PARAMS: HEAD_PARAMS,
    LINE_PARAM,
    defaultShape,
    clampShape,

    shape: defaultShape(),
    line: LINE_PARAM.def,

    // Ячейка головы (1 из N в сетке "рост в головах")
    cell: { top: 0, bottom: 0, h: 0, cx: 2048 },

    groups: { skull: null, chin: null, jaw: null },

    init(container) {
      container.innerHTML = '';

      this.groups.skull = document.createElementNS(NS, 'g');
      this.groups.skull.setAttribute('data-part', 'skull');

      this.groups.jaw = document.createElementNS(NS, 'g');
      this.groups.jaw.setAttribute('data-part', 'jaw');

      this.groups.chin = document.createElementNS(NS, 'g');
      this.groups.chin.setAttribute('data-part', 'chin');

      container.appendChild(this.groups.skull);
      container.appendChild(this.groups.jaw);
      container.appendChild(this.groups.chin);

      this.build();
    },

    // geometry из main.js содержит headTop/headBottom/headH для ОДНОЙ головы
    update(geometry) {
      this.cell.cx = geometry.centerX;
      this.cell.top = geometry.headTop;
      this.cell.bottom = geometry.headBottom;
      this.cell.h = geometry.headH;
      this.build();
    },

    setLine(v) {
      const lp = LINE_PARAM;
      this.line = Math.min(lp.max, Math.max(lp.min, Number(v) || lp.def));
      this.build();
    },

    setShape(s) {
      this.shape = clampShape(s);
      this.build();
    },

    // ---- Уровни L0..L5, привязанные к ЯЧЕЙКЕ головы ----
    //  headTop = L0 (макушка ячейки), headBottom = L5 (основание шеи ячейки).
    //  headH = (headBottom - headTop).
    levels() {
      const { top, h } = this.cell;
      const p = this.shape;
      const H = h;
      const step = H / 5;

      const baseL0 = top;
      const baseL1 = top + step;
      const baseL2 = top + step * 2;
      const baseL3 = top + step * 3;
      const baseL4 = top + step * 4;
      const baseL5 = top + step * 5;

      return {
        L0: baseL0 + p.topOffset * step,
        L1: baseL1,
        L2: baseL2,
        L3: baseL3 + p.bottomOffset * step,
        L4: baseL4 + p.chinYOffset * step,
        L5: baseL5,
        base: { L0: baseL0, L1: baseL1, L2: baseL2, L3: baseL3, L4: baseL4, L5: baseL5 },
        H,
      };
    },

    compute() {
      const { cx } = this.cell;
      const p = this.shape;
      const lv = this.levels();
      const H = lv.H;

      // --- Круг: по умолчанию от L0 до L3 (3/5 headH) ---
      const circleTop = lv.L0;
      const circleBottom = lv.L3;
      const cy = (circleTop + circleBottom) / 2;
      const baseRy = Math.abs(circleBottom - circleTop) / 2;
      const ry = baseRy * p.radiusMul;
      const rx = baseRy * p.widthMul * p.radiusMul;
      const circle = { cx, cy, rx, ry };

      // --- Точки крепления челюсти на боковой границе эллипса ---
      //     jawAttachY сдвигает их по Y в долях шага (step), X на эллипсе.
      const step = H / 5;
      const attachY = cy + p.jawAttachY * step;
      const t = Math.max(-0.999, Math.min(0.999, (attachY - cy) / (ry || 1)));
      const attachDx = rx * Math.sqrt(1 - t * t);
      const attachLeft  = { x: cx - attachDx, y: attachY };
      const attachRight = { x: cx + attachDx, y: attachY };

      // --- Спуск челюсти ---
      const dropLen = p.jawLength * H;
      const dropLeft  = { x: attachLeft.x,  y: attachLeft.y  + dropLen };
      const dropRight = { x: attachRight.x, y: attachRight.y + dropLen };

      // --- Углы челюсти ---
      const cornerDx = p.jawCorner * H;
      const cornerLeft  = { x: dropLeft.x  - cornerDx, y: dropLeft.y  };
      const cornerRight = { x: dropRight.x + cornerDx, y: dropRight.y };

      // --- Подбородок на L4 ---
      const chinY = lv.L4;
      const chinHalf = p.chinWidth * rx;
      const chinLeft  = { x: cx - chinHalf, y: chinY };
      const chinRight = { x: cx + chinHalf, y: chinY };

      return {
        levels: lv,
        circle,
        attachLeft, attachRight,
        dropLeft, dropRight,
        cornerLeft, cornerRight,
        chinLeft, chinRight, chinY,
      };
    },

    build() {
      if (!this.groups.skull) return;
      const g = this.compute();
      const strokePx = Math.max(0.5, this.line * this.cell.h);

      // Круг
      this.groups.skull.innerHTML = '';
      const circle = document.createElementNS(NS, 'ellipse');
      circle.setAttribute('cx', g.circle.cx);
      circle.setAttribute('cy', g.circle.cy);
      circle.setAttribute('rx', g.circle.rx);
      circle.setAttribute('ry', g.circle.ry);
      this.groups.skull.appendChild(circle);

      // Челюсть
      this.groups.jaw.innerHTML = '';
      const jawPath = document.createElementNS(NS, 'path');
      const d = [
        `M ${g.attachLeft.x} ${g.attachLeft.y}`,
        `L ${g.dropLeft.x} ${g.dropLeft.y}`,
        `L ${g.cornerLeft.x} ${g.cornerLeft.y}`,
        `L ${g.chinLeft.x} ${g.chinLeft.y}`,
        `M ${g.attachRight.x} ${g.attachRight.y}`,
        `L ${g.dropRight.x} ${g.dropRight.y}`,
        `L ${g.cornerRight.x} ${g.cornerRight.y}`,
        `L ${g.chinRight.x} ${g.chinRight.y}`,
      ].join(' ');
      jawPath.setAttribute('d', d);
      jawPath.setAttribute('fill', 'none');
      this.groups.jaw.appendChild(jawPath);

      // Подбородок
      this.groups.chin.innerHTML = '';
      const chin = document.createElementNS(NS, 'line');
      chin.setAttribute('x1', g.chinLeft.x);
      chin.setAttribute('y1', g.chinLeft.y);
      chin.setAttribute('x2', g.chinRight.x);
      chin.setAttribute('y2', g.chinRight.y);
      this.groups.chin.appendChild(chin);

      for (const grp of [this.groups.skull, this.groups.jaw, this.groups.chin]) {
        grp.setAttribute('stroke-width', String(strokePx));
        grp.setAttribute('fill', 'none');
      }
    },
  };

  window.Head = Head;
})();
