import test from "node:test";
import assert from "node:assert/strict";

import { c } from "../src/physics/constants";
import {
  bilayerBlochCos,
  blochPhase,
  quarterWaveDecayPerPeriod,
  quarterWaveGapMidgap,
  quarterWavePeriod,
} from "../src/physics/thin-film/photonic-crystal";
import { stopBandHalfWidth } from "../src/physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, stackResponse } from "../src/physics/thin-film/transfer-matrix";
import {
  gaussianLineCoherence,
  machZehnderBeams,
  michelsonBeams,
  twoBeamIntensity,
  twoBeamOpd,
  twoBeamVisibility,
} from "../src/physics/spectroscopy/two-beam";
import {
  bandwidthHz,
  groupDelay,
  groupIndexFromDelay,
  groupVelocity,
  lorentzianDelay,
  lorentzianGain,
} from "../src/physics/wave-optics/slow-light";

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

const NM = 1e-9;

// ---- 1D photonic crystal (Yeh, Yariv & Hong, JOSA 67, 423 (1977); Born & Wolf §1.6.5) ----

test("photonic crystal: quarter-wave Si/SiO2 gap, period and decay (hand values)", () => {
  // Δω/ω₀ = (4/π) asin(1.95/4.85) = (4/π)·0.4137678 = 0.5268253 (PR #141 audit: 52.68 %).
  close(quarterWaveGapMidgap(3.4, 1.45), 0.5268253, 1e-6, "gap/midgap");
  // Λ = 1550/4 · (1/3.4 + 1/1.45) = 387.5 · 0.9837728 = 381.2120 nm.
  close(quarterWavePeriod(1550 * NM, 3.4, 1.45) / NM, 381.2120, 1e-3, "period");
  // κ = ln(3.4/1.45) = 0.8522119; the half-trace at λ₀ is −½(ρ + 1/ρ) = −cosh κ.
  close(quarterWaveDecayPerPeriod(3.4, 1.45), 0.8522119, 1e-6, "decay per period");
  const dH = (1550 * NM) / (4 * 3.4);
  const dL = (1550 * NM) / (4 * 1.45);
  const ht = bilayerBlochCos(3.4, dH, 1.45, dL, 1550 * NM);
  close(ht, -Math.cosh(Math.log(3.4 / 1.45)), 1e-12, "half-trace at λ₀");
  const k = blochPhase(ht);
  close(k.re, Math.PI, 0, "Re KΛ in the gap");
  close(k.im, 0.8522119, 1e-6, "Im KΛ in the gap");
});

test("photonic crystal: band edges of the half-trace match Macleod's stop-band half-width", () => {
  const lambda0 = 1000 * NM;
  for (const [nH, nL] of [[2.35, 1.45], [3.4, 1.45], [1.6, 1.5]]) {
    const dg = stopBandHalfWidth(nH, nL);
    const dH = lambda0 / (4 * nH);
    const dL = lambda0 / (4 * nL);
    // g = λ₀/λ = 1 ± Δg puts the half-trace at exactly −1.
    for (const g of [1 - dg, 1 + dg]) close(bilayerBlochCos(nH, dH, nL, dL, lambda0 / g), -1, 1e-12, `edge ${nH}/${nL} g=${g}`);
    // Just inside the gap the wave decays; just outside it propagates.
    assert.ok(blochPhase(bilayerBlochCos(nH, dH, nL, dL, lambda0 / (1 - 0.99 * dg))).im > 0);
    assert.equal(blochPhase(bilayerBlochCos(nH, dH, nL, dL, lambda0 / (1 - 1.01 * dg))).im, 0);
  }
});

