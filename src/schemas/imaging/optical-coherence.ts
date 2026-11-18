import { OCT_NARROWBAND_LIMIT, exceedsNarrowbandLimit, opticalCoherenceSummary } from "../../physics/imaging/optical-coherence";
import { defineSchema } from "../types";

const FERCHER = "Fercher A. F. et al. (2003). Optical coherence tomography: principles and applications. Rep. Prog. Phys. " +
  "66, 239–303, Δz = (2 ln 2/π) λ₀²/(n Δλ); l_c = cτ_c here is twice Fercher's single-pass l_C (round-trip path difference). " +
  "https://doi.org/10.1088/0034-4885/66/2/204";
const CHOMA = "Choma M. A., Sarunic M. V., Yang C., Izatt J. A. (2003). Sensitivity advantage of swept source and Fourier " +
  "domain optical coherence tomography. Opt. Express 11, 2183–2189, eq. 10: SNR = ρ P_s Δt/(2e). https://doi.org/10.1364/OE.11.002183";

const NARROWBAND_WARNING = `Δλ/λ₀ exceeds ${OCT_NARROWBAND_LIMIT}: the Gaussian, Δλ ≪ λ₀ formulas lose accuracy.`;
const dB = (x: number) => (Number.isFinite(x) && x > 0 ? 10 * Math.log10(x) : NaN);

export default defineSchema({
  href: "/imaging/optical-coherence",
  inputs: [
    { key: "wavelengthNm", label: "Centre wavelength λ₀", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1310, min: 600, max: 1600 },
    { key: "bandwidthNm", label: "Bandwidth Δλ (FWHM)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 100, min: 5, max: 300 },
    { key: "refractiveIndex", label: "Group index of the sample n", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 1.8 },
    { key: "sourcePowerMw", label: "Power on the sample", unit: "mW", toSI: 1e-3, siUnit: "W", default: 10, min: 0.01, max: 100 },
    { key: "sampleReflectivity", label: "Sample reflectivity R_s", unit: "", toSI: 1, siUnit: "", default: 0.01, min: 1e-6, max: 1 },
    { key: "couplingEfficiency", label: "Interferometer efficiency κ (1 = lossless)", unit: "", toSI: 1, siUnit: "", default: 0.6, min: 0.01, max: 1 },
    { key: "detectorResponsivity", label: "Detector responsivity ρ", unit: "A/W", toSI: 1, siUnit: "A/W", default: 0.8, min: 0.05, max: 1.2 },
    { key: "aScanRateKhz", label: "A-scan rate", unit: "kHz", toSI: 1e3, siUnit: "Hz", default: 20, min: 0.1, max: 1000 },
  ],
  outputs: [
    { key: "axialResolutionAir", label: "Axial resolution in air", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "axialResolutionSample", label: "Axial resolution in the sample", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "coherenceLength", label: "Coherence length l_c (path difference)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "coherenceTime", label: "Coherence time τ_c (FWHM of |γ(τ)|)", unit: "fs", toSI: 1e-15, siUnit: "s" },
    { key: "spectralWidth", label: "Spectral width Δν", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "signalPower", label: "Signal power κ·R_s·P", unit: "nW", toSI: 1e-9, siUnit: "W" },
    { key: "snrDb", label: "Shot-noise SNR (Fourier domain)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "sensitivityDb", label: "Sensitivity (1/R_s at SNR = 1)", unit: "dB", toSI: 1, siUnit: "dB" },
  ],
  compute(si) {
    const r = opticalCoherenceSummary(
      si.wavelengthNm, si.bandwidthNm, si.refractiveIndex, si.sourcePowerMw, si.sampleReflectivity,
      si.couplingEfficiency, si.detectorResponsivity, si.aScanRateKhz,
    );
    const warnings: string[] = [];
    if (exceedsNarrowbandLimit(si.wavelengthNm, si.bandwidthNm)) warnings.push(NARROWBAND_WARNING);
    return {
      values: {
        axialResolutionAir: r.axialResolutionAir,
        axialResolutionSample: r.axialResolutionSample,
        coherenceLength: r.coherenceLength,
        coherenceTime: r.coherenceTime,
        spectralWidth: r.spectralWidth,
        signalPower: r.signalPower,
        snrDb: dB(r.snr),
        sensitivityDb: dB(r.sensitivity),
      },
      warnings,
    };
  },
  checks: [
    {
      // 1310 nm, Δλ = 100 nm, n = 1.33: (2 ln 2/π) λ₀²/Δλ = 0.4412712 · 1.7161 µm²/0.1 µm = 7.572655 µm in air; /1.33 = 5.693726 µm.
      source: FERCHER,
      basis: "computed",
      inputs: {},
      expect: { axialResolutionAir: 7.572655068, axialResolutionSample: 5.6937256153 },
      tolerance: 1e-8,
    },
    {
      // l_c = 2 · 7.572655 µm = 15.145310 µm, τ_c = l_c/c = 50.519317 fs, Δν = cΔλ/λ₀² = 17.469405 THz (c = 299 792 458 m/s).
      source: FERCHER,
      basis: "computed",
      inputs: {},
      expect: { coherenceLength: 15.145310137, coherenceTime: 50.519316723, spectralWidth: 17.469404930 },
      tolerance: 1e-8,
    },
    {
      // P_s = 10 mW · 0.6 · 0.01 = 60 µW, Δt = 1/20 kHz = 50 µs: SNR = 0.8 · 6e-5 · 5e-5/(2 · 1.602176634e-19) = 7.4898e9 = 98.744709 dB; perfect mirror: + 20 dB.
      source: CHOMA,
      basis: "computed",
      inputs: {},
      expect: { signalPower: 60000, snrDb: 98.744708523, sensitivityDb: 118.744708523 },
      tolerance: 1e-8,
    },
  ],
});
