import {
  pseudoOpticalConstants, pseudoSubstrateReflectance, transparentFilmThickness,
} from "../../physics/thin-film/ellipsometry";
import { defineSchema } from "../types";

const AZZAM_BASHARA = "Azzam R. M. A. & Bashara N. M. (1977). Ellipsometry and Polarized Light, North-Holland, ch. 4: " +
  "ρ = r_p/r_s = tan Ψ e^(iΔ) for the ambient-substrate system (⟨ε⟩ = sin²θ [1 + tan²θ ((1 − ρ)/(1 + ρ))²], exact for a bare " +
  "substrate; Aspnes D. E. (1985) in Palik, Handbook of Optical Constants of Solids, ch. 5) and the ambient-film-substrate " +
  "system (thickness from the quadratic in X = e^(−i2β), period D_φ = λ/(2√(n₁² − sin²θ))). Equation numbers not quoted.";

const RAD = Math.PI / 180;

export default defineSchema({
  href: "/thin-film/ellipsometry-measurement",
  inputs: [
    { key: "psiDeg", label: "Ψ", unit: "°", toSI: RAD, siUnit: "rad", default: 10.573, min: 0, max: 90 },
    { key: "deltaDeg", label: "Δ", unit: "°", toSI: RAD, siUnit: "rad", default: 179.23, min: 0, max: 360 },
    { key: "aoiDeg", label: "Angle of incidence", unit: "°", toSI: RAD, siUnit: "rad", default: 70, min: 0, max: 90 },
    { key: "lambdaNm", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 632.8, min: 1, max: 100000 },
    { key: "filmN", label: "Film index n₁ (lossless)", unit: "", toSI: 1, siUnit: "", default: 1.457, min: 1, max: 10 },
    { key: "subN", label: "Substrate n", unit: "", toSI: 1, siUnit: "", default: 3.882, min: 0, max: 100 },
    { key: "subK", label: "Substrate k (N = n − ik)", unit: "", toSI: 1, siUnit: "", default: 0.019, min: 0, max: 100 },
  ],
  outputs: [
    { key: "pseudoN", label: "Pseudo-refractive index ⟨n⟩", unit: "", toSI: 1, siUnit: "" },
    { key: "pseudoK", label: "Pseudo-extinction coefficient ⟨k⟩", unit: "", toSI: 1, siUnit: "" },
    { key: "eps1", label: "⟨ε₁⟩", unit: "", toSI: 1, siUnit: "" },
    { key: "eps2", label: "⟨ε₂⟩", unit: "", toSI: 1, siUnit: "" },
    { key: "Rp", label: "R_p of the pseudo-substrate at θ", unit: "", toSI: 1, siUnit: "" },
    { key: "Rs", label: "R_s of the pseudo-substrate at θ", unit: "", toSI: 1, siUnit: "" },
    { key: "Ravg", label: "R_avg of the pseudo-substrate at θ", unit: "", toSI: 1, siUnit: "" },
    { key: "thickness", label: "Film thickness d (modulo the period)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "period", label: "Thickness period D_φ", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "absX", label: "|X| (1 for a consistent fit)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ psiDeg, deltaDeg, aoiDeg, lambdaNm, filmN, subN, subK }) {
    const pseudo = pseudoOpticalConstants(psiDeg, deltaDeg, aoiDeg);
    const refl = pseudoSubstrateReflectance(pseudo, aoiDeg);
    const film = transparentFilmThickness(psiDeg, deltaDeg, aoiDeg, lambdaNm, filmN, { n: subN, k: subK });
    const sinTheta = Math.sin(aoiDeg);
    const errors = [
      !(aoiDeg > 0 && aoiDeg < Math.PI / 2) && "the angle of incidence must lie between 0° and 90°",
      !(psiDeg < Math.PI / 2) && "Ψ must be below 90°",
      !(filmN > sinTheta) && `the film index must exceed sin θ = ${sinTheta.toFixed(3)} (else the film is evanescent)`,
      !(lambdaNm > 0) && "the wavelength must be positive",
      !(subN + subK > 0) && "the substrate index can't be zero",
    ].filter((e): e is string => typeof e === "string");
    const warnings: string[] = [];
    if (!Number.isFinite(pseudo.n)) warnings.push("No pseudo-optical constants: Ψ must be in [0°, 90°), the angle between 0° and 90°, and ρ ≠ −1.");
    let thickness = film.thickness, period = film.period, absX = film.absX;
    if (errors.length > 0) {
      warnings.push(`No thickness: ${errors.join("; ")}.`);
      thickness = NaN; period = NaN; absX = NaN;
    } else if (Number.isFinite(film.period) && !Number.isFinite(film.thickness)) {
      warnings.push("No thickness: with this film index the film doesn't change Ψ and Δ (it matches the ambient or the substrate).");
    }
    if (Number.isFinite(absX) && Math.abs(absX - 1) > 0.02) {
      warnings.push(`|X| = ${absX.toFixed(4)} is not 1: no transparent film of index ${filmN} on this substrate gives this Ψ, Δ; the thickness is only the phase of X.`);
    }
    if (Number.isFinite(thickness) && thickness <= -0.005e-9) {
      warnings.push("A slightly negative thickness: a bare substrate within the measurement error.");
    }
    return {
      values: {
        pseudoN: pseudo.n, pseudoK: pseudo.k, eps1: pseudo.eps1, eps2: pseudo.eps2,
        Rp: refl.Rp, Rs: refl.Rs, Ravg: refl.Ravg, thickness, period, absX,
      },
      warnings,
    };
  },
  checks: [
    {
      // Bare Si, N = 3.882 − 0.019i, θ = 70°: Fresnel r_p, r_s worked independently in complex arithmetic give
      // Ψ = 10.572671065392°, Δ = 179.229814132621° (12 digits), R_s = 0.6947442789115, R_p = 0.0242039856563.
      // The pseudo-substrate inversion of a bare substrate is exact, so ⟨N⟩ = N: ⟨n⟩ = 3.882, ⟨k⟩ = 0.019,
      // ⟨ε₁⟩ = n² − k² = 15.069924 − 0.000361 = 15.069563, ⟨ε₂⟩ = 2nk = 0.147516.
      source: AZZAM_BASHARA,
      basis: "computed",
      inputs: { psiDeg: 10.572671065392, deltaDeg: 179.229814132621, aoiDeg: 70 },
      expect: { pseudoN: 3.882, pseudoK: 0.019, eps1: 15.069563, eps2: 0.147516, Rs: 0.6947442789115, Rp: 0.0242039856563 },
      tolerance: 1e-8,
    },
    {
      // 100 nm SiO₂ (n₁ = 1.457) on Si (3.882 − 0.019i) at 632.8 nm, 70°: the ambient-film-substrate formula worked
      // independently gives Ψ = 41.055024424984°, Δ = 79.787286675117°; the inversion returns d = 100 nm, |X| = 1.
      // D_φ = 632.8/(2√(1.457² − sin²70°)) = 632.8/(2 · 1.113475) = 284.1554 nm.
      source: AZZAM_BASHARA,
      basis: "computed",
      inputs: { psiDeg: 41.055024424984, deltaDeg: 79.787286675117, aoiDeg: 70 },
      expect: { thickness: 100, period: 284.15543601881497, absX: 1 },
      tolerance: 1e-8,
    },
  ],
});
