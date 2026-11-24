const menuButton = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

menuButton?.addEventListener("click", () => {
  navLinks?.classList.toggle("mobile-open");
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
      navLinks?.classList.remove("mobile-open");
    }
  });
});

const counters = document.querySelectorAll(".proof-grid [data-count]");
const numberFormatter = new Intl.NumberFormat("en-US");

function animateCounter(counter) {
  const target = Number(counter.dataset.count);
  const endTarget =
    counter.dataset.endCount === undefined
      ? null
      : Number(counter.dataset.endCount);
  const prefix = counter.dataset.prefix || "";
  const suffix = counter.dataset.suffix || "";
  const duration = 1600;
  const startTime = performance.now();

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const easedProgress = 1 - (1 - progress) ** 3;
    const currentValue = Math.round(target * easedProgress);
    const rangeEnd =
      endTarget === null
        ? ""
        : `–${numberFormatter.format(Math.round(endTarget * easedProgress))}`;

    counter.textContent = `${prefix}${numberFormatter.format(currentValue)}${rangeEnd}${suffix}`;
    if (progress < 1) requestAnimationFrame(update);
  }

  counter.textContent = `${prefix}0${endTarget === null ? "" : "–0"}${suffix}`;
  requestAnimationFrame(update);
}

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  counters.forEach((counter) => {
    const rangeEnd =
      counter.dataset.endCount === undefined
        ? ""
        : `–${numberFormatter.format(Number(counter.dataset.endCount))}`;
    counter.textContent = `${counter.dataset.prefix || ""}${numberFormatter.format(Number(counter.dataset.count))}${rangeEnd}${counter.dataset.suffix || ""}`;
  });
} else {
  counters.forEach(animateCounter);
}
