"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function PhotonTransferPage() {
  const [gain, setGain] = useURLState("gain", 2); // e-/DN
  const [readNoise, setReadNoise] = useURLState("readNoise", 10); // e- rms
  const [wellCapacity, setWellCapacity] = useURLState("wellCapacity", 50000); // e-

  const chartData = useMemo(() => {
    const signals = Array.from({ length: 200 }, (_, i) => (i + 1) * (wellCapacity / 200));
    const noiseE = signals.map(s => Math.sqrt(s + readNoise ** 2));
    const noiseDn = noiseE.map(n => n / gain);
    const varianceDn = noiseDn.map(n => n ** 2);
    const signalDn = signals.map(s => s / gain);
    return [
      { x: signalDn, y: noiseDn, type: "scatter" as const, mode: "lines" as const, name: "Noise vs Signal", line: { color: "#f87171" } },
      { x: signalDn, y: varianceDn, type: "scatter" as const, mode: "lines" as const, name: "Variance vs Signal", line: { color: "#60a5fa" } },
    ];
  }, [gain, readNoise, wellCapacity]);

  const readNoiseDn = readNoise / gain;
  const fullWellDn = wellCapacity / gain;
  const dynamicRange = 20 * Math.log10(wellCapacity / readNoise); // dB

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Conversion gain K (e⁻/DN)" value={gain} onChange={setGain} step="0.1" />
        <ValidatedNumberInput label="Read noise (e⁻)" value={readNoise} onChange={setReadNoise} step="1" />
        <ValidatedNumberInput label="Well capacity (e⁻)" value={wellCapacity} onChange={setWellCapacity} step="1000" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Read noise = <span className="text-blue-400 font-mono">{readNoiseDn.toFixed(2)} DN</span></p>
        <p className="text-gray-300">Full well = <span className="text-blue-400 font-mono">{fullWellDn.toFixed(0)} DN</span></p>
        <p className="text-gray-300">Dynamic range = <span className="text-blue-400 font-mono">{dynamicRange.toFixed(1)} dB</span> ({(wellCapacity / readNoise).toFixed(0)}:1)</p>
        <p className="text-gray-300">PTC slope (inverse gain) = <span className="text-blue-400 font-mono">{(1 / gain).toFixed(3)} DN</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Signal (DN)", gridcolor: "#374151" },
        yaxis: { title: "Noise (DN) / Variance (DN²)", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
