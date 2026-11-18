/**
 * Summary of the rare-earth-doped-fibre page, in SI: kept out of doped-fiber-gain.ts, macro-bending-loss.ts and
 * step-index-modes.ts, whose exports every page that imports them ships. `rareEarthSpec` clamps the inputs to the page's
 * ranges; `rareEarthSummary` gives ion density, LP01 overlap, absorption, saturation power, gain and noise figure;
 * `rareEarthProfile` the gain and remaining pump along the fibre. Model tier: two-level rate equations, co-propagating
 * pump, no ASE, clustering or excited-state absorption (see doped-fiber-gain.ts for the sources).
 */
import {
  DOPANT_PRESETS, absorptionDbPerM, amplifier, coreOverlap, fullInversionGainDb, intrinsicSaturationPower,
  ionDensityFromWtPpm, twoLevelAt, type Beam, type DopantPreset, type DopedFiber,
} from "./doped-fiber-gain";
import { lp11CutoffWavelength, vNumber, type StepIndexFiber } from "./macro-bending-loss";
import { numericalAperture } from "./step-index-modes";

/** Above this signal gain (dB) amplified spontaneous emission, which the model leaves out, would saturate the gain. */
export const ASE_WARNING_GAIN_DB = 30;

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
const dB = (x: number) => 10 * Math.log10(x);
const SIGMA_UNIT = 1e-25;

export interface RareEarthInput {
  /** Dopant id of DOPANT_PRESETS ("Er", "Yb", "Tm", "Ho"); anything else falls back to Er. */
  dopant: string;
  /** Ion concentration, wt-ppm of the ion in silica. */
  ppm: number;
  /** Fibre length, m. */
  L: number;
  /** Core radius (doped to the edge), m. */
  a: number;
  n1: number;
  n2: number;
  /** Launched pump power, W. */
  pump: number;
  /** Input signal power, dBm. */
  signalDbm: number;
  /** Pump and signal wavelengths, m. */
  lp: number;
  ls: number;
  /** Cross-sections, m². */
  sigmaAPump: number;
  sigmaEPump: number;
  sigmaASignal: number;
  sigmaESignal: number;
  /** Upper-state lifetime, s. */
  tau: number;
}

export interface RareEarthSpec extends Omit<RareEarthInput, "dopant"> {
  ion: DopantPreset;
}

/** Clamps the inputs to the model's range (e.g. 1–50000 wt-ppm, 0.01–200 m, n₂ ≤ n₁) and picks the dopant preset. */
export function rareEarthSpec(raw: RareEarthInput): RareEarthSpec {
  const n1 = clamp(raw.n1, 1.3, 2);
  return {
    ion: DOPANT_PRESETS.find((d) => d.id === raw.dopant) ?? DOPANT_PRESETS[0],
    ppm: clamp(raw.ppm, 1, 50000),
    L: clamp(raw.L, 0.01, 200),
    a: clamp(raw.a, 0.5 * 1e-6, 20 * 1e-6),
    n1,
    n2: clamp(raw.n2, 1.3, n1),
    pump: clamp(raw.pump, 0, 5000 * 1e-3),
    signalDbm: clamp(raw.signalDbm, -60, 20),
    lp: clamp(raw.lp, 400 * 1e-9, 2200 * 1e-9),
    ls: clamp(raw.ls, 400 * 1e-9, 2200 * 1e-9),
    sigmaAPump: clamp(raw.sigmaAPump, 0, 1000 * SIGMA_UNIT),
    sigmaEPump: clamp(raw.sigmaEPump, 0, 1000 * SIGMA_UNIT),
    sigmaASignal: clamp(raw.sigmaASignal, 0, 1000 * SIGMA_UNIT),
    sigmaESignal: clamp(raw.sigmaESignal, 0, 1000 * SIGMA_UNIT),
    tau: clamp(raw.tau, 0.01 * 1e-3, 100 * 1e-3),
  };
}

