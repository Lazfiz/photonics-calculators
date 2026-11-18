import { ingaasParametersSummary } from "../../physics/detectors/ingaas-parameters";
import { defineSchema } from "../types";

const VURGAFTMAN = "Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001). Band parameters for III–V compound semiconductors and their alloys. " +
  "J. Appl. Phys. 89, 5815–5875, doi:10.1063/1.1368156: E_g(x, T) = (1−x)·E_g,GaAs(T) + x·E_g,InAs(T) − 0.477·x(1−x), E_g(T) = E_g(0) − αT²/(T+β) " +
  "(GaAs 1.519 eV, 5.405e-4 eV/K, 204 K; InAs 0.417 eV, 2.76e-4 eV/K, 93 K); n_i = 6.3e11 cm⁻³ at x = 0.53, 300 K (Paul S., Roy J. B., Basu P. K. (1991). " +
  "J. Appl. Phys. 69, 827–829, doi:10.1063/1.348919) scaled with T^(3/2)·exp(−E_g/2k_BT); α = 2.4e4 cm⁻¹·eV^−½·√(E − E_g), a least-squares fit to Adachi S. (1989). " +
  "J. Appl. Phys. 66, 6030, doi:10.1063/1.343580 over 0.95–1.62 µm; QE = (1−R)(1−e^(−αd)); I_gen = q·n_i·d·A/τ_g, I_dark = I_gen·(1−e^(qV/2k_BT)) " +
  "(Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 2); i_n = √(2q·I_gen), NEP = i_n/ℛ, D* = √A/NEP (Dereniak E. L., Boreman G. D. (1996). Infrared Detectors and Systems. Wiley, ch. 5).";
const BEYOND = "1550 nm is beyond the cutoff wavelength, so the detector has no response there and NEP and D* are undefined.";

