// The manual's contents list marks the section being read.
(function () {
  "use strict";
  const links = [...document.querySelectorAll(".toc a")];
  if (!links.length || !("IntersectionObserver" in window)) return;
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => { a.classList.remove("on"); a.removeAttribute("aria-current"); });
      const a = byId.get(e.target.id);
      if (a) { a.classList.add("on"); a.setAttribute("aria-current", "true"); }
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();
