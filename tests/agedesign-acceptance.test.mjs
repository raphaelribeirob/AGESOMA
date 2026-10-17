import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const canonical = read("AGEDESIGN.md");
const tokens = read("apps/web/app/age-tokens.css");
const midnight = read("apps/web/app/linear-midnight.css");
const bridge = read("apps/web/app/age-product-bridge.css");
const landing = read("apps/web/app/start/page.tsx");
const landingCss = read("apps/web/app/start/start-age.module.css");
const demo = read("apps/web/app/start/support-demo.tsx");
const demoCss = read("apps/web/app/start/support-demo-age.module.css");
const workforce = read("apps/web/app/workforce/workforce-preview.tsx");
const workforceCss = read("apps/web/app/workforce/workforce-preview.module.css");
const app = read("apps/web/app/agesoma-client.tsx");
const layout = read("apps/web/app/layout.tsx");
const svg = read("apps/web/public/agesoma-wordmark-age.svg");

function color(hex) {
  const c = hex.slice(1);
  return [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i,i+2),16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  });
}
function brightness(hex) {
  const [r,g,b] = color(hex);
  return .2126 * r + .7152 * g + .0722 * b;
}
function contrast(a,b) {
  const values = [brightness(a),brightness(b)].sort((a,b)=>b-a);
  return (values[0]+.05)/(values[1]+.05);
}
function token(name, seen = new Set()) {
  assert.ok(!seen.has(name), "Circular color alias " + name);
  seen.add(name);
  const declaration = new RegExp(name + "\\s*:\\s*(#[0-9a-f]{6}|var\\(--[a-z-]+\\))\\s*;", "i");
  const match = midnight.match(declaration) ?? tokens.match(declaration);
  assert.ok(match, "Missing color token " + name);
  if (match[1].startsWith("#")) return match[1];
  return token(match[1].slice(4, -1), seen);
}

function assertLocalClasses(view,css,file) {
  const names = [...new Set([...view.matchAll(/styles\.([A-Za-z][A-Za-z0-9]*)/g)].map(m=>m[1]))];
  assert.ok(names.length >= 8, "few CSS classes found for "+file);
  const missing = names.filter(n => !(new RegExp("\\."+n+"(?=[\\s:.,{>])")).test(css));
  assert.deepEqual(missing,[],file+" has missing CSS classes");
}

