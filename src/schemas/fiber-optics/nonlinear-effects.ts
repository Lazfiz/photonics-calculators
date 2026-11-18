import { NONLINEAR_POLARIZATIONS, nonlinearSummary, toDb, type NonlinearPolarization } from "../../physics/fiber-optics/nonlinear-effects";
import { defineSchema } from "../types";

const AGRAWAL = "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., Academic Press. https://doi.org/10.1016/C2018-0-01168-8, " +
  "§2.3 (γ), §4.1 (L_eff, SPM phase), §7.1 (XPM), §8.1 (Raman gain), §9.1 (Brillouin gain, linewidth factor).";
const SMITH = "Smith R. G. (1972). Optical power handling capacity of low loss optical fibers as determined by stimulated Raman and " +
  "Brillouin scattering. Applied Optics 11, 2489–2494. https://doi.org/10.1364/AO.11.002489 (threshold gain-length products 16 and 21).";
const INOUE = "Inoue K. (1992). Four-wave mixing in an optical fiber in the zero-dispersion wavelength region. Journal of Lightwave " +
  "Technology 10, 1553–1561. https://doi.org/10.1109/50.184893 (efficiency η, product power).";

const NO_FWM = "A four-wave-mixing product needs at least 2 channels.";
const polarizations = Object.keys(NONLINEAR_POLARIZATIONS) as NonlinearPolarization[];
const LABELS: Record<NonlinearPolarization, string> = {
  copolarized: "Co-polarized (PM fibre, worst case)",
  standard: "Standard fibre (random birefringence)",
  scrambled: "Standard fibre, scrambled pump",
};

