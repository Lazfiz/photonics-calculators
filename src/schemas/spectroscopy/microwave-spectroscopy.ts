import { c, m_u } from "../../physics/constants";
import {
  DEBYE, MICROWAVE_DEFAULTS, mostPopulatedJ, reducedMass, rotationalConstant, rotationalConstantV, rotationalLines, rotationalPartition,
  type DiatomicConstants,
} from "../../physics/spectroscopy/diatomic";
import { defineSchema } from "../types";

const MHZ = 1e6 / c; // 1 MHz in m⁻¹
const GHZ = 1e9 / c; // 1 GHz in m⁻¹
const ANGSTROM = 1e-10;
const CM_PER_MOLECULE = 0.01; // 1 cm/molecule in m/molecule
const D = MICROWAVE_DEFAULTS;

const GORDY = "Gordy W., Cook R. L. (1984). Microwave Molecular Spectra, 3rd ed. Wiley (rigid rotor with centrifugal " +
  "distortion).";

export default defineSchema({
  href: "/spectroscopy/microwave-spectroscopy",
  inputs: [
    { key: "m1", label: "Atomic mass m₁", unit: "u", toSI: m_u, siUnit: "kg", default: D.m1, min: 0.5, max: 300 },
    { key: "m2", label: "Atomic mass m₂", unit: "u", toSI: m_u, siUnit: "kg", default: D.m2, min: 0.5, max: 300 },
    { key: "bondLength", label: "Equilibrium bond length r_e", unit: "Å", toSI: ANGSTROM, siUnit: "m", default: D.bondLength, min: 0.5, max: 5 },
    { key: "alphaE", label: "Vibration-rotation constant α_e", unit: "MHz", toSI: MHZ, siUnit: "m⁻¹", default: D.alphaE, min: 0, max: 1e5 },
    { key: "distortion", label: "Centrifugal distortion D", unit: "MHz", toSI: MHZ, siUnit: "m⁻¹", default: D.distortion, min: 0, max: 1000 },
    { key: "dipoleMoment", label: "Dipole moment μ", unit: "D", toSI: DEBYE, siUnit: "C·m", default: D.dipoleMoment, min: 0, max: 15 },
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 2, max: 3000 },
    { key: "v", label: "Vibrational level v (rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 5 },
  ],
  outputs: [
    { key: "rotationalConstantBe", label: "Rotational constant B_e", unit: "GHz", toSI: GHZ, siUnit: "m⁻¹" },
    { key: "rotationalConstantBv", label: "Rotational constant B_v", unit: "GHz", toSI: GHZ, siUnit: "m⁻¹" },
    { key: "momentOfInertia", label: "Moment of inertia μr_e²", unit: "kg·m²", toSI: 1, siUnit: "kg·m²" },
    { key: "line10Frequency", label: "J = 1 ← 0 line frequency", unit: "GHz", toSI: GHZ, siUnit: "m⁻¹" },
    { key: "line10Intensity", label: "J = 1 ← 0 intensity S", unit: "cm/molecule", toSI: CM_PER_MOLECULE, siUnit: "m/molecule" },
    { key: "partitionFunction", label: "Rotational partition function Q_rot", unit: "", toSI: 1, siUnit: "" },
    { key: "mostPopulatedJ", label: "Most populated level J", unit: "", toSI: 1, siUnit: "" },
    { key: "strongestUpperJ", label: "Strongest line, upper level J + 1", unit: "", toSI: 1, siUnit: "" },
    { key: "strongestFrequency", label: "Strongest line frequency", unit: "GHz", toSI: GHZ, siUnit: "m⁻¹" },
    { key: "strongestIntensity", label: "Strongest line intensity S", unit: "cm/molecule", toSI: CM_PER_MOLECULE, siUnit: "m/molecule" },
    { key: "linesListed", label: "Lines listed", unit: "", toSI: 1, siUnit: "" },
  ],
  // As on the page: masses go in as u (reducedMass takes u), v is rounded, and B_v ≤ 0 or an unconverged Q gives no lines.
  compute({ m1, m2, bondLength, alphaE, distortion, dipoleMoment, temperature, v: vRaw }) {
    const warnings: string[] = [];
    const k: DiatomicConstants = {
      m1: m1 / m_u, m2: m2 / m_u, re: bondLength, we: 0, wexe: 0, weye: 0, weze: 0, alphaE, De: distortion, dipole: dipoleMoment,
    };
    const v = Math.round(vRaw);
    const mu = reducedMass(k.m1, k.m2);
    const Be = rotationalConstant(mu, k.re);
    const Bv = rotationalConstantV(k, v);
    const valid = Bv > 0;
    const lines = valid ? rotationalLines(Bv, k.De, k.dipole, temperature) : [];
    const Q = valid ? rotationalPartition(Bv, k.De, temperature) : NaN;
    const strongest = lines.length ? lines.reduce((a, b) => (b.S > a.S ? b : a)) : undefined;
    if (!valid) warnings.push("α_e(v + ½) ≥ B_e, so B_v is not positive: lower α_e or v.");
    else if (!Number.isFinite(Q)) warnings.push("The partition sum did not converge before the J cap (distortion turns the levels over, or J = 1000 is reached): lower T or D.");
    if (k.dipole === 0) warnings.push("No permanent dipole: no pure rotational spectrum (intensities are 0).");
    return {
      values: {
        rotationalConstantBe: Be,
        rotationalConstantBv: valid ? Bv : NaN,
        momentOfInertia: mu * k.re * k.re,
        line10Frequency: lines.length ? lines[0].sigma : NaN,
        line10Intensity: lines.length ? lines[0].S : NaN,
        partitionFunction: Q,
        mostPopulatedJ: valid ? mostPopulatedJ(Bv, temperature) : NaN,
        strongestUpperJ: strongest ? strongest.J + 1 : NaN,
        strongestFrequency: strongest ? strongest.sigma : NaN,
        strongestIntensity: strongest ? strongest.S : NaN,
        linesListed: lines.length,
      },
      warnings,
    };
  },
  checks: [
    {
      // B_e = h/(8π² c μ r_e²) for ¹²C¹⁶O: μ = 12 × 15.994914619/27.994914619 u = 6.855620 u, r_e = 1.128323 Å,
      // I = μr_e² = 1.4494392×10⁻⁴⁶ kg·m², B_e = 57.898364 GHz (= 1.931281 cm⁻¹); the arithmetic was done with the exact SI
      // constants by an independent script, not read from the repo's output. Constants r_e, masses: NIST WebBook / AME2020 as
      // used by the physics module (not fetched here, so not "printed").
      source: GORDY,
      basis: "computed",
      inputs: { v: 0 },
      expect: { rotationalConstantBe: 57.898363971, momentOfInertia: 1.4494392079e-46 },
      tolerance: 1e-8,
    },
    {
      // ν(1←0) = 2B_v − 4D with B_v = B_e − α_e/2 = 57.898364 − 0.262290 = 57.635979 GHz and D = 6.12147×10⁻⁶ cm⁻¹ =
      // 0.18351 MHz: 115.271225 GHz (the page text quotes 115.2712 GHz).
      source: GORDY,
      basis: "computed",
      inputs: { v: 0 },
      expect: { line10Frequency: 115.271224863 },
      tolerance: 1e-8,
    },
  ],
});

