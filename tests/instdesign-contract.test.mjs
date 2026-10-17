import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const read=p=>readFileSync(path.join(root,p),"utf8");
const document=read("INSTDESIGN.MD");
const css=read("apps/web/app/families/family-home.module.css");
const hub=read("apps/web/app/families/family-home.tsx");
const platform=read("PLATFORMDESIGN.md");
const agents=read("AGENTS.md");
const policy=read("packages/core/src/product-families.ts");

test("complete canonical INSTDESIGN v3.5.0 is byte-for-byte identical to the latest provided artifact",()=>{
  const bytes=readFileSync(path.join(root,"INSTDESIGN.MD"));
  assert.equal(bytes.byteLength,498361);
  assert.equal(createHash("sha256").update(bytes).digest("hex"),
    "ed77f98596ffc279812dc44a9643570c7a732451b253074b06364e8277f60cf8");
  assert.match(document,/\*\*Versão:\*\* 3\.5\.0/);
  assert.match(document,/# INSTDESIGN\.MD — Sistema de Design da linha Instant/);
});

test("single design spec retains the three original motion layers and exact InstantSpeak brand launch",()=>{
  assert.match(document,/ElevenLabs/);
  assert.match(document,/Duolingo/);
  assert.match(document,/Tesla Motion/);
  assert.match(document,/6\.42 Árbitro de movimento/);
  assert.match(document,/InstantSpeak™ → ISpeak™/);
  assert.match(document,/2\.650 ms/);
  assert.match(document,/League Spartan Regular 400/);
  assert.match(document,/10 paletas canônicas/);
});

test("global-first/RTL and native device release caveats survived exact import",()=>{
  assert.match(document,/GLOBAL-FIRST/);
  assert.match(document,/Universal Motion/);
  assert.match(document,/VoiceOver\/TalkBack/);
  assert.match(document,/RTL/);
  assert.match(document,/Maestro/);
  assert.match(document,/release permanece \*\*BLOCKED\*\*/);
  assert.match(document,/100% de aprovação local ≠ 100% de homologação/);
});

test("Instant portal uses exact INSTDESIGN neutral light tokens and only approved product accent colors",()=>{
  const defs=[
    "--instant-neutral-canvas:#FCFBF8",
    "--instant-neutral-surface:#FFFFFF",
    "--instant-neutral-surface-subtle:#F2EFEA",
    "--instant-neutral-text:#171717",
    "--instant-neutral-secondary:#4E4B47",
    "--instant-neutral-muted:#625E59",
    "--instant-neutral-border:#C7C2BB",
    "--instant-neutral-focus:#2459BA",
    "--instant-speak-accent:#2459BA",
    "--instant-study-accent:#3A32C8",
    "--instant-bible-accent:#1F6B52"
  ];
  for(const d of defs) assert.ok(css.includes(d),"Missing canonical palette token "+d);
  assert.match(css,/\.instant\s*\{/);
  for(const id of ["instantspeak","instantstudy","instantbible"]){
    assert.match(css,new RegExp('\\[data-product-id="'+id+'"\\]'),id);
  }
  assert.match(hub,/data-product-id=\{product\.id\}/);
});

test("Dots, AGE dark console and sibling app brands are not overwritten by Instant style",()=>{
  assert.match(css,/\.dots\s*\{[^}]*#fbf7f2/);
  assert.match(platform,/Dots.*separate design governance/);
  assert.match(platform,/AGESOMA.*Linear-inspired Midnight/);
  assert.match(policy,/independent_product_design/);
  assert.match(platform,/2650 ms opening belongs only to InstantSpeak/);
  assert.doesNotMatch(css,/(?:^|\n)\s*:root\s*\{/);
  assert.match(agents,/INSTDESIGN\.MD v3\.5\.0/);
});

test("a Markdown specification does not falsely imply installed native orb/audio or successful device QA",()=>{
  assert.match(platform,/not live audio assets or working WebGL/);
  assert.match(platform,/native Flutter\/Maestro\/WebKit\/screen reader QA/);
  assert.doesNotMatch(hub,/orb-live|microfone ativo|áudio gravando|voz conectada/i);
  assert.doesNotMatch(hub,/INSTDESIGN\.MD/i);
});

test("scoped Instant navigation focus remains functional and reduced motion remains available",()=>{
  assert.match(css,/\.instant :is\(a,button\):focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/min-height:48px/);
  assert.match(hub,/aria-current/);
});
