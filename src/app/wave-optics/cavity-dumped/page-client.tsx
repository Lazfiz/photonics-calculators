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

  const roundTripNs = (2 * cavityLength) / 3e8 * 1e9; // ns
  const avgPower = repRate * 1e6 * pulseEnergy * 1e-6; // W (MHz × μJ → W)
  const peakPower = pulseEnergy * 1e-6 / (roundTripNs * 1e-9); // W (energy / duration)

  const chartData = useMemo(() => {
    // Cavity-dumped pulse: extracted over ~1 round-trip time
    const pulseWidthNs = roundTripNs; // pulse duration ≈ round-trip time
    const tRange = pulseWidthNs * 6;
    const t = Array.from({ length: 200 }, (_, i) => (tRange * i) / 199 - tRange * 0.3);
    const centerT = tRange * 0.35;
    const intensity = t.map(ti => {
      const envelope = Math.exp(-(((ti - centerT) / (pulseWidthNs * 0.4)) ** 2));
      return envelope;
    });
    return [
      { x: t, y: intensity, type: "scatter" as const, mode: "lines" as const, name: "Cavity Dumped Pulse", line: { color: "#60a5fa" } },
    ];
  }, [roundTripNs, repRate, pulseEnergy]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Cavity-Dumped Laser" description="Energy extraction from a laser cavity using fast Q-switching or intracavity modulation.">

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Rep Rate (MHz)" value={repRate} onChange={setRepRate} step="1" />
        <ValidatedNumberInput label="Pulse Energy (μJ)" value={pulseEnergy} onChange={setPulseEnergy} step="1" />
        <ValidatedNumberInput label="Cavity Length (m)" value={cavityLength} onChange={setCavityLength} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-gray-900 rounded p-4">
          <p className="text-sm text-gray-400">Round-trip time</p>
          <p className="text-xl font-bold text-blue-400 font-mono">{roundTripNs.toFixed(2)} ns</p>
        </div>
        <div className="bg-gray-900 rounded p-4">
          <p className="text-sm text-gray-400">Pulse Duration (≈ RT)</p>
          <p className="text-xl font-bold text-green-400 font-mono">{roundTripNs.toFixed(2)} ns</p>
        </div>
        <div className="bg-gray-900 rounded p-4">
          <p className="text-sm text-gray-400">Average Power</p>
          <p className="text-xl font-bold text-orange-400 font-mono">{avgPower.toFixed(2)} W</p>
        </div>
        <div className="bg-gray-900 rounded p-4">
          <p className="text-sm text-gray-400">Peak Power (est.)</p>
          <p className="text-xl font-bold text-purple-400 font-mono">{(peakPower / 1e3).toFixed(1)} kW</p>
        </div>
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
