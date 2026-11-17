import test from "node:test";
import assert from "node:assert/strict";

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { clampToRange, isInRange, numberInputMode, parseNumberInput } from "../src/lib/number-input";
import { schemas } from "../src/schemas";

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

test("keypad: decimal (no minus key on iPhone) only where min >= 0; a field that may go negative gets text", () => {
  assert.equal(numberInputMode(0), "decimal");
  assert.equal(numberInputMode(1e-3), "decimal");
  assert.equal(numberInputMode(-40), "text");
  assert.equal(numberInputMode(undefined), "text");
  // Every schema input: the keypad its range calls for. Both kinds exist (dBm powers, angles, temperatures go negative).
  const inputs = schemas.flatMap((schema) => schema.inputs.map((input) => ({ href: schema.href, ...input })));
  const negative = inputs.filter((input) => input.min < 0);
  assert.ok(negative.length > 50 && negative.length < inputs.length, `${negative.length} of ${inputs.length}`);
  for (const input of inputs) {
    assert.equal(numberInputMode(input.min), input.min >= 0 ? "decimal" : "text", `${input.href} ${input.key}`);
  }
  // And every number field in the app takes its keypad from that rule: no hard-coded inputMode="decimal", and each
  // <input type="number"> passes through numberInputMode (with its min, in the shared components).
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (path.endsWith(".tsx")) files.push(path);
    }
  };
  walk("src");
  let fields = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /inputMode="decimal"/, file);
    for (const tag of source.match(/<input\b[^>]*type="number"[^>]*>/g) ?? []) {
      fields += 1;
      assert.match(tag, /inputMode=\{numberInputMode\((min)?\)\}/, `${file}: ${tag.slice(0, 80)}`);
    }
  }
  assert.ok(fields >= 5, `${fields} number fields`);
  for (const file of ["src/components/validated-number-input.tsx", "src/components/input-slider.tsx"]) {
    assert.match(readFileSync(file, "utf8"), /inputMode=\{numberInputMode\(min\)\}/, file);
  }
});
