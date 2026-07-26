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
  assert.match(html, /class="photo-placeholder/);
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

test("uses replaceable editorial placeholder image assets", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const expectedAssets = [
    "placeholder-hero.svg",
    "placeholder-special.svg",
    "placeholder-mikail.svg",
    "placeholder-dershia.svg",
    "placeholder-ceremony.svg",
    "placeholder-gallery-1.svg",
    "placeholder-gallery-2.svg",
    "placeholder-gallery-3.svg",
  ];

  expectedAssets.forEach((asset) => {
    assert.equal(existsSync(new URL(`./assets/${asset}`, import.meta.url)), true);
    assert.equal(html.includes(`src="./assets/${asset}"`), true);
  });

  assert.match(html, /photo-frame/);
  assert.match(html, /Replace with/);
});

test("layers the landing image behind the hero text", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  const heroFigure = html.match(/<figure\s+class="([^"]*hero-media[^"]*)"[\s\S]*?<\/figure>/)?.[0] || "";
  const heroClasses = html.match(/<figure\s+class="([^"]*hero-media[^"]*)"/)?.[1] || "";

  assert.equal(heroClasses.includes("hero-background"), true);
  assert.equal(heroClasses.includes("photo-frame"), false);
  assert.equal(heroFigure.includes("<figcaption>"), false);
  assert.match(css, /\.hero\s+\.hero-media\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(css, /\.hero-media\s*\{[\s\S]*z-index:\s*0;/);
  assert.match(css, /\.hero-overlay\s*\{[\s\S]*z-index:\s*2;/);
  assert.match(css, /\.hero::after/);
});
