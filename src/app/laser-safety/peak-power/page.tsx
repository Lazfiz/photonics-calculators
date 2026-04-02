"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PeakPowerPage() {
  const [avgPower, setAvgPower] = useState(10);
  const [repRate, setRepRate] = useState(80e6);
  const [dutyCycle, setDutyCycle] = useState(0.1);

  const pulseEnergy = (avgPower / repRate) * 1e6; // µJ
  const peakPower = dutyCycle > 0 ? avgPower / dutyCycle : 0;
  const avgIrradiance = avgPower; // W (at beam)
  const peakIrradiance = dutyCycle > 0 ? avgIrradiance / dutyCycle : 0;

  const chartData = useMemo(() => {
    const dcs = Array.from({ length: 100 }, (_, i) => 0.001 + i * 0.001);
    return [
      { x: dcs.map(d => d * 100), y: dcs.map(d => avgPower / d), type: "scatter" as const, mode: "lines" as const, name: "Peak Power", line: { color: "#f87171" } },
      { x: [dutyCycle * 100], y: [peakPower], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#60a5fa", size: 12 } },
    ];
  }, [avgPower, dutyCycle]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Peak Power Calculator</h1>
      <p className="text-gray-400 mb-8">Convert average power to peak power for pulsed lasers. Essential for assessing single-pulse hazards.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Average Power (W)</span>
          <input type="number" value={avgPower} onChange={e => setAvgPower(+e.target.value)} min={0.001} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Repetition Rate (Hz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} min={1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Duty Cycle (%)</span>
          <input type="number" value={dutyCycle} onChange={e => setDutyCycle(+e.target.value)} min={0.001} max={100} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power</p>
          <p className="text-2xl font-bold text-red-400">{peakPower >= 1000 ? (peakPower / 1000).toFixed(1) + " kW" : peakPower.toFixed(1) + " W"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pulse Energy</p>
          <p className="text-2xl font-bold text-blue-400">{pulseEnergy >= 1000 ? (pulseEnergy / 1000).toFixed(2) + " mJ" : pulseEnergy.toFixed(3) + " µJ"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak/Avg Ratio</p>
          <p className="text-2xl font-bold text-yellow-400">{(1 / dutyCycle).toFixed(0)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Repetition Rate</p>
          <p className="text-2xl font-bold text-green-400">{repRate >= 1e6 ? (repRate / 1e6).toFixed(1) + " MHz" : repRate >= 1e3 ? (repRate / 1e3).toFixed(1) + " kHz" : repRate + " Hz"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Duty Cycle (%)", gridcolor: "#374151" },
          yaxis: { title: "Peak Power (W)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
