import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { PLOTLY_TRACE_TYPES } from "../src/components/plotly-traces";

// ChartPanel draws scatter and bar as SVG and sends PLOTLY_TRACE_TYPES to a partial Plotly bundle.
// A trace type in neither set would reach Plotly unregistered and render nothing.
const SVG_TRACE_TYPES = ["scatter", "bar"];
// Other `type:` literals on pages: axis types, layout shapes, Jones-calculus elements.
const NOT_TRACES = ["log", "category", "line", "rotator"];

const clients = execFileSync("git", ["ls-files", "src/app/*/*/page-client.tsx"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

test("every trace type on a page is drawn by SimpleChart or registered in the Plotly bundle", () => {
  const unknown = new Set<string>();
  for (const file of clients) {
    for (const m of readFileSync(file, "utf8").matchAll(/\btype: ?["']([a-z0-9]+)["']/g)) {
      const type = m[1];
      if (![...SVG_TRACE_TYPES, ...PLOTLY_TRACE_TYPES, ...NOT_TRACES].includes(type)) unknown.add(`${file}: ${type}`);
    }
  }
  assert.deepEqual([...unknown], []);
});

test("plotly-bundle registers every Plotly trace type and bar", () => {
  const bundle = readFileSync("src/components/plotly-bundle.ts", "utf8");
  for (const type of [...PLOTLY_TRACE_TYPES, "bar"]) {
    assert.match(bundle, new RegExp(`from "plotly\\.js/lib/${type}"`), type);
  }
});
