import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root=path.resolve(import.meta.dirname,"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
const theme=read("apps/web/app/linear-midnight.css");
const base=read("apps/web/app/age-tokens.css");
const layout=read("apps/web/app/layout.tsx");
const spec=read("AGEDESIGN.md");
const paths=[
 ["apps/web/app/start/page.tsx","apps/web/app/start/start-age.module.css"],
 ["apps/web/app/workforce/workforce-preview.tsx","apps/web/app/workforce/workforce-preview.module.css"],
 ["apps/web/app/workforce/ceo/ceo-intake.tsx","apps/web/app/workforce/ceo/ceo-intake.module.css"],
 ["apps/web/app/workforce/ceo/ceo-quick-win.tsx","apps/web/app/workforce/ceo/ceo-quick-win.module.css"],
 ["apps/web/app/workforce/ceo/ceo-companion.tsx","apps/web/app/workforce/ceo/ceo-companion.module.css"],
 ["apps/web/app/start/support-demo.tsx","apps/web/app/start/support-demo-age.module.css"]
];

function resolve(name,seen=new Set()){
  assert.ok(!seen.has(name),"Alias loop "+name);seen.add(name);
  const declaration=new RegExp(name+"\\s*:\\s*(#[0-9a-f]{6}|var\\(--[a-z-]+\\))\\s*;","i");
  const match=theme.match(declaration)??base.match(declaration);
  assert.ok(match,"Token missing "+name);
  return match[1].startsWith("#")?match[1].toLowerCase():resolve(match[1].slice(4,-1),seen);
}
function luminance(hex){
  const values=[1,3,5].map(i=>{
    const c=parseInt(hex.slice(i,i+2),16)/255;
    return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
  });
  return .2126*values[0]+.7152*values[1]+.0722*values[2];
}
function contrast(a,b){
  const vals=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return(vals[0]+.05)/(vals[1]+.05);
}
test("Midnight is scoped to AGESOMA AGE roots and loaded AFTER legacy bridge",()=>{
  assert.match(theme,/\.ageTheme\s*\{/);
  assert.ok(layout.indexOf('"./linear-midnight.css"')>layout.indexOf('"./age-product-bridge.css"'));
  assert.match(spec,/Emenda normativa v1\.2/);
  assert.match(theme,/color-scheme: dark/);
  assert.doesNotMatch(theme,/(?:^|\n)\s*:root\s*\{/);
});
test("faithful midnight palette, quiet hairlines and typography",()=>{
  const expected={
    "--color-void":"#08090a","--color-carbon":"#0f1011",
    "--color-obsidian":"#161718","--color-graphite":"#23252a",
    "--color-smoke":"#383b3f","--color-paper":"#ffffff",
    "--color-acid-lime":"#e4f222","--color-fog":"#8a8f98"
  };
  for(const [name,color] of Object.entries(expected))assert.equal(resolve(name),color);
  assert.equal(resolve("--age-surface"),resolve("--color-void"));
  assert.equal(resolve("--age-surface-subtle"),resolve("--color-carbon"));
  assert.equal(resolve("--age-ink"),resolve("--color-paper"));
  assert.equal(resolve("--age-accent"),resolve("--color-acid-lime"));
  assert.match(theme,/--age-hairline: 0\.5px solid/);
  assert.match(theme,/--age-radius-control: 6px/);
  assert.match(theme,/--age-radius-card: 12px/);
  assert.match(theme,/--age-font-ui: var\(--font-inter-variable\)/);
});
test("actual primary CTA dark-text contrast and secondary metadata >= WCAG AA",()=>{
  const checks=[
    ["Primary",resolve("--age-on-accent"),resolve("--age-accent"),4.5],
    ["Heading",resolve("--age-ink"),resolve("--age-surface"),7],
    ["Body",resolve("--age-text"),resolve("--age-surface-subtle"),7],
    ["Metadata",resolve("--age-muted"),resolve("--age-panel"),4.5],
    ["Warning",resolve("--age-warning"),resolve("--age-panel"),4.5],
    ["Danger",resolve("--age-danger"),resolve("--age-panel"),4.5],
  ];
  for(const [name,fg,bg,min] of checks)assert.ok(contrast(fg,bg)>=min,
    name+" "+contrast(fg,bg).toFixed(2)+":1 is below "+min);
});
test("the AGESOMA wordmark remains original and is inverted for the dark surface",()=>{
  const svg=read("apps/web/public/agesoma-wordmark-age.svg");
  assert.match(svg,/<title[^>]*>AGESOMA<\/title>/);
  assert.match(theme,/img\[src="\/agesoma-wordmark-age\.svg"\]/);
  assert.match(theme,/brightness\(0\) invert\(1\)/);
  assert.doesNotMatch(theme,/linear\.app\/assets|linear-logo|linear-wordmark/);
});
test("authenticated chat never renders a white-on-white agent mark or user bubble",()=>{
  assert.match(theme,/\.museShell\.ageTheme \.ageIdentityMark/);
  assert.match(theme,/color: var\(--age-surface\)/);
  assert.match(theme,/\.museShell\.ageTheme \.museBubbleRow\.user \.museBubble/);
  assert.match(theme,/background: var\(--age-panel\)/);
  assert.match(theme,/color: var\(--age-ink\)/);
});
test("six main surfaces keep their CSS module class contracts intact",()=>{
  for(const [jsx,css] of paths){
    const view=read(jsx),styles=read(css);
    const names=[...new Set([...view.matchAll(/styles\.([A-Za-z][\w]*)/g)].map(m=>m[1]))];
    assert.ok(names.length>=5,jsx+" too few local classes");
    const missing=names.filter(name=>!new RegExp("\\."+name+"(?=[\\s:.,{>])").test(styles));
    assert.deepEqual(missing,[],jsx+" missing styles");
  }
});
test("functional AGE controls retain >=48px touch targets and reduced motion",()=>{
  assert.match(base,/--age-control-height: 48px/);
  assert.match(theme,/\.ageTheme \.ageButton \{ min-height: 48px/);
  assert.match(theme,/prefers-reduced-motion: reduce/);
  assert.match(theme,/outline: 2px solid var\(--age-focus\)/);
});
test("CEO diagnostic uses neutral secondary CTA so lime is reserved for action",()=>{
  const ui=read("apps/web/app/workforce/ceo/ceo-quick-win.tsx");
  assert.match(ui,/className="ageButton ageButtonSecondary" disabled=\{busy\|\|!raw\.trim\(\)\}/);
  assert.doesNotMatch(ui,/className="ageButton ageButtonPrimary"/);
  const welcome=read("apps/web/app/workforce/ceo/ceo-intake.tsx");
  assert.match(welcome,/className="ageButton ageButtonPrimary"/);
});
test("marketing CTA is unique primary and pricing action is a white pill",()=>{
  const css=read("apps/web/app/start/start-age.module.css");
  assert.match(css,/a:global\(\.ageButtonPrimary\)/);
  assert.match(css,/--color-paper/);
  assert.match(theme,/nav\[aria-label="Navegação principal"\] a:last-child/);
});
