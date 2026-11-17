// Aedifex web2: the hero's build, the downloads from downloads/config.js, the sheet strip and
// scroll reveals. The page reads fully without this file: the hero shows a screenshot instead
// and the download links point at the download section.

(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = window.matchMedia("(min-width: 1040px)").matches;
  const NS = "http://www.w3.org/2000/svg";

  // ---------------------------------------------------------------- hero: an agent builds a frame
  // Axonometric (30 degrees) of a 2 x 2 bay frame: bays 5 m by 4 m, storeys 3.2 m.
  const svg = document.getElementById("build");
  const calls = document.getElementById("calls");
  const replay = document.querySelector(".stage-replay");

  if (svg && calls) {
    const S = 22;
    const P = (x, y, z) => [(x - y) * 0.866 * S, (x + y) * 0.5 * S - z * S];
    const xs = [0, 5, 10], ys = [0, 4, 8];
    const el = (tag, attrs, cls) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (cls) e.setAttribute("class", cls);
      return e;
    };
    const line = (a, b, cls) => el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, cls);
    const poly = (pts, cls) => el("polygon", { points: pts.map((p) => p.join(",")).join(" ") }, cls);
    const label = (c, text) => {
      const g = el("g", {});
      g.appendChild(el("circle", { cx: c[0], cy: c[1], r: 10 }, "gb"));
      const t = el("text", { x: c[0], y: c[1] }, "gbt");
      t.textContent = text;
      g.appendChild(t);
      return g;
    };
    const group = () => el("g", {}, "draw");
    const g = { grid: group(), walls: group(), cols: group(), beams2: group(), beamsR: group(), slab2: group(), slabR: group(), bars: group(), dims: group() };

    // grid lines on the ground, bubbles at the front ends
    xs.forEach((x, i) => {
      g.grid.appendChild(line(P(x, -1.2, 0), P(x, 9.6, 0), "grid"));
      g.grid.appendChild(label(P(x, 11.0, 0), String(i + 1)));
    });
    ys.forEach((y, i) => {
      g.grid.appendChild(line(P(-1.2, y, 0), P(11.6, y, 0), "grid"));
      g.grid.appendChild(label(P(13.0, y, 0), "ABC"[i]));
    });
    // ground-floor walls on the back grid lines A and 1, as see-through panels
    g.walls.appendChild(poly([P(0, 0, 0), P(10, 0, 0), P(10, 0, 3.2), P(0, 0, 3.2)], "wall"));
    g.walls.appendChild(poly([P(0, 0, 0), P(0, 8, 0), P(0, 8, 3.2), P(0, 0, 3.2)], "wall"));
    xs.forEach((x) => ys.forEach((y) => g.cols.appendChild(line(P(x, y, 0), P(x, y, 6.4), "col"))));
    const beams = (grp, z) => {
      ys.forEach((y) => grp.appendChild(line(P(0, y, z), P(10, y, z), "beam")));
      xs.forEach((x) => grp.appendChild(line(P(x, 0, z), P(x, 8, z), "beam")));
    };
    beams(g.beams2, 3.2);
    beams(g.beamsR, 6.4);
    g.slab2.appendChild(poly([P(0, 0, 3.2), P(10, 0, 3.2), P(10, 8, 3.2), P(0, 8, 3.2)], "slab"));
    g.slabR.appendChild(poly([P(0, 0, 6.4), P(10, 0, 6.4), P(10, 8, 6.4), P(0, 8, 6.4)], "slab"));
    // the cage of the front beam on grid C, bay 1-2 at level 2: drawn a little below the beam
    // so it reads as a cage: four bottom bars, two top bars, stirrups every 0.75 m
    const by = 8, top = 2.75, bot = 2.15;
    [-0.16, -0.05, 0.05, 0.16].forEach((o) => g.bars.appendChild(line(P(0.3, by + o, bot), P(4.7, by + o, bot), "rebar")));
    [-0.16, 0.16].forEach((o) => g.bars.appendChild(line(P(0.3, by + o, top), P(4.7, by + o, top), "rebar")));
    for (let x = 0.5; x <= 4.6; x += 0.75) {
      g.bars.appendChild(poly([P(x, by - 0.2, bot - 0.04), P(x, by + 0.2, bot - 0.04), P(x, by + 0.2, top + 0.04), P(x, by - 0.2, top + 0.04)], "stirrup"));
    }
    // a dimension along the front (grid C side) of bay 1-3, its text on the frame side of the line
    const d0 = P(0, 9.6, 0), d1 = P(10, 9.6, 0);
    g.dims.appendChild(line(d0, d1, "dim"));
    [d0, d1].forEach((d) => g.dims.appendChild(line([d[0] - 4, d[1] + 2], [d[0] + 4, d[1] - 2], "dim")));
    const mx = (d0[0] + d1[0]) / 2 + 6, my = (d0[1] + d1[1]) / 2 - 7;
    const dt = el("text", { x: mx, y: my, transform: `rotate(30 ${mx} ${my})` }, "dimt");
    dt.textContent = "10 000";
    g.dims.appendChild(dt);

    ["grid", "walls", "cols", "beams2", "slab2", "beamsR", "slabR", "bars", "dims"].forEach((k) => svg.appendChild(g[k]));

    // fit the viewBox tightly round the drawing, so it reads large on a phone
    const bb = svg.getBBox();
    const pad = 14;
    svg.setAttribute("viewBox", `${bb.x - pad} ${bb.y - pad} ${bb.width + 2 * pad} ${bb.height + 2 * pad}`);

    // the calls, one real call per row, as the Assistant's tool rows show them; each draws a group
    const steps = [
      ["add_grid", '{"name":"1","a":[0,-1.2],"b":[0,9.6]}', "6 grids (x6)", ["grid", "dims"]],
      ["add_columns_at_grids", '{"level":"Level 1","top_level":"Roof"}', "9 columns", ["cols"]],
      ["add_beams_on_grids", '{"level":"Level 2"}', "12 beams", ["beams2"]],
      ["add_slab", '{"kind":"floor","level":"Level 2","structural":true}', "1 slab", ["slab2"]],
      ["add_beams_on_grids", '{"level":"Roof"}', "12 beams", ["beamsR"]],
      ["add_slab", '{"kind":"roof","level":"Roof","structural":true}', "1 slab", ["slabR"]],
      ["add_walls", '{"level":"Level 1","points":[[0,8],[0,0],[10,0]]}', "2 walls", ["walls"]],
      ["add_rebar", '{"host":41,"bottom":"4-DB20","top":"2-DB16","stirrups":"RB9 @ 150 mm"}', "bars placed", ["bars"]],
      ["check_rebar", '{"hosts":[41]}', "8 rules pass", []],
    ];
    const row = ([fn, args, out]) => {
      const li = document.createElement("li");
      li.innerHTML = '<span class="ok">ok</span><span class="fn"></span><span class="args"></span><span class="out"></span>';
      li.querySelector(".fn").textContent = fn;
      li.querySelector(".args").textContent = args;
      li.querySelector(".out").textContent = "→ " + out;
      return li;
    };
    const finished = () => {
      Object.values(g).forEach((n) => n.classList.remove("hidden"));
      calls.innerHTML = "";
      steps.slice(-5).forEach((s) => { const li = row(s); li.classList.add("on"); calls.appendChild(li); });
    };
    let timer = null;
    const animate = () => {
      clearTimeout(timer);
      Object.values(g).forEach((n) => n.classList.add("hidden"));
      calls.innerHTML = "";
      if (replay) replay.disabled = true;
      let i = 0;
      const next = () => {
        if (i >= steps.length) { if (replay) replay.disabled = false; return; }
        const li = row(steps[i]);
        calls.appendChild(li);
        while (calls.children.length > 5) calls.removeChild(calls.firstChild);
        requestAnimationFrame(() => li.classList.add("on"));
        steps[i][3].forEach((k) => g[k].classList.remove("hidden"));
        i += 1;
        timer = setTimeout(next, 850);
      };
      timer = setTimeout(next, 300);
    };
    // the finished frame by default; the build plays on its own only on wide screens with motion
    finished();
    if (replay) replay.addEventListener("click", () => (reduce ? finished() : animate()));
    if (wide && !reduce) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); animate(); } }, { threshold: 0.4 });
      io.observe(svg);
    }
  }

  // ---------------------------------------------------------------- downloads (downloads/config.js)
  const cfg = window.AEDIFEX_DOWNLOADS || null;
  const ver = document.getElementById("dl-version");
  if (cfg && ver) ver.textContent = cfg.version + (cfg.date ? " · " + cfg.date : "");
  const isWin = /Windows/i.test(navigator.userAgent);
  document.querySelectorAll(".dl-card").forEach((card) => {
    const f = cfg && cfg.files && cfg.files[card.dataset.platform];
    const a = card.querySelector(".dl-link");
    const hash = card.querySelector(".hash");
    if (f) {
      a.href = f.url;
      a.removeAttribute("aria-disabled");
      a.setAttribute("download", "");
      a.textContent = "Download · " + f.size;
      if (f.meta) card.querySelector(".meta").textContent = f.meta;
      if (hash && f.sha256) hash.textContent = "SHA-256 " + f.sha256;
      a.addEventListener("click", () => { a.classList.add("is-done"); a.textContent = "Downloading…"; });
    } else {
      a.textContent = "Coming soon";
      a.setAttribute("aria-disabled", "true");
    }
  });
  document.querySelectorAll("[data-dl]").forEach((b) => {
    const f = cfg && cfg.files && cfg.files[b.dataset.dl];
    if (f) { b.href = f.url; b.setAttribute("download", ""); }
  });
  const heroCta = document.querySelector(".cta");
  if (heroCta && isWin) {
    const mac = heroCta.querySelector('[data-dl="mac"]'), win = heroCta.querySelector('[data-dl="win"]');
    if (mac && win) {
      heroCta.insertBefore(win, mac);
      win.classList.replace("btn-line", "btn-signal");
      mac.classList.replace("btn-signal", "btn-line");
    }
  }
  const hv = document.getElementById("hero-version");
  if (cfg && hv) hv.textContent = "Version " + cfg.version + ". Free for any use, commercial included. No account.";

  // ---------------------------------------------------------------- sheet strip: previous / next
  const strip = document.querySelector(".sheets");
  const btns = document.querySelectorAll(".strip-btn");
  if (strip && btns.length) {
    const sheets = [...strip.querySelectorAll(".sheet")];
    const current = () => {
      const left = strip.getBoundingClientRect().left + parseFloat(getComputedStyle(strip).scrollPaddingLeft || 0);
      let best = 0, bestD = Infinity;
      sheets.forEach((s, i) => { const d = Math.abs(s.getBoundingClientRect().left - left); if (d < bestD) { bestD = d; best = i; } });
      return best;
    };
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth - 2;
      btns[0].disabled = strip.scrollLeft <= 2;
      btns[1].disabled = strip.scrollLeft >= max;
    };
    btns.forEach((b) => b.addEventListener("click", () => {
      const i = Math.max(0, Math.min(sheets.length - 1, current() + Number(b.dataset.dir)));
      strip.scrollTo({ left: sheets[i].offsetLeft - sheets[0].offsetLeft, behavior: reduce ? "auto" : "smooth" });
    }));
    strip.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    update();
  }

  // ---------------------------------------------------------------- scroll reveals
  if (!reduce && "IntersectionObserver" in window) {
    const items = document.querySelectorAll(".sec-head, .shot-tall, .agent-text, .cell, .dl-sheet, .titleblock dl");
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io2.unobserve(e.target); } }), { threshold: 0.12 });
    items.forEach((n) => { n.classList.add("rv"); io2.observe(n); });
  }
})();
