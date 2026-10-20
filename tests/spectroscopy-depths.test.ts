import test from "node:test";
import assert from "node:assert/strict";

import { waterAbsorption, waterSource } from "../src/physics/materials/water-absorption";
import { siliconAbsorption } from "../src/physics/materials/silicon-absorption";
import {
  absorbedFraction, absorptionCoefficient, absorptionDepth, depthForAbsorbedFraction, penetrationDepth,
} from "../src/physics/spectroscopy/depth";
import { tirfPenetrationDepth } from "../src/physics/imaging/tirf";
import { slabPath } from "../src/physics/spectroscopy/optical-path-length";
import {
  dpfFrontalHead, hbExtinction, localMaxima, mbllHaemoglobin, morseMaxLevel, morseTransition, morseWellDepth,
} from "../src/physics/spectroscopy/near-infrared";

const close = (actual: number, expected: number, rel: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg ?? ""} ${actual} vs ${expected}`);

const DEG = Math.PI / 180;
const C = 299792458;

test("water absorption: published nodes, the table seams and the NIR band maxima", () => {
  // Pope & Fry 1997: 500 nm 2.04e-4 /cm. Segelstein 1981: 200 nm 0.069178, 1932 nm 125.01 /cm (omlc.org files).
  close(waterAbsorption(500e-9), 2.04e-2, 1e-12);
  close(waterAbsorption(200e-9), 6.9178, 1e-12);
  close(waterAbsorption(1932e-9), 12501, 1e-12);
  // log-linear between Segelstein nodes 1439 (31.691) and 1449 (31.542) /cm: geometric mean at 1444 nm
  close(waterAbsorption(1444e-9), 100 * Math.sqrt(31.691 * 31.542), 1e-12);
  // water is transparent near 200–240 nm (old page: opaque), < 0.07 /cm
  assert.ok(waterAbsorption(220e-9) < 1, "UV transparency");
  assert.equal(waterSource(379e-9), "Segelstein 1981");
  assert.equal(waterSource(380e-9), "Pope & Fry 1997");
  assert.equal(waterSource(729e-9), "Segelstein 1981");
  assert.ok(Number.isNaN(waterAbsorption(199e-9)) && Number.isNaN(waterAbsorption(2501e-9)) && waterSource(2501e-9) === null);
  // maxima of the data, 780–2500 nm: the 970, 1200, 1450 and 1940 nm O–H bands (Segelstein nodes 971, 1199, 1439, 1932)
  const nms = Array.from({ length: 1721 }, (_, i) => 780 + i);
  const peaks = localMaxima(nms.map((nm) => waterAbsorption(nm * 1e-9))).map((i) => nms[i]);
  assert.deepEqual(peaks, [971, 1199, 1439, 1932]);
});

test("absorption depth: silicon 550 nm (Green 2008), 1/α, absorbed fractions", () => {
  // Green 2008 k(550 nm) = 0.027968 → α = 6.390e3 /cm, δ = 1.565 µm (part 0 audit golden 1.56 µm)
  close(1 / siliconAbsorption(550e-9), 1.5649e-6, 1e-4);
  close(absorptionDepth(1e5), 1e-5, 1e-15);
  assert.equal(absorptionDepth(0), Infinity);
  assert.ok(Number.isNaN(absorptionDepth(-1)));
  close(absorbedFraction(1e5, 1e-5), 1 - Math.exp(-1), 1e-12);
  close(depthForAbsorbedFraction(1e5, 0.9), Math.LN10 * 1e-5, 1e-12);
  assert.ok(Number.isNaN(depthForAbsorbedFraction(1e5, 1)), "100 % is never reached");
});

test("penetration depth: Im √(N² − n₀² sin²θ) reduces to 1/α and to the TIRF depth", () => {
  // λ 800 nm, k 0.001: α = 4πk/λ = 1.5708e4 m⁻¹, d_p = 63.66 µm (part 0 audit golden)
  close(absorptionCoefficient(0.001, 800e-9), 1.570796e4, 1e-6);
  close(penetrationDepth(800e-9, 1, 1.5, 0.001, 0), 63.662e-6, 1e-4);
  // 60° from air: N² − sin²θ = 1.499999 + 0.003i, Im √ = 1.224745e-3 (hand) → d_p = 51.980 µm
  close(penetrationDepth(800e-9, 1, 1.5, 0.001, 60 * DEG), 51.980e-6, 1e-4);
  // k = 0 above the critical angle: Axelrod 2001 eq. 2 via tirf.ts, glass 1.518 → water 1.33 at 70°, 488 nm
  close(penetrationDepth(488e-9, 1.518, 1.33, 0, 70 * DEG), tirfPenetrationDepth(488e-9, 1.518, 1.33, 70 * DEG), 1e-12);
  close(penetrationDepth(488e-9, 1.518, 1.33, 0, 70 * DEG), 75.314e-9, 1e-4);
  // metal: aluminium at 632.8 nm, N ≈ 1.2 + 7.26i → λ/(4πk) = 6.936 nm; skin depth (field) twice that
  close(penetrationDepth(632.8e-9, 1, 1.2, 7.26, 0), 6.9362e-9, 1e-4);
  assert.equal(penetrationDepth(500e-9, 1, 1.5, 0, 30 * DEG), Infinity, "lossless, below the critical angle");
  assert.ok(Number.isNaN(penetrationDepth(500e-9, 1, 1.5, 0.1, 90 * DEG)), "grazing incidence excluded");
});

test("optical path length: nL, phase and group delays through a slab", () => {
  // 1 cm, n 1.5, normal incidence: OPL 1.5 cm, OPL/c = 0.0500 ns (part 0 audit golden)
  const p = slabPath(0.01, 1.5, 1.5, 1, 0);
  close(p.opl, 0.015, 1e-12);
  close(p.phaseDelay, 5.00346e-11, 1e-5);
  close(p.extraGroupDelay, 0.005 / C, 1e-12);
  // 45°, two passes: sin θ_t = 0.471405, cos θ_t = 0.881917 → L = 2.267787 cm (hand); n_g 1.52 → 114.981 ps
  const q = slabPath(0.01, 1.5, 1.52, 2, 45 * DEG);
  close(q.geometric, 0.02267787, 1e-6);
  close(q.opl, 1.5 * 0.02267787, 1e-6);
  close(q.groupDelay, 1.149807e-10, 1e-5);
  // from glass (n₀ 1.5) into n 1 at 60° there is no transmitted ray
  assert.ok(Number.isNaN(slabPath(0.01, 1, 1, 1, 60 * DEG, 1.5).opl));
});

test("near-infrared: Morse overtones, Scholkmann–Wolf DPF and the two-wavelength MBLL", () => {
  // H³⁵Cl ω_e 2990.946, ω_e x_e 52.8186 cm⁻¹: hand values of v ω_e − ω_e x_e v(v+1)
  close(morseTransition(2990.946, 52.8186, 1), 2885.3088, 1e-9);
  close(morseTransition(2990.946, 52.8186, 2), 5664.9804, 1e-9);
  close(morseTransition(2990.946, 52.8186, 3), 8339.0148, 1e-9);
  // observed 2886, 5668, 8347 cm⁻¹ (Banwell & McCash ch. 3): the Morse model is within 0.1 %
  [2886, 5668, 8347].forEach((obs, i) => close(morseTransition(2990.946, 52.8186, i + 1), obs, 1e-3));
  assert.equal(morseMaxLevel(2990.946, 52.8186), 27);
  close(morseWellDepth(2990.946, 52.8186), 42341.89, 1e-6);
  // Scholkmann & Wolf 2013: age 24 at 760 nm → 6.122 (hand; Garcia-Castro's implementation prints 6.12)
  close(dpfFrontalHead(24, 760e-9), 6.12214, 1e-5);
  assert.ok(Number.isNaN(dpfFrontalHead(30, 850e-9)), "outside the fitted 690–832 nm");
  // Prahl table, 760 nm: HbO₂ 586, HbR 1548.52 cm⁻¹/M = 58.6, 154.852 m²/mol
  const e760 = hbExtinction(760e-9);
  close(e760.hbo2, 58.6, 1e-12);
  close(e760.hbr, 154.852, 1e-12);
  // forward model for Δ[HbO₂] = +1 µM, Δ[HbR] = −0.3 µM (1e-3, −3e-4 mol/m³), d = 3 cm, age 30, then invert
  const dpf1 = dpfFrontalHead(30, 760e-9);
  const dpf2 = dpfFrontalHead(30, 830e-9);
  const e830 = hbExtinction(830e-9);
  const od = (e: { hbo2: number; hbr: number }, dpf: number) => (e.hbo2 * 1e-3 + e.hbr * -3e-4) * 0.03 * dpf;
  const dc = mbllHaemoglobin(760e-9, 830e-9, od(e760, dpf1), od(e830, dpf2), 0.03, dpf1, dpf2);
  close(dc.hbo2, 1e-3, 1e-9);
  close(dc.hbr, -3e-4, 1e-9);
  // the page defaults ΔOD 0.0023 / 0.0131 are that forward model rounded (hand: 2.294e-3, 1.3060e-2)
  close(od(e760, dpf1), 2.2939e-3, 1e-3);
  close(od(e830, dpf2), 1.3060e-2, 1e-3);
  assert.ok(Number.isNaN(mbllHaemoglobin(760e-9, 760e-9, 0.01, 0.01, 0.03, 6, 6).hbo2), "one wavelength twice is singular");
});
