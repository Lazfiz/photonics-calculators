import { MM_PER_HOUR, type RainShape, rainPathAttenuation, rainPowerLaw } from "../../physics/free-space-comms/precipitation";
import { defineSchema } from "../types";

const ITU = "Rec. ITU-R P.1814-1 (09/2025), Prediction methods required for the design of terrestrial free-space optical links, " +
  "§§ 4.1.2.2 and 4.2.3: γ = k R^α dB/km (eq. 11, Table 4), A′ = γ L F, F = 1/(1 + L(R − 6.2)/2623) (eqs. 14–15), " +
  "A = A′ − a_ms L^b_ms (eqs. 16–17), a_ms, b_ms quadratic in ln R (eqs. 18–19, Table 5), R in mm/h, L ≤ 5 km in km.";

export default defineSchema({
  href: "/free-space-comms/rain-attenuation",
  inputs: [
    { key: "rainRate", label: "Rain rate", unit: "mm/h", toSI: MM_PER_HOUR, siUnit: "m/s", default: 25, min: 0, max: 300 },
    { key: "range", label: "Link length", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0, max: 5 },
    { key: "mu", label: "Drop-size shape µ (gamma DSD, integer −2…2; rounded)", unit: "", toSI: 1, siUnit: "", default: 0, min: -2, max: 2 },
  ],
  outputs: [
    { key: "specificAttenuation", label: "Specific attenuation γ", unit: "dB/km", toSI: 1e-3, siUnit: "dB/m" },
    { key: "pathAttenuation", label: "Path attenuation A", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "transmittance", label: "Transmittance", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "pathReduction", label: "Path reduction F", unit: "", toSI: 1, siUnit: "" },
    { key: "reducedAttenuation", label: "A′ = γ L F", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "scatteringGain", label: "Multiple-scattering gain applied", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "k", label: "Coefficient k", unit: "", toSI: 1, siUnit: "" },
    { key: "alpha", label: "Exponent α", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ rainRate, range, mu }) {
    const shape = Math.round(mu) as RainShape;
    const r = rainPathAttenuation(rainRate, range, shape);
    const { k, alpha } = rainPowerLaw(shape);
    const warnings: string[] = [];
    if (!Number.isFinite(r.attenuation)) warnings.push("No result: the path reduction factor is not defined for this rate and length.");
    if (rainRate < MM_PER_HOUR) {
      warnings.push("Below 1 mm/h the multiple-scattering fit is replaced by a gain scaled with A′ (a choice of this calculator, not of the Recommendation).");
    }
    return {
      values: {
        specificAttenuation: r.specific,
        pathAttenuation: r.attenuation,
        transmittance: 10 ** (-r.attenuation / 10),
        pathReduction: r.reduction,
        reducedAttenuation: r.reduced,
        scatteringGain: r.gain,
        k,
        alpha,
      },
      warnings,
    };
  },
  checks: [
    {
      // µ = 0, R = 25 mm/h, L = 1 km (Table 4: k = 1.2924, α = 0.6436; Table 5 µ = 0): γ = 1.2924 · 25^0.6436 = 10.259144 dB/km,
      // F = 1/(1 + 18.8/2623) = 0.9928836, A′ = 10.186137 dB; ln 25 = 3.218876: a_ms = 0.01594 − 0.001476 ln R + 0.008297 (ln R)²,
      // b_ms = 0.117663 + 0.029602 ln R + 0.002142 (ln R)², G_ms = 0.0971555 dB, A = 10.088981 dB, 10^(−A/10) = 9.797198 %.
      source: ITU,
      basis: "computed",
      inputs: { rainRate: 25, range: 1, mu: 0 },
      expect: {
        specificAttenuation: 10.259144311780721, pathReduction: 0.9928836399424635, reducedAttenuation: 10.186136546975863,
        scatteringGain: 0.09715549687791057, pathAttenuation: 10.088981050097953, transmittance: 9.797198221572112,
      },
      tolerance: 1e-8,
    },
    {
      // µ = −1 (k = 1.5921, α = 0.5506), R = 50 mm/h, L = 3 km: γ = 13.722184 dB/km, F = 1/(1 + 3 · 43.8/2623) = 0.9522945,
      // A′ = 39.202680 dB, G_ms = 0.1310744 dB (Table 5 µ = −1), A = 39.071606 dB.
      source: ITU,
      basis: "computed",
      inputs: { rainRate: 50, range: 3, mu: -1 },
      expect: { specificAttenuation: 13.722183629579625, pathReduction: 0.95229451060122, pathAttenuation: 39.071606044315324, transmittance: 0.012383385575964365 },
      tolerance: 1e-8,
    },
  ],
});
