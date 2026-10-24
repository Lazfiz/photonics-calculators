/**
 * Electromagnetic SERS enhancement of a small metal sphere in the quasistatic (electrostatic) limit. SI units: lengths
 * in m, permittivities relative. Model tier: textbook (quasistatic sphere, |E|⁴ approximation).
 *
 * A sphere of radius a and permittivity ε in a medium ε_m, in a uniform field E₀ along z, has the outside field
 *   E_r = E₀ cos θ (1 + 2g s),  E_θ = −E₀ sin θ (1 − g s),  g = (ε − ε_m)/(ε + 2ε_m),  s = (a/r)³
 * (C. F. Bohren, D. R. Huffman, Absorption and Scattering of Light by Small Particles, Wiley 1983, ch. 5,
 * doi:10.1002/9783527618156). The local intensity enhancement is |E/E₀|² = A cos²θ + B sin²θ with A = |1 + 2gs|² (pole)
 * and B = |1 − gs|² (equator). The SERS enhancement factor in the |E|⁴ approximation multiplies the enhancements at
 * the laser and the Raman (Stokes) wavelength (E. C. Le Ru, P. G. Etchegoin, Chem. Phys. Lett. 423, 63 (2006),
 * doi:10.1016/j.cplett.2006.03.042):
 *   EF(θ) = (A_L cos²θ + B_L sin²θ)(A_R cos²θ + B_R sin²θ), A_L A_R at the pole (along E₀), B_L B_R at the equator;
 *   EF_max = max over θ: a quadratic in u = cos²θ, so the larger end value or, when it is concave, its vertex in (0, 1).
 *            It is the pole near the resonance; off resonance (e.g. 320 nm, where |1 − g|² > |1 + 2g|²) the equator,
 *   ⟨EF⟩   = A_L A_R/5 + 8 B_L B_R/15 + 2(A_L B_R + B_L A_R)/15 (averaged over the sphere's surface, using
 *            ⟨cos⁴θ⟩ = 1/5, ⟨sin⁴θ⟩ = 8/15, ⟨cos²θ sin²θ⟩ = 2/15).
 * E. C. Le Ru et al., J. Phys. Chem. C 111, 13794 (2007), doi:10.1021/jp0687908, compare these definitions.
 * The resonance sits where Re ε = −2ε_m. The model has no size dependence beyond the decay s: retardation and radiation
 * damping, which red-shift and damp the resonance of spheres above about λ/10 in diameter, are not included, nor is the
 * extra surface damping of spheres below about 10 nm, nor chemical enhancement or particle gaps (hot spots).
 */
import { abs2, add, complex, div, scale, sub, type Complex } from "../complex";
import { silverIndex } from "../materials/silver";

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Relative permittivity ε = (n + iκ)² of silver (Yang et al. 2015 via ../materials/silver.ts); NaN below 0.27 µm. */
export function silverPermittivity(wavelength: number): Complex {
  const { n, k } = silverIndex(wavelength);
  return complex(n * n - k * k, 2 * n * k);
}

/** Quasistatic sphere factor g = (ε − ε_m)/(ε + 2ε_m). */
export function sphereFactor(eps: Complex, epsMedium: number): Complex {
  return div(sub(eps, complex(epsMedium)), add(eps, complex(2 * epsMedium)));
}

/**
 * Intensity enhancement |E/E₀|² at the pole (A, along the field) and the equator (B) at a distance d ≥ 0 from the
 * surface of a sphere of radius a. NaN for invalid inputs.
 */
export function sphereFieldEnhancement(eps: Complex, epsMedium: number, radius: number, distance: number): { pole: number; equator: number } {
  if (!positive(epsMedium) || !positive(radius) || !(Number.isFinite(distance) && distance >= 0)) return { pole: NaN, equator: NaN };
  const gs = scale(sphereFactor(eps, epsMedium), (radius / (radius + distance)) ** 3);
  return { pole: abs2(add(complex(1), scale(gs, 2))), equator: abs2(sub(complex(1), gs)) };
}

/**
 * |E|⁴ SERS enhancement factor at the pole, its maximum over the surface (max, at polar angle maxAngle in rad from the
 * field axis) and averaged over the surface (average); see the header.
 */
export function sersEnhancement(
  epsLaser: Complex, epsRaman: Complex, epsMedium: number, radius: number, distance: number,
): { pole: number; max: number; maxAngle: number; average: number } {
  const L = sphereFieldEnhancement(epsLaser, epsMedium, radius, distance);
  const R = sphereFieldEnhancement(epsRaman, epsMedium, radius, distance);
  // EF(u) = (B_L + ΔL u)(B_R + ΔR u), u = cos²θ ∈ [0, 1].
  const dL = L.pole - L.equator, dR = R.pole - R.equator;
  const ef = (u: number) => (L.equator + dL * u) * (R.equator + dR * u);
  const candidates = [0, 1];
  if (dL * dR < 0) {
    const vertex = -(dL * R.equator + dR * L.equator) / (2 * dL * dR);
    if (vertex > 0 && vertex < 1) candidates.push(vertex);
  }
  let uMax = 1;
  for (const u of candidates) if (ef(u) > ef(uMax)) uMax = u;
  return {
    pole: L.pole * R.pole,
    max: ef(uMax),
    maxAngle: Math.acos(Math.sqrt(uMax)),
    average: (L.pole * R.pole) / 5 + (8 * L.equator * R.equator) / 15 + (2 * (L.pole * R.equator + L.equator * R.pole)) / 15,
  };
}

/**
 * Wavelength (m) of the largest pole enhancement |1 + 2g|² of a silver sphere in a medium ε_m, scanned over [lo, hi]
 * in 0.5 nm steps (so to ±0.25 nm). NaN for invalid inputs.
 */
export function silverSphereResonance(epsMedium: number, lo = 300e-9, hi = 1000e-9): number {
  if (!positive(epsMedium) || !positive(lo) || !(hi > lo)) return NaN;
  const steps = Math.min(20000, Math.ceil((hi - lo) / 0.5e-9));
  let best = NaN;
  let bestValue = -Infinity;
  for (let i = 0; i <= steps; i++) {
    const lambda = lo + ((hi - lo) * i) / steps;
    const value = abs2(add(complex(1), scale(sphereFactor(silverPermittivity(lambda), epsMedium), 2)));
    if (value > bestValue) {
      bestValue = value;
      best = lambda;
    }
  }
  return best;
}
