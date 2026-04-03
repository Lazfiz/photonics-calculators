"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ThirdHarmonicGenerationPage() {
  const [wavelength, setWavelength] = useState(1200);
  const [na, setNa] = useState(0.8);
  const [n, setN] = useState(1.33);
  const [pulseWidth, setPulseWidth] = useState(100);
  const [avgPower, setAvgPower] = useState(30);
  const [repRate, setRepRate] = useState(80);
  const [chi3, setChi3] = useState(1);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const thgWavelength = lam / 3;
    const thgNm = thgWavelength * 1e9;
    const lateralRes = 0.325 * lam / na * 1e9;
    const pulseEnergy = (avgPower * 1e-3) / (repRate * 1e6) * 1e9;
    const peakIntensity = (pulseEnergy * 1e-9) / (Math.PI * (lam / na) ** 2 * pulseWidth * 1e-15);
    const thgEfficiency = chi3 * chi3 * (peakIntensity * 1e-4) ** 2 * 1e-12;
    const fwdBwdRatio = 3;
    const spectralBandwidth = 0.44 / (pulseWidth * 1e-15) * 1e-12;
    const gouyPhaseShift = 3 * Math.PI;
    return { thgNm, lateralRes, pulseEnergy, peakIntensity, thgEfficiency, fwdBwdRatio, spectralBandwidth, gouyPhaseShift };
  }, [wavelength, na, n, pulseWidth, avgPower, repRate, chi3]);

  const plotData = useMemo(() => {
    const wavelengths = [];
    const thgWavelengths = [];
    const lateralRes = [];
    for (let w = 1000; w <= 1600; w += 5) {
      wavelengths.push(w);
      thgWavelengths.push(w / 3);
      lateralRes.push(0.325 * w * 1e-9 / na * 1e9);
    }
    return [
      { x: wavelengths, y: thgWavelengths, name: "THG wavelength (nm)", line: { color: "#a78bfa" }, type: "scatter", mode: "lines", yaxis: "y" },
      { x: wavelengths, y: lateralRes, name: "Lateral res (nm)", line: { color: "#f87171" }, type: "scatter", mode: "lines", yaxis: "y2" },
    ];
  }, [na]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:underline mb-6 inline-block">← Imaging &amp; Microscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Third Harmonic Generation (THG) Calculator</h1>
      <p className="text-gray-400 mb-8">THG imaging parameters for interface and membrane contrast in biological samples.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Excitation wavelength (nm)</label>
            <input type="number" step={5} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <input type="number" step={0.05} min={0.2} max={1.5} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <input type="number" step={0.01} value={n} onChange={e => setN(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse width (fs)</label>
            <input type="number" step={10} value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Average power (mW)</label>
            <input type="number" step={5} value={avgPower} onChange={e => setAvgPower(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rep rate (MHz)</label>
            <input type="number" step={10} value={repRate} onChange={e => setRepRate(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">THG wavelength</span><span className="font-mono text-purple-400">{results.thgNm.toFixed(0)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-green-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pulse energy</span><span className="font-mono text-yellow-400">{results.pulseEnergy.toFixed(2)} nJ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak intensity (est.)</span><span className="font-mono text-cyan-400">{results.peakIntensity.toExponential(2)} W/m²</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Fwd/Bwd ratio</span><span className="font-mono text-blue-400">~{results.fwdBwdRatio}:1</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Spectral bandwidth</span><span className="font-mono text-orange-400">{results.spectralBandwidth.toFixed(2)} THz</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Gouy phase shift</span><span className="font-mono text-red-400">{results.gouyPhaseShift.toFixed(1)} rad</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>λ_THG = λ_exc / 3 | Lateral: 0.325λ/NA</p>
            <p>I_THG ∝ χ³² · I³ | Forward-biased emission</p>
            <p>Gouy phase: 3π (vs π for SHG) — no strict phase matching needed</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">THG Wavelength &amp; Resolution vs Excitation Wavelength</h2>
        <Plot data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Excitation λ (nm)", gridcolor: "#333" }, yaxis: { title: "THG λ (nm)", gridcolor: "#333", side: "left" }, yaxis2: { title: "Lateral res (nm)", gridcolor: "#333", side: "right", overlaying: "y" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 60, t: 20, b: 60 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "400px" }} />
      </div>
    </div>
  );
}
