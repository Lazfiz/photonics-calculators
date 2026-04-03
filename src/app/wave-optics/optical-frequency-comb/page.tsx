"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function OpticalFrequencyCombPage() {
  const [repRate, setRepRate] = useState(250); // MHz
  const [centerWavelength, setCenterWavelength] = useState(1550); // nm
  const [combLines, setCombLines] = useState(50);
  const c = 3e8;

  const chartData = useMemo(() => {
    const f0 = c / (centerWavelength * 1e-9);
    const repFreqHz = repRate * 1e6;
    
    const freqs = Array.from({ length: combLines }, (_, i) => {
      const n = i - Math.floor(combLines / 2);
      return f0 + n * repFreqHz;
    });
    
    return [
      { x: freqs.map(f => f / 1e12), y: freqs.map((_, i) => Math.exp(-((i - combLines / 2) ** 2))), type: "scatter" as const, mode: "lines" as const, name: "Comb Teeth", line: { color: "#60a5fa" } },
    ];
  }, [repRate, centerWavelength, combLines]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Optical Frequency Comb" description="Precision spectroscopy and metrology using a train of equally spaced narrow spectral lines.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Rep Rate (MHz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Center λ (nm)</span>
          <input type="number" value={centerWavelength} onChange={e => setCenterWavelength(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Comb Lines</span>
          <input type="number" value={combLines} onChange={e => setCombLines(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Line spacing: <span className="text-blue-400 font-mono">{repRate.toFixed(3)} MHz</span></p>
        <p className="text-gray-300">Center frequency: <span className="text-blue-400 font-mono">{(c / (centerWavelength * 1e-9) / 1e12).toFixed(1)} THz</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Frequency (THz)", gridcolor: "#374151" },
        yaxis: { title: "Amplitude", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} />
    </CalculatorShell>
  );
}