test("photonic crystal: Bloch decay gives the transfer-matrix reflectance tanh²(Nκ) between equal media", () => {
  // Independent check: the full characteristic-matrix calculation of (HL)^N on n_s = n₀.
  const lambda0 = 1550 * NM;
  for (const N of [1, 3, 10]) {
    const indices: number[] = [];
    for (let i = 0; i < N; i++) indices.push(3.4, 1.45);
    const R = stackResponse({ incident: 1.45, layers: quarterWaveLayers(indices, lambda0), substrate: { n: 1.45 } }, lambda0).R;
    close(R, Math.tanh(N * quarterWaveDecayPerPeriod(3.4, 1.45)) ** 2, 1e-12, `R for N=${N}`);
  }
  // N = 10 in air on air: PR #141 audit value R = 0.99999984.
  const ten = Array.from({ length: 20 }, (_, j) => (j % 2 === 0 ? 3.4 : 1.45));
  close(stackResponse({ incident: 1, layers: quarterWaveLayers(ten, lambda0), substrate: { n: 1 } }, lambda0).R, 0.99999984, 1e-8, "N=10");
});

test("photonic crystal: a vanishing L layer leaves a homogeneous medium, K = n_H k (edge case)", () => {
  const lambda = 800 * NM;
  const dH = 333 * NM;
  close(bilayerBlochCos(3.4, dH, 1.45, 0, lambda), Math.cos((2 * Math.PI * 3.4 * dH) / lambda), 1e-15, "d_L = 0");
  assert.ok(Number.isNaN(bilayerBlochCos(3.4, dH, 0, 1e-7, lambda)));
  assert.ok(Number.isNaN(blochPhase(NaN).re));
});

// ---- Two-beam interferometers (Born & Wolf ch. 7; Hariharan, Optical Interferometry, ch. 2) ----

test("two-beam: Michelson visibility and the old page's default fringe (PR #141 audit values)", () => {
  // V = 2√(0.9·0.5)/1.4 = 0.9583148; the splitter ratio cancels.
  for (const Rbs of [0.5, 0.3]) close(twoBeamVisibility(michelsonBeams(Rbs, 0.9, 0.5)), 0.9583148, 1e-7, `V Rbs=${Rbs}`);
  // ΔL = 10 µm, λ = 633 nm: OPD 20 µm, 31.596 fringes, I/I_max = 0.0875.
  const opd = twoBeamOpd("michelson", 10e-6);
  close(opd / 633e-9, 31.59558, 1e-5, "fringe order");
  const beams = michelsonBeams(0.5, 0.9, 0.9);
  const I = twoBeamIntensity(beams, (2 * Math.PI * opd) / 633e-9);
  close(I / twoBeamIntensity(beams, 0), 0.0875, 1e-4, "normalised I");
  close(twoBeamIntensity(beams, 0), 0.9, 1e-15, "bright fringe R T (√R₁ + √R₂)² = 0.9");
});

test("two-beam: Mach-Zehnder outputs conserve power and give V = 1 at output A when R_a = R_b", () => {
  for (const [Ra, Rb] of [[0.5, 0.5], [0.4, 0.4], [0.5, 0.3], [0.9, 0.2]]) {
    const { A, B } = machZehnderBeams(Ra, Rb);
    for (const phi of [0, 0.7, 2, Math.PI]) {
      // Output B's cross term has the opposite sign: its phase is shifted by π.
      close(twoBeamIntensity(A, phi) + twoBeamIntensity(B, phi + Math.PI), 1, 1e-14, `A + B, Ra=${Ra} Rb=${Rb}`);
    }
  }
  close(twoBeamVisibility(machZehnderBeams(0.4, 0.4).A), 1, 1e-15, "V_A");
  // V_B = 2·0.24/(0.16 + 0.36) = 0.9230769.
  close(twoBeamVisibility(machZehnderBeams(0.4, 0.4).B), 0.9230769, 1e-7, "V_B");
  // R_a = 0.5, R_b = 0.3: V = 2√(0.25·0.21)/0.5 = 0.9165151 at both outputs.
  close(twoBeamVisibility(machZehnderBeams(0.5, 0.3).A), 0.9165151, 1e-7, "V_A 0.5/0.3");
  close(twoBeamVisibility(machZehnderBeams(0.5, 0.3).B), 0.9165151, 1e-7, "V_B 0.5/0.3");
  close(twoBeamOpd("mz", 10e-6, 1.5), 15e-6, 1e-20, "MZ OPD nΔL");
});

