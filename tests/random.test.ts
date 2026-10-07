import test from "node:test";
import assert from "node:assert/strict";

import { createRng, gaussian, uniform } from "../src/physics/random";

const TWO_32 = 4294967296;

// Reference: an independent Python port of Ettinger's C mulberry32 on uint32 state
// (state += 0x6D2B79F5; z = (z ^ z>>15) * (z|1); z ^= z + (z ^ z>>7) * (z|61); z ^ z>>14).
test("createRng reproduces the mulberry32 reference sequence", () => {
  const cases: Array<[number, number[]]> = [
    [0, [1144304738, 1416247, 958946056, 627933444]],
    [1, [2693262067, 11749833, 2265367787, 4213581821]],
    [42, [2581720956, 1925393290, 3661312704, 2876485805]],
    [0xdeadbeef, [4043151706, 1147597007, 3315858022, 1538288752]],
  ];
  for (const [seed, words] of cases) {
    const rng = createRng(seed);
    assert.deepEqual(
      words.map(() => rng()),
      words.map((w) => w / TWO_32),
      `seed ${seed}`,
    );
  }
});

test("the same seed gives the same sequence; seeds use their low 32 bits", () => {
  const a = createRng(7);
  const b = createRng(7);
  const c = createRng(7 + TWO_32);
  for (let i = 0; i < 100; i++) {
    const x = a();
    assert.equal(b(), x);
    assert.equal(c(), x);
  }
});

test("uniform deviates lie in [0, 1) with mean 1/2 and variance 1/12", () => {
  const rng = createRng(2026);
  const n = 100_000;
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const x = rng();
    assert.ok(x >= 0 && x < 1, `out of range: ${x}`);
    sum += x;
    sumSq += x * x;
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  // Standard error of the mean is sqrt(1/12/n) ≈ 9.1e-4; allow 5σ.
  assert.ok(Math.abs(mean - 0.5) < 5e-3, `mean ${mean}`);
  assert.ok(Math.abs(variance - 1 / 12) < 2e-3, `variance ${variance}`);
});

test("uniform(a, b) maps onto [a, b)", () => {
  const rng = createRng(3);
  for (let i = 0; i < 1000; i++) {
    const x = uniform(rng, -2, 5);
    assert.ok(x >= -2 && x < 5, `out of range: ${x}`);
  }
});

test("gaussian deviates have mean 0 and variance 1, and stay finite at u → 0", () => {
  const rng = createRng(99);
  const n = 100_000;
  let sum = 0;
  let sumSq = 0;
  let within1 = 0;
  for (let i = 0; i < n; i++) {
    const g = gaussian(rng);
    assert.ok(Number.isFinite(g));
    sum += g;
    sumSq += g * g;
    if (Math.abs(g) < 1) within1++;
  }
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  assert.ok(Math.abs(mean) < 0.02, `mean ${mean}`);
  assert.ok(Math.abs(variance - 1) < 0.03, `variance ${variance}`);
  // P(|Z| < 1) = erf(1/√2) = 0.682689492… (DLMF 7.2.1).
  assert.ok(Math.abs(within1 / n - 0.6826894921) < 0.01, `P(|Z|<1) ${within1 / n}`);

  // Edge cases. rng() = 0 gives u = 1, so g = 0. The largest rng() = 1 − 2⁻³² gives the smallest
  // u = 2⁻³², so the largest deviate is √(−2 ln 2⁻³²) = √(64 ln 2) ≈ 6.66, finite (not log 0).
  assert.ok(gaussian(() => 0) === 0); // −0 from √(−2·0); === treats it as 0
  const largest = gaussian(() => 1 - 1 / TWO_32);
  assert.ok(Math.abs(largest - Math.sqrt(64 * Math.LN2)) < 1e-9, `largest ${largest}`);
});
