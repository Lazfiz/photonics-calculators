import { waterAbsorption } from "../../physics/materials/water-absorption";
import {
  mbllDpf, mbllHaemoglobin, morseMaxLevel, morseTransition, morseWellDepth,
} from "../../physics/spectroscopy/near-infrared";
import { defineSchema } from "../types";

const WATER = "D. J. Segelstein (1981). The complex refractive index of water. M.S. thesis, University of Missouri–Kansas City " +
  "(no DOI), absorption table as tabulated by S. Prahl, omlc.org/spectra/water/data/segelstein81.dat (fetched: 800 nm, 0.019640 cm⁻¹); " +
  "scaled by the volume fraction, transmittance T = exp(−μ_a L) (Beer–Lambert law, no scattering).";
const MORSE = "Morse oscillator: ν̃(0→v) = v ω_e − ω_e x_e v(v + 1), v_max = ⌊ω_e/(2ω_e x_e) − ½⌋, D_e = ω_e²/(4ω_e x_e) " +
  "(C. N. Banwell, E. M. McCash, Fundamentals of Molecular Spectroscopy, 4th ed., McGraw-Hill 1994, ch. 3). " +
  "H³⁵Cl constants ω_e = 2990.946, ω_e x_e = 52.8186 cm⁻¹ are the page's defaults (not re-fetched from the original spectroscopic source).";
const MBLL = "Modified Beer–Lambert law ΔOD(λ) = Σ ε_i(λ) Δc_i d DPF(λ) (D. T. Delpy, M. Cope, P. van der Zee, S. Arridge, S. Wray, J. Wyatt, " +
  "Estimation of optical pathlength through tissue from direct time of flight measurement, Phys. Med. Biol. 33, 1433 (1988), " +
  "doi:10.1088/0031-9155/33/12/008; relation as in the page, no equation number), decadic ε of HbO₂ and HbR from S. Prahl's table " +
  "(omlc.org/spectra/hemoglobin/summary.html, fetched: 760 nm 586 and 1548.52, 850 nm 1058 and 691.32 cm⁻¹/M). The test applies the " +
  "forward relation to Δ[HbO₂] = 10 µM, Δ[HbR] = −5 µM and checks that the 2 × 2 solve returns them.";

