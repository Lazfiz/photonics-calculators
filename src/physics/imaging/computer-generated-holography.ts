/**
 * Computer-generated-holography page summary: the replay geometry, efficiency and memory of a pixelated SLM in one
 * call. SI units in and out (m, rad, bytes). Moved out of the page so the page and its API schema share it; the
 * physics is in `holography.ts`.
 */
import {
  BINARY_AMPLITUDE_EFFICIENCY, fresnelReconstructionPitch, phaseQuantizationEfficiency, pixelEnvelope, replayField, slmMaxAngle,
} from "./holography";

/** Phase bit depths the page offers. */
export const BIT_DEPTHS = [1, 2, 3, 4, 6, 8, 10];

/** λ/(2Δx) above which the paraxial replay field λz/Δx is only approximate. */
export const PARAXIAL_SIN_LIMIT = 0.2;

export interface SlmInputs {
  lambda: number;
  /** Pixel pitch Δx, m. */
  pitch: number;
  /** Pixels along x and y. */
  nx: number;
  ny: number;
  /** Replay distance or Fourier-lens focal length, m. */
  z: number;
  /** Phase bit depth. */
  bits: number;
  /** Area fill factor 0 < F ≤ 1. */
  fill: number;
  amplitude: boolean;
}

export function slmReplaySummary(i: SlmInputs) {
  const { lambda, pitch: dx, nx, ny, z } = i;
  return {
    maxAngle: slmMaxAngle(lambda, dx),
    replayField: replayField(lambda, z, dx),
    spotX: fresnelReconstructionPitch(lambda, z, nx, dx),
    spotY: fresnelReconstructionPitch(lambda, z, ny, dx),
    angularResolution: lambda / (nx * dx),
    efficiency: i.amplitude ? BINARY_AMPLITUDE_EFFICIENCY : phaseQuantizationEfficiency(2 ** i.bits),
    /** Pixel envelope at the edge of the replay field, f = 1/(2Δx). */
    edgeEnvelope: pixelEnvelope(1 / (2 * dx), dx, i.fill),
    apertureX: nx * dx,
    apertureY: ny * dx,
    /** Hologram frame size, bytes (one bit per pixel for binary amplitude). */
    frameBytes: (nx * ny * (i.amplitude ? 1 : i.bits)) / 8,
    /**
     * A lensless Fresnel replay aliases on the SLM below max(Nx, Ny)·Δx²/λ, m: the chirp's local frequency
     * x/(λz) at the edge x = NΔx/2 must stay below 1/(2Δx) along both axes (Voelz & Roggemann 2009,
     * Appl. Opt. 48, 6132, critical sampling Δx = λz/L).
     */
    aliasDistance: (Math.max(nx, ny) * dx * dx) / lambda,
    /** λ/(2Δx), the sine of the largest angle. */
    sinMax: lambda / (2 * dx),
  };
}
