/**
 * Multi-exponential fluorescence decay I(t) = Σ αᵢ exp(−t/τᵢ) and its average lifetimes. SI units: times in s.
 * Model tier: exact (definitions).
 *
 * The fractional intensity fᵢ = αᵢτᵢ / Σ αⱼτⱼ is component i's share of the time-integrated (steady-state)
 * emission. Two averages are in use:
 * - intensity-weighted ⟨τ⟩_int = Σ fᵢτᵢ = Σ αᵢτᵢ² / Σ αᵢτᵢ, the mean arrival time of the emitted photons;
 * - amplitude-weighted ⟨τ⟩_amp = Σ αᵢτᵢ / Σ αᵢ, the area under the normalised decay, which is proportional to the
 *   quantum yield when all components share one radiative rate (Φ = ⟨τ⟩_amp / τ_rad).
 * J. R. Lakowicz, Principles of Fluorescence Spectroscopy, 3rd ed. (Springer, 2006), ch. 4 (multi-exponential
 * decays); A. Sillen, Y. Engelborghs, "The correct use of 'average' fluorescence parameters", Photochem. Photobiol.
 * 67, 475 (1998).
 */

export interface DecayComponent {
  /** Pre-exponential amplitude αᵢ ≥ 0 (any scale). */
  amplitude: number;
  /** Lifetime τᵢ, s, > 0. */
  lifetime: number;
}

/** I(t) = Σ αᵢ exp(−t/τᵢ). */
export function decayIntensity(components: DecayComponent[], t: number): number {
  return components.reduce((sum, c) => sum + c.amplitude * Math.exp(-t / c.lifetime), 0);
}

/** Fractional intensities fᵢ = αᵢτᵢ / Σ αⱼτⱼ. */
export function fractionalIntensities(components: DecayComponent[]): number[] {
  const total = components.reduce((s, c) => s + c.amplitude * c.lifetime, 0);
  return components.map((c) => (total > 0 ? (c.amplitude * c.lifetime) / total : NaN));
}

/** Amplitude-weighted mean lifetime Σ αᵢτᵢ / Σ αᵢ, s. */
export function amplitudeWeightedLifetime(components: DecayComponent[]): number {
  const a = components.reduce((s, c) => s + c.amplitude, 0);
  return a > 0 ? components.reduce((s, c) => s + c.amplitude * c.lifetime, 0) / a : NaN;
}

/** Intensity-weighted mean lifetime Σ αᵢτᵢ² / Σ αᵢτᵢ, s. */
export function intensityWeightedLifetime(components: DecayComponent[]): number {
  const at = components.reduce((s, c) => s + c.amplitude * c.lifetime, 0);
  return at > 0 ? components.reduce((s, c) => s + c.amplitude * c.lifetime ** 2, 0) / at : NaN;
}

/** Quantum yield Φ = ⟨τ⟩_amp / τ_rad, or NaN if that exceeds 1 (τ_rad shorter than the decay). */
export function quantumYield(components: DecayComponent[], radiativeLifetime: number): number {
  const phi = amplitudeWeightedLifetime(components) / radiativeLifetime;
  return phi >= 0 && phi <= 1 ? phi : NaN;
}
