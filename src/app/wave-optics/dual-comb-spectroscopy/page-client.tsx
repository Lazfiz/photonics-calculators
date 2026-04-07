"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function DualCombSpectroscopyPage() {
  const [repRate1, setRepRate1] = useState(250); // MHz
  const [repRate2, setRepRate2] = useState(250.001); // MHz
  const [centerWavelength, setCenterWavelength] = useState(1550); // nm

  const chartData = useMemo(() => {
    const f = Array.from({ length: 200 }, (_, i) => 192 + i * 0.01); // THz
    const comb1 = f.map(fi => Math.cos(fi * 2 * Math.PI / repRate1) ** 2 * 0.5 + 0.5);
    const comb2 = f.map(fi => Math.cos(fi * 2 * Math.PI / repRate2) ** 2 * 0.5 + 0.5);
    const beat = f.map((_, i) => Math.abs(comb1[i] - comb2[i]));
    
    return [
      { x: f, y: comb1, type: "scatter" as const, mode: "lines" as const, name: "Comb 1", line: { color: "#60a5fa" } },
      { x: f, y: comb2, type: "scatter" as const, mode: "lines" as const, name: "Comb 2", line: { color: "#f87171" } },
      { x: f, y: beat, type: "scatter" as const, mode: "lines" as const, name: "Beat", line: { color: "#34d399" } },
    ];
  }, [repRate1, repRate2, centerWavelength]);

  const deltaF = Math.abs(repRate1 - repRate2) * 1e3; // kHz

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Dual-Comb Spectroscopy" description="High-resolution spectroscopy using two frequency combs with slightly different repetition rates.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Rep Rate 1 (MHz)" value={repRate1} onChange={setRepRate1} step="0.001" />
        <ValidatedNumberInput label="Rep Rate 2 (MHz)" value={repRate2} onChange={setRepRate2} step="0.001" />
        <ValidatedNumberInput label="Center λ (nm)" value={centerWavelength} onChange={setCenterWavelength} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Δf_rep: <span className="text-blue-400 font-mono">{deltaF.toFixed(1)} kHz</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Frequency (THz)", gridcolor: "#374151" },
        yaxis: { title: "Amplitude", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} />
    </CalculatorShell>
  );
}
