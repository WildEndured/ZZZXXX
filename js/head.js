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
  //  Круг черепа по умолчанию: от L0 до L3 (диаметр 3/5 headH).
  //  Подбородок: горизонтальная линия на L4.
  //  Челюсть: от «широчайших» точек круга (с учётом высоты крепления)
  //           вниз на «длину челюсти», затем диагонали к краям подбородка.

  const NS = 'http://www.w3.org/2000/svg';

  const Head = {
    name: 'head',

    // ------- Параметры (управляются ползунками) -------
    params: {
      // Круг
      topOffset: 0,     // сдвиг L0 по Y (в долях headH), диапазон [-0.5 .. 0.5]
      bottomOffset: 0,  // сдвиг L3 по Y (в долях headH), диапазон [-0.5 .. 0.5]
      widthMul: 1.0,    // множитель ширины по X
      radiusMul: 1.0,   // общий множитель радиуса

      // Подбородок
      chinYOffset: 0,   // сдвиг L4 по Y (в долях headH)
      chinWidth: 0.55,  // ширина подбородка (доля от ширины круга)

      // Челюсть
      jawAttach: 0.5,   // высота крепления к кругу (0..1, где 0 — верх, 1 — низ)
      jawLength: 0.4,   // длина спуска (в долях headH)
      jawCorner: 0.15,  // ширина углов челюсти (в долях headH)
    },

    // ------- Геометрия, приходящая из main.js -------
    geom: {
      centerX: 2048,
      topY: 0,
      headH: 0,
    },

    // ------- Контейнеры SVG -------
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

    // ------- Вычисление ключевых точек -------
    //
    //  Возвращает объект с координатами всех опорных точек
    //  в системе холста, с учётом ползунков.
    compute() {
      const { centerX, topY, headH } = this.geom;
      const p = this.params;

      const H = headH;

      // Базовые Y для уровней L0..L5
      // (используем их, чтобы соблюсти «математическую сетку»)
      // L0 — макушка, L3 — низ круга, L4 — подбородок.
      const L0 = topY + H * 0 + p.topOffset * H;
      const L1 = topY + H * (1 / 5);
      const L2 = topY + H * (2 / 5);
      const L3 = topY + H * (3 / 5) + p.bottomOffset * H;
      const L4 = topY + H * (4 / 5) + p.chinYOffset * H;
      const L5 = topY + H * (5 / 5);

      // Круг: центр по X = centerX, по Y = середина между L0 и L3
      const circleTop = L0;
      const circleBottom = L3;
      const cyBase = (circleTop + circleBottom) / 2;
      let ry = Math.abs(circleBottom - circleTop) / 2;
      ry *= p.radiusMul;

      // Ширина: радиус по X = ry по умолчанию (круг),
      // затем множитель ширины.
      let rx = ry * p.widthMul;

      const cx = centerX;

      // «Широчайшие» точки круга для крепления челюсти:
      // высота крепления задаётся jawAttach (0 — верх круга, 1 — низ круга).
      // Точка на эллипсе: x = cx ± rx*sqrt(1 - t^2), y = cy + ry*t,
      // где t = (2*jawAttach - 1) — нормировано в [-1 .. 1].
      const t = 2 * p.jawAttach - 1;       // -1 сверху, +1 снизу
      const attachY = cyBase + ry * t;
      const cosArg = Math.max(0, 1 - t * t);
      const attachDx = rx * Math.sqrt(cosArg);

      const attachLeft = { x: cx - attachDx, y: attachY };
      const attachRight = { x: cx + attachDx, y: attachY };

      // Углы челюсти: от точек крепления спускаемся вниз на jawLength*H
      // и отводим по X на jawCorner*H.
      const jawLen = p.jawLength * H;
      const jawCorner = p.jawCorner * H;

      const cornerLeft = {
        x: attachLeft.x - jawCorner,
        y: attachLeft.y + jawLen,
      };
      const cornerRight = {
        x: attachRight.x + jawCorner,
        y: attachRight.y + jawLen,
      };

      // Подбородок: горизонтальная линия на L4,
      // ширина — chinWidth * (2*rx) (доля от полной ширины круга).
      const chinHalf = rx * p.chinWidth;
      const chinY = L4;
      const chinLeft = { x: cx - chinHalf, y: chinY };
      const chinRight = { x: cx + chinHalf, y: chinY };

      return {
        // Уровни (для отладки/дальнейших этапов)
        levels: { L0, L1, L2, L3, L4, L5 },

        // Круг
        circle: { cx, cy: cyBase, rx, ry },

        // Челюсть
        attachLeft, attachRight,
        cornerLeft, cornerRight,

        // Подбородок
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
      // Линия: attachLeft -> cornerLeft, attachRight -> cornerRight
      //        cornerLeft -> chinLeft,  cornerRight -> chinRight
      // (диагонали идут к краям подбородка)
      this.groups.jaw.innerHTML = '';

      const jawPath = document.createElementNS(NS, 'path');
      const d = [
        // левая сторона
        `M ${g.attachLeft.x} ${g.attachLeft.y}`,
        `L ${g.cornerLeft.x} ${g.cornerLeft.y}`,
        `L ${g.chinLeft.x} ${g.chinLeft.y}`,
        // правая сторона (собираем в обратном порядке для симметрии)
        `M ${g.attachRight.x} ${g.attachRight.y}`,
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
