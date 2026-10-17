import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const canonical = read("AGEDESIGN.md");
const tokens = read("apps/web/app/age-tokens.css");
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
function token(name) {
  const match = tokens.match(new RegExp(name + "\\s*:\\s*(#[\\da-f]{6})", "i"));
  assert.ok(match, "Missing color token "+name);
  return match[1];
}
function assertLocalClasses(view,css,file) {
  const names = [...new Set([...view.matchAll(/styles\.([A-Za-z][A-Za-z0-9]*)/g)].map(m=>m[1]))];
  assert.ok(names.length >= 8, "few CSS classes found for "+file);
  const missing = names.filter(n => !(new RegExp("\\."+n+"(?=[\\s:.,{>])")).test(css));
  assert.deepEqual(missing,[],file+" has missing CSS classes");
}

test("AGEDESIGN.md 1.1 is canonical in repository and four-agent model stays intact", () => {
  assert.match(canonical, /Versão: 1\.1/);
  assert.match(canonical, /## 8\. AGE MOTION/);
  assert.match(canonical, /CEO\+COO/);
  assert.match(canonical, /CMO\+CRO/);
  assert.match(canonical, /CTO\+CPO/);
  assert.match(workforce, /WORKFORCE_PROFILES\.map/);
});
test("exact AGE colors, font and shape tokens match the design document", () => {
  const expected = {
    "--age-accent": "#385ce5", "--age-ink": "#171a20",
    "--age-text": "#393c41", "--age-muted": "#5c5e62",
    "--age-border": "#cccccc", "--age-surface": "#ffffff",
    "--age-surface-subtle": "#eeeeee", "--age-success": "#146c43",
    "--age-warning": "#995a00", "--age-danger": "#b42318"
  };
  for (const [name,value] of Object.entries(expected)) assert.equal(token(name).toLowerCase(),value);
  for (const shape of ["--age-radius-card: 8px","--age-radius-control: 4px","--age-control-height: 48px"]) assert.ok(tokens.includes(shape));
  assert.match(tokens, /--age-font-display/);
  assert.ok(contrast(token("--age-accent"),"#ffffff") >= 4.5);
  assert.ok(contrast(token("--age-text"),"#ffffff") >= 7);
  assert.ok(contrast(token("--age-muted"),"#eeeeee") >= 4.5);
});
test("AGE presentation scope loads last, while old product logic stays mounted", () => {
  assert.ok(layout.indexOf('"./age-tokens.css"') > layout.indexOf('"./agesoma-visual-system.css"'));
  assert.ok(layout.indexOf('"./age-product-bridge.css"') > layout.indexOf('"./age-tokens.css"'));
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
  assert.match(canonical, /não um logotipo final homologado/);
  assert.match(landing, /agesoma-wordmark-age\.svg/);
  assert.match(workforce, /agesoma-wordmark-age\.svg/);
  assert.match(app, /agesoma-wordmark-age\.svg/);
});
test("there are no legacy Dot-eyes, looping agent avatars or fabricated voice activity", () => {
  assert.doesNotMatch(workforce, /WorkerAvatar|styles\.eye/);
  assert.doesNotMatch(workforceCss, /radial-gradient|animation: presence/);
  assert.doesNotMatch(app, /museAvatarLobe/);
  assert.match(app, /recognition\.onstart=\(\)=>setListening\(true\)/);
  assert.doesNotMatch(app, /setListening\(true\);\s*recognition\.start/);
  assert.match(workforce, /Computador não provisionado/);
  assert.match(workforce, /Nenhum computador ou integração está ativo/);
  assert.match(tokens, /prefers-reduced-motion: reduce/);
  assert.match(bridge, /prefers-reduced-motion: reduce/);
});
test("AGE color/shape/layout used on both marketing and workforce surfaces", () => {
  assert.match(landing, /className=\{\`\\$\{styles\.page\} ageTheme\`\}/);
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
  assert.match(landing, /em desenvolvimento/);
});
