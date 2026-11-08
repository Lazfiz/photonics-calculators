import { c, eV } from "../../physics/constants";
import {
  antiStokesStokesRatio, antiStokesWavelength, ramanShiftEnergy, ramanShiftOf, stokesWavelength,
} from "../../physics/spectroscopy/raman";
import { defineSchema } from "../types";

const CM = 100; // 1 cm⁻¹ in m⁻¹
const NM = 1e-9;
const LONG = "Long D. A. (2002). The Raman Effect: A Unified Treatment of the Theory of Raman Scattering by Molecules. Wiley. " +
  "https://doi.org/10.1002/0470845767 (Stokes and anti-Stokes lines and their temperature dependence; no equation number given).";

// minShift and maxShift only set the page's chart range; they are inputs so the keys match the page, and nothing uses them.
export default defineSchema({
  href: "/spectroscopy/raman-shift",
  choices: [
    {
      key: "detection",
      label: "Detector",
      options: [
        { value: "photon", label: "Photon counting (CCD, PMT): m = 3" },
        { value: "power", label: "Power (thermal detector): m = 4" },
      ],
      default: "photon",
    },
  ],
  inputs: [
    { key: "laserWavelength", label: "Laser wavelength λ_L (vacuum)", unit: "nm", toSI: NM, siUnit: "m", default: 532, min: 200, max: 2000 },
    { key: "ramanShiftCm", label: "Raman shift Δν̃", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹", default: 1000, min: 0, max: 5000 },
    { key: "temperature", label: "Sample temperature", unit: "K", toSI: 1, siUnit: "K", default: 295, min: 1, max: 2000 },
    { key: "lineWavelength", label: "Measured line wavelength (vacuum)", unit: "nm", toSI: NM, siUnit: "m", default: 561.89, min: 150, max: 3000 },
    { key: "minShift", label: "Chart from (plot only, no effect on the results)", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹", default: 100, min: 0, max: 5000 },
    { key: "maxShift", label: "Chart to (plot only, no effect on the results)", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹", default: 4000, min: 0, max: 5000 },
  ],
  outputs: [
    { key: "stokesWavelength", label: "Stokes line λ_S", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "antiStokesWavelength", label: "Anti-Stokes line λ_aS", unit: "nm", toSI: NM, siUnit: "m" },
    { key: "laserWavenumber", label: "Laser wavenumber ν̃_L", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
    { key: "vibrationalEnergy", label: "Vibrational energy hcΔν̃", unit: "meV", toSI: 1e-3 * eV, siUnit: "J" },
    { key: "vibrationalFrequency", label: "Vibrational frequency cΔν̃", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "antiStokesStokesRatio", label: "Anti-Stokes/Stokes intensity ratio", unit: "", toSI: 1, siUnit: "" },
    { key: "lineShift", label: "Raman shift of the measured line (positive = Stokes side)", unit: "cm⁻¹", toSI: CM, siUnit: "m⁻¹" },
  ],
  compute({ laserWavelength, ramanShiftCm, temperature, detection, lineWavelength }) {
    const warnings: string[] = [];
    const stokes = stokesWavelength(laserWavelength, ramanShiftCm);
    if (!Number.isFinite(stokes)) warnings.push("The shift is not below the laser wavenumber, so there is no Stokes line.");
    return {
      values: {
        stokesWavelength: stokes,
        antiStokesWavelength: antiStokesWavelength(laserWavelength, ramanShiftCm),
        laserWavenumber: 1 / laserWavelength,
        vibrationalEnergy: ramanShiftEnergy(ramanShiftCm),
        vibrationalFrequency: c * ramanShiftCm,
        antiStokesStokesRatio: antiStokesStokesRatio(laserWavelength, ramanShiftCm, temperature, detection === "power" ? "power" : "photon"),
        lineShift: ramanShiftOf(laserWavelength, lineWavelength),
      },
      warnings,
    };
  },
  checks: [
    {
      // 532 nm = 18796.992481 cm⁻¹; Stokes 1/(18796.992481 − 1000) cm = 10⁷/17796.992481 nm = 561.89269 nm; anti-Stokes
      // 10⁷/19796.992481 nm = 505.12723 nm (energy conservation ν̃ = ν̃_L ∓ Δν̃).
      source: LONG,
      basis: "computed",
      inputs: { laserWavelength: 532, ramanShiftCm: 1000 },
      expect: { stokesWavelength: 561.89269117, antiStokesWavelength: 505.1272313 },
      tolerance: 1e-8,
    },
    {
      // hcΔν̃ for 1000 cm⁻¹ with the exact SI h, c and e: 123.98419843 meV (1 cm⁻¹ = 0.12398419843 meV).
      source: "Energy of a wavenumber, E = hcΔν̃ (SI Brochure 9th ed. 2019 defining constants h, c, e); " + LONG,
      basis: "computed",
      inputs: { ramanShiftCm: 1000 },
      expect: { vibrationalEnergy: 123.98419843 },
      tolerance: 1e-8,
    },
    {
      // I_aS/I_S = ((ν̃_L + Ω̃)/(ν̃_L − Ω̃))³ exp(−hcΩ̃/k_BT) = (19796.9925/17796.9925)³ × exp(−1.43877696 × 1000/295)
      // = 0.010486064 (photon counts, m = 3), evaluated with the exact SI constants by an independent script.
      source: LONG,
      basis: "computed",
      inputs: { laserWavelength: 532, ramanShiftCm: 1000, temperature: 295, detection: "photon" },
      expect: { antiStokesStokesRatio: 0.01048606439 },
      tolerance: 1e-8,
    },
  ],
});
