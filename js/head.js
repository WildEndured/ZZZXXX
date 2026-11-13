(function () {
  'use strict';

  // ============================================================
  //  Голова — математическая сетка и отрисовка
  // ============================================================
  //
  //  Пространство одной головы (высота headH) делится на 5 сегментов:
  //    L0 = 0/5  — макушка
  //    L1 = 1/5  — верхняя граница
  //    L2 = 2/5  — центр
  //    L3 = 3/5  — нижняя граница круга
  //    L4 = 4/5  — линия подбородка
  //    L5 = 5/5  — основание шеи
  //
  //  Круг черепа: от L0 до L3 (диаметр 3/5 headH).
  //  Подбородок: горизонтальная линия на L4.
  //  Челюсть:
  //    - Точка крепления фиксирована на «широчайших» точках круга
  //      (экватор эллипса: y = cy, x = cx ± rx).
  //    - От неё вниз идёт вертикальный спуск (длина = jawDrop * headH).
  //    - От конца спуска — отвод в стороны (ширина углов = jawCorner * headH).
  //    - От углов — диагонали к краям подбородка.

  const NS = 'http://www.w3.org/2000/svg';

  const Head = {
    name: 'head',

    // ------- Параметры (управляются ползунками) -------
    params: {
      // Круг
      topOffset: 0,     // сдвиг L0 (в долях headH)
      bottomOffset: 0,  // сдвиг L3 (в долях headH)
      widthMul: 1.0,    // множитель ширины по X
      radiusMul: 1.0,   // общий множитель радиуса

      // Подбородок
      chinYOffset: 0,   // сдвиг L4 (в долях headH)
      chinWidth: 0.55,  // ширина подбородка (доля от ширины круга)

      // Челюсть
      jawDrop: 0.15,    // ДЛИНА вертикального спуска от круга (доля headH)
      jawCorner: 0.15,  // ширина углов челюсти (доля headH)
    },

    // ------- Геометрия из main.js -------
    geom: {
      centerX: 2048,
      topY: 0,
      headH: 0,
    },

    // ------- SVG-контейнеры -------
    groups: {
      skull: null,
      chin: null,
      jaw: null,
    },

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

    // ------- Вычисление опорных точек -------
    compute() {
      const { centerX, topY, headH } = this.geom;
      const p = this.params;

      const H = headH;

      // Уровни сетки
      const L0 = topY + H * 0 + p.topOffset * H;
      const L1 = topY + H * (1 / 5);
      const L2 = topY + H * (2 / 5);
      const L3 = topY + H * (3 / 5) + p.bottomOffset * H;
      const L4 = topY + H * (4 / 5) + p.chinYOffset * H;
      const L5 = topY + H * (5 / 5);

      // Круг: центр между L0 и L3
      const circleTop = L0;
      const circleBottom = L3;
      const cyBase = (circleTop + circleBottom) / 2;
      let ry = Math.abs(circleBottom - circleTop) / 2;
      ry *= p.radiusMul;
      let rx = ry * p.widthMul;

      const cx = centerX;

      // ---- Челюсть ----
      // Точка крепления — на экваторе эллипса (касательные вертикальны).
      const attachY = cyBase;
      const attachLeft  = { x: cx - rx, y: attachY };
      const attachRight = { x: cx + rx, y: attachY };

      // Вертикальный спуск: ползунок jawDrop задаёт ДЛИНУ линии.
      const dropLen = p.jawDrop * H;
      const dropLeft  = { x: attachLeft.x,  y: attachLeft.y  + dropLen };
      const dropRight = { x: attachRight.x, y: attachRight.y + dropLen };

      // Ширина углов: отвод по X от конца спуска.
      const jawCorner = p.jawCorner * H;
      const cornerLeft  = { x: dropLeft.x  - jawCorner, y: dropLeft.y  };
      const cornerRight = { x: dropRight.x + jawCorner, y: dropRight.y };

      // ---- Подбородок ----
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

    // ------- Отрисовка -------
    build() {
      if (!this.groups.skull) return;

      const g = this.compute();

      // ---- Круг черепа ----
      this.groups.skull.innerHTML = '';
      const circle = document.createElementNS(NS, 'ellipse');
      circle.setAttribute('cx', g.circle.cx);
      circle.setAttribute('cy', g.circle.cy);
      circle.setAttribute('rx', g.circle.rx);
      circle.setAttribute('ry', g.circle.ry);
      this.groups.skull.appendChild(circle);

      // ---- Челюсть ----
      // Путь:
      //   attachLeft → dropLeft → cornerLeft → chinLeft
      //   attachRight → dropRight → cornerRight → chinRight
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

      // ---- Подбородок ----
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
