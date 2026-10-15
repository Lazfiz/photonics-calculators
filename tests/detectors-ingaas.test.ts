import test from "node:test";
import assert from "node:assert/strict";

import { GAINAS_BOWING_EV, VARSHNI, ingaasBandGap, varshniBandGap } from "../src/physics/materials/bandgap";
import { INGAAS_NI_300K, cutoffWavelength, ingaasAbsorption, ingaasIntrinsicDensity, ingaasPinQe, inpWindowEdge } from "../src/physics/detectors/ingaas";
import { darkCurrentRatio, generationCurrent, generationCurrentAtBias, generationNoiseDensity } from "../src/physics/detectors/dark-current";
import { photodiodeQe } from "../src/physics/detectors/photodiode-qe";
import { responsivity } from "../src/physics/detectors/responsivity";
import { k_B, q } from "../src/physics/constants";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("Vurgaftman 2001 Varshni gaps at 300 K: GaAs 1.42248, InAs 0.35379, InP 1.35289, GaN 3.43460 eV", () => {
  // Hand: GaAs 1.519 − 5.405e-4·9e4/504 = 1.422482; InAs 0.417 − 2.76e-4·9e4/393 = 0.353794;
  // InP 1.4236 − 3.63e-4·9e4/462 = 1.352886; GaN 3.507 − 9.09e-4·9e4/1130 = 3.434602.
  close(varshniBandGap(300, VARSHNI.gaas), 1.422482, 1e-6);
  close(varshniBandGap(300, VARSHNI.inas), 0.353794, 1e-6);
  close(varshniBandGap(300, VARSHNI.inp), 1.352886, 1e-6);
  close(varshniBandGap(300, VARSHNI.gan), 3.434602, 1e-6);
});

test("InGaAs gap: 0.816 eV at x = 0.53, 0 K (Vurgaftman's composite value), 0.73726 eV at 300 K; binary ends", () => {
  // Vurgaftman et al. (2001) §III.B.2 choose E_g(0 K) = 816 meV for Ga0.47In0.53As, which fixes C = 0.477 eV.
  // Hand at 0 K: 0.47·1.519 + 0.53·0.417 − 0.2491·0.477 = 0.816119. At 300 K: 0.47·1.422482 + 0.53·0.353794 − 0.118821.
  assert.equal(GAINAS_BOWING_EV, 0.477);
  close(ingaasBandGap(0.53, 0), 0.816, 2e-4);
  close(ingaasBandGap(0.53, 300), 0.737257, 1e-6);
  close(ingaasBandGap(0, 300), varshniBandGap(300, VARSHNI.gaas), 1e-12);
  close(ingaasBandGap(1, 300), varshniBandGap(300, VARSHNI.inas), 1e-12);
  assert.ok(Number.isNaN(ingaasBandGap(1.1, 300)));
  assert.ok(Number.isNaN(ingaasBandGap(0.53, -1)));
  // Cutoff hc/E_g: 1239.842/0.737257 = 1681.7 nm.
  close(cutoffWavelength(ingaasBandGap(0.53, 300)) * 1e9, 1681.70, 1e-5);
  assert.ok(Number.isNaN(cutoffWavelength(0)));
});

test("InGaAs n_i: 6.3e11 cm⁻³ at 300 K (Paul 1991); 1.8538e10 cm⁻³ at 250 K", () => {
  // Hand at 250 K: E_g = 0.47·1.444590 + 0.53·0.366708 − 0.118821 = 0.754491 eV.
  // (250/300)^1.5 = 0.760726; exp(−5802.25·(0.754491/250 − 0.737257/300)) = exp(−3.2519) = 0.038682 → 0.029426.
  close(ingaasIntrinsicDensity(0.53, 300), INGAAS_NI_300K, 1e-12);
  close(ingaasIntrinsicDensity(0.53, 250), 1.8538e16, 1e-3);
  assert.ok(Number.isNaN(ingaasIntrinsicDensity(0.53, 0)));
});

test("InGaAs absorption: 6007 cm⁻¹ at 1550 nm (Adachi 1989: 6.8e3 at 1.53 µm), 0 beyond the cutoff", () => {
  // Hand: E = 1239.842/1550 = 0.799898 eV; √(0.799898 − 0.737257) = 0.250282 → 2.4e4·0.250282 = 6006.8 cm⁻¹.
  const Eg = ingaasBandGap(0.53, 300);
  close(ingaasAbsorption(1550e-9, Eg) / 100, 6006.8, 1e-4);
  assert.equal(ingaasAbsorption(1700e-9, Eg), 0);
  assert.ok(Number.isNaN(ingaasAbsorption(0, Eg)));
  // QE of a 3 µm absorber with R = 2 %: 0.98·(1 − e^(−6006.8e2·3e-6)) = 0.98·(1 − e^(−1.80204)) = 0.818336; ℛ = 1.02305 A/W.
  const qe = photodiodeQe({ alpha: ingaasAbsorption(1550e-9, Eg), reflectance: 0.02, depletionWidth: 3e-6 });
  close(qe, 0.818336, 1e-5);
  close(responsivity(qe, 1550e-9), 1.02305, 1e-5);
});

