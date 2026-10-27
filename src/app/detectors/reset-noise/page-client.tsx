"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { q } from "../../../physics/constants";
import { ktcNoise } from "../../../physics/detectors/noise";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function ResetNoisePage() {
  const [capacitanceRaw, setCapacitance] = useURLState("capacitance", 10e-15); // F (10 fF)
  const [temperatureRaw, setTemperature] = useURLState("temperature", 300); // K
  const capacitance = clamp(capacitanceRaw, 1e-18, 1e-6, 10e-15);
  const temperature = clamp(temperatureRaw, 0, 1e4, 300);

  const op = useMemo(() => ktcNoise(capacitance, temperature), [capacitance, temperature]);
  const { v: noiseV, electrons: noiseElectrons } = op;

  const chartData = useMemo(() => {
    const caps = Array.from({ length: 200 }, (_, i) => (capacitance / 30) * Math.pow(900, i / 199)); // C/30 to 30·C
    const noise = caps.map(C => ktcNoise(C, temperature));
    return [
      { x: caps, y: noise.map(n => n.electrons), type: "scatter" as const, mode: "lines" as const, name: "Noise (e⁻)", line: { color: "#f87171" }, yaxis: "y" },
      { x: [capacitance], y: [op.electrons], type: "scatter" as const, mode: "markers" as const, name: "Operating point (e⁻)", marker: { color: "#fbbf24", size: 9 }, yaxis: "y" },
      { x: caps, y: noise.map(n => n.v), type: "scatter" as const, mode: "lines" as const, name: "Noise voltage (V)", line: { color: "#60a5fa" }, yaxis: "y2" },
      { x: [capacitance], y: [op.v], type: "scatter" as const, mode: "markers" as const, name: "Operating point (V)", marker: { color: "#fbbf24", size: 9, symbol: "diamond" }, yaxis: "y2" },
    ];
  }, [capacitance, temperature, op]);

  const conversionGain = q / capacitance; // V/e⁻

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Capacitance (F)" value={capacitanceRaw} onChange={setCapacitance} step="1e-15" min={1e-18} max={1e-6} />
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} step="1" min={0} max={1e4} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">kTC noise voltage √(k<sub>B</sub>T/C) = <span className="text-blue-400 font-mono">{(noiseV * 1e3).toFixed(3)} mV</span></p>
        <p className="text-gray-300">kTC noise charge √(k<sub>B</sub>TC)/q = <span className="text-blue-400 font-mono">{noiseElectrons.toFixed(2)} e⁻</span></p>
        <p className="text-gray-300">Conversion gain q/C = <span className="text-blue-400 font-mono">{(conversionGain * 1e6).toFixed(1)} μV/e⁻</span></p>
        <p className="text-sm text-gray-500 mt-2">Independent of the reset switch resistance. Correlated double sampling removes it when the reset level is sampled before the signal.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Capacitance (F)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise (e⁻)", gridcolor: "#374151" },
        yaxis2: { title: "Noise voltage (V)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 70 }, autosize: true, showlegend: true
      }} />
    </>
  );
}
