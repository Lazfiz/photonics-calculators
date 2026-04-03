"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DualCombSpectroscopyPage() {
  const [repRate1, setRepRate1] = useState(100); // MHz
  const [repRate2, setRepRate2] = useState(100.001); // MHz
  const [ceoFreq1, setCeoFreq1] = useState(20); // MHz
  const [ceoFreq2, setCeoFreq2] = useState(20.1); // MHz
  const [centerWavelength, setCenterWavelength] = useState(1550); // nm
  const [numModes, setNumModes] = useState(200000);

  const c = 3e8;
  const frep1Hz = repRate1 * 1e6;
  const frep2Hz = repRate2 * 1e6;
  const deltaFrep = Math.abs(frep2Hz - frep1Hz);
  const centerFreq = c / (centerWavelength * 1e-9);

  const opticalBW = numModes * Math.max(frep1Hz, frep2Hz);
  const opticalBWnm = (centerWavelength ** 2 * opticalBW) / c * 1e9;
  const updateTime = 1 / deltaFrep;
  const resolutionHz = deltaFrep;
  const resolutionNm = (centerWavelength ** 2 * resolutionHz) / c * 1e9;

  const chartData = useMemo(() => {
    const fMin = centerFreq - opticalBW / 2;
    const step = Math.max(1, Math.floor(numModes / 500));
    const count = Math.floor(numModes / step);
    const modes1 = Array.from({ length: count }, (_, i) => fMin + i * step * frep1Hz);
    const modes2 = Array.from({ length: count }, (_, i) => fMin + i * step * frep2Hz);
    return [
      { x: modes1.map(f => (f - centerFreq) / 1e12), y: modes1.map(() => 1), type: "scatter", mode: "lines",
        name: `Comb 1 (${repRate1} MHz)`, line: { color: "#34d399", width: 1 } },
      { x: modes2.map(f => (f - centerFreq) / 1e12), y: modes2.map(() => 0.8), type: "scatter", mode: "lines",
        name: `Comb 2 (${repRate2} MHz)`, line: { color: "#f87171", width: 1 } },
    ];
  }, [repRate1, repRate2, numModes, centerFreq, opticalBW]);

  const rfData = useMemo(() => {
    const maxRf = Math.min(deltaFrep * 10, frep1Hz * 1e6 / 2);
    const rfFreqs = Array.from({ length: 200 }, (_, i) => i * maxRf / 200);
    const rfIntensity = rfFreqs.map(f => {
      const beat = Math.exp(-((f - deltaFrep * 2) ** 2) / (deltaFrep ** 2)) + 0.3 * Math.exp(-((f - deltaFrep * 5) ** 2) / (deltaFrep * 2) ** 2);
      return beat;
    });
    return [
      { x: rfFreqs.map(f => f / 1e6), y: rfIntensity, type: "scatter", mode: "lines",
        name: "RF Multi-Heterodyne", line: { color: "#a78bfa", width: 2 }, fill: "tozeroy", fillcolor: "rgba(167,139,250,0.1)" },
    ];
  }, [deltaFrep, frep1Hz]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Dual-Comb Spectroscopy Calculator</h1>
      <p className="text-gray-400 mb-8">Model dual-comb spectroscopy parameters: resolution, bandwidth, update rate, and multi-heterodyne RF spectrum.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Comb 1 Rep Rate (MHz)</span>
          <input type="number" value={repRate1} onChange={e => setRepRate1(+e.target.value)} min="10" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Comb 2 Rep Rate (MHz)</span>
          <input type="number" value={repRate2} onChange={e => setRepRate2(+e.target.value)} min="10" step="0.0001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Center Wavelength (nm)</span>
          <input type="number" value={centerWavelength} onChange={e => setCenterWavelength(+e.target.value)} min="400"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Comb Modes</span>
          <input type="number" value={numModes} onChange={e => setNumModes(+e.target.value)} min="1000" step="10000"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">f_CEO Comb 1 (MHz)</span>
          <input type="number" value={ceoFreq1} onChange={e => setCeoFreq1(+e.target.value)} min="0" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">f_CEO Comb 2 (MHz)</span>
          <input type="number" value={ceoFreq2} onChange={e => setCeoFreq2(+e.target.value)} min="0" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δf_rep (resolution)</p>
          <p className="text-xl font-bold text-green-400">{deltaFrep.toFixed(0)} Hz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Update Time</p>
          <p className="text-xl font-bold text-blue-400">{(updateTime * 1e6).toFixed(1)} μs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Bandwidth</p>
          <p className="text-xl font-bold text-yellow-400">{opticalBWnm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Resolution (nm)</p>
          <p className="text-xl font-bold text-red-400">{resolutionNm.toExponential(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>fₙ = f_CEO + n · f_rep — comb mode frequencies</p>
        <p>Spectral resolution = |f_rep1 − f_rep2| = Δf_rep</p>
        <p>Update time = 1/Δf_rep (one full interferogram period)</p>
        <p>Optical BW ≈ N_modes × f_rep → maps to RF domain 0 to f_rep</p>
        <p className="text-gray-500">Multi-heterodyne: each optical comb pair maps to a unique RF beat note</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "Optical Comb Teeth", font: { size: 13 } },
          xaxis: { title: "Relative Frequency (THz)", gridcolor: "#374151" },
          yaxis: { title: "Amplitude", gridcolor: "#374151", range: [0, 1.2] },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} config={{ responsive: true, displayModeBar: false }} />
        <Plot data={rfData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "RF Multi-Heterodyne Spectrum", font: { size: 13 } },
          xaxis: { title: "RF Frequency (MHz)", gridcolor: "#374151" },
          yaxis: { title: "Intensity", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
