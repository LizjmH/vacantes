import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { themeBootstrap } from "../src/lib/theme.ts";
function run(saved, system, blocked = false) {
  const root = {
    dark: false,
    style: {},
    classList: {
      toggle(name, value) {
        assert.equal(name, "dark");
        root.dark = value;
      },
    },
  };
  runInNewContext(themeBootstrap, {
    window: { matchMedia: () => ({ matches: system }) },
    localStorage: {
      getItem() {
        if (blocked) throw new Error("blocked");
        return saved;
      },
    },
    document: { documentElement: root },
  });
  return root;
}
test("saved theme wins over the device preference before rendering", () => {
  assert.equal(run("light", true).dark, false);
  assert.equal(run("dark", false).dark, true);
  assert.equal(run("dark", false).style.colorScheme, "dark");
});
test("uses the system preference when no valid choice exists or storage is blocked", () => {
  assert.equal(run(null, true).dark, true);
  assert.equal(run("invalid", false).dark, false);
  assert.equal(run(null, true, true).dark, true);
});
