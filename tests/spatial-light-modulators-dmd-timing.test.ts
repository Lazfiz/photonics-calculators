import test from "node:test";
import assert from "node:assert/strict";

import {
  DLPC900_MIN_PATTERN_US, type TimingSetup, binaryDataRate, bitPlaneTimes, colourSlot, dlpc900MinPattern, dmdTiming, greyLevels,
  lsbTime, onTime,
} from "../src/physics/spatial-light-modulators/dmd-timing";
import schema from "../src/schemas/spatial-light-modulators/dmd-timing";
import { runSchema } from "../src/schemas/run";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);
// DLPC900 + DLP6500 (TI DLPS037H, DLPS053B): 1920 × 1080 mirrors, 9523 binary patterns/s, 8-bit minimum 4046 µs.
const dlp6500: TimingSetup = {
  bits: 8, exposure: 4046e-6, dark: 0, grey: 200, dmd: "DLP6500", binaryRate: 9523, mirrorsX: 1920, mirrorsY: 1080, frameRate: 120, colours: 3,
};
const run = (values: Record<string, number | string>) =>
  runSchema(schema, {
    ...Object.fromEntries(schema.inputs.map((i) => [i.key, i.default])),
    ...Object.fromEntries((schema.choices ?? []).map((c) => [c.key, c.default])),
    ...values,
  });

test("DLPC900 datasheet Sec. 6.3: 120 Hz RGB gives each colour 2.78 ms, split into 8 binary-weighted planes", () => {
  close(colourSlot(120, 3), 2.78e-3, 0.005);
  close(colourSlot(120, 3), 1 / 360, 1e-15);
  // Weights 1 … 128 sum to 255, so the LSB is 1/(360 × 255) s = 10.8932 µs and the planes add back to the slot.
  close(lsbTime(1 / 360, 8), 10.8932e-6, 1e-5);
  const planes = bitPlaneTimes(1 / 360, 8);
  assert.equal(planes.length, 8);
  close(planes[7] / planes[0], 128, 1e-12);
  close(planes.reduce((a, b) => a + b, 0), 1 / 360, 1e-12);
});

test("DLP6500 datasheet: 9523 Hz on 1920 × 1080 is 19.7 Gbit/s; the DLPC910's 11 574 Hz is 24 Gbit/s", () => {
  close(binaryDataRate(1920, 1080, 9523), 19.7e9, 0.005);
  close(binaryDataRate(1920, 1080, 9523), 19.7468928e9, 1e-12);
  close(binaryDataRate(1920, 1080, 11574), 24e9, 0.005);
  // 1/9523 Hz = 105.009 µs, the 1-bit entry of DLPS037H Table 6-4 (105 µs).
  close(dmdTiming(dlp6500).binaryTime, 105e-6, 1e-4);
  close(dmdTiming(dlp6500).binaryTime * 1e6, DLPC900_MIN_PATTERN_US.DLP6500[1], 1e-4);
});

test("DLPS037H Table 6-4 as printed: DLP6500 105 … 4046 µs, DLP500YX 16-bit 663 225 µs; gaps give NaN", () => {
  close(dlpc900MinPattern("DLP6500", 8), 4046e-6, 1e-12);
  close(dlpc900MinPattern("DLP9000", 4), 733e-6, 1e-12);
  close(dlpc900MinPattern("DLP5500", 1), 94e-6, 1e-12);
  close(dlpc900MinPattern("DLP670S", 7), 2000e-6, 1e-12);
  close(dlpc900MinPattern("DLP500YX", 16), 663225e-6, 1e-12);
  // The DLP500YX column is shifted in the PDF's text layer; DLPU018J Table 2-110 confirms 62 µs at 1 bit, 2263 µs at 8.
  close(dlpc900MinPattern("DLP500YX", 1), 62e-6, 1e-12);
  close(dlpc900MinPattern("DLP500YX", 8), 2263e-6, 1e-12);
  assert.ok(Number.isNaN(dlpc900MinPattern("DLP6500", 10)));
  assert.ok(Number.isNaN(dlpc900MinPattern("DLP500YX", 9)));
  // The table rises with bit depth for every DMD.
  for (const t of Object.values(DLPC900_MIN_PATTERN_US)) {
    const v = Object.entries(t).sort((a, b) => +a[0] - +b[0]).map((e) => e[1]);
    v.slice(1).forEach((x, i) => assert.ok(x > v[i]));
  }
  // It isn't (2^b − 1) × the 1-bit time: 255 × 105 µs = 26.8 ms against 4046 µs, an 8-bit LSB of 15.87 µs.
  close(lsbTime(4046e-6, 8), 15.8667e-6, 1e-5);
});

