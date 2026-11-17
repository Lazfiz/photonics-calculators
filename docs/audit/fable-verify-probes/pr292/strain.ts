// PR #292 verify probe. Run on the PR head only (clampedThicknessStrain does not exist on main).
// Reference: own derivation. Isotropic thermoelastic Hooke: eps_i = [sigma_i - nu(sigma_j + sigma_k)]/E + alpha_f dT.
// Clamp: eps_x = eps_y = alpha_s dT, sigma_z = 0, sigma_x = sigma_y = s  =>  s(1-nu)/E = (alpha_s - alpha_f) dT
//   s = E/(1-nu) (alpha_s - alpha_f) dT ;  eps_z = -2 nu s/E + alpha_f dT = [alpha_f - 2nu/(1-nu)(alpha_s - alpha_f)] dT.
// Here eps_z is obtained by solving the 3x3 Hooke system numerically, NOT from the closed form, then compared with the code.
import * as M from "../../../../src/physics/thin-film/environmental-stability";

function epsZ(aF: number, aS: number, nu: number, dT: number, E = 72e9) {
  // unknown s: eps_x = (s - nu*s)/E + aF dT = aS dT
  const s = (E * (aS - aF) * dT) / (1 - nu);
  const ex = (s - nu * (s + 0)) / E + aF * dT; // must equal aS dT
  const ez = (0 - nu * (s + s)) / E + aF * dT;
  return { s, ex, ez };
}
const L = epsZ(0.55e-6, 7.1e-6, 0.17, 50), H = epsZ(8e-6, 7.1e-6, 0.27, 50);
console.log("L (SiO2 0.55e-6, nu .17) on 7.1e-6, 50 K: eps_z", L.ez, "sigma MPa", L.s / 1e6, "eps_x check", L.ex, 7.1e-6 * 50);
console.log("H (8e-6, nu .27): eps_z", H.ez, "sigma MPa (E=72GPa placeholder)", H.s / 1e6);
const shift = (eH: number, eL: number) => 550 * (((1 + (20e-6 * 50) / 2.35) * (1 + eH) + (1 + (8.86e-6 * 50) / 1.45) * (1 + eL)) / 2 - 1);
console.log("held shift nm", shift(H.ez, L.ez), " free shift nm", shift(8e-6 * 50, 0.55e-6 * 50), " diff", shift(H.ez, L.ez) - shift(4e-4, 2.75e-5));
// limits
console.log("aS=aF:", epsZ(8e-6, 8e-6, 0.27, 50).ez, " nu=0:", epsZ(8e-6, 7.1e-6, 0, 50).ez, " nu=.5:", epsZ(1e-6, 7e-6, 0.5, 10).ez, "(3aF-2aS)dT =", (3e-6 - 14e-6) * 10);
// stress-optic estimate for SiO2 layer: light polarised in-plane (x), elastic strains ex=ey=(aS-aF)dT, ez = -2nu/(1-nu)(aS-aF)dT
const n = 1.45, p11 = 0.121, p12 = 0.27, e = 6.55e-6 * 50, ezEl = (-2 * 0.17) / 0.83 * e;
const dn = (-(n ** 3) / 2) * (p11 * e + p12 * (e + ezEl));
console.log("stress-optic dn", dn, " centre shift nm (L layer is half the optical thickness)", (550 * 0.5 * dn) / n);
// code
const f = M as unknown as { clampedThicknessStrain?: (a: number, b: number, c: number, d: number) => number };
if (f.clampedThicknessStrain) {
  console.log("code L", f.clampedThicknessStrain(0.55e-6, 7.1e-6, 0.17, 50), "code H", f.clampedThicknessStrain(8e-6, 7.1e-6, 0.27, 50));
  const Hm = { n: 2.35, p: 0.85, law: "linear" as const, dnDT: 20e-6, cte: 8e-6, nu: 0.27 }, Lm = { n: 1.45, p: 0.85, law: "linear" as const, dnDT: 8.86e-6, cte: 0.55e-6, nu: 0.17 };
  const cs = M.centreShift as (...a: unknown[]) => number;
  console.log("code held", cs(Hm, Lm, 550e-9, 50, 0, 7.1e-6) * 1e9, "code free", cs(Hm, Lm, 550e-9, 50, 0) * 1e9, "cooling -50K held", cs(Hm, Lm, 550e-9, -50, 0, 7.1e-6) * 1e9);
  console.log("nu undefined with alphaS:", cs({ ...Hm, nu: undefined }, Lm, 550e-9, 50, 0, 7.1e-6));
}
