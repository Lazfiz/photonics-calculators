"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { APD_K_TABLE, excessNoiseFactor, excessNoiseIndex, millerGain } from "../../../physics/detectors/apd";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fixed = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const COLORS = ["#60a5fa", "#34d399", "#f87171"];

export default function AvalancheGainPage() {
  const [breakdownRaw, setBreakdownVoltage] = useURLState("breakdownVoltage", 150);
  const [biasRaw, setBiasVoltage] = useURLState("biasVoltage", 140);
  const [nRaw, setN] = useURLState("n", 3);
  const [kRaw, setIonizationRatio] = useURLState("ionizationRatio", 0.02);

  const breakdown = clamp(breakdownRaw, 1, 5000, 150);
  const bias = clamp(biasRaw, 0, 5000, 140);
  const n = clamp(nRaw, 0.1, 10, 3);
  const k = clamp(kRaw, 0, 1, 0.02);

  const gain = millerGain(bias, breakdown, n);
  const F = excessNoiseFactor(gain, k);
  const x = excessNoiseIndex(gain, k);
  const aboveBreakdown = gain === Infinity;

  const ratios = Array.from({ length: 200 }, (_, i) => 0.5 + (i * 0.499) / 199);
  const gainVsVoltage = [
    { x: ratios.map((r) => r * breakdown), y: ratios.map((r) => millerGain(r * breakdown, breakdown, n)), type: "scatter" as const, mode: "lines" as const, name: "Gain M", line: { color: "#60a5fa", width: 2 } },
  ];

  const M = Array.from({ length: 200 }, (_, i) => 1 + i);
  const noiseVsGain = [
    { x: M, y: M.map((m) => excessNoiseFactor(m, k)), type: "scatter" as const, mode: "lines" as const, name: "McIntyre F(M)", line: { color: "#f87171", width: 2 } },
    { x: M, y: M.map((m) => k * m + 2 * (1 - k)), type: "scatter" as const, mode: "lines" as const, name: "F ≈ kM + 2(1 − k)", line: { color: "#fbbf24", width: 2, dash: "dash" as const } },
  ];

  const M100 = Array.from({ length: 200 }, (_, i) => 1 + (i * 99) / 199);
  const comparisonChart = APD_K_TABLE.map((m, i) => ({
    x: M100, y: M100.map((g) => excessNoiseFactor(g, m.k)), type: "scatter" as const, mode: "lines" as const,
    name: `${m.label} (k = ${m.k})`, line: { color: COLORS[i], width: 2 },
  }));

  return (
    <>
      <div role="group" aria-label="Ionization ratio preset" className="flex flex-wrap gap-2 mb-6">
        {APD_K_TABLE.map((m) => (
          <button key={m.id} onClick={() => setIonizationRatio(m.k)} className={`px-4 py-2 rounded text-sm font-medium ${k === m.k ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
            {m.label} (k = {m.k})
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Breakdown Voltage V_br (V)" value={breakdownRaw} onChange={setBreakdownVoltage} min={1} max={5000} step="1" />
        <ValidatedNumberInput label="Bias Voltage V (V)" value={biasRaw} onChange={setBiasVoltage} min={0} max={5000} step="1" />
        <ValidatedNumberInput label="Miller Exponent n (device fit)" value={nRaw} onChange={setN} min={0.1} max={10} step="0.1" />
        <ValidatedNumberInput label="Ionization Ratio k" value={kRaw} onChange={setIonizationRatio} min={0} max={1} step="0.01" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="V/V_br" value={(bias / breakdown).toFixed(4)} tone="blue" />
        <ResultCard label="Gain M" value={aboveBreakdown ? "— (at or above breakdown)" : gain.toFixed(3)} tone="green" />
        <ResultCard label="Excess Noise F" value={aboveBreakdown ? "—" : F.toFixed(3)} tone="yellow" subtext={gain > 1 && !aboveBreakdown ? `F = M^${x.toFixed(3)}` : undefined} />
        <ResultCard label="Noise Current Gain √F·M" value={aboveBreakdown ? "—" : fixed(Math.sqrt(F) * gain, 2)} tone="red" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ChartPanel data={gainVsVoltage} layout={{ xaxis: { title: "Bias Voltage (V)", gridcolor: "#374151" }, yaxis: { title: "Gain M", type: "log", gridcolor: "#374151" } }} title="Gain vs Bias" />
        <ChartPanel data={noiseVsGain} layout={{ xaxis: { title: "Gain M", gridcolor: "#374151" }, yaxis: { title: "Excess Noise F", gridcolor: "#374151" } }} title="Excess Noise vs Gain" />
        <div className="md:col-span-2">
          <ChartPanel data={comparisonChart} layout={{ xaxis: { title: "Gain M", gridcolor: "#374151" }, yaxis: { title: "Excess Noise F", gridcolor: "#374151" } }} title="Material Comparison" />
        </div>
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 font-mono space-y-1">
        <p>M = 1 / [1 − (V/V_br)^n]  [Miller 1955, empirical]</p>
        <p>F(M) = k·M + (1 − k)·(2 − 1/M)  [McIntyre 1966]</p>
        <p>k = ratio of the smaller to the larger ionization coefficient, for injection of the more ionizing carrier</p>
        <p>Large-M asymptote: F ≈ kM + 2(1 − k), linear in M</p>
        <p>n is fitted per device: an InGaAs APD with M = 10 at 4 V below a 50 V breakdown has n = 1.26</p>
      </div>
    </>
  );
}
