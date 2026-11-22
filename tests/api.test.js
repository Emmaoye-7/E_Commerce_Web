import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
const { default: app } = await import("../src/app.js");
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("health endpoint reports readiness", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("registration rejects invalid credentials before database access", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Shopper", email: "not-an-email", password: "short" }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /valid email/);
});

test("protected cart endpoint rejects requests without a token", async () => {
  const response = await fetch(`${baseUrl}/api/cart`);
  assert.equal(response.status, 401);
});

test("customer JWT cannot manage products", async () => {
  const token = jwt.sign({ role: "customer" }, process.env.JWT_SECRET, { subject: "customer-id" });
  const response = await fetch(`${baseUrl}/api/products`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ id: "sample" }),
  });
  assert.equal(response.status, 403);
});

test("unknown API routes return a JSON 404", async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(response.status, 404);
  assert.match((await response.json()).error, /Route not found/);
});
