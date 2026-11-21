/**
 * Grey levels on a DMD by binary pulse-width modulation. SI units in and out (s, Hz, bit/s). Model tier: exact within
 * ideal binary PWM (each bit plane lasts exactly its weight, mirrors switch instantly, the light is steady over the
 * exposure); the controller limits are TI's tabulated values, not modelled.
 *
 * A b-bit pattern is shown as b bit planes; plane k (k = 0 … b − 1) lasts 2^k LSB times, so the exposure is
 * (2^b − 1) LSB and grey level g (0 … 2^b − 1) keeps the mirror on for g LSB (TI DLPC900 datasheet DLPS037H, Sec. 6.3,
 * which says the 8-bit weights sum to 256; the Programmer's Guide DLPU018J, Sec. 2.4, says 255, as 1 + 2 + … + 128 is).
 * In video input each colour of a frame of rate f with N_c colours gets an equal time slot 1/(f N_c) (DLPS037H Sec. 6.3:
 * 120 Hz RGB gives 2.78 ms).
 *
 * The shortest pattern of each bit depth on a DLPC900 driving the full array is TI's table (DLPS037H Table 6-4, the same
 * as DLPU018J Table 2-110). It is far below (2^b − 1) times the shortest 1-bit pattern because each plane loads into
 * the pixel memory while the previous one is shown (DMD 101 DLPA008B, Secs. 2.3.1–2.3.3); planes shorter than a load
 * need block clears or phased mirror clocking (Secs. 4.2–4.3). TI doesn't publish the DLPC900's schedule, so no closed
 * form reproduces the table and it is used as printed.
 *
 * Video pattern mode takes its patterns from one input frame of at most 24 bits per pixel (DLPS037H Sec. 6.4.1), so a
 * frame holds at most ⌊24/b⌋ distinct b-bit patterns, however short they are.
 */

/** DMDs the DLPC900 drives, for TI's minimum-pattern-time table. */
export type Dlpc900Dmd = "DLP5500" | "DLP6500" | "DLP9000" | "DLP670S" | "DLP500YX";

/**
 * Minimum pattern time in any pattern mode on a DLPC900, µs, by bit depth (DLPS037H Table 6-4; DLPU018J Table 2-110).
 * Bit depths 9, 11, 13 and 15 aren't listed; 10–16 exist only for the DLP500YX.
 */
export const DLPC900_MIN_PATTERN_US: Record<Dlpc900Dmd, Readonly<Record<number, number>>> = {
  DLP5500: { 1: 94, 2: 275, 3: 356, 4: 444, 5: 972, 6: 1517, 7: 1877, 8: 3753 },
  DLP6500: { 1: 105, 2: 304, 3: 394, 4: 823, 5: 1215, 6: 1487, 7: 1998, 8: 4046 },
  DLP9000: { 1: 105, 2: 304, 3: 380, 4: 733, 5: 1215, 6: 1487, 7: 1998, 8: 4046 },
  DLP670S: { 1: 100, 2: 343, 3: 438, 4: 768, 5: 1299, 6: 1488, 7: 2000, 8: 4046 },
  DLP500YX: { 1: 62, 2: 184, 3: 269, 4: 458, 5: 682, 6: 807, 7: 1083, 8: 2263, 10: 10363, 12: 41452, 14: 165807, 16: 663225 },
};

const positive = (x: number) => Number.isFinite(x) && x > 0;
const bitDepth = (b: number) => Number.isInteger(b) && b >= 1 && b <= 16;

/** Grey levels 2^b of a b-bit pattern (1 ≤ b ≤ 16). */
export function greyLevels(bits: number): number {
  return bitDepth(bits) ? 2 ** bits : NaN;
}

/** Duration of the least significant bit plane, exposure/(2^b − 1), s. */
export function lsbTime(exposure: number, bits: number): number {
  return positive(exposure) && bitDepth(bits) ? exposure / (2 ** bits - 1) : NaN;
}

/** Durations 2^k LSB of the bit planes k = 0 … b − 1, s (they sum to the exposure). */
export function bitPlaneTimes(exposure: number, bits: number): number[] {
  const lsb = lsbTime(exposure, bits);
  return Number.isFinite(lsb) ? Array.from({ length: bits }, (_, k) => 2 ** k * lsb) : [];
}

/** Mirror on-time g·LSB for grey level g (an integer, 0 ≤ g ≤ 2^b − 1), s. */
export function onTime(exposure: number, bits: number, grey: number): number {
  const lsb = lsbTime(exposure, bits);
  return Number.isFinite(lsb) && Number.isInteger(grey) && grey >= 0 && grey <= 2 ** bits - 1 ? grey * lsb : NaN;
}

/** Time slot 1/(f N_c) of each colour in a video frame of rate f with N_c colours, s (DLPS037H Sec. 6.3). */
export function colourSlot(frameRate: number, colours: number): number {
  return positive(frameRate) && Number.isInteger(colours) && colours >= 1 ? 1 / (frameRate * colours) : NaN;
}

