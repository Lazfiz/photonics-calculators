/**
 * Fibre link power budget in dB (Agrawal, Fiber-Optic Communication Systems, 4th ed., 2010, Ch. 5, power budget):
 *   P_tx = P_rx + C_L + M_s,   C_L = α_f L + n_c α_con + n_s α_splice.
 * The received power is P_tx − C_L. The system margin M_s is set aside from the received power above the receiver
 * sensitivity; it doesn't lower the received power. Model tier: exact (decibel bookkeeping of the given losses).
 * Not included: dispersion and other power penalties, which belong in M_s or reduce reach separately.
 */

export interface LinkBudgetParams {
  txPowerDbm: number;
  rxSensitivityDbm: number;
  /** Fibre length, km, and loss, dB/km. */
  lengthKm: number;
  fiberLossDbPerKm: number;
  splices: number;
  spliceLossDb: number;
  connectors: number;
  connectorLossDb: number;
  /** Required system margin, dB. */
  marginDb: number;
}

export interface LinkBudget {
  fiberLossDb: number;
  spliceLossDb: number;
  connectorLossDb: number;
  /** Channel loss C_L, dB. */
  channelLossDb: number;
  receivedPowerDbm: number;
  /** Received power above sensitivity, dB. */
  availableMarginDb: number;
  /** Available margin left after the required system margin, dB; ≥ 0 means the link closes. */
  excessMarginDb: number;
  /**
   * Longest fibre with the same splices and connectors that still keeps the system margin, km: ∞ for a lossless fibre,
   * NaN when the link doesn't close even at 0 km.
   */
  maxLengthKm: number;
}

export function linkBudget(p: LinkBudgetParams): LinkBudget {
  const ok = [p.txPowerDbm, p.rxSensitivityDbm, p.lengthKm, p.fiberLossDbPerKm, p.splices, p.spliceLossDb,
    p.connectors, p.connectorLossDb, p.marginDb].every(Number.isFinite)
    && p.lengthKm >= 0 && p.fiberLossDbPerKm >= 0 && p.splices >= 0 && p.spliceLossDb >= 0
    && p.connectors >= 0 && p.connectorLossDb >= 0 && p.marginDb >= 0;
  if (!ok) {
    return { fiberLossDb: NaN, spliceLossDb: NaN, connectorLossDb: NaN, channelLossDb: NaN, receivedPowerDbm: NaN,
      availableMarginDb: NaN, excessMarginDb: NaN, maxLengthKm: NaN };
  }
  const fiberLossDb = p.lengthKm * p.fiberLossDbPerKm;
  const spliceLossDb = p.splices * p.spliceLossDb;
  const connectorLossDb = p.connectors * p.connectorLossDb;
  const channelLossDb = fiberLossDb + spliceLossDb + connectorLossDb;
  const receivedPowerDbm = p.txPowerDbm - channelLossDb;
  const availableMarginDb = receivedPowerDbm - p.rxSensitivityDbm;
  const excessMarginDb = availableMarginDb - p.marginDb;
  const fiberAllowanceDb = p.txPowerDbm - p.rxSensitivityDbm - p.marginDb - spliceLossDb - connectorLossDb;
  const maxLengthKm = fiberAllowanceDb < 0 ? NaN : p.fiberLossDbPerKm === 0 ? Infinity : fiberAllowanceDb / p.fiberLossDbPerKm;
  return { fiberLossDb, spliceLossDb, connectorLossDb, channelLossDb, receivedPowerDbm, availableMarginDb,
    excessMarginDb, maxLengthKm };
}