function setup(s: RareEarthSpec) {
  const N = ionDensityFromWtPpm(s.ppm, s.ion.molarMass);
  const NA = numericalAperture(s.n1, s.n2);
  const guide: StepIndexFiber = { a: s.a, n1: s.n1, NA };
  const gp = coreOverlap(guide, s.lp);
  const gs = coreOverlap(guide, s.ls);
  const fiber: DopedFiber = { N, area: Math.PI * guide.a ** 2, tau: s.tau };
  const signalW = 1e-3 * 10 ** (s.signalDbm / 10);
  const beams = (pumpW: number): Beam[] => [
    { lambda: s.lp, sigmaA: s.sigmaAPump, sigmaE: s.sigmaEPump, overlap: gp, power: pumpW },
    { lambda: s.ls, sigmaA: s.sigmaASignal, sigmaE: s.sigmaESignal, overlap: gs, power: signalW },
  ];
  return { N, NA, guide, gp, gs, fiber, signalW, beams };
}

export interface RareEarthSummary {
  /** Ion density, 1/m³. */
  N: number;
  NA: number;
  /** LP01 overlap with the doping at the pump and signal (NaN if V < 0.5 or n₁ ≤ n₂). */
  gp: number;
  gs: number;
  /** Pump absorption, dB/m. */
  alphaP: number;
  /** V-number at the signal. */
  V: number;
  /** LP11 cutoff wavelength, m. */
  cutoff: number;
  /** Unpumped signal absorption, dB/m. */
  alphaS: number;
  /** Length that absorbs 90 % of the pump (10 dB/α_p), small-signal, m. */
  L90: number;
  /** Intrinsic saturation power at the signal and the pump, W. */
  pSatS: number;
  pSatP: number;
  /** Full-inversion gain bound, dB. */
  fullInv: number;
  /** Signal gain and noise figure, dB. */
  gain: number;
  nf: number;
}

export function rareEarthSummary(s: RareEarthSpec): RareEarthSummary {
  const { N, NA, guide, gp, gs, fiber, beams } = setup(s);
  const amp = amplifier(fiber, beams(s.pump), s.L, 1);
  const alphaP = absorptionDbPerM(gp, s.sigmaAPump, N);
  return {
    N, NA, gp, gs, alphaP,
    V: vNumber(guide, s.ls),
    cutoff: lp11CutoffWavelength(guide),
    alphaS: absorptionDbPerM(gs, s.sigmaASignal, N),
    L90: 10 / alphaP,
    pSatS: intrinsicSaturationPower(s.ls, fiber.area, gs, s.sigmaASignal, s.sigmaESignal, fiber.tau),
    pSatP: intrinsicSaturationPower(s.lp, fiber.area, gp, s.sigmaAPump, s.sigmaEPump, fiber.tau),
    fullInv: fullInversionGainDb(gs, s.sigmaESignal, N, s.L),
    gain: dB(amp.gain),
    nf: dB(amp.noiseFigure),
  };
}

export interface RareEarthProfile {
  /** Positions 0 … 3L, m. */
  lengths: number[];
  /** Signal gain at each position, dB. */
  gain: number[];
  /** Pump remaining, % of the launched pump (NaN with no pump). */
  pumpLeft: number[];
}

/** Gain and remaining pump along three times the fibre length. */
export function rareEarthProfile(s: RareEarthSpec): RareEarthProfile {
  const { fiber, signalW, beams } = setup(s);
  const lengths = Array.from({ length: 61 }, (_, i) => (i * 3 * s.L) / 60);
  const sol = lengths.map((z) => twoLevelAt(fiber, beams(s.pump), z).powers);
  return {
    lengths,
    gain: sol.map((p) => dB(p[1] / signalW)),
    pumpLeft: sol.map((p) => (s.pump > 0 ? (100 * p[0]) / s.pump : NaN)),
  };
}
