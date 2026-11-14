(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // ============================================================
  //  Каталог параметров головы
  //  Модель: сетка L0..L5 (5 равных сегментов headH)
  // ============================================================
  const HEAD_PARAMS = [
    { group: 'Круг',
      key: 'topOffset',    label: 'Верх головы (L0)',  min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'bottomOffset', label: 'Низ головы (L3)',   min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'widthMul',     label: 'Ширина головы',     min: 0.5,  max: 2.0, step: 0.01, def: 1.0 },
    { key: 'radiusMul',    label: 'Радиус головы',     min: 0.5,  max: 2.0, step: 0.01, def: 1.0 },
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

  const Head = {
    name: 'head',
    PARAMS: HEAD_PARAMS,
    LINE_PARAM,
    defaultShape,
    clampShape,

    shape: defaultShape(),
    line: LINE_PARAM.def,

    cell: { top: 0, bottom: 0, h: 0, cx: 2048 },

    groups: { grid: null, skull: null },

    init(container) {
      container.innerHTML = '';

      this.groups.grid = document.createElementNS(NS, 'g');
      this.groups.grid.setAttribute('data-part', 'head-grid');

      this.groups.skull = document.createElementNS(NS, 'g');
      this.groups.skull.setAttribute('data-part', 'head-skull');

      container.appendChild(this.groups.grid);
      container.appendChild(this.groups.skull);

      this.build();
    },

    update(geometry) {
      this.cell.cx = geometry.centerX;
      this.cell.top = geometry.headTop;
      this.cell.bottom = geometry.headBottom;
      this.cell.h = geometry.headHeight;
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

    // ---- Уровни L0..L5 (5 сегментов headH) ----
    levels() {
      const { top, h } = this.cell;
      const p = this.shape;
      const step = h / 5;

      return {
        L0: top + 0 * step + p.topOffset * step,
        L1: top + 1 * step,
        L2: top + 2 * step,
        L3: top + 3 * step + p.bottomOffset * step,
        L4: top + 4 * step,
        L5: top + 5 * step,
        step,
        H: h,
      };
    },

    // ---- Круг ----
    compute() {
      const { cx } = this.cell;
      const p = this.shape;
      const lv = this.levels();

      const circleTop = lv.L0;
      const circleBottom = lv.L3;
      const cy = (circleTop + circleBottom) / 2;
      const ry0 = Math.abs(circleBottom - circleTop) / 2;

      const ry = ry0 * p.radiusMul;
      const rx = ry0 * p.widthMul * p.radiusMul;

      return {
        levels: lv,
        circle: { cx, cy, rx, ry },
      };
    },

    // ---- Отрисовка ----
    build() {
      if (!this.groups.skull) return;
      const g = this.compute();
      const strokePx = Math.max(0.5, this.line * this.cell.h);

      // Сетка L0..L5 (в экспорт не попадает — используется только визуально).
      this.groups.grid.innerHTML = '';
      this.groups.grid.setAttribute('stroke', '#b8bfcc');
      this.groups.grid.setAttribute('stroke-width', '2');
      this.groups.grid.setAttribute('stroke-dasharray', '18 14');
      this.groups.grid.setAttribute('fill', 'none');
      const lv = g.levels;
      for (const key of ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']) {
        const y = lv[key];
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('x2', 4096);
        line.setAttribute('y1', y);
        line.setAttribute('y2', y);
        this.groups.grid.appendChild(line);
      }

      // Круг
      this.groups.skull.innerHTML = '';
      const circle = document.createElementNS(NS, 'ellipse');
      circle.setAttribute('cx', g.circle.cx);
      circle.setAttribute('cy', g.circle.cy);
      circle.setAttribute('rx', g.circle.rx);
      circle.setAttribute('ry', g.circle.ry);
      this.groups.skull.appendChild(circle);

      this.groups.skull.setAttribute('stroke-width', String(strokePx));
      this.groups.skull.setAttribute('fill', 'none');
    },
  };

  window.Head = Head;
})();
