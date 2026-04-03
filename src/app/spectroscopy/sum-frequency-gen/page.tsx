"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SumFrequencyGenPage() {
  const [visWavelength, setVisWavelength] = useState(532);
  const [irMinCm, setIrMinCm] = useState(2800);
  const [irMaxCm, setIrMaxCm] = useState(3800);
  const [resolution, setResolution] = useState(200);

  const chartData = useMemo(() => {
    const c = 3e8;
    const visFreq = c / (visWavelength * 1e-9);
    const shifts = Array.from({ length: resolution }, (_, i) => irMinCm + (i / resolution) * (irMaxCm - irMinCm));

    // SFG frequency: f_sfg = f_vis + f_ir
    // f_ir = shift * c * 100 (cm⁻¹ to Hz)
    const sfgWavelengths = shifts.map(s => {
      const irFreq = s * c * 100;
      const sfgFreq = visFreq + irFreq;
      return c / sfgFreq * 1e9;
    });

    // Simulate SFG spectrum with CH stretch peaks
    const peaks = [
      { pos: 2850, w: 15, a: 0.3 },  // symmetric CH2
      { pos: 2880, w: 12, a: 0.8 },  // symmetric CH3
      { pos: 2915, w: 18, a: 0.5 },  // asymmetric CH2
      { pos: 2960, w: 14, a: 1.0 },  // asymmetric CH3
      { pos: 3300, w: 30, a: 0.4 },  // OH stretch
    ];

    const sfgIntensity = shifts.map(s => {
      let intensity = 0.02; // non-resonant background
      peaks.forEach(p => {
        intensity += p.a * Math.exp(-((s - p.pos) ** 2) / (2 * p.w * p.w));
      });
      return intensity;
    });

    return [
      { x: shifts, y: sfgIntensity, type: "scatter", mode: "lines", name: "SFG Intensity",
        line: { color: "#60a5fa", width: 2 },
        yaxis: "y" },
      { x: shifts, y: sfgWavelengths, type: "scatter", mode: "lines", name: "SFG Wavelength",
        line: { color: "#f59e0b", width: 2, dash: "dash" },
        yaxis: "y2" },
    ];
  }, [visWavelength, irMinCm, irMaxCm, resolution]);

  const c = 3e8;
  const visFreq = c / (visWavelength * 1e-9);
  const midIrFreq = ((irMinCm + irMaxCm) / 2) * c * 100;
  const midSfgNm = c / (visFreq + midIrFreq) * 1e9;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Sum Frequency Generation Spectroscopy</h1>
      <p className="text-gray-400 mb-8">Surface-specific vibrational probe. SFG is forbidden in centrosymmetric media — only surfaces and interfaces contribute.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Visible Beam Wavelength (nm)</span>
          <input type="number" value={visWavelength} onChange={e => setVisWavelength(+e.target.value)} min={300} max={1000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">IR Range Min (cm⁻¹)</span>
          <input type="number" value={irMinCm} onChange={e => setIrMinCm(+e.target.value)} min={500} max={5000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">IR Range Max (cm⁻¹)</span>
          <input type="number" value={irMaxCm} onChange={e => setIrMaxCm(+e.target.value)} min={500} max={5000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Spectral Points</span>
          <input type="number" value={resolution} onChange={e => setResolution(+e.target.value)} min={50} max={1000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">SFG:</span> ω_SFG = ω_vis + ω_IR</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">SFG λ:</span> 1/λ_SFG = 1/λ_vis + ν̃_IR</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">χ⁽²⁾ selection:</span> I_SFG ∝ |χ^(2)_s + χ^(2)_NR + χ^(2)_res|²</p>
        <p className="text-gray-300 text-sm">SFG probes the second-order susceptibility χ⁽²⁾ which vanishes in centrosymmetric bulk media.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Reference Values</h3>
        <p className="text-gray-300 text-sm"><span className="text-green-400">Mid-range SFG λ:</span> {midSfgNm.toFixed(2)} nm</p>
        <p className="text-gray-300 text-sm"><span className="text-green-400">IR range:</span> {irMinCm}–{irMaxCm} cm⁻¹</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "SFG Vibrational Spectrum", font: { color: "white" } },
          xaxis: { title: "IR Wavenumber (cm⁻¹)", gridcolor: "#374151" },
          yaxis: { title: "SFG Intensity (a.u.)", gridcolor: "#374151", side: "left" },
          yaxis2: { title: "SFG λ (nm)", gridcolor: "#374151", side: "right", overlaying: "y" },
          margin: { t: 40, r: 60, b: 50, l: 60 },
          showlegend: true, legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} config={{ responsive: true }} />
      </div>
    </div>
  );
}
