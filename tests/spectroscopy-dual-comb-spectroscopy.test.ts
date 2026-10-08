import test from "node:test";
import assert from "node:assert/strict";

import { aliasFreeBandwidth, beatNote, nearestTooth, rfMapping } from "../src/physics/spectroscopy/dual-comb-spectroscopy";

// Integer-Hz combs so the comb equation can be evaluated exactly with BigInt.
const comb1 = { frep: 100_000_000, fceo: 20_000_000 };
const comb2 = { frep: 100_000_200, fceo: 20_100_000 };
const nu1550 = 299792458 / 1550e-9;

/** ν₂(m*) − ν₁(n) with m* the nearest comb-2 tooth, exact in integer Hz. */
function exactBeat(n: number): number {
  const nu1 = BigInt(n) * BigInt(comb1.frep) + BigInt(comb1.fceo);
  const f2 = BigInt(comb2.frep);
  const x = nu1 - BigInt(comb2.fceo);
  let m = x / f2;
  if (BigInt(2) * (x - m * f2) >= f2) m += BigInt(1);
  return Number(m * f2 + BigInt(comb2.fceo) - nu1);
}

test("beat note equals the nearest-tooth difference of the two comb equations", () => {
  const n0 = nearestTooth(comb1, nu1550);
  // Hand: n Δf_r + Δf_0 = 1 934 145 · 200 + 100 000 = 386 929 000 Hz; minus 4 f_r,2 = −13 071 800 Hz.
  assert.equal(n0, 1_934_145);
  assert.equal(beatNote(comb1, comb2, n0), -13_071_800);
  for (const n of [n0 - 100_000, n0 - 1, n0, n0 + 1, n0 + 123_457, 3_000_000]) {
    assert.ok(Math.abs(beatNote(comb1, comb2, n) - exactBeat(n)) < 1e-3, `n = ${n}`);
  }
  // Adjacent teeth step by Δf_r in RF (away from a wrap).
  assert.ok(Math.abs(beatNote(comb1, comb2, n0 + 1) - beatNote(comb1, comb2, n0) - 200) < 1e-6);
});

test("RF beats fill [0, f_r/2], not half of it", () => {
  // The old page folded twice, so nothing appeared above f_r/4 = 25 MHz.
  let max = 0;
  for (let n = 0; n < 600_000; n += 7) max = Math.max(max, Math.abs(beatNote(comb1, comb2, n)));
  assert.ok(max > 0.49 * comb1.frep && max <= 0.5 * comb2.frep, `max |b| = ${max}`);
});

test("alias-free bandwidth f_r²/(2Δf_r) and the RF mapping", () => {
  // Coddington, Newbury & Swann, Optica 3, 414 (2016). Hand: 100 MHz, Δf_r = 1 kHz → 5 THz.
  const fiveTHz = aliasFreeBandwidth({ frep: 100e6, fceo: 0 }, { frep: 100.001e6, fceo: 0 });
  assert.ok(Math.abs(fiveTHz / 5e12 - 1) < 1e-9, `${fiveTHz}`);
  const limit = aliasFreeBandwidth(comb1, comb2); // 25 THz
  assert.equal(limit, 25e12);
  // With the band's image centred at f_r/4, N f_r just below the limit maps alias-free and just above it doesn't.
  const centred = (N: number) => {
    const shift = rfMapping(comb1, comb2, nu1550, N).offsetToCentre;
    return rfMapping(comb1, { ...comb2, fceo: comb2.fceo + shift }, nu1550, N);
  };
  const nBelow = Math.floor((0.99 * limit) / comb1.frep);
  const nAbove = Math.ceil((1.01 * limit) / comb1.frep);
  assert.equal(centred(nBelow).aliasFree, true);
  assert.equal(centred(nAbove).aliasFree, false);
  const m = centred(nBelow);
  assert.ok(Math.abs((m.rfMin + m.rfMax) / 2 - comb2.frep / 4) < 1, "centred at f_r/4");
  assert.ok(Math.abs(m.rfMax - m.rfMin - (nBelow - 1) * 200) < 1e-3, "N Δf_r of RF");
  // 200 000 teeth (20 THz) fit in principle, but these offsets put the image across 0 Hz: aliased.
  assert.equal(rfMapping(comb1, comb2, nu1550, 200_000).aliasFree, false);
  // Equal repetition rates: no dual-comb mapping.
  assert.equal(aliasFreeBandwidth(comb1, { ...comb2, frep: comb1.frep }), Infinity);
  assert.equal(rfMapping(comb1, { ...comb2, frep: comb1.frep }, nu1550, 1000).aliasFree, false);
});
