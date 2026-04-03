"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function BackIlluminationPage() {
  const [fiQE, setFiQE] = useState(0.4); // front-illuminated QE
  const [biQE, setBiQE] = useState(0.95); // back-illuminated QE
  const [fiCFA, setFiCFA] = useState(0.25); // CFA transmission loss
  const [microlensGain, setMicrolensGain] = useState(1.3); // microlens fill factor improvement

  const chartData = useMemo(() => {
    const wavelengths = Array.from({ length: 200 }, (_, i) => 300 + (i / 200) * 700);
    // Simplified spectral response models
    const fiResponse = wavelengths.map(w => {
      const peak = 550;
      const sigma = 150;
      return fiQE * Math.exp(-((w - peak) ** 2) / (2 * sigma ** 2)) * fiCFA * microlensGain;
    });
    const biResponse = wavelengths.map(w => {
      const peak = 550;
      const sigma = 150;
      const blueLoss = w < 400 ? 0.9 : 1;
      return biQE * Math.exp(-((w - peak) ** 2) / (2 * sigma ** 2)) * blueLoss;
    });
    const improvement = wavelengths.map((w, i) => biResponse[i] / Math.max(fiResponse[i], 1e-6));
    return [
      { x: wavelengths, y: fiResponse.map(v => v * 100), type: "scatter" as const, mode: "lines" as const, name: "Front-illuminated", line: { color: "#f87171" } },
      { x: wavelengths, y: biResponse.map(v => v * 100), type: "scatter" as const, mode: "lines" as const, name: "Back-illuminated", line: { color: "#60a5fa" } },
      { x: wavelengths, y: improvement, type: "scatter" as const, mode: "lines" as const, name: "Improvement factor", line: { color: "#34d399", dash: "dash" }, yaxis: "y2" },
    ];
  }, [fiQE, biQE, fiCFA, microlensGain]);

  const effectiveFi = fiQE * fiCFA * microlensGain;
  const improvement = biQE / effectiveFi;
  const snrImprovement = Math.sqrt(improvement);
  const sensitivityGain = 10 * Math.log10(improvement); // dB

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Back-Illuminated vs Front-Illuminated</h1>
      <p className="text-gray-400 mb-8">Back-illuminated sensors: light enters from the substrate side, bypassing gate structures. Higher QE, better blue/UV response, but more complex (thinned substrate, anti-reflection coating).</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Front-illuminated peak QE</span>
          <input type="number" value={fiQE} onChange={e => setFiQE(+e.target.value)} step="0.05" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Back-illuminated peak QE</span>
          <input type="number" value={biQE} onChange={e => setBiQE(+e.target.value)} step="0.05" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">CFA transmission</span>
          <input type="number" value={fiCFA} onChange={e => setFiCFA(+e.target.value)} step="0.05" min="0" max="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Microlens fill factor gain</span>
          <input type="number" value={microlensGain} onChange={e => setMicrolensGain(+e.target.value)} step="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Effective FI QE = <span className="text-blue-400 font-mono">{(effectiveFi * 100).toFixed(1)}%</span></p>
        <p className="text-gray-300">Effective BI QE = <span className="text-blue-400 font-mono">{(biQE * 100).toFixed(1)}%</span></p>
        <p className="text-gray-300">QE improvement = <span className="text-blue-400 font-mono">{improvement.toFixed(2)}×</span></p>
        <p className="text-gray-300">SNR improvement = <span className="text-blue-400 font-mono">{snrImprovement.toFixed(2)}×</span> (√{improvement.toFixed(2)})</p>
        <p className="text-gray-300">Sensitivity gain = <span className="text-blue-400 font-mono">{sensitivityGain.toFixed(1)} dB</span></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "QE (%)", gridcolor: "#374151" },
        yaxis2: { title: "Improvement factor", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 60, r: 70 }, autosize: true, showlegend: true
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
