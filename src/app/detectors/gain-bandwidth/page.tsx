"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function GainBandwidthPage() {
  const [gainDC, setGainDC] = useState(1000); // V/V
  const [gbwProduct, setGbwProduct] = useState(1e6); // Hz (e.g., 1 MHz)
  const [feedbackFraction, setFeedbackFraction] = useState(0.01);

  const chartData = useMemo(() => {
    const freq = Array.from({ length: 300 }, (_, i) => 10 + Math.pow(1e8, i / 300)); // 10 Hz to 100 MHz
    const f3dB = gbwProduct / gainDC;
    // Open-loop gain
    const openLoop = freq.map(f => gainDC / Math.sqrt(1 + Math.pow(f / f3dB, 2)));
    // Closed-loop gain
    const beta = feedbackFraction;
    const closedLoop = freq.map(f => {
      const aF = gainDC / Math.sqrt(1 + Math.pow(f / f3dB, 2));
      const phase = Math.atan(f / f3dB);
      return Math.abs(aF * Math.cos(phase) / (1 + beta * aF * Math.cos(phase)));
    });
    // Gain vs frequency (Bode)
    return [
      { x: freq, y: openLoop, type: "scatter" as const, mode: "lines" as const, name: "Open-loop gain", line: { color: "#60a5fa", width: 2 } },
      { x: freq, y: closedLoop, type: "scatter" as const, mode: "lines" as const, name: "Closed-loop gain", line: { color: "#f87171", width: 2, dash: "dash" } },
    ];
  }, [gainDC, gbwProduct, feedbackFraction]);

  const f3dB = gbwProduct / gainDC;
  const closedLoopGain = 1 / feedbackFraction;
  const closedLoopBW = gbwProduct / closedLoopGain;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Gain-Bandwidth Product</h1>
      <p className="text-gray-400 mb-8">GBW = A<sub>0</sub> · f<sub>-3dB</sub>. The product of DC gain and bandwidth is constant for a single-pole system.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">DC Gain (V/V)</span>
          <input type="number" value={gainDC} onChange={e => setGainDC(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">GBW Product (Hz)</span>
          <input type="number" value={gbwProduct} onChange={e => setGbwProduct(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Feedback Fraction (β)</span>
          <input type="number" value={feedbackFraction} onChange={e => setFeedbackFraction(+e.target.value)} step={0.001} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Open-loop f<sub>-3dB</sub> = <span className="text-blue-400 font-mono">{f3dB.toExponential(2)} Hz</span></p>
        <p className="text-gray-300">Closed-loop gain = <span className="text-blue-400 font-mono">{closedLoopGain.toFixed(1)} V/V</span></p>
        <p className="text-gray-300">Closed-loop bandwidth = <span className="text-blue-400 font-mono">{closedLoopBW.toExponential(2)} Hz</span></p>
        <p className="text-gray-300 text-sm mt-1">A(f) = A<sub>0</sub> / √(1 + (f/f<sub>-3dB</sub>)²)</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Frequency (Hz)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Gain (V/V)", type: "log", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
