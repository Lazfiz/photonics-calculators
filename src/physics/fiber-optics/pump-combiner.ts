/**
 * N×1 tapered-fibre-bundle pump combiner summary used by the pump-combiner page and its API schema. SI units: diameters
 * in m, étendue in m²·sr, power in W, brightness in W/(m²·sr). Model tier: textbook (see fiber-bundle.ts for the
 * hexagonal bundle, étendue and adiabatic-taper formulas and their source, Kosterin et al., Appl. Opt. 43, 3893 (2004),
 * doi:10.1364/AO.43.003893).
 */
import { combinerEtendueRatio, fiberEtendue, hexBundleDiameter, taperedPumpNA } from "./fiber-bundle";

export interface PumpCombinerInput {
  /** Number of pump ports N (whole number ≥ 1). */
  ports: number;
  /** True when a signal fibre sits in the centre of the bundle ((N + 1) × 1 combiner). */
  signalPort: boolean;
  /** Pump power per port, W. */
  power: number;
  /** Pump transmission η, 0 … 1. */
  efficiency: number;
  /** Signal insertion loss, dB. */
  signalLossDb: number;
  /** Pump-fibre core and cladding diameters, m (core ≤ cladding). */
  pumpCore: number;
  pumpClad: number;
  pumpNA: number;
  /** Output pump-guide (inner cladding) diameter, m, and NA. */
  outDia: number;
  outNA: number;
}

/**
 * Bundle diameter before the taper (m), taper ratio, pump NA after the taper, étendue used U, total pump input and
 * output power (W), ideal port limit ⌊1/U₁⌋ (U₁ = the étendue of one port), pump brightness in and out (W/(m²·sr), one
 * port's power over one core's étendue; the combined output power over the output guide's étendue), signal transmission
 * (fraction) and the two pass flags (NA after taper ≤ output NA; U ≤ 1).
 */
export function pumpCombinerSummary(p: PumpCombinerInput) {
  const totalFibres = p.ports + (p.signalPort ? 1 : 0);
  const bundle = hexBundleDiameter(totalFibres, p.pumpClad);
  const taperRatio = Math.max(1, bundle / p.outDia);
  const naTaper = taperedPumpNA(p.pumpNA, bundle, p.outDia);
  const U = combinerEtendueRatio(p.ports, p.pumpCore, p.pumpNA, p.outDia, p.outNA);
  const gPump = fiberEtendue(p.pumpCore, p.pumpNA);
  const gOut = fiberEtendue(p.outDia, p.outNA);
  const pIn = p.ports * p.power, pOut = pIn * p.efficiency;
  return {
    bundle, taperRatio, naTaper, U, pIn, pOut,
    maxPorts: Math.floor(1 / combinerEtendueRatio(1, p.pumpCore, p.pumpNA, p.outDia, p.outNA) + 1e-9),
    bIn: p.power / gPump, bOut: pOut / gOut,
    signalT: 10 ** (-p.signalLossDb / 10),
    taperOK: naTaper <= p.outNA, etendueOK: U <= 1,
  };
}
