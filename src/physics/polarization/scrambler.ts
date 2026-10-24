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
 * E[M₃M₂M₁] = E_T[M₃ E[M₂] M₁] when stage 2 is free). Three stages can also be tied by a combination relation
 * n₁f₁ + n₂f₂ + n₃f₃ = 0 (e.g. f₁ + f₂ = f₃) with no low-order pairwise lock: the joint phase then stays on a 2-torus.
 * Writing each stage matrix as a Fourier series in its phase, M_k = Σ_m A_k,m e^(2πi m θ_k), only the terms with
 * (m₁, m₂, m₃) = j·n survive the long-time average, since ⟨e^(2πi (m·f) t)⟩ = 0 unless m·f = 0:
 * ⟨M₃M₂M₁⟩ = Σ_j A₃,jn₃ A₂,jn₂ A₁,jn₁ e^(i j n·φ). A finite averaging window is integrated numerically.
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

/**
 * Lowest-order relation n₁f₁ + n₂f₂ + n₃f₃ = 0 among exactly three stages with every n_k ≠ 0 and |n_k| ≤
 * LOCK_MAX_ORDER, to 1e-9 relative (n₁ > 0, coprime); null otherwise.
 */
export function combinationLock(stages: readonly ScramblerStage[]): [number, number, number] | null {
  if (stages.length !== 3) return null;
  const [f1, f2, f3] = stages.map((s) => s.frequency);
  if (!(f1 > 0 && f2 > 0 && f3 > 0)) return null;
  let best: [number, number, number] | null = null;
  const M = LOCK_MAX_ORDER;
  for (let a = 1; a <= M; a++) {
    for (let b = -M; b <= M; b++) {
      for (let c = -M; c <= M; c++) {
        if (b === 0 || c === 0 || gcd(gcd(a, Math.abs(b)), Math.abs(c)) !== 1) continue;
        if (best && a + Math.abs(b) + Math.abs(c) >= best[0] + Math.abs(best[1]) + Math.abs(best[2])) continue;
        if (Math.abs(a * f1 + b * f2 + c * f3) <= 1e-9 * (a * f1 + Math.abs(b) * f2 + Math.abs(c) * f3)) best = [a, b, c];
      }
    }
  }
  return best;
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
 * A locked pair plus a combination relation (combinationLock) locks the third stage too.
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
    let members = ratio.flatMap((r, k) => (r ? [k] : []));
    if (members.length < 2) continue;
    const rel = members.length === 2 ? combinationLock(stages) : null;
    if (rel) {
      // f_t = −(n_a f_a + n_b f_b)/n_t with f_a, f_b rational multiples of f_ref.
      const t = [0, 1, 2].find((k) => !ratio[k])!, [a, b] = members;
      const [ra, rb] = [ratio[a]!, ratio[b]!];
      let num = -(rel[a] * ra[0] * rb[1] + rel[b] * rb[0] * ra[1]), den = rel[t] * ra[1] * rb[1];
      if (den < 0) [num, den] = [-num, -den];
      const g = gcd(Math.abs(num), den);
      if (num > 0) {
        ratio[t] = [num / g, den / g];
        members = [0, 1, 2];
      }
    }
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
  if (!group) {
    const rel = combinationLock(stages);
    return rel ? combinationMean(stages, rel) : chainMueller(means);
  }
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

/** Fourier coefficients E_m and E_−m of e^(iΓ(θ)) over one drive cycle θ ∈ [0, 1), as [re_m, im_m, re_−m, im_−m]. */
function expRetardanceCoefficients(s: ScramblerStage, m: number): [number, number, number, number] {
  const cb = Math.cos(s.bias), sb = Math.sin(s.bias);
  if (s.waveform === "sine") {
    // Jacobi–Anger: e^(iΓm sin 2πθ) = Σ J_m(Γm) e^(2πimθ), J_−m = (−1)^m J_m (DLMF 10.12.2).
    const odd = m % 2 !== 0, jm = besselJ(Math.abs(m), s.amplitude) * (m < 0 && odd ? -1 : 1), jn = odd ? -jm : jm;
    return [jm * cb, jm * sb, jn * cb, jn * sb];
  }
  // ∫₀¹ e^(i(Γm − 2πm)u) du = (e^(iα) − 1)/(iα), α = Γm − 2πm.
  const coefficient = (mm: number) => {
    const alpha = s.amplitude - 2 * Math.PI * mm;
    const [re, im] = Math.abs(alpha) < 1e-12 ? [1, 0] : [Math.sin(alpha) / alpha, (1 - Math.cos(alpha)) / alpha];
    return [re * cb - im * sb, re * sb + im * cb];
  };
  const [a, b] = coefficient(m), [c, d] = coefficient(-m);
  return [a, b, c, d];
}

/** Terms per side of the ramp lattice sum; |A_m| ~ 1/(π|m|), so the terms fall as 1/j³ (13/17/30 kHz, Γm 5: 1e-10 from 4000). */
const RAMP_LATTICE_TERMS = 100;

/**
 * Long-time average of three stages under the combination relation n (header): Σ_j A₃,jn₃ A₂,jn₂ A₁,jn₁ e^(i j n·φ),
 * where A_m = δ_m0 P + C_m (Q − P) + S_m (R − P), M = retarderFromCosSin(cos Γ, sin Γ) being affine with P, Q, R its
 * values at (0, 0), (1, 0), (0, 1), and C_m = (E_m + E*_−m)/2, S_m = (E_m − E*_−m)/2i the coefficients of cos Γ, sin Γ.
 * The j and −j terms are conjugate. Sine stages: J_m(Γm) is negligible for |m| > Γm + 3Γm^⅓ + 10, which bounds j;
 * all ramps: `rampTerms`.
 */
export function combinationMean(
  stages: readonly ScramblerStage[], n: readonly number[], rampTerms = RAMP_LATTICE_TERMS,
): MuellerMatrix {
  const bounds = stages.flatMap((s, k) => {
    const a = Math.abs(s.amplitude);
    return s.waveform === "sine" ? [Math.ceil((a + 3 * Math.cbrt(a) + 10) / Math.abs(n[k]))] : [];
  });
  const J = bounds.length ? Math.min(...bounds) : rampTerms;
  const basis = stages.map((s) => {
    const P = retarderFromCosSin(0, 0, s.axis).flat(), Q = retarderFromCosSin(1, 0, s.axis).flat();
    const R = retarderFromCosSin(0, 1, s.axis).flat();
    return { P, dQ: Q.map((q, i) => q - P[i]), dR: R.map((r, i) => r - P[i]) };
  });
  const phase = stages.reduce((sum, s, k) => sum + n[k] * (s.phase ?? 0), 0);
  const out = new Array<number>(16).fill(0);
  const aRe = new Array<number>(16), aIm = new Array<number>(16);
  let pRe = new Array<number>(16), pIm = new Array<number>(16), qRe = new Array<number>(16), qIm = new Array<number>(16);
  for (let j = 0; j <= J; j++) {
    for (let k = 0; k < stages.length; k++) {
      const m = j * n[k], { P, dQ, dR } = basis[k];
      const [ep, eq, fp, fq] = expRetardanceCoefficients(stages[k], m);
      const cRe = (ep + fp) / 2, cIm = (eq - fq) / 2, sRe = (eq + fq) / 2, sIm = (fp - ep) / 2;
      for (let i = 0; i < 16; i++) {
        aRe[i] = (m === 0 ? P[i] : 0) + cRe * dQ[i] + sRe * dR[i];
        aIm[i] = cIm * dQ[i] + sIm * dR[i];
      }
      if (k === 0) {
        pRe = aRe.slice();
        pIm = aIm.slice();
        continue;
      }
      // p ← a·p (element 1 first, so later stages multiply on the left).
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          let re = 0, im = 0;
          for (let x = 0; x < 4; x++) {
            const ar = aRe[4 * r + x], ai = aIm[4 * r + x], br = pRe[4 * x + c], bi = pIm[4 * x + c];
            re += ar * br - ai * bi;
            im += ar * bi + ai * br;
          }
          qRe[4 * r + c] = re;
          qIm[4 * r + c] = im;
        }
      }
      [pRe, qRe] = [qRe, pRe];
      [pIm, qIm] = [qIm, pIm];
    }
    const w = j === 0 ? 1 : 2, c = Math.cos(j * phase), sn = Math.sin(j * phase);
    for (let i = 0; i < 16; i++) out[i] += w * (pRe[i] * c - pIm[i] * sn);
  }
  return [0, 1, 2, 3].map((r) => out.slice(4 * r, 4 * r + 4));
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

