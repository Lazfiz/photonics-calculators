"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AntibloomingPage() {
  const [wellCapacity, setWellCapacity] = useState(50000); // e-
  const [abThreshold, setAbThreshold] = useState(0.8); // fraction of full well
  const [excessCharge, setExcessCharge] = useState(20000); // e- beyond threshold
  const [chargeDumpEfficiency, setChargeDumpEfficiency] = useState(0.99);

  const chartData = useMemo(() => {
    const incidentElectrons = Array.from({ length: 200 }, (_, i) => (i + 1) * 1000);
    const threshold = wellCapacity * abThreshold;
    const collected = incidentElectrons.map(n => Math.min(n, wellCapacity));
    const bloomingRatio = incidentElectrons.map(n => {
      if (n <= threshold) return 0;
      return Math.max(0, ((n - threshold) * (1 - chargeDumpEfficiency)) / wellCapacity);
    });
    const linearity = incidentElectrons.map(n => {
      if (n <= threshold) return 100;
      return 100 * (threshold + (n - threshold) * chargeDumpEfficiency) / n;
    });
    return [
      { x: incidentElectrons, y: collected, type: "scatter" as const, mode: "lines" as const, name: "Collected (e⁻)", line: { color: "#34d399" }, yaxis: "y" },
      { x: incidentElectrons, y: linearity, type: "scatter" as const, mode: "lines" as const, name: "Linearity (%)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [wellCapacity, abThreshold, excessCharge, chargeDumpEfficiency]);

  const thresholdElectrons = wellCapacity * abThreshold;
  const dumpedCharge = excessCharge * chargeDumpEfficiency;
  const leakedCharge = excessCharge * (1 - chargeDumpEfficiency);
  const maxLinearSignal = wellCapacity * abThreshold;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Anti-Blooming Design</h1>
      <p className="text-gray-400 mb-8">Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Full well capacity (e⁻)</span>
          <input type="number" value={wellCapacity} onChange={e => setWellCapacity(+e.target.value)} step="1000" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">AB threshold (fraction of well)</span>
          <input type="number" value={abThreshold} onChange={e => setAbThreshold(+e.target.value)} step="0.05" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Excess charge (e⁻)</span>
          <input type="number" value={excessCharge} onChange={e => setExcessCharge(+e.target.value)} step="1000" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Dump efficiency</span>
          <input type="number" value={chargeDumpEfficiency} onChange={e => setChargeDumpEfficiency(+e.target.value)} step="0.01" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">AB threshold = <span className="text-blue-400 font-mono">{thresholdElectrons.toFixed(0)} e⁻</span></p>
        <p className="text-gray-300">Max linear signal = <span className="text-blue-400 font-mono">{maxLinearSignal.toFixed(0)} e⁻</span></p>
        <p className="text-gray-300">Dumped charge = <span className="text-blue-400 font-mono">{dumpedCharge.toFixed(0)} e⁻</span></p>
        <p className="text-gray-300">Leaked (blooming) = <span className="text-blue-400 font-mono">{leakedCharge.toFixed(0)} e⁻</span></p>
        <p className="text-gray-300">Effective capacity loss = <span className="text-blue-400 font-mono">{((1 - abThreshold) * 100).toFixed(0)}%</span></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Incident electrons (e⁻)", gridcolor: "#374151" },
        yaxis: { title: "Collected (e⁻)", gridcolor: "#374151" },
        yaxis2: { title: "Linearity (%)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
