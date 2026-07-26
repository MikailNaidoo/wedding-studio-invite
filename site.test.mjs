import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isLikelySpamSubmission } from "./rsvpProtection.js";

test("flags bot-like RSVP submissions", () => {
  assert.equal(isLikelySpamSubmission({ honeypotValue: "bot", elapsedMs: 6000 }), true);
  assert.equal(isLikelySpamSubmission({ honeypotValue: "", elapsedMs: 600 }), true);
  assert.equal(isLikelySpamSubmission({ honeypotValue: "", elapsedMs: 6000 }), false);
});

test("includes required wedding content and editorial hooks", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(html, /Mikail Naidoo/);
  assert.match(html, /Dershia Nadesan/);
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
