import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { countTests, STATS_FILE } from "../scripts/test-stats";

test("test-stats.json matches the tests the About page quotes", () => {
  const committed = JSON.parse(readFileSync(STATS_FILE, "utf8"));
  assert.deepEqual(committed, countTests(), "the test count changed: run `npx tsx scripts/test-stats.ts`");
});
