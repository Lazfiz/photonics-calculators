import test from "node:test";
import assert from "node:assert/strict";

import { clampToRange, isInRange, parseNumberInput } from "../src/lib/number-input";

test("parseNumberInput accepts finite numbers only", () => {
  assert.equal(parseNumberInput("50"), 50);
  assert.equal(parseNumberInput("1e-3"), 1e-3);
  assert.equal(parseNumberInput("-0.5"), -0.5);
  for (const bad of ["", " ", "-", "1e", "abc", "Infinity", "NaN"]) {
    assert.equal(parseNumberInput(bad), null, JSON.stringify(bad));
  }
});

test("clampToRange and isInRange respect optional bounds", () => {
  assert.equal(clampToRange(5, 10, 100), 10);
  assert.equal(clampToRange(500, 10, 100), 100);
  assert.equal(clampToRange(50, 10, 100), 50);
  assert.equal(clampToRange(-1, undefined, 100), -1);
  assert.equal(isInRange(10, 10, 100), true);
  assert.equal(isInRange(9.99, 10, 100), false);
  assert.equal(isInRange(1e9), true);
});
