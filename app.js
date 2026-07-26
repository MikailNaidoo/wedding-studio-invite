import { isLikelySpamSubmission } from "./rsvpProtection.js";

const form = document.querySelector("#rsvp-form");
const status = document.querySelector("#form-status");
const revealItems = [...document.querySelectorAll(".section, [data-reveal]")];
const scrollScenes = [...document.querySelectorAll("[data-scroll-scene]")];
const scrollLayers = [...document.querySelectorAll("[data-scroll-layer]")];
const startedAt = Date.now();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let ticking = false;
let scrollTimer;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getElementProgress = (element) => {
  const rect = element.getBoundingClientRect();
  return clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
};

const updateScrollMotion = () => {
  ticking = false;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const globalProgress = clamp(window.scrollY / maxScroll, 0, 1);
  document.documentElement.style.setProperty("--scroll", globalProgress.toFixed(4));
  document.documentElement.style.setProperty("--scroll-px", `${window.scrollY.toFixed(1)}px`);

  scrollScenes.forEach((scene) => {
    scene.style.setProperty("--scene-progress", getElementProgress(scene).toFixed(4));
  });

  if (reducedMotion) return;

  scrollLayers.forEach((layer) => {
    const progress = getElementProgress(layer);
    const speed = Number(layer.dataset.scrollSpeed || 0);
    const rotate = Number(layer.dataset.scrollRotate || 0);
    const scale = Number(layer.dataset.scrollScale || 0);
    const offset = (progress - 0.5) * speed;
    const rotation = (progress - 0.5) * rotate;
    const layerScale = 1 + (progress - 0.5) * scale;
    layer.style.setProperty("--layer-y", `${offset.toFixed(2)}px`);
    layer.style.setProperty("--layer-rotate", `${rotation.toFixed(2)}deg`);
    layer.style.setProperty("--layer-scale", layerScale.toFixed(4));
  });
};

const requestScrollUpdate = () => {
  document.body.classList.add("is-scrolling");
  window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => document.body.classList.remove("is-scrolling"), 160);
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(updateScrollMotion);
};

updateScrollMotion();
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
);

revealItems.forEach((item, index) => {
  item.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 80}ms`);
  revealObserver.observe(item);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const elapsedMs = Date.now() - startedAt;
  const honeypotValue = formData.get("website")?.toString() || "";

  if (isLikelySpamSubmission({ honeypotValue, elapsedMs })) {
    status.textContent = "We could not send that RSVP. Please refresh and try again.";
    return;
  }

  const name = formData.get("name")?.toString().trim() || "guest";
  status.textContent = `Thank you, ${name}. Your RSVP is captured in this prototype.`;
  form.reset();
});
