/**
 * Beam steering with an LCoS phase SLM: a blazed (sawtooth) phase grating of period N pixels. SI units in and out,
 * angles in rad. Model tier: textbook (scalar Fraunhofer diffraction, plane wave at normal incidence, lossless flat
 * square pixels (R = 1) of area fill factor F, each pixel's phase set exactly, no fringing fields).
 *
 * A ramp of period Λ = N·d sends its first order to sin θ = λ/(Nd) (grating equation). Each pixel carries the ramp
 * at that pixel, wrapped at 2π, so the pixels hold exactly e^{2πi n/N} and the far field is the pixel aperture's
 * envelope sampled at the orders ν = k + 1/N (cycles per pixel). For an aperture of side √F·d the order (k + 1/N, 0)
 * carries F² sinc²(π√F(k + 1/N)) of the incident power: k = 0 is the steered beam, k = −1 its alias on the other
 * side. F = 1 gives sinc²(π/N), the N-level result of G. J. Swanson (MIT Lincoln Laboratory Technical Report 854,
 * 1989); a long period tends to F², as J. C. Shane et al. state for flat mirrors with non-reflective gaps (Proc. SPIE,
 * doi:10.1117/12.2528558, 2019) and J. B. Naber et al. find for an 87 % fill factor, 76 % (Eur. Phys. J. Spec. Top.
 * 225, 2785, 2016).
 *
 * Gaps: non-reflective gaps (Shane et al.'s model) send nothing anywhere, so a 2π grating has no zero order. Gaps
 * that reflect without modulation (the dead areas of W. D. G. D. Improso et al., PHOTOPTICS 2017) form a grating of
 * period d of their own: (1 − F)² into the zero order and F² sinc²(π√F k) into each grid order k (derived here).
 *
 * A reflective cell of birefringence Δn and thickness t retards by δ = 2π Δn 2t/λ, so 2π needs t = λ/(2Δn)
 * (Z. Zhang, Z. You, D. Chu, Light Sci. Appl. 3, e213 (2014), Eqs. 3 and 4).
 */
import { phaseQuantizationEfficiency, pixelEnvelope, replayField, slmMaxAngle } from "../imaging/holography";

/** What the gaps between pixel mirrors do: reflect nothing, or reflect without modulation. */
export type GapModel = "absorbing" | "mirror";

const positive = (x: number) => Number.isFinite(x) && x > 0;
const fill = (F: number) => Number.isFinite(F) && F > 0 && F <= 1;

/** First-order steering angle arcsin(λ/(Nd)) of a ramp of N ≥ 2 pixels, rad; NaN below 2 pixels or when evanescent. */
export function steeringAngle(lambda: number, pitch: number, period: number): number {
  if (!(positive(lambda) && positive(pitch) && Number.isFinite(period) && period >= 2)) return NaN;
  const s = lambda / (period * pitch);
  return s <= 1 ? Math.asin(s) : NaN;
}

/** Power in the order ν = k + 1/N (cycles per pixel) of an N-pixel ramp on pixels of fill F: F² sinc²(π√F(k + 1/N)). */
export function rampOrderEfficiency(period: number, fillFactor: number, k: number): number {
  if (!(Number.isFinite(period) && period >= 2 && fill(fillFactor) && Number.isInteger(k))) return NaN;
  // pixelEnvelope(f, d, F) is sinc²(π√F d f); with d = 1 the frequency is in cycles per pixel.
  return fillFactor ** 2 * pixelEnvelope(k + 1 / period, 1, fillFactor);
}

/** Power an unmodulated mirror gap puts into grid order k: (1 − F)² at k = 0, F² sinc²(π√F k) otherwise. */
export function gapOrderEfficiency(fillFactor: number, k: number): number {
  if (!(fill(fillFactor) && Number.isInteger(k))) return NaN;
  return k === 0 ? (1 - fillFactor) ** 2 : fillFactor ** 2 * pixelEnvelope(k, 1, fillFactor);
}

/** Phase stroke 2π Δn 2t/λ of a reflective cell (two passes), rad (Zhang et al. 2014, Eq. 3). */
export function phaseStroke(lambda: number, deltaN: number, thickness: number): number {
  return positive(lambda) && positive(deltaN) && positive(thickness) ? (4 * Math.PI * deltaN * thickness) / lambda : NaN;
}

/** Cell thickness λ/(2Δn) for a 2π stroke in reflection, m (Zhang et al. 2014, Eq. 4). */
export function thicknessFor2Pi(lambda: number, deltaN: number): number {
  return positive(lambda) && positive(deltaN) ? lambda / (2 * deltaN) : NaN;
}

