import { hc_eV_nm } from "../../physics/constants";
import { GAUSSIAN_FWHM_PER_SIGMA } from "../../physics/math";
import { crossSectionFromEpsilon } from "../../physics/spectroscopy/lambert-beer-law";
import {
  deltaA, deltaTOverT, excitationFraction, intermediatePeakTime, kineticTimes, peakIndex, photonFluence,
  sequentialPopulations, type TransientBands,
} from "../../physics/spectroscopy/pump-probe";
import { defineSchema } from "../types";

const BERERA = "R. Berera, R. van Grondelle, J. T. M. Kennis, Ultrafast transient absorption spectroscopy: principles and " +
  "application to photosynthetic systems, Photosynth. Res. 101, 105–118 (2009), doi:10.1007/s11120-009-9454-y " +
  "(sequential kinetics A → B → GS; no equation numbers cited).";
const GOLD_BOOK = "IUPAC Compendium of Chemical Terminology (Gold Book), “absorption cross section” σ = ln 10 · ε / N_A; " +
  "excited fraction f = σJ(1 − 10^−A)/(A ln 10) with J = Fλ/(hc), derived in the physics module header.";

const nm = (key: string, label: string, def: number) =>
  ({ key, label, unit: "nm", toSI: 1e-9, siUnit: "m", default: def, min: 100, max: 5000 });
const width = (key: string, label: string, def: number) =>
  ({ key, label, unit: "nm", toSI: 1e-9, siUnit: "m", default: def, min: 1, max: 2000 });
const strength = (key: string, label: string, def: number) =>
  ({ key, label, unit: "", toSI: 1, siUnit: "", default: def, min: 0, max: 100 });

