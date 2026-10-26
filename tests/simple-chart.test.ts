import test from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import SimpleChart from "../src/components/simple-chart";
import SimpleLineChart from "../src/components/simple-line-chart";
import { formatTick, labelStride, niceTicks, plotValue, splitAtGaps, tickCount, xCategories } from "../src/components/chart-axes";

// The step is 1, 2, 5 or 10 × 10^k, the first ≥ range/count. Before the fix it was the bare multiplier
// (2 instead of 200 for 270–960 nm), which crowded 100 labels onto the x axis ("1.5k5k5k…") and left a
// single y tick at 0 for R/T in [0, 1.05] (ROADMAP Phase 3, session 25).
test("niceTicks: linear step scales with the range", () => {
  assert.deepEqual(niceTicks(270, 960, 6, false), [400, 600, 800]); // 690/6 = 115 → 200
  assert.deepEqual(niceTicks(0, 1.05, 6, false).map((t) => +t.toFixed(10)), [0, 0.2, 0.4, 0.6, 0.8, 1]);
  assert.deepEqual(niceTicks(1500, 1600, 6, false), [1500, 1520, 1540, 1560, 1580, 1600]); // 16.7 → 20
  assert.deepEqual(niceTicks(0, 10, 6, false), [0, 2, 4, 6, 8, 10]); // 1.67 → 2 (worked before too)
  assert.equal(niceTicks(-3e-15, 3e-15, 6, false).length, 7); // 1e-15 steps, −3 … 3 (rounding at both ends)
  assert.deepEqual(niceTicks(5, 5, 6, false), []);
});

test("niceTicks: log axis", () => {
  assert.deepEqual(niceTicks(1, 1000, 6, true), [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]);
  // A range that starts mid-decade keeps the 2× and 5× ticks below its first power of ten (they were dropped).
  assert.deepEqual(niceTicks(180, 20000, 6, true), [200, 500, 1000, 2000, 5000, 10000, 20000]);
  assert.deepEqual(niceTicks(0.3, 40, 6, true), [0.5, 1, 2, 5, 10, 20]);
  // Below 10⁻¹⁰ (pulse energies in J, femtosecond limits): the decades continue; they used to stop at 10⁻¹⁰.
  const tiny = niceTicks(3e-14, 2e-6, 6, true);
  assert.equal(tiny.length, 8);
  assert.ok(Math.abs(tiny[0] / 1e-13 - 1) < 1e-12 && Math.abs(tiny[7] / 1e-6 - 1) < 1e-12, tiny.join(", "));
});

// Labels carry the digits the step needs: 20 nm steps near 1.5 µm used to print "1.5k" five times.
test("formatTick: neighbouring labels differ", () => {
  const label = (min: number, max: number) => {
    const t = niceTicks(min, max, 6, false);
    return t.map((v) => formatTick(v, t));
  };
  assert.deepEqual(label(1500, 1600), ["1500", "1520", "1540", "1560", "1580", "1600"]);
  assert.deepEqual(label(270, 960), ["400", "600", "800"]);
  assert.deepEqual(label(0, 4000), ["0", "1.0k", "2.0k", "3.0k", "4.0k"]);
  assert.deepEqual(label(0, 1.05), ["0", "0.2", "0.4", "0.6", "0.8", "1.0"]);
  assert.deepEqual(label(0, 0.003), ["0", "5e-4", "1.0e-3", "1.5e-3", "2.0e-3", "2.5e-3", "3.0e-3"]);
  const log = niceTicks(1, 1e6, 6, true); // > 4 decades: decades only
  assert.deepEqual(log.map((v) => formatTick(v, log)), ["1", "10", "100", "1.0k", "10.0k", "100.0k", "1.0M"]);
});

// Bar charts with category labels (Mueller Stokes S₀–S₃, IR materials, crystals) rendered nothing: x went through
// Number(), every label became NaN and the chart returned null (Codex review, 2026-10-13).
test("xCategories: non-numeric strings make a categorical axis, numeric strings don't", () => {
  const stokes = ["S₀ (I)", "S₁", "S₂", "S₃"];
  assert.deepEqual(xCategories([{ x: stokes }, { x: stokes }]), stokes);
  assert.deepEqual(xCategories([{ x: ["Ge", "ZnSe"] }, { x: ["ZnSe", "CaF₂"] }]), ["Ge", "ZnSe", "CaF₂"]);
  assert.equal(xCategories([{ x: ["10", "40", "100"] }]), null); // fiber-bandwidth's RATES.map(String)
  assert.equal(xCategories([{ x: [1, 2, 3] }]), null);
  assert.deepEqual(xCategories([{ x: [1, 2] }], "category"), ["1", "2"]);
  assert.equal(xCategories([]), null);
});

