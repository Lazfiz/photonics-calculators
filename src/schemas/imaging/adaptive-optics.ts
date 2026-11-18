import { adaptiveOpticsSummary, DM_LABELS, DM_TYPES, type DmType } from "../../physics/imaging/adaptive-optics";
import { defineSchema } from "../types";

const NOLL = "Noll R. J. (1976). Zernike polynomials and atmospheric turbulence. J. Opt. Soc. Am. 66, 207–211, " +
  "Table IV (residual variance Δ_J). https://doi.org/10.1364/JOSA.66.000207";
const HUDGIN = "Hudgin R. H. (1977). Wave-front compensation error due to finite corrector-element size. J. Opt. Soc. Am. " +
  "67, 393–395 (fitting error κ(d/r₀)^(5/3)). https://doi.org/10.1364/JOSA.67.000393";
const PARENTI = "Parenti R. R., Sasiela R. J. (1994). Laser-guide-star systems for astronomical applications. J. Opt. Soc. " +
  "Am. A 11, 288–309 (Strehl ratio of a partially corrected wavefront). https://doi.org/10.1364/JOSAA.11.000288";

export default defineSchema({
  href: "/imaging/adaptive-optics",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 20000 },
    { key: "dr0", label: "D/r₀ at this wavelength", unit: "", toSI: 1, siUnit: "", default: 10, min: 0.1, max: 200 },
    { key: "numZernike", label: "Zernike modes corrected J (piston = 1; rounded to an integer)", unit: "", toSI: 1, siUnit: "", default: 15, min: 1, max: 1000 },
    { key: "dmActuators", label: "Actuators (or segments) across the pupil", unit: "", toSI: 1, siUnit: "", default: 32, min: 1, max: 200 },
    { key: "dmStroke", label: "DM stroke, surface peak-to-valley (only compared with the stroke needed)", unit: "µm", toSI: 1e-6, siUnit: "m", default: 5, min: 0, max: 100 },
  ],
  choices: [
    {
      key: "dmType", label: "Deformable mirror type",
      options: DM_TYPES.map((value) => ({ value, label: DM_LABELS[value] })),
      default: "continuous",
    },
  ],
  outputs: [
    { key: "openVariance", label: "Uncorrected phase variance σ²", unit: "rad²", toSI: 1, siUnit: "rad²" },
    { key: "openRms", label: "Uncorrected rms optical path", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "strehlOpen", label: "Strehl, uncorrected", unit: "", toSI: 1, siUnit: "" },
    { key: "modalVariance", label: "Residual variance, J modes corrected", unit: "rad²", toSI: 1, siUnit: "rad²" },
    { key: "modalRms", label: "Residual rms optical path, J modes corrected", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "strehlModal", label: "Strehl, J modes corrected", unit: "", toSI: 1, siUnit: "" },
    { key: "pitchOverR0", label: "DM pitch d/r₀ = (D/r₀)/N", unit: "", toSI: 1, siUnit: "" },
    { key: "zonalVariance", label: "DM fitting error κ(d/r₀)^(5/3)", unit: "rad²", toSI: 1, siUnit: "rad²" },
    { key: "zonalRms", label: "DM fitting rms optical path", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "strehlZonal", label: "Strehl, DM fitting limit", unit: "", toSI: 1, siUnit: "" },
    { key: "strokeNeeded", label: "Stroke for ±3σ, tip-tilt removed", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ wavelength, dr0, numZernike, dmActuators, dmStroke, dmType }) {
    const r = adaptiveOpticsSummary({
      wavelength, dr0, modes: numZernike, actuators: dmActuators, dmType: dmType as DmType, stroke: dmStroke,
    });
    return {
      values: {
        openVariance: r.openVariance,
        openRms: r.openRms,
        strehlOpen: r.strehlOpen,
        modalVariance: r.modalVariance,
        modalRms: r.modalRms,
        strehlModal: r.strehlModal,
        pitchOverR0: r.pitchOverR0,
        zonalVariance: r.zonalVariance,
        zonalRms: r.zonalRms,
        strehlZonal: r.strehlZonal,
        strokeNeeded: r.strokeNeeded,
      },
      warnings: r.strokeShort ? ["The stroke is short of ±3σ: large excursions will saturate the mirror."] : [],
    };
  },
  checks: [
    {
      // λ = 550 nm, D/r₀ = 10, N = 32, continuous (κ 0.28). (D/r₀)^(5/3) = 10^(5/3) = 46.4158883:
      // σ² = 1.0299 · 46.4158883 = 47.8037234 rad², rms = √σ² · λ/2π = 605.22057 nm; Strehl = e^(−σ²) + (1 − e^(−σ²))/(1 + 100) = 0.00990099.
      // Fitting: d/r₀ = 10/32 = 0.3125, σ² = 0.28 · 0.3125^(5/3) = 0.0402941, Strehl 0.9608979.
      source: HUDGIN + "; " + PARENTI,
      basis: "computed",
      inputs: { wavelength: 550, dr0: 10, dmActuators: 32, dmType: "continuous" },
      expect: {
        openVariance: 47.80372339737802, openRms: 605.2205746116061, strehlOpen: 0.009900990099009901,
        pitchOverR0: 0.3125, zonalVariance: 0.04029409451637923, strehlZonal: 0.9608979384088129,
      },
      tolerance: 1e-8,
    },
    {
      // λ = 1000 nm, D/r₀ = 4, N = 16, segments piston only (κ 1.26). 4^(5/3) = 10.0793684:
      // d/r₀ = 0.25, σ² = 1.26 · 0.25^(5/3) = 0.1250078, rms = √σ² · λ/2π = 56.2715 nm, Strehl = e^(−σ²) + (1 − e^(−σ²))/17 = 0.8894023.
      // Open: σ² = 1.0299 · 10.0793684 = 10.380742.
      source: HUDGIN + "; " + PARENTI,
      basis: "computed",
      inputs: { wavelength: 1000, dr0: 4, dmActuators: 16, dmType: "segmentedPiston" },
      expect: {
        openVariance: 10.38074151429384, zonalVariance: 0.1250078328424957, zonalRms: 56.271532741176436, strehlZonal: 0.8894023436728721,
      },
      tolerance: 1e-8,
    },
    {
      // λ = 550 nm, D/r₀ = 10, J = 15. Noll's Δ_J ∝ Σ_{j>J} (n+1)Γ(n−5/6)/Γ(n+23/6) (radial order n of mode j), scaled so that Δ₁ = 1.0299;
      // summed to n = 2·10⁶ (+ closed-form tail): Δ₁₅ = 0.02790638461 → σ²_J = Δ₁₅ · 46.4158883 = 1.29529963,
      // Strehl e^(−σ²) + (1 − e^(−σ²))/(1 + (D/r₀)²) = 0.28100575.
      // Stroke: Δ₃ = 0.13433478 → σ² = 6.235268, rms = √σ² · λ/2π = 218.58 nm, ±3σ = 0.65573996 µm.
      source: NOLL + "; " + PARENTI,
      basis: "computed",
      inputs: { wavelength: 550, dr0: 10, numZernike: 15, dmStroke: 5 },
      expect: { modalVariance: 1.2952996320421564, strehlModal: 0.28100575054353794, strokeNeeded: 0.6557399566170983 },
      tolerance: 1e-8,
    },
  ],
});