test("generation-limited InGaAs: 0.3028 nA, √(2qI) = 9.850e-15 A/√Hz, D* 3.284e12 at the ingaas-parameters defaults", () => {
  // Hand: q·n_i·W·A/τ_g = 1.602177e-19·6.3e17·3e-6·1e-7/1e-4 = 3.02811e-10 A. √(2q·I) = 9.8505e-15 A/√Hz.
  // NEP = 9.8505e-15/1.02305 = 9.6285e-15 W/√Hz; D* = √(0.001 cm²)/NEP = 3.2843e12 cm·Hz^½/W.
  const I = generationCurrent(ingaasIntrinsicDensity(0.53, 300), 3e-6, 1e-7, 100e-6);
  close(I, 3.02811e-10, 1e-5);
  close(generationCurrentAtBias(I, -1, 300), I, 1e-8); // e^(−19.3) = 4e-9 below I_gen
  close(generationNoiseDensity(I), 9.8505e-15, 1e-4);
  const R = responsivity(photodiodeQe({ alpha: ingaasAbsorption(1550e-9, ingaasBandGap(0.53, 300)), reflectance: 0.02, depletionWidth: 3e-6 }), 1550e-9);
  close(Math.sqrt(1e-3) / (generationNoiseDensity(I) / R), 3.2843e12, 1e-4);
});

test("generation current at zero bias is 0; its noise there equals Johnson noise 4k_BT/R₀ with R₀ = 2k_BT/(q·I_gen)", () => {
  const I = 1e-9;
  const T = 300;
  assert.equal(generationCurrentAtBias(I, 0, T), 0);
  // At V = −2k_BT/q: I·(1 − e^−1) = 0.632121·I.
  close(generationCurrentAtBias(I, (-2 * k_B * T) / q, T), 0.632121e-9, 1e-6);
  const R0 = (2 * k_B * T) / (q * I);
  close(generationNoiseDensity(I) ** 2, (4 * k_B * T) / R0, 1e-12);
  assert.ok(Number.isNaN(generationCurrentAtBias(I, 0.1, T)));
  assert.ok(Number.isNaN(generationNoiseDensity(-1)));
});

test("cooling-benefit with the Vurgaftman InGaAs gap: diffusion dark current falls ×1.8996e4 from 25 to −40 °C", () => {
  // Hand (awk): E_g = 0.737905 eV at 298.15 K, 0.760150 eV at 233.15 K; n_i² ratio → 1/18995.8. A fixed 0.75 eV gives ×7158.
  const g = (T: number) => ingaasBandGap(0.53, T);
  close(1 / darkCurrentRatio(233.15, 298.15, g(233.15), "diffusion", g(298.15)), 18995.8, 1e-5);
});

test("InP window edge 916.44 nm at 300 K; InGaAs p-i-n QE 81.834 % at 1550 nm (3 µm, R = 2 %), 0 short of the window", () => {
  // Hand: hc/E_g,InP = 1239.842/1.352886 = 916.443 nm (Vurgaftman 2001 InP Varshni set).
  close(inpWindowEdge(300) * 1e9, 916.443, 1e-5);
  // Hand at 1550 nm: E = 0.799898 eV, √(E − 0.737257) = 0.250282, α = 6.00677e5 1/m, α·d = 1.80203,
  // QE = 0.98·(1 − e^−1.80203) = 0.98·0.835058 = 0.818357.
  const pin = { x: 0.53, T: 300, thickness: 3e-6, reflectance: 0.02, inpWindow: true };
  close(ingaasPinQe(1550e-9, pin), 0.818357, 1e-4);
  assert.equal(ingaasPinQe(900e-9, pin), 0);
  assert.ok(ingaasPinQe(900e-9, { ...pin, inpWindow: false }) > 0.97);
  assert.equal(ingaasPinQe(1700e-9, pin), 0); // beyond the 1681.7 nm cutoff
  assert.ok(Number.isNaN(ingaasPinQe(1550e-9, { ...pin, reflectance: 1.5 })));
});
