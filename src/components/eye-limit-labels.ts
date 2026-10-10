import type { EyeLimitKind } from "../physics/laser-safety/eye-exposure-limits";

/** Display names of the ICNIRP eye limits (`eye-exposure-limits.ts`). */
export const LIMIT_LABELS: Record<EyeLimitKind, string> = {
  cornealUv: "Cornea (UV)",
  retinalThermal: "Retina, thermal",
  retinalPhotochemical: "Retina, photochemical (blue light)",
  anteriorSegment: "Anterior eye (2 × skin limit)",
  cornealIr: "Cornea (IR)",
};

export const LIMIT_COLORS: Record<EyeLimitKind, string> = {
  cornealUv: "#c084fc",
  retinalThermal: "#60a5fa",
  retinalPhotochemical: "#a78bfa",
  anteriorSegment: "#34d399",
  cornealIr: "#fbbf24",
};

/** A duration in s as ns / µs / ms / s; Infinity is "> 30 000 s", NaN "< 1 ns". */
export function fmtTime(t: number): string {
  if (t === Infinity) return "> 30 000 s (8.3 h)";
  if (Number.isNaN(t)) return "< 1 ns";
  if (t < 1e-6) return (t * 1e9).toPrecision(3) + " ns";
  if (t < 1e-3) return (t * 1e6).toPrecision(3) + " µs";
  if (t < 1) return (t * 1e3).toPrecision(3) + " ms";
  return (t >= 100 ? t.toFixed(0) : t.toPrecision(3)) + " s";
}

/** Three significant figures, exponential outside 0.01 – 10⁵; "—" for a non-finite value. */
export const fmtNum = (x: number) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : x >= 1e5 || x < 1e-2 ? x.toExponential(2) : x >= 100 ? x.toFixed(0) : x.toPrecision(3);

/** A power in W as W / mW / µW / nW. */
export function fmtPower(w: number): string {
  if (!Number.isFinite(w)) return "—";
  if (w >= 1 || w === 0) return `${fmtNum(w)} W`;
  if (w >= 1e-3) return `${fmtNum(w * 1e3)} mW`;
  if (w >= 1e-6) return `${fmtNum(w * 1e6)} µW`;
  return `${fmtNum(w * 1e9)} nW`;
}

/** The (x, y) pairs with a finite, positive y, for log-axis charts. */
export function finiteXY(xs: readonly number[], ys: readonly number[]): { x: number[]; y: number[] } {
  const keep = ys.map((y) => Number.isFinite(y) && y > 0);
  return { x: xs.filter((_, i) => keep[i]), y: ys.filter((_, i) => keep[i]) };
}

/**
 * Line traces for the runs of finite, positive y, so a gap breaks the line (SimpleChart joins across skipped points).
 * Only the first run carries the legend name.
 */
export function segmentedLine(xs: readonly number[], ys: readonly number[], name: string, line: Record<string, unknown>): Record<string, unknown>[] {
  const runs: { x: number[]; y: number[] }[] = [];
  let run: { x: number[]; y: number[] } | null = null;
  ys.forEach((y, i) => {
    if (!(Number.isFinite(y) && y > 0)) {
      run = null;
      return;
    }
    if (!run) {
      run = { x: [], y: [] };
      runs.push(run);
    }
    run.x.push(xs[i]);
    run.y.push(y);
  });
  return runs.map((r, i) => ({ ...r, type: "scatter", mode: "lines", line, ...(i === 0 ? { name } : {}) }));
}

/** An energy in J as J / mJ / µJ / nJ. */
export function fmtEnergy(j: number): string {
  return fmtPower(j).replace(/W$/, "J");
}
