"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function TwoPhotonExcitationPage() {
  const [exWavelength, setExWavelength] = useState(550);
  const [objectiveNA, setObjectiveNA] = useState(0.8);
  const [pulseWidth, setPulseWidth] = useState(100);
  const [avgPower, setAvgPower] = useState(10);
  const [repRate, setRepRate] = useState(80);

  const twoPhotonEx = 2 * exWavelength;
  const peakPower = avgPower / (repRate * 1e6 * pulseWidth * 1e-15);
  const pulseEnergy = (avgPower / repRate) * 1000; // nJ

  const chartData = useMemo(() => {
    const wavelengths = Array.from({ length: 80 }, (_, i) => 350 + i * 5);
    return [
      { x: wavelengths, y: wavelengths.map(w => 2 * w), type: "scatter", mode: "lines", name: "2P Excitation λ", line: { color: "#60a5fa" } },
      { x: [exWavelength], y: [twoPhotonEx], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [exWavelength, twoPhotonEx]);

  const powerData = useMemo(() => {
    const widths = Array.from({ length: 60 }, (_, i) => 20 + i * 5);
    return [
      { x: widths, y: widths.map(w => (avgPower / (repRate * 1e6 * w * 1e-15)) / 1e6), type: "scatter", mode: "lines", name: "Peak Power (MW)", line: { color: "#fbbf24" } },
      { x: [pulseWidth], y: [peakPower / 1e6], type: "scatter", mode: "markers", name: "Current", marker: { color: "#34d399", size: 12 } },
    ];
  }, [avgPower, repRate, pulseWidth, peakPower]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Two-Photon Excitation Calculator" description="Calculate two-photon excitation wavelength, peak power, and pulse energy from laser parameters.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">1P Excitation λ (nm)</span>
          <input type="number" value={exWavelength} onChange={e => setExWavelength(+e.target.value)} min={300} max={900}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Objective NA</span>
          <input type="number" value={objectiveNA} onChange={e => setObjectiveNA(+e.target.value)} min={0.1} max={1.5} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pulse Width (fs)</span>
          <input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} min={10} max={500}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Avg Power (mW)</span>
          <input type="number" value={avgPower} onChange={e => setAvgPower(+e.target.value)} min={0.1} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Rep Rate (MHz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} min={1} max={250}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">2P Excitation λ</p>
          <p className="text-2xl font-bold text-blue-400">{twoPhotonEx} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power</p>
          <p className="text-2xl font-bold text-yellow-400">{peakPower >= 1e6 ? (peakPower / 1e6).toFixed(1) + " MW" : peakPower >= 1e3 ? (peakPower / 1e3).toFixed(1) + " kW" : peakPower.toFixed(1) + " W"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pulse Energy</p>
          <p className="text-2xl font-bold text-green-400">{pulseEnergy.toFixed(2)} nJ</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Resolution (2P)</p>
          <p className="text-2xl font-bold text-purple-400">{(0.325 * twoPhotonEx / objectiveNA).toFixed(0)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
                              </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "1P Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "2P Wavelength (nm)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={powerData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Pulse Width (fs)", gridcolor: "#374151" },
            yaxis: { title: "Peak Power (MW)", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
