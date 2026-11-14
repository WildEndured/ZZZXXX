(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // ============================================================
  //  Параметры головы
  //  Модель: сетка L0..L5 (5 равных сегментов headH)
  // ============================================================
  const HEAD_PARAMS = [
    // --- Круг ---
    { group: 'Круг',
      key: 'topOffset',    label: 'Верх головы (L0)',  min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'bottomOffset', label: 'Низ головы (L3)',   min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'widthMul',     label: 'Ширина головы',     min: 0.5,  max: 2.0, step: 0.01, def: 1.0 },
    { key: 'radiusMul',    label: 'Радиус головы',     min: 0.5,  max: 2.0, step: 0.01, def: 1.0 },

    // --- Подбородок ---
    { group: 'Подбородок',
      key: 'chinYOffset',  label: 'Высота подбородка',  min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'chinWidth',    label: 'Ширина подбородка',  min: 0,    max: 1.0, step: 0.01, def: 0.55 },

    // --- Челюсть ---
    { group: 'Челюсть',
      key: 'jawAttachY',   label: 'Высота крепления',   min: 0,    max: 1.0, step: 0.01, def: 0 },
    { key: 'jawLength',    label: 'Длина челюсти',      min: 0,    max: 1.0, step: 0.01, def: 0.4 },
    { key: 'jawCorner',    label: 'Ширина углов',       min: 0,    max: 1.0, step: 0.01, def: 0.15 },
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

      // --- Круг: L0..L3 ---
      const circleTop = lv.L0;
      const circleBottom = lv.L3;
      const cy = (circleTop + circleBottom) / 2;
      const ry0 = Math.abs(circleBottom - circleTop) / 2;
      const ry = ry0 * p.radiusMul;
      const rx = ry0 * p.widthMul * p.radiusMul;
      const circle = { cx, cy, rx, ry };

      // --- Подбородок: на уровне L4 + сдвиг, клампим в (L3, L5) ---
      const eps = Math.max(1, this.cell.h * 0.002);
      const rawChinY = lv.L4 + p.chinYOffset * lv.step;
      const chinY = Math.min(lv.L5 - eps, Math.max(lv.L3 + eps, rawChinY));
      const chinHalf = Math.max(0, Math.min(1, p.chinWidth)) * rx;
      const chinLeft  = { x: cx - chinHalf, y: chinY };
      const chinRight = { x: cx + chinHalf, y: chinY };

      // --- Челюсть ---
      // 1) Высота крепления: не выше середины круга (cy), но не ниже L3.
      //    Параметр jawAttachY ∈ [0,1] линейно интерполирует от cy к L3.
      const attachMinY = cy;          // не выше середины
      const attachMaxY = lv.L3;       // не ниже низа круга
      const attachY = attachMinY + Math.max(0, Math.min(1, p.jawAttachY)) * (attachMaxY - attachMinY);

      // Точка на эллипсе по заданному Y.
      // (attachY - cy) / ry ∈ [-1, 1], если нет — обрезаем.
      const tRaw = ry > 0 ? (attachY - cy) / ry : 0;
      const t = Math.max(-1, Math.min(1, tRaw));
      const attachDx = rx * Math.sqrt(Math.max(0, 1 - t * t));
      const attachLeft  = { x: cx - attachDx, y: attachY };
      const attachRight = { x: cx + attachDx, y: attachY };

      // 2) Длина челюсти: спуск вниз, но не ниже подбородка (chinY).
      const dropRawLen = Math.max(0, Math.min(1, p.jawLength)) * this.cell.h;
      const dropTargetY = attachY + dropRawLen;
      const dropY = Math.min(chinY, dropTargetY); // не ниже подбородка
      const dropLeft  = { x: attachLeft.x,  y: dropY };
      const dropRight = { x: attachRight.x, y: dropY };

      // 3) Ширина углов: горизонтальный отвод.
      //    Не шире головы: |cornerX - cx| ≤ rx.
      //    Отвод в сторону (наружу): левая точка идёт влево, правая — вправо.
      const cornerDelta = Math.max(0, Math.min(1, p.jawCorner)) * rx; // 0..rx
      const cornerLeft  = { x: Math.max(cx - rx, dropLeft.x  - cornerDelta), y: dropY };
      const cornerRight = { x: Math.min(cx + rx, dropRight.x + cornerDelta), y: dropY };

      return {
        levels: lv,
        circle,
        chin: { chinY, chinHalf, chinLeft, chinRight },
        jaw: {
          attachLeft, attachRight,
          dropLeft, dropRight,
          cornerLeft, cornerRight,
          chinLeft, chinRight,
        },
      };
    },

    // ---- Отрисовка ----
    build() {
      if (!this.groups.skull) return;
      const g = this.compute();
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

      // Челюсть: A_left → drop_left → corner_left → chin_left
      //          A_right → drop_right → corner_right → chin_right
      this.groups.jaw.innerHTML = '';
      const j = g.jaw;
      const jawPath = document.createElementNS(NS, 'path');
      const d = [
        `M ${j.attachLeft.x} ${j.attachLeft.y}`,
        `L ${j.dropLeft.x} ${j.dropLeft.y}`,
        `L ${j.cornerLeft.x} ${j.cornerLeft.y}`,
        `L ${j.chinLeft.x} ${j.chinLeft.y}`,
        `M ${j.attachRight.x} ${j.attachRight.y}`,
        `L ${j.dropRight.x} ${j.dropRight.y}`,
        `L ${j.cornerRight.x} ${j.cornerRight.y}`,
        `L ${j.chinRight.x} ${j.chinRight.y}`,
      ].join(' ');
      jawPath.setAttribute('d', d);
      jawPath.setAttribute('fill', 'none');
      this.groups.jaw.appendChild(jawPath);
      this.groups.jaw.setAttribute('stroke-width', String(strokePx));
      this.groups.jaw.setAttribute('fill', 'none');

      // Подбородок
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
