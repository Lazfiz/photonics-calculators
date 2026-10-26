/**
 * Axis and trace helpers shared by the SVG charts (`SimpleChart`, `SimpleLineChart`). Pure functions: the charts lay
 * out in real pixels (the container's measured width), so tick counts and margins come from the pixel size.
 */

/** Smallest value a log axis maps; it only guards log10 against 0 or negatives (data ≤ 0 is skipped on log axes). */
export const LOG_FLOOR = 1e-300;

/** Trace colours in order (Plotly-like), indexed by the trace's position in the chart. */
export const PALETTE = ["#60a5fa", "#f97316", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#eab308", "#ec4899"];

/** Tick and legend label font size in px (the UI rule's minimum). */
export const TICK_FONT = 11;

/** SVG stroke-dasharray for a Plotly `line.dash` name. */
export function dashArray(dash?: string): string | undefined {
  if (dash === "dash") return "6,3";
  if (dash === "dot") return "2,2";
  if (dash === "dashdot") return "6,3,2,3";
  if (dash === "longdash") return "10,5";
  return undefined;
}

/**
 * Axis ticks over [min, max]. Linear: about `count` ticks at a step of 1, 2, 5 or 10 × 10^k (the first
 * not below (max − min)/count), each computed as k·step so rounding doesn't accumulate. Log: the decades,
 * plus 2× and 5× when the axis spans at most min(4, count − 2) decades (a narrow axis keeps the decades only).
 */
export function niceTicks(min: number, max: number, count: number, log: boolean): number[] {
  if (log) {
    const lo = Math.ceil(Math.log10(Math.max(min, LOG_FLOOR)));
    const hi = Math.floor(Math.log10(Math.max(max, LOG_FLOOR)));
    const minors = hi - lo <= Math.min(4, count - 2);
    const ticks: number[] = [];
    // From the decade below lo, so a range starting mid-decade (180 → 20 000) still gets its 200 and 500.
    for (let p = lo - 1; p <= hi; p++) {
      if (p >= lo) ticks.push(Math.pow(10, p));
      if (minors) { ticks.push(2 * Math.pow(10, p)); ticks.push(5 * Math.pow(10, p)); }
    }
    return ticks.filter(t => t >= min * 0.9 && t <= max * 1.1);
  }
  const range = max - min;
  if (range <= 0 || !isFinite(range)) return [];
  const rough = range / count;
  if (rough <= 0 || !isFinite(rough)) return [];
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = ([1, 2, 5, 10].find(n => n * mag >= rough) ?? 10) * mag;
  const ticks: number[] = [];
  // 1e-9 of a step absorbs rounding at the ends (3 × 1e-15 > 3e-15).
  const tol = step * 1e-9;
  for (let k = Math.ceil((min - tol) / step); k * step <= max + tol && ticks.length < 100; k++) ticks.push(k * step || 0); // || 0: no −0
  return ticks;
}

/**
 * How many ticks an axis of `px` pixels holds: one per `spacing` px, 3 to 8. With the default spacings a 620 px
 * desktop plot gets the 6 ticks the charts always had, and a 250 px phone plot 3.
 */
export function tickCount(px: number, spacing: number): number {
  return Math.min(8, Math.max(3, Math.round(px / spacing)));
}

/**
 * Tick label with as many digits as the axis step needs, so neighbours never print the same: k/M only
 * when the step is ≥ 100 / 1e5 (steps are 1, 2 or 5 × 10^k, so one decimal then suffices), else the
 * decimals of the step; exponents below 0.01. `ticks` are the axis's ticks (log axes: steps vary).
 */
export function formatTick(v: number, ticks: readonly number[]): string {
  const step = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : NaN;
  const linear = ticks.length < 3 || Math.abs(ticks[2] - ticks[1] - (ticks[1] - ticks[0])) <= 1e-9 * step;
  if (!linear || !(step > 0)) {
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + "k";
    if (Math.abs(v) < 0.01 && v !== 0) return v.toExponential(1);
    return Number.isInteger(v) ? v.toString() : v.toFixed(2);
  }
  if (Math.abs(v) >= 1e6 && step >= 1e5) return (v / 1e6).toFixed(1) + "M";
  if (Math.abs(v) >= 1e3 && step >= 100) return (v / 1e3).toFixed(1) + "k";
  if (v === 0) return "0";
  const decade = (x: number) => Math.floor(Math.log10(x) + 1e-9);
  if (step < 0.01) return v.toExponential(Math.max(0, decade(Math.abs(v)) - decade(step)));
  return v.toFixed(Math.max(0, -decade(step)));
}

/** Estimated rendered width of a label in px (≈ 0.6 em per character in the UI sans font; errs wide). */
export function labelWidth(text: string, fontSize = TICK_FONT): number {
  return text.length * fontSize * 0.6;
}

/**
 * The smallest stride (label every 1st, 2nd, 3rd … tick) at which centred labels at pixel `positions` with
 * `widths` don't overlap, keeping `gap` px between neighbours. Gridlines stay on every tick; only labels thin.
 */
export function labelStride(positions: readonly number[], widths: readonly number[], gap = 6): number {
  for (let stride = 1; stride < positions.length; stride++) {
    let fits = true;
    for (let i = stride; i < positions.length && fits; i += stride) {
      fits = Math.abs(positions[i] - positions[i - stride]) >= (widths[i] + widths[i - stride]) / 2 + gap;
    }
    if (fits) return stride;
  }
  return Math.max(1, positions.length);
}

/**
 * Splits a trace's points into the runs a line connects. A `null` entry is a gap (missing value, non-finite
 * value, or ≤ 0 on a log axis): the line breaks there, as Plotly's default `connectgaps: false` does.
 * With `connect` the gaps are skipped and the line joins across them.
 */
export function splitAtGaps<T>(points: readonly (T | null)[], connect = false): T[][] {
  const runs: T[][] = [];
  let run: T[] = [];
  for (const p of points) {
    if (p !== null) run.push(p);
    else if (!connect && run.length > 0) { runs.push(run); run = []; }
  }
  if (run.length > 0) runs.push(run);
  return runs;
}

/**
 * A plotted value as a finite number, or null for a gap. `null`, `undefined` and "" are gaps (`Number(null)` is 0,
 * which drew missing values on the zero line), as are non-finite values and, on a log axis, values ≤ 0.
 */
export function plotValue(v: unknown, log: boolean): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && (!log || n > 0) ? n : null;
}

