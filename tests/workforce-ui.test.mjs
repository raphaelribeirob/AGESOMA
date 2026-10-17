import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const dir = path.resolve(import.meta.dirname, "../apps/web/app/workforce");
const ui = readFileSync(path.join(dir, "workforce-preview.tsx"), "utf8");
const css = readFileSync(path.join(dir, "workforce-preview.module.css"), "utf8");
const profiles = readFileSync(path.join(dir, "workforce-profiles.ts"), "utf8");
const ageTokens = readFileSync(path.resolve(dir, "../age-tokens.css"), "utf8");
const midnight = readFileSync(path.resolve(dir, "../linear-midnight.css"), "utf8");

function luminance(color) {
  const hex = color.replace(/^#/, "");
  assert.match(hex, /^[0-9a-f]{6}$/i);
  const rgb = [0, 2, 4].map((offset) => {
    const c = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

function resolveColor(value, seen = new Set()) {
  if (value.startsWith("#")) return value;
  const name = value.match(/^var\((--(?:age|color)-[\w-]+)\)$/)?.[1];
  assert.ok(name, "Unsupported color " + value);
  assert.ok(!seen.has(name), "Circular alias " + name);
  seen.add(name);
  const matcher = new RegExp(name + "\\s*:\\s*(#[0-9a-f]{6}|var\\(--[a-z-]+\\))\\s*;", "i");
  const match = midnight.match(matcher) ?? ageTokens.match(matcher);
  assert.ok(match, "Missing Midnight or AGE token " + name);
  return resolveColor(match[1], seen);
}

function cssColorFor(selector) {
  const escaped = selector.replace(/[.*+?^$\{}()|[\]\\]/g, "\\$&");
  const blocks = [...css.matchAll(new RegExp(escaped + "\\s*\\{([^}]*)\\}", "g"))];
  assert.ok(blocks.length > 0, `No CSS block for ${selector}`);
  const values = blocks
    .map((block) => block[1].match(/(?:^|;)\s*color:\s*(var\(--age-[\w-]+\)|#[0-9a-f]{6})\s*;/i)?.[1])
    .filter(Boolean);
  assert.ok(values.length > 0, `No color for ${selector}`);
  return resolveColor(values.at(-1));
}

test("every CSS module class used by the actual workforce component exists", () => {
  const names = [...ui.matchAll(/styles\.([A-Za-z][\w]*)/g)].map((m) => m[1]);
  assert.ok(names.length > 40);
  for (const name of new Set(names)) {
    assert.match(css, new RegExp("\\." + name + "(?=[\\s:.,{>])"), `Missing style ${name}`);
  }
});

test("the UI describes a preview, not running agents or provisioned computers", () => {
  assert.match(ui, /Prévia de produto/);
  assert.match(ui, /4 agentes para 7 cargos/);
  assert.match(ui, /Nenhum computador ou integração está ativo/);
  assert.match(ui, /Computador não provisionado/);
  assert.doesNotMatch(ui, />ISOLADO</);
  assert.match(ui, /aria-pressed=\{worker.id === selected.id\}/);
  assert.match(ui, /onClick=\{\(\) => \{ setWorkerId\(worker.id\)/);
  assert.match(ui, /role="img" aria-label="Computador não provisionado"/);
});

test("secondary text meets WCAG AA contrast on all Midnight surfaces", () => {
  for (const selector of [
    ".eyebrow", ".workerInfo small", ".sourceCard small", ".sourceCard em",
    ".companyHeader small", ".statusText", ".emptyActivity p", ".activityBox p",
    ".trust p", ".caution", ".desktopCenter p"
  ]) {
    const color = cssColorFor(selector);
    for (const surface of ["#08090a", "#0f1011", "#161718"]) {
      assert.ok(contrast(color, surface) >= 4.5,
        `${selector} color ${color} contrasts ${contrast(color, surface).toFixed(2)}:1 vs ${surface}`);
    }
  }
});

test("reduced motion and narrow-screen experience are implemented", () => {
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /transition: none/);
  assert.match(ui, /aria-expanded=\{companyOpen\}/);
  assert.match(ui, /aria-pressed=\{section === "computador"\}/);
});

test("profile text and UI do not expose secrets or imply side-effect capabilities", () => {
  assert.match(profiles, /não é uma concessão|not a permission grant|not a permission grant/i);
  assert.match(ui, /Sem autorização concedida/);
  assert.match(ui, /revogação e auditoria/);
  assert.doesNotMatch(ui, /process\.env|NEXT_PUBLIC_.*(TOKEN|SECRET|KEY)/);
});

test("AGE identity has no eye-shaped Dot mascot, fake orb or idle loop", () => {
  assert.doesNotMatch(ui, /WorkerAvatar|styles\.eye\b|\bOrb\b/);
  assert.doesNotMatch(css, /@keyframes presence|animation: presence|radial-gradient/);
  assert.match(ui, /agesoma-wordmark-age\.svg/);
  assert.match(midnight, /brightness\(0\) invert\(1\)/);
  assert.match(css, /--age-radius-card/);
  assert.match(css, /--age-accent/);
  assert.match(css, /\.demoButton/);
  assert.match(ui, /href="\/workforce\/ceo"/);
});
