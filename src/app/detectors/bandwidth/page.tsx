"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function BandwidthPage() {
  const [bandwidth, setBandwidth] = useState(1e6); // Hz
  const [capacitance, setCapacitance] = useState(10e-12); // F
  const [resistance, setResistance] = useState(50); // Ohms
  const [transimpedance, setTransimpedance] = useState(1e3); // V/A
  const [q] = useState(1.6e-19);
  const [kB] = useState(1.381e-23);
  const [temperature] = useState(300);

  const chartData = useMemo(() => {
    const bws = Array.from({ length: 200 }, (_, i) => 1e3 * Math.pow(1e7, i / 200));
    const johnsonNoise = bws.map(BW => Math.sqrt(4 * kB * temperature * resistance * BW) * transimpedance / resistance);
    // Total noise: Johnson + 1/f + shot (assume 1μA photocurrent)
    const Iphoto = 1e-6;
    const shotNoise = bws.map(BW => Math.sqrt(2 * q * Iphoto * BW) * transimpedance);
    const totalNoise = bws.map((BW, i) => Math.sqrt(johnsonNoise[i] ** 2 + shotNoise[i] ** 2));
    return [
      { x: bws, y: johnsonNoise, type: "scatter" as const, mode: "lines" as const, name: "Johnson", line: { color: "#f87171" } },
      { x: bws, y: shotNoise, type: "scatter" as const, mode: "lines" as const, name: "Shot", line: { color: "#34d399" } },
      { x: bws, y: totalNoise, type: "scatter" as const, mode: "lines" as const, name: "Total", line: { color: "#60a5fa" } },
    ];
  }, [bandwidth, capacitance, resistance, transimpedance]);

  const vJohnson = Math.sqrt(4 * kB * temperature * resistance * bandwidth) * transimpedance / resistance;
  const Iphoto = 1e-6;
  const vShot = Math.sqrt(2 * q * Iphoto * bandwidth) * transimpedance;
  const vTotal = Math.sqrt(vJohnson ** 2 + vShot ** 2);
  const bw3dB = 1 / (2 * Math.PI * resistance * capacitance);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Bandwidth vs Noise Trade-off</h1>
      <p className="text-gray-400 mb-8">Noise increases with √Δf. Wider bandwidth = faster response but more noise.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Bandwidth (Hz)</span>
          <input type="number" value={bandwidth} onChange={e => setBandwidth(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Capacitance (pF)</span>
          <input type="number" value={capacitance * 1e12} onChange={e => setCapacitance(+e.target.value * 1e-12)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Resistance (Ω)</span>
          <input type="number" value={resistance} onChange={e => setResistance(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Transimpedance (V/A)</span>
          <input type="number" value={transimpedance} onChange={e => setTransimpedance(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">RC bandwidth (3dB) = <span className="text-blue-400 font-mono">{bw3dB.toExponential(3)} Hz</span></p>
        <p className="text-gray-300">Johnson noise (V) = <span className="text-blue-400 font-mono">{vJohnson.toExponential(3)} V</span></p>
        <p className="text-gray-300">Shot noise (V) = <span className="text-blue-400 font-mono">{vShot.toExponential(3)} V</span></p>
        <p className="text-gray-300">Total noise (V) = <span className="text-blue-400 font-mono">{vTotal.toExponential(3)} V</span></p>
      </div>

      <Plot data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Bandwidth (Hz)", type: "log", gridcolor: "#374151" }, yaxis: { title: "Output Noise Voltage (V)", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 70, r: 20 }, autosize: true, showlegend: true }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
