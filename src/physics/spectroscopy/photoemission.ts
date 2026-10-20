/**
 * Photoelectron spectroscopy (XPS/UPS): photoelectron kinetic energy, inelastic mean free path from the TPP-2M
 * predictive equation and the sampling depth. Energies in eV (the spectroscopic unit), lengths in m.
 * Model tier: textbook.
 *
 * For a conducting sample in electrical contact with the spectrometer the Fermi levels align, so with E_B referred to
 * the Fermi level the measured kinetic energy is E_k = hν − E_B − φ_sp, φ_sp being the spectrometer's work function,
 * not the sample's (Hüfner, Photoelectron Spectroscopy, 3rd ed., Springer 2003, ch. 1). In UPS the sample work
 * function follows from the spectrum width W (secondary-electron cutoff to Fermi edge): φ = hν − W.
 *
 * TPP-2M (Tanuma, Powell & Penn, Surf. Interface Anal. 21, 165 (1994), doi 10.1002/sia.740210302; as given in NIST
 * SRD 71 user's guide, eqs. A.1–A.6), λ in Å for E in eV:
 *   λ = E / {E_p² [β ln(γE) − C/E + D/E²]},  E_p = 28.8 √(N_v ρ/M),
 *   β = −0.10 + 0.944/√(E_p² + E_g²) + 0.069 ρ^0.1,  γ = 0.191 ρ^−0.5,  C = 1.97 − 0.91U,  D = 53.4 − 20.8U,
 *   U = N_v ρ/M = E_p²/829.4,
 * with ρ in g/cm³, N_v valence electrons per atom or molecule, M the atomic or molecular weight, E_g the band gap
 * (eV), and E the electron energy above the Fermi level (hν − E_B, not the vacuum kinetic energy). Fitted for
 * 50–2000 eV; RMS deviation from optical-data IMFPs ≈ 11 % (Tanuma et al. 2003). Below 50 eV the fit loses its
 * physical form (the D/E² term blows up), so it returns NaN there. The signal from
 * depths beyond z falls as exp(−z/(λ cos θ)) (θ from the surface normal), so 95 % comes from within 3λ cos θ; the
 * effective attenuation length, which includes elastic scattering, is typically 10–30 % shorter than λ.
 */

export interface Tpp2mMaterial {
  /** Density in g/cm³. */
  rho: number;
  /** Valence electrons per atom or molecule. */
  Nv: number;
  /** Atomic or molecular weight in g/mol. */
  M: number;
  /** Band gap in eV (0 for metals). */
  Eg: number;
}

/**
 * Elements from NIST SRD 71 (N_v: Table A.1, ρ: Table A.3); Si₃N₄ as in its Appendix B example (M 140.28, ρ 3.44,
 * N_v = 3·4 + 4·5, E_g 5.25 eV reproduces its table); E_g of Si is the room-temperature gap.
 */
export const TPP2M_MATERIALS: Record<string, Tpp2mMaterial & { label: string }> = {
  au: { label: "Gold", rho: 19.3, Nv: 11, M: 196.967, Eg: 0 },
  ag: { label: "Silver", rho: 10.5, Nv: 11, M: 107.868, Eg: 0 },
  cu: { label: "Copper", rho: 8.96, Nv: 11, M: 63.546, Eg: 0 },
  al: { label: "Aluminium", rho: 2.7, Nv: 3, M: 26.982, Eg: 0 },
  si: { label: "Silicon", rho: 2.329, Nv: 4, M: 28.086, Eg: 1.12 },
  c: { label: "Graphite", rho: 2.2, Nv: 4, M: 12.011, Eg: 0 },
  si3n4: { label: "Silicon nitride", rho: 3.44, Nv: 32, M: 140.283, Eg: 5.25 },
};

/** E_k = hν − E_B − φ_sp in eV; ≤ 0 means the level cannot be ionised by this photon. */
export function kineticEnergy(photonEnergy: number, bindingEnergy: number, spectrometerWorkFunction: number): number {
  return photonEnergy - bindingEnergy - spectrometerWorkFunction;
}

/** TPP-2M inelastic mean free path in m for energy E (eV) above the Fermi level. NaN below 50 eV or for a bad material. */
export function imfpTpp2m(E: number, m: Tpp2mMaterial): number {
  if (!(E >= 50 && m.rho > 0 && m.Nv > 0 && m.M > 0 && m.Eg >= 0)) return NaN;
  const U = (m.Nv * m.rho) / m.M;
  const Ep2 = 829.4 * U;
  const beta = -0.1 + 0.944 / Math.sqrt(Ep2 + m.Eg * m.Eg) + 0.069 * m.rho ** 0.1;
  const gamma = 0.191 / Math.sqrt(m.rho);
  const C = 1.97 - 0.91 * U, D = 53.4 - 20.8 * U;
  const denom = Ep2 * (beta * Math.log(gamma * E) - C / E + D / (E * E));
  return denom > 0 ? (E / denom) * 1e-10 : NaN;
}

/** Depth from which a fraction F (0–1) of the signal comes: −λ cos θ ln(1 − F); θ in rad from the normal. */
export function samplingDepth(lambda: number, theta: number, fraction = 0.95): number {
  if (!(lambda > 0 && fraction > 0 && fraction < 1 && Math.abs(theta) < Math.PI / 2)) return NaN;
  return -lambda * Math.cos(theta) * Math.log1p(-fraction);
}