test("two-beam: Gaussian-line coherence halves at 2 ln 2/(πΓ), and a dark beam gives no fringes (edge cases)", () => {
  const fwhm = 20; // cm⁻¹
  close(gaussianLineCoherence(fwhm, (2 * Math.LN2) / (Math.PI * fwhm)), 0.5, 1e-15, "half visibility");
  close(gaussianLineCoherence(0, 1), 1, 0, "monochromatic");
  close(twoBeamVisibility(michelsonBeams(0.5, 0.9, 0)), 0, 0, "one mirror missing");
  assert.ok(Number.isNaN(twoBeamVisibility(michelsonBeams(0.5, 0, 0))));
  assert.ok(Number.isNaN(michelsonBeams(1.2, 0.9, 0.9).I1));
});

// ---- Slow light (Okawachi et al., PRL 94, 153902 (2005); Tucker et al., JLT 23, 4046 (2005)) ----

test("slow light: kinematics and delay-bandwidth product (PR #141 audit values)", () => {
  // n_g = 10 over 1 mm: τ = 10·1e-3/c = 33.35641 ps.
  close(groupDelay(10, 1e-3) / 1e-12, 33.35641, 1e-5, "τ");
  close(groupVelocity(10), c / 10, 0, "v_g");
  // 1 nm at 1550 nm: c·1e-9/(1550² − 0.25)e-18 = 124.7836 GHz; τΔν = 4.16233.
  const dnu = bandwidthHz(1550 * NM, 1 * NM);
  close(dnu / 1e9, 124.7836, 1e-4, "Δν");
  close(groupDelay(10, 1e-3) * dnu, 4.16233, 1e-5, "τΔν");
  close(groupIndexFromDelay(1.5, groupDelay(10, 1e-3) - groupDelay(1.5, 1e-3), 1e-3), 10, 1e-12, "n_g back");
  assert.ok(Number.isNaN(groupIndexFromDelay(1.5, 1e-12, 0)));
  assert.ok(Number.isNaN(bandwidthHz(1550 * NM, 3100 * NM)));
});

test("slow light: Lorentzian delay is the derivative of the causal phase, G/Γ at the centre", () => {
  // Brillouin numbers: G = 10 Np, Δν = 30 MHz → τ = 10/(2π·30 MHz) = 53.05165 ns.
  const G = 10;
  const fwhm = 30e6;
  close(lorentzianDelay(G, fwhm, 0) / 1e-9, 53.05165, 1e-5, "τ(0)");
  // Independent check: central difference of φ(ν) = (G/2)γΔ/(γ² + Δ²) with respect to ω = 2πν.
  const gam = Math.PI * fwhm;
  const phase = (nu: number) => ((G / 2) * gam * 2 * Math.PI * nu) / (gam * gam + (2 * Math.PI * nu) ** 2);
  for (const nu of [0, 5e6, 15e6, 40e6]) {
    const h = 1e3;
    const numeric = (phase(nu + h) - phase(nu - h)) / (2 * Math.PI * 2 * h);
    close(lorentzianDelay(G, fwhm, nu), numeric, 1e-6 * Math.abs(numeric) + 1e-15, `τ at ${nu} Hz`);
  }
  // The delay changes sign at the half-width; the gain is G/2 there.
  close(lorentzianDelay(G, fwhm, fwhm / 2), 0, 1e-20, "zero at HWHM");
  close(lorentzianGain(G, fwhm, fwhm / 2), G / 2, 1e-15, "gain at HWHM");
  // An absorption line (G < 0) gives fast light: a negative delay.
  assert.ok(lorentzianDelay(-G, fwhm, 0) < 0);
  assert.ok(Number.isNaN(lorentzianDelay(G, 0, 0)));
});
