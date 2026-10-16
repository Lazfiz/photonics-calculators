/**
 * Illustrative anti-blooming drain, charges in e⁻ per pixel. A drain barrier sits at T = a·W below the full well W.
 * Charge above T goes to the drain with efficiency η and the rest, (1 − η), stays in the well. Once the well is full
 * the remainder spills into the neighbouring pixels (blooming). Real lateral and vertical overflow drains switch on
 * gradually (sub-threshold barrier current) rather than at a hard step; J. R. Janesick, Scientific Charge-Coupled
 * Devices (SPIE 2001, doi:10.1117/3.374903), describes the structures and their cost in well capacity and fill factor.
 *
 * Incident charge N collects as N up to T, then T + (1 − η)(N − T) up to W. Blooming starts at
 * N_b = T + (W − T)/(1 − η), never for η = 1.
 */

export interface AntibloomingResult {
  /** Charge kept in the well, e⁻. */
  collected: number;
  /** Charge taken by the drain, e⁻. */
  drained: number;
  /** Charge spilled into the neighbours after the well filled, e⁻. */
  spilled: number;
}

const valid = (fullWell: number, thresholdFraction: number, drainEfficiency: number) =>
  fullWell > 0 && thresholdFraction >= 0 && thresholdFraction <= 1 && drainEfficiency >= 0 && drainEfficiency <= 1;

/** Split incident charge N between the well, the drain and the neighbouring pixels. */
export function antiblooming(incident: number, fullWell: number, thresholdFraction: number, drainEfficiency: number): AntibloomingResult {
  if (!(incident >= 0) || !valid(fullWell, thresholdFraction, drainEfficiency)) return { collected: NaN, drained: NaN, spilled: NaN };
  const threshold = thresholdFraction * fullWell;
  if (incident <= threshold) return { collected: incident, drained: 0, spilled: 0 };
  const excess = incident - threshold;
  const drained = drainEfficiency * excess;
  const leaked = excess - drained;
  const room = fullWell - threshold;
  return { collected: threshold + Math.min(leaked, room), drained, spilled: Math.max(0, leaked - room) };
}

/** Incident charge N_b = T + (W − T)/(1 − η) at which the well fills and blooming starts, e⁻ (Infinity for η = 1). */
export function bloomingOnset(fullWell: number, thresholdFraction: number, drainEfficiency: number): number {
  if (!valid(fullWell, thresholdFraction, drainEfficiency)) return NaN;
  if (drainEfficiency === 1) return Infinity;
  const threshold = thresholdFraction * fullWell;
  return threshold + (fullWell - threshold) / (1 - drainEfficiency);
}
