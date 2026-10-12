/**
 * Fibre bundles and tapered-fibre-bundle pump combiners. SI units: diameters in m, étendue in m²·sr.
 * Model tier: textbook (equal round fibres in touching hexagonal rings or a square grid; étendue π·A·NA² of a fibre in
 * air; adiabatic taper that scales NA by the taper ratio).
 *
 * Sources:
 * - Hexagonal bundles: n full rings hold 3n(n + 1) + 1 fibres (1, 7, 19, 37, …) and the outermost fibre centres sit at
 *   n·d, so the bundle spans (2n + 1)·d. The infinite-array packing fraction is π/(2√3) ≈ 0.9069.
 * - Étendue G = π·A·NA² and its conservation in an N×1 combiner, N·(d_p·NA_p)² ≤ (d_out·NA_out)²; the taper of ratio
 *   D_bundle/d_out raises the pump NA by the same ratio, which must stay ≤ NA_out (A. Kosterin, V. Temyanko,
 *   M. Fallahi, M. Mansuripur, Appl. Opt. 43, 3893 (2004), doi:10.1364/AO.43.003893).
 */

/** Infinite hexagonal-array packing fraction π/(2√3). */
export const HEX_PACKING_LIMIT = Math.PI / (2 * Math.sqrt(3));

/** Number of hexagonal rings around the central fibre needed for N fibres: the smallest n with 3n(n + 1) + 1 ≥ N. */
export function hexRingCount(fiberCount: number): number {
  if (!(fiberCount >= 1) || !Number.isFinite(fiberCount)) return NaN;
  const n = Math.ceil((-3 + Math.sqrt(9 + 12 * (Math.ceil(fiberCount) - 1))) / 6 - 1e-12);
  return Math.max(n, 0);
}

/** Fibres held by n full hexagonal rings, 3n(n + 1) + 1. */
export function hexFiberCount(rings: number): number {
  return 3 * rings * (rings + 1) + 1;
}

/** Diameter (2n + 1)·d of the circle around a hexagonal bundle of N fibres of outer diameter d. */
export function hexBundleDiameter(fiberCount: number, fiberDiameter: number): number {
  return fiberDiameter > 0 ? (2 * hexRingCount(fiberCount) + 1) * fiberDiameter : NaN;
}

/** Diameter (m − 1)√2·d + d of the circle around an m × m square grid, m = ⌈√N⌉. */
export function squareBundleDiameter(fiberCount: number, fiberDiameter: number): number {
  if (!(fiberCount >= 1) || !(fiberDiameter > 0)) return NaN;
  const m = Math.ceil(Math.sqrt(Math.ceil(fiberCount)) - 1e-12);
  return ((m - 1) * Math.SQRT2 + 1) * fiberDiameter;
}

/** Area fraction N·(d/D)² of N discs of diameter d inside a circle of diameter D (core or cladding fill). */
export function bundleFill(fiberCount: number, diameter: number, bundleDiameter: number): number {
  return bundleDiameter > 0 ? fiberCount * (diameter / bundleDiameter) ** 2 : NaN;
}

/** Étendue π·A·NA² = π²d²NA²/4 of a core of diameter d and numerical aperture NA (in air), m²·sr. */
export function fiberEtendue(coreDiameter: number, na: number): number {
  return coreDiameter > 0 && na > 0 && na <= 1 ? (Math.PI ** 2 * coreDiameter ** 2 * na ** 2) / 4 : NaN;
}

/** Étendue used by N pump fibres in the output pump guide, N·(d_p·NA_p)²/(d_out·NA_out)²; must be ≤ 1. */
export function combinerEtendueRatio(
  ports: number, pumpCore: number, pumpNA: number, outputDiameter: number, outputNA: number,
): number {
  return (ports * fiberEtendue(pumpCore, pumpNA)) / fiberEtendue(outputDiameter, outputNA);
}

/** Pump NA after tapering a bundle of diameter D_bundle down to d_out: NA_p·max(1, D_bundle/d_out). */
export function taperedPumpNA(pumpNA: number, bundleDiameter: number, outputDiameter: number): number {
  return bundleDiameter > 0 && outputDiameter > 0 ? pumpNA * Math.max(1, bundleDiameter / outputDiameter) : NaN;
}
