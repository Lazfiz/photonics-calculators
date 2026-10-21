import test from "node:test";
import assert from "node:assert/strict";

import { DIAMOND_RANGE, diamondIndex, quartzRotatoryPower } from "../src/physics/materials/crystal-properties";
import { dnDlambda, refractiveIndex } from "../src/physics/materials/sellmeier";
import { UNIAXIAL_CRYSTALS as X, crystalIndices } from "../src/physics/materials/uniaxial-data";
import { fresnelLimitTransmission } from "../src/physics/materials/window-materials";
import { maxWalkoff, walkoffAngle } from "../src/physics/polarization/uniaxial";

const deg = Math.PI / 180;
const degPerMm = (radPerM: number) => radPerM / deg / 1e3;

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

/** Type-I (ooe) SHG phase-matching angle of a negative uniaxial crystal: n_e(θ, 2ω) = n_o(ω). */
function typeIAngle(id: "bbo" | "kdp", lambda: number) {
  const w = crystalIndices(id, lambda);
  const h = crystalIndices(id, lambda / 2);
  return Math.asin(Math.sqrt((w.no ** -2 - h.no ** -2) / (h.ne ** -2 - h.no ** -2)));
}

// ------------------------------------------------------------------ BBO and KDP

test("BBO (Eimerl 1987): n_o, n_e at 589.3 nm; agrees with Tamošauskas' independent fit (Opt. Mater. Express 8, 1410 (2018))", () => {
  const v = crystalIndices("bbo", 589.3e-9);
  assertAbs(v.no, 1.6706, 1e-4, "n_o");
  assertAbs(v.ne, 1.5524, 1e-4, "n_e");
  // Tamošauskas, refractiveindex.info formula 2: n² − 1 = Σ Bλ²/(λ² − C), λ in µm.
  const tam = (b: number[], l: number) => Math.sqrt(1 + b.reduce((s, _, i) => (i % 2 ? s : s + (b[i] * l * l) / (l * l - b[i + 1])), 0));
  const o = [0.90291, 0.003926, 0.83155, 0.018786, 0.76536, 60.01];
  const e = [1.151075, 0.007142, 0.21803, 0.02259, 0.656, 263];
  // Over Eimerl's 0.22–1.06 µm the two fits part by up to 1.0e-3 in n_o and 1.5e-3 in n_e (in the UV).
  for (let l = 0.22; l <= 1.06; l += 0.01) {
    assertAbs(refractiveIndex(X.bbo.o, l * 1e-6), tam(o, l), 1.1e-3, `n_o ${l.toFixed(2)} µm`);
    assertAbs(refractiveIndex(X.bbo.e, l * 1e-6), tam(e, l), 1.6e-3, `n_e ${l.toFixed(2)} µm`);
  }
});

test("BBO and KDP: type-I SHG of 1064 nm phase-matches at the measured angles (BBO 22.8°, KDP 41°)", () => {
  // Dmitriev, Gurzadyan & Nikogosyan, Handbook of Nonlinear Optical Crystals, 3rd ed. (Springer, 1999), experimental θ_pm.
  assertAbs(typeIAngle("bbo", 1064e-9) / deg, 22.8, 0.2, "BBO");
  assertAbs(typeIAngle("kdp", 1064e-9) / deg, 41, 0.5, "KDP");
});

test("Sellmeier λ² term: the analytic dn/dλ of BBO matches a central difference", () => {
  const l = 800e-9;
  const h = 1e-12;
  const fd = (refractiveIndex(X.bbo.o, l + h) - refractiveIndex(X.bbo.o, l - h)) / (2 * h);
  assertAbs(dnDlambda(X.bbo.o, l), fd, 1e-6 * Math.abs(fd), "dn/dλ");
  // The −0.0155λ² term alone lowers n_o² by 0.0155 at 1 µm: n_o² = 2.7405 + 0.0184/(1 − 0.0179) − 0.0155 = 2.743736.
  assertAbs(refractiveIndex(X.bbo.o, 1e-6) ** 2, 2.7405 + 0.0184 / (1 - 0.0179) - 0.0155, 1e-12, "n_o² at 1 µm");
});

// ------------------------------------------------------------------ calcite, quartz, sapphire

