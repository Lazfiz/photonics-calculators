/**
 * Summary of the fluorescence-spectra page: laser excitation and emission-filter fractions of two fluorescent proteins,
 * their relative signals in the filter, and the Förster overlap, radius and FRET efficiency of the pair. Wavelengths and
 * the donor-acceptor distance in metres. Model tier: textbook. Formulas, catalogue and spectra: see `fluorophores.ts`
 * (Lakowicz, Principles of Fluorescence Spectroscopy, 3rd ed., §13.2; FPbase, Lambert, Nat. Methods 16, 277 (2019),
 * doi:10.1038/s41592-019-0352-8).
 */
import {
  emissionFraction, forsterOverlap, forsterRadius, fretEfficiency, relativeSignal, spectrumAt, type Fluorophore,
} from "./fluorophores";

export interface FluorescenceSpectraInputs {
  donor: Fluorophore;
  acceptor: Fluorophore;
  /** Laser line, m. */
  laser: number;
  /** Emission filter edges, m (top hat). */
  filterLow: number;
  filterHigh: number;
  /** Orientation factor κ². */
  kappa2: number;
  /** Refractive index of the medium. */
  n: number;
  /** Donor-acceptor distance, m. */
  distance: number;
}

/**
 * Per dye (donor first): excitation at the laser as a fraction of its peak, fraction of its emission in the filter and
 * relative signal (ε·f_ex·Φ·fraction); the two signal ratios; J (M⁻¹ cm⁻¹ nm⁴), R₀ (m) and E of the pair.
 */
export function fluorescenceSpectraSummary(i: FluorescenceSpectraInputs) {
  const dyes = [i.donor, i.acceptor].map((f) => ({
    excitation: spectrumAt(f.ex, i.laser),
    inFilter: emissionFraction(f.em, i.filterLow, i.filterHigh),
    signal: relativeSignal(f, [i.laser], i.filterLow, i.filterHigh),
  }));
  const overlap = forsterOverlap(i.donor, i.acceptor);
  const R0 = forsterRadius(overlap, i.donor.quantumYield, i.kappa2, i.n);
  return {
    dyes,
    bleed: dyes[1].signal / dyes[0].signal,
    bleedReverse: dyes[0].signal / dyes[1].signal,
    overlap,
    R0,
    efficiency: fretEfficiency(i.distance, R0),
  };
}