test("SimpleChart draws grouped bars on a category axis (mueller-matrix Stokes chart)", () => {
  const stokes = ["S₀ (I)", "S₁", "S₂", "S₃"];
  const html = renderToStaticMarkup(createElement(SimpleChart, {
    data: [
      { x: stokes, y: [1, 1, 0, 0], type: "bar", name: "Input Stokes" },
      { x: stokes, y: [0.5, -0.5, 0, 0], type: "bar", name: "Output Stokes" },
    ],
    layout: { width: 700, barmode: "group" },
  }));
  for (const label of stokes) assert.ok(html.includes(`>${label}</text>`), `tick label ${label}`);
  const rects = [...html.split("</svg>")[0].matchAll(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"[^>]*rx="1"/g)] // bars, not the clip rect
    .map((m) => m.slice(1).map(Number));
  assert.equal(rects.length, 8);
  const [inS0, , , , outS0, outS1] = rects;
  assert.ok(inS0[0] + inS0[2] <= outS0[0] + 1e-9, "input and output bars side by side in a slot");
  const zeroLine = inS0[1] + inS0[3]; // bars grow from y = 0
  assert.ok(Math.abs(outS0[1] + outS0[3] - zeroLine) < 1e-6, "a positive bar stands on the zero line");
  assert.ok(Math.abs(outS1[1] - zeroLine) < 1e-6 && outS1[3] > 0, "the negative S₁ bar hangs from the zero line");
  assert.ok(Math.abs(outS1[3] - outS0[3]) <= 0.011, "±0.5 bars have equal heights (coordinates are rounded to 0.01 px)");
});

// Phase 3c: the charts lay out at the container's pixel width, so tick counts follow the pixels (a fixed 900-unit
// viewBox scaled 12 px labels to 4–5 px on phones).
test("tickCount: one tick per spacing px, 3 to 8", () => {
  assert.equal(tickCount(620, 100), 6); // desktop: the 6 ticks the charts always had
  assert.equal(tickCount(250, 100), 3); // phone
  assert.equal(tickCount(5000, 100), 8);
  // A narrow log axis keeps the decades only: 1–1000 at 3 ticks has no 2× / 5× labels.
  assert.deepEqual(niceTicks(1, 1000, 3, true), [1, 10, 100, 1000]);
});

test("labelStride: labels thin out only when they would overlap", () => {
  assert.equal(labelStride([0, 100, 200, 300], [40, 40, 40, 40]), 1);
  assert.equal(labelStride([0, 30, 60, 90, 120], [40, 40, 40, 40, 40]), 2); // 30 < 40 + 6, 60 ≥ 46
  assert.equal(labelStride([0], [40]), 1);
});

test("plotValue and splitAtGaps: null breaks a line instead of plotting 0", () => {
  assert.equal(plotValue(null, false), null); // Number(null) is 0
  assert.equal(plotValue("", false), null);
  assert.equal(plotValue(Infinity, false), null);
  assert.equal(plotValue(0, true), null); // ≤ 0 on a log axis
  assert.equal(plotValue(1e-18, true), 1e-18); // no floor on log axes
  assert.equal(plotValue("2.5", false), 2.5);
  assert.deepEqual(splitAtGaps([1, 2, null, 3, null, null, 4]), [[1, 2], [3], [4]]);
  assert.deepEqual(splitAtGaps([1, null, 2], true), [[1, 2]]); // connectgaps
  assert.deepEqual(splitAtGaps([null, null]), []);
});

test("SimpleChart: gaps, legend below the plot, marker colours", () => {
  const html = renderToStaticMarkup(createElement(SimpleChart, {
    data: [
      { x: [1, 2, 3, 4], y: [1, null, 3, 4], type: "scatter", mode: "lines", name: "A long trace name that Plotly clipped" },
      { x: [1, 2], y: [2, 2], type: "scatter", mode: "markers", name: "Points", marker: { color: "#123456" } },
      { x: [1, 2], y: [0, 1], type: "scatter", mode: "lines", name: "Hidden", showlegend: false },
    ],
    layout: { width: 700, legend: { x: 0.9, y: 0.9 } },
  }));
  const linePath = html.match(/<path d="([^"]+)" fill="none" stroke="#60a5fa"/)?.[1] ?? "";
  assert.equal(linePath.match(/M/g)?.length, 2, `null splits the line in two: ${linePath}`);
  assert.ok(html.includes("<span>A long trace name that Plotly clipped</span>"), "the legend is HTML, never clipped");
  assert.ok(!html.includes(">Hidden<"), "showlegend: false leaves the trace out of the legend");
  assert.equal((html.match(/fill="#123456"/g) ?? []).length, 3, "marker.color colours both markers and the legend swatch");
  assert.equal((html.match(/<circle cx/g) ?? []).length, 2 + 1, "two markers (r = size / 2) plus the legend dot");
});

test("SimpleLineChart: server render at the default width, fixed height, gaps at null", () => {
  const html = renderToStaticMarkup(createElement(SimpleLineChart, {
    xLabel: "x", yLabel: "y",
    series: [{ name: "s", color: "#ff0000", points: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: null }, { x: 4, y: 3 }, { x: 5, y: 4 }] }],
  }));
  assert.ok(html.includes('viewBox="0 0 900 320"') && html.includes('height="320"'), "default width, 320 px tall");
  const d = html.match(/<path d="([^"]+)" fill="none" stroke="#ff0000"/)?.[1] ?? "";
  assert.equal(d.match(/M/g)?.length, 2, d);
  // Log axis down to 1e-18, non-positive skipped (it used to clamp to 1e-12).
  const log = renderToStaticMarkup(createElement(SimpleLineChart, {
    xLabel: "x", yLabel: "y", yScale: "log",
    series: [{ name: "s", color: "#ff0000", points: [{ x: 0, y: 1e-18 }, { x: 1, y: 0 }, { x: 2, y: 1e-6 }] }],
  }));
  assert.ok(log.includes(">1.0e-18<") || log.includes(">1e-18<"), "a 1e-18 tick");
});
