// Lidar eye-safety dispatch: stationary pulse train vs scanned beam, NOHD and the limit at a viewing distance.
// Moved out of the page (laser-safety/lidar-safety/page-client.tsx) so the page and the API schema share it.
// Limits: ICNIRP (2013) Health Phys. 105(3), 271-295, through pulse-train.ts, scanned-pulse-train.ts and hazard-distance.ts.
import { T_MAX } from "./eye-exposure-limits";
import { effectiveDiameterAt, rangeToDiameter, roundBeam } from "./hazard-distance";
import { pulseTrainLimits, pulseTrainSafeDiameter } from "./pulse-train";
import { angularScan, type Scan } from "./scanned-beam";
import { lidarHazardDistance, scannedPulseLimits } from "./scanned-pulse-train";

/** SI inputs as typed (the function clamps them as the page always did). */
export interface LidarSafetyInput {
  lambda: number; // m
  pulseEnergy: number; // J
  prf: number; // Hz (0 = one pulse)
  pulseDuration: number; // s
  beamDiameter: number; // m, 1/e^2 at the window
  divergence: number; // rad, 1/e^2 full angle
  range: number; // m, where the eye is
  exposure: number; // s
  scanned: boolean;
  scanAngle: number; // rad, full angle
  scanRate: number; // Hz
  bothDirections: boolean;
}

export function lidarSafety(input: LidarSafetyInput) {
  const lambda = input.lambda;
  const Q = Math.max(input.pulseEnergy, 0);
  const prf = Math.max(input.prf, 0);
  const tau = Math.max(input.pulseDuration, 1e-13);
  const T = Math.min(Math.max(input.exposure, tau), T_MAX);
  const d = Math.max(input.beamDiameter, 1e-6);
  const phi = Math.max(input.divergence, 0);
  const range = Math.max(input.range, 0);
  const overlap = prf * tau > 1;
  const theta = Math.min(Math.max(input.scanAngle, (0.01 * Math.PI) / 180), 2 * Math.PI);
  const fScan = Math.max(input.scanRate, 0.001);
  const both = input.bothDirections;

  const beam = roundBeam(d, phi);
  const train = { duration: tau, prf, exposure: T };
  const pulses = { duration: tau, prf };
  const scanAt = (r: number): Scan => angularScan(theta, fScan, r, both, T);
  const dEye = effectiveDiameterAt(beam, range);
  const atEye = pulseTrainLimits(lambda, dEye, train);
  const atOutput = pulseTrainLimits(lambda, d, train);
  const covered = atEye.limits.length > 0 && Number.isFinite(atEye.qMax);
  const ratioOut = Q / atOutput.qMax;
  const nohd = rangeToDiameter(beam, pulseTrainSafeDiameter(lambda, Q, train));
  const nohdFinite = Number.isFinite(nohd) && nohd > 0;

  // Scanned mode: a pulse train needs f > 0; at the window (r = 0) or where the sweep doesn't clear the eye, the beam
  // is stationary.
  const scanOn = input.scanned && prf > 0 && covered && !overlap;
  const scanEye = scanOn && range > 0 ? scannedPulseLimits(lambda, dEye, pulses, scanAt(range)) : null;
  const scanEyeOk = scanEye !== null && scanEye.status === "ok";
  const rSearch = nohdFinite ? Math.max(4 * nohd, 1) : 1e5;
  const nohdScan = scanOn ? lidarHazardDistance(lambda, Q, beam, pulses, scanAt, rSearch) : NaN;
  const nohdScanFinite = Number.isFinite(nohdScan) && nohdScan > 0;
  const qMaxEye = scanEye !== null && scanEyeOk ? scanEye.qMax : atEye.qMax;
  const ratioEye = Q / qMaxEye;
  const binding = scanEye !== null && scanEyeOk ? scanEye.limits.find((l) => l.kind === scanEye.limiting) : undefined;

  return {
    Q, prf, tau, T, d, phi, range, overlap, theta, fScan, both,
    beam, train, pulses, scanAt, dEye, atEye, atOutput, covered, ratioOut, nohd, nohdFinite,
    scanOn, scanEye, scanEyeOk, rSearch, nohdScan, nohdScanFinite, qMaxEye, ratioEye, binding,
  };
}

export type LidarSafetyResult = ReturnType<typeof lidarSafety>;
