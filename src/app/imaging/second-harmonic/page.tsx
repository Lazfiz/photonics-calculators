"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SecondHarmonicPage() {
  const [wavelength, setWavelength] = useState(800); // nm, fundamental
  const [pulseEnergy, setPulseEnergy] = useState(10); // nJ
  const [pulseWidth, setPulseWidth] = useState(100); // fs
  const [na, setNa] = useState(0.8);
  const [n, setN] = useState(1.33);
  const [chi2, setChi2] = useState(1.0); // pm/V (effective)
  const [thickness, setThickness] = useState(100); // µm, sample thickness

  const results = useMemo(() => {
    const shgWavelength = wavelength / 2;
    const peakPower = pulseEnergy * 1e-9 / (pulseWidth * 1e-15); // W
    const w0 = 0.61 * wavelength * 1e-9 / na; // beam waist m
    const intensity = 2 * peakPower / (Math.PI * w0 * w0); // W/m²
    const dn = 0.01; // approximate dispersion for biological tissue
    const coherenceLength = shgWavelength * 1e-9 / (4 * dn);
    const coherenceLengthSafe = isFinite(coherenceLength) && coherenceLength > 0 ? coherenceLength : 5e-6;
    // Simplified SHG power estimate: P_2w ∝ (χ²)² · P² · L² · sinc²(Δk·L/2)
    const P_shg = 1e-12 * (chi2 / 1) ** 2 * (pulseEnergy * 1e-9) ** 2 * (thickness * 1e-6) ** 2 / (w0 * w0);
    const conversionEff = P_shg / (pulseEnergy * 1e-9) * 100;
    return { shgWavelength, peakPower, intensity, coherenceLength: coherenceLengthSafe, P_shg, conversionEff, w0 };
  }, [wavelength, pulseEnergy, pulseWidth, na, n, chi2, thickness]);

  const plotData = useMemo(() => {
    const thicknesses = [];
    const powers = [];
    const phaseMatched = [];
    for (let t = 1; t <= 500; t += 2) {
      thicknesses.push(t);
      const L = t * 1e-6;
      const P = 1e-12 * chi2 ** 2 * (pulseEnergy * 1e-9) ** 2 * L ** 2 / (results.w0 ** 2);
      powers.push(P * 1e9);
      // Phase matched: L² dependence, non-phase-matched: oscillates
      const Pc = P * Math.pow(t / 500, 2) * 10;
      phaseMatched.push(Pc * 1e9);
    }
    return [
      { x: thicknesses, y: powers, name: "SHG power (non-PM)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: thicknesses, y: phaseMatched, name: "SHG power (phase-matched)", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [chi2, pulseEnergy, results.w0]);

  const phasePlot = useMemo(() => {
    const thicknesses = [];
    const efficiency = [];
    const Lc = results.coherenceLength * 1e6; // µm
    for (let t = 0.1; t <= 20; t += 0.05) {
      thicknesses.push(t);
      const x = Math.PI * t / (2 * Lc);
      const sinc = x !== 0 ? Math.sin(x) / x : 1;
      efficiency.push(sinc * sinc);
    }
    return [
      { x: thicknesses, y: efficiency, name: "η(L) ∝ sinc²(ΔkL/2)", line: { color: "#4ade80" }, type: "scatter", mode: "lines" },
    ];
  }, [results.coherenceLength]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:underline mb-6 inline-block">← Imaging &amp; Microscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Second Harmonic Generation Calculator</h1>
      <p className="text-gray-400 mb-8">SHG signal estimation, coherence length, and phase matching for nonlinear imaging.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fundamental wavelength (nm)</label>
            <input type="number" step={10} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse energy (nJ)</label>
            <input type="number" step={1} value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse width (fs)</label>
            <input type="number" step={10} value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">NA</label>
            <input type="number" step={0.01} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">χ² effective (pm/V)</label>
            <input type="number" step={0.1} value={chi2} onChange={e => setChi2(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sample thickness (µm)</label>
            <input type="number" step={10} value={thickness} onChange={e => setThickness(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SHG wavelength</span><span className="font-mono text-blue-400">{results.shgWavelength} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak power</span><span className="font-mono text-red-400">{(results.peakPower / 1e6).toFixed(1)} MW</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak intensity</span><span className="font-mono text-yellow-400">{(results.intensity / 1e16).toFixed(2)} × 10¹⁶ W/m²</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Coherence length L_c</span><span className="font-mono text-green-400">{(results.coherenceLength * 1e6).toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SHG power (est.)</span><span className="font-mono text-purple-400">{(results.P_shg * 1e9).toExponential(2)} nW</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>λ_SHG = λ_fund / 2</p>
            <p>L_c = λ_SHG / (4|n(2ω) − n(ω)|)</p>
            <p>P_2ω ∝ (χ²)² · P²_ω · L² · sinc²(ΔkL/2)</p>
            <p>SHG requires non-centrosymmetric media</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">SHG Power vs Sample Thickness</h2>
          <Plot data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Thickness (µm)", gridcolor: "#333" }, yaxis: { title: "SHG power (nW)", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "350px" }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Phase Matching Efficiency</h2>
          <Plot data={phasePlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Thickness (µm)", gridcolor: "#333" }, yaxis: { title: "Relative efficiency", gridcolor: "#333", range: [0, 1.1] }, margin: { l: 60, r: 20, t: 20, b: 60 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "350px" }} />
        </div>
      </div>
    </div>
  );
}