export interface SteeringSetup {
  lambda: number;
  /** Pixel pitch d, m. */
  pitch: number;
  /** Grating period N in pixels (≥ 2; need not be whole). */
  period: number;
  /** Area fill factor F, 0 < F ≤ 1. */
  fillFactor: number;
  gap: GapModel;
  /** Birefringence Δn of the liquid crystal at λ. */
  deltaN: number;
  /** Liquid-crystal layer thickness t, m. */
  thickness: number;
  /** Focal length of the Fourier lens, m. */
  focal: number;
  /** Pixels across the steering direction. */
  pixels: number;
}

export interface SteeringResult {
  /** First-order steering angle, rad. */
  angle: number;
  /** Grating frequency 1/(Nd), 1/m. */
  gratingFrequency: number;
  /** Grating period N·d, m. */
  periodLength: number;
  /** Largest steering angle, at N = 2, rad. */
  maxAngle: number;
  /** Power in the steered order, fraction of the incident power. NaN when the stroke is below 2π or the order is evanescent. */
  efficiency: number;
  /** The same over the zero order with no pattern (datasheet convention), absorbing gaps only. */
  relativeEfficiency: number;
  /** Pixelation factor sinc²(π/N): the steered power for F = 1. */
  pixelation: number;
  /** Long-period limit F². */
  fillLimit: number;
  /** Angle of the alias order ν = 1/N − 1, rad; NaN when evanescent. */
  aliasAngle: number;
  /** Power in the alias order. */
  aliasEfficiency: number;
  /** Power in the zero order. */
  zeroOrder: number;
  /** Phase stroke at λ, rad. */
  stroke: number;
  /** Whether the stroke reaches 2π, so the ramp can be blazed. */
  reaches2Pi: boolean;
  /** Thickness for a 2π stroke at λ, m. */
  thickness2Pi: number;
  /** Longest wavelength with a 2π stroke, 2Δn t, m (Δn held fixed). */
  maxWavelength: number;
  /** Spot displacement f tan θ in the focal plane, m. */
  spotShift: number;
  /** Replay field λf/d, m. */
  replayField: number;
  /** First zero of the spot from the whole aperture, λf/(M d), m. */
  spotSize: number;
}

export function lcosSteering(s: SteeringSetup): SteeringResult {
  const { lambda, pitch, period: N, fillFactor: F, gap, deltaN, thickness, focal, pixels } = s;
  const angle = steeringAngle(lambda, pitch, N);
  const stroke = phaseStroke(lambda, deltaN, thickness);
  // A stroke short of 2π can't be wrapped at 2π: the ramp then has a phase-depth error this model leaves out.
  const reaches2Pi = stroke >= 2 * Math.PI * (1 - 1e-12);
  const blazed = (x: number) => (reaches2Pi ? x : NaN);
  const aliasSin = (lambda * (1 / N - 1)) / pitch;
  const aliasAngle = Math.abs(aliasSin) <= 1 && N >= 2 ? Math.asin(aliasSin) : NaN;
  // An evanescent order carries no power away, so its efficiency is withheld rather than read off the envelope.
  const steered = Number.isFinite(angle) ? blazed(rampOrderEfficiency(N, F, 0)) : NaN;
  return {
    angle,
    gratingFrequency: positive(pitch) && N >= 2 ? 1 / (N * pitch) : NaN,
    periodLength: positive(pitch) && N >= 2 ? N * pitch : NaN,
    maxAngle: slmMaxAngle(lambda, pitch),
    efficiency: steered,
    relativeEfficiency: gap === "absorbing" ? steered / F ** 2 : NaN,
    pixelation: N >= 2 ? phaseQuantizationEfficiency(N) : NaN,
    fillLimit: fill(F) ? F ** 2 : NaN,
    aliasAngle,
    aliasEfficiency: Number.isFinite(aliasAngle) ? blazed(rampOrderEfficiency(N, F, -1)) : NaN,
    zeroOrder: blazed(gap === "absorbing" ? (fill(F) ? 0 : NaN) : gapOrderEfficiency(F, 0)),
    stroke,
    reaches2Pi,
    thickness2Pi: thicknessFor2Pi(lambda, deltaN),
    maxWavelength: positive(deltaN) && positive(thickness) ? 2 * deltaN * thickness : NaN,
    spotShift: positive(focal) ? focal * Math.tan(angle) : NaN,
    replayField: replayField(lambda, focal, pitch),
    spotSize: positive(pixels) ? replayField(lambda, focal, pitch) / pixels : NaN,
  };
}
