import {
  DB_PER_E_FOLD, aerosolExtinction, kimExponent, rayleighExtinction,
} from "../../physics/free-space-comms/atmospheric-attenuation";
import { defineSchema } from "../types";

const KIM = "Kim I. I., McArthur B., Korevaar E. (2001). Comparison of laser beam propagation at 785 nm and 1550 nm in fog " +
  "and haze for optical wireless communications. Proc. SPIE 4214, 26–37: aerosol extinction (3.912/V − β_R(550 nm))(λ/550 nm)^(−q), " +
  "q = 1.6 (V > 50 km), 1.3 (6–50 km), 0.16V + 0.34 (1–6 km), V − 0.5 (0.5–1 km), 0 (V < 0.5 km).";
const BUCHOLTZ = "Bucholtz A. (1995). Rayleigh-scattering calculations for the terrestrial atmosphere. Appl. Opt. 34, 2765, " +
  "eqs. (2)–(4), with the Peck & Reeder (1972) air index, J. Opt. Soc. Am. 62, 958.";

export default defineSchema({
  href: "/laser-safety/atmospheric-attenuation",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1064, min: 200, max: 20000 },
    { key: "distance", label: "Distance", unit: "m", toSI: 1, siUnit: "m", default: 1000, min: 1, max: 1e7 },
    { key: "visibility", label: "Meteorological visibility", unit: "km", toSI: 1e3, siUnit: "m", default: 23, min: 0.01, max: 300 },
  ],
  outputs: [
    { key: "transmission", label: "Transmission over the distance", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "attenuation", label: "Attenuation over the distance", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "extinction", label: "Total extinction α", unit: "km⁻¹", toSI: 1e-3, siUnit: "1/m" },
    { key: "rayleigh", label: "Rayleigh extinction", unit: "km⁻¹", toSI: 1e-3, siUnit: "1/m" },
    { key: "aerosol", label: "Aerosol extinction (Kim)", unit: "km⁻¹", toSI: 1e-3, siUnit: "1/m" },
    { key: "kimExponent", label: "Kim exponent q", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, distance, visibility }) {
    // Same glue as the page: extinction in 1/m × 1e3 gives km⁻¹; T = exp(−α L), loss = 10 log10(e) α L.
    const rayleigh = rayleighExtinction(wavelength) * 1e3;
    const aerosol = aerosolExtinction(wavelength, visibility) * 1e3;
    const total = rayleigh + aerosol;
    const warnings: string[] = [];
    const nm = Math.round(wavelength * 1e15) / 1e6; // rounds away the float error of nm → m → nm
    if (nm > 1600) warnings.push("Kim's q law is fitted up to 1.55 µm and the Peck–Reeder index to 1.69 µm: extrapolation.");
    if ((nm >= 1350 && nm <= 1450) || (nm >= 1800 && nm <= 1950)) {
      warnings.push("This wavelength lies in a water absorption band: molecular water absorption is not modelled; the real loss here is far higher.");
    }
    return {
      values: {
        transmission: Math.exp((-total * distance) / 1000),
        attenuation: (total * distance * DB_PER_E_FOLD) / 1000,
        extinction: total / 1e3,
        rayleigh: rayleigh / 1e3,
        aerosol: aerosol / 1e3,
        kimExponent: kimExponent(visibility),
      },
      warnings,
    };
  },
  checks: [
    {
      // 550 nm, V = 1 km: the visibility fixes the total extinction, β = −ln(0.02)/V = 3.912023005 km⁻¹, so over 1 km T = 0.02 = 2 %
      // and the loss is −10 log₁₀(0.02) = 16.98970004 dB; q = V − 0.5 = 0.5.
      source: KIM,
      basis: "computed",
      inputs: { wavelength: 550, distance: 1000, visibility: 1 },
      expect: { transmission: 2, attenuation: 16.98970004, extinction: 3.912023005, kimExponent: 0.5 },
      tolerance: 1e-8,
    },
    {
      // 1550 nm, V = 23 km, 1 km: β_R(550 nm) = 0.011478101 km⁻¹; aerosol (3.912023005/23 − 0.011478101)(1550/550)^(−1.3) = 0.158609856 × 0.260030
      // = 0.0412449 km⁻¹ (q = 1.3); Rayleigh at 1550 nm 1.76024e-4 km⁻¹; total 0.04142094 km⁻¹: T = 95.94251817 %, loss 0.1798888694 dB.
      source: KIM + " " + BUCHOLTZ,
      basis: "computed",
      inputs: { wavelength: 1550, distance: 1000, visibility: 23 },
      expect: { rayleigh: 1.7602351628e-4, aerosol: 0.04124491939, extinction: 0.04142094291, transmission: 95.94251817, attenuation: 0.1798888694 },
      tolerance: 1e-8,
    },
  ],
});
