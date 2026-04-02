"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SNRAveragingPage() {
  const [snrSingle, setSnrSingle] = useState(10);
  const [maxScans, setMaxScans] = useState(1000);

  const chartData = useMemo(() => {
    const Ns = Array.from({ length: 200 }, (_, i) => Math.max(1, Math.round(Math.pow(10, i * Math.log10(maxScans) / 200))));
    const snr = Ns.map(N => snrSingle * Math.sqrt(N));
    return [{ x: Ns, y: snr, type: "scatter" as const, mode: "lines" as const, name: "SNR after N scans", line: { color: "#60a5fa" } }];
  }, [snrSingle, maxScans]);

  const snrAt10 = snrSingle * Math.sqrt(10);
  const snrAt100 = snrSingle * Math.sqrt(100);
  const snrAtMax = snrSingle * Math.sqrt(maxScans);
  const improvement = Math.sqrt(maxScans);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">SNR Improvement with Co-Adding</h1>
      <p className="text-gray-400 mb-8">SNR improves as √N where N is the number of co-added scans. Signal adds linearly, noise as √N.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Single-scan SNR</span>
          <input type="number" value={snrSingle} onChange={e => setSnrSingle(+e.target.value)} min={0.1} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Max Scans</span>
          <input type="number" value={maxScans} onChange={e => setMaxScans(Math.max(1, +e.target.value))} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">SNR @ 10 scans = <span className="text-blue-400 font-mono">{snrAt10.toFixed(1)}</span></p>
        <p className="text-gray-300">SNR @ 100 scans = <span className="text-blue-400 font-mono">{snrAt100.toFixed(1)}</span></p>
        <p className="text-gray-300">SNR @ {maxScans} scans = <span className="text-blue-400 font-mono">{snrAtMax.toFixed(1)}</span></p>
        <p className="text-gray-300">Improvement factor = <span className="text-blue-400 font-mono">{improvement.toFixed(1)}×</span></p>
      </div>

      <Plot data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Number of Scans", type: "log", gridcolor: "#374151" }, yaxis: { title: "SNR", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
