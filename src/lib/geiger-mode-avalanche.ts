/**
 * Geiger-mode APD / SPAD calculator core functions.
 * Extracted from page-client.tsx for testability.
 */

export interface GeigerModeInputs {
  overbias: number;       // V, excess bias at reference temperature (25°C)
  temperature: number;    // °C
  tempCoeff: number;      // mV/°C, Vbr temperature coefficient
  deadTime: number;       // ns, quenching dead time
  darkCountRate: number;  // cps, DCR at 25°C at reference overbias
}

export interface GeigerModeResults {
  bvShift: number;
  effectiveOverbias: number;
  pde: number;
  maxCountRate: number;
  effectiveDCR: number;
  afterpulseRate: number;
  dcrTempFactor: number;
}

/**
 * Compute all Geiger-mode APD results from inputs.
 *
 * Key physics:
 * - Vbr increases with temperature: ΔVbr = β·(T − Tref)
 * - Effective overbias decreases at fixed bias: ΔVeff = V_excess_ref − ΔVbr
 * - PDE scales linearly with effective overbias
 * - DCR depends on both temperature (thermal generation) AND overbias (trigger probability)
 * - Afterpulse rate is approximated as 2% of effective DCR
 */
export function calculateGeigerMode(inputs: GeigerModeInputs): GeigerModeResults {
  const { overbias, temperature, tempCoeff, deadTime, darkCountRate } = inputs;

  const bvShift = tempCoeff * 1e-3 * (temperature - 25);
  const effectiveOverbias = overbias - bvShift;
  const pde = effectiveOverbias <= 0 ? 0 : Math.min(0.75, 0.15 * effectiveOverbias);
  const dt = deadTime * 1e-9;
  const maxCountRate = 1 / dt;
  const dcrTempFactor = Math.pow(2, (temperature - 25) / 10);
  const overbiasRatio = overbias > 0 ? effectiveOverbias / overbias : 0;
  const effectiveDCR = effectiveOverbias <= 0 ? 0 : darkCountRate * dcrTempFactor * overbiasRatio;
  const afterpulseRate = effectiveOverbias <= 0 ? 0 : effectiveDCR * 0.02;

  return { bvShift, effectiveOverbias, pde, maxCountRate, effectiveDCR, afterpulseRate, dcrTempFactor };
}
