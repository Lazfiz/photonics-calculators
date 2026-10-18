/**
 * Paraxial (Gaussian) optics of thin lenses: conjugates, optical power, two-element systems, ray-transfer matrices
 * and a two-element eye. SI units in and out (m, dioptres = 1/m). Model tier: textbook (paraxial, thin elements).
 *
 * Sign convention "real is positive": the object distance o > 0 for a real object in front of the lens, the image
 * distance i > 0 for a real image behind it, f > 0 for a converging lens. Gaussian imaging equation and
 * transverse magnification (J. E. Greivenkamp, Field Guide to Geometrical Optics, SPIE 2004,
 * doi:10.1117/3.547461, "Gaussian imaging equation" and "Newtonian equations"; written there with directed
 * distances, z = −o and z′ = i):
 *   1/o + 1/i = 1/f,   M = −i/o,   Newtonian x·x′ = f² with x = o − f, x′ = i − f.
 * Two thin elements of powers φ₁, φ₂ separated by t in a medium of index n (Gullstrand's equation, Greivenkamp
 * "Two-lens systems"): φ = φ₁ + φ₂ − (t/n) φ₁ φ₂. The system is afocal when φ = 0, i.e. t = f₁ + f₂ in air, with
 * angular magnification −f₁/f₂ (Greivenkamp "Afocal systems").
 */

const finite = Number.isFinite;

/** Thin-lens image distance i = f·o/(o − f) and magnification M = −i/o (real is positive); NaN for o = f or o = 0. */
export function thinLensImage(f: number, o: number): { i: number; M: number } {
  if (!(finite(f) && finite(o)) || f === 0 || o === 0 || o === f) return { i: NaN, M: NaN };
  const i = (f * o) / (o - f);
  return { i, M: -i / o };
}

/** Object and image distances for a signed magnification M = −i/o: o = f(1 − 1/M), i = f(1 − M). NaN for M = 0. */
export function conjugatesFromMag(f: number, M: number): { o: number; i: number } {
  if (!(finite(f) && finite(M)) || f === 0 || M === 0) return { o: NaN, i: NaN };
  return { o: f * (1 - 1 / M), i: f * (1 - M) };
}

/** Optical power φ = n/f (dioptres for f in m), n the index of the image-side medium. NaN for f = 0. */
export function opticalPower(f: number, n = 1): number {
  return finite(f) && f !== 0 && n > 0 ? n / f : NaN;
}

/** Gullstrand's equation: power of two thin elements φ₁, φ₂ separated by t in index n, φ₁ + φ₂ − (t/n)φ₁φ₂. */
export function twoElementPower(phi1: number, phi2: number, t: number, n = 1): number {
  return n > 0 ? phi1 + phi2 - (t / n) * phi1 * phi2 : NaN;
}

export interface Abcd { A: number; B: number; C: number; D: number }

/**
 * Ray-transfer matrix (y, θ) from just before lens 1 to just after lens 2, for thin lenses f₁ and f₂ a distance t
 * apart in air: L(f₂)·T(t)·L(f₁) with L(f) = [[1, 0], [−1/f, 1]], T(t) = [[1, t], [0, 1]].
 * A = 1 − t/f₁, B = t, C = −1/f₁ − 1/f₂ + t/(f₁f₂), D = 1 − t/f₂; AD − BC = 1.
 */
export function twoLensABCD(f1: number, f2: number, t: number): Abcd {
  if (!(finite(f1) && finite(f2) && finite(t)) || f1 === 0 || f2 === 0) return { A: NaN, B: NaN, C: NaN, D: NaN };
  return { A: 1 - t / f1, B: t, C: -1 / f1 - 1 / f2 + t / (f1 * f2), D: 1 - t / f2 };
}

/**
 * Cardinal distances of a system matrix in air: effective focal length −1/C, back focal distance −A/C (from the
 * last element to the rear focal point) and front focal distance −D/C (from the front focal point to the first
 * element, positive when it lies in front). All are ±∞ for an afocal system (C = 0).
 */
export function focalDistances(m: Abcd): { efl: number; bfd: number; ffd: number } {
  return { efl: -1 / m.C, bfd: -m.A / m.C, ffd: -m.D / m.C };
}

/**
 * Ocular refraction K (dioptres, at the cornea) of a two-thin-element eye: cornea φ₁ at the vertex, crystalline
 * lens φ₂ a distance t behind it, and the retina at axial length L from the vertex, in a medium of index n
 * (aqueous = vitreous). K is the vergence that light from the far point must have at the cornea to focus on the
 * retina, found by tracing the vergence back from the retina:
 *   V₃ = n/(L − t), V₂ = V₃ − φ₂, V₁ = V₂/(1 + (t/n)V₂), K = V₁ − φ₁.
 * K < 0 is myopia (a diverging far-point beam), K > 0 hyperopia; a contact lens of power K corrects it
 * (D. A. Atchison, G. Smith, Optics of the Human Eye, Butterworth-Heinemann 2000, ch. 9 and appendix 1).
 * With φ₂ = 0 it reduces to the reduced eye, K = n/L − φ₁. NaN unless 0 ≤ t < L.
 */
export function ocularRefraction(phi1: number, phi2: number, t: number, n: number, L: number): number {
  if (!(finite(phi1) && finite(phi2) && n > 0 && t >= 0 && L > t)) return NaN;
  const V2 = n / (L - t) - phi2;
  const denom = 1 + (t / n) * V2;
  return denom > 0 ? V2 / denom - phi1 : NaN;
}

/**
 * Axial length at which the same eye is emmetropic (K = 0): its rear focal point, from the vertex,
 * t + n(1 − (t/n)φ₁)/φ with φ from Gullstrand's equation. NaN when the eye has no real rear focus.
 */
export function emmetropicAxialLength(phi1: number, phi2: number, t: number, n: number): number {
  const reduced = 1 - (t / n) * phi1;
  const phi = twoElementPower(phi1, phi2, t, n);
  const L = t + (n * reduced) / phi;
  return t >= 0 && reduced > 0 && phi > 0 && finite(L) ? L : NaN;
}

/** Spectacle lens power that corrects an ocular refraction K from a vertex distance d (m): K/(1 + d·K). */
export function spectacleCorrection(K: number, d: number): number {
  const denom = 1 + d * K;
  return finite(K) && d >= 0 && denom > 0 ? K / denom : NaN;
}
