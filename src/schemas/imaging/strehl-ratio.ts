import { MAX_STREHL_RMS_WAVES, type ZernikeMode } from "../../physics/imaging/wavefront";
import { strehlSummary, type WavefrontInput } from "../../physics/imaging/strehl-ratio";
import { defineSchema } from "../types";

const MODES: readonly ZernikeMode[] = ["defocus", "astigmatism", "coma", "spherical"];
const MODE_LABELS: Record<ZernikeMode, string> = {
  defocus: "Defocus √3(2ρ² − 1)",
  astigmatism: "Astigmatism √6ρ²cos 2θ",
  coma: "Coma √8(3ρ³ − 2ρ)cos θ",
  spherical: "Spherical √5(6ρ⁴ − 6ρ² + 1)",
};
const INPUT_KINDS: readonly { value: WavefrontInput; label: string }[] = [
  { value: "rms", label: "RMS" },
  { value: "pv", label: "Peak-to-valley" },
];

const MAHAJAN_1983 = "Mahajan V. N. (1983). Strehl ratio for primary aberrations in terms of their aberration variance. J. Opt. Soc. Am. 73, 860–861, " +
  "https://doi.org/10.1364/JOSA.73.000860 (extended Maréchal form S = exp(−(2πσ/λ)²), σ for S = 0.8 follows by inversion; " +
  "Maréchal's λ/14 tolerance is the first-order form 1 − (2πσ/λ)² = 0.8).";
const MAHAJAN_1982 = "Mahajan V. N. (1982). Strehl ratio for primary aberrations: some analytical results for circular and annular pupils. " +
  "J. Opt. Soc. Am. 72, 1258–1266, https://doi.org/10.1364/JOSA.72.001258 (defocus: S = sinc²(φ/2), φ = 2√3·2πσ/λ), with Noll R. J. (1976), " +
  "J. Opt. Soc. Am. 66, 207–211, https://doi.org/10.1364/JOSA.66.000207 (Noll normalisation: the coefficient is the RMS of the term; PV of defocus = 2√3 σ).";
const NOLL_QUAD = "Exact Strehl of one balanced Zernike term, S = [∫₀¹ J₀(√6 Φ u) du]² for astigmatism (Φ = 2πσ/λ, u = ρ²), from Mahajan V. N. (1982), " +
  "J. Opt. Soc. Am. 72, 1258–1266, https://doi.org/10.1364/JOSA.72.001258; Noll R. J. (1976), J. Opt. Soc. Am. 66, 207–211, https://doi.org/10.1364/JOSA.66.000207 " +
  "(PV of astigmatism = 2√6 σ).";

const BEYOND = `the exact Strehl is computed up to ${MAX_STREHL_RMS_WAVES} waves RMS only`;

export default defineSchema({
  href: "/imaging/strehl-ratio",
  inputs: [
    { key: "wavelengthNm", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 550, min: 200, max: 20000 },
    { key: "wfeNm", label: "Wavefront error (RMS or peak-to-valley, as chosen below)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 20, min: 0, max: 10000 },
  ],
  choices: [
    {
      key: "input", label: "Wavefront error given as",
      options: INPUT_KINDS.map(({ value, label }) => ({ value, label })),
      default: "rms",
    },
    {
      key: "mode", label: "Aberration",
      options: MODES.map((value) => ({ value, label: MODE_LABELS[value] })),
      default: "defocus",
    },
  ],
  outputs: [
    { key: "rms", label: "RMS wavefront error σ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "waves", label: "σ in waves", unit: "λ", toSI: 1, siUnit: "" },
    { key: "pv", label: "PV for one term of the chosen aberration", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "marechal", label: "Strehl, Maréchal exp(−(2πσ/λ)²)", unit: "", toSI: 1, siUnit: "" },
    { key: "exact", label: "Strehl, exact for the chosen aberration", unit: "", toSI: 1, siUnit: "" },
    { key: "lambda14", label: "Maréchal tolerance λ/14", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "sigma08", label: "σ for S = 0.8 with exp(−(2πσ/λ)²)", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ wavelengthNm, wfeNm, input, mode }) {
    const s = strehlSummary(wavelengthNm, wfeNm, input as WavefrontInput, mode as ZernikeMode);
    const warnings: string[] = [];
    const reasons: Record<string, string> = {};
    if (s.waves > MAX_STREHL_RMS_WAVES) {
      warnings.push(`σ = ${s.waves.toFixed(2)} waves RMS is above ${MAX_STREHL_RMS_WAVES} waves: the exact Strehl is not computed.`);
      reasons.exact = BEYOND;
    }
    return {
      values: {
        rms: s.rms,
        waves: s.waves,
        pv: s.pv,
        marechal: s.marechal,
        exact: s.exact,
        lambda14: s.lambda14,
        sigma08: s.sigma08,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // λ = 550 nm, σ = 20 nm: 2πσ/λ = 0.22847...; S = exp(−(2π·20/550)²) = 0.9491362995855074; λ/14 = 550/14 = 39.285714285714285 nm;
      // σ(S = 0.8) = 550 · √(−ln 0.8)/(2π) = 41.34995025464485 nm (independent script).
      source: MAHAJAN_1983,
      basis: "computed",
      inputs: {},
      expect: { marechal: 0.9491362995855074, lambda14: 39.285714285714285, sigma08: 41.34995025464485 },
      tolerance: 1e-8,
    },
    {
      // Defocus, σ = 20 nm at 550 nm: x = √3 · 2πσ/λ; S = (sin x / x)² = 0.9488750801948005; PV = 2√3 · 20 nm = 69.28203230275508 nm.
      source: MAHAJAN_1982,
      basis: "computed",
      inputs: {},
      expect: { exact: 0.9488750801948005, pv: 69.28203230275508 },
      tolerance: 1e-8,
    },
    {
      // Astigmatism, PV 100 nm → σ = 100/(2√6) = 20.412414523193153 nm = 0.037113480951260276 λ; Φ = 2πσ/λ;
      // S = [∫₀¹ J₀(√6 Φ u) du]² by 200000-panel Simpson with a power-series J₀ (independent script) = 0.9470044194779101.
      source: NOLL_QUAD,
      basis: "computed",
      inputs: { wfeNm: 100, input: "pv", mode: "astigmatism" },
      expect: { rms: 20.412414523193153, waves: 0.037113480951260276, exact: 0.9470044194779101 },
      tolerance: 1e-8,
    },
  ],
});
