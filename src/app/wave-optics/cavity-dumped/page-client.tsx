"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function CavityDumpedLaserPage() {
  const [repRate, setRepRate] = useURLState("repRate", 80); // MHz
  const [pulseEnergy, setPulseEnergy] = useURLState("pulseEnergy", 10); // μJ
  const [cavityLength, setCavityLength] = useURLState("cavityLength", 1.5); // m

  const chartData = useMemo(() => {
    const t = Array.from({ length: 200 }, (_, i) => i * 0.5);
    const roundTrip = (2 * cavityLength) / 3e8 * 1e6; // μs
    const intensity = t.map(ti => {
      const envelope = Math.exp(-(((ti - 50) / 20) ** 2));
      return envelope * Math.sin(ti * 0.5) ** 2;
    });
    return [
      { x: t, y: intensity, type: "scatter" as const, mode: "lines" as const, name: "Cavity Dumped Pulse", line: { color: "#60a5fa" } },
    ];
  }, [repRate, pulseEnergy, cavityLength]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Cavity-Dumped Laser" description="Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Rep Rate (MHz)" value={repRate} onChange={setRepRate} step="1" />
        <ValidatedNumberInput label="Pulse Energy (μJ)" value={pulseEnergy} onChange={setPulseEnergy} step="1" />
        <ValidatedNumberInput label="Cavity Length (m)" value={cavityLength} onChange={setCavityLength} step="0.1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Round-trip time: <span className="text-blue-400 font-mono">{((2 * cavityLength) / 3e8 * 1e6).toFixed(2)} μs</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
        xaxis: { title: "Time (μs)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} />
    </CalculatorShell>
  );
}
