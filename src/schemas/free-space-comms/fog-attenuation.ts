import {
  AL_NABOULSI_LAMBDA, AL_NABOULSI_VISIBILITY, DB_PER_E_FOLD, aerosolExponent, alNaboulsiFogExtinction, totalExtinction,
  type AerosolLaw, type FogType,
} from "../../physics/free-space-comms/atmospheric-attenuation";
import { defineSchema } from "../types";

const KIM = "Kim I. I., McArthur B., Korevaar E. (2001). Comparison of laser beam propagation at 785 nm and 1550 nm in " +
  "fog and haze for optical wireless communications. Proc. SPIE 4214, 26–37: σ = σ_R + [3.912/V − σ_R(550 nm)](λ/550 nm)^(−q), " +
  "Rayleigh part from Bucholtz A. (1995). Appl. Opt. 34(15), 2765–2773, eqs. (2)–(4).";
const KRUSE = "Kruse P. W., McGlauchlin L. D., McQuistan R. B. (1962). Elements of Infrared Technology. Wiley, as " +
  "reproduced in Nadeem F., Leitgeb E. (2010). Radioengineering 19(2), 223–227, eqs. (1)–(3): q = 0.585 V^(1/3) for V < 6 km.";
const AL_NABOULSI = "Al Naboulsi M., Sizun H., de Fornel F. (2004). Fog attenuation prediction for optical and infrared " +
  "waves. Opt. Eng. 43(2), 319–329, as reproduced in Nadeem F., Leitgeb E. (2010). Radioengineering 19(2), 223–227, " +
  "eqs. (4)–(6): advection fog σ = (0.11478 λ + 3.8367)/V, λ in µm, V and σ per km.";

const isAlNaboulsi = (m: string): m is FogType => m === "advection" || m === "radiation";

export default defineSchema({
  href: "/free-space-comms/fog-attenuation",
  choices: [
    {
      key: "model",
      label: "Model",
      options: [
        { value: "kim", label: "Kim" },
        { value: "kruse", label: "Kruse" },
        { value: "advection", label: "Al Naboulsi, advection fog" },
        { value: "radiation", label: "Al Naboulsi, radiation fog" },
      ],
      default: "kim",
    },
  ],
  inputs: [
    { key: "visibility", label: "Meteorological visibility V", unit: "km", toSI: 1e3, siUnit: "m", default: 0.5, min: 0.01, max: 100 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "range", label: "Link range", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 50 },
  ],
  outputs: [
    { key: "extinction", label: "Extinction σ (e-folds of power per length)", unit: "km⁻¹", toSI: 1e-3, siUnit: "m⁻¹" },
    { key: "specificAttenuation", label: "Specific attenuation 10 log₁₀(e) σ", unit: "dB/km", toSI: 1e-3, siUnit: "dB/m" },
    { key: "pathLoss", label: "Path loss over the range", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "transmittance", label: "Transmittance over the range", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "exponentQ", label: "Size-distribution exponent q (Kim, Kruse only)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ model, visibility, wavelength, range }) {
    const fog = isAlNaboulsi(model);
    const beta = fog
      ? alNaboulsiFogExtinction(wavelength, visibility, model)
      : totalExtinction(wavelength, visibility, model as AerosolLaw);
    const alpha = beta * DB_PER_E_FOLD; // dB/m
    const loss = alpha * range;
    const warnings: string[] = [];
    if (fog) {
      warnings.push("Al Naboulsi's laws give no size-distribution exponent q: exponentQ is null.");
      if (wavelength < AL_NABOULSI_LAMBDA[0] || wavelength > AL_NABOULSI_LAMBDA[1]
        || visibility < AL_NABOULSI_VISIBILITY[0] || visibility > AL_NABOULSI_VISIBILITY[1]) {
        warnings.push("Outside the fitted range of Al Naboulsi's law (690–1550 nm, V = 50–1000 m): an extrapolation.");
      }
    } else {
      if (wavelength > 1550e-9) warnings.push("Beyond 1550 nm the visibility laws are extrapolated.");
      if (visibility < 50) warnings.push("Below 50 m visibility: extrapolation.");
    }
    return {
      values: {
        extinction: beta,
        specificAttenuation: alpha,
        pathLoss: loss,
        transmittance: 10 ** (-loss / 10),
        exponentQ: fog ? NaN : aerosolExponent(visibility, model as AerosolLaw),
      },
      warnings,
    };
  },
  checks: [
    {
      // Advection fog, 1550 nm, V = 0.5 km, 1 km: σ = (0.11478 · 1.55 + 3.8367)/0.5 = 8.029218 km⁻¹; × 10 log₁₀ e = 4.342945
      // gives 34.87045 dB/km; transmittance 10^(−3.487045) = 0.0325803 %.
      source: AL_NABOULSI,
      basis: "computed",
      inputs: { model: "advection", visibility: 0.5, wavelength: 1550, range: 1 },
      expect: { extinction: 8.029218, specificAttenuation: 34.870450713982635, pathLoss: 34.870450713982635, transmittance: 0.03258028871860372 },
      tolerance: 1e-8,
    },
    {
      // Kim, 850 nm, V = 2 km, 3 km: q = 0.16 · 2 + 0.34 = 0.66; Bucholtz Rayleigh 1.9679e-3 km⁻¹ at 850 nm, aerosol
      // (3.912/2 − 0.0115)(850/550)^(−0.66): σ = 1.460911 km⁻¹, 6.344655 dB/km, loss 19.03396 dB.
      source: KIM,
      basis: "computed",
      inputs: { model: "kim", visibility: 2, wavelength: 850, range: 3 },
      expect: { extinction: 1.460910751740203, specificAttenuation: 6.344654780339015, pathLoss: 19.033964341017047, exponentQ: 0.66 },
      tolerance: 1e-6,
    },
    {
      // Kruse, 1550 nm, V = 0.5 km: q = 0.585 · 0.5^(1/3) = 0.464315; σ = 1.76e-4 + (7.824 − 0.0115)(1550/550)^(−q) =
      // 4.829280 km⁻¹, 20.97330 dB/km; Kim has q = 0 here and 7.812744 km⁻¹: the two laws differ by a factor 1.6 in fog.
      source: KRUSE,
      basis: "computed",
      inputs: { model: "kruse", visibility: 0.5, wavelength: 1550, range: 1 },
      expect: { extinction: 4.829279725410907, specificAttenuation: 20.973295363132078, pathLoss: 20.973295363132078, exponentQ: 0.46431480770069833 },
      tolerance: 1e-6,
    },
  ],
});