test("AGEDESIGN.md 1.2 is canonical in repository and four-agent model stays intact", () => {
  assert.match(canonical, /Versão: 1\.2/);
  assert.match(canonical, /## 8\. AGE MOTION/);
  assert.match(canonical, /CEO\+COO/);
  assert.match(canonical, /CMO\+CRO/);
  assert.match(canonical, /CTO\+CPO/);
  assert.match(workforce, /WORKFORCE_PROFILES\.map/);
});
test("Midnight Precision colors, typography and shape tokens match AGE v1.2", () => {
  const expected = {
    "--age-accent": "#e4f222", "--age-ink": "#ffffff",
    "--age-text": "#d0d6e0", "--age-muted": "#8a8f98",
    "--age-border": "#383b3f", "--age-surface": "#08090a",
    "--age-surface-subtle": "#0f1011", "--age-success": "#78d79b",
    "--age-warning": "#edc779", "--age-danger": "#ff8787"
  };
  for (const [name,value] of Object.entries(expected))
    assert.equal(token(name).toLowerCase(),value);
  for (const shape of ["--age-radius-card: 12px","--age-radius-control: 6px"])
    assert.ok(midnight.includes(shape));
  assert.ok(tokens.includes("--age-control-height: 48px"));
  assert.match(midnight, /--age-font-display: var\(--font-inter-variable\)/);
  assert.match(midnight, /--age-font-mono: var\(--font-berkeley-mono\)/);
  assert.ok(contrast(token("--age-accent"),token("--age-surface")) >= 4.5);
  assert.ok(contrast(token("--age-text"),token("--age-surface-subtle")) >= 7);
  assert.ok(contrast(token("--age-muted"),token("--age-surface-subtle")) >= 4.5);
});

test("AGE presentation scope loads last, while old product logic stays mounted", () => {
  assert.ok(layout.indexOf('"./age-tokens.css"') > layout.indexOf('"./agesoma-visual-system.css"'));
  assert.ok(layout.indexOf('"./age-product-bridge.css"') > layout.indexOf('"./age-tokens.css"'));
  assert.ok(layout.indexOf('"./linear-midnight.css"') > layout.indexOf('"./age-product-bridge.css"'));
  assert.match(midnight, /\.ageTheme\s*\{/);
  assert.match(app, /className="museShell ageTheme"/);
  assert.match(app, /href="\/workforce"/);
  assert.match(app, /className="ageIdentityMark"/);
  assert.doesNotMatch(app, /museAvatar isWorking|museAvatar isListening/);
  assert.match(bridge, /\.museShell\.ageTheme/);
  assert.match(bridge, /--age-accent/);
});
test("branded vector is local and preserves provenance as provisional", () => {
  assert.match(svg, /^<svg/);
  assert.match(svg, /<title[^>]*>AGESOMA<\/title>/);
  assert.match(svg, /<path fill="#171A20"/);
  assert.match(midnight, /brightness\(0\) invert\(1\)/);
  assert.match(canonical, /não um logotipo final homologado/);
  assert.match(landing, /agesoma-wordmark-age\.svg/);
  assert.match(workforce, /agesoma-wordmark-age\.svg/);
  assert.match(app, /agesoma-wordmark-age\.svg/);
});
test("there are no legacy Dot-eyes, looping agent avatars or fabricated voice activity", () => {
  assert.doesNotMatch(workforce, /WorkerAvatar|styles\.eye\b/);
  assert.doesNotMatch(workforceCss, /radial-gradient|animation: presence/);
  assert.doesNotMatch(app, /museAvatarLobe/);
  assert.match(app, /recognition\.onstart=\(\)=>setListening\(true\)/);
  assert.doesNotMatch(app, /setListening\(true\);\s*recognition\.start/);
  assert.match(workforce, /Computador não provisionado/);
  assert.match(workforce, /Nenhum computador ou integração está ativo/);
  assert.match(tokens, /prefers-reduced-motion: reduce/);
  assert.match(bridge, /prefers-reduced-motion: reduce/);
  assert.match(midnight, /prefers-reduced-motion: reduce/);
});
test("AGE color/shape/layout used on both marketing and workforce surfaces", () => {
  assert.match(landing, /className=.*ageTheme/);
  assert.match(landing, /href="#demonstracao"/);
  assert.match(landing, /<SupportPricing/);
  assert.match(landing, /<SupportDemo/);
  assert.match(landingCss, /--age-surface-subtle/);
  assert.match(landingCss, /--age-radius-card/);
  assert.match(workforceCss, /--age-radius-control/);
  assert.match(workforceCss, /--age-accent/);
  assert.match(workforceCss, /min-height: 48px/);
  assert.match(landingCss, /max-width: 599px/);
  assert.match(workforceCss, /max-width: 767px/);
  assertLocalClasses(landing,landingCss,"showroom");
  assertLocalClasses(workforce,workforceCss,"workforce");
  assertLocalClasses(demo,demoCss,"demo");
});
test("demo remains actual safe FAQ matcher, not a simulated backend integration", () => {
  assert.match(demo, /fetch\("\/api\/demo\/support"/);
  assert.match(demo, /Dados fictícios/);
  assert.match(demo, /Sem registro de ticket/);
  assert.match(demo, /<label htmlFor="age-demo-question">/);
  assert.match(demo, /role="alert"/);
  assert.match(demo, /aria-live="polite"/);
  assert.match(landing, /em desenvolvimento/i);
});

test("Midnight actions, original AGESOMA identity and authenticated text contrast", () => {
  assert.match(midnight, /--color-void: #08090a/);
  assert.match(midnight, /--color-acid-lime: #e4f222/);
  assert.match(midnight, /--age-on-accent: var\(--color-void\)/);
  assert.match(midnight, /\.museShell\.ageTheme \.museBubbleRow\.user \.museBubble/);
  assert.match(midnight, /body:has\(\.ageTheme\)/);
  assert.match(midnight, /min-height: 48px/);
  assert.doesNotMatch(midnight, /url\(https?:|linear\.app\/assets/);
  assert.match(layout, /@fontsource-variable\/jetbrains-mono\/wght\.css/);
});
