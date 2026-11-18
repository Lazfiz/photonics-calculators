import test from "node:test";
import assert from "node:assert/strict";

import { darkNoiseSummary } from "../src/physics/detectors/dark-noise-temperature";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// n_i ∝ T^(3/2)·exp(−E_g(T)/2k_BT), dark current ∝ n_i (generation) or n_i² (diffusion), Varshni E_g(T) with the Sze Si/Ge
// coefficients: S. M. Sze, K. K. Ng, Physics of Semiconductor Devices, 3rd ed. (Wiley 2007), ch. 1–2; shot noise √(2q·I·Δf)
// (Schottky 1918). Values re-derived with an independent script (own constants).
test("darkNoiseSummary: Si Varshni, generation, 0.5 nA, 1 Hz", () => {
  const s = darkNoiseSummary({ darkCurrent25: 0.5e-9, eg: 1.12, bandwidth: 1, gapModel: "si", mechanism: "generation" });
  assertRel(s.dark25, 5e-10, 1e-12, "dark25");
  assertRel(s.noise25, 1.2657711617824132e-14, 1e-9, "noise25");
  assertRel(s.darkCold, 5.263206040336202e-13, 1e-9, "dark −40");
  assertRel(s.darkHot, 2.4798883208581395e-8, 1e-9, "dark 80");
  assertRel(s.ratio, 47117.44708173594, 1e-9, "ratio");
  assertRel(s.gap25, 1.1249894675988865, 1e-9, "E_g 25");
  assertRel(s.gapCold, 1.1404173383852039, 1e-9, "E_g −40");
});

test("darkNoiseSummary: fixed gap and diffusion square the n_i ratio; Ge gap", () => {
  const d = darkNoiseSummary({ darkCurrent25: 2e-9, eg: 1.0, bandwidth: 1e6, gapModel: "fixed", mechanism: "diffusion" });
  assertRel(d.darkCold, 1.8539468645288842e-14, 1e-9, "diffusion dark −40");
  assertRel(d.ratio, 76926659.09848453, 1e-9, "diffusion ratio");
  assert.equal(d.gap25, 1);
  const g = darkNoiseSummary({ darkCurrent25: 0.2e-9, eg: 1.0, bandwidth: 100, gapModel: "ge", mechanism: "generation" });
  assertRel(g.gap25, 0.664101913342399, 1e-9, "Ge E_g 25");
  assertRel(g.ratio, 1333.4336942135385, 1e-9, "Ge ratio");
});