test("Defaults (DLP6500, 8 bits at 4046 µs, g = 200): LSB, MSB, on-time, rate and patterns per 120 Hz frame", () => {
  const r = dmdTiming(dlp6500);
  assert.equal(r.greyLevels, 256);
  close(r.lsb, 4046e-6 / 255, 1e-12);
  close(r.msb, (128 * 4046e-6) / 255, 1e-12);
  close(r.onTime, 3173.33e-6, 1e-5);
  close(r.onFraction, 200 / 255, 1e-12);
  close(r.meanFraction, 200 / 255, 1e-12);
  close(r.patternRate, 247.158, 1e-5);
  close(r.tiMaxRate, 247.158, 1e-5);
  assert.equal(r.patternsPerFrame, 2);
  // 1 ms of dark time: period 5046 µs, 198.177 Hz, the mirror on 3173.33/5046 = 62.888 % of the period; one per frame.
  const d = dmdTiming({ ...dlp6500, dark: 1e-3 });
  close(d.patternRate, 198.177, 1e-5);
  close(d.meanFraction, 0.62888, 1e-4);
  assert.equal(d.patternsPerFrame, 1);
});

test("Edges: 1 bit is one plane equal to the exposure; g = 0 and 2^b − 1; an exact multiple of the frame fits", () => {
  close(lsbTime(105e-6, 1), 105e-6, 1e-15);
  assert.equal(greyLevels(1), 2);
  assert.equal(greyLevels(16), 65536);
  assert.equal(onTime(1e-3, 8, 0), 0);
  close(onTime(1e-3, 8, 255), 1e-3, 1e-12);
  assert.ok(Number.isNaN(onTime(1e-3, 8, 256)));
  assert.ok(Number.isNaN(onTime(1e-3, 8, 2.5)));
  assert.ok(Number.isNaN(greyLevels(0)) && Number.isNaN(greyLevels(17)) && Number.isNaN(lsbTime(1e-3, 7.5)));
  assert.ok(Number.isNaN(lsbTime(0, 8)) && Number.isNaN(colourSlot(0, 3)));
  // Two patterns of exactly half a 120 Hz frame fit; a hair longer and only one does.
  assert.equal(dmdTiming({ ...dlp6500, exposure: 1 / 240 }).patternsPerFrame, 2);
  assert.equal(dmdTiming({ ...dlp6500, exposure: (1 / 240) * 1.000001 }).patternsPerFrame, 1);
  // 24 bits per pixel per frame (DLPS037H Sec. 6.4.1): 1-bit patterns of 105 µs would fit 79 times in 8333 µs, but a
  // frame carries 24 of them; 16-bit patterns, one.
  assert.equal(dmdTiming({ ...dlp6500, bits: 1, exposure: 105e-6 }).patternsPerFrame, 24);
  assert.equal(dmdTiming({ ...dlp6500, bits: 16, exposure: 1e-3 }).patternsPerFrame, 1);
});

test("Schema: checks hold, and every null has a reason", () => {
  for (const c of schema.checks) {
    const r = run(c.inputs as Record<string, number | string>);
    for (const [k, v] of Object.entries(c.expect)) close(r.outputs[k] as number, v as number, c.tolerance, k);
  }
  const big = run({ bits: 4, grey: 16 });
  assert.equal(big.outputs.onTime, null);
  assert.match(big.warnings.join(" "), /levels 0 to 15/);
  const none = run({ dmd: "none" });
  assert.equal(none.outputs.tiMinPattern, null);
  assert.match(none.warnings.join(" "), /No DLPC900 table/);
  const nine = run({ bits: 9 });
  assert.equal(nine.outputs.tiMaxRate, null);
  assert.match(nine.warnings.join(" "), /bit depths 1–8 only/);
  const yx = run({ dmd: "DLP500YX", bits: 11, exposure: 1e5 });
  assert.match(yx.warnings.join(" "), /10, 12, 14 and 16/);
  const short = run({ exposure: 4000 });
  assert.match(short.warnings.join(" "), /shorter than TI's minimum 8-bit pattern time/);
  assert.ok(!run({}).warnings.some((w) => /shorter/.test(w)));
});
