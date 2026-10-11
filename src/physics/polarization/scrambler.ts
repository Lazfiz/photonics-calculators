/**
 * Retarder-based polarization scrambler: a cascade of linear retarders (fast axes θ_k, element 1 first) whose
 * retardances are driven in time, Γ_k(t) = Γ0_k + Γm_k w(f_k t). A slow detector sees the time-averaged Stokes
 * vector; the residual degree of polarization (DOP) of that average measures the scrambling. Angles in rad,
 * frequencies in Hz, times in s. Sign convention and element matrices as in mueller.ts (Goldstein/Collett).
 *
 * The retarder matrix is affine in cos Γ and sin Γ (mueller.ts, retarderFromCosSin), so one stage averages exactly:
 *   - sine drive, w = sin 2πft: ⟨cos Γ⟩ = J₀(Γm) cos Γ0, ⟨sin Γ⟩ = J₀(Γm) sin Γ0 (Jacobi–Anger expansion,
 *     DLMF 10.12.2, https://dlmf.nist.gov/10.12); J₀ = 0 at Γm = 2.4048 rad scrambles light at 45° to the axis completely;
 *   - ramp (sawtooth), w = frac(ft) sweeping Γ over [Γ0, Γ0 + Γm]: ⟨cos Γ⟩ = (sin(Γ0 + Γm) − sin Γ0)/Γm,
 *     ⟨sin Γ⟩ = (cos Γ0 − cos(Γ0 + Γm))/Γm; zero when Γm is a whole number of waves.
 * A stage keeps the Stokes component along its eigen-axis on the Poincaré sphere, so one stage cannot scramble an
 * input on that axis; two stages with axes 45° apart (orthogonal on the sphere) can scramble any input. For the long-
 * time limit of a cascade the stage phases must be independent (incommensurate frequencies); the average of the
 * product is then the product of the averages. A finite averaging window is integrated numerically.
 */
import { besselJ, largestSymmetricEigenvalue } from "../math";
import { type MuellerMatrix, applyMueller, chainMueller, muellerRetarder, retarderFromCosSin } from "./mueller";
import { type Stokes, degreeOfPolarization } from "./stokes";

export type DriveWaveform = "sine" | "ramp";

export interface ScramblerStage {
  /** Fast-axis azimuth, rad. */
  axis: number;
  /** Retardance bias Γ0, rad. */
  bias: number;
  /** Drive amplitude Γm, rad (sine: peak; ramp: total sweep). */
  amplitude: number;
  /** Drive frequency, Hz. */
  frequency: number;
  waveform: DriveWaveform;
}

/** Retardance of a stage at time t. */
export function stageRetardance(s: ScramblerStage, t: number): number {
  const phase = s.frequency * t;
  return s.waveform === "sine"
    ? s.bias + s.amplitude * Math.sin(2 * Math.PI * phase)
    : s.bias + s.amplitude * (phase - Math.floor(phase));
}

/** ⟨cos Γ⟩ and ⟨sin Γ⟩ of a stage over whole drive periods (closed forms above). */
export function stageMeanCosSin(s: ScramblerStage): { meanCos: number; meanSin: number } {
  if (s.waveform === "sine") {
    const j0 = besselJ(0, s.amplitude);
    return { meanCos: j0 * Math.cos(s.bias), meanSin: j0 * Math.sin(s.bias) };
  }
  const a = s.amplitude, b = s.bias;
  if (Math.abs(a) < 1e-9) return { meanCos: Math.cos(b), meanSin: Math.sin(b) };
  return { meanCos: (Math.sin(b + a) - Math.sin(b)) / a, meanSin: (Math.cos(b) - Math.cos(b + a)) / a };
}

/** Time-averaged Mueller matrix of one stage. */
export function stageMeanMueller(s: ScramblerStage): MuellerMatrix {
  const { meanCos, meanSin } = stageMeanCosSin(s);
  return retarderFromCosSin(meanCos, meanSin, s.axis);
}

/** Long-time-averaged Mueller matrix of the cascade (independent stage phases), element 1 first. */
export function scramblerMeanMueller(stages: readonly ScramblerStage[]): MuellerMatrix {
  return chainMueller(stages.map(stageMeanMueller));
}

/** Instantaneous output Stokes vector at time t. */
export function scramblerOutput(stages: readonly ScramblerStage[], input: Stokes, t: number): Stokes {
  let S = input;
  for (const s of stages) S = applyMueller(muellerRetarder(stageRetardance(s, t), s.axis), S);
  return S;
}

/** Most samples one call of residualDopVsTime may take. */
export const MAX_SAMPLES = 400_000;

