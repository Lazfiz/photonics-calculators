import {
  criticalPower, focusedCollapseDistance, pulsePeakPower, rayleighRangeInMedium, selfFocusingDistance,
} from "../../physics/wave-optics/kerr";
import { defineSchema } from "../types";

const KERR = "Fibich G., Gaeta A. L. (2000). Critical power for self-focusing in bulk media and in hollow waveguides. Opt. Lett. 25(5), " +
  "335–337, doi:10.1364/OL.25.000335 (P_cr = 3.77 λ²/(8π n₀ n₂)); Marburger J. H. (1975). Self-focusing: theory. Prog. Quantum Electron. " +
  "4, 35–110, doi:10.1016/0079-6727(75)90003-8 (collapse distance z_sf = 0.367 z_R/√((√(P/P_cr) − 0.852)² − 0.0219), the Dawes–Marburger " +
  "fit). Gaussian pulse peak power P = 2√(ln2/π) E/τ (Diels & Rudolph 2006, ch. 1).";

export default defineSchema({
  href: "/wave-optics/filamentation",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 200, max: 20000 },
    { key: "pulseEnergy", label: "Pulse energy", unit: "µJ", toSI: 1e-6, siUnit: "J", default: 1, min: 0, max: 1e7 },
    { key: "pulseDuration", label: "Pulse duration, Gaussian FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 1, max: 1e6 },
    { key: "beamWaist", label: "Beam radius at the entrance, 1/e²", unit: "µm", toSI: 1e-6, siUnit: "m", default: 50, min: 1, max: 1e5 },
    { key: "n2", label: "Nonlinear index n₂", unit: "×10⁻¹⁶ cm²/W", toSI: 1e-20, siUnit: "m²/W", default: 2.4, min: 1e-4, max: 1e6 },
    { key: "n0", label: "Linear index n₀", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 5 },
    { key: "lensFocal", label: "Geometric focus depth in the medium (0 = collimated)", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0, min: -1e6, max: 1e6 },
  ],
  outputs: [
    { key: "criticalPower", label: "Critical power P_cr", unit: "MW", toSI: 1e6, siUnit: "W" },
    { key: "peakPower", label: "Peak power", unit: "MW", toSI: 1e6, siUnit: "W" },
    { key: "powerRatio", label: "P/P_cr", unit: "", toSI: 1, siUnit: "" },
    { key: "energyAtCritical", label: "Pulse energy at P_cr", unit: "µJ", toSI: 1e-6, siUnit: "J" },
    { key: "collapseDistance", label: "Collapse distance", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "rayleighRange", label: "Rayleigh range z_R", unit: "mm", toSI: 1e-3, siUnit: "m" },
  ],
  compute({ wavelength, pulseEnergy, pulseDuration, beamWaist, n2, n0, lensFocal }) {
    const f = lensFocal === 0 ? Infinity : lensFocal;
    const Pcr = criticalPower(wavelength, n0, n2);
    const power = pulsePeakPower(pulseEnergy, pulseDuration, "gaussian");
    const ratio = power / Pcr;
    const zR = rayleighRangeInMedium(wavelength, n0, beamWaist);
    const zsf = selfFocusingDistance(ratio, zR);
    const zHere = Number.isFinite(f) ? focusedCollapseDistance(zsf, f) : zsf;
    const warnings: string[] = [];
    if (!Number.isFinite(zsf)) warnings.push("P ≤ P_cr: Kerr focusing only slows diffraction, so there is no collapse distance.");
    else if (!Number.isFinite(zHere)) warnings.push("The diverging lens outruns the Kerr lens: no collapse.");
    return {
      values: {
        criticalPower: Pcr,
        peakPower: power,
        powerRatio: ratio,
        energyAtCritical: Pcr / pulsePeakPower(1, pulseDuration, "gaussian"),
        collapseDistance: zHere,
        rayleighRange: zR,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: fused silica at 800 nm. P_cr = 3.77 (800e-9)²/(8π × 1.45 × 2.4e-20) W; P = 0.939437 × 1 µJ/100 fs;
      // z_R = π n₀ w²/λ = π × 1.45 × (50e-6)²/800e-9; z_sf from the Dawes–Marburger fit.
      source: KERR,
      basis: "computed",
      inputs: {},
      expect: {
        criticalPower: 2.75868568025952, peakPower: 9.394372786996511, powerRatio: 3.405379907620627, energyAtCritical: 0.2936529923613457,
        collapseDistance: 5.31860446355481, rayleighRange: 14.23534171157875,
      },
      tolerance: 1e-8,
    },
    {
      // 2 mJ, 50 fs, 3 mm beam radius, geometric focus at 500 mm (fused silica constants): P = 0.939437 × 2 mJ/50 fs = 37.58 GW,
      // P/P_cr = 13 622; z_sf from the fit, then 1/z′ = 1/z_sf + 1/f.
      source: KERR,
      basis: "computed",
      inputs: { pulseEnergy: 2000, pulseDuration: 50, beamWaist: 3000, lensFocal: 500 },
      expect: { powerRatio: 13621.519630482511, collapseDistance: 122.54619819921034 },
      tolerance: 1e-8,
    },
  ],
});