export default defineSchema({
  href: "/fiber-optics/nonlinear-effects",
  choices: [
    {
      key: "polarization",
      label: "SBS/SRS polarization factor K",
      options: polarizations.map((value) => ({ value: value as string, label: LABELS[value] })),
      default: "copolarized",
    },
  ],
  inputs: [
    { key: "power", label: "Launch power per channel", unit: "dBm", toSI: 1, siUnit: "dBm", default: 10, min: -30, max: 40 },
    { key: "length", label: "Fibre length", unit: "km", toSI: 1e3, siUnit: "m", default: 80, min: 0, max: 5000 },
    { key: "effectiveArea", label: "Effective area A_eff", unit: "µm²", toSI: 1e-12, siUnit: "m²", default: 80, min: 1, max: 1000 },
    { key: "alpha", label: "Attenuation", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 0.2, min: 0, max: 10 },
    { key: "n2", label: "Nonlinear index n₂", unit: "×1e-20 m²/W", toSI: 1e-20, siUnit: "m²/W", default: 2.6, min: 0, max: 100 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 500, max: 2500 },
    { key: "dispersion", label: "Dispersion D", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²", default: 17, min: -200, max: 200 },
    { key: "slope", label: "Dispersion slope S", unit: "ps/(nm²·km)", toSI: 1e3, siUnit: "s/m³", default: 0.058, min: -1, max: 1 },
    { key: "numChannels", label: "WDM channels", unit: "", toSI: 1, siUnit: "", default: 8, min: 1, max: 200 },
    { key: "channelSpacing", label: "Channel spacing", unit: "GHz", toSI: 1e9, siUnit: "Hz", default: 100, min: 0, max: 1000 },
    { key: "sourceLinewidth", label: "Source linewidth Δν_s (Lorentzian)", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 0, min: 0, max: 10000 },
    { key: "brillouinBandwidth", label: "Brillouin bandwidth Δν_B (FWHM)", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 35, min: 1, max: 1000 },
  ],
  outputs: [
    { key: "gamma", label: "Nonlinear coefficient γ", unit: "/(W·km)", toSI: 1e-3, siUnit: "1/(W·m)" },
    { key: "effectiveLength", label: "Effective length L_eff", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "phiSPM", label: "SPM phase φ_SPM", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "broadening", label: "SPM rms broadening (unchirped Gaussian, no dispersion)", unit: "×", toSI: 1, siUnit: "" },
    { key: "phiXPM", label: "XPM phase, maximum (other channels)", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "fwmEfficiency", label: "FWM efficiency η (nearest product)", unit: "", toSI: 1, siUnit: "" },
    { key: "fwmRatioDb", label: "FWM product / channel power (degenerate product)", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "sbsThreshold", label: "SBS threshold", unit: "dBm", toSI: 1, siUnit: "dBm" },
    { key: "srsThreshold", label: "SRS threshold", unit: "dBm", toSI: 1, siUnit: "dBm" },
  ],
  compute({ polarization, power, length, effectiveArea, alpha, n2, wavelength, dispersion, slope, numChannels, channelSpacing, sourceLinewidth, brillouinBandwidth }) {
    const pol = (polarization in NONLINEAR_POLARIZATIONS ? polarization : "copolarized") as NonlinearPolarization;
    const s = nonlinearSummary({
      powerDbm: power, length, effectiveArea, alphaDbPerKm: alpha, n2, wavelength, dispersion, slope, numChannels,
      spacing: channelSpacing, polarization: pol, sourceLinewidth, brillouinLinewidth: brillouinBandwidth,
    });
    const multi = s.N >= 2;
    const ratioDb = multi ? toDb(s.fwmRatio) ?? NaN : NaN;
    const warnings: string[] = [];
    if (power > s.sbsDbm) warnings.push("The launch power exceeds the SBS threshold (for a narrow CW line; modulated channels have a much higher threshold).");
    if (power > s.srsDbm) warnings.push("The launch power exceeds the SRS threshold.");
    return {
      values: {
        gamma: s.gamma,
        effectiveLength: s.Leff,
        phiSPM: s.phiSPM,
        broadening: s.broadening,
        phiXPM: s.phiXPM,
        fwmEfficiency: multi ? s.eta : NaN,
        fwmRatioDb: ratioDb,
        sbsThreshold: s.sbsDbm,
        srsThreshold: s.srsDbm,
      },
      warnings,
      reasons: {
        fwmEfficiency: NO_FWM,
        fwmRatioDb: multi ? "The nonlinear index n₂ is 0, so the SPM phase φ_SPM is 0 and the product-to-signal power ratio is 0 (−∞ dB)." : NO_FWM,
      },
    };
  },
  checks: [
    {
      // Defaults: P = 10 dBm = 10 mW, L = 80 km, A_eff = 80 µm², α = 0.2 dB/km = 0.2/(10/ln 10)/1e3 = 4.6052e-5 /m, n₂ = 2.6e-20 m²/W,
      // λ = 1550 nm. γ = 2π n₂/(λ A_eff) = 1.31744208e-3 /(W·m) = 1.31744208 /(W·km); L_eff = (1 − e^(−αL))/α = 21169.2749 m;
      // φ = γ P L_eff = 0.278892936 rad; XPM, 7 other channels: 2φ·7 = 3.90450110 rad; Δω_rms/Δω₀ = √(1 + 4φ²/(3√3)) = 1.02950282.
      source: AGRAWAL,
      basis: "computed",
      inputs: {},
      expect: { gamma: 1.3174420805376552, effectiveLength: 21.169274886976453, phiSPM: 0.2788929355057179, phiXPM: 3.904501097080051, broadening: 1.0295028164891376 },
      tolerance: 1e-8,
    },
    {
      // Same span, scrambled pump (SBS K = 2, SRS K = 2), 20 MHz line, Δν_B = 35 MHz (A_eff, L_eff, g_B as above;
      // g_R = 1e-13·(1 µm/1550 nm) = 6.4516e-14 m/W): P_SBS = 21·2·A_eff(1 + 20/35)/(g_B L_eff) = 4.9812e-3 W = 6.97957936 dBm;
      // P_SRS = 16·2·A_eff/(g_R L_eff) = 1.8745 W = 32.7286568 dBm.
      source: SMITH,
      basis: "computed",
      inputs: { polarization: "scrambled", sourceLinewidth: 20 },
      expect: { sbsThreshold: 6.979579358504734, srsThreshold: 32.72865681134821 },
      tolerance: 1e-8,
    },
    {
      // D = S = 0 makes Δβ = 0, so η = α²/α²·[1 + 4e^(−αL)·sin²(0)/(1 − e^(−αL))²] = 1 and the degenerate product is
      // η(d/3)²φ² with d = 3: 10·log10(φ²) = 10·log10(0.2788929355²) = −11.0912497 dB (φ from the first case).
      source: INOUE,
      basis: "computed",
      inputs: { dispersion: 0, slope: 0, numChannels: 3 },
      expect: { fwmEfficiency: 1, fwmRatioDb: -11.091249729719639 },
      tolerance: 1e-8,
    },
  ],
});
