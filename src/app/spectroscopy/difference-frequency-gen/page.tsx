"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DifferenceFrequencyGenPage() {
  const [pumpWavelength, setPumpWavelength] = useState(1064);
  const [signalWavelength, setSignalWavelength] = useState(1550);
  const [crystalLength, setCrystalLength] = useState(20); // mm
  const [walkOff, setWalkOff] = useState(0.5); // mrad

  const chartData = useMemo(() => {
    const c = 3e8;
    const pumpFreq = c / (pumpWavelength * 1e-9);
    const signalFreq = c / (signalWavelength * 1e-9);
    const idlerFreq = pumpFreq - signalFreq;
    const idlerNm = c / idlerFreq * 1e9;

    // Phase mismatch vs crystal length
    const lengths = Array.from({ length: 200 }, (_, i) => (i / 200) * crystalLength * 2);
    const deltaK = 0.5; // mm⁻¹ example
    const sincSquared = lengths.map(L => {
      const dkl = deltaK * L;
      return dkl === 0 ? 1 : (Math.sin(dkl / 2) / (dkl / 2)) ** 2;
    });

    // Tuning curve: idler wavelength vs signal wavelength
    const sigRange = Array.from({ length: 300 }, (_, i) => 1000 + (i / 300) * 1500);
    const idlerTune = sigRange.map(sig => {
      const sigF = c / (sig * 1e-9);
      const idF = pumpFreq - sigF;
      return idF > 0 ? c / idF * 1e9 : NaN;
    });

    return [
      { x: lengths, y: sincSquared, type: "scatter", mode: "lines", name: "sinc²(Δk·L/2)",
        line: { color: "#60a5fa" }, xaxis: "x", yaxis: "y" },
      { x: sigRange, y: idlerTune, type: "scatter", mode: "lines", name: "Idler tuning",
        line: { color: "#f59e0b", width: 2 }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [pumpWavelength, signalWavelength, crystalLength, walkOff]);

  const c = 3e8;
  const pumpFreq = c / (pumpWavelength * 1e-9);
  const signalFreq = c / (signalWavelength * 1e-9);
  const idlerFreq = pumpFreq - signalFreq;
  const idlerNm = idlerFreq > 0 ? c / idlerFreq * 1e9 : NaN;
  const idlerWavenumber = idlerFreq > 0 ? idlerFreq / c * 1e-2 : NaN;
  const coherenceLength = 3.14159; // π/Δk for Δk=1 mm⁻¹
  const quantumEfficiency = signalWavelength / (idlerNm || signalWavelength);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Difference Frequency Generation</h1>
      <p className="text-gray-400 mb-8">Generate tunable mid-IR via DFG: ω_idler = ω_pump − ω_signal. Essential for IR spectroscopy sources.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Pump Wavelength (nm)</span>
          <input type="number" value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} min={300} max={3000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Signal Wavelength (nm)</span>
          <input type="number" value={signalWavelength} onChange={e => setSignalWavelength(+e.target.value)} min={300} max={5000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Crystal Length (mm)</span>
          <input type="number" value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} min={0.1} max={100}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Walk-off Angle (mrad)</span>
          <input type="number" value={walkOff} onChange={e => setWalkOff(+e.target.value)} min={0} max={100} step={0.1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">DFG:</span> ω_idler = ω_pump − ω_signal</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Phase matching:</span> Δk = k_pump − k_signal − k_idler − 2π/Λ</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Conversion:</span> η ∝ L² · sinc²(Δk·L/2)</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Manley-Rowe:</span> P_idler/ω_idler = P_signal/ω_signal</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Computed Values</h3>
        <p className="text-gray-300 text-sm"><span className="text-green-400">Idler wavelength:</span> {idlerNm?.toFixed(2) ?? "N/A"} nm</p>
        <p className="text-gray-300 text-sm"><span className="text-green-400">Idler wavenumber:</span> {idlerWavenumber?.toFixed(1) ?? "N/A"} cm⁻¹</p>
        <p className="text-gray-300 text-sm"><span className="text-green-400">Quantum efficiency (λ_idler/λ_sig):</span> {quantumEfficiency.toFixed(3)}</p>
        <p className="text-gray-300 text-sm"><span className="text-green-400">Walk-off length:</span> {(crystalLength * walkOff / 1000).toFixed(3)} mm</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "DFG: Phase Matching & Tuning", font: { color: "white" } },
          xaxis: { title: "Crystal Length (mm)", gridcolor: "#374151", domain: [0, 0.45] },
          yaxis: { title: "sinc²", gridcolor: "#374151" },
          xaxis2: { title: "Signal λ (nm)", gridcolor: "#374151", domain: [0.55, 1], anchor: "y2" },
          yaxis2: { title: "Idler λ (nm)", gridcolor: "#374151", anchor: "x2" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
          showlegend: true, legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} config={{ responsive: true }} />
      </div>
    </div>
  );
}
