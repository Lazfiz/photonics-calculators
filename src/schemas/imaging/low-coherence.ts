import {
  coherenceLength, dopplerFrequency, fringeVisibility, octAxialResolution, tdOctSnr, tdSignalBandwidth,
} from "../../physics/imaging/oct";
import { defineSchema } from "../types";

const FERCHER = "Fercher A. F. et al. (2003). Optical coherence tomography: principles and applications. Rep. Prog. Phys. " +
  "66, 239–303, Δz = (2 ln 2/π) λ₀²/(n Δλ). https://doi.org/10.1088/0034-4885/66/2/204";

export default defineSchema({
  href: "/imaging/low-coherence",
  inputs: [
    { key: "wavelengthNm", label: "Centre wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1300, min: 600, max: 1600 },
    { key: "bandwidthNm", label: "Bandwidth Δλ (FWHM)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 80, min: 5, max: 300 },
    { key: "refractiveIndex", label: "Group index of the sample n", unit: "", toSI: 1, siUnit: "", default: 1.4, min: 1, max: 1.8 },
    { key: "scanRangeMm", label: "Reference mirror travel", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.1, max: 10 },
    { key: "mirrorSpeedMmPerS", label: "Mirror speed v", unit: "mm/s", toSI: 1e-3, siUnit: "m/s", default: 50, min: 1, max: 200 },
    { key: "numAScans", label: "A-scans per B-scan", unit: "", toSI: 1, siUnit: "", default: 500, min: 50, max: 2000 },
    { key: "referenceReflectivity", label: "Reference reflectivity R_r", unit: "", toSI: 1, siUnit: "", default: 0.9, min: 0.01, max: 1 },
    { key: "sampleReflectivity", label: "Sample reflectivity R_s", unit: "", toSI: 1, siUnit: "", default: 0.004, min: 1e-6, max: 1 },
    { key: "sourcePowerMw", label: "Source power P₀", unit: "mW", toSI: 1e-3, siUnit: "W", default: 10, min: 0.01, max: 100 },
    { key: "detectorResponsivity", label: "Detector responsivity ρ", unit: "A/W", toSI: 1, siUnit: "A/W", default: 0.8, min: 0.05, max: 1.2 },
  ],
  outputs: [
    { key: "axialResolutionAir", label: "Axial resolution in air", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "axialResolutionSample", label: "Axial resolution in the sample", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "coherenceLength", label: "Coherence length l_c (path difference)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "fringeVisibility", label: "Fringe visibility V", unit: "", toSI: 1, siUnit: "" },
    { key: "carrierFrequency", label: "Carrier (Doppler) frequency 2v/λ₀", unit: "kHz", toSI: 1e3, siUnit: "Hz" },
    { key: "signalBandwidth", label: "Signal bandwidth (FWHM) 2vΔλ/λ₀²", unit: "kHz", toSI: 1e3, siUnit: "Hz" },
    { key: "depthRange", label: "Depth range in the sample", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "aScanTime", label: "A-scan time (one way)", unit: "ms", toSI: 1e-3, siUnit: "s" },
    { key: "bScanTime", label: "B-scan time", unit: "s", toSI: 1, siUnit: "s" },
    { key: "snrDb", label: "Shot-noise SNR", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute(si) {
    const lambda0 = si.wavelengthNm, dLambda = si.bandwidthNm, n = si.refractiveIndex, v = si.mirrorSpeedMmPerS;
    const Rr = si.referenceReflectivity, Rs = si.sampleReflectivity;
    const signalBw = tdSignalBandwidth(v, lambda0, dLambda);
    const aScanTime = si.scanRangeMm / v;
    // P_s = R_s·P₀/2 behind a 50/50 coupler and the detection bandwidth is 2 × the signal FWHM, as on the page.
    const snr = tdOctSnr(si.detectorResponsivity, (si.sourcePowerMw * Rs) / 2, 2 * signalBw);
    const snrOk = Number.isFinite(snr) && snr > 0;
    const warnings: string[] = [];
    if (!snrOk) warnings.push("The shot-noise SNR is undefined for these inputs.");
    if (Rs > 0.1 * Rr) warnings.push("The SNR assumes shot noise from a much stronger reference (R_r ≫ R_s); here the sample arm adds noise and the SNR is optimistic.");
    if (dLambda / lambda0 > 0.1) warnings.push("Δλ/λ₀ exceeds 0.1: the Gaussian, Δλ ≪ λ₀ formulas lose accuracy.");
    return {
      values: {
        axialResolutionAir: octAxialResolution(lambda0, dLambda),
        axialResolutionSample: octAxialResolution(lambda0, dLambda, n),
        coherenceLength: coherenceLength(lambda0, dLambda),
        fringeVisibility: fringeVisibility(Rr, Rs),
        carrierFrequency: dopplerFrequency(v, lambda0),
        signalBandwidth: signalBw,
        depthRange: si.scanRangeMm / n,
        aScanTime,
        bScanTime: Math.round(si.numAScans) * aScanTime,
        snrDb: snrOk ? 10 * Math.log10(snr) : NaN,
      },
      warnings,
    };
  },
  checks: [
    {
      // The page's defaults (1300 nm, Δλ = 80 nm, n = 1.4): 0.441271 · 1.3² µm²/(1.4 · 0.08 µm) = 6.65846 µm.
      source: FERCHER,
      basis: "computed",
      inputs: {},
      expect: { axialResolutionSample: 6.65846 },
      tolerance: 1e-5,
    },
    {
      // 1310 nm, Δλ = 100 nm in air: 0.441271 · 1.31² µm²/0.1 µm = 7.5727 µm.
      source: FERCHER,
      basis: "computed",
      inputs: { wavelengthNm: 1310, bandwidthNm: 100, refractiveIndex: 1 },
      expect: { axialResolutionAir: 7.5727 },
      tolerance: 2e-5,
    },
    {
      // Hand calculation at the defaults: V = 2√(0.9 · 0.004)/0.904, f_D = 2 · 0.05 m/s/1.3 µm.
      source: "Hand calculation from V = 2√(R_r R_s)/(R_r + R_s) and f_D = 2v/λ₀ (tests/imaging-oct-holography.test.ts; " +
        "Fercher et al. 2003, Rep. Prog. Phys. 66, 239).",
      basis: "computed",
      inputs: {},
      expect: { fringeVisibility: 0.132743, carrierFrequency: 76.92308 },
      tolerance: 1e-5,
    },
  ],
});
