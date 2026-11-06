(() => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const W = 4096, H = 4096;
  const MARGIN = 0.05 * H;          // 5% сверху и снизу
  const USABLE_H = H - MARGIN * 2;  // высота доступной области
  const TOP = MARGIN;

  const svg = document.getElementById("svg");
  const guides = document.getElementById("guides");
  const headG = document.getElementById("head");

  const $ = (id) => document.getElementById(id);

  const state = {
    x: 7,
    cH: 1,
    cW: 1,
    chinType: "line",
    chW: 0.35,
    chH: 0.06,
    jY: 0.62,
    jA: 65,
    jW: 0.5,
  };

  function el(tag, attrs = {}) {
    const n = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  }

  function clear(g) {
    while (g.firstChild) g.removeChild(g.firstChild);
  }

  function draw() {
    clear(guides);
    clear(headG);

    const headH = USABLE_H / state.x;      // высота "головы"
    const y0 = TOP;                        // верх головы
    const cx = W / 2;                      // центральная ось

    // ---------- направляющие: верхняя область 1/X на 5 частей ----------
    for (let i = 0; i <= 5; i++) {
      const y = y0 + (headH * i) / 5;
      guides.appendChild(el("line", { x1: 0, y1: y, x2: W, y2: y }));
    }
    // центральная ось
    guides.appendChild(el("line", { x1: cx, y1: 0, x2: cx, y2: H, "stroke-dasharray": "8 20" }));

    // ---------- круг черепа ----------
    // вершина на 1/5, низ на 3/5 -> радиус = (3/5 - 1/5)/2 * headH = headH/5
    const rBase = headH / 5;
    const ry = rBase * state.cH;
    const rx = rBase * state.cW;
    const cy = y0 + (headH * 2) / 5; // центр между 1/5 и 3/5

    const skull = el("ellipse", { cx, cy, rx, ry, fill: "none" });
    headG.appendChild(skull);

    // крайние (широчайшие) точки эллипса
    const leftX = cx - rx;
    const rightX = cx + rx;
    const widestY = cy; // широчайшая точка по горизонтали

    // ---------- подбородок на линии 4/5 ----------
    const chinY = y0 + (headH * 4) / 5;
    const chinHalf = (headH * state.chW) / 2;

    if (state.chinType === "line") {
      // линия шириной chW*headH и толщиной chH*headH
      const thick = Math.max(2, headH * state.chH);
      headG.appendChild(el("line", {
        x1: cx - chinHalf, y1: chinY,
        x2: cx + chinHalf, y2: chinY,
        "stroke-width": thick
      }));
    } else {
      // точка (аниме): радиус = chH*headH, положение по центру
      const r = Math.max(2, headH * state.chH);
      headG.appendChild(el("circle", { cx, cy: chinY, r, fill: "#e8f0f7", stroke: "none" }));
    }

    // ---------- челюсть ----------
    // 1) от широчайшей точки круга вниз под 90° (вертикально) до высоты крепления jY
    // 2) от конца линии 1 под углом jA к подбородку
    const jYy = y0 + headH * state.jY; // высота крепления челюсти (доля headH)
    const jawW = headH * state.jW;     // ширина челюсти (горизонтальное смещение)

    // левая сторона
    const leftTop = { x: leftX, y: widestY };
    const leftDown = { x: leftX, y: Math.max(widestY, jYy) };
    // подбородок: левая точка (или центр для точки)
    const chinLeftX = state.chinType === "line" ? cx - chinHalf : cx;
    const chinRightX = state.chinType === "line" ? cx + chinHalf : cx;

    // угол челюсти: вторая линия идёт от leftDown к точке подбородка,
    // но с учётом угла и ширины. Строим так:
    // направление от leftDown к подбородку, затем корректируем по углу.
    // Для наглядности: вторая линия идёт к точке (chinLeftX, chinY), смещённой на jawW.
    const targetLeftX = Math.min(chinLeftX + jawW, cx);
    const leftTarget = { x: targetLeftX, y: chinY };

    // угол между вертикалью (линия 1) и линией 2 — регулируем через jA.
    // Пересчитаем target по углу: линия 2 отклоняется от вертикали на (90 - jA) градусов.
    // Проще: строим линию 2 от leftDown под углом jA к вертикали вниз.
    const rad = (state.jA * Math.PI) / 180;
    const dirX = Math.sin(rad);      // горизонтальное смещение
    const dirY = Math.cos(rad);      // вертикальное смещение
    // Длина линии 2 подбирается так, чтобы достичь chinY (или близко)
    const needY = chinY - leftDown.y;
    let len2 = Math.abs(needY) / Math.max(0.0001, Math.abs(dirY));
    // Ограничим шириной челюсти
    const maxLenX = Math.max(1, jawW) / Math.max(0.0001, Math.abs(dirX));
    len2 = Math.min(len2, maxLenX * 1.6 + 1);

    let leftEnd = {
      x: leftDown.x + dirX * len2,
      y: leftDown.y + dirY * len2,
    };
    // Если не дотянули до подбородка — тянем к подбородку (плавно)
    if (leftEnd.y < chinY) {
      const k = (chinY - leftDown.y) / Math.max(1e-6, (leftEnd.y - leftDown.y));
      leftEnd = {
        x: leftDown.x + (leftEnd.x - leftDown.x) * k,
        y: chinY,
      };
    }
    // Не даём уйти дальше центра
    leftEnd.x = Math.min(leftEnd.x, cx);

    // правая сторона — зеркально
    const rightTop = { x: rightX, y: widestY };
    const rightDown = { x: rightX, y: Math.max(widestY, jYy) };
    let rightEnd = {
      x: rightDown.x - (leftEnd.x - leftDown.x),
      y: leftEnd.y,
    };
    rightEnd.x = Math.max(rightEnd.x, cx);

    // Рисуем линии челюсти
    // Линия 1 (вертикаль)
    headG.appendChild(el("line", {
      x1: leftTop.x, y1: leftTop.y, x2: leftDown.x, y2: leftDown.y
    }));
    headG.appendChild(el("line", {
      x1: rightTop.x, y1: rightTop.y, x2: rightDown.x, y2: rightDown.y
    }));

    // Линия 2 (к подбородку)
    headG.appendChild(el("line", {
      x1: leftDown.x, y1: leftDown.y, x2: leftEnd.x, y2: leftEnd.y
    }));
    headG.appendChild(el("line", {
      x1: rightDown.x, y1: rightDown.y, x2: rightEnd.x, y2: rightEnd.y
    }));

    // Соединение челюсти с подбородком (небольшие сегменты)
    if (state.chinType === "line") {
      // соединяем концы челюсти с краями подбородка
      headG.appendChild(el("line", {
        x1: leftEnd.x, y1: leftEnd.y, x2: chinLeftX, y2: chinY
      }));
      headG.appendChild(el("line", {
        x1: rightEnd.x, y1: rightEnd.y, x2: chinRightX, y2: chinY
      }));
    } else {
      // для точки — ведём к центру подбородка
      headG.appendChild(el("line", {
        x1: leftEnd.x, y1: leftEnd.y, x2: cx, y2: chinY
      }));
      headG.appendChild(el("line", {
        x1: rightEnd.x, y1: rightEnd.y, x2: cx, y2: chinY
      }));
    }
  }

  // ---------- UI ----------
  function bindRange(id, key, labelId, fmt = (v) => v.toFixed(2)) {
    const input = $(id);
    const label = $(labelId);
    input.addEventListener("input", () => {
      state[key] = parseFloat(input.value);
      label.textContent = fmt(state[key]);
      draw();
    });
    label.textContent = fmt(state[key]);
  }

  $("xRange").addEventListener("input", (e) => {
    state.x = parseInt(e.target.value, 10);
    $("xVal").textContent = state.x;
    draw();
  });
  $("xVal").textContent = state.x;

  bindRange("cH", "cH", "cHVal");
  bindRange("cW", "cW", "cWVal");
  bindRange("chW", "chW", "chWVal");
  bindRange("chH", "chH", "chHVal");
  bindRange("jY", "jY", "jYVal");
  bindRange("jW", "jW", "jWVal");
  bindRange("jA", "jA", "jAVal", (v) => Math.round(v));

  $("chinType").addEventListener("change", (e) => {
    state.chinType = e.target.value;
    draw();
  });

  $("reset").addEventListener("click", () => {
    state.x = 7; state.cH = 1; state.cW = 1;
    state.chinType = "line"; state.chW = 0.35; state.chH = 0.06;
    state.jY = 0.62; state.jA = 65; state.jW = 0.5;

    $("xRange").value = 7; $("xVal").textContent = 7;
    $("cH").value = 1; $("cHVal").textContent = "1.00";
    $("cW").value = 1; $("cWVal").textContent = "1.00";
    $("chinType").value = "line";
    $("chW").value = 0.35; $("chWVal").textContent = "0.35";
    $("chH").value = 0.06; $("chHVal").textContent = "0.06";
    $("jY").value = 0.62; $("jYVal").textContent = "0.62";
    $("jA").value = 65; $("jAVal").textContent = "65";
    $("jW").value = 0.5; $("jWVal").textContent = "0.50";

    draw();
  });

  $("download").addEventListener("click", () => {
    // Убираем сетку и вспомогательные линии из экспорта
    const clone = svg.cloneNode(true);
    const g = clone.querySelector("#guides");
    if (g) g.remove();
    // Убираем паттерн-фон (оставляем чистый фон)
    const defs = clone.querySelector("defs");
    if (defs) defs.remove();
    const rects = clone.querySelectorAll("rect");
    rects.forEach((r) => {
      if (r.getAttribute("fill") === "url(#grid)") r.remove();
    });

    const data = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "head.svg";
    a.click();
    URL.revokeObjectURL(url);
  });

  draw();
})();