/**
 * Residual DOP of the output averaged over [0, T] for each T in `windows` (ascending, > 0), all stages starting at
 * phase 0. One midpoint-rule pass of N = min(MAX_SAMPLES, max(4000, 64 f_max T_max)) steps; a window ends at the
 * nearest step, so windows shorter than 4 steps return NaN. Error ≲ 1/(samples per fastest period)².
 */
export function residualDopVsTime(
  stages: readonly ScramblerStage[], input: Stokes, windows: readonly number[],
): number[] {
  const Tmax = windows[windows.length - 1];
  const fmax = Math.max(0, ...stages.map((s) => Math.abs(s.frequency)));
  if (!(Tmax > 0) || !Number.isFinite(Tmax * fmax)) return windows.map(() => NaN);
  const N = Math.min(MAX_SAMPLES, Math.max(4000, Math.ceil(64 * fmax * Tmax)));
  const dt = Tmax / N;
  const out: number[] = [];
  const acc = [0, 0, 0, 0];
  // scramblerOutput without allocations: the rows of retarderFromCosSin applied to (S₁, S₂, S₃) in place.
  const axes = stages.map((st) => [Math.cos(2 * st.axis), Math.sin(2 * st.axis)]);
  let w = 0, n = 0;
  for (let i = 0; i < N && w < windows.length; i++) {
    const t = (i + 0.5) * dt;
    let s1 = input[1], s2 = input[2], s3 = input[3];
    for (let k = 0; k < stages.length; k++) {
      const g = stageRetardance(stages[k], t), cd = Math.cos(g), sd = Math.sin(g), [c, s] = axes[k];
      const a1 = (c * c + s * s * cd) * s1 + c * s * (1 - cd) * s2 - s * sd * s3;
      const a2 = c * s * (1 - cd) * s1 + (s * s + c * c * cd) * s2 + c * sd * s3;
      s3 = s * sd * s1 - c * sd * s2 + cd * s3;
      s1 = a1;
      s2 = a2;
    }
    acc[0] += input[0];
    acc[1] += s1;
    acc[2] += s2;
    acc[3] += s3;
    n++;
    while (w < windows.length && (i + 1) * dt >= windows[w] - dt / 2) {
      const mean = acc.map((v) => v / n) as Stokes;
      out.push(n < 4 ? NaN : degreeOfPolarization(mean));
      w++;
    }
  }
  while (out.length < windows.length) out.push(NaN);
  return out;
}

/**
 * Residual DOP of the long-time average for the worst fully polarized input: the cascade has no diattenuation, so the
 * output DOP of a unit input s is |m s| with m the lower-right 3×3 block, and its maximum is √λ_max(mᵀm).
 */
export function worstCaseResidualDop(stages: readonly ScramblerStage[]): number {
  const M = scramblerMeanMueller(stages);
  const m = [1, 2, 3].map((i) => [1, 2, 3].map((j) => M[i][j]));
  const mtm: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) mtm.push(m[0][i] * m[0][j] + m[1][i] * m[1][j] + m[2][i] * m[2][j]);
  return Math.sqrt(Math.max(0, largestSymmetricEigenvalue(mtm)));
}

export interface StageResonance {
  /** Stage indices, i < j. */
  i: number;
  j: number;
  /** Harmonic orders with q·f_i ≈ p·f_j. */
  p: number;
  q: number;
  /** 1/|q f_i − p f_j|, s; Infinity for an exact ratio. */
  beatPeriod: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Lowest-order near-resonance between two stage frequencies: coprime p, q ≤ maxOrder with |q f_i − p f_j| ≤ tol·q f_i.
 * The drive harmonics n·f carry weights J_n(Γm) (sine) or ~1/n (ramp), so low orders matter most. At a resonance the
 * stage phases lock, and the product of stage means (scramblerMeanMueller) holds only for averaging times much longer
 * than the beat period. Null when no pair is that close.
 */
export function stageResonance(freqs: readonly number[], maxOrder = 4, tol = 0.01): StageResonance | null {
  let best: StageResonance | null = null;
  for (let i = 0; i < freqs.length; i++) {
    for (let j = i + 1; j < freqs.length; j++) {
      for (let q = 1; q <= maxOrder; q++) {
        for (let p = 1; p <= maxOrder; p++) {
          if (gcd(p, q) !== 1) continue;
          const beat = Math.abs(q * freqs[i] - p * freqs[j]);
          if (!(beat <= tol * q * Math.abs(freqs[i]))) continue;
          if (!best || p + q < best.p + best.q) best = { i, j, p, q, beatPeriod: beat > 0 ? 1 / beat : Infinity };
        }
      }
    }
  }
  return best;
}
