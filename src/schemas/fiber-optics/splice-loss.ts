import { spliceLossSummary } from "../../physics/fiber-optics/splice-loss";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const MARCUSE = "Marcuse D. (1977). Loss analysis of single-mode fiber splices. Bell Syst. Tech. J. 56(5), 703–718, " +
  "doi:10.1002/j.1538-7305.1977.tb00534.x: for equal Gaussian mode radii w the offset η = exp(−d²/w²), the tilt η = exp(−(π n w θ/λ)²) and the " +
  "mode-field mismatch η = (2 w₁ w₂/(w₁² + w₂²))²; gap η = 1/(1 + (λz/(2π n w²))²) (Gaussian-beam diffraction, Kogelnik H., Li T. (1966), " +
  "Appl. Opt. 5, 1550–1567, doi:10.1364/AO.5.001550).";

export default defineSchema({
  href: "/fiber-optics/splice-loss",
  inputs: [
    { key: "lateralOffset", label: "Lateral offset", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0.5, min: 0, max: 20 },
    { key: "angularMisalign", label: "Angular misalignment", unit: "°", toSI: DEG, siUnit: "rad", default: 0.5, min: 0, max: 29 },
    { key: "coreDiam", label: "Mode-field diameter, fibre 1", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10.4, min: 1, max: 30 },
    { key: "mfd2", label: "Mode-field diameter, fibre 2", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10.4, min: 1, max: 30 },
    { key: "gap", label: "End-face gap", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0, min: 0, max: 100 },
    { key: "gapIndex", label: "Medium index", unit: "", toSI: 1, siUnit: "", default: 1.45, min: 1, max: 2 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 5000 },
    { key: "fiberIndex", label: "Fibre phase index", unit: "", toSI: 1, siUnit: "", default: 1.447, min: 1, max: 2 },
  ],
  outputs: [
    { key: "latLoss", label: "Lateral-offset loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "angLoss", label: "Angular loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "gapLoss", label: "Gap loss (diffraction + reflections)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "reflectionLoss", label: "Reflection part of the gap loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "mismatchLoss", label: "Mode-field mismatch loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "totalLoss", label: "Total loss (combined)", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute({ lateralOffset, angularMisalign, coreDiam, mfd2, gap, gapIndex, wavelength, fiberIndex }) {
    const r = spliceLossSummary({
      mfd1: coreDiam, mfd2, offset: lateralOffset, tilt: angularMisalign, gap, gapIndex, fiberIndex, lambda: wavelength,
    });
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    const underflow = "The coupling is so small that it underflows to zero: the loss is infinite.";
    const infinite = Object.entries(r).filter(([, v]) => v === Infinity).map(([k]) => k);
    if (infinite.length > 0) {
      warnings.push(underflow);
      for (const k of infinite) reasons[k] = underflow;
    }
    return { values: r, warnings, reasons };
  },
  checks: [
    {
      // Contact (z = 0), MFD 9 µm so w = 4.5 µm, 1550 nm, equal modes; each effect is evaluated alone. Offset d = 0.3 µm: loss = (10/ln 10)(d/w)² = 4.342945 · 0.0044444 = 0.019302 dB.
      // Tilt 0.4° = 6.98132e-3 rad in the default medium n = 1.45: x = π n w θ/λ = π · 1.45 · 4.5e-6 · 6.98132e-3/1.55e-6 = 0.0923286; loss = 4.342945 x² = 0.0370217 dB.
      source: MARCUSE,
      basis: "computed",
      inputs: { lateralOffset: 0.3, angularMisalign: 0.4, coreDiam: 9, mfd2: 9, gap: 0 },
      expect: { latLoss: 0.019301976973477856, angLoss: 0.03702170451433658 },
      tolerance: 1e-8,
    },
    {
      // Index-matched gap (n = n_fibre = 1.447, so no reflections) of 5 µm, w = 4.5 µm: u = λz/(2π n w²) = 1.55e-6 · 5e-6/(2π · 1.447 · 2.025e-11) = 0.0420948;
      // loss = 10 log10(1 + u²) = 0.0076888 dB; with nothing else the total is the same.
      source: MARCUSE,
      basis: "computed",
      inputs: { lateralOffset: 0, angularMisalign: 0, coreDiam: 9, mfd2: 9, gap: 5, gapIndex: 1.447, fiberIndex: 1.447 },
      expect: { gapLoss: 0.007688761108432429, totalLoss: 0.007688761108432429 },
      tolerance: 1e-8,
    },
    {
      // Mismatch only (contact): w₁ = 4.6 µm, w₂ = 5.2 µm: η = (2·4.6·5.2/(4.6² + 5.2²))² = (47.84/48.2)² = 0.985135; loss = −10 log10 η = 0.0651173 dB.
      source: MARCUSE,
      basis: "computed",
      inputs: { lateralOffset: 0, angularMisalign: 0, coreDiam: 9.2, mfd2: 10.4, gap: 0 },
      expect: { mismatchLoss: 0.06511734516990364, totalLoss: 0.06511734516990364 },
      tolerance: 1e-8,
    },
  ],
});
