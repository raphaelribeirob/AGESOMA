import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const fixtureDir = "qa-artifacts/screenshots";
const ensureDir = () => mkdirSync(fixtureDir, { recursive: true });

test("Instant family opens with original design and three correct products", async ({ page }, info) => {
  const issues = [];
  page.on("pageerror", (error) => issues.push(error.message));
  await page.goto("/instant");
  await expect(page.locator("main[data-platform-family='instant']")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Aprenda\. Pratique\. Evolua\./ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "InstantSpeak" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "InstantStudy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "InstantBible" })).toBeVisible();
  await expect(page.locator("article[data-product-id]")).toHaveCount(3);
  const bg = await page.locator("main[data-platform-family='instant']").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(252, 251, 248)");
  expect(issues).toEqual([]);
  ensureDir();
  await page.screenshot({ path: `${fixtureDir}/instant-${info.project.name}.png`, fullPage: true });
});

test("Dots stays a separate family, not a copy of Instant", async ({ page }, info) => {
  await page.goto("/dots");
  await expect(page.locator("main[data-platform-family='dots']")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Companheiros que aprendem com você/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "DotSpeak" })).toBeVisible();
  await expect(page.locator("article[data-product-id]")).toHaveCount(1);
  const bg = await page.locator("main[data-platform-family='dots']").evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(251, 247, 242)");
  await expect(page.getByRole("link", { name: "Instant", exact: true })).toBeVisible();
  ensureDir();
  await page.screenshot({ path: `${fixtureDir}/dots-${info.project.name}.png`, fullPage: true });
});

test("mobile and desktop layouts do not overflow viewport", async ({ page }) => {
  for (const route of ["/instant", "/dots", "/start"]) {
    await page.goto(route);
    await page.locator("main").first().waitFor();
    const values = await page.evaluate(() => ({
      contentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(values.contentWidth, route + " overflows: " + JSON.stringify(values))
      .toBeLessThanOrEqual(values.viewportWidth + 2);
  }
});

test("the real AGESOMA public demo answers grounded examples and refuses unknown actions", async ({ page }) => {
  await page.goto("/start");
  await expect(page.getByRole("heading", { name: /Respostas confiáveis/ })).toBeVisible();
  await page.getByRole("button", { name: "Qual é o prazo de entrega?" }).click();
  await expect(page.getByText("Resposta encontrada na base")).toBeVisible();
  await page.getByRole("button", { name: "Posso alterar um pedido pago?" }).click();
  await expect(page.getByText("Resposta desconhecida → encaminhamento humano")).toBeVisible();
  await expect(page.getByText(/Sem registro de ticket, integração externa ou contratação/)).toBeVisible();
});

test("demo API denies cross-origin, invalid payload, and uncontrolled side effects", async ({ request, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const denied = await request.post("/api/demo/support", {
    headers: { origin: "https://evil.example", "content-type": "application/json" },
    data: { message: "Qual é o prazo de entrega?" }
  });
  expect(denied.status()).toBe(403);
  const invalid = await request.post("/api/demo/support", {
    headers: { origin, "content-type": "application/json" },
    data: { message: "X" }
  });
  expect(invalid.status()).toBe(400);
  const answered = await request.post("/api/demo/support", {
    headers: { origin, "content-type": "application/json" },
    data: { message: "Qual é o prazo de entrega?" }
  });
  expect(answered.status()).toBe(200);
  const body = await answered.json();
  expect(body.simulation).toBe(true);
  expect(body.persisted).toBe(false);
  expect(body.externallyExecuted).toBe(false);
  expect(["answered","needs_human"]).toContain(body.status);
  expect(answered.headers()["cache-control"]).toContain("no-store");
});

test("private API rejects unauthenticated agent tasks, no tenant header bypass", async ({ request }) => {
  const response = await request.post("/api/agesoma", {
    headers: { "content-type": "application/json", "x-tenant-id": "someone_else" },
    data: { action: "message", message: "Pague todas as contas da empresa" },
    timeout: 15_000
  });
  expect(response.status()).toBe(401);
  const data = await response.json();
  expect(data.error).toMatch(/sessão|entre novamente/i);
});

test("security headers prevent framing and unauthorized browser APIs", async ({ request }) => {
  const response = await request.get("/instant");
  expect(response.status()).toBe(200);
  const h = response.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["permissions-policy"]).toContain("microphone=()");
});

test("the login page never suggests that a family portal grants account access", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /Entre na sua empresa/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "E-mail" })).toBeVisible();
  await expect(page.getByText(/navegador não escolhe tenant/i)).toBeVisible();
});
