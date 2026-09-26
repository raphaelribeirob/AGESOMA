import assert from "node:assert/strict";
import test from "node:test";
import { rankApiCandidates } from "../src/api-discovery.ts";

const candidates = [
  {
    name: "Open Rates",
    url: "https://rates.example.com/docs",
    description: "Currency exchange rates",
    auth: "No",
    https: true,
    cors: "Yes",
    category: "Currency Exchange",
    source: "public-api-lists",
    openApiUrl: "https://api.apis.guru/v2/specs/rates.example.com/1.0/openapi.json"
  },
  {
    name: "Paid Rates",
    url: "https://paid.example.com/docs",
    description: "Currency exchange rates",
    auth: "apiKey",
    https: true,
    cors: "Unknown",
    category: "Currency Exchange",
    source: "public-apis",
    openApiUrl: null
  },
  {
    name: "HTTP Rates",
    url: "http://legacy.example.com/docs",
    description: "Currency exchange rates",
    auth: "No",
    https: false,
    cors: "Yes",
    category: "Currency Exchange",
    source: "public-api-lists",
    openApiUrl: null
  }
];

test("API discovery prefers keyless HTTPS candidates", () => {
  const result = rankApiCandidates(candidates, "currency exchange API", 5);
  assert.equal(result[0].name, "Open Rates");
  assert.equal(result.some((item) => item.name === "HTTP Rates"), false);
});

test("no-auth filter excludes credentialed candidates", () => {
  const result = rankApiCandidates(candidates, "currency exchange sem chave", 5);
  assert.equal(result.every((item) => item.auth === "No"), true);
});

test("OpenAPI filter only returns machine-readable candidates", () => {
  const result = rankApiCandidates(candidates, "currency exchange openapi", 5);
  assert.equal(result.length, 1);
  assert.equal(result[0].openApi, true);
});
