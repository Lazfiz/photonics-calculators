"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function MultiphotonDepthPage() {
  const [na, setNa] = useState(0.8);
  const [wavelength, setWavelength] = useState(800);
  const [n, setN] = useState(1.33);
  const [pulseWidth, setPulseWidth] = useState(100);
  const [repRate, setRepRate] = useState(80);
  const [avgPower, setAvgPower] = useState(20);
  const [absorption, setAbsorption] = useState(0.02);
  const [scattering, setScattering] = useState(0.1);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const lamEff = lam / 2;
    const lateralRes = 0.325 * lam / na * 1e9;
    const axialRes = 0.88 * lam / (n - Math.sqrt(n * n - na * na)) * 1e6;
    const pulseEnergy = (avgPower * 1e-3) / (repRate * 1e6) * 1e9;
    const peakPower = pulseEnergy / (pulseWidth * 1e-15) * 1e-3;
    const beamWaist = 0.61 * lam / na * 1e6;
    const rayleighRange = Math.PI * beamWaist * beamWaist * n / lam;
    const attenuation = absorption + scattering;
    const depth1e2 = -Math.log(0.01) / attenuation;
    const depth1e3 = -Math.log(0.001) / attenuation;
    const genEfficiency = na * na / (n * n);
    return { lamEff, lateralRes, axialRes, pulseEnergy, peakPower, beamWaist, rayleighRange, depth1e2, depth1e3, genEfficiency };
  }, [na, wavelength, n, pulseWidth, repRate, avgPower, absorption, scattering]);

  const plotData = useMemo(() => {
    const depths = [];
    const signal = [];
    const excitation = [];
    for (let d = 0; d <= 1000; d += 5) {
      depths.push(d);
      const att = Math.exp(-(absorption + scattering) * d / 1000);
      signal.push(att * att * 100);
      excitation.push(att * 100);
    }
    return [
      { x: depths, y: signal, name: "2P signal (%)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: depths, y: excitation, name: "Excitation (%)", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [absorption, scattering]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:underline mb-6 inline-block">← Imaging &amp; Microscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Multiphoton Imaging Depth Calculator</h1>
      <p className="text-gray-400 mb-8">Two-photon excitation depth penetration, resolution, and laser parameters.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <input type="number" step={0.05} min={0.2} max={1.5} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Excitation wavelength (nm)</label>
            <input type="number" step={10} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
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
            <label className="block text-sm text-gray-400 mb-1">Rep rate (MHz)</label>
            <input type="number" step={10} value={repRate} onChange={e => setRepRate(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Average power (mW)</label>
            <input type="number" step={1} value={avgPower} onChange={e => setAvgPower(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Absorption coeff (mm⁻¹)</label>
            <input type="number" step={0.01} value={absorption} onChange={e => setAbsorption(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Scattering coeff (mm⁻¹)</label>
            <input type="number" step={0.01} value={scattering} onChange={e => setScattering(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective λ (½ excitation)</span><span className="font-mono text-blue-400">{(results.lamEff * 1e9).toFixed(0)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-green-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial resolution</span><span className="font-mono text-cyan-400">{results.axialRes.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pulse energy</span><span className="font-mono text-yellow-400">{results.pulseEnergy.toFixed(2)} nJ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak power</span><span className="font-mono text-purple-400">{results.peakPower.toFixed(1)} kW</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Depth at 1% signal</span><span className="font-mono text-red-400">{results.depth1e2.toFixed(0)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Depth at 0.1% signal</span><span className="font-mono text-orange-400">{results.depth1e3.toFixed(0)} µm</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Lateral: 0.325λ/NA | Axial: 0.88λ/(n - √(n²-NA²))</p>
            <p>Signal ∝ exp(-2µ·d) | Depth = -ln(threshold)/µ</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Signal &amp; Excitation vs Depth</h2>
        <Plot data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Depth (µm)", gridcolor: "#333" }, yaxis: { title: "%", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "400px" }} />
      </div>
    </div>
  );
}