export default defineSchema({
  href: "/spectroscopy/pump-probe",
  // delays and probeRangeMin/Max only drive the page's spectra chart; they are listed because the page reads them
  // from the URL, and no output depends on them.
  choices: [
    {
      key: "delays",
      label: "Spectrum delays in ps (chart only; the page accepts any comma-separated list)",
      options: [
        { value: "0.1,0.5,1,2,5,10", label: "0.1, 0.5, 1, 2, 5, 10 ps" },
        { value: "0,1,10,100", label: "0, 1, 10, 100 ps" },
      ],
      default: "0.1,0.5,1,2,5,10",
    },
  ],
  inputs: [
    { key: "pumpWavelength", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 400, min: 200, max: 3000 },
    { key: "fluence", label: "Pump fluence", unit: "µJ/cm²", toSI: 1e-2, siUnit: "J/m²", default: 100, min: 0, max: 1e5 },
    { key: "epsilonPump", label: "ε at pump", unit: "L·mol⁻¹·cm⁻¹", toSI: 0.1, siUnit: "m²/mol", default: 10000, min: 0, max: 1e6 },
    { key: "pumpAbsorbance", label: "Sample absorbance at pump", unit: "", toSI: 1, siUnit: "", default: 0.3, min: 0, max: 5 },
    { key: "groundAbsorbance", label: "Ground-state absorbance at bleach peak", unit: "", toSI: 1, siUnit: "", default: 0.5, min: 0, max: 5 },
    { key: "tau1", label: "τ₁, A → B", unit: "ps", toSI: 1e-12, siUnit: "s", default: 0.5, min: 1e-3, max: 1e6 },
    { key: "tau2", label: "τ₂, B → ground state", unit: "ps", toSI: 1e-12, siUnit: "s", default: 5, min: 1e-3, max: 1e6 },
    { key: "irfFs", label: "Cross-correlation FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 0, max: 1e6 },
    { key: "tMax", label: "Max delay", unit: "ps", toSI: 1e-12, siUnit: "s", default: 20, min: 0.01, max: 1e6 },
    nm("gsAbsorption", "Ground-state band centre", 500),
    width("gsWidth", "Ground-state band FWHM", 60),
    nm("seCenter", "SE centre", 570),
    width("seWidth", "SE FWHM", 60),
    strength("seStrength", "SE strength", 0.6),
    nm("esAbsorption", "ESA of A centre", 680),
    width("esaWidth", "ESA of A FWHM", 100),
    strength("esaStrength", "ESA of A strength", 0.8),
    nm("esaBCenter", "ESA of B centre", 430),
    width("esaBWidth", "ESA of B FWHM", 80),
    strength("esaBStrength", "ESA of B strength", 0.5),
    nm("probeWavelength", "Kinetic-trace wavelength", 500),
    nm("probeRangeMin", "Spectrum from (chart only)", 400),
    nm("probeRangeMax", "Spectrum to (chart only)", 800),
  ],
  outputs: [
    { key: "excitedFraction", label: "Mean excited fraction f̄", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "frontFaceFraction", label: "Front-face excited fraction σJ", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "crossSection", label: "Pump cross-section σ", unit: "cm²", toSI: 1e-4, siUnit: "m²" },
    { key: "photonFluence", label: "Pump photons per area", unit: "cm⁻²", toSI: 1e4, siUnit: "m⁻²" },
    { key: "peakDeltaA", label: "Largest |ΔA| of the kinetic trace (signed)", unit: "mOD", toSI: 1e-3, siUnit: "" },
    { key: "peakTime", label: "Delay of the largest |ΔA|", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "deltaTOverT", label: "ΔT/T at the largest |ΔA|", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "bPeakTime", label: "B population maximum (no IRF)", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "pumpPhotonEnergy", label: "Pump photon energy", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "probePhotonEnergy", label: "Probe photon energy", unit: "eV", toSI: 1, siUnit: "eV" },
  ],
  compute(si) {
    const sigma = si.irfFs / GAUSSIAN_FWHM_PER_SIGMA;
    const bands: TransientBands = {
      groundState: { centre: si.gsAbsorption, fwhm: si.gsWidth, strength: 1 },
      se: { centre: si.seCenter, fwhm: si.seWidth, strength: si.seStrength },
      esaA: { centre: si.esAbsorption, fwhm: si.esaWidth, strength: si.esaStrength },
      esaB: { centre: si.esaBCenter, fwhm: si.esaBWidth, strength: si.esaBStrength },
    };
    const sigmaPump = crossSectionFromEpsilon(si.epsilonPump);
    const photons = photonFluence(si.fluence, si.pumpWavelength);
    const frontFace = sigmaPump * photons;
    const f = excitationFraction(si.fluence, si.pumpWavelength, si.epsilonPump, si.pumpAbsorbance);
    const times = kineticTimes(si.irfFs, si.tMax);
    const trace = times.map((t) => deltaA(si.probeWavelength, sequentialPopulations(t, si.tau1, si.tau2, sigma), bands, f, si.groundAbsorbance));
    const idx = peakIndex(trace);
    const peak = trace[idx].total;
    const warnings: string[] = [];
    if (frontFace > 0.1) warnings.push("Front-face σJ > 0.1: ground-state saturation, the linear excited-fraction estimate is too high.");
    return {
      values: {
        excitedFraction: f,
        frontFaceFraction: frontFace,
        crossSection: sigmaPump,
        photonFluence: photons,
        peakDeltaA: peak,
        peakTime: times[idx],
        deltaTOverT: deltaTOverT(peak),
        bPeakTime: intermediatePeakTime(si.tau1, si.tau2),
        pumpPhotonEnergy: hc_eV_nm / (si.pumpWavelength * 1e9),
        probePhotonEnergy: hc_eV_nm / (si.probeWavelength * 1e9),
      },
      warnings,
    };
  },
  checks: [
    {
      // σ = ln 10 · 1000 m²/mol / N_A = 3.8235325e-21 m²; J = F λ/(hc) = 1 J/m² (100 µJ/cm²) · 4e-7 / (hc) = 2.0136466e18 m⁻²;
      // σJ = 7.6992433e-3; f = σJ (1 − 10^−0.3)/(0.3 ln 10) = 5.55966549e-3 (0.555966549 %).
      source: GOLD_BOOK,
      basis: "computed",
      inputs: {},
      expect: { excitedFraction: 0.555966549, frontFaceFraction: 0.76992433, crossSection: 3.8235325e-17 },
      tolerance: 1e-7,
    },
    {
      // k₁ = 2 ps⁻¹, k₂ = 0.2 ps⁻¹: t_max = ln(k₁/k₂)/(k₁ − k₂) = ln 10 / 1.8 = 1.27921394 ps.
      source: BERERA,
      basis: "computed",
      inputs: { tau1: 0.5, tau2: 5 },
      expect: { bPeakTime: 1.27921394 },
      tolerance: 1e-7,
    },
  ],
});
