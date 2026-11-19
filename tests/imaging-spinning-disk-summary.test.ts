import test from "node:test";
import assert from "node:assert/strict";

import { spinningDiskSummary } from "../src/physics/imaging/spinning-disk";

const close = (actual: number, expected: number, tol: number, label: string) =>
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);

const base = {
  lambda: 488e-9, NA: 0.8, n: 1.33, magnification: 60, pinholeDiameter: 50e-6, pitch: 250e-6,
  revPerSecond: 5000 / 60, scansPerRevolution: 12, exposure: 0.1,
};

test("spinning disk summary, defaults (Wilhelm et al. 2003 Airy unit; Tanaami et al. 2002 frame rate)", () => {
  // Hand (scratch script): 1 AU = 1.22·488/0.8 = 744.2 nm; pinhole 50/60 µm = 1.119770670966586 AU; 5000/60·12 = 1000 fps;
  // open area π/100; throughput 1 − J0²(v) − J1²(v), v = 3.8317059702·AU: 0.8399959040187801.
  const s = spinningDiskSummary(base);
  close(s.airyObject, 744.2e-9, 1e-12, "Airy unit");
  close(s.pinholeAU, 1.119770670966586, 1e-12, "pinhole AU");
  close(s.frameRate, 1000, 1e-12, "frame rate");
  close(s.fill, Math.PI / 100, 1e-12, "fill");
  close(s.throughput, 0.8399959040187801, 1e-8, "throughput");
  close(s.wilhelm, 2539.8010294006313e-9, 1e-9, "Wilhelm");
  assert.equal(s.banding, false);
  assert.ok(s.floor > 0 && s.floor < 0.5);
});

test("spinning disk summary, edges: pinhole wider than the pitch, a non-integer exposure, a pinhole below 1 AU", () => {
  const big = spinningDiskSummary({ ...base, pinholeDiameter: 300e-6 });
  assert.ok(big.pinholeTooBig && Number.isNaN(big.fill) && Number.isNaN(big.floor) && Number.isNaN(big.diskSection));
  assert.ok(spinningDiskSummary({ ...base, exposure: 0.0105 }).banding);
  assert.ok(Number.isNaN(spinningDiskSummary({ ...base, pinholeDiameter: 5e-6, magnification: 10 }).wilhelm));
});
