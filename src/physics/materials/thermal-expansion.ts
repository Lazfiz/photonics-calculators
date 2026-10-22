/**
 * Linear thermal expansion with a constant coefficient: ΔL = α L ΔT, strain ε = α ΔT. SI units: α in 1/K, lengths in m.
 * Model tier: textbook. α itself depends on temperature (Si: 2.6e-6/K at 300 K, rising to about 4.6e-6/K at 1500 K;
 * Y. Okada, Y. Tokumaru, J. Appl. Phys. 56, 314 (1984), doi:10.1063/1.333965), so a constant α holds over tens of kelvin;
 * for wide spans integrate α(T) dT instead.
 */

/** Length change ΔL = α L ΔT, m. */
export const thermalExpansion = (alpha: number, L: number, dT: number) => alpha * L * dT;

/** Length change in optical waves at wavelength λ (m). NaN for λ ≤ 0. */
export const expansionWaves = (dL: number, lambda: number) => (lambda > 0 ? dL / lambda : NaN);