export default defineSchema({
  href: "/detectors/ingaas-parameters",
  inputs: [
    { key: "temperature", label: "Temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 200, max: 400 },
    { key: "indiumFraction", label: "Indium fraction x", unit: "", toSI: 1, siUnit: "", default: 0.53, min: 0, max: 1 },
    { key: "thickness", label: "Absorber thickness", unit: "µm", toSI: 1e-6, siUnit: "m", default: 3, min: 0.1, max: 20 },
    { key: "area", label: "Area", unit: "mm²", toSI: 1e-6, siUnit: "m²", default: 0.1, min: 0.001, max: 100 },
    { key: "biasVoltage", label: "Bias (reverse < 0)", unit: "V", toSI: 1, siUnit: "V", default: -1, min: -10, max: 0 },
    { key: "genLifetime", label: "Generation lifetime τ_g", unit: "µs", toSI: 1e-6, siUnit: "s", default: 100, min: 0.01, max: 1e4 },
    { key: "reflectance", label: "Front reflectance", unit: "%", toSI: 0.01, siUnit: "", default: 2, min: 0, max: 99 },
  ],
  outputs: [
    { key: "bandGap", label: "Band gap E_g", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "cutoff", label: "Cutoff wavelength λ_c", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "qe1300", label: "QE at 1300 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "qe1550", label: "QE at 1550 nm", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "responsivity1550", label: "Responsivity at 1550 nm", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "intrinsicDensity", label: "Intrinsic density n_i", unit: "cm⁻³", toSI: 1e6, siUnit: "m⁻³" },
    { key: "darkCurrent", label: "Dark current at the bias", unit: "A", toSI: 1, siUnit: "A" },
    { key: "generationCurrent", label: "Generation-limited dark current (reverse bias)", unit: "A", toSI: 1, siUnit: "A" },
    { key: "nep1550", label: "NEP at 1550 nm", unit: "W/√Hz", toSI: 1, siUnit: "W/√Hz" },
    { key: "dStar1550", label: "D* at 1550 nm", unit: "cm·Hz^½/W", toSI: 0.01, siUnit: "m·Hz^½/W" },
  ],
  compute({ temperature, indiumFraction, thickness, area, biasVoltage, genLifetime, reflectance }) {
    const r = ingaasParametersSummary({ T: temperature, x: indiumFraction, thickness, area, bias: biasVoltage, lifetime: genLifetime, reflectance });
    const noResponse = !(r.r1550 > 0);
    return {
      values: {
        bandGap: r.bandGap,
        cutoff: r.cutoff_nm * 1e-9,
        qe1300: r.qe1300,
        qe1550: r.qe1550,
        responsivity1550: r.r1550,
        intrinsicDensity: r.ni,
        darkCurrent: r.dark,
        generationCurrent: r.genCurrent,
        nep1550: r.nep1550,
        dStar1550: r.dStar1550 * 0.01,
      },
      warnings: noResponse ? [BEYOND] : [],
      reasons: noResponse ? { nep1550: BEYOND, dStar1550: BEYOND } : {},
    };
  },
  checks: [
    {
      // Defaults: In₀.₅₃Ga₀.₄₇As, 300 K, d = 3 µm, A = 0.1 mm² = 1e-7 m², V = −1 V, τ_g = 100 µs, R = 2 %.
      // E_g = 0.47·E_g,GaAs(300 K) + 0.53·E_g,InAs(300 K) − 0.477·0.53·0.47 = 0.737257 eV, λ_c = hc/E_g = 1681.70 nm; n_i = 6.3e17 m⁻³ (the 300 K, x = 0.53 reference).
      // α(1300 nm) = 2.4e6·√(0.953723 − 0.737257) = 1.1167e6 /m, QE = 0.98·(1 − e^(−α·3e-6)) = 0.945613; QE(1550) = 0.818336 (α = 2.4e6·√(0.799897−0.737257));
      // ℛ = 0.818336·q·1550e-9/(hc) = 1.023051 A/W; I_gen = q·6.3e17·3e-6·1e-7/1e-4 = 3.028114e-10 A, I_dark = I_gen·(1 − e^(−q/(2k_B·300))) = 3.028114e-10 A;
      // i_n = √(2q·I_gen) = 9.85e-15 A/√Hz, NEP = i_n/ℛ = 9.628510e-15 W/√Hz, D* = √(0.1e-2 cm²)/NEP = 3.284286e12 Jones.
      source: VURGAFTMAN,
      basis: "computed",
      inputs: {},
      expect: {
        bandGap: 0.7372566705016357, cutoff: 1681.6965297694812, qe1300: 94.56132151464599, qe1550: 81.83363740547913,
        responsivity1550: 1.0230508369728435, intrinsicDensity: 6.3e11, darkCurrent: 3.0281138261945953e-10, generationCurrent: 3.0281138382599996e-10,
        nep1550: 9.628509841532732e-15, dStar1550: 3284285639432.847,
      },
      tolerance: 1e-8,
    },
    {
      // Extended InGaAs: T = 280 K, x = 0.65, d = 5 µm, A = 0.5 mm² = 5e-7 m², V = −0.05 V, τ_g = 50 µs, R = 3 %.
      // E_g = 0.625832 eV, λ_c = 1981.11 nm; n_i = 6.3e17·(280/300)^1.5·exp(−(q/2k_B)(E_g(280)/280 − 0.737257/300)) = 2.064632e18 m⁻³;
      // QE(1300) = 0.97·(1 − e^(−α·5e-6)) = 0.968994, QE(1550) = 0.963507, ℛ(1550) = 1.204537 A/W; I_gen = q·n_i·5e-6·5e-7/5e-5 = 1.653952e-8 A,
      // I_dark = I_gen·(1 − e^(−q·0.05/(2k_B·280))) = 1.067081e-8 A; NEP = √(2q·I_gen)/ℛ = 6.043820e-14 W/√Hz, D* = √(0.005 cm²)/NEP = 1.169967e12 Jones.
      source: VURGAFTMAN,
      basis: "computed",
      inputs: { temperature: 280, indiumFraction: 0.65, thickness: 5, area: 0.5, biasVoltage: -0.05, genLifetime: 50, reflectance: 3 },
      expect: {
        bandGap: 0.6258316092991822, cutoff: 1981.111158192218, qe1300: 96.89941196827058, qe1550: 96.35068773983125,
        responsivity1550: 1.2045370933071056, intrinsicDensity: 2.0646317234984645e12, darkCurrent: 1.067081150605857e-8, generationCurrent: 1.653952352602194e-8,
        nep1550: 6.04381988583646e-14, dStar1550: 1169966667675.909,
      },
      tolerance: 1e-8,
    },
  ],
});
