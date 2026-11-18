import { otdrSummary } from "../../physics/fiber-optics/otdr";
import { defineSchema } from "../types";

const OTDR = "Barnoski M. K., Jensen S. M. (1976). Fiber waveguides: a novel technique for investigating attenuation " +
  "characteristics. Appl. Opt. 15(9), 2112–2115, doi:10.1364/AO.15.002112 (backscatter power P_bs = P₀ S α_s v_g τ/2 e^(−2αz)); " +
  "capture fraction S = (3/2)(λ/(2π n w))²: Brinkmeyer E. (1980). Analysis of the backscattering method for single-mode optical " +
  "fibers. J. Opt. Soc. Am. 70(8), 1010–1012, doi:10.1364/JOSA.70.001010; Rayleigh α_s = A/λ⁴ (Agrawal G. P. (2010). Fiber-Optic " +
  "Communication Systems, 4th ed., Wiley, §2.5); the one-way dB convention of this model sets the dynamic range DR = 5·log₁₀(P_bs/P_n) and the reflective peak 5·log₁₀(1 + R/η) (no further published source verified for these two).";

export default defineSchema({
  href: "/fiber-optics/otdr-analysis",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 800, max: 1700 },
    { key: "mfd", label: "Mode field diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 10.4, min: 2, max: 30 },
    { key: "rayleighA", label: "Rayleigh coefficient A", unit: "dB·km⁻¹·µm⁴", toSI: 1, siUnit: "dB·km⁻¹·µm⁴", default: 0.85, min: 0.3, max: 2 },
    { key: "attenuationCoeff", label: "Total loss", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 0.19, min: 0.01, max: 10 },
    { key: "nPhase", label: "Phase index n", unit: "", toSI: 1, siUnit: "", default: 1.447, min: 1.3, max: 1.8 },
    { key: "refractiveIndex", label: "Group index n_g", unit: "", toSI: 1, siUnit: "", default: 1.4682, min: 1.3, max: 1.8 },
    { key: "pulseWidth", label: "Pulse width", unit: "ns", toSI: 1e-9, siUnit: "s", default: 100, min: 1, max: 100000 },
    { key: "fiberLength", label: "Fibre length", unit: "km", toSI: 1e3, siUnit: "m", default: 50, min: 0.1, max: 300 },
    { key: "numSplices", label: "Splices (evenly spaced)", unit: "", toSI: 1, siUnit: "", default: 5, min: 0, max: 50 },
    { key: "spliceLoss", label: "Loss per splice", unit: "dB", toSI: 1, siUnit: "dB", default: 0.1, min: 0, max: 5 },
    { key: "launchReflectance", label: "Launch connector reflectance", unit: "dB", toSI: 1, siUnit: "dB", default: -45, min: -90, max: -10 },
    { key: "peakPower", label: "Peak launch power", unit: "dBm", toSI: 1, siUnit: "dBm", default: 20, min: -20, max: 40 },
    { key: "nep", label: "Receiver NEP", unit: "pW/√Hz", toSI: 1e-12, siUnit: "W/√Hz", default: 0.5, min: 0.001, max: 1000 },
    { key: "averages", label: "Averaged traces", unit: "", toSI: 1, siUnit: "", default: 65536, min: 1, max: 1e8 },
  ],
  outputs: [
    { key: "resolution", label: "Two-point resolution", unit: "m", toSI: 1, siUnit: "m" },
    { key: "dynamicRange", label: "Dynamic range (one-way)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "farEndMargin", label: "Far-end margin", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "spanLoss", label: "Span loss (fibre and splices)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "maxLength", label: "Clean-fibre reach", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "backscatter1ns", label: "Backscatter coefficient at 1 ns", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "backscatterPulse", label: "Backscatter coefficient at the pulse width", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "endPeak", label: "Far-end Fresnel peak above backscatter", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "launchPeak", label: "Launch connector peak above backscatter", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "rayleighLoss", label: "Rayleigh scattering loss", unit: "dB/km", toSI: 1, siUnit: "dB/km" },
    { key: "acquisition", label: "Minimum acquisition time", unit: "s", toSI: 1, siUnit: "s" },
  ],
  compute(si) {
    const s = otdrSummary({
      wavelength: si.wavelength,
      modeFieldDiameter: si.mfd,
      rayleighA: si.rayleighA,
      lossDbPerKm: si.attenuationCoeff,
      nPhase: si.nPhase,
      nGroup: si.refractiveIndex,
      pulseWidth: si.pulseWidth,
      length: si.fiberLength,
      splices: Math.round(si.numSplices),
      spliceLossDb: si.spliceLoss,
      launchReflectanceDb: si.launchReflectance,
      peakPowerDbm: si.peakPower,
      nep: si.nep,
      averages: Math.round(si.averages),
    });
    const warnings: string[] = [];
    const noRange = "The dynamic range is not positive (the near-end backscatter is at or below the noise), so there is no clean-fibre reach.";
    if (s.farEndMargin < 0) {
      warnings.push(`The far end lies ${(-s.farEndMargin).toFixed(1)} dB below the noise level: use a longer pulse, more averages or a higher launch power.`);
    }
    if (s.alphaS_dBkm > si.attenuationCoeff) {
      warnings.push("Rayleigh scattering alone exceeds the total loss, which no real fibre can do: raise the total loss or lower A for this wavelength.");
    }
    if (s.resolution > si.fiberLength) {
      warnings.push("The pulse spans more than the fibre: no event along it can be resolved.");
    }
    return {
      values: {
        resolution: s.resolution,
        dynamicRange: s.dr,
        farEndMargin: s.farEndMargin,
        spanLoss: s.spanLoss,
        maxLength: s.maxLength * 1e3,
        backscatter1ns: 10 * Math.log10(s.eta1),
        backscatterPulse: 10 * Math.log10(s.eta),
        endPeak: s.endPeak,
        launchPeak: s.launchPeak,
        rayleighLoss: s.alphaS_dBkm,
        acquisition: s.acquisition,
      },
      warnings,
      reasons: { maxLength: noRange },
    };
  },
  checks: [
    {
      // Independent scratch script, page defaults (1550 nm, MFD 10.4 µm, A 0.85, 0.19 dB/km, n 1.447, n_g 1.4682, 100 ns, 50 km,
      // 5 × 0.1 dB, launch −45 dB, 20 dBm, NEP 0.5 pW/√Hz, 65536 averages). Δz = cτ/2n_g = 299792458·1e-7/2.9364 = 10.2095238 m;
      // α_s = 0.85/1.55⁴ = 0.14726249 dB/km; S = 1.5(λ/(2π n w))² = 1.612333e-3; η = S α_s sinh(αΔz)/α (α = 0.19 dB/km in 1/m):
      // −82.5323552 dB at 1 ns, −62.5323551 dB at 100 ns; P_bs = 1 mW·100·η; P_n = 0.5e-12·√(1/2e-7)/√65536;
      // DR = 5 log₁₀(P_bs/P_n) = 20.5327473 dB; span loss 0.19·50 + 5·0.1 = 10 dB; margin 10.5327473 dB; reach DR/α = 108.0670908 km;
      // end R = ((1.447 − 1)/(1.447 + 1))² gives peak 23.8829494 dB; launch R = 10^(−4.5) gives peak 8.8041714 dB;
      // acquisition 65536·2·1.4682·50e3/c = 32.0955223 s.
      source: OTDR,
      basis: "computed",
      inputs: {},
      expect: {
        resolution: 10.209523838714073, rayleighLoss: 0.1472624878048252, backscatter1ns: -82.53235521565091,
        backscatterPulse: -62.53235507126023, dynamicRange: 20.532747258408996, spanLoss: 10, farEndMargin: 10.532747258408996,
        maxLength: 108.06709083373156, endPeak: 23.882949395290638, launchPeak: 8.804171435926829, acquisition: 32.095522296294725,
      },
      tolerance: 1e-8,
    },
    {
      // 1310 nm, MFD 9.2 µm, A 0.85, 0.35 dB/km, n = n_g = 1.4677, 1000 ns, 100 km, 10 × 0.05 dB, launch −55 dB, 15 dBm,
      // NEP 0.2 pW/√Hz, 1024 averages (same equations): Δz = 102.1300191 m; α_s = 0.28862487 dB/km; η = −80.1281329 dB (1 ns),
      // −50.1280839 dB (1 µs); DR = 24.2091330 dB; span 0.35·100 + 10·0.05 = 35.5 dB; margin −11.2908670 dB;
      // reach 69.1689513 km; end peak 17.8413789 dB; launch peak 0.6122148 dB; acquisition 1.0026435 s.
      source: OTDR,
      basis: "computed",
      inputs: {
        wavelength: 1310, mfd: 9.2, attenuationCoeff: 0.35, nPhase: 1.4677, refractiveIndex: 1.4677, pulseWidth: 1000,
        fiberLength: 100, numSplices: 10, spliceLoss: 0.05, launchReflectance: -55, peakPower: 15, nep: 0.2, averages: 1024,
      },
      expect: {
        resolution: 102.13001907746818, rayleighLoss: 0.2886248651998789, backscatter1ns: -80.12813293348033,
        backscatterPulse: -50.128083898507604, dynamicRange: 24.209132953185776, spanLoss: 35.5, farEndMargin: -11.290867046814224,
        maxLength: 69.16895129481651, endPeak: 17.841378901112737, launchPeak: 0.6122147729034804, acquisition: 1.0026435021257272,
      },
      tolerance: 1e-8,
    },
  ],
});
