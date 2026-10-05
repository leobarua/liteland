/* PyOBIA manual: shared page behaviour. Numbers come from manual_data.js
   (window.MANUAL_DATA), written by tools/build_figures.py. */
(function () {
  "use strict";
  var D = window.MANUAL_DATA || {};
  // Class names and colours in the order of the workspace's class list (raster values 1..5)
  var CLASSES = D.classes || [
    ["Grass", "#ffef0e"], ["Trees", "#005500"], ["Bare", "#aa5500"],
    ["Impervious", "#55557f"], ["Building", "#aa0000"]
  ];
  var COLOR = {}; CLASSES.forEach(function (c) { COLOR[c[0]] = c[1]; });

  function get(path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, D);
  }
  function fmt(v, f) {
    if (v == null || isNaN(v)) return "–";
    if (f === "pct") return (v * 100).toFixed(1) + "%";
    if (f === "pct0") return Math.round(v * 100) + "%";
    if (f === "int") return Math.round(v).toLocaleString("en-US");
    if (f && f.indexOf("f") === 0) return Number(v).toFixed(+f.slice(1));
    return String(v);
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  var SVGNS = "http://www.w3.org/2000/svg";
  function s(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---- numbers from data ---- */
  document.querySelectorAll("[data-d]").forEach(function (n) {
    var v = get(n.getAttribute("data-d"));
    var mul = parseFloat(n.getAttribute("data-mul") || "1");
    if (typeof v === "number") v = v * mul;
    n.textContent = fmt(v, n.getAttribute("data-fmt"));
  });

  /* ---- section index: highlight the section in view ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  function spy() {
    var y = window.scrollY + 120, cur = -1;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top + window.scrollY <= y) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === cur); });
  }
  if (links.length) { window.addEventListener("scroll", spy, { passive: true }); spy(); }

  /* ---- lightbox ---- */
  document.addEventListener("click", function (ev) {
    var img = ev.target.closest("figure img, .strip img, .shot img, .fx-imgs img");
    if (!img || img.closest(".compare")) return;
    var box = el("div", { "class": "lightbox", role: "dialog", "aria-label": "Enlarged figure" });
    box.appendChild(el("img", { src: img.currentSrc || img.src, alt: img.alt }));
    var cap = img.closest("figure") && img.closest("figure").querySelector("figcaption");
    if (cap) box.appendChild(el("p", {}, cap.innerHTML));
    box.addEventListener("click", function () { box.remove(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { box.remove(); document.removeEventListener("keydown", esc); } });
    document.body.appendChild(box);
  });

  /* ---- before/after sliders ---- */
  document.querySelectorAll(".compare").forEach(function (c) {
    var top = c.querySelector(".top"), bar = c.querySelector(".bar");
    var input = el("input", { type: "range", min: "0", max: "100", value: "50", "aria-label": c.getAttribute("data-label") || "Compare before and after" });
    c.appendChild(input);
    function set(v) { top.style.clipPath = "inset(0 0 0 " + v + "%)"; bar.style.left = v + "%"; }
    input.addEventListener("input", function () { set(input.value); });
    set(50);
  });

  /* ---- screenshot pins <-> legend rows ---- */
  document.querySelectorAll(".shot").forEach(function (shot) {
    var pins = shot.querySelectorAll(".pin"), rows = shot.querySelectorAll(".legend-list li");
    function on(i, v) { if (pins[i]) pins[i].classList.toggle("on", v); if (rows[i]) rows[i].classList.toggle("on", v); }
    pins.forEach(function (p, i) {
      p.setAttribute("tabindex", "0");
      p.setAttribute("aria-label", "Callout " + (i + 1) + ": " + (rows[i] ? rows[i].textContent.trim() : ""));
      p.addEventListener("mouseenter", function () { on(i, true); });
      p.addEventListener("mouseleave", function () { on(i, false); });
      p.addEventListener("focus", function () { on(i, true); });
      p.addEventListener("blur", function () { on(i, false); });
    });
    rows.forEach(function (r, i) {
      r.addEventListener("mouseenter", function () { on(i, true); });
      r.addEventListener("mouseleave", function () { on(i, false); });
    });
  });

  /* ---- feature explorer ---- */
  var FX = document.getElementById("feature-explorer");
  if (FX) {
    var FEATS = {
      r_mean: ["Mean red", "Average red value of the object's pixels (0–255)."],
      g_mean: ["Mean green", "Average green value. Vegetation and teal roofs both run high here, so green alone is not enough."],
      b_mean: ["Mean blue", "Average blue value. Roofs, concrete and water run high; vegetation runs low."],
      r_std: ["Red variation", "Standard deviation of red inside the object: how mixed or textured it is."],
      g_std: ["Green variation", "Standard deviation of green. High on ragged crowns, low on lawns and roofs."],
      b_std: ["Blue variation", "Standard deviation of blue inside the object."],
      brightness_mean: ["Brightness", "Mean of (R+G+B)/3. Shade, gaps and dark canopy are low; concrete and pale roofs are high."],
      exg_mean: ["Excess Green (ExG)", "2g − r − b on chromatic coordinates. Strongly positive for green vegetation, near zero for soil, roads and roofs."],
      vari_mean: ["VARI", "(G − R) / (G + R − B). Tracks the green fraction while damping illumination differences."],
      ngrdi_mean: ["NGRDI", "(G − R) / (G + R). The visible-band stand-in for NDVI."],
      contrast: ["GLCM contrast", "How much neighbouring pixels differ in grey level. High on canopy, low on smooth roofs and road."],
      homogeneity: ["GLCM homogeneity", "How close neighbouring grey levels are. The near-opposite of contrast."],
      energy: ["GLCM energy", "Orderliness of the texture (angular second moment). Uniform surfaces score high."],
      entropy: ["GLCM entropy", "Disorder of the texture. Complex canopy scores high."],
      area: ["Area", "Object size in m². SLIC keeps sizes similar, so area varies most where objects were merged or clipped by edges."],
      perimeter: ["Perimeter", "Outline length in metres."],
      circularity: ["Circularity", "4πA / P². 1 is a disc; ragged or long outlines score low."],
      convexity: ["Convexity", "Area / convex-hull area. Below 1 when the outline has bays and notches."],
      brightness_rel_neighbors: ["Brightness vs neighbours", "Own brightness minus the mean of the touching objects. Blue = darker than its surroundings."],
      dsm_mean: ["Mean height", "Mean DSM value in metres above the datum. Follows the terrain as well as the objects on it."],
      dsm_std: ["Height variation", "Standard deviation of the DSM inside the object. High on crowns and roof edges."],
      slope_mean: ["Mean slope", "Mean surface slope in degrees, from the DSM gradient. Steep on crown sides and roof planes."],
      dsm_rel_neighbors: ["Height vs neighbours", "Own mean height minus the mean of the touching objects. Red = higher than its surroundings, such as tree crowns beside a road."]
    };
    var GROUPS = [
      ["Colour", ["r_mean", "g_mean", "b_mean", "r_std", "g_std", "b_std", "brightness_mean"]],
      ["Vegetation indices", ["exg_mean", "vari_mean", "ngrdi_mean"]],
      ["Texture (GLCM)", ["contrast", "homogeneity", "energy", "entropy"]],
      ["Shape", ["area", "perimeter", "circularity", "convexity"]],
      ["Context", ["brightness_rel_neighbors"]],
      ["Height (DSM)", ["dsm_mean", "dsm_std", "slope_mean", "dsm_rel_neighbors"]]
    ];
    var PIX = { exg_mean: "exg", vari_mean: "vari", ngrdi_mean: "ngrdi" };
    var CMAPS = {
      viridis: "linear-gradient(90deg,#440154,#3b528b,#21918c,#5ec962,#fde725)",
      cividis: "linear-gradient(90deg,#00224e,#434e6c,#7d7c78,#bcaf6f,#fee838)",
      RdBu_r: "linear-gradient(90deg,#053061,#4393c3,#f7f7f7,#d6604d,#67001f)"
    };
    var list = FX.querySelector(".fx-list"), view = FX.querySelector(".fx-view");
    var buttons = {};
    GROUPS.forEach(function (g) {
      var box = el("div", { "class": "fx-group" });
      box.appendChild(el("h4", {}, g[0]));
      var chips = el("div", { "class": "chips" });
      g[1].forEach(function (f) {
        var b = el("button", { type: "button", "aria-pressed": "false" }, f);
        b.addEventListener("click", function () { show(f); });
        buttons[f] = b; chips.appendChild(b);
      });
      box.appendChild(chips); list.appendChild(box);
    });
    function show(f) {
      Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute("aria-pressed", String(k === f)); });
      var m = (D.feature_maps || {})[f] || {};
      var pix = PIX[f] ? '<div><img src="img/feat/pixel_' + PIX[f] + '.jpg" alt="Per-pixel ' + FEATS[f][0] + ' over the same area"><div class="lab">Per pixel, before averaging</div></div>' : '<div><img src="img/view_raw.jpg" alt="The same area in true colour"><div class="lab">True colour</div></div>';
      view.innerHTML =
        '<div class="fx-imgs"><div><img src="img/feat/' + f + '.jpg" alt="' + FEATS[f][0] + ' per object"><div class="lab">Per object (the value the classifier sees)</div></div>' + pix + '</div>' +
        '<div class="fx-bar" style="background:' + (CMAPS[m.cmap] || CMAPS.viridis) + '"></div>' +
        '<div class="fx-scale"><span>' + fmt(m.lo, "f2") + '</span><span>' + (m.cmap === "RdBu_r" ? "0" : "") + '</span><span>' + fmt(m.hi, "f2") + '</span></div>' +
        '<p class="fx-name">' + FEATS[f][0] + '<code>' + f + '</code></p><p class="fx-desc">' + FEATS[f][1] + '</p>';
    }
    show(FX.getAttribute("data-start") || "exg_mean");
  }

  /* ---- GLCM grids ---- */
  document.querySelectorAll("[data-glcm]").forEach(function (box) {
    var g = (D.glcm || {})[box.getAttribute("data-glcm")];
    if (!g) return;
    var M = g.matrix, max = 0;
    M.forEach(function (r) { r.forEach(function (v) { if (v > max) max = v; }); });
    var grid = box.querySelector(".glcm-grid");
    M.forEach(function (r, i) {
      r.forEach(function (v, j) {
        var t = max ? Math.sqrt(v / max) : 0;
        var c = el("i", { title: "levels " + (i + 1) + "–" + (j + 1) + ": " + v.toFixed(4) });
        c.style.background = t ? "rgba(13,107,98," + (0.06 + 0.94 * t).toFixed(3) + ")" : "#fff";
        grid.appendChild(c);
      });
    });
    var st = box.querySelector(".glcm-stats");
    [["Contrast", g.contrast, "f2"], ["Homogeneity", g.homogeneity, "f2"], ["Energy", g.energy, "f3"], ["Entropy", g.entropy, "f1"]].forEach(function (a) {
      st.appendChild(el("div", {}, "<dt>" + a[0] + "</dt><dd>" + fmt(a[1], a[2]) + "</dd>"));
    });
  });

  /* ---- confusion matrix ---- */
  var CM = document.getElementById("confusion-matrix");
  if (CM && D.final) {
    var f = D.final, cols = f.cols, rows = f.rows, M = f.matrix;
    var colTot = cols.map(function (_, j) { return M.reduce(function (a, r) { return a + r[j]; }, 0); });
    var h = '<table class="cm"><thead><tr><th class="corner">rows = map<br>columns = reference</th>';
    cols.forEach(function (c) { h += '<th><span class="sw" style="background:' + COLOR[c] + '"></span>' + c + "</th>"; });
    h += '<th class="tot">Total</th><th>User’s</th></tr></thead><tbody>';
    rows.forEach(function (r, i) {
      var tot = M[i].reduce(function (a, b) { return a + b; }, 0);
      h += '<tr><th class="rowh"><span class="sw" style="background:' + COLOR[r] + '"></span>' + r + "</th>";
      M[i].forEach(function (v, j) { h += "<td" + (i === j ? ' class="diag"' : "") + ">" + v + "</td>"; });
      h += '<td class="tot">' + tot + '</td><td class="acc">' + fmt(f.ua[r], "pct0") + "</td></tr>";
    });
    h += '<tr><th class="rowh tot">Total</th>';
    colTot.forEach(function (v) { h += '<td class="tot">' + v + "</td>"; });
    h += '<td class="tot">' + f.n + '</td><td></td></tr><tr><th class="rowh">Producer’s</th>';
    cols.forEach(function (c) { h += '<td class="acc">' + fmt(f.pa[c], "pct0") + "</td>"; });
    h += '<td></td><td class="acc">OA ' + fmt(f.oa, "pct") + "</td></tr></tbody></table>";
    CM.innerHTML = h;
  }

  /* ---- chart helpers ---- */
  function tipper(wrap) {
    var tip = el("div", { "class": "tip", hidden: "" });
    wrap.appendChild(tip);
    return {
      show: function (x, y, html) { tip.innerHTML = html; tip.hidden = false; tip.style.left = x + "px"; tip.style.top = y + "px"; },
      hide: function () { tip.hidden = true; }
    };
  }
  function pt(svg, wrap, x, y) {
    var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, w = wrap.getBoundingClientRect();
    return [x * r.width / vb.width + r.left - w.left, y * r.height / vb.height + r.top - w.top];
  }

  /* simulated retraining replay: mean overall accuracy per round, with the range of
     the replays as a whisker, and the full model as a dashed reference line */
  var OA = document.getElementById("chart-oa");
  if (OA && D.simulation) {
    var R = D.simulation.rounds, full = D.simulation.final_full;
    var W = 720, H = 310, L = 52, Rt = 120, T = 18, B = 46;
    var x = function (i) { return L + 20 + i * (W - L - Rt - 40) / (R.length - 1); };
    var y0 = 0.55, y1 = 0.95, y = function (v) { return T + (y1 - v) / (y1 - y0) * (H - T - B); };
    var svg = s("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Simulated overall accuracy by retraining round" });
    [0.6, 0.7, 0.8, 0.9].forEach(function (v) {
      svg.appendChild(s("line", { x1: L, x2: W - Rt + 20, y1: y(v), y2: y(v), stroke: "#e3e7e2", "stroke-width": 1 }));
      svg.appendChild(s("text", { x: L - 10, y: y(v) + 4, "text-anchor": "end", "font-size": 12, fill: "#76817b", "font-family": "JetBrains Mono, monospace" }, Math.round(v * 100) + "%"));
    });
    svg.appendChild(s("line", { x1: L, x2: W - Rt + 20, y1: y(full.oa), y2: y(full.oa), stroke: "#17201c", "stroke-width": 1.25, "stroke-dasharray": "5 4" }));
    svg.appendChild(s("text", { x: W - Rt + 28, y: y(full.oa) - 3, "font-size": 12.5, "font-weight": 700, fill: "#17201c", "font-family": "JetBrains Mono, monospace" }, fmt(full.oa, "pct0")));
    svg.appendChild(s("text", { x: W - Rt + 28, y: y(full.oa) + 13, "font-size": 12, fill: "#44504a", "font-family": "Public Sans, sans-serif" }, "your model,"));
    svg.appendChild(s("text", { x: W - Rt + 28, y: y(full.oa) + 28, "font-size": 12, fill: "#44504a", "font-family": "Public Sans, sans-serif" }, "all " + full.samples + " objects"));
    R.forEach(function (r, i) {
      svg.appendChild(s("text", { x: x(i), y: H - B + 20, "text-anchor": "middle", "font-size": 12, fill: "#76817b", "font-family": "JetBrains Mono, monospace" }, r.round));
      svg.appendChild(s("line", { x1: x(i), x2: x(i), y1: y(r.oa_min), y2: y(r.oa_max), stroke: "#0d6b62", "stroke-width": 2, "stroke-linecap": "round", opacity: .35 }));
    });
    svg.appendChild(s("text", { x: (L + W - Rt) / 2, y: H - 6, "text-anchor": "middle", "font-size": 12.5, fill: "#44504a", "font-family": "Public Sans, sans-serif" }, "Retraining round (simulated)"));
    var d = R.map(function (r, i) { return (i ? "L" : "M") + x(i) + " " + y(r.oa_mean); }).join(" ");
    svg.appendChild(s("path", { d: d, fill: "none", stroke: "#0d6b62", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    var tt;
    R.forEach(function (r, i) {
      var g = s("g", { tabindex: "0", "aria-label": "Round " + r.round + ": mean " + fmt(r.oa_mean, "pct") });
      g.appendChild(s("circle", { cx: x(i), cy: y(r.oa_mean), r: 14, fill: "transparent" }));
      g.appendChild(s("circle", { cx: x(i), cy: y(r.oa_mean), r: 5, fill: "#0d6b62", stroke: "#fff", "stroke-width": 2 }));
      function on() { var p = pt(svg, OA, x(i), y(r.oa_max) - 8); tt.show(p[0], p[1], "Round " + r.round + " · mean <b>" + fmt(r.oa_mean, "pct") + "</b><br>range " + fmt(r.oa_min, "pct0") + "–" + fmt(r.oa_max, "pct0") + " · ~" + Math.round(r.samples) + " objects"); }
      g.addEventListener("mouseenter", on); g.addEventListener("focus", on);
      g.addEventListener("mouseleave", function () { tt.hide(); }); g.addEventListener("blur", function () { tt.hide(); });
      svg.appendChild(g);
    });
    svg.appendChild(s("text", { x: x(0) + 10, y: y(R[0].oa_mean) + 4, "font-size": 13, "font-weight": 700, fill: "#17201c", "font-family": "JetBrains Mono, monospace" }, fmt(R[0].oa_mean, "pct0")));
    OA.appendChild(svg);
    tt = tipper(OA);
    var tb = OA.parentNode.querySelector(".chart-table tbody");
    if (tb) {
      R.forEach(function (r) { tb.innerHTML += "<tr><td>" + r.round + '</td><td class="num">' + Math.round(r.samples) + '</td><td class="num">' + fmt(r.oa_mean, "pct") + '</td><td class="num">' + fmt(r.oa_min, "pct0") + "–" + fmt(r.oa_max, "pct0") + "</td></tr>"; });
      tb.innerHTML += '<tr><td>Your model</td><td class="num">' + full.samples + '</td><td class="num">' + fmt(full.oa, "pct") + '</td><td class="num">–</td></tr>';
    }
  }

  /* producer's accuracy: simulated round 1 vs the workspace's model, one row per class */
  var PA = document.getElementById("chart-pa");
  if (PA && D.simulation && D.final) {
    var first = D.simulation.rounds[0].pa_mean, fin = D.final.pa;
    var W2 = 720, rowH = 44, T2 = 30, L2 = 110, R2 = 40, H2 = T2 + rowH * CLASSES.length + 30;
    var X = function (v) { return L2 + v * (W2 - L2 - R2); };
    var svg2 = s("svg", { viewBox: "0 0 " + W2 + " " + H2, role: "img", "aria-label": "Producer's accuracy per class, simulated round 1 and the final model" });
    [0, .25, .5, .75, 1].forEach(function (v) {
      svg2.appendChild(s("line", { x1: X(v), x2: X(v), y1: T2 - 8, y2: H2 - 26, stroke: "#e3e7e2" }));
      svg2.appendChild(s("text", { x: X(v), y: H2 - 8, "text-anchor": "middle", "font-size": 12, fill: "#76817b", "font-family": "JetBrains Mono, monospace" }, Math.round(v * 100) + "%"));
    });
    var tt2;
    CLASSES.forEach(function (c, i) {
      var yy = T2 + rowH * i + rowH / 2, a = first[c[0]], b = fin[c[0]];
      svg2.appendChild(s("text", { x: L2 - 14, y: yy + 4, "text-anchor": "end", "font-size": 13.5, fill: "#17201c", "font-family": "Public Sans, sans-serif" }, c[0]));
      svg2.appendChild(s("line", { x1: X(a), x2: X(b), y1: yy, y2: yy, stroke: "#44504a", "stroke-width": 2, "stroke-linecap": "round", opacity: .45 }));
      svg2.appendChild(s("circle", { cx: X(a), cy: yy, r: 5.5, fill: "#fff", stroke: "#17201c", "stroke-width": 1.5 }));
      var g = s("g", { tabindex: "0", "aria-label": c[0] + ": round 1 " + fmt(a, "pct0") + ", final " + fmt(b, "pct0") });
      g.appendChild(s("circle", { cx: X(b), cy: yy, r: 14, fill: "transparent" }));
      g.appendChild(s("circle", { cx: X(b), cy: yy, r: 7, fill: c[1], stroke: "#17201c", "stroke-width": 1.5 }));
      function on() { var p = pt(svg2, PA, X(b), yy - 8); tt2.show(p[0], p[1], c[0] + "<br>round 1 <b>" + fmt(a, "pct0") + "</b> → final <b>" + fmt(b, "pct0") + "</b>"); }
      g.addEventListener("mouseenter", on); g.addEventListener("focus", on);
      g.addEventListener("mouseleave", function () { tt2.hide(); }); g.addEventListener("blur", function () { tt2.hide(); });
      svg2.appendChild(g);
      var up = b >= a - 1e-9;
      svg2.appendChild(s("text", { x: up ? Math.max(X(a), X(b)) + 14 : X(b) - 14, y: yy + 4, "text-anchor": up ? "start" : "end", "font-size": 12, fill: "#44504a", "font-family": "JetBrains Mono, monospace" }, fmt(b, "pct0")));
    });
    svg2.appendChild(s("circle", { cx: L2, cy: 10, r: 5.5, fill: "#fff", stroke: "#17201c", "stroke-width": 1.5 }));
    svg2.appendChild(s("text", { x: L2 + 10, y: 14, "font-size": 12.5, fill: "#44504a", "font-family": "Public Sans, sans-serif" }, "Simulated round 1 (mean)"));
    svg2.appendChild(s("circle", { cx: L2 + 200, cy: 10, r: 7, fill: "#44504a" }));
    svg2.appendChild(s("text", { x: L2 + 212, y: 14, "font-size": 12.5, fill: "#44504a", "font-family": "Public Sans, sans-serif" }, "Your final model (class colour)"));
    PA.appendChild(svg2);
    tt2 = tipper(PA);
  }

  /* sieve table */
  var SV = document.getElementById("sieve-table");
  if (SV && D.sieve) {
    D.sieve.forEach(function (r) {
      SV.innerHTML += '<tr><td class="num">' + fmt(r.mmu_px, "int") + '</td><td class="num">' + fmt(r.mmu_m2, "f1") + '</td><td class="num">' + fmt(r.changed_px, "pct") + '</td><td class="num">' + fmt(r.oa, "pct") + "</td></tr>";
    });
  }
})();
