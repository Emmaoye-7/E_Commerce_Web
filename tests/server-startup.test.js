import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("startup rejects an invalid MongoDB URI without printing its value", () => {
  const uri = "private-invalid-uri";
  const result = spawnSync(process.execPath, ["server.js"], {
    env: {
      ...process.env,
      MONGODB_URI: uri,
      JWT_SECRET: "test-secret-with-more-than-thirty-two-characters",
    },
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MONGODB_URI must be a MongoDB connection string/);
  assert.doesNotMatch(result.stderr, new RegExp(uri));
});
