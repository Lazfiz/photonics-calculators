"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function QSwitchedLaserPage() {
  const [repRate, setRepRate] = useState(10); // kHz
  const [pulseEnergy, setPulseEnergy] = useState(1); // mJ
  const [pulseWidth, setPulseWidth] = useState(10); // ns

  const chartData = useMemo(() => {
    const t = Array.from({ length: 200 }, (_, i) => i * pulseWidth * 0.1); // ns
    const intensity = t.map(ti => {
      const pulseCenter = pulseWidth * 5;
      return Math.exp(-(((ti - pulseCenter) / pulseWidth) ** 2));
    });
    
    return [
      { x: t, y: intensity, type: "scatter" as const, mode: "lines" as const, name: "Q-Switched Pulse", line: { color: "#60a5fa" }, fill: "tozeroy" },
    ];
  }, [repRate, pulseEnergy, pulseWidth]);

  const peakPower = pulseEnergy / (pulseWidth * 1e-9) / 1000; // kW
  const avgPower = pulseEnergy * repRate; // W

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Q-Switched Laser" description="High-energy pulse generation through repetitive Q-switching of a laser cavity.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Rep Rate (kHz)" value={repRate} onChange={setRepRate} step="1" />
        <ValidatedNumberInput label="Pulse Energy (mJ)" value={pulseEnergy} onChange={setPulseEnergy} step="0.1" />
        <ValidatedNumberInput label="Pulse Width (ns)" value={pulseWidth} onChange={setPulseWidth} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 grid grid-cols-3 gap-4">
        <div><p className="text-xs text-gray-500">Peak Power</p><p className="text-blue-400 font-mono">{peakPower.toFixed(1)} kW</p></div>
        <div><p className="text-xs text-gray-500">Avg Power</p><p className="text-blue-400 font-mono">{avgPower.toFixed(1)} W</p></div>
        <div><p className="text-xs text-gray-500">Duty Cycle</p><p className="text-blue-400 font-mono">{(pulseWidth * 1e-9 * repRate * 1e3 * 100).toFixed(4)}%</p></div>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Time (ns)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} />
    </CalculatorShell>
  );
}
