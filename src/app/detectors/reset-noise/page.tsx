"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ResetNoisePage() {
  const [capacitance, setCapacitance] = useState(10e-15); // F (10 fF)
  const [temperature, setTemperature] = useState(300); // K
  const [kb, setKb] = useState(1.38e-23); // J/K

  const chartData = useMemo(() => {
    const caps = Array.from({ length: 200 }, (_, i) => 1e-15 * Math.pow(100, i / 200)); // 1fF to 100fF
    const noiseElectrons = caps.map(C => {
      const noiseV = Math.sqrt(kb * temperature / C);
      return noiseV * C / 1.6e-19;
    });
    const noiseVoltage = caps.map(C => Math.sqrt(kb * temperature / C));
    return [
      { x: caps, y: noiseElectrons, type: "scatter" as const, mode: "lines" as const, name: "Noise (e⁻)", line: { color: "#f87171" }, yaxis: "y" },
      { x: caps, y: noiseVoltage, type: "scatter" as const, mode: "lines" as const, name: "Noise voltage (V)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [capacitance, temperature, kb]);

  const noiseV = Math.sqrt(kb * temperature / capacitance);
  const noiseElectrons = noiseV * capacitance / 1.6e-19;
  const conversionGain = 1.6e-19 / capacitance; // V/e-

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">KTC Reset Noise</h1>
      <p className="text-gray-400 mb-8">KTC noise: σ<sub>v</sub> = √(k<sub>B</sub>T/C). Thermal noise from resetting a capacitor. σ<sub>q</sub> = √(k<sub>B</sub>TC)/q.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Capacitance (F)</span>
          <input type="number" value={capacitance} onChange={e => setCapacitance(+e.target.value)} step="1e-15" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">KTC noise voltage = <span className="text-blue-400 font-mono">{(noiseV * 1e3).toFixed(3)} mV</span></p>
        <p className="text-gray-300">KTC noise charge = <span className="text-blue-400 font-mono">{noiseElectrons.toFixed(2)} e⁻</span></p>
        <p className="text-gray-300">Conversion gain = <span className="text-blue-400 font-mono">{(conversionGain * 1e6).toFixed(1)} μV/e⁻</span></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Capacitance (F)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Noise (e⁻)", gridcolor: "#374151" },
        yaxis2: { title: "Noise voltage (V)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 70 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
