#!/usr/bin/env node
/**
 * Static deployment-shape checks. No network, no reads of secret values
 * unless --env is explicitly passed. Does not attest production readiness.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const at = (...parts) => resolve(root, ...parts);
const readJson = (...parts) => JSON.parse(readFileSync(at(...parts), "utf8"));
const problems = [];
function requireFile(...parts) {
  if (!existsSync(at(...parts))) problems.push("Missing " + parts.join("/"));
}
const pkg = readJson("package.json");
const web = readJson("apps", "web", "package.json");
const vercel = readJson("apps", "web", "vercel.json");
if (!pkg.workspaces?.includes("apps/*") || !pkg.workspaces?.includes("packages/*")) {
  problems.push("Root npm workspaces are missing");
}
if (pkg.engines?.node !== "24.x") problems.push("Root Node engine must be 24.x");
if (web.name !== "@agesoma/web") problems.push("App workspace name mismatch");
if (!web.dependencies?.next) problems.push("Next.js dependency missing");
if (!web.dependencies?.["@agesoma/core"] || !web.dependencies?.["@agesoma/db"]) {
  problems.push("Shared AGESOMA workspace dependencies missing");
}
if (vercel.framework !== "nextjs") problems.push("Vercel framework must be nextjs");
if (vercel.rootDirectory !== undefined || vercel.buildCommand !== undefined || vercel.installCommand !== undefined) {
  problems.push("Root directory/build/install are dashboard/native workspace settings, not app overrides");
}
requireFile("apps","web","next.config.ts");
requireFile("apps","web","app","layout.tsx");
requireFile("apps","web","app","api","health","route.ts");
requireFile("apps","web",".env.vercel.example");
requireFile("docs","VERCEL_NEW_ACCOUNT_BOOTSTRAP.md");
if (process.argv.includes("--env")) {
  const required = ["DATABASE_URL","AGESOMA_DB_SCHEMA","BETTER_AUTH_URL","BETTER_AUTH_SECRET"];
  for (const name of required) {
    const value = process.env[name];
    if (!value || value.startsWith("replace-with-")) problems.push(name + " is not configured");
  }
  const url = process.env.BETTER_AUTH_URL;
  if (url && !/^https:\/\/[^/]+\/?$/.test(url)) {
    problems.push("BETTER_AUTH_URL must be one exact public HTTPS origin");
  }
  const db = process.env.DATABASE_URL;
  if (db && !/^postgres(ql)?:\/\//.test(db)) problems.push("DATABASE_URL must be a PostgreSQL URL");
  if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length < 32) {
    problems.push("BETTER_AUTH_SECRET should have at least 32 characters");
  }
  if (process.env.AGESOMA_DB_SCHEMA !== "agesoma_p0") problems.push("AGESOMA_DB_SCHEMA must be agesoma_p0");
}
if (problems.length) {
  for (const p of problems) console.error("FAIL:", p);
  process.exitCode = 1;
} else {
  console.log("PASS: AGESOMA Vercel workspace scaffold");
  console.log("NOTE: credentials, Neon migrations, external workers and deploy health are not verified.");
}