export default defineSchema({
  href: "/spectroscopy/near-infrared",
  choices: [
    {
      key: "dpfMode", label: "DPF", default: "age",
      options: [
        { value: "age", label: "Frontal head from age (Scholkmann–Wolf)" },
        { value: "manual", label: "Enter DPF values" },
      ],
    },
  ],
  inputs: [
    // water absorption
    { key: "wavelengthStart", label: "Water: wavelength start", unit: "nm", toSI: 1e-9, siUnit: "m", default: 780, min: 780, max: 2490 },
    { key: "wavelengthEnd", label: "Water: wavelength end (page chart only; at least start + 10 nm)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 2500, min: 790, max: 2500 },
    { key: "pathMm", label: "Water: path length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 1, min: 0.001, max: 1000 },
    { key: "waterContent", label: "Water: volume fraction", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 1 },
    // Morse overtones
    { key: "omegaE", label: "Morse: harmonic wavenumber ω_e", unit: "cm⁻¹", toSI: 100, siUnit: "1/m", default: 2990.946, min: 10, max: 5000 },
    { key: "omegaExe", label: "Morse: anharmonicity ω_e x_e (at most ω_e/4)", unit: "cm⁻¹", toSI: 100, siUnit: "1/m", default: 52.8186, min: 0.01, max: 1250 },
    // modified Beer–Lambert law
    { key: "lambda1", label: "MBLL: λ₁", unit: "nm", toSI: 1e-9, siUnit: "m", default: 760, min: 650, max: 1000 },
    { key: "lambda2", label: "MBLL: λ₂", unit: "nm", toSI: 1e-9, siUnit: "m", default: 830, min: 650, max: 1000 },
    { key: "dOD1", label: "MBLL: ΔOD at λ₁", unit: "", toSI: 1, siUnit: "", default: 0.0023, min: -10, max: 10 },
    { key: "dOD2", label: "MBLL: ΔOD at λ₂", unit: "", toSI: 1, siUnit: "", default: 0.0131, min: -10, max: 10 },
    { key: "distance", label: "MBLL: source–detector distance", unit: "cm", toSI: 0.01, siUnit: "m", default: 3, min: 0.1, max: 20 },
    { key: "age", label: "MBLL: age (age mode)", unit: "years", toSI: 1, siUnit: "years", default: 30, min: 0, max: 70 },
    { key: "dpf1", label: "MBLL: DPF at λ₁ (manual mode)", unit: "", toSI: 1, siUnit: "", default: 6, min: 1, max: 50 },
    { key: "dpf2", label: "MBLL: DPF at λ₂ (manual mode)", unit: "", toSI: 1, siUnit: "", default: 6, min: 1, max: 50 },
  ],
  outputs: [
    { key: "muaStart", label: "Water μ_a at the start wavelength", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "transmittanceStart", label: "Water transmittance at the start wavelength", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "nu1", label: "Morse band 0 → 1", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "nu2", label: "Morse band 0 → 2", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "nu3", label: "Morse band 0 → 3", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "nu4", label: "Morse band 0 → 4", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "nu5", label: "Morse band 0 → 5", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "vMax", label: "Highest bound Morse level", unit: "", toSI: 1, siUnit: "" },
    { key: "wellDepth", label: "Morse well depth D_e", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "dHbO2", label: "Δ[HbO₂]", unit: "µM", toSI: 1e-3, siUnit: "mol/m³" },
    { key: "dHbR", label: "Δ[HbR]", unit: "µM", toSI: 1e-3, siUnit: "mol/m³" },
    { key: "dHbT", label: "Δ[HbT]", unit: "µM", toSI: 1e-3, siUnit: "mol/m³" },
    { key: "dpfL1", label: "DPF at λ₁", unit: "", toSI: 1, siUnit: "" },
    { key: "dpfL2", label: "DPF at λ₂", unit: "", toSI: 1, siUnit: "" },
  ],
  validate({ wavelengthStart, wavelengthEnd, omegaE, omegaExe }) {
    if (wavelengthEnd < wavelengthStart + 10e-9 - 1e-15) return "wavelengthEnd must be at least wavelengthStart + 10 nm";
    if (omegaExe > omegaE / 4) return "omegaExe must not exceed omegaE/4";
    return undefined;
  },
  compute({ dpfMode, wavelengthStart, pathMm, waterContent, omegaE, omegaExe, lambda1, lambda2, dOD1, dOD2, distance, age, dpf1, dpf2 }) {
    const warnings: string[] = [];
    const mua = waterContent * waterAbsorption(wavelengthStart);
    // Morse: the maths is unit-agnostic, so the wavenumbers stay in 1/m (SI) in and out
    const vMax = morseMaxLevel(omegaE, omegaExe);
    const nu = (v: number) => (v <= vMax ? morseTransition(omegaE, omegaExe, v) : NaN);
    if (vMax < 5) warnings.push(`Only levels up to v = ${vMax} are bound: higher bands are not given.`);
    const mode = dpfMode === "manual" ? "manual" : "age";
    const d1 = mbllDpf(mode, age, lambda1, dpf1);
    const d2 = mbllDpf(mode, age, lambda2, dpf2);
    if (mode === "age" && !(Number.isFinite(d1) && Number.isFinite(d2))) {
      warnings.push("The Scholkmann–Wolf equation is fitted for 690–832 nm and 0–70 years: pick wavelengths in that range or use manual DPF values.");
    }
    const dc = mbllHaemoglobin(lambda1, lambda2, dOD1, dOD2, distance, d1, d2);
    if (Number.isFinite(d1) && Number.isFinite(d2) && !Number.isFinite(dc.hbo2)) {
      warnings.push("The two wavelengths give a (nearly) singular system: choose wavelengths on either side of the 800 nm isosbestic point.");
    }
    return {
      values: {
        muaStart: mua, transmittanceStart: Math.exp(-mua * pathMm),
        nu1: nu(1), nu2: nu(2), nu3: nu(3), nu4: nu(4), nu5: nu(5),
        vMax, wellDepth: morseWellDepth(omegaE, omegaExe),
        dHbO2: dc.hbo2, dHbR: dc.hbr, dHbT: dc.hbo2 + dc.hbr, dpfL1: d1, dpfL2: d2,
      },
      warnings,
    };
  },
  checks: [
    {
      // Segelstein table node at 800 nm, 0.019640 cm⁻¹, volume fraction 1 (page T over 1 mm = exp(−0.01964 · 0.1) = 99.8037927 %).
      source: WATER,
      basis: "printed",
      inputs: { wavelengthStart: 800, waterContent: 1, pathMm: 1 },
      expect: { muaStart: 0.01964 },
      tolerance: 3e-5,
    },
    {
      // ω_e = 2990.946, ω_e x_e = 52.8186: ν̃(0→1) = 2990.946 − 2·52.8186 = 2885.3088; ν̃(0→4) = 4·2990.946 − 20·52.8186 = 10907.412;
      // v_max = ⌊2990.946/105.6372 − ½⌋ = ⌊27.81⌋ = 27; D_e = 2990.946²/(4·52.8186) = 8945757.9749/211.2744 = 42341.8927.
      source: MORSE,
      basis: "computed",
      inputs: {},
      expect: { nu1: 2885.3088, nu4: 10907.412, vMax: 27, wellDepth: 42341.892699333 },
      tolerance: 1e-8,
    },
    {
      // Manual DPF 6, d = 3 cm, 760 and 850 nm (table nodes): ΔOD₁ = (586 · 10e-6 − 1548.52 · 5e-6) · 3 · 6 = −0.0338868;
      // ΔOD₂ = (1058 · 10e-6 − 691.32 · 5e-6) · 18 = 0.1282212; the 2 × 2 solve returns Δ[HbO₂] = 10, Δ[HbR] = −5, Δ[HbT] = 5 µM.
      source: MBLL,
      basis: "computed",
      inputs: { dpfMode: "manual", lambda1: 760, lambda2: 850, dOD1: -0.0338868, dOD2: 0.1282212, distance: 3, dpf1: 6, dpf2: 6 },
      expect: { dHbO2: 10, dHbR: -5, dHbT: 5 },
      tolerance: 1e-8,
    },
  ],
});