export interface CombinationResonance {
  /** Orders n_k, all ≠ 0, with n₁f₁ + n₂f₂ + n₃f₃ ≈ 0 (n₁ > 0). */
  orders: [number, number, number];
  /** 1/|n·f|, s; Infinity for an exact relation. */
  beatPeriod: number;
}

/**
 * Lowest-order near-relation among three stage frequencies with every order nonzero (e.g. f₁ + f₂ ≈ f₃): coprime n
 * with Σ|n_k| ≤ maxTotalOrder and |n·f| ≤ tol·max|n_k f_k|. Its weight is a product of three harmonic amplitudes
 * (J_|n_k|(Γm_k) for sines), so only the lowest total orders are flagged: the page defaults 1, √2, √5 kHz sit 6.6 Hz
 * from 2f₁ − 3f₂ + f₃ = 0 (order 6), and locking them there exactly leaves their long-time DOP at 0. As for
 * stageResonance, the long-time average (an exact relation: combinationLock) holds only for averaging times much longer
 * than the beat period. Null when none is close.
 */
export function combinationResonance(freqs: readonly number[], maxTotalOrder = 5, tol = 0.01): CombinationResonance | null {
  if (freqs.length !== 3) return null;
  let best: CombinationResonance | null = null, bestOrder = Infinity;
  const M = maxTotalOrder;
  for (let a = 1; a <= M; a++) {
    for (let b = -M; b <= M; b++) {
      for (let c = -M; c <= M; c++) {
        const order = a + Math.abs(b) + Math.abs(c);
        if (b === 0 || c === 0 || order > M || order >= bestOrder || gcd(gcd(a, Math.abs(b)), Math.abs(c)) !== 1) continue;
        const beat = Math.abs(a * freqs[0] + b * freqs[1] + c * freqs[2]);
        const scale = Math.max(Math.abs(a * freqs[0]), Math.abs(b * freqs[1]), Math.abs(c * freqs[2]));
        if (!(beat <= tol * scale)) continue;
        best = { orders: [a, b, c], beatPeriod: beat > 0 ? 1 / beat : Infinity };
        bestOrder = order;
      }
    }
  }
  return best;
}
