(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // ============================================================
  //  Параметры головы (сетка L0..L5)
  // ============================================================
  const HEAD_PARAMS = [
    // --- Круг (Верхняя часть) ---
    { group: 'Верх головы',
      key: 'topOffset',    label: 'Верх головы (L0)',  min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'bottomOffset', label: 'Низ круга (L3)',   min: -0.4, max: 0.4, step: 0.01, def: 0 },
    { key: 'widthMul',     label: 'Ширина головы',     min: 0.5,  max: 2.0, step: 0.01, def: 1.0 },
    { key: 'radiusMul',    label: 'Радиус головы',     min: 0.5,  max: 2.0, step: 0.01, def: 1.0 },

    // --- Челюсть и подбородок ---
    { group: 'Челюсть',
      key: 'jawWidth',     label: 'Ширина челюсти',    min: 0.1,  max: 1.5, step: 0.01, def: 0.85 },
    { key: 'chinWidth',    label: 'Ширина подбородка',  min: 0,    max: 1.0, step: 0.01, def: 0.35 },
    { key: 'chinYOffset',  label: 'Высота подбородка',  min: -0.4, max: 0.4, step: 0.01, def: 0 },
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

    // Группы для отрисовки. Разделим их по цветам, как на референсе.
    groups: { 
      grid: null, 
      partTop: null,   // Красная дуга
      partSide: null,  // Синие бока
      partJaw: null,   // Желтая челюсть
      partChin: null   // Зеленый подбородок
    },

    init(container) {
      container.innerHTML = '';

      this.groups.grid = document.createElementNS(NS, 'g');
      this.groups.grid.setAttribute('data-part', 'head-grid');
      this.groups.grid.setAttribute('fill', 'none');

      this.groups.partTop = document.createElementNS(NS, 'g');
      this.groups.partSide = document.createElementNS(NS, 'g');
      this.groups.partJaw = document.createElementNS(NS, 'g');
      this.groups.partChin = document.createElementNS(NS, 'g');

      container.appendChild(this.groups.grid);
      container.appendChild(this.groups.partTop);
      container.appendChild(this.groups.partSide);
      container.appendChild(this.groups.partJaw);
      container.appendChild(this.groups.partChin);

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

    compute() {
      const { cx } = this.cell;
      const p = this.shape;
      const lv = this.levels();

      // --- 1. Верхний круг (череп) ---
      const circleTop = lv.L0;
      const circleBottom = lv.L3;
      const cy = (circleTop + circleBottom) / 2;
      const ry0 = Math.abs(circleBottom - circleTop) / 2;
      const ry = ry0 * p.radiusMul;
      const rx = ry0 * p.widthMul * p.radiusMul;

      // --- 2. Боковые точки перехода (где круг превращается в щеки) ---
      // Берем уровень чуть ниже центра (L2.5)
      const cheekY = cy + ry * 0.7;
      // Вычисляем X на эллипсе для этой Y, чтобы дуга плавно переходила в линию
      const dy = cheekY - cy;
      const dx = rx * Math.sqrt(Math.max(0, 1 - (dy*dy)/(ry*ry)));
      
      const leftCheek = { x: cx - dx, y: cheekY };
      const rightCheek = { x: cx + dx, y: cheekY };

      // --- 3. Углы челюсти (уровень L4) ---
      const jawY = lv.L4;
      // Ширина челюсти контролируется ползунком. 
      // Ограничиваем, чтобы челюсть не была шире самого черепа.
      const jawHalfWidth = Math.min(rx, rx * p.jawWidth);
      const leftJaw = { x: cx - jawHalfWidth, y: jawY };
      const rightJaw = { x: cx + jawHalfWidth, y: jawY };

      // --- 4. Подбородок (уровень L5) ---
      const eps = Math.max(1, this.cell.h * 0.002);
      const rawChinY = lv.L5 + p.chinYOffset * lv.step;
      const chinY = Math.min(lv.L5, Math.max(lv.L3 + eps, rawChinY));
      
      // Ширина кончика подбородка (зеленая линия)
      const chinHalf = Math.max(0, Math.min(1, p.chinWidth)) * jawHalfWidth;
      const chinLeft  = { x: cx - chinHalf, y: chinY };
      const chinRight = { x: cx + chinHalf, y: chinY };
      
      // Точка притяжения для создания скругления (зеленый изгиб)
      const chinCenter = { x: cx, y: chinY + lv.step * 0.1 };

      // --- 5. Формирование SVG Path строк ---

      // Верхняя дуга (Красная)
      // M (Move to) левый висок -> A (Arc) до правого виска
      const pathTop = `
        M ${leftCheek.x} ${leftCheek.y}
        A ${rx} ${ry} 0 1 1 ${rightCheek.x} ${rightCheek.y}
      `;

      // Бока (Синие)
      // Линия от виска к углу челюсти
      const pathSide = `
        M ${leftCheek.x} ${leftCheek.y} L ${leftJaw.x} ${leftJaw.y}
        M ${rightCheek.x} ${rightCheek.y} L ${rightJaw.x} ${rightJaw.y}
      `;

      // Челюсть (Желтая)
      // Линия от угла челюсти к началу скругления подбородка
      const pathJaw = `
        M ${leftJaw.x} ${leftJaw.y} L ${chinLeft.x} ${chinLeft.y}
        M ${rightJaw.x} ${rightJaw.y} L ${chinRight.x} ${chinRight.y}
      `;

      // Подбородок (Зеленая)
      // Квадратичная кривая (Q), изогнутая вниз для плавного кончика
      const pathChin = `
        M ${chinLeft.x} ${chinLeft.y}
        Q ${chinCenter.x} ${chinCenter.y} ${chinRight.x} ${chinRight.y}
      `;

      return {
        levels: lv,
        paths: {
          top: pathTop.trim(),
          side: pathSide.trim(),
          jaw: pathJaw.trim(),
          chin: pathChin.trim()
        }
      };
    },

    build() {
      if (!this.groups.partTop) return;
      
      const g = this.compute();
      const strokePx = Math.max(0.5, this.line * this.cell.h);

      // --- Сетка L0..L5 ---
      this.groups.grid.innerHTML = '';
      this.groups.grid.setAttribute('stroke', '#b8bfcc');
      this.groups.grid.setAttribute('stroke-width', '2');
      this.groups.grid.setAttribute('stroke-dasharray', '18 14');
      for (const key of ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']) {
        const y = g.levels[key];
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('x2', 4096);
        line.setAttribute('y1', y);
        line.setAttribute('y2', y);
        this.groups.grid.appendChild(line);
      }

      // --- Отрисовка контура ---
      // Вспомогательная функция для создания path элемента
      const createPath = (d, color) => {
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('d', d);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', color);
        el.setAttribute('stroke-width', strokePx);
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        return el;
      };

      // Очищаем старые элементы
      this.groups.partTop.innerHTML = '';
      this.groups.partSide.innerHTML = '';
      this.groups.partJaw.innerHTML = '';
      this.groups.partChin.innerHTML = '';

      // Добавляем новые (цвета подобраны под референс)
      this.groups.partTop.appendChild(createPath(g.paths.top, '#ff0000'));   // Красный
      this.groups.partSide.appendChild(createPath(g.paths.side, '#0088ff')); // Синий
      this.groups.partJaw.appendChild(createPath(g.paths.jaw, '#ffcc00'));   // Желтый
      this.groups.partChin.appendChild(createPath(g.paths.chin, '#00cc44')); // Зеленый
    },
  };

  window.Head = Head;
})();
