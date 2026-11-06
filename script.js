(() => {
  "use strict";

  // ---------- Константы ----------
  const W = 4096, H = 4096;
  const DPI = 300;
  const MARGIN_PCT = 0.05;              // отступ 5% сверху и снизу
  const TOP = H * MARGIN_PCT;           // 204.8
  const BOTTOM = H * (1 - MARGIN_PCT);  // 3891.2
  const BODY_H = BOTTOM - TOP;          // высота рабочей области

  const svg = document.getElementById("stage");
  const NS = "http://www.w3.org/2000/svg";

  // ---------- UI ----------
  const ui = {
    xParts:   document.getElementById("xParts"),
    xVal:     document.getElementById("xVal"),
    skullH:   document.getElementById("skullH"),
    skullW:   document.getElementById("skullW"),
    chinW:    document.getElementById("chinW"),
    chinH:    document.getElementById("chinH"),
    chinType: document.getElementById("chinType"),
    jawH:     document.getElementById("jawH"),
    jawAngle: document.getElementById("jawAngle"),
    jawW:     document.getElementById("jawW"),
    exportBtn:document.getElementById("exportBtn"),
  };

  const state = {
    X: +ui.xParts.value,
    skullH: +ui.skullH.value,
    skullW: +ui.skullW.value,
    chinW: +ui.chinW.value,
    chinH: +ui.chinH.value,
    chinType: +ui.chinType.value,
    jawH: +ui.jawH.value,
    jawAngle: +ui.jawAngle.value,
    jawW: +ui.jawW.value,
  };

  // ---------- Утилиты ----------
  const el = (name, attrs = {}) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Пересчёт: делим рабочую область на X равных частей.
  // Слой "голова" занимает первую 1/X сверху — "рост в головах".
  function metrics() {
    const X = state.X;
    const unit = BODY_H / X;               // высота одной "головы" (1/X)
    const headTop = TOP;
    const headBottom = TOP + unit;
    const headH = unit;

    // Деления внутри головы: 1/5, 2/5, 3/5, 4/5, 5/5
    const p = (n) => headTop + headH * (n / 5); // n из 0..5
    const l1 = p(1), l2 = p(2), l3 = p(3), l4 = p(4), l5 = p(5);

    // Круг черепа: вершина на 1/5, низ на 3/5.
    const baseRadius = (l3 - l1) / 2;            // диаметр = 2/5 головы
    const cx = W / 2;
    const cy = (l1 + l3) / 2;
    const rx = baseRadius * state.skullW;        // горизонт. радиус
    const ry = baseRadius * state.skullH;        // вертик. радиус
    // Но по условию «вершина на 1/5, низина на 3/5» — держим это,
    // изменяя ry так, чтобы верх/низ оставались фиксированными,
    // а ползунок высоты растягивал бы круг симметрично вокруг cy.
    // Для соответствия ТЗ используем rx/ry как множители вокруг центра.

    // Подбородок на 4/5 (+ смещение ползунком)
    const chinY = l4 + state.chinH * (headH / 5);
    const chinHalfW = baseRadius * state.chinW;

    return { X, unit, headTop, headBottom, headH, l1, l2, l3, l4, l5,
             cx, cy, rx, ry, chinY, chinHalfW, baseRadius };
  }

  // ---------- Отрисовка ----------
  function render() {
    const m = metrics();
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // --- Фон и границы рабочей области (для наглядности) ---
    const bg = el("rect", { x: 0, y: 0, width: W, height: H, fill: "#0d1117" });
    svg.appendChild(bg);

    const work = el("rect", {
      x: 0, y: TOP, width: W, height: BODY_H,
      fill: "rgba(37,99,235,0.04)",
    });
    svg.appendChild(work);

    // --- Сетка X частей (горизонтальные линии) ---
    const grid = el("g", { stroke: "#1f2a38", "stroke-width": 2 });
    for (let i = 0; i <= m.X; i++) {
      const y = TOP + (BODY_H / m.X) * i;
      grid.appendChild(el("line", { x1: 0, y1: y, x2: W, y2: y }));
    }
    svg.appendChild(grid);

    // --- Линии делений головы 1/5..5/5 ---
    const headLines = el("g", { stroke: "#2b3a4f", "stroke-width": 2, "stroke-dasharray": "14 14" });
    [m.l1, m.l2, m.l3, m.l4, m.l5].forEach((y) => {
      headLines.appendChild(el("line", { x1: 0, y1: y, x2: W, y2: y }));
    });
    svg.appendChild(headLines);

    // --- Осевая ---
    svg.appendChild(el("line", {
      x1: m.cx, y1: TOP, x2: m.cx, y2: BOTTOM,
      stroke: "#1f2a38", "stroke-width": 2, "stroke-dasharray": "6 20"
    }));

    // --- Череп: круг/эллипс ---
    // Фиксируем вершину (1/5) и низ (3/5) — эллипс симметричен по cy.
    const skullTop = m.l1;
    const skullBottom = m.l3;
    const skullCy = (skullTop + skullBottom) / 2;
    const skullRy = ((skullBottom - skullTop) / 2) * state.skullH;
    const skullRx = m.baseRadius * state.skullW;

    const skull = el("ellipse", {
      cx: m.cx, cy: skullCy,
      rx: skullRx, ry: skullRy,
      fill: "rgba(124,58,237,0.12)",
      stroke: "#7c3aed", "stroke-width": 8,
    });
    svg.appendChild(skull);

    // --- Подбородок (точка ↔ линия через chinType) ---
    // 0 = точка, 1 = линия. Промежуточные — плавный переход.
    const t = clamp(state.chinType, 0, 1);
    const chinHalfW = m.baseRadius * state.chinW * t;  // в точке ширина 0
    const chinY = m.chinY;

    if (chinHalfW < 1) {
      // Чистая точка (аниме)
      svg.appendChild(el("circle", {
        cx: m.cx, cy: chinY, r: 18,
        fill: "#22d3ee", stroke: "#22d3ee", "stroke-width": 2,
      }));
    } else {
      // Линия подбородка
      svg.appendChild(el("line", {
        x1: m.cx - chinHalfW, y1: chinY,
        x2: m.cx + chinHalfW, y2: chinY,
        stroke: "#22d3ee", "stroke-width": 10, "stroke-linecap": "round",
      }));
    }

    // --- Челюсть ---
    // 1) широчайшая точка круга (правая) на уровне крепления jawH:
    //    jawH = 0.9 → примерно на 3/5 (низ круга). Позиция по Y:
    const jawAttachY = m.l1 + (m.l3 - m.l1) * state.jawH; // между 1/5 и 3/5 (масштабируется)
    // X широчайшей точки круга на этом уровне:
    const dyNorm = (jawAttachY - skullCy) / (skullRy || 1);
    const dxSq = 1 - clamp(dyNorm * dyNorm, 0, 1);
    const widestX = m.cx + skullRx * Math.sqrt(dxSq);

    // 2) Первая линия: от широчайшей точки круга — строго вниз (90°).
    //    Её длина регулируется jawH (высота крепления) и jawW (ширина).
    const jawLen = (m.l5 - jawAttachY) * 0.55 * state.jawW;
    const p1 = { x: widestX, y: jawAttachY };
    const p2 = { x: widestX, y: jawAttachY + jawLen };

    // 3) Вторая линия: от p2 под углом jawAngle к подбородку.
    const chinAnchor = {
      x: m.cx,
      y: chinHalfW > 1 ? chinY : chinY,
    };
    const ang = (state.jawAngle * Math.PI) / 180;
    // направление от p2 к подбородку; подстраиваем по X
    const dxChin = chinAnchor.x - p2.x;
    const dir = Math.sign(dxChin) || -1;
    const len2 = Math.abs(dxChin) / Math.max(Math.cos(ang), 0.15);
    const p3 = { x: p2.x + dir * Math.cos(ang) * len2, y: p2.y + Math.sin(ang) * len2 };

    // Рисуем обе линии челюсти (левая + правая симметрично)
    const jawG = el("g", {
      stroke: "#f59e0b", "stroke-width": 9,
      "stroke-linecap": "round", "stroke-linejoin": "round",
      fill: "none",
    });

    // Правая сторона
    jawG.appendChild(el("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }));
    jawG.appendChild(el("line", { x1: p2.x, y1: p2.y, x2: p3.x, y2: p3.y }));

    // Левая сторона (зеркально относительно cx)
    const p1L = { x: 2 * m.cx - p1.x, y: p1.y };
    const p2L = { x: 2 * m.cx - p2.x, y: p2.y };
    const p3L = { x: 2 * m.cx - p3.x, y: p3.y };
    jawG.appendChild(el("line", { x1: p1L.x, y1: p1L.y, x2: p2L.x, y2: p2L.y }));
    jawG.appendChild(el("line", { x1: p2L.x, y1: p2L.y, x2: p3L.x, y2: p3L.y }));

    svg.appendChild(jawG);

    // Точки крепления (визуальные маркеры)
    const dots = el("g", { fill: "#f59e0b" });
    [p1, p2, p3, p1L, p2L, p3L].forEach((pt) => {
      dots.appendChild(el("circle", { cx: pt.x, cy: pt.y, r: 7 }));
    });
    svg.appendChild(dots);
  }

  // ---------- Привязка событий ----------
  function bindRange(input, key, cast = Number) {
    input.addEventListener("input", () => {
      state[key] = cast(input.value);
      if (key === "X") ui.xVal.textContent = state[key];
      render();
    });
  }

  bindRange(ui.xParts, "X", (v) => parseInt(v, 10));
  bindRange(ui.skullH, "skullH");
  bindRange(ui.skullW, "skullW");
  bindRange(ui.chinW, "chinW");
  bindRange(ui.chinH, "chinH");
  bindRange(ui.chinType, "chinType");
  bindRange(ui.jawH, "jawH");
  bindRange(ui.jawAngle, "jawAngle", (v) => parseInt(v, 10));
  bindRange(ui.jawW, "jawW");

  // ---------- Экспорт SVG ----------
  ui.exportBtn.addEventListener("click", () => {
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", NS);
    clone.setAttribute("width", W);
    clone.setAttribute("height", H);
    // Для печати в 300 dpi: 4096px / 300dpi = 13.65in
    clone.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const data = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "head-construction.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // ---------- Старт ----------
  ui.xVal.textContent = state.X;
  render();
  window.addEventListener("resize", render);
})();
