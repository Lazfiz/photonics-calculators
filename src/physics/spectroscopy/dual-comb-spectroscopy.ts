/**
 * Dual-comb spectroscopy: how the teeth of two frequency combs map to RF beat notes, and when that mapping is
 * free of aliasing. SI units in and out: frequencies in Hz, times in s. Model tier: exact (comb equation and
 * sampling arithmetic).
 *
 * Comb j has teeth ν_j(n) = n f_r,j + f_0,j (repetition rate f_r,j, carrier-envelope offset f_0,j). With
 * Δf_r = f_r,2 − f_r,1 and Δf_0 = f_0,2 − f_0,1, comb-1 tooth n beats with its nearest comb-2 tooth at
 *   b(n) = ν_2(m*) − ν_1(n) = wrap(n Δf_r + Δf_0)  into [−f_r,2/2, f_r,2/2),
 * since ν_2(n + k) − ν_1(n) = n Δf_r + Δf_0 + k f_r,2. The detected RF frequency is |b(n)|, in [0, f_r/2]
 * (the interferogram is sampled once per pulse, so f_r/2 is its Nyquist frequency). Adjacent teeth are Δf_r
 * apart in RF and f_r apart optically: the compression factor is f_r/Δf_r, and one interferogram repeats every
 * 1/Δf_r (I. Coddington, N. Newbury, W. Swann, "Dual-comb spectroscopy", Optica 3, 414 (2016)).
 *
 * The mapping is one-to-one only if b(n) runs across the optical band without wrapping and without changing
 * sign, i.e. the band's image lies inside (0, f_r/2) or (−f_r/2, 0). Since N teeth occupy N |Δf_r| of RF, this
 * needs the optical bandwidth Δν = N f_r ≤ f_r²/(2|Δf_r|) (Coddington et al., above), and in addition the
 * offsets must place the image inside one half-band.
 */

export interface Comb {
  /** Repetition rate f_r, Hz, > 0. */
  frep: number;
  /** Carrier-envelope offset frequency f_0, Hz. */
  fceo: number;
}

/** Index n of the comb tooth nearest to the optical frequency ν. */
export function nearestTooth(comb: Comb, nu: number): number {
  return Math.round((nu - comb.fceo) / comb.frep);
}

/** x wrapped into [−p/2, p/2). */
function wrapCentered(x: number, p: number): number {
  return x - p * Math.floor(x / p + 0.5);
}

/** Signed beat b(n) between comb-1 tooth n and the nearest comb-2 tooth, Hz, in [−f_r,2/2, f_r,2/2). */
export function beatNote(comb1: Comb, comb2: Comb, n: number): number {
  return wrapCentered(n * (comb2.frep - comb1.frep) + (comb2.fceo - comb1.fceo), comb2.frep);
}

/** Largest optical bandwidth that can map alias-free, f_r²/(2|Δf_r|), Hz (∞ for equal rates). */
export function aliasFreeBandwidth(comb1: Comb, comb2: Comb): number {
  return comb1.frep ** 2 / (2 * Math.abs(comb2.frep - comb1.frep));
}

export interface RfMapping {
  /** Comb-1 tooth indices at the two band edges. */
  nFirst: number;
  nLast: number;
  /** Signed beats at the edges (the last unwrapped, i.e. b(nFirst) + (N − 1)Δf_r), Hz. */
  bFirst: number;
  bLastUnwrapped: number;
  /** Lowest and highest RF frequency of the band's image when alias-free, Hz. */
  rfMin: number;
  rfMax: number;
  aliasFree: boolean;
  /** Change of Δf_0 (Hz) that centres the band's image at whichever of ±f_r/4 is nearer. */
  offsetToCentre: number;
}

/** RF image of N comb-1 teeth centred on the optical frequency ν_c. */
export function rfMapping(comb1: Comb, comb2: Comb, nuCenter: number, N: number): RfMapping {
  const dfr = comb2.frep - comb1.frep;
  const nFirst = nearestTooth(comb1, nuCenter) - Math.floor((N - 1) / 2);
  const nLast = nFirst + N - 1;
  const bFirst = beatNote(comb1, comb2, nFirst);
  const bLastUnwrapped = bFirst + (N - 1) * dfr;
  const lo = Math.min(bFirst, bLastUnwrapped);
  const hi = Math.max(bFirst, bLastUnwrapped);
  const half = comb2.frep / 2;
  const aliasFree = dfr !== 0 && ((lo > 0 && hi < half) || (hi < 0 && lo > -half));
  const centre = wrapCentered(bFirst + ((N - 1) / 2) * dfr, comb2.frep);
  return {
    nFirst, nLast, bFirst, bLastUnwrapped,
    rfMin: aliasFree ? Math.min(Math.abs(lo), Math.abs(hi)) : NaN,
    rfMax: aliasFree ? Math.max(Math.abs(lo), Math.abs(hi)) : NaN,
    aliasFree,
    offsetToCentre: (centre >= 0 ? 1 : -1) * (comb2.frep / 4) - centre,
  };
}
