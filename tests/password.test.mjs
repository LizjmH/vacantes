import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  hashSessionToken,
} from "../src/lib/password.ts";

test("password hashes use a unique salt and validate only the correct password", async () => {
  const password = "Prueba con espacios 123!";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(first.includes(password), false);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("incorrecta", first), false);
  assert.equal(await verifyPassword(password.trim() + " ", first), false);
});

test("missing, plaintext and malformed hashes cannot authenticate", async () => {
  for (const hash of [
    "",
    "password",
    "scrypt:bad:bad",
    "scrypt:" + "a".repeat(32) + ":bad",
  ]) {
    assert.equal(await verifyPassword("password", hash), false);
  }
});

test("session tokens are stored as deterministic SHA-256 digests", () => {
  const token = "a".repeat(64);
  assert.match(hashSessionToken(token), /^[a-f0-9]{64}$/);
  assert.notEqual(hashSessionToken(token), token);
  assert.equal(hashSessionToken(token), hashSessionToken(token));
  assert.notEqual(hashSessionToken(token), hashSessionToken("b".repeat(64)));
});
