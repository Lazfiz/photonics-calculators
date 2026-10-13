"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { DB_PER_NEPER, MIN_V, lp01Mode, modeFieldRadius, vNumber } from "../../../physics/fiber-optics/macro-bending-loss";
import {
  criticalPeriod, gaussianMicrobendLoss, peakTiltLoss, sinusoidalMicrobendLoss,
} from "../../../physics/fiber-optics/microbend";

const MIN_PLOTTED_DB = 1e-6;
/** First-order coupled-mode theory needs both the peak tilt loss and the loss per period well below 1. */
const FIRST_ORDER_LIMIT = 0.1;

const fmtDb = (x: number) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : x >= 0.01 && x < 1e4 ? x.toPrecision(3) : x.toExponential(2);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function MicroBendPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [period, setPeriod] = useURLState("period", 0.5); // mm
  const [amplitudeNm, setAmplitudeNm] = useURLState("amplitudeNm", 20); // nm
  const [length, setLength] = useURLState("length", 1); // m
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.1); // µm
  const [na, setNa] = useURLState("na", 0.1246);
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.4494);

  const fiber = useMemo(() => ({ a: coreRadius * 1e-6, n1: coreIndex, NA: na }), [coreRadius, coreIndex, na]);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const V = vNumber(fiber, lambda);
    const mode = lp01Mode(V);
    const A = amplitudeNm * 1e-9;
    const P = period * 1e-3;
    const alpha = sinusoidalMicrobendLoss(fiber, lambda, A, P, mode);
    const curvature = A * ((2 * Math.PI) / P) ** 2;
    return {
      V,
      gaussian: DB_PER_NEPER * gaussianMicrobendLoss(fiber, lambda, A, P, mode),
      firstOrder: Math.max(peakTiltLoss(fiber, lambda, A, P), alpha * P),
      dBPerMetre: DB_PER_NEPER * alpha,
      total: DB_PER_NEPER * alpha * length,
      Lc_mm: criticalPeriod(fiber, lambda, mode) * 1e3,
      minBendRadius_mm: curvature > 0 ? 1e3 / curvature : Infinity,
      mfd_um: 2e6 * modeFieldRadius(fiber, lambda),
    };
  }, [fiber, wavelength, amplitudeNm, period, length]);

  const chartData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const mode = lp01Mode(vNumber(fiber, lambda));
    const periods_mm = Array.from({ length: 241 }, (_, i) => 0.05 + i * 0.005);
    const curve = (loss: typeof sinusoidalMicrobendLoss) => {
      const ys = periods_mm.map((p) => DB_PER_NEPER * loss(fiber, lambda, amplitudeNm * 1e-9, p * 1e-3, mode));
      const keep = ys.map((y) => Number.isFinite(y) && y >= MIN_PLOTTED_DB);
      return { x: periods_mm.filter((_, i) => keep[i]), y: ys.filter((_, i) => keep[i]) };
    };
    const exact = curve(sinusoidalMicrobendLoss);
    const y = exact.y;
    const Lc_mm = criticalPeriod(fiber, lambda, mode) * 1e3;
    const traces: Record<string, unknown>[] = [
      { ...exact, type: "scatter" as const, mode: "lines" as const, name: "Exact LP01 field", line: { color: "#a78bfa", width: 2 } },
      { ...curve(gaussianMicrobendLoss), type: "scatter" as const, mode: "lines" as const, name: "Gaussian mode (Petermann)", line: { color: "#34d399", width: 1.5, dash: "dash" as const } },
    ];
    if (y.length > 0 && Number.isFinite(Lc_mm)) {
      traces.push({ x: [Lc_mm, Lc_mm], y: [Math.min(...y), Math.max(...y)], type: "scatter" as const, mode: "lines" as const, name: "Λc", line: { color: "#fbbf24", width: 1 } });
    }
    return traces;
  }, [fiber, wavelength, amplitudeNm]);

  const valid = Number.isFinite(calc.dBPerMetre);
  const beyondCritical = valid && period >= calc.Lc_mm;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={600} max={2000} step="1" />
        <ValidatedNumberInput label="Deformation Period Λ (mm)" value={period} onChange={setPeriod} min={0.01} max={100} step="0.01" />
        <ValidatedNumberInput label="Axis Amplitude A (nm)" value={amplitudeNm} onChange={setAmplitudeNm} min={0} max={10000} step="1" />
        <ValidatedNumberInput label="Affected Length (m)" value={length} onChange={setLength} min={0} max={100000} step="0.1" />
        <ValidatedNumberInput label="Core Radius (µm)" value={coreRadius} onChange={setCoreRadius} min={0.5} max={20} step="0.1" />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.01} max={0.5} step="0.001" />
        <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} min={1} max={4} step="0.0001" />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the model needs V ≥ {MIN_V} (here V = {fmt(calc.V, 3)}), 0 &lt; NA &lt; n₁ and a positive period.
        </p>
      )}
      {valid && calc.V > 2.405 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          V = {calc.V.toFixed(2)} &gt; 2.405: the fibre is not single-mode here; LP01 couples to guided LP11 as well, which this model ignores.
        </p>
      )}
      {valid && calc.firstOrder > FIRST_ORDER_LIMIT && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The deformation is too strong for first-order theory (peak tilt loss or loss per period above {FIRST_ORDER_LIMIT}):
          the result overestimates the loss. Reduce the amplitude or treat each bend as a macrobend.
        </p>
      )}
      {beyondCritical && (
        <p className="mb-6 text-sm text-gray-400" role="status">
          Λ ≥ Λc: no radiation mode is phase-matched, so the first-order loss of an infinitely long sinusoid is zero. Slow bends like this act as macrobends instead.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="Microbend loss" value={`${fmtDb(calc.dBPerMetre)} dB/m`} tone="purple" subtext={`${fmtDb(calc.total)} dB over ${length} m; Gaussian mode ${fmtDb(calc.gaussian)} dB/m`} />
        <ResultCard label="Critical period Λc" value={fmt(calc.Lc_mm, 3, " mm")} tone="yellow" subtext="2π/(β − k n₂): loss only for Λ < Λc" />
        <ResultCard label="Tightest bend radius" value={Number.isFinite(calc.minBendRadius_mm) ? `${calc.minBendRadius_mm.toPrecision(3)} mm` : "∞"} tone="blue" subtext="1/(A (2π/Λ)²) at the crests" />
        <ResultCard label="Mode-field diameter" value={fmt(calc.mfd_um, 2, " µm")} tone="green" subtext={`V = ${fmt(calc.V, 3)} (Marcuse fit)`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Loss vs Deformation Period (A = {amplitudeNm} nm)</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Deformation period Λ (mm)", gridcolor: "#374151" },
          yaxis: { title: "Loss (dB/m)", gridcolor: "#374151", type: "log" },
          margin: { t: 20, r: 30, b: 50, l: 70 }, height: 340,
        }} />
        <p className="mt-2 text-xs text-gray-500">Yellow line: critical period Λc, where the loss falls to zero. The dashed curve uses a Gaussian mode instead of the exact field.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">f(z) = A sin(2πz/Λ),  curvature C = A(2π/Λ)²,  δ = β − k n₂,  Λc = 2π/δ</p>
          <p className="font-mono">α = (π²/2) (k n₂)³ C² H′(k*)²,  k* = √(2 k n₂ s),  s = 2π/Λ − δ &gt; 0</p>
          <p className="font-mono">Gaussian mode: α = (π/8) (k n₂)⁴ w⁶ C² s e^(−k n₂ w² s)</p>
          <p>
            First-order coupled-mode theory: the local curvature tilts the index profile (n²(1 + 2xC)), coupling LP01 to
            radiation modes whose propagation constant differs by 2π/Λ. Following Petermann (1976), the radiation modes are plane
            waves in the cladding, so the loss depends on the slope H′ of the mode&apos;s Hankel transform at k*. H′ is computed in
            closed form for the exact step-index LP01 field (Lommel integrals); δ uses the exact LP01 β. Petermann&apos;s Gaussian
            mode is about 2× low near the default period and far too low at short periods, where the field&apos;s edge at the
            core boundary dominates. The Gaussian coupling reproduces Marcuse&apos;s tilt loss (π n w θ/λ)² for a sharp kink.
          </p>
          <p>
            Textbook approximation for one weak, infinitely long sinusoidal deformation; real profiles are rounded, so the step-index field overstates the loss at very short periods. Real cables have random deformation spectra, and the discrete
            cladding modes give resonances near Λc that this continuum model smooths out. No elasto-optic correction.
          </p>
        </div>
      </div>
    </>
  );
}
