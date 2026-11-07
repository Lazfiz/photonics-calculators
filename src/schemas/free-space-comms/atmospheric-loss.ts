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
  href: "/free-space-comms/atmospheric-loss",
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2500 },
    { key: "visibility", label: "Meteorological visibility", unit: "km", toSI: 1e3, siUnit: "m", default: 23, min: 0.01, max: 300 },
    { key: "linkLength", label: "Link length", unit: "km", toSI: 1e3, siUnit: "m", default: 1, min: 0.001, max: 1000 },
  ],
  outputs: [
    { key: "attenuation", label: "Total attenuation α", unit: "dB/km", toSI: 1e-3, siUnit: "dB/m" },
    { key: "rayleighAttenuation", label: "Rayleigh (molecular) attenuation", unit: "dB/km", toSI: 1e-3, siUnit: "dB/m" },
    { key: "aerosolAttenuation", label: "Aerosol attenuation (Kim)", unit: "dB/km", toSI: 1e-3, siUnit: "dB/m" },
    { key: "pathLoss", label: "Path loss", unit: "dB", toSI: 1, siUnit: "dB" },
    { key: "transmittance", label: "Transmittance", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "kimExponent", label: "Kim exponent q", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ wavelength, visibility, linkLength }) {
    // Same glue as the page: extinction in 1/m × 1e3 × 10 log10 e gives dB/km; the API returns dB/m.
    const rayleighDbPerKm = rayleighExtinction(wavelength) * 1e3 * DB_PER_E_FOLD;
    const aerosolDbPerKm = aerosolExtinction(wavelength, visibility) * 1e3 * DB_PER_E_FOLD;
    const totalDbPerKm = rayleighDbPerKm + aerosolDbPerKm;
    const totalLoss = totalDbPerKm * (linkLength / 1e3);
    const warnings: string[] = [];
    const nm = Math.round(wavelength * 1e15) / 1e6; // rounds away the float error of nm → m → nm
    if (nm > 1600) {
      warnings.push("Kim's q law is fitted up to 1.55 µm and the Peck–Reeder index to 1.69 µm: extrapolation.");
    }
    if ((nm >= 1350 && nm <= 1450) || (nm >= 1800 && nm <= 1950)) {
      warnings.push("This wavelength lies in a water absorption band: molecular water absorption is not modelled; the real loss here is far higher.");
    }
    return {
      values: {
        attenuation: totalDbPerKm / 1e3,
        rayleighAttenuation: rayleighDbPerKm / 1e3,
        aerosolAttenuation: aerosolDbPerKm / 1e3,
        pathLoss: totalLoss,
        transmittance: 10 ** (-totalLoss / 10),
        kimExponent: kimExponent(visibility),
      },
      warnings,
    };
  },
  checks: [
    {
      // At 550 nm the visibility fixes the total extinction: β = −ln(0.02)/V, so α = −10 log₁₀(0.02)/V = 16.98970 dB/km for V = 1 km;
      // over 1 km the transmittance is 0.02 = 2 % (Koschmieder's 2 % contrast threshold).
      source: KIM,
      basis: "computed",
      inputs: { wavelength: 550, visibility: 1, linkLength: 1 },
      expect: { attenuation: 16.9897000434, pathLoss: 16.9897000434, transmittance: 2, kimExponent: 0.5 },
      tolerance: 1e-8,
    },
    {
      // V = 23 km, λ = 1550 nm, 1 km: β_R(550 nm) = 1.147810e-5 m⁻¹, aerosol (3.912023/23 − 0.01147810)(1550/550)^(−1.3) km⁻¹ ×
      // 4.342945 = 0.1791244 dB/km; Rayleigh at 1550 nm 0.000764460 dB/km; total 0.1798889 dB/km, T = 95.94252 %.
      source: KIM + " " + BUCHOLTZ,
      basis: "computed",
      inputs: { wavelength: 1550, visibility: 23, linkLength: 1 },
      expect: {
        rayleighAttenuation: 0.000764460418, aerosolAttenuation: 0.179124409, attenuation: 0.1798888694,
        transmittance: 95.94251817, kimExponent: 1.3,
      },
      tolerance: 1e-8,
    },
    {
      // Fog V = 0.5 km (q = 0, no wavelength dependence), λ = 785 nm, 2 km: aerosol 33.929551 dB/km, Rayleigh 0.011780 dB/km,
      // total 33.941332 dB/km, loss 67.882664 dB.
      source: KIM + " " + BUCHOLTZ,
      basis: "computed",
      inputs: { wavelength: 785, visibility: 0.5, linkLength: 2 },
      expect: { aerosolAttenuation: 33.92955133, attenuation: 33.94133178, pathLoss: 67.88266356 },
      tolerance: 1e-8,
    },
  ],
});
