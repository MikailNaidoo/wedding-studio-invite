import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { isLikelySpamSubmission } from "./rsvpProtection.js";

test("flags bot-like RSVP submissions", () => {
  assert.equal(isLikelySpamSubmission({ honeypotValue: "bot", elapsedMs: 6000 }), true);
  assert.equal(isLikelySpamSubmission({ honeypotValue: "", elapsedMs: 600 }), true);
  assert.equal(isLikelySpamSubmission({ honeypotValue: "", elapsedMs: 6000 }), false);
});

test("includes required wedding content and editorial hooks", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  const heroTitle = html.match(/<h1 id="hero-title"[\s\S]*?<\/h1>/)?.[0] || "";
  const heroTitleText = heroTitle.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  assert.match(html, /Mikail Naidoo/);
  assert.match(html, /Dershia Nadesan/);
  assert.equal(heroTitleText, "Save the date");
  assert.match(html, /29 August 2027/);
  assert.match(html, /The Bell Inn/);
  assert.match(html, /208 Kenneth Kaunda Road/);
  assert.match(html, /google.com\/maps/);
  assert.match(html, /data-scroll-scene/);
  assert.match(html, /data-scroll-layer/);
  assert.match(html, /data-reveal/);
  assert.match(css, /\.hero/);
  assert.match(css, /\.special-card/);
  assert.match(css, /\[data-scroll-layer\]/);
  assert.match(css, /\.reveal-stagger/);
  assert.match(css, /\.is-scrolling/);
  assert.match(readFileSync(new URL("./app.js", import.meta.url), "utf8"), /requestAnimationFrame/);
});

test("uses a slideshow-backed editorial hero like the reference direction", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  const js = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const heroSlides = html.match(/data-hero-slide/g) || [];

  assert.equal(heroSlides.length >= 3, true);
  assert.match(html, /class="hero-slideshow"/);
  assert.match(html, /class="[^"]*hero-slide[^"]*is-active[^"]*"/);
  assert.match(html, /id="special-card-label"/);
  assert.match(html, /data-slide-label="Blessed beginning"/);
  assert.match(css, /\.hero-slideshow/);
  assert.match(css, /\.hero-slide/);
  assert.doesNotMatch(css, /@keyframes heroSlidePan/);
  assert.doesNotMatch(css, /animation:\s*heroSlidePan/);
  assert.match(js, /activeHeroSlide/);
  assert.match(js, /setInterval/);
});

test("removes tiled texture animation and keeps hero motion calm", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

  assert.doesNotMatch(css, /body::before/);
  assert.doesNotMatch(css, /repeating-linear-gradient/);
  assert.match(css, /\.hero-slide\s*\{[\s\S]*transition:[\s\S]*opacity 1400ms ease;/);
  assert.doesNotMatch(html, /data-scroll-speed="-170"/);
  assert.doesNotMatch(html, /data-scroll-rotate="-7"/);
  assert.doesNotMatch(css, /rotate\(2deg\)/);
});

test("uses stronger reference-inspired section treatments without copied assets", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(html, /lime-editorial-section/);
  assert.match(html, /editorial-watermark/);
  assert.match(html, /kolam-line/);
  assert.match(html, /dark-place-section/);
  assert.match(html, /venue-link-icon/);
  assert.match(css, /\.lime-editorial-section/);
  assert.match(css, /\.editorial-watermark/);
  assert.match(css, /\.kolam-line/);
  assert.match(css, /\.dark-place-section/);
});

test("uses generated wedding image assets instead of placeholders", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const manifest = JSON.parse(readFileSync(new URL("./assets/image-manifest.json", import.meta.url), "utf8"));
  const expectedAssets = [
    "wedding-hero.png",
    "wedding-card-detail.png",
    "mikail-portrait.png",
    "dershia-portrait.png",
    "wedding-mandap.png",
    "gallery-couple.png",
    "gallery-details.png",
    "gallery-celebration.png",
  ];

  expectedAssets.forEach((asset) => {
    assert.equal(existsSync(new URL(`./assets/${asset}`, import.meta.url)), true);
    assert.equal(html.includes(`src="./assets/${asset}"`), true);
    assert.equal(typeof manifest[asset], "string");
  });

  assert.doesNotMatch(html, /placeholder-/);
  assert.doesNotMatch(html, /Replace with/);
  assert.match(html, /South Indian wedding artwork of Mikail and Dershia/);
  assert.match(manifest["wedding-hero.png"], /cream and gold bridal attire/);
  assert.match(manifest["wedding-hero.png"], /grey double-breasted suit with a tie, mustache, and goatee/);
  assert.match(manifest["mikail-portrait.png"], /grey double-breasted suit with a tie, mustache, and goatee/);
  assert.match(manifest["dershia-portrait.png"], /cream and gold bridal attire/);
  assert.match(manifest["gallery-couple.png"], /cream and gold bridal attire/);
  assert.match(manifest["gallery-couple.png"], /grey double-breasted suit with a tie, mustache, and goatee/);
  assert.match(html, /Dershia Nadesan in cream and gold bridal attire/);
  assert.match(html, /Mikail Naidoo in a grey double-breasted suit with a tie, mustache, and goatee/);
});

test("layers the landing image behind the hero text", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  const heroFigure = html.match(/<figure\s+class="([^"]*hero-slide[^"]*)"[\s\S]*?<\/figure>/)?.[0] || "";
  const heroClasses = html.match(/<figure\s+class="([^"]*hero-slide[^"]*)"/)?.[1] || "";

  assert.equal(heroClasses.includes("hero-slide"), true);
  assert.equal(heroClasses.includes("photo-frame"), false);
  assert.equal(heroFigure.includes("<figcaption>"), false);
  assert.match(css, /\.hero-slideshow\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(css, /\.hero-slideshow\s*\{[\s\S]*z-index:\s*0;/);
  assert.match(css, /\.hero-overlay\s*\{[\s\S]*z-index:\s*2;/);
  assert.match(css, /\.hero::after/);
});

test("keeps the hero couple framed on mobile", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(html, /class="hero-slide hero-slide-couple is-active"/);
  assert.match(css, /@media \(max-width: 540px\)[\s\S]*\.hero-slide-couple img\s*\{[\s\S]*object-position:\s*78% center;/);
  assert.match(css, /@media \(max-width: 540px\)[\s\S]*\.hero-slideshow\s*\{[\s\S]*inset:\s*0;/);
});
