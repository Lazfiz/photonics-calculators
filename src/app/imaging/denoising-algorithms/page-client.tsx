"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  boxNoiseRatio,
  boxTransfer,
  gaussianNoiseRatio,
  gaussianRadius,
  gaussianTransfer,
  halfResponseFrequency,
  medianNoiseRatio,
  snrGainDb,
  visuShrinkThreshold,
} from "../../../physics/imaging/denoising";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const card = (label: string, value: string, sub: string, color: string) => (
  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{sub}</p>
  </div>
);

const buttonClass = (active: boolean) =>
  `px-3 py-2 rounded text-sm font-medium ${active ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`;

type Filter = "box" | "gaussian" | "median";
const FILTERS: Filter[] = ["box", "gaussian", "median"];
const FILTER_LABELS: Record<Filter, string> = { box: "Box (mean)", gaussian: "Gaussian", median: "Median" };
const WINDOWS = [3, 5, 7, 9, 11, 13, 15];
const CHART_WINDOWS = [1, ...WINDOWS];

// The median quadrature costs a few ms per window size: cache it.
const medianCache = new Map<number, number>();
const cachedMedianRatio = (k: number) => {
  let r = medianCache.get(k);
  if (r === undefined) medianCache.set(k, (r = medianNoiseRatio(k)));
  return r;
};

