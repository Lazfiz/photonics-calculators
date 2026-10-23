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
 * input on that axis; two stages with axes 45° apart (orthogonal on the sphere) can scramble any input. When the stage
 * frequencies are incommensurate the stage phases are independent over a long time, and the average of the product is
 * the product of the averages. When two or three frequencies are locked (q·f_i = p·f_j exactly, p, q ≤ LOCK_MAX_ORDER)
 * their phases are not independent: the joint drive repeats with the common period T (f_k T a whole number for each
 * locked stage), and the long-time average is the average over one T, which depends on the drive phases. That average
 * is integrated numerically; unlocked stages enter it through their closed-form means (the stages are independent, so
 * E[M₃M₂M₁] = E_T[M₃ E[M₂] M₁] when stage 2 is free). A finite averaging window is integrated numerically.
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
  /** Drive phase φ, rad (sine: Γm sin(2πft + φ); ramp: w = frac(ft + φ/2π)); 0 when absent. */
  phase?: number;
}

/** Retardance of a stage at time t. */
export function stageRetardance(s: ScramblerStage, t: number): number {
  const cycles = s.frequency * t + (s.phase ?? 0) / (2 * Math.PI);
  return s.waveform === "sine"
    ? s.bias + s.amplitude * Math.sin(2 * Math.PI * cycles)
    : s.bias + s.amplitude * (cycles - Math.floor(cycles));
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

/** Highest harmonic order p, q at which lockedGroup treats two frequencies as locked, q·f_i = p·f_j. */
export const LOCK_MAX_ORDER = 12;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Coprime [p, q], p, q ≤ LOCK_MAX_ORDER, with q·fi = p·fj to 1e-9 relative, or null. */
function lockRatio(fi: number, fj: number): [number, number] | null {
  if (!(fi > 0 && fj > 0)) return null;
  for (let q = 1; q <= LOCK_MAX_ORDER; q++) {
    for (let p = 1; p <= LOCK_MAX_ORDER; p++) {
      if (gcd(p, q) === 1 && Math.abs(q * fi - p * fj) <= 1e-9 * q * fi) return [p, q];
    }
  }
  return null;
}

export interface LockedGroup {
  /** Indices of the locked stages, ascending. */
  members: number[];
  /** Whole number of drive periods of each member in one common period (same order as members). */
  harmonics: number[];
  /** Common period T, s: harmonics[k] / f of member k. */
  period: number;
}

/**
 * The stages whose frequencies are locked to each other (connected through ratios with p, q ≤ LOCK_MAX_ORDER), with
 * their common period; null when no two stages are locked. With at most three stages there is at most one such set.
 */
export function lockedGroup(stages: readonly ScramblerStage[]): LockedGroup | null {
  for (let ref = 0; ref < stages.length; ref++) {
    // ratio[k] = f_k / f_ref as [numerator, denominator], filled by a breadth-first search from ref.
    const ratio: ([number, number] | null)[] = stages.map(() => null);
    ratio[ref] = [1, 1];
    const queue = [ref];
    while (queue.length) {
      const i = queue.shift()!;
      for (let j = 0; j < stages.length; j++) {
        const r = ratio[j] ? null : lockRatio(stages[i].frequency, stages[j].frequency);
        if (!r) continue;
        const a = ratio[i]![0] * r[1], b = ratio[i]![1] * r[0], g = gcd(a, b); // q f_i = p f_j, so f_j = (q/p) f_i
        ratio[j] = [a / g, b / g];
        queue.push(j);
      }
    }
    const members = ratio.flatMap((r, k) => (r ? [k] : []));
    if (members.length < 2) continue;
    // With L = lcm(b_k), f_k = (a_k/b_k) f_ref is the harmonic a_k L/b_k of f_ref/L.
    const L = members.reduce((l, k) => (l * ratio[k]![1]) / gcd(l, ratio[k]![1]), 1);
    const raw = members.map((k) => (ratio[k]![0] * L) / ratio[k]![1]);
    const g = raw.reduce(gcd);
    const harmonics = raw.map((h) => h / g);
    return { members, harmonics, period: harmonics[0] / stages[members[0]].frequency };
  }
  return null;
}

/**
 * Long-time-averaged Mueller matrix of the cascade, element 1 first: the product of stage means when no frequencies
 * are locked, else the average over the common period of the locked stages (header). Sine drives: the integrand is
 * periodic and analytic, so the trapezoid rule converges geometrically once its N points exceed the harmonic content;
 * stage k spans harmonics up to ≈ n_k(Γm + 3Γm^⅓) of 1/T (J_m(Γm) is negligible beyond), and N = 2Σ n_k(Γm + 3Γm^⅓ + 10)
 * + 32 agrees with brute force to 1e-12. Ramp drives: composite Simpson on the pieces between flybacks, 8 panels per
 * radian swept by the locked stages together (≥ 16 per piece); within 1e-7 of brute force.
 */
export function scramblerMeanMueller(stages: readonly ScramblerStage[]): MuellerMatrix {
  const means = stages.map(stageMeanMueller);
  const group = lockedGroup(stages);
  if (!group) return chainMueller(means);
  const T = group.period;
  const locked = stages.map((_, k) => group.members.includes(k));
  const at = (t: number) =>
    chainMueller(stages.map((s, k) => (locked[k] ? muellerRetarder(stageRetardance(s, t), s.axis) : means[k])));
  const acc = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
  const add = (M: MuellerMatrix, w: number) => {
    for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) acc[r][q] += w * M[r][q];
  };
  if (group.members.every((k) => stages[k].waveform === "sine")) {
    const N = 32 + 2 * Math.ceil(group.members.reduce((sum, k, i) => {
      const a = Math.abs(stages[k].amplitude);
      return sum + group.harmonics[i] * (a + 3 * Math.cbrt(a) + 10);
    }, 0));
    for (let i = 0; i < N; i++) add(at((i * T) / N), 1 / N);
    return acc;
  }
  const cuts = [0, T];
  for (const k of group.members) {
    // Flybacks where f t + φ/2π is a whole number.
    const s = stages[k], offset = (s.phase ?? 0) / (2 * Math.PI);
    for (let m = Math.ceil(offset); (m - offset) / s.frequency < T; m++) {
      const t = (m - offset) / s.frequency;
      if (t > 0) cuts.push(t);
    }
  }
  cuts.sort((a, b) => a - b);
  // Retardance sweep rate bound, rad per unit f·t: Γm for a ramp, 2π·Γm for a sine.
  const rate = group.members.reduce((r, k) => r + Math.abs(stages[k].amplitude * stages[k].frequency) * (stages[k].waveform === "sine" ? 2 * Math.PI : 1), 0);
  for (let c = 0; c + 1 < cuts.length; c++) {
    const a = cuts[c], b = cuts[c + 1];
    if (!(b - a > 1e-12 * T)) continue;
    const panels = 2 * Math.ceil(Math.max(8, 4 * rate * (b - a)));
    const h = (b - a) / panels;
    for (let i = 0; i <= panels; i++) {
      // The end samples sit just inside the piece, on the side of a ramp flyback that the piece covers.
      const t = i === 0 ? a + 1e-9 * h : i === panels ? b - 1e-9 * h : a + i * h;
      add(at(t), ((i === 0 || i === panels ? 1 : i % 2 ? 4 : 2) * h) / (3 * T));
    }
  }
  return acc;
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
 * Residual DOP of the output averaged over [0, T] for each T in `windows` (ascending, > 0), each stage starting at
 * its drive phase φ. One midpoint-rule pass of N = min(MAX_SAMPLES, max(4000, 64 f_max T_max)) steps; a window ends at the
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
