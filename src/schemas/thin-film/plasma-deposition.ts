import { TORR } from "../../physics/constants";
import { TE_FIT_MAX, TE_FIT_MIN, TE_MAX, TE_MIN, argonDischarge, lowPressureRegime } from "../../physics/thin-film/plasma-global-model";
import { defineSchema } from "../types";

const LIEBERMAN = "Lieberman M. A., Lichtenberg A. J. (2005). Principles of Plasma Discharges and Materials Processing, 2nd ed. " +
  "Wiley, doi:10.1002/0471724254: Table 3.3 (argon rate constants), eqs. (5.3.16)–(5.3.17) (h_l, h_R), §10.2 eqs. (10.2.9)–(10.2.15) " +
  "(particle and power balance, E_T = E_c + 2T_e + E_i) and Example 1 (p. 335: R = 15 cm, l = 30 cm, 1 mTorr, 800 W).";

export default defineSchema({
  href: "/thin-film/plasma-deposition",
  inputs: [
    { key: "power", label: "Power absorbed by the plasma", unit: "W", toSI: 1, siUnit: "W", default: 500, min: 0, max: 1000000 },
    { key: "pressure", label: "Argon pressure", unit: "mTorr", toSI: 1e-3 * TORR, siUnit: "Pa", default: 5, min: 0.1, max: 1000 },
    { key: "radius", label: "Chamber radius R", unit: "cm", toSI: 1e-2, siUnit: "m", default: 15, min: 0.5, max: 500 },
    { key: "length", label: "Chamber length l (electrode gap)", unit: "cm", toSI: 1e-2, siUnit: "m", default: 30, min: 0.5, max: 500 },
    { key: "gasTemp", label: "Gas temperature", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 1, max: 5000 },
  ],
  outputs: [
    { key: "Te", label: "Electron temperature Tₑ", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "n0", label: "Centre plasma density n₀", unit: "m⁻³", toSI: 1, siUnit: "m⁻³" },
    { key: "ionFluxAxial", label: "Ion flux at the electrode h_l n₀ u_B", unit: "m⁻² s⁻¹", toSI: 1, siUnit: "m⁻² s⁻¹" },
    { key: "Ei", label: "Ion energy at a floating substrate", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "ET", label: "Energy lost per ion lost E_T", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "Ec", label: "Collisional energy per pair E_c", unit: "eV", toSI: 1, siUnit: "eV" },
    { key: "debye", label: "Debye length", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "uB", label: "Bohm speed u_B", unit: "km/s", toSI: 1e3, siUnit: "m/s" },
    { key: "lambdaI", label: "Ion mean free path λᵢ", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "ng", label: "Gas density n_g", unit: "m⁻³", toSI: 1, siUnit: "m⁻³" },
    { key: "hl", label: "Axial edge-to-centre ratio h_l", unit: "", toSI: 1, siUnit: "" },
    { key: "hR", label: "Radial edge-to-centre ratio h_R", unit: "", toSI: 1, siUnit: "" },
    { key: "dEff", label: "Effective size d_eff", unit: "cm", toSI: 1e-2, siUnit: "m" },
    { key: "Da", label: "Ambipolar diffusion coefficient D_a", unit: "m²/s", toSI: 1, siUnit: "m²/s" },
  ],
  compute({ power, pressure, radius, length, gasTemp }) {
    const d = argonDischarge(power, radius, length, pressure, gasTemp);
    const warnings: string[] = ["Argon carrier gas only; floating wall; P_abs is the power absorbed by the electrons, not the generator power."];
    if (!Number.isFinite(d.Te)) {
      warnings.push(`At this pressure and chamber size particle balance needs Tₑ outside ${TE_MIN}–${TE_MAX} eV, outside this model: no result.`);
    } else {
      if (d.Te <= TE_FIT_MIN || d.Te > TE_FIT_MAX) {
        warnings.push(`Tₑ lies outside the ${TE_FIT_MIN}–${TE_FIT_MAX} eV range of the argon rate-constant fits: extrapolated.`);
      }
      if (!lowPressureRegime(d, radius, length, gasTemp)) {
        warnings.push("Collisional regime: the diffusion term sets h_l and h_R; the ion energy assumes a collisionless sheath and is an upper bound.");
      }
    }
    return {
      values: {
        Te: d.Te, n0: d.n0, ionFluxAxial: d.ionFluxAxial, Ei: d.Ei, ET: d.ET, Ec: d.Ec, debye: d.debye, uB: d.uB,
        lambdaI: d.lambdaI, ng: d.ng, hl: d.hl, hR: d.hR, dEff: d.dEff, Da: d.Da,
      },
      warnings,
    };
  },
  checks: [
    {
      // 800 W, R = 15 cm, l = 30 cm, 1 mTorr, 293 K (L&L Example 1, p. 335: T_e ≈ 3.8 V, n0 ≈ 1.9e17 m⁻³). Expected values come from an
      // independent script (Tₑ scanned on a 1e-5 eV grid, constants typed in; see tests/thin-film-plasma-global-model.test.ts), given to 6–7 digits.
      source: LIEBERMAN,
      basis: "computed",
      inputs: { power: 800, pressure: 1, radius: 15, length: 30, gasTemp: 293 },
      expect: { Te: 3.78101, n0: 1.891757e17, ET: 74.1823, ng: 3.295734e19, hl: 0.3027996, hR: 0.2650229 },
      tolerance: 1e-4,
    },
    {
      // Page defaults 500 W, 5 mTorr, R = 15 cm, l = 30 cm, 300 K: T_e = 2.5528 eV from the same independent scan.
      source: LIEBERMAN,
      basis: "computed",
      inputs: { power: 500, pressure: 5, radius: 15, length: 30, gasTemp: 300 },
      expect: { Te: 2.5528 },
      tolerance: 5e-5,
    },
  ],
});
