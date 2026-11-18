import { SILICA_BRILLOUIN_GAIN } from "../../physics/fiber-optics/fiber-nonlinear";
import { sbsSpan, sbsSummary } from "../../physics/fiber-optics/sbs-threshold";
import { defineSchema } from "../types";

const SMITH = "Smith R. G. (1972). Optical power handling capacity of low loss optical fibers as determined by stimulated Raman and " +
  "Brillouin scattering. Applied Optics 11, 2489–2494. https://doi.org/10.1364/AO.11.002489 (backward SBS threshold g_B P L_eff/A_eff ≈ 21 for co-polarized waves.";
const AGRAWAL = "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., Academic Press. https://doi.org/10.1016/C2018-0-01168-8, " +
  "§4.1 (L_eff), §9.1 (Brillouin shift ν_B = 2 n v_A/λ and the linewidth factor 1 + Δν_s/Δν_B), §9.2 (the threshold rule g_B P_th L_eff/A_eff ≈ 21).";

export default defineSchema({
  href: "/fiber-optics/sbs-threshold",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2200 },
    { key: "fiberLength", label: "Fibre length", unit: "km", toSI: 1e3, siUnit: "m", default: 10, min: 0.001, max: 10000 },
    { key: "effectiveArea", label: "Effective area A_eff", unit: "µm²", toSI: 1e-12, siUnit: "m²", default: 80, min: 1, max: 1000 },
    { key: "loss", label: "Attenuation", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 0.2, min: 0, max: 10 },
    { key: "brillouinGain", label: "Brillouin gain g_B", unit: "m/W", toSI: 1, siUnit: "m/W", default: SILICA_BRILLOUIN_GAIN, min: 1e-12, max: 1e-9 },
    { key: "brillouinBandwidth", label: "Brillouin gain bandwidth Δν_B", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 35, min: 0.1, max: 1000 },
    { key: "laserLinewidth", label: "Source linewidth Δν_s (Lorentzian)", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 1, min: 0, max: 10000 },
  ],
  outputs: [
    { key: "effectiveLength", label: "Effective length L_eff", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "brillouinShift", label: "Brillouin shift ν_B", unit: "GHz", toSI: 1e9, siUnit: "Hz" },
    { key: "linewidthFactor", label: "Linewidth factor 1 + Δν_s/Δν_B", unit: "", toSI: 1, siUnit: "" },
    { key: "thresholdCopolarized", label: "SBS threshold, co-polarized or PM fibre (K = 1)", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "thresholdStandard", label: "SBS threshold, standard fibre (K = 1.5)", unit: "mW", toSI: 1e-3, siUnit: "W" },
    { key: "thresholdScrambled", label: "SBS threshold, scrambled pump (K = 2)", unit: "mW", toSI: 1e-3, siUnit: "W" },
  ],
  compute({ wavelength, fiberLength, effectiveArea, loss, brillouinGain, brillouinBandwidth, laserLinewidth }) {
    const s = sbsSummary(sbsSpan({
      lambda: wavelength, L: fiberLength, Aeff: effectiveArea, lossDbPerKm: loss, gB: brillouinGain,
      dnuB: brillouinBandwidth, dnuS: laserLinewidth,
    }));
    const [copolarized, standard, scrambled] = s.thresholds;
    return {
      values: {
        effectiveLength: s.Leff, brillouinShift: s.nuB, linewidthFactor: s.linewidthFactor,
        thresholdCopolarized: copolarized, thresholdStandard: standard, thresholdScrambled: scrambled,
      },
    };
  },
  checks: [
    {
      // Defaults: α = 0.2 dB/km = 0.2·ln10/10/1e3 = 4.60517e-5 /m, L = 10 km: L_eff = (1 − e^(−αL))/α = 8013.65944 m;
      // ν_B = 2 n v_A/λ = 2·1.45·5960/1550 nm = 11.1509677 GHz; factor 1 + 1/35 = 1.02857143;
      // P_th = 21 K A_eff (1 + Δν_s/Δν_B)/(g_B L_eff) with A_eff = 80 µm², g_B = 5e-11 m/W: K = 1: 4.31263647 mW, K = 1.5: 6.46895471 mW, K = 2: 8.62527295 mW.
      source: SMITH,
      basis: "computed",
      inputs: {},
      expect: {
        effectiveLength: 8.013659443958735, brillouinShift: 11.150967741935482, linewidthFactor: 1.0285714285714285,
        thresholdCopolarized: 4.312636472972878, thresholdStandard: 6.4689547094593175, thresholdScrambled: 8.625272945945756,
      },
      tolerance: 1e-8,
    },
    {
      // 1064 nm, 25 km, A_eff = 50 µm², 0.5 dB/km, g_B = 3e-11 m/W, Δν_B = 50 MHz, Δν_s = 20 MHz: α = 1.15129e-4 /m,
      // L_eff = 8197.44617 m; ν_B = 2·1.45·5960/1064 nm = 16.2443609 GHz; factor 1 + 20/50 = 1.4;
      // P_th(K = 1.5) = 21·1.5·50e-12·1.4/(3e-11·8197.44617) = 8.96620709 mW; K = 2: 11.9549428 mW.
      source: AGRAWAL,
      basis: "computed",
      inputs: { wavelength: 1064, fiberLength: 25, effectiveArea: 50, loss: 0.5, brillouinGain: 3e-11, brillouinBandwidth: 50, laserLinewidth: 20 },
      expect: {
        effectiveLength: 8.197446169112376, brillouinShift: 16.244360902255638, linewidthFactor: 1.4,
        thresholdStandard: 8.966207094710158, thresholdScrambled: 11.954942792946876,
      },
      tolerance: 1e-8,
    },
  ],
});
