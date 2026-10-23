/**
 * ITU-T G.657 (08/2024) macrobending loss limits of bend-insensitive single-mode fibre, and the
 * highest category a fibre meets. Losses in dB for the stated number of turns at mandrel radius R (m).
 * Values from Table 1 (A1, A2) and Table 2 (B3) of the Recommendation, read 2026-10-23. The 2024 edition has
 * no B2 (its Note 3 to Table 2: B2 had the A2 macrobend limits) and no A3.
 */
export interface MacrobendLimit {
  /** Bend radius, m. */
  R: number;
  turns: number;
  /** Maximum loss at 1550 nm, dB. */
  max1550: number;
  /** Maximum loss at 1625 nm, dB. */
  max1625: number;
}

export type G657Category = "B3" | "A2" | "A1";

/** Categories from the strictest to the loosest. */
export const G657_LIMITS: Record<G657Category, readonly MacrobendLimit[]> = {
  B3: [
    { R: 10e-3, turns: 1, max1550: 0.03, max1625: 0.1 },
    { R: 7.5e-3, turns: 1, max1550: 0.08, max1625: 0.25 },
    { R: 5e-3, turns: 1, max1550: 0.15, max1625: 0.45 },
  ],
  A2: [
    { R: 15e-3, turns: 10, max1550: 0.03, max1625: 0.1 },
    { R: 10e-3, turns: 1, max1550: 0.1, max1625: 0.2 },
    { R: 7.5e-3, turns: 1, max1550: 0.5, max1625: 1.0 },
  ],
  A1: [
    { R: 15e-3, turns: 10, max1550: 0.25, max1625: 1.0 },
    { R: 10e-3, turns: 1, max1550: 0.75, max1625: 1.5 },
  ],
};

export const G657_CATEGORIES = Object.keys(G657_LIMITS) as G657Category[];

/** Spec wavelengths, m. */
export const G657_WAVELENGTHS = [1550e-9, 1625e-9] as const;

/** True if `perTurnDb(R, λ)` (dB per turn) meets every limit of the category at both wavelengths. NaN fails. */
export function meetsG657(category: G657Category, perTurnDb: (R: number, lambda: number) => number): boolean {
  return G657_LIMITS[category].every(
    ({ R, turns, max1550, max1625 }) => perTurnDb(R, 1550e-9) * turns <= max1550 && perTurnDb(R, 1625e-9) * turns <= max1625,
  );
}

/** Strictest G.657 category met, or null (macrobend limits only; MFD, cutoff etc. not checked). */
export function g657Category(perTurnDb: (R: number, lambda: number) => number): G657Category | null {
  return G657_CATEGORIES.find((c) => meetsG657(c, perTurnDb)) ?? null;
}

/**
 * Smallest MFD at 1310 nm that G.657 (08/2024) allows, µm: nominal range 8.6–9.2 µm minus the ±0.4 µm tolerance,
 * for both A and B3 (Tables 1 and 2; earlier editions allowed B a nominal 6.3–9.5 µm).
 */
export const G657_MIN_MFD_UM = 8.2;
