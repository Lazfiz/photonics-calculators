// Golden values for the page summaries of the coherent-Raman, deconvolution and CGH pages (hand-worked, see each case).
import assert from "node:assert/strict";
import { test } from "node:test";
import { coherentRamanSummary } from "../src/physics/imaging/coherent-raman-summary";

const close = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${a} vs ${b}`);

test("coherent-raman summary: 816.8 nm pump, 2845 cm⁻¹ gives 1064.07 nm Stokes (energy conservation)", () => {
  const s = coherentRamanSummary({
    pumpWavelength: 816.8e-9, ramanShift: 2845e2, pumpPower: 0.05, stokesPower: 0.05, pulseWidth: 2e-12, repRate: 80e6,
    na: 1, linewidth: 15e2, chiNR: 0.3,
  });
  // 1/816.8e-7 = 12242.899 cm⁻¹; 12242.899 − 2845 = 9397.899 cm⁻¹ → 1064.0676 nm; + 2845 → 662.7828 nm.
  close(s.stokesWavelength, 1064.0676042e-9);
  close(s.antiStokesWavelength, 662.7827984e-9);
});

test("coherent-raman summary: pulse energy and Gaussian peak power", () => {
  const s = coherentRamanSummary({
    pumpWavelength: 800e-9, ramanShift: 2850e2, pumpPower: 0.05, stokesPower: 0.05, pulseWidth: 2e-12, repRate: 80e6,
    na: 1, linewidth: 15e2, chiNR: 0.3,
  });
  // E = 0.05/80e6 = 0.625 nJ; peak = 2√(ln2/π)·E/τ = 0.9394372·0.625e-9/2e-12 = 293.5741 W.
  close(s.pulseEnergyPump, 0.625e-9);
  close(s.peakPowerPump, 293.57414959);
  // √2·2 ln2/(π c τ) = 1.960522/(π·299792458·2e-12) = 1040.806 m⁻¹.
  close(s.excitationBandwidth, 1040.8062303);
  // Zipfel et al. (2003), doi:10.1038/nbt899: I = P_pk/(2π ω_xy²), worked independently of the repo; 1 GW/cm² = 1e13 W/m².
  close(s.intensityPump, 138.23602684e13, 1e-8);
  close(s.intensityStokes, 82.38646022e13, 1e-8);
  // Maximum of |χ_NR + χ_R|² (brute force), Γ = 15 cm⁻¹, χ_NR = 0.3: −4.1547594742 cm⁻¹.
  close(s.carsPeakShift, -4.1547594742e2, 1e-8);
});