export default function DenoisingAlgorithmsPage() {
  const [filterRaw, setFilter] = useURLState("filter", "box");
  const [noiseRaw, setInputNoise] = useURLState("inputNoise", 20);
  const [sizeRaw, setFilterSize] = useURLState("filterSize", 3);
  const [sigmaRaw, setSigmaSpatial] = useURLState("sigmaSpatial", 2);
  const [sideRaw, setImageSize] = useURLState("imageSize", 512);
  const filter: Filter = FILTERS.find((f) => f === filterRaw) ?? "box";
  const sigmaIn = clamp(noiseRaw, 1e-6, 1e9, 20);
  const k = WINDOWS.includes(sizeRaw) ? sizeRaw : 3;
  const sigmaS = clamp(sigmaRaw, 0.5, 10, 2);
  const side = Math.round(clamp(sideRaw, 16, 16384, 512));

  const ratio = filter === "box" ? boxNoiseRatio(k) : filter === "gaussian" ? gaussianNoiseRatio(sigmaS) : cachedMedianRatio(k);
  const gainDb = snrGainDb(ratio);
  const transfer = filter === "box" ? (f: number) => boxTransfer(k, f) : filter === "gaussian" ? (f: number) => gaussianTransfer(sigmaS, f) : null;
  const f50 = transfer ? halfResponseFrequency(transfer) : NaN;
  const hQuarter = transfer ? transfer(0.25) : NaN;
  const threshold = visuShrinkThreshold(sigmaIn, side * side);
  const r = gaussianRadius(sigmaS);
  const windowLabel = filter === "gaussian" ? `σ_s = ${sigmaS} px, ${2 * r + 1} × ${2 * r + 1} taps` : `${k} × ${k} window`;

  const gainChart = [
    { x: CHART_WINDOWS, y: CHART_WINDOWS.map((w) => snrGainDb(boxNoiseRatio(w))), type: "scatter" as const, mode: "lines+markers" as const, name: "Box", line: { color: "#60a5fa", width: 2 } },
    { x: CHART_WINDOWS, y: CHART_WINDOWS.map((w) => snrGainDb(cachedMedianRatio(w))), type: "scatter" as const, mode: "lines+markers" as const, name: "Median", line: { color: "#f87171", width: 2 } },
    ...(filter !== "gaussian"
      ? [{ x: [k], y: [gainDb], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } }]
      : []),
  ];

  const fs = Array.from({ length: 101 }, (_, i) => i * 0.005);
  const transferChart = [
    { x: fs, y: fs.map((f) => boxTransfer(k, f)), type: "scatter" as const, mode: "lines" as const, name: `Box ${k}×${k}`, line: { color: "#60a5fa", width: filter === "box" ? 3 : 1.5 } },
    { x: fs, y: fs.map((f) => gaussianTransfer(sigmaS, f)), type: "scatter" as const, mode: "lines" as const, name: `Gauss σ ${sigmaS}`, line: { color: "#34d399", width: filter === "gaussian" ? 3 : 1.5 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {card("Output noise σ", fmt(sigmaIn * ratio, 3), `${fmt(ratio, 4)} × the input σ (${windowLabel})`, "text-green-400")}
        {card("SNR gain", fmt(gainDb, 2, " dB"), filter === "median" ? `Box of the same size: ${fmt(snrGainDb(boxNoiseRatio(k)), 2, " dB")}` : "20 log₁₀(σ_in / σ_out) on white noise", "text-blue-400")}
        {transfer
          ? card("Half-response frequency f₅₀", Number.isFinite(f50) ? fmt(f50, 4, " cy/px") : "> 0.5 cy/px", `H(0.25 cy/px) = ${fmt(hQuarter, 3)} along one axis`, "text-yellow-400")
          : card("Detail cost", "Nonlinear", "No transfer function: a median keeps step edges but removes features smaller than about half the window", "text-yellow-400")}
        {card("VisuShrink threshold", fmt(threshold, 3), `σ√(2 ln N) for N = ${side} × ${side} coefficients`, "text-purple-400")}
      </div>

      <div role="group" aria-label="Filter" className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={buttonClass(filter === f)}>{FILTER_LABELS[f]}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <ValidatedNumberInput label="Input noise σ (any unit: DN, e⁻)" value={noiseRaw} onChange={setInputNoise} min={1e-6} max={1e9} step="any" />
        {filter === "gaussian" ? (
          <ValidatedNumberInput label="Gaussian σ_s (px)" value={sigmaRaw} onChange={setSigmaSpatial} min={0.5} max={10} step="any" />
        ) : (
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Window size</span>
            <select value={k} onChange={(e) => setFilterSize(+e.target.value)}
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
              {WINDOWS.map((s) => <option key={s} value={s}>{s}×{s}</option>)}
            </select>
          </label>
        )}
        <ValidatedNumberInput label="Image side (px, for VisuShrink)" value={sideRaw} onChange={setImageSize} min={16} max={16384} step="1" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">SNR gain on white Gaussian noise</h3>
          <ChartPanel data={gainChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Window side k (k × k pixels)", gridcolor: "#374151" },
            yaxis: { title: "SNR gain (dB)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Transfer function along one axis</h3>
          <ChartPanel data={transferChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Spatial frequency (cycles/pixel)", gridcolor: "#374151" },
            yaxis: { title: "H(f)", gridcolor: "#374151", range: [-0.3, 1.05] },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Linear filter:</span> σ_out² = σ²·Σw², Σw = 1 (white noise)</p>
          <p><span className="text-blue-400">Box k × k:</span> σ_out = σ/k, H(f) = sin(πkf) / (k·sin πf)</p>
          <p><span className="text-blue-400">Gaussian:</span> g_i ∝ exp(−i²/2σ_s²), |i| ≤ ⌈3σ_s⌉; σ_out → σ/(2√π σ_s), H → exp(−2π²σ_s²f²)</p>
          <p><span className="text-blue-400">Median of n = k²:</span> σ_out² = σ²·∫x² n!/(m!)² Φ^m (1−Φ)^m φ dx, m = (n−1)/2; → πσ²/(2n)</p>
          <p><span className="text-blue-400">VisuShrink:</span> T = σ√(2 ln N)</p>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Additive white Gaussian noise, no edge effects; the box and the Gaussian are separable, so H is the same along x
          and y. A negative H is contrast reversal. The median is about 2/π as efficient as the mean on Gaussian noise but
          keeps edges and rejects impulse noise. Bilateral, non-local means, BM3D and learned denoisers adapt to the image
          content and have no closed-form noise gain, so they are not modelled; VisuShrink only gives the soft-threshold
          level, not the output noise.
        </p>
      </div>
    </>
  );
}