test("quartz (Ghosh) and sapphire (Malitson & Dodge) match the Crystran data sheets", () => {
  // Crystran: sapphire No 1.75449, Ne 1.74663 at "1.06 µm" (the Nd:YAG 1064 nm line); quartz No 1.54421, Ne 1.55333
  // "@ 0.6 µm", which are the sodium-D (589 nm) values: Ghosh gives 1.54421, 1.55331 there and 1.54378 at 600 nm.
  const s = crystalIndices("sapphire", 1064e-9);
  assertAbs(s.no, 1.75449, 5e-5, "sapphire n_o");
  assertAbs(s.ne, 1.74663, 5e-5, "sapphire n_e");
  const q = crystalIndices("quartz", 589.3e-9);
  assertAbs(q.no, 1.54421, 1e-4, "quartz n_o");
  assertAbs(q.ne, 1.55333, 1e-4, "quartz n_e");
});

test("calcite walk-off at 589.3 nm: 6.23° at 45° from the axis, largest 6.27° at 41.9° (hand calculation)", () => {
  // tan ρ = (n_o² − n_e²) sin 2θ / (2(n_e² cos²θ + n_o² sin²θ)); n_o 1.65835, n_e 1.48613 (Ghosh).
  const { no, ne } = crystalIndices("calcite", 589.3e-9);
  assertAbs(walkoffAngle(no, ne, 45 * deg) / deg, 6.232, 2e-3, "ρ(45°)");
  const m = maxWalkoff(no, ne);
  assertAbs(m.rho / deg, 6.270, 2e-3, "ρ_max");
  assertAbs(m.theta / deg, 41.865, 2e-3, "θ at ρ_max");
  // Beam displacement of a 10 mm plate cut at 45°: d·tan ρ = 10 × tan 6.232° = 1.0920 mm.
  assertAbs(10 * Math.tan(walkoffAngle(no, ne, 45 * deg)), 1.092, 2e-4, "displacement");
});

test("quartz rotatory power (Chandrasekhar 1952): 21.75 °/mm at 589.3 nm against Lowry & Coode-Adams' measured 21.72", () => {
  // Hand: λ² = 0.34727, λ₀² = 0.0085800, ρ = 7.186 × 0.34727/0.338694² = 21.7542 °/mm.
  assertAbs(degPerMm(quartzRotatoryPower(589.3e-9)), 21.7542, 1e-3, "formula");
  assertAbs(degPerMm(quartzRotatoryPower(589.3e-9)), 21.72, 0.05, "measured");
  assert.ok(Number.isNaN(quartzRotatoryPower(90e-9)), "λ < λ₀");
  assert.ok(Number.isNaN(quartzRotatoryPower(0)), "λ = 0");
});

// ------------------------------------------------------------------ diamond

test("diamond: Peter 2.4173 at 589.3 nm, a plate transmits 2n/(n² + 1) = 0.7065; Palik values beyond 644 nm", () => {
  const d = diamondIndex(589.3e-9);
  assert.equal(d.source, "peter");
  assertAbs(d.n, 2.4173, 1e-4, "n_D");
  assertAbs(fresnelLimitTransmission(d.n), 0.7065, 1e-4, "plate T");
  // Crystran (Palik) table: 2.3765 at 10 µm; halfway between 10 and 20 µm the interpolation gives the mean.
  assertAbs(diamondIndex(10e-6).n, 2.3765, 1e-12, "10 µm");
  assertAbs(diamondIndex(15e-6).n, (2.3765 + 2.3741) / 2, 1e-12, "15 µm");
  assert.equal(diamondIndex(10.6e-6).source, "palik");
  // Continuous at Peter's 644 nm limit, and 0.656 µm lands on the table's 2.4104 (Peter gives 2.4102 there).
  assertAbs(diamondIndex(644.0001e-9).n, diamondIndex(644e-9).n, 1e-6, "continuity");
  assertAbs(diamondIndex(0.656e-6).n, 2.4104, 1e-12, "0.656 µm");
  assert.ok(Number.isNaN(diamondIndex(200e-9).n) && Number.isNaN(diamondIndex(25e-6).n), "outside 226 nm–20 µm");
  assertAbs(DIAMOND_RANGE[0], 226e-9, 1e-15, "range low");
  assertAbs(DIAMOND_RANGE[1], 20e-6, 1e-15, "range high");
});
