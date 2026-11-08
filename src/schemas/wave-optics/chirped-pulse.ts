import { peakPower } from "../../physics/laser-safety/peak-power";
import { chirpedGaussianDuration, gddForStretch, treacyCompressor } from "../../physics/wave-optics/chirped-pulse";
import { TIME_BANDWIDTH, frequencyWidth } from "../../physics/wave-optics/pulsed-laser";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;

const TREACY = "Treacy E. B. (1969). Optical pulse compression with diffraction gratings. IEEE J. Quantum Electron. 5(9), 454–458, " +
  "doi:10.1109/JQE.1969.1076303 (grating-pair GDD φ₂ = −N G λ³/(2π c² d² cos³β), sin β = λ/d − sin α, N = 2 passes); " +
  "Strickland D., Mourou G. (1985). Compression of amplified chirped optical pulses. Opt. Commun. 56(3), 219–221, " +
  "doi:10.1016/0030-4018(85)90120-8 (stretch, amplify, recompress). Gaussian broadening τ = τ₀√(1 + (4 ln2 φ₂/τ₀²)²) and " +
  "τ₀Δν = 2 ln2/π: Diels J.-C., Rudolph W. (2006). Ultrashort Laser Pulse Phenomena, 2nd ed., ch. 1, Academic Press.";

export default defineSchema({
  href: "/wave-optics/chirped-pulse",
  inputs: [
    { key: "wavelength", label: "Centre wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 200, max: 5000 },
    { key: "inputBandwidth", label: "Spectral bandwidth, FWHM", unit: "nm", toSI: 1e-9, siUnit: "m", default: 10, min: 0.01, max: 1000 },
    { key: "stretchRatio", label: "Stretch ratio τ_s/τ₀", unit: "", toSI: 1, siUnit: "", default: 1000, min: 1, max: 1e6 },
    { key: "pulseEnergy", label: "Amplified pulse energy", unit: "mJ", toSI: 1e-3, siUnit: "J", default: 1, min: 0, max: 1e5 },
    { key: "gratingLines", label: "Compressor grating", unit: "lines/mm", toSI: 1e3, siUnit: "1/m", default: 1740, min: 100, max: 4000 },
    { key: "incidence", label: "Incidence angle", unit: "°", toSI: DEG, siUnit: "rad", default: 45, min: 0, max: 89 },
    { key: "compressorOffset", label: "Compressor separation offset ΔG", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.2, min: -1e4, max: 1e4 },
  ],
  outputs: [
    { key: "transformLimited", label: "Transform-limited duration τ₀", unit: "fs", toSI: 1e-15, siUnit: "s" },
    { key: "stretchedDuration", label: "Stretched duration", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "stretcherGdd", label: "Stretcher GDD", unit: "ps²", toSI: 1e-24, siUnit: "s²" },
    { key: "peakStretched", label: "Peak power in the amplifier", unit: "MW", toSI: 1e6, siUnit: "W" },
    { key: "separation", label: "Matched grating separation G", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "residualGdd", label: "Residual GDD at the offset", unit: "fs²", toSI: 1e-30, siUnit: "s²" },
    { key: "recompressed", label: "Recompressed duration", unit: "fs", toSI: 1e-15, siUnit: "s" },
    { key: "peakOut", label: "Recompressed peak power (lossless compressor)", unit: "GW", toSI: 1e9, siUnit: "W" },
  ],
  compute({ wavelength, inputBandwidth, stretchRatio, pulseEnergy, gratingLines, incidence, compressorOffset }) {
    const groove = 1 / gratingLines;
    const dnu = frequencyWidth(inputBandwidth, wavelength);
    const tau0 = TIME_BANDWIDTH.gaussian / dnu;
    const gddStretch = gddForStretch(tau0, stretchRatio);
    const tauStretched = chirpedGaussianDuration(tau0, gddStretch);
    const perMetre = treacyCompressor(wavelength, groove, incidence, 1);
    const separation = gddStretch / -perMetre.gdd;
    const residual = perMetre.gdd * compressorOffset;
    const tauOut = chirpedGaussianDuration(tau0, residual);
    const warnings: string[] = [];
    if (!Number.isFinite(perMetre.beta)) warnings.push("No first diffraction order: λ/d − sin α > 1, so the compressor outputs have no value.");
    return {
      values: {
        transformLimited: tau0,
        stretchedDuration: tauStretched,
        stretcherGdd: gddStretch,
        peakStretched: peakPower(pulseEnergy, tauStretched, "gaussian"),
        separation,
        residualGdd: residual,
        recompressed: tauOut,
        peakOut: peakPower(pulseEnergy, Number.isFinite(perMetre.gdd) ? tauOut : NaN, "gaussian"),
      },
      warnings,
    };
  },
  checks: [
    {
      // Δν = cΔλ/λ² = 299 792 458 × 10e-9/(800e-9)² = 4.684257e12 Hz; τ₀ = (2 ln2/π)/Δν = 0.441271/4.684257e12 = 94.20 fs;
      // stretcher GDD (τ₀²/4 ln2)√(r² − 1), r = 1000; stretched τ = τ₀ r (r ≫ 1 limit exact: τ₀√(1 + (r² − 1)) = τ₀ r).
      source: TREACY,
      basis: "computed",
      inputs: {},
      expect: {
        transformLimited: 94.20670600876373, stretchedDuration: 94.20670600876376, stretcherGdd: 3.20094320098056, peakStretched: 9.97208498737084,
        separation: 225.55163863690964, residualGdd: -2838.324048829811, recompressed: 125.90833003543378, peakOut: 7.461279793285083,
      },
      tolerance: 1e-8,
    },
    {
      // Zero offset returns the pulse to τ₀ (Strickland & Mourou): recompressed duration equals the transform limit.
      source: TREACY,
      basis: "computed",
      inputs: { compressorOffset: 0, stretchRatio: 100, wavelength: 800, inputBandwidth: 5 },
      expect: { transformLimited: 188.40789257844733, recompressed: 188.40789257844733 },
      tolerance: 1e-8,
    },
  ],
});
