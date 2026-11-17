import { test } from "node:test";
import assert from "node:assert/strict";
import { searchTerms } from "../src/lib/employer-search.ts";

test("search ignores accents and case, including full contact names", () => {
  assert.deepEqual(searchTerms("  COMPAÑÍA  José  Pérez "), [
    "compania",
    "jose",
    "perez",
  ]);
});
test("phone searches ignore spaces, parentheses, country prefix symbol and hyphens", () => {
  assert.deepEqual(searchTerms("(833) 123-45-67"), ["8331234567"]);
  assert.deepEqual(searchTerms("+52 833 123 4567"), ["528331234567"]);
});
test("empty queries do not filter; wildcard characters stay literal", () => {
  assert.deepEqual(searchTerms("  "), []);
  assert.deepEqual(searchTerms("% _ ' OR 1=1"), ["%", "_", "'", "or", "1=1"]);
});
