import assert from "node:assert/strict";
import test from "node:test";
import { buildRecipeFromOpenApi } from "../src/api-tool-builder.ts";
import { buildToolRequestUrl } from "../src/api-tool-runtime.ts";

const spec = {
  openapi: "3.0.3",
  servers: [{ url: "https://api.example.com/v1" }],
  paths: {
    "/rates/{base}": {
      get: {
        operationId: "getRates",
        summary: "Get exchange rates",
        parameters: [
          { name: "base", in: "path", required: true, schema: { type: "string" } },
          { name: "symbols", in: "query", required: false, schema: { type: "string" } }
        ],
        responses: { "200": { description: "ok" } }
      },
      post: {
        operationId: "createRate",
        summary: "Create rate",
        responses: { "200": { description: "ok" } }
      }
    }
  }
};

test("OpenAPI builder exposes only read operations", () => {
  const recipe = buildRecipeFromOpenApi({
    spec,
    objective: "cotacao de moedas",
    candidateName: "Rates",
    sourceUrl: "https://example.com/docs",
    specUrl: "https://api.apis.guru/v2/specs/example.com/1/openapi.json",
    candidateAuth: "No"
  });

  assert.equal(recipe.status, "validated");
  assert.equal(recipe.riskClass, "R0");
  assert.equal(recipe.authMode, "none");
  assert.equal(recipe.definition.operations.length, 1);
  assert.equal(recipe.definition.operations[0].operationId, "getRates");
  assert.equal(recipe.definition.blockedWriteOperations, 1);
  assert.equal(recipe.definition.validation.externalExecutionTested, false);
});

test("OpenAPI builder does not auto-validate uncertain authentication", () => {
  const recipe = buildRecipeFromOpenApi({
    spec: {
      ...spec,
      components: { securitySchemes: { key: { type: "apiKey", in: "query", name: "key" } } },
      security: [{ key: [] }]
    },
    objective: "rates",
    candidateName: "Protected Rates",
    sourceUrl: "https://protected.example.com/docs",
    specUrl: "https://api.apis.guru/v2/specs/protected.example.com/1/openapi.json",
    candidateAuth: "apiKey"
  });
  assert.equal(recipe.status, "draft");
  assert.equal(recipe.authMode, "unknown");
});

test("tool request builder resolves only registered path and query parameters", () => {
  const recipe = buildRecipeFromOpenApi({
    spec,
    objective: "rates",
    candidateName: "Rates",
    sourceUrl: "https://example.com/docs",
    specUrl: "https://api.apis.guru/v2/specs/example.com/1/openapi.json",
    candidateAuth: "No"
  });
  const operation = recipe.definition.operations[0];
  const url = buildToolRequestUrl(recipe.definition, operation, { base: "BRL", symbols: "USD,EUR", ignored: "x" });
  assert.equal(url.toString(), "https://api.example.com/v1/rates/BRL?symbols=USD%2CEUR");
});

test("tool request builder rejects missing path parameters", () => {
  const recipe = buildRecipeFromOpenApi({
    spec,
    objective: "rates",
    candidateName: "Rates",
    sourceUrl: "https://example.com/docs",
    specUrl: "https://api.apis.guru/v2/specs/example.com/1/openapi.json",
    candidateAuth: "No"
  });
  assert.throws(
    () => buildToolRequestUrl(recipe.definition, recipe.definition.operations[0], {}),
    /Missing required parameter/
  );
});

test("builder rejects non-HTTPS API servers", () => {
  assert.throws(() => buildRecipeFromOpenApi({
    spec: { ...spec, servers: [{ url: "http://api.example.com" }] },
    objective: "rates",
    candidateName: "Rates",
    sourceUrl: "https://example.com/docs",
    specUrl: "https://api.apis.guru/v2/specs/example.com/1/openapi.json",
    candidateAuth: "No"
  }), /safe HTTPS base URL/);
});
