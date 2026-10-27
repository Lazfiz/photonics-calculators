/**
 * Digital holography (recording on a pixelated sensor, Fresnel reconstruction) and computer-generated holography
 * (replay from a pixelated SLM). SI units in and out, angles in rad. Model tier: textbook (scalar, paraxial Fresnel
 * diffraction, plane reference wave, square pixels of pitch Δx on an N-pixel axis).
 *
 * Fresnel reconstruction of an N·Δx hologram at distance z gives image pixels of λz/(NΔx), and the reconstructed
 * point is the Fourier transform of the hologram aperture, a sinc whose first zero is that same λz/(NΔx). The
 * angle between object and reference waves must keep the fringes above two pixels: θ_max = 2 arcsin(λ/(4Δx))
 * (U. Schnars, W. P. O. Jüptner, Meas. Sci. Technol. 13, R85 (2002), doi:10.1088/0957-0233/13/9/201).
 *
 * An SLM of pitch Δx diffracts up to arcsin(λ/(2Δx)), so a hologram replayed at z (Fresnel, or the focal length of
 * a Fourier lens) fills a field λz/Δx before it repeats. A phase profile quantised to L equal levels sends
 * sinc²(π/L) of the light into the first order (G. J. Swanson, MIT Lincoln Laboratory Technical Report 854, 1989):
 * 4/π² = 40.5 % for binary phase, 94.96 % for 8 levels; binary amplitude gives 1/π² = 10.1 %. Each pixel's aperture
 * multiplies the replay field by a sinc² envelope (J. W. Goodman, Introduction to Fourier Optics).
 */
import { sinc } from "../math";

const positive = (x: number) => Number.isFinite(x) && x > 0;

/** Image pixel of the Fresnel reconstruction, λz/(NΔx), m; also the first zero of the coherent point image. */
export function fresnelReconstructionPitch(lambda: number, z: number, N: number, dx: number): number {
  if (!(positive(lambda) && positive(z) && positive(N) && positive(dx))) return NaN;
  return (lambda * z) / (N * dx);
}

/** Geometric numerical aperture sin(atan(NΔx/(2z))) of an N·Δx sensor seen from an on-axis point at distance z (always ≤ 1). */
export function hologramNA(N: number, dx: number, z: number): number {
  return positive(N) && positive(dx) && positive(z) ? Math.sin(Math.atan((N * dx) / (2 * z))) : NaN;
}

/**
 * Effective numerical aperture min(hologramNA, λ/(2Δx)), the smaller of the sensor-width limit and the pixel limit.
 * Below z ≈ NΔx²/λ the Nyquist frequency 1/(2Δx) of the pixel pitch, not the sensor width, limits the recorded fringe
 * frequency, so sin θ ≤ λ/(2Δx).
 */
export function hologramEffectiveNA(lambda: number, N: number, dx: number, z: number): number {
  if (!(positive(lambda) && positive(dx))) return NaN;
  const na = hologramNA(N, dx, z);
  return Number.isFinite(na) ? Math.min(na, lambda / (2 * dx)) : NaN;
}

/** Largest object–reference angle the pixel pitch resolves, 2 arcsin(λ/(4Δx)), rad (Schnars & Jüptner 2002). */
export function maxInterferenceAngle(lambda: number, dx: number): number {
  if (!(positive(lambda) && positive(dx) && lambda <= 4 * dx)) return NaN;
  return 2 * Math.asin(lambda / (4 * dx));
}

/**
 * Shortest in-line (Gabor) recording distance Δx(NΔx + D)/λ, m: the interference of the object edge with the plane
 * reference at the far sensor edge, at the angle (NΔx + D)/(2z), then stays below the Nyquist frequency 1/(2Δx).
 * With D = 0 it is NΔx²/λ, where the Fresnel image pixel λz/(NΔx) equals Δx.
 */
export function inlineMinDistance(lambda: number, N: number, dx: number, objectSize: number): number {
  if (!(positive(lambda) && positive(N) && positive(dx) && objectSize >= 0)) return NaN;
  return (dx * (N * dx + objectSize)) / lambda;
}

/** Depth of focus λ/NA²: the defocus range ±λ/(2NA²) over which the quarter-wave Rayleigh criterion holds, m. */
export function depthOfFocus(lambda: number, NA: number): number {
  return positive(lambda) && positive(NA) ? lambda / (NA * NA) : NaN;
}

/** Fresnel number a²/(λz) of an aperture of half-width a at distance z. */
export function fresnelNumber(a: number, lambda: number, z: number): number {
  return a >= 0 && positive(lambda) && positive(z) ? (a * a) / (lambda * z) : NaN;
}

/** Largest SLM diffraction angle arcsin(λ/(2Δx)), rad; NaN when λ > 2Δx. */
export function slmMaxAngle(lambda: number, dx: number): number {
  if (!(positive(lambda) && positive(dx) && lambda <= 2 * dx)) return NaN;
  return Math.asin(lambda / (2 * dx));
}

/** Replay field λz/Δx at distance (or Fourier-lens focal length) z, m: one period of the replayed pattern. */
export function replayField(lambda: number, z: number, dx: number): number {
  return positive(lambda) && positive(z) && positive(dx) ? (lambda * z) / dx : NaN;
}

/** First-order efficiency sinc²(π/L) of a phase hologram quantised to L ≥ 2 equal levels (Swanson 1989). */
export function phaseQuantizationEfficiency(levels: number): number {
  if (!(Number.isFinite(levels) && levels >= 2)) return NaN;
  return sinc(Math.PI / levels) ** 2;
}

/** First-order efficiency 1/π² of a binary (0/1) amplitude hologram with a 50 % duty cycle. */
export const BINARY_AMPLITUDE_EFFICIENCY = 1 / (Math.PI * Math.PI);

/**
 * Pixel-aperture envelope sinc²(π a f) at spatial frequency f for a pixel of open width a = √F·Δx (F the area fill
 * factor). At the edge of the replay field, f = 1/(2Δx), it is sinc²(π√F/2): 4/π² = 0.405 for F = 1.
 */
export function pixelEnvelope(f: number, dx: number, fillFactor: number): number {
  if (!(Number.isFinite(f) && positive(dx) && fillFactor > 0 && fillFactor <= 1)) return NaN;
  return sinc(Math.PI * Math.sqrt(fillFactor) * dx * f) ** 2;
}
