import {
  amplitudeWeightedLifetime, gaussianPulseBandwidth, intensityWeightedLifetime, lateFraction, twoComponentDecay,
} from "../../physics/spectroscopy/fluorescence-lifetime";
import { defineSchema } from "../types";

const LAKOWICZ = "Lakowicz J. R. (2006). Principles of Fluorescence Spectroscopy, 3rd ed., Springer, doi:10.1007/978-0-387-46312-4, " +
  "ch. 4 (multi-exponential decay, intensity-weighted mean lifetime Σαᵢτᵢ²/Σαᵢτᵢ, amplitude-weighted Σαᵢτᵢ/Σαᵢ); " +
  "pulse-train overlap: photons of one pulse emitted after the next, Σαᵢτᵢe^(−T/τᵢ)/Σαᵢτᵢ, with T = 1/f.";
const DIELS = "Diels J.-C., Rudolph W. (2006). Ultrashort Laser Pulse Phenomena, 2nd ed., Academic Press, ch. 1; " +
  "Gaussian time-bandwidth product Δν·Δt = 2 ln 2/π = 0.4413 (intensity FWHM), Δλ = λ₀(Δν/ν₀)/(1 − (Δν/2ν₀)²).";

export default defineSchema({
  href: "/spectroscopy/time-resolved",
  inputs: [
    { key: "laserRepRate", label: "Laser repetition rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 0.001, max: 10000 },
    { key: "pulseWidthFs", label: "Laser pulse FWHM", unit: "fs", toSI: 1e-15, siUnit: "s", default: 100, min: 1, max: 1e9 },
    { key: "laserWavelength", label: "Laser wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 100, max: 10000 },
    { key: "instrumentResponse", label: "IRF FWHM", unit: "ps", toSI: 1e-12, siUnit: "s", default: 200, min: 0, max: 1e6 },
    { key: "irfDelay", label: "IRF centre t₀", unit: "ns", toSI: 1e-9, siUnit: "s", default: 0.5, min: 0, max: 10000 },
    { key: "lifetime", label: "Lifetime τ₁", unit: "ns", toSI: 1e-9, siUnit: "s", default: 2, min: 0.001, max: 1e5 },
    { key: "lifetime2", label: "Lifetime τ₂", unit: "ns", toSI: 1e-9, siUnit: "s", default: 8, min: 0.001, max: 1e5 },
    { key: "fraction2", label: "Amplitude fraction α₂ (0 = single exponential)", unit: "", toSI: 1, siUnit: "", default: 0, min: 0, max: 1 },
    { key: "timeRange", label: "Time window", unit: "ns", toSI: 1e-9, siUnit: "s", default: 10, min: 0.01, max: 1e5 },
  ],
  outputs: [
    { key: "period", label: "Pulse period 1/f", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "leftover", label: "Decay left at the next pulse e^(−T/τ_long)", unit: "", toSI: 1, siUnit: "" },
    { key: "lateFraction", label: "Photons arriving after the next pulse", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "centroidShift", label: "Centroid shift ⟨t⟩ − t₀ (intensity-weighted ⟨τ⟩)", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "amplitudeLifetime", label: "Amplitude-weighted lifetime", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "bandwidthHz", label: "Transform-limited bandwidth", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "bandwidthNm", label: "Transform-limited bandwidth (wavelength)", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ laserRepRate, pulseWidthFs, laserWavelength, lifetime, lifetime2, fraction2 }) {
    const period = 1 / laserRepRate;
    const components = twoComponentDecay(lifetime, lifetime2, fraction2);
    const tauLong = Math.max(...components.map((c) => c.lifetime));
    const leftover = Math.exp(-period / tauLong);
    const bw = gaussianPulseBandwidth(pulseWidthFs, laserWavelength);
    const warnings: string[] = [];
    if (leftover > 0.01) warnings.push("The decay has not died out before the next pulse (more than 1 % left): the measured curve is an incomplete decay.");
    if (!Number.isFinite(bw.lambda)) warnings.push("The pulse bandwidth is wider than the carrier frequency allows: no wavelength width.");
    return {
      values: {
        period, leftover, lateFraction: lateFraction(components, period),
        centroidShift: intensityWeightedLifetime(components), amplitudeLifetime: amplitudeWeightedLifetime(components),
        bandwidthHz: bw.hz, bandwidthNm: bw.lambda,
      },
      warnings,
    };
  },
  checks: [
    {
      // Single exponential τ = 2 ns at the defaults: T = 1/80 MHz = 12.5 ns; e^(−12.5/2) = e^(−6.25) = 0.001930454136;
      // the late fraction of one exponential equals e^(−T/τ); ⟨τ⟩ = τ = 2 ns for either average.
      source: LAKOWICZ,
      basis: "computed",
      inputs: { laserRepRate: 80, lifetime: 2, fraction2: 0 },
      expect: { period: 12.5, leftover: 0.001930454136227711, lateFraction: 0.1930454136227711, centroidShift: 2, amplitudeLifetime: 2 },
      tolerance: 1e-8,
    },
    {
      // α₂ = 0.5, τ₁ = 2 ns, τ₂ = 8 ns: Σατ = 5, Σατ² = 34 → ⟨τ⟩_int = 6.8 ns, ⟨τ⟩_amp = 5 ns;
      // late = (0.5·2·e^(−6.25) + 0.5·8·e^(−1.5625))/5 = 0.16807520 ; leftover = e^(−12.5/8) = 0.20961139.
      source: LAKOWICZ,
      basis: "computed",
      inputs: { laserRepRate: 80, lifetime: 2, lifetime2: 8, fraction2: 0.5 },
      expect: { leftover: 0.20961138715109787, lateFraction: 16.807520054812383, centroidShift: 6.8, amplitudeLifetime: 5 },
      tolerance: 1e-8,
    },
    {
      // 100 fs Gaussian pulse at 800 nm: Δν = 2 ln 2/(π · 100 fs) = 4.412712 THz; r = Δν λ₀/c = 0.011775;
      // Δλ = λ₀ r/(1 − (r/2)²) = 9.420629 nm.
      source: DIELS,
      basis: "computed",
      inputs: { pulseWidthFs: 100, laserWavelength: 800 },
      expect: { bandwidthHz: 4.412712003053032, bandwidthNm: 9.420629199691412 },
      tolerance: 1e-8,
    },
  ],
});
