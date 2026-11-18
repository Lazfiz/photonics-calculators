import { srsSpan, srsSummary } from "../../physics/fiber-optics/srs-threshold";
import { defineSchema } from "../types";

const SMITH = "Smith R. G. (1972). Optical power handling capacity of low loss optical fibers as determined by stimulated Raman and " +
  "Brillouin scattering. Applied Optics 11, 2489–2494. https://doi.org/10.1364/AO.11.002489 (forward SRS threshold g_R P L_eff/A_eff ≈ 16 for co-polarized waves).";
const AGRAWAL = "Agrawal G. P. (2019). Nonlinear Fiber Optics, 6th ed., Academic Press. https://doi.org/10.1016/C2018-0-01168-8, " +
  "§4.1 (L_eff), §8.1 (Raman gain g_R ≈ 1e-13 m/W at 1 µm scaling as 1/λ_p, polarization factor K = 2 in standard fibre).";

const NO_STOKES = "The Raman shift is at or above the pump frequency, so there is no Stokes wavelength.";

export default defineSchema({
  href: "/fiber-optics/srs-threshold",
  inputs: [
    { key: "wavelength", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2200 },
    { key: "fiberLength", label: "Fibre length", unit: "km", toSI: 1e3, siUnit: "m", default: 10, min: 0.001, max: 10000 },
    { key: "effectiveArea", label: "Effective area A_eff", unit: "µm²", toSI: 1e-12, siUnit: "m²", default: 80, min: 1, max: 1000 },
    { key: "loss", label: "Attenuation", unit: "dB/km", toSI: 1, siUnit: "dB/km", default: 0.2, min: 0, max: 10 },
    { key: "ramanGain", label: "Peak Raman gain g_R at the pump wavelength", unit: "m/W", toSI: 1, siUnit: "m/W", default: 6.5e-14, min: 1e-15, max: 1e-12 },
    { key: "ramanShift", label: "Raman shift", unit: "THz", toSI: 1e12, siUnit: "Hz", default: 13.2, min: 0, max: 200 },
  ],
  outputs: [
    { key: "effectiveLength", label: "Effective length L_eff", unit: "km", toSI: 1e3, siUnit: "m" },
    { key: "thresholdCopolarized", label: "SRS threshold, co-polarized or PM fibre (K = 1)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "thresholdStandard", label: "SRS threshold, standard fibre (K = 2)", unit: "W", toSI: 1, siUnit: "W" },
    { key: "stokesWavelength", label: "Stokes wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "ramanGainAtPump", label: "Typical peak Raman gain at the pump wavelength (1/λ_p rule)", unit: "m/W", toSI: 1, siUnit: "m/W" },
  ],
  compute({ wavelength, fiberLength, effectiveArea, loss, ramanGain, ramanShift }) {
    const s = srsSummary(srsSpan({
      lambda: wavelength, L: fiberLength, Aeff: effectiveArea, lossDbPerKm: loss, gR: ramanGain, shift: ramanShift,
    }));
    const [copolarized, standard] = s.thresholds;
    return {
      values: {
        effectiveLength: s.Leff, thresholdCopolarized: copolarized, thresholdStandard: standard,
        stokesWavelength: s.lambdaStokes, ramanGainAtPump: s.gRAtLambda,
      },
      reasons: { stokesWavelength: NO_STOKES },
    };
  },
  checks: [
    {
      // Defaults: α = 0.2 dB/km = 4.60517e-5 /m, L = 10 km: L_eff = (1 − e^(−αL))/α = 8013.65944 m; A_eff = 80 µm², g_R = 6.5e-14 m/W;
      // P_th = 16 K A_eff/(g_R L_eff): K = 1: 2.45734272 W, K = 2: 4.91468544 W.
      // Stokes: 1/λ_s = 1/1550 nm − 13.2 THz/c ⇒ λ_s = 1663.53138 nm; g_R(1550 nm) = 1e-13·(1 µm/1550 nm) = 6.4516129e-14 m/W.
      source: SMITH,
      basis: "computed",
      inputs: {},
      expect: {
        effectiveLength: 8.013659443958735, thresholdCopolarized: 2.457342719642666, thresholdStandard: 4.914685439285332,
        stokesWavelength: 1663.5313820207748, ramanGainAtPump: 6.451612903225806e-14,
      },
      tolerance: 1e-8,
    },
    {
      // 1064 nm, 25 km, A_eff = 50 µm², 0.5 dB/km, g_R = 9e-14 m/W: α = 1.15129e-4 /m, L_eff = 8197.44617 m;
      // P_th = 16·50e-12/(9e-14·8197.44617) = 1.08434855 W (K = 1), 2.16869711 W (K = 2);
      // Stokes: 1/λ_s = 1/1064 nm − 13.2 THz/c ⇒ 1116.29673 nm; g_R(1064 nm) = 1e-13·1000/1064 = 9.3984962e-14 m/W.
      source: AGRAWAL,
      basis: "computed",
      inputs: { wavelength: 1064, fiberLength: 25, effectiveArea: 50, loss: 0.5, ramanGain: 9e-14 },
      expect: {
        effectiveLength: 8.197446169112376, thresholdCopolarized: 1.084348552648243, thresholdStandard: 2.168697105296486,
        stokesWavelength: 1116.2967267854215, ramanGainAtPump: 9.398496240601503e-14,
      },
      tolerance: 1e-8,
    },
  ],
});
