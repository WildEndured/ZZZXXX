(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // ============================================================
  //  Каталог параметров головы
  //  Модель: сетка L0..L5 (5 равных сегментов headH)
  // ============================================================
  const HEAD_PARAMS = [
    // --- Круг ---
    { group: 'Круг',
      key: 'topOffset',     label: 'Верх головы (L0)',       min: -0.5, max: 0.5, step: 0.01, def: 0 },
    { key: 'bottomOffset',  label: 'Низ головы (L3)',         min: -0.5, max: 0.5, step: 0.01, def: 0 },
    { key: 'widthMul',      label: 'Ширина головы',           min: 0.5,  max: 2.0, step: 0.01, def: 1.0, unit: '%' },
    { key: 'radiusMul',     label: 'Радиус головы',           min: 0.5,  max: 2.0, step: 0.01, def: 1.0, unit: '%' },

    // --- Подбородок ---
    { group: 'Подбородок',
      key: 'chinYOffset',   label: 'Высота подбородка (L4)',  min: -0.5, max: 0.5, step: 0.01, def: 0 },
    { key: 'chinWidth',     label: 'Ширина подбородка',       min: 0.05, max: 1.5, step: 0.01, def: 0.55, unit: '%' },

    // --- Челюсть ---
    { group: 'Челюсть',
      key: 'jawAttachY',    label: 'Высота крепления к голове', min: -0.5, max: 0.5, step: 0.01, def: 0 },
    { key: 'jawLength',     label: 'Длина челюсти',           min: 0,    max: 1.2, step: 0.01, def: 0.4 },
    { key: 'jawCorner',     label: 'Ширина углов челюсти',    min: 0,    max: 0.5, step: 0.01, def: 0.15 },
  ];

  // Толщина линии — отдельный параметр
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
    geom: { centerX: 2048, topY: 0, headH: 0 },

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

    update(geometry) {
      this.geom.centerX = geometry.centerX;
      this.geom.topY = geometry.topY;
      this.geom.headH = geometry.headHeight;
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

    // ---- Уровни L0..L5 (базовая система координат) ----
    levels() {
      const { topY, headH } = this.geom;
      const p = this.shape;
      const H = headH;

      // Базовые уровни (без смещений)
      const L0 = topY + 0 * (H / 5);
      const L1 = topY + 1 * (H / 5);
      const L2 = topY + 2 * (H / 5);
      const L3 = topY + 3 * (H / 5);
      const L4 = topY + 4 * (H / 5);
      const L5 = topY + 5 * (H / 5);

      // Со смещениями от ползунков
      return {
        L0: L0 + p.topOffset * H,
        L1,
        L2,
        L3: L3 + p.bottomOffset * H,
        L4: L4 + p.chinYOffset * H,
        L5,
        base: { L0, L1, L2, L3, L4, L5 },
        H,
      };
    },

    // ---- Опорные точки ----
    compute() {
      const { centerX: cx } = this.geom;
      const p = this.shape;
      const lv = this.levels();
      const H = lv.H;

      // --- Круг (эллипс) ---
      // По умолчанию занимает от L0 до L3: диаметр 3/5 H, радиус 3/10 H.
      // Центр по Y = (L0 + L3)/2, радиусы:
      //   ry = |L3 - L0| / 2
      //   rx = ry * widthMul
      // Общий множитель radiusMul применяем к обоим.
      const circleTop = lv.L0;
      const circleBottom = lv.L3;
      const cy = (circleTop + circleBottom) / 2;
      const ry = (Math.abs(circleBottom - circleTop) / 2) * p.radiusMul;
      const rx = (Math.abs(circleBottom - circleTop) / 2) * p.widthMul * p.radiusMul;
      const circle = { cx, cy, rx, ry, top: cy - ry, bottom: cy + ry };

      // --- «Широчайшие» точки круга с учётом высоты крепления ---
      // Идея: точки крепления челюсти находятся на боковой границе эллипса.
      // По умолчанию — на экваторе (y = cy). Ползунок jawAttachY сдвигает их
      // по Y в долях H; X пересчитывается так, чтобы точка оставалась на эллипсе.
      const attachY = cy + p.jawAttachY * H;
      // нормированное смещение по Y относительно ry
      const t = Math.max(-0.999, Math.min(0.999, (attachY - cy) / (ry || 1)));
      const attachDx = rx * Math.sqrt(1 - t * t);
      const attachLeft  = { x: cx - attachDx, y: attachY };
      const attachRight = { x: cx + attachDx, y: attachY };

      // --- Спуск челюсти (длина) ---
      const dropLen = p.jawLength * H;
      const dropLeft  = { x: attachLeft.x,  y: attachLeft.y  + dropLen };
      const dropRight = { x: attachRight.x, y: attachRight.y + dropLen };

      // --- Углы челюсти (отвод по X) ---
      const cornerDx = p.jawCorner * H;
      const cornerLeft  = { x: dropLeft.x  - cornerDx, y: dropLeft.y  };
      const cornerRight = { x: dropRight.x + cornerDx, y: dropRight.y };

      // --- Подбородок: горизонтальная линия на L4 ---
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

    // ---- Отрисовка ----
    build() {
      if (!this.groups.skull) return;
      const g = this.compute();
      const strokePx = Math.max(0.5, this.line * this.geom.headH);

      // Круг
      this.groups.skull.innerHTML = '';
      const circle = document.createElementNS(NS, 'ellipse');
      circle.setAttribute('cx', g.circle.cx);
      circle.setAttribute('cy', g.circle.cy);
      circle.setAttribute('rx', g.circle.rx);
      circle.setAttribute('ry', g.circle.ry);
      this.groups.skull.appendChild(circle);

      // Челюсть: A_left → drop_left → corner_left → chin_left
      //          A_right → drop_right → corner_right → chin_right
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

      // Подбородок: горизонтальная линия на L4
      this.groups.chin.innerHTML = '';
      const chin = document.createElementNS(NS, 'line');
      chin.setAttribute('x1', g.chinLeft.x);
      chin.setAttribute('y1', g.chinLeft.y);
      chin.setAttribute('x2', g.chinRight.x);
      chin.setAttribute('y2', g.chinRight.y);
      this.groups.chin.appendChild(chin);

      // Толщина / заливка
      for (const grp of [this.groups.skull, this.groups.jaw, this.groups.chin]) {
        grp.setAttribute('stroke-width', String(strokePx));
        grp.setAttribute('fill', 'none');
      }
    },
  };

  window.Head = Head;
})();
