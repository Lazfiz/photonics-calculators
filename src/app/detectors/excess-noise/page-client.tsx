"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { APD_K_TABLE, excessNoiseFactor, excessNoiseIndex } from "../../../physics/detectors/apd";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const COLORS = ["#60a5fa", "#f87171", "#fbbf24"];

export default function ExcessNoisePage() {
  const [gainRaw, setGain] = useURLState("gain", 100);
  const [kRaw, setKFactor] = useURLState("kFactor", 0.02);
  const [qeRaw, setQuantumEff] = useURLState("quantumEff", 0.8);

  const gain = clamp(gainRaw, 1, 1e4, 100);
  const k = clamp(kRaw, 0, 1, 0.02);
  const qe = clamp(qeRaw, 0.01, 1, 0.8);

  const F = excessNoiseFactor(gain, k);
  const x = excessNoiseIndex(gain, k);
  const noiseFigure = 10 * Math.log10(F);

  // 300 gains from 1 to 1000 on a log grid.
  const M = Array.from({ length: 300 }, (_, i) => 10 ** ((3 * i) / 299));
  const chartData = [
    ...APD_K_TABLE.map((m, i) => ({
      x: M, y: M.map((g) => excessNoiseFactor(g, m.k)), type: "scatter" as const, mode: "lines" as const,
      name: `${m.label} (k = ${m.k})`, line: { color: COLORS[i], width: 2 },
    })),
    { x: M, y: M.map((g) => excessNoiseFactor(g, 0)), type: "scatter" as const, mode: "lines" as const, name: "k = 0 (one carrier ionizes)", line: { color: "#34d399", width: 2, dash: "dash" as const } },
    { x: M, y: M.map((g) => excessNoiseFactor(g, k)), type: "scatter" as const, mode: "lines" as const, name: `Entered (k = ${k})`, line: { color: "#a78bfa", width: 3 } },
  ];

  // Shot-noise-limited SNR of N incident photons: √(ηN) for a p-i-n, √(ηN/F) for the APD.
  const photons = Array.from({ length: 200 }, (_, i) => 10 ** ((4 * i) / 199));
  const snrChart = [
    { x: photons, y: photons.map((N) => Math.sqrt(N * qe)), type: "scatter" as const, mode: "lines" as const, name: "p-i-n (F = 1)", line: { color: "#34d399", width: 2 } },
    { x: photons, y: photons.map((N) => Math.sqrt((N * qe) / F)), type: "scatter" as const, mode: "lines" as const, name: `APD (F = ${F.toFixed(2)})`, line: { color: "#f87171", width: 2 } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Multiplication Gain M" value={gainRaw} onChange={setGain} min={1} max={1e4} step="10" />
        <ValidatedNumberInput label="Ionization Ratio k" value={kRaw} onChange={setKFactor} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Quantum Efficiency" value={qeRaw} onChange={setQuantumEff} min={0.01} max={1} step="0.05" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Excess Noise F" value={F.toFixed(4)} tone="red" />
        <ResultCard label="Noise Figure 10·log₁₀F" value={`${noiseFigure.toFixed(2)} dB`} tone="yellow" />
        <ResultCard label="Shot-Limited SNR vs p-i-n" value={`×${(1 / Math.sqrt(F)).toFixed(3)}`} tone="blue" subtext="amplitude ratio 1/√F" />
        <ResultCard label="Excess Noise Index x" value={gain > 1 ? x.toFixed(3) : "—"} tone="purple" subtext="datasheet form F = M^x" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>F(M) = k·M + (1 − k)·(2 − 1/M)  [McIntyre 1966]</p>
        <p>{APD_K_TABLE.map((m) => `${m.label}: k = ${m.k} (range ${m.range[0]}–${m.range[1]})`).join(", ")}</p>
        <p>x = ln F / ln M, so F = M^x holds exactly at the entered gain only</p>
      </div>
      <ChartPanel data={chartData} layout={{ xaxis: { title: "Gain M", gridcolor: "#374151", type: "log" }, yaxis: { title: "F", gridcolor: "#374151", type: "log" } }} />
      <ChartPanel data={snrChart} layout={{ xaxis: { title: "Incident photons N", gridcolor: "#374151", type: "log" }, yaxis: { title: "Shot-limited SNR", gridcolor: "#374151" } }} title="SNR: p-i-n vs APD (no amplifier noise)" />
    </>
  );
}
