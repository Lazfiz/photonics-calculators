/**
 * Microchannel plate page summary: wall strikes, yield and gain of one plate and of a stack, the one-channel space-charge
 * limit, the optimum L/d and the geometry. SI units (m, V, eV); lengths are metres, the open-area ratio a fraction. The
 * physics is in `electron-multiplier.ts` (Wiza 1979); this module only combines it.
 */

import {
  channelGain, channelStrikes, channelYieldPerStrike, hexagonalPitch, maximumChannelGain, optimumLdRatio, saturatedChannelGain,
  stackedGain,
} from "./electron-multiplier";

/** Fewer wall strikes than this, a yield per strike above `MCP_MAX_YIELD` or a plate gain below 1 is outside the gain model. */
export const MCP_MIN_STRIKES = 2;
export const MCP_MAX_YIELD = 4;

export interface MicrochannelPlateInput {
  plates: number;
  /** Channel diameter, m. */
  diameter: number;
  /** Channel length, m. */
  length: number;
  openAreaRatio: number;
  /** Voltage per plate, V. */
  voltage: number;
  /** Yield constant A, V^−1/2. */
  yieldConstant: number;
  /** Secondary emission energy V₀, eV. */
  emissionEnergy: number;
  /** Photocathode QE. */
  qe: number;
}

export interface MicrochannelPlateSummary {
  ld: number;
  strikes: number;
  yieldPerStrike: number;
  plateGain: number;
  stackGain: number;
  /** One-channel space-charge limit, gain. */
  limit: number;
  saturated: boolean;
  outOfRange: boolean;
  optimumLd: number;
  peakPlateGain: number;
  /** Hexagonal channel pitch, m. */
  pitch: number;
  detection: number;
}

export function microchannelPlateSummary(p: MicrochannelPlateInput): MicrochannelPlateSummary {
  const ld = p.length / p.diameter;
  const strikes = channelStrikes(p.voltage, ld, p.emissionEnergy);
  const yieldPerStrike = channelYieldPerStrike(p.voltage, ld, p.yieldConstant, p.emissionEnergy);
  const plateGain = channelGain(p.voltage, ld, p.yieldConstant, p.emissionEnergy);
  const stackGain = stackedGain(plateGain, Math.round(p.plates));
  const limit = saturatedChannelGain(p.diameter);
  return {
    ld, strikes, yieldPerStrike, plateGain, stackGain, limit,
    saturated: !(stackGain <= limit), // an overflowing stack (NaN) is saturated too
    outOfRange: strikes < MCP_MIN_STRIKES || yieldPerStrike > MCP_MAX_YIELD || plateGain < 1,
    optimumLd: optimumLdRatio(p.voltage, p.yieldConstant, p.emissionEnergy),
    peakPlateGain: maximumChannelGain(p.voltage, p.yieldConstant),
    pitch: hexagonalPitch(p.diameter, p.openAreaRatio),
    detection: p.qe * p.openAreaRatio,
  };
}