/**
 * The x categories in order of first appearance, or null for a numeric axis. As in Plotly's axis autotype, the axis is
 * categorical when `xaxis.type` is "category" or an x value is a string that isn't a number ("S₁", "Germanium");
 * numeric strings such as "10" stay numeric.
 */
export function xCategories(data: readonly { x?: readonly (number | string)[] }[], xaxisType?: unknown): string[] | null {
  const xs = data.flatMap((t) => (t.x ?? []).slice(0, 10000));
  if (xaxisType !== "category" && !xs.some((v) => typeof v === "string" && !Number.isFinite(Number(v)))) return null;
  return [...new Set(xs.map(String))];
}

/**
 * A data value as the hover readout shows it: 5 significant digits, trailing zeros dropped, exponent notation outside
 * [10⁻³, 10⁵) ("1.2346e5", "3e-7"). Ticks only need the digits their step needs (`formatTick`); a readout shows the value.
 */
export function formatValue(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const r = Number(v.toPrecision(5));
  if (r !== 0 && (Math.abs(r) >= 1e5 || Math.abs(r) < 1e-3)) return r.toExponential().replace("e+", "e");
  return String(r);
}

/** One trace as CSV columns; values are written at full precision, gaps (null, non-finite) as empty cells. */
export type CsvSeries = { name: string; x: readonly unknown[]; y: readonly unknown[] };

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * The plotted data as CSV (RFC 4180, CRLF). Series whose x values are the same (one may stop early: a finite-difference
 * GDD has one point fewer than its phase) give one x column and a column per series; otherwise one row per point:
 * series, x, y.
 */
export function chartCsv(series: readonly CsvSeries[], xLabel: string, yLabel: string): string {
  const rows: unknown[][] = [];
  const n = (s: CsvSeries) => Math.min(s.x.length, s.y.length);
  const base = series.reduce<CsvSeries | null>((a, s) => (!a || n(s) > n(a) ? s : a), null);
  const shared = base !== null && series.every((s) => s.x.every((v, i) => i >= n(s) || v === base.x[i]));
  if (shared) {
    rows.push([xLabel || "x", ...series.map((s) => s.name)]);
    for (let i = 0; i < n(base); i++) rows.push([base.x[i], ...series.map((s) => (i < n(s) ? s.y[i] : null))]);
  } else {
    rows.push(["series", xLabel || "x", yLabel || "y"]);
    for (const s of series) for (let i = 0; i < n(s); i++) rows.push([s.name, s.x[i], s.y[i]]);
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** A download file name stem from a chart or page title: "Reflectance vs λ (nm)" → "reflectance-vs-nm". */
export function fileStem(text: string): string {
  const stem = text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return stem || "chart";
}
