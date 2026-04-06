"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function ThermalNoisePage() {
  const [resistance, setResistance] = useState(1000); // Ohms
  const [temperature, setTemperature] = useState(300); // K
  const [bandwidth, setBandwidth] = useState(1e6); // Hz
  const [kB] = useState(1.381e-23); // J/K

  const chartData = useMemo(() => {
    const resistances = Array.from({ length: 200 }, (_, i) => 10 * Math.pow(1e5, i / 200));
    const vNoise = resistances.map(R => Math.sqrt(4 * kB * temperature * R * bandwidth));
    return [{ x: resistances, y: vNoise, type: "scatter" as const, mode: "lines" as const, name: "RMS noise voltage", line: { color: "#60a5fa" } }];
  }, [resistance, temperature, bandwidth]);

  const vNoise = Math.sqrt(4 * kB * temperature * resistance * bandwidth);
  const iNoise = vNoise / resistance;
  const pNoise = vNoise * vNoise / resistance;

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Johnson (Thermal) Noise" description="vn = √(4kBTRΔf). Thermal noise voltage across a resistor.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Resistance (Ω)</span>
          <input type="number" value={resistance} onChange={e => setResistance(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Bandwidth (Hz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">RMS noise voltage = <span className="text-blue-400 font-mono">{vNoise.toExponential(3)} V</span></p>
        <p className="text-gray-300">RMS noise current = <span className="text-blue-400 font-mono">{iNoise.toExponential(3)} A</span></p>
        <p className="text-gray-300">Noise power = <span className="text-blue-400 font-mono">{pNoise.toExponential(3)} W</span></p>
        <p className="text-gray-300">Noise temp equiv = <span className="text-blue-400 font-mono">{temperature} K</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Resistance (Ω)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Noise Voltage (V)", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true }} />
    </CalculatorShell>
  );
}
