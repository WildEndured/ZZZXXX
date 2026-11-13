(function () {
  'use strict';

  // ============================================================
  //  Голова — параметры, геометрия, отрисовка
  // ============================================================

  const NS = 'http://www.w3.org/2000/svg';

  // ------------------------------------------------------------
  //  Каталог параметров головы.
  //  Единый источник истины: из него строятся ползунки,
  //  дефолты, форматтеры и клампинг.
  // ------------------------------------------------------------
  const SHAPE_PARAMS = [
    { group: 'Круг',
      key: 'topOffset',    label: 'Верх головы (L0)',   min: -0.5, max: 0.5, step: 0.01, def: 0,    fmt: (v) => v.toFixed(2) },
    { key: 'bottomOffset', label: 'Низ головы (L3)',    min: -0.5, max: 0.5, step: 0.01, def: 0,    fmt: (v) => v.toFixed(2) },
    { key: 'widthMul',     label: 'Ширина головы',      min: 0.5,  max: 2.0, step: 0.01, def: 1,    fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'radiusMul',    label: 'Радиус головы',      min: 0.5,  max: 2.0, step: 0.01, def: 1,    fmt: (v) => `${Math.round(v * 100)}%` },

    { group: 'Подбородок',
      key: 'chinYOffset',  label: 'Высота подбородка',  min: -0.5, max: 0.5, step: 0.01, def: 0,    fmt: (v) => v.toFixed(2) },
    { key: 'chinWidth',    label: 'Ширина подбородка',  min: 0.1,  max: 1.0, step: 0.01, def: 0.55, fmt: (v) => `${Math.round(v * 100)}%` },

    { group: 'Челюсть',
      key: 'jawDrop',      label: 'Длина линии челюсти', min: 0,    max: 1.0, step: 0.01, def: 0.15, fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'jawCorner',    label: 'Ширина углов',        min: 0,    max: 0.5, step: 0.01, def: 0.15, fmt: (v) => `${Math.round(v * 100)}%` },
  ];

  function defaultShape() {
    const s = {};
    for (const p of SHAPE_PARAMS) s[p.key] = p.def;
    return s;
  }

  function clampShape(input) {
    const s = defaultShape();
    if (!input || typeof input !== 'object') return s;
    for (const p of SHAPE_PARAMS) {
      const v = Number(input[p.key]);
      s[p.key] = Number.isFinite(v)
        ? Math.min(p.max, Math.max(p.min, v))
        : p.def;
    }
    return s;
  }

  // ------------------------------------------------------------
  //  Модуль
  // ------------------------------------------------------------
  const Head = {
    name: 'head',
    SHAPE_PARAMS,
    defaultShape,
    clampShape,

    params: defaultShape(),

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

    // Опорные точки
    compute() {
      const { centerX, topY, headH } = this.geom;
      const p = this.params;
      const H = headH;

      const L0 = topY + H * 0 + p.topOffset * H;
      const L1 = topY + H * (1 / 5);
      const L2 = topY + H * (2 / 5);
      const L3 = topY + H * (3 / 5) + p.bottomOffset * H;
      const L4 = topY + H * (4 / 5) + p.chinYOffset * H;
      const L5 = topY + H * (5 / 5);

      const circleTop = L0;
      const circleBottom = L3;
      const cyBase = (circleTop + circleBottom) / 2;
      let ry = Math.abs(circleBottom - circleTop) / 2;
      ry *= p.radiusMul;
      const rx = ry * p.widthMul;
      const cx = centerX;

      // Экватор эллипса — «широчайшие» точки
      const attachY = cyBase;
      const attachLeft  = { x: cx - rx, y: attachY };
      const attachRight = { x: cx + rx, y: attachY };

      const dropLen = p.jawDrop * H;
      const dropLeft  = { x: attachLeft.x,  y: attachLeft.y  + dropLen };
      const dropRight = { x: attachRight.x, y: attachRight.y + dropLen };

      const jawCorner = p.jawCorner * H;
      const cornerLeft  = { x: dropLeft.x  - jawCorner, y: dropLeft.y  };
      const cornerRight = { x: dropRight.x + jawCorner, y: dropRight.y };

      const chinHalf = rx * p.chinWidth;
      const chinY = L4;
      const chinLeft  = { x: cx - chinHalf, y: chinY };
      const chinRight = { x: cx + chinHalf, y: chinY };

      return {
        levels: { L0, L1, L2, L3, L4, L5 },
        circle: { cx, cy: cyBase, rx, ry },
        attachLeft, attachRight,
        dropLeft, dropRight,
        cornerLeft, cornerRight,
        chinLeft, chinRight, chinY,
      };
    },

    build() {
      if (!this.groups.skull) return;
      const g = this.compute();

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
    },
  };

  window.Head = Head;
})();
