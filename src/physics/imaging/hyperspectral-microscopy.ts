/**
 * Summary of the hyperspectral-microscopy page: data-cube size, acquisition time and per-band SNR of a band-sequential
 * acquisition of a flat spectrum. Wavelengths in nm and the spectral flux in photons/pixel/s/nm (as the page shows
 * them); times in s. Model tier: textbook.
 *
 *   V = N_x N_y N_λ bits N_frames / 8 bytes (1 MiB = 2²⁰ bytes, IEC 80000-13), T = N_frames N_λ t,
 *   Δλ = (λ_max − λ_min)/N_λ, S = Φ_λ Δλ t QE electrons per band and frame,
 *   SNR = √N_frames · S/√(S + I_dark t + σ_read²)  (J. R. Janesick, Photon Transfer, SPIE 2007, doi:10.1117/3.725073;
 *   summing n frames gives signal n·S and variance n(S + D + σ_r²)).
 */
import { cameraSnr } from "../detectors/camera-snr";

export const BYTES_PER_MIB = 1024 * 1024;
/** Bit depths the page offers. */
export const HYPERSPECTRAL_BIT_DEPTHS = [8, 10, 12, 14, 16] as const;

export interface HyperspectralInputs {
  start_nm: number;
  end_nm: number;
  bands: number;
  /** Pixels per side of the square image. */
  pixels: number;
  bitDepth: number;
  exposure_s: number;
  frames: number;
  compression: number;
  /** Spectral photon flux, photons/pixel/s/nm. */
  flux: number;
  /** Quantum efficiency as a fraction. */
  qe: number;
  /** Read noise, e⁻ rms. */
  readNoise: number;
  /** Dark current, e⁻/pixel/s. */
  dark: number;
}

/** SNR of one band, `nFrames` frames summed; `bandwidth_nm` wide, `t` s exposure. */
export function hyperspectralBandSnr(
  i: Pick<HyperspectralInputs, "flux" | "qe" | "readNoise" | "dark">, bandwidth_nm: number, t: number, nFrames = 1,
): number {
  const S = i.flux * bandwidth_nm * t * i.qe;
  return Math.sqrt(nFrames) * cameraSnr({ signal: S, read: i.readNoise, dark: i.dark * t });
}

/** Raw data size in bytes of `frames` cubes of `pixels`² × `bands` samples, bit-packed. */
export function hyperspectralBytes(pixels: number, bands: number, bitDepth: number, frames: number): number {
  return (pixels * pixels * bands * bitDepth * frames) / 8;
}

export function hyperspectralSummary(i: HyperspectralInputs) {
  const bandwidth_nm = (i.end_nm - i.start_nm) / i.bands;
  const bytes = hyperspectralBytes(i.pixels, i.bands, i.bitDepth, i.frames);
  const sizeMiB = bytes / BYTES_PER_MIB;
  const totalTime = i.frames * i.bands * i.exposure_s;
  return {
    bandwidth_nm,
    sizeMiB,
    cubeMiB: sizeMiB / i.frames,
    totalTime,
    signal: i.flux * bandwidth_nm * i.exposure_s * i.qe,
    snrFrame: hyperspectralBandSnr(i, bandwidth_nm, i.exposure_s),
    snrSum: hyperspectralBandSnr(i, bandwidth_nm, i.exposure_s, i.frames),
    compressedMiB: sizeMiB / i.compression,
    dataRate: sizeMiB / totalTime,
  };
}
