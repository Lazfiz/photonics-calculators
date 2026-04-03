"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DichroicPolarizerPage() {
  const [wavelength, setWavelength] = useState(550);
  const [nE, setNE] = useState(2.4);
  const [kE, setKE] = useState(0.01); // extinction coeff extraordinary
  const [nO, setNO] = useState(1.6);
  const [kO, setKO] = useState(2.0); // extinction coeff ordinary (absorbing)
  const [thickness, setThickness] = useState(0.1); // mm

  // Dichroic polarizer: one polarization strongly absorbed (high k), other passes
  // T = exp(-4π k d / λ)
  const d = thickness * 1e-3; // m
  const lam = wavelength * 1e-9; // m

  const alphaO = (4 * Math.PI * kO * d) / lam;
  const alphaE = (4 * Math.PI * kE * d) / lam;

  const TO = Math.exp(-alphaO);
  const TE = Math.exp(-alphaE);

  const extinction = TE / TO;
  const extinctionDB = 10 * Math.log10(extinction);
  const dichroicRatio = kO / kE;

  // Fresnel reflection losses at normal incidence (each surface)
  const RO = ((nO - 1) / (nO + 1)) ** 2;
  const RE = ((nE - 1) / (nE + 1)) ** 2;
  const TOwithReflection = TE * (1 - RE) ** 2;
  const TOblocked = TO * (1 - RO) ** 2;

  const spectralData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + (i / 300) * 1500);
    // k varies with wavelength (approximate Drude-like or Lorentzian absorption edge)
    const kOarr = wls.map(w => {
      const edge = 500;
      return kO * (w < edge ? 3.0 : 1.0 * Math.exp(-((w - edge) ** 2) / (2 * 200 ** 2)) + 0.1);
    });
    const kEarr = wls.map(w => kE * 0.8);
    const TEarr = wls.map((w, i) => Math.exp(-(4 * Math.PI * kEarr[i] * d) / (w * 1e-9)));
    const TOarr = wls.map((w, i) => Math.exp(-(4 * Math.PI * kOarr[i] * d) / (w * 1e-9)));
    return [
      { x: wls, y: TEarr, type: "scatter" as const, mode: "lines" as const, name: "T extraordinary (pass)", line: { color: "#60a5fa", width: 2 } },
      { x: wls, y: TOarr, type: "scatter" as const, mode: "lines" as const, name: "T ordinary (absorb)", line: { color: "#f87171", width: 2 } },
    ];
  }, [kO, kE, d]);

  const thicknessData = useMemo(() => {
    const ths = Array.from({ length: 200 }, (_, i) => 0.01 + (i / 200) * 0.5);
    const TEarr = ths.map(t => Math.exp(-(4 * Math.PI * kE * t * 1e-3) / lam));
    const TOarr = ths.map(t => Math.exp(-(4 * Math.PI * kO * t * 1e-3) / lam));
    const extArr = ths.map(t => {
      const te = Math.exp(-(4 * Math.PI * kE * t * 1e-3) / lam);
      const to = Math.exp(-(4 * Math.PI * kO * t * 1e-3) / lam);
      return 10 * Math.log10(te / to);
    });
    return [
      { x: ths, y: TEarr, type: "scatter" as const, mode: "lines" as const, name: "T pass", line: { color: "#60a5fa", width: 2 } },
      { x: ths, y: TOarr, type: "scatter" as const, mode: "lines" as const, name: "T block", line: { color: "#f87171", width: 2 } },
      { x: ths, y: extArr, type: "scatter" as const, mode: "lines" as const, name: "Extinction (dB)", line: { color: "#a78bfa", width: 2 }, yaxis: "y2" },
    ];
  }, [kE, kO, lam]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Dichroic Polarizer</h1>
      <p className="text-gray-400 mb-8">Model absorption-based dichroic polarizers using complex refractive indices. One polarization state is strongly absorbed while the other transmits.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">T = exp(-4π k d / λ), where k = extinction coefficient</p>
        <p className="text-gray-300 text-sm font-mono">Dichroic ratio R = k<sub>absorb</sub>/k<sub>pass</sub>, Extinction = T<sub>pass</sub>/T<sub>absorb</sub></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} step="10" min="300" max="1800"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">n (pass axis)</span>
          <input type="number" value={nE} onChange={e => setNE(+e.target.value)} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">k (pass axis)</span>
          <input type="number" value={kE} onChange={e => setKE(+e.target.value)} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">n (absorb axis)</span>
          <input type="number" value={nO} onChange={e => setNO(+e.target.value)} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">k (absorb axis)</span>
          <input type="number" value={kO} onChange={e => setKO(+e.target.value)} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Thickness (mm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} step="0.01" min="0.01" max="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNE(2.4); setKE(0.01); setNO(1.6); setKO(2.0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Tourmaline-like</button>
        <button onClick={() => { setNE(1.7); setKE(0.005); setNO(1.7); setKO(0.5); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Wire-grid equiv.</button>
        <button onClick={() => { setNE(1.8); setKE(0.02); setNO(1.5); setKO(3.0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">High-dichroic crystal</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T pass axis</p>
          <p className="text-2xl font-bold text-green-400">{(TE * 100).toFixed(1)}%</p>
          <p className="text-xs text-gray-500">w/ reflection: {(TOwithReflection * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T absorb axis</p>
          <p className="text-2xl font-bold text-red-400">{(TO * 100).toFixed(4)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Extinction Ratio</p>
          <p className="text-2xl font-bold text-yellow-400">{extinctionDB.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dichroic Ratio</p>
          <p className="text-2xl font-bold text-purple-400">{dichroicRatio.toFixed(0)}:1</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Spectral Transmission</h3>
          <Plot data={spectralData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 }, height: 300,
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Transmission & Extinction vs Thickness</h3>
          <Plot data={thicknessData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Thickness (mm)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151", range: [-0.05, 1.05] },
            yaxis2: { title: "Extinction (dB)", overlaying: "y", side: "right", gridcolor: "transparent" },
            margin: { t: 20, r: 60, b: 50, l: 50 }, height: 300,
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