/** TI's minimum pattern time on a DLPC900 for this DMD and bit depth, s; NaN where the table has no entry. */
export function dlpc900MinPattern(dmd: Dlpc900Dmd, bits: number): number {
  const us = DLPC900_MIN_PATTERN_US[dmd]?.[bits];
  return us === undefined ? NaN : us * 1e-6;
}

/** Binary data rate N_x N_y R₁ at R₁ binary patterns per second, bit/s. */
export function binaryDataRate(mirrorsX: number, mirrorsY: number, binaryRate: number): number {
  return positive(mirrorsX) && positive(mirrorsY) && positive(binaryRate) ? mirrorsX * mirrorsY * binaryRate : NaN;
}

export interface TimingSetup {
  /** Bit depth b, 1 … 16. */
  bits: number;
  /** Exposure of one pattern (all its bit planes), s. */
  exposure: number;
  /** Dark time after each pattern, s (≥ 0). */
  dark: number;
  /** Grey level g, 0 … 2^b − 1. */
  grey: number;
  /** DMD for TI's DLPC900 table, or null for none. */
  dmd: Dlpc900Dmd | null;
  /** The DMD's 1-bit (binary) pattern rate R₁, Hz. */
  binaryRate: number;
  mirrorsX: number;
  mirrorsY: number;
  /** Video frame rate f, Hz. */
  frameRate: number;
  /** Colours per video frame N_c (1 mono, 3 RGB). */
  colours: number;
}

export interface TimingResult {
  greyLevels: number;
  /** LSB and MSB plane durations, s. */
  lsb: number;
  msb: number;
  /** Bit plane durations, LSB first, s. */
  planes: number[];
  /** Mirror on-time g·LSB, s, and its fraction g/(2^b − 1) of the exposure. */
  onTime: number;
  onFraction: number;
  /** On-time over the whole pattern period (exposure + dark): the mean intensity against a mirror held on. */
  meanFraction: number;
  /** Pattern period exposure + dark, s, and pattern rate, Hz. */
  period: number;
  patternRate: number;
  /** TI's minimum pattern time, s, and the pattern rate it allows, Hz (NaN where the table has no entry). */
  tiMinPattern: number;
  tiMaxRate: number;
  /** The shortest binary pattern 1/R₁, s, and the binary data rate, bit/s. */
  binaryTime: number;
  dataRate: number;
  /** Video: colour slot, s; its LSB at this bit depth, s; distinct patterns per frame in video pattern mode, min(⌊1/(f·period)⌋, ⌊24/b⌋). */
  colourSlot: number;
  videoLsb: number;
  patternsPerFrame: number;
}

export function dmdTiming(s: TimingSetup): TimingResult {
  const lsb = lsbTime(s.exposure, s.bits);
  const on = onTime(s.exposure, s.bits, s.grey);
  const dark = Number.isFinite(s.dark) && s.dark >= 0 ? s.dark : NaN;
  const period = positive(s.exposure) ? s.exposure + dark : NaN;
  const tiMinPattern = s.dmd ? dlpc900MinPattern(s.dmd, s.bits) : NaN;
  const slot = colourSlot(s.frameRate, s.colours);
  // A pattern sequence in a video frame must end within the frame (DLPU018J Sec. 5.1 note) and uses at most 24 bits per
  // pixel (DLPS037H Sec. 6.4.1). The relative 1e-9 keeps an exact multiple (two 4166.67 µs patterns in a 120 Hz frame)
  // from flooring one short through rounding.
  const fit = positive(s.frameRate) && positive(period) && bitDepth(s.bits)
    ? Math.min(Math.floor((1 / (s.frameRate * period)) * (1 + 1e-9)), Math.floor(24 / s.bits)) : NaN;
  return {
    greyLevels: greyLevels(s.bits),
    lsb,
    msb: Number.isFinite(lsb) ? 2 ** (s.bits - 1) * lsb : NaN,
    planes: bitPlaneTimes(s.exposure, s.bits),
    onTime: on,
    onFraction: Number.isFinite(on) ? s.grey / (2 ** s.bits - 1) : NaN,
    meanFraction: Number.isFinite(on) && positive(period) ? on / period : NaN,
    period,
    patternRate: positive(period) ? 1 / period : NaN,
    tiMinPattern,
    tiMaxRate: positive(tiMinPattern) ? 1 / tiMinPattern : NaN,
    binaryTime: positive(s.binaryRate) ? 1 / s.binaryRate : NaN,
    dataRate: binaryDataRate(s.mirrorsX, s.mirrorsY, s.binaryRate),
    colourSlot: slot,
    videoLsb: Number.isFinite(slot) ? lsbTime(slot, s.bits) : NaN,
    patternsPerFrame: fit,
  };
}
