(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const HEAD_PARAMS = [
    { group: 'Круг',
      key: 'top',         label: 'Высота макушки',         min: 0.8,  max: 1.4,  step: 0.01, def: 1,    fmt: (v) => v.toFixed(2) },
    { key: 'r0',          label: '③ Размер круга',         min: 0.3,  max: 0.95, step: 0.01, def: 0.68, fmt: (v) => v.toFixed(2) },

    { group: 'Челюсть',
      key: 'jaw_start',   label: 'Ⓐ Начало челюсти',       min: -60,  max: 60,   step: 1,    def: 0,    unit: '°' },
    { key: 'jaw_len',     label: '⑦ Длина челюсти',        min: 0,    max: 1.2,  step: 0.01, def: 0.4,  fmt: (v) => v.toFixed(2) },
    { key: 'jaw_x',       label: 'Ⓑ Ширина скулы',         min: 0.2,  max: 0.95, step: 0.01, def: 0.62, fmt: (v) => v.toFixed(2) },

    { group: 'Подбородок',
      key: 'chin_len',    label: 'Ⓒ Высота подбородка',    min: 0.5,  max: 1.5,  step: 0.01, def: 1,    fmt: (v) => v.toFixed(2) },
    { key: 'chin_w',      label: 'Ⓒ Ширина подбородка',    min: 0.03, max: 0.6,  step: 0.01, def: 0.22, fmt: (v) => v.toFixed(2) },
    { key: 'chin_round',  label: 'Ⓒ Скругление подбородка', min: 0,   max: 1,    step: 0.01, def: 0.5,  fmt: (v) => v.toFixed(2) },
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
    geom: { centerX: 2048, topY: 0, headH: 0 },

    groups: { outline: null },

    init(container) {
      container.innerHTML = '';
      this.groups.outline = document.createElementNS(NS, 'g');
      this.groups.outline.setAttribute('data-part', 'head-outline');
      container.appendChild(this.groups.outline);
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

    // ---- Опорные точки (фронтальная проекция) ----
    compute() {
      const { centerX: cx, topY, headH } = this.geom;
      const p = this.shape;
      const H = headH;

      // Круг-череп (эллипс)
      const rx = p.r0 * H;
      const ry = p.r0 * H;
      const cy = topY + ry;               // центр по Y: верх эллипса = topY (при top=1)
      const topYellipse = cy - ry * p.top;
      const botYellipse = cy + ry;

      // Ⓐ — точка крепления челюсти на боковой границе круга
      //    jaw_start = 0 → экватор (cx ± rx, cy).
      //    jaw_start > 0 → ниже экватора, < 0 → выше.
      const jawAng = p.jaw_start * Math.PI / 180;
      const ax_off = rx * Math.cos(jawAng);
      const ay_off = ry * Math.sin(jawAng);
      const A_left  = { x: cx - ax_off, y: cy + ay_off };
      const A_right = { x: cx + ax_off, y: cy + ay_off };

      // Ⓑ — ширина скулы (смещение вниз от Ⓐ)
      const By = cy + ry + p.jaw_len * p.r0 * H * 0.5;
      const Bx_off = p.jaw_x * rx;
      const B_left  = { x: cx - Bx_off, y: By };
      const B_right = { x: cx + Bx_off, y: By };

      // Ⓒ — подбородок: уровень и ширина
      const chinY = cy + ry + p.chin_len * p.r0 * H * 0.5;
      const chinHalfW = p.chin_w * rx;
      const C_left  = { x: cx - chinHalfW, y: chinY };
      const C_right = { x: cx + chinHalfW, y: chinY };
      const chinBottom = { x: cx, y: chinY + p.chin_len * p.r0 * H * 0.3 };

      return {
        circle: { cx, cy, rx, ry, topY: topYellipse, botY: botYellipse },
        A_left, A_right,
        B_left, B_right,
        C_left, C_right,
        chinBottom,
        chinRound: p.chin_round,
      };
    },

    // ---- Хелпер: скруглённый путь через точки ----
    roundedPath(points, radius) {
      if (points.length < 2) return '';
      if (radius <= 0.01) {
        return points.map((p, i) => (i ? 'L' : 'M') + ` ${p.x} ${p.y}`).join(' ');
      }
      const d = [];
      for (let i = 0; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        if (!prev || !next) {
          d.push(`${i === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`);
          continue;
        }
        const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
        const r = Math.min(radius, d1 / 2, d2 / 2);
        const t1 = { x: curr.x + (prev.x - curr.x) * (r / d1), y: curr.y + (prev.y - curr.y) * (r / d1) };
        const t2 = { x: curr.x + (next.x - curr.x) * (r / d2), y: curr.y + (next.y - curr.y) * (r / d2) };
        d.push(i === 0 ? `M ${t1.x} ${t1.y}` : `L ${t1.x} ${t1.y}`);
        d.push(`Q ${curr.x} ${curr.y} ${t2.x} ${t2.y}`);
      }
      const last = points[points.length - 1];
      d.push(`L ${last.x} ${last.y}`);
      return d.join(' ');
    },

    // ---- Отрисовка ----
    build() {
      if (!this.groups.outline) return;
      const g = this.compute();
      const strokePx = Math.max(0.5, this.line * this.geom.headH);

      const outline = this.groups.outline;
      outline.innerHTML = '';
      outline.setAttribute('fill', 'none');
      outline.setAttribute('stroke', 'currentColor');
      outline.setAttribute('stroke-width', String(strokePx));
      outline.setAttribute('stroke-linecap', 'round');
      outline.setAttribute('stroke-linejoin', 'round');

      // 1. Круг черепа (эллипс)
      const skull = document.createElementNS(NS, 'ellipse');
      skull.setAttribute('cx', g.circle.cx);
      skull.setAttribute('cy', g.circle.cy);
      skull.setAttribute('rx', g.circle.rx);
      skull.setAttribute('ry', g.circle.ry);
      // Учёт "top": верхняя точка через вертикальный масштаб не выразить в ellipse,
      // поэтому рисуем как эллипс с ry_effective и верхним сдвигом через path.
      // Проще: path верхней полуэллипса + нижней.
      outline.appendChild(this.buildSkullPath(g));

      // 2. Челюсть (скруглённая)
      const jawRadiusPx = g.chinRound * this.geom.headH * 0.08;
      const jaw = document.createElementNS(NS, 'path');
      const jawPts = [
        g.A_left,
        g.B_left,
        g.C_left,
        g.chinBottom,
        g.C_right,
        g.B_right,
        g.A_right,
      ];
      jaw.setAttribute('d', this.roundedPath(jawPts, jawRadiusPx));
      jaw.setAttribute('fill', 'none');
      outline.appendChild(jaw);
    },

    buildSkullPath(g) {
      const { cx, cy, rx, ry, topY, botY } = g.circle;
      // Верхняя половина с учётом top (растягиваем только по Y для верхней половины)
      const ryTop = cy - topY;
      const ryBot = botY - cy;
      const path = document.createElementNS(NS, 'path');
      // Старт: левый экватор
      // A-rx,cy → верх через ryTop → правый экватор cx+rx,cy
      // → низ через ryBot → возврат
      const d = [
        `M ${cx - rx} ${cy}`,
        `A ${rx} ${ryTop} 0 0 1 ${cx + rx} ${cy}`,
        `A ${rx} ${ryBot} 0 0 1 ${cx - rx} ${cy}`,
        'Z',
      ].join(' ');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      return path;
    },
  };

  window.Head = Head;
})();
