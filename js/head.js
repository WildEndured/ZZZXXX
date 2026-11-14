(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // ============================================================
  //  Параметры головы
  //  Круг + подбородок + челюсть (по референсу «Голова Лумиса»)
  // ============================================================
  const HEAD_PARAMS = [
    // --- Круг (сетка L0..L3) ---
    { group: 'Круг',
      key: 'topOffset',    label: 'Верх головы (L0)',  min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'bottomOffset', label: 'Низ головы (L3)',   min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'widthMul',     label: 'Ширина головы',     min: 0.5,  max: 2.0, step: 0.01, def: 1.0 },
    { key: 'radiusMul',    label: 'Радиус головы',     min: 0.5,  max: 2.0, step: 0.01, def: 1.0 },

    // --- Подбородок (L4) ---
    { group: 'Подбородок',
      key: 'chinYOffset',  label: 'Высота подбородка',  min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'chinWidth',    label: 'Ширина подбородка',  min: 0,    max: 1.0, step: 0.01, def: 0.22 },
    { key: 'chinRound',    label: 'Скругление подбородка', min: 0, max: 1.0, step: 0.01, def: 0.5 },

    // --- Челюсть (как в референсе) ---
    { group: 'Челюсть',
      key: 'jaw_start',    label: 'Ⓐ Начало челюсти',  min: -60, max: 60, step: 1, def: 0, unit: '°' },
    { key: 'jaw_len',      label: '⑦ Длина челюсти',   min: 0,   max: 1.2, step: 0.01, def: 0.4 },
    { key: 'jaw_tilt',     label: '⑦ Наклон челюсти',  min: -40, max: 70, step: 1, def: 10, unit: '°' },
    { key: 'jaw_x',        label: 'Ⓑ Ширина скулы',    min: 0.2, max: 0.95, step: 0.01, def: 0.62 },
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

  const rad = (d) => (d * Math.PI) / 180;

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

    cell: { top: 0, bottom: 0, h: 0, cx: 2048 },

    groups: { grid: null, skull: null, chin: null, jaw: null },

    init(container) {
      container.innerHTML = '';

      this.groups.grid = document.createElementNS(NS, 'g');
      this.groups.grid.setAttribute('data-part', 'head-grid');

      this.groups.jaw = document.createElementNS(NS, 'g');
      this.groups.jaw.setAttribute('data-part', 'head-jaw');

      this.groups.chin = document.createElementNS(NS, 'g');
      this.groups.chin.setAttribute('data-part', 'head-chin');

      this.groups.skull = document.createElementNS(NS, 'g');
      this.groups.skull.setAttribute('data-part', 'head-skull');

      container.appendChild(this.groups.grid);
      container.appendChild(this.groups.skull);
      container.appendChild(this.groups.jaw);
      container.appendChild(this.groups.chin);

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

    // ---- Уровни L0..L5 ----
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

    // ---- Круг + подбородок + челюсть ----
    compute() {
      const { cx } = this.cell;
      const p = this.shape;
      const lv = this.levels();

      // Круг: L0..L3
      const circleTop = lv.L0;
      const circleBottom = lv.L3;
      const cy = (circleTop + circleBottom) / 2;
      const ry0 = Math.abs(circleBottom - circleTop) / 2;
      const ry = ry0 * p.radiusMul;
      const rx = ry0 * p.widthMul * p.radiusMul;
      const circle = { cx, cy, rx, ry };

      // Подбородок на L4 (с клампом в (L3, L5))
      const eps = Math.max(1, this.cell.h * 0.002);
      const rawChinY = lv.L4 + p.chinYOffset * lv.step;
      const chinY = Math.min(lv.L5 - eps, Math.max(lv.L3 + eps, rawChinY));
      const chinHalf = Math.max(0, Math.min(1, p.chinWidth)) * rx;
      const chinLeft  = { x: cx - chinHalf, y: chinY };
      const chinRight = { x: cx + chinHalf, y: chinY };

      // =====================================================
      //  Челюсть — по логике референса
      // =====================================================
      // Ⓐ — точка на боковой границе круга.
      //     jaw_start = 0 → экватор (cx ± rx, cy).
      //     jaw_start > 0 → выше (ближе к макушке).
      //     jaw_start < 0 → ниже (ближе к L3).
      //     Поворот по эллипсу: (rx·cos θ, ry·sin θ), где θ = jaw_start°.
      const jStart = rad(p.jaw_start);
      const A_dx = rx * Math.cos(jStart);
      const A_dy = ry * Math.sin(jStart);
      const A_left  = { x: cx - A_dx, y: cy - A_dy }; // минус: экран Y растёт вниз
      const A_right = { x: cx + A_dx, y: cy - A_dy };

      // Ⓑ — от Ⓐ вниз на jaw_len·H с наклоном jaw_tilt
      //     от вертикали вниз (положительный → к центру, отрицательный → наружу)
      const jLen = p.jaw_len * this.cell.h;
      const tilt = rad(p.jaw_tilt);
      const B_dy = jLen * Math.cos(tilt);   // вертикальная составляющая
      const B_dx = jLen * Math.sin(tilt);   // горизонтальная составляющая

      // Ⓑ приводим к jaw_x·rx по X — параметр «Ширина скулы».
      // Если наклон отклоняет слишком далеко, клампим B в коридор по X.
      const B_half = Math.max(0, Math.min(1, p.jaw_x)) * rx;

      const B_left_base  = { x: A_left.x  + B_dx, y: A_left.y  + B_dy };
      const B_right_base = { x: A_right.x - B_dx, y: A_right.y + B_dy };

      // Клампим B по X: не выходим за пределы jaw_x·rx от центра
      const B_left  = { x: Math.min(cx - B_half, Math.max(cx - rx, B_left_base.x)),  y: B_left_base.y  };
      const B_right = { x: Math.max(cx + B_half, Math.min(cx + rx, B_right_base.x)), y: B_right_base.y };

      // Не ниже подбородка
      const dropY = Math.min(chinY, B_left.y);
      B_left.y  = dropY;
      B_right.y = dropY;

      return {
        levels: lv,
        circle,
        chin: { chinY, chinHalf, chinLeft, chinRight },
        jaw: {
          A_left, A_right,
          B_left, B_right,
          chinLeft, chinRight,
          round: p.chinRound,
        },
      };
    },

    // ---- Скруглённая линия A → B → C ----
    // (с упрощённым сглаживанием стыка B→C через round)
    buildJawSidePath(side) {
      // side = 1 (правая), -1 (левая)
      const isRight = side > 0;
      const A = isRight ? this._g.jaw.A_right : this._g.jaw.A_left;
      const B = isRight ? this._g.jaw.B_right : this._g.jaw.B_left;
      const C = isRight ? this._g.jaw.chinRight : this._g.jaw.chinLeft;

      // Длины сегментов
      const dAB = Math.hypot(B.x - A.x, B.y - A.y) || 1;
      const dBC = Math.hypot(C.x - B.x, C.y - B.y) || 1;

      // Радиус скругления в стыке B (зависит от chinRound)
      const r = this._g.jaw.round * this.cell.h * 0.06;
      const tB1 = Math.min(r / dAB, 0.45);
      const tB2 = Math.min(r / dBC, 0.45);

      // Точки «входа» и «выхода» скругления у B
      const B_in = {
        x: B.x + (A.x - B.x) * tB1,
        y: B.y + (A.y - B.y) * tB1,
      };
      const B_out = {
        x: B.x + (C.x - B.x) * tB2,
        y: B.y + (C.y - B.y) * tB2,
      };

      // Сборка: A → B_in → Q(B) → B_out → C
      return [
        `M ${A.x} ${A.y}`,
        `L ${B_in.x} ${B_in.y}`,
        `Q ${B.x} ${B.y} ${B_out.x} ${B_out.y}`,
        `L ${C.x} ${C.y}`,
      ].join(' ');
    },

    // ---- Отрисовка ----
    build() {
      if (!this.groups.skull) return;
      const g = this.compute();
      this._g = g;
      const strokePx = Math.max(0.5, this.line * this.cell.h);

      // Сетка L0..L5 (служебная, в экспорт не идёт)
      this.groups.grid.innerHTML = '';
      this.groups.grid.setAttribute('stroke', '#b8bfcc');
      this.groups.grid.setAttribute('stroke-width', '2');
      this.groups.grid.setAttribute('stroke-dasharray', '18 14');
      this.groups.grid.setAttribute('fill', 'none');
      for (const key of ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']) {
        const y = g.levels[key];
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

      // Челюсть: две симметричные половины A → B → C
      this.groups.jaw.innerHTML = '';
      const jawPath = document.createElementNS(NS, 'path');
      const d = this.buildJawSidePath(1) + ' ' + this.buildJawSidePath(-1);
      jawPath.setAttribute('d', d);
      jawPath.setAttribute('fill', 'none');
      this.groups.jaw.appendChild(jawPath);
      this.groups.jaw.setAttribute('stroke-width', String(strokePx));
      this.groups.jaw.setAttribute('fill', 'none');

      // Подбородок — горизонтальная линия на L4
      this.groups.chin.innerHTML = '';
      const chin = document.createElementNS(NS, 'line');
      chin.setAttribute('x1', g.chin.chinLeft.x);
      chin.setAttribute('y1', g.chin.chinLeft.y);
      chin.setAttribute('x2', g.chin.chinRight.x);
      chin.setAttribute('y2', g.chin.chinRight.y);
      this.groups.chin.appendChild(chin);
      this.groups.chin.setAttribute('stroke-width', String(strokePx));
      this.groups.chin.setAttribute('fill', 'none');
    },
  };

  window.Head = Head;
})();
