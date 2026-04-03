"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function StimulatedRamanMicroscopyPage() {
  const [pumpWavelength, setPumpWavelength] = useState(800);
  const [ramanShift, setRamanShift] = useState(2850);
  const [na, setNa] = useState(1.0);
  const [pumpPower, setPumpPower] = useState(100);
  const [stokesPower, setStokesPower] = useState(80);
  const [pixelDwell, setPixelDwell] = useState(1);
  const [nPixel] = useState(512);

  const stokesWavelength = 1 / (1 / (pumpWavelength * 1e-3) - ramanShift / 1e7) * 1e3;
  const beatFreq = ramanShift * 3e10; // Hz

  // SRS signal: SRS ∝ Im[χ³] × I_pump × I_stokes
  const srsSignal = Math.pow(10, -12) * pumpPower * stokesPower * 1;

  // Noise: shot noise limited ∝ √(P_pump × P_stokes)
  const shotNoise = Math.sqrt(pumpPower * stokesPower) * 0.1;
  const snr = srsSignal / (shotNoise * 1e-12);

  // Spatial resolution
  const lateralRes = 0.61 * pumpWavelength / na;
  const axialRes = 2 * 1.33 * pumpWavelength / (na * na);

  // Imaging time estimate
  const frameTime = nPixel * nPixel * pixelDwell * 1e-6; // seconds

  const snrChart = useMemo(() => {
    const powers = Array.from({ length: 60 }, (_, i) => 5 + i * 5);
    return [
      { x: powers, y: powers.map(p => Math.pow(10, -12) * p * stokesPower / (Math.sqrt(p * stokesPower) * 0.1 * 1e-12)), type: "scatter", mode: "lines", name: "SNR (SRS)", line: { color: "#34d399" } },
      { x: [pumpPower], y: [snr], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [pumpPower, stokesPower, snr]);

  const depthChart = useMemo(() => {
    const depths = Array.from({ length: 60 }, (_, i) => i * 20);
    return [
      { x: depths, y: depths.map(d => Math.exp(-d / 200) * pumpPower), type: "scatter", mode: "lines", name: "Pump at depth", line: { color: "#60a5fa" } },
      { x: depths, y: depths.map(d => Math.exp(-d / 180) * stokesPower), type: "scatter", mode: "lines", name: "Stokes at depth", line: { color: "#f472b6" } },
      { x: depths, y: depths.map(d => Math.exp(-d / 200) * pumpPower * Math.exp(-d / 180) * stokesPower * 1e-4), type: "scatter", mode: "lines", name: "SRS Signal", line: { color: "#34d399" } },
    ];
  }, [pumpPower, stokesPower]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Stimulated Raman Scattering Microscopy Calculator</h1>
      <p className="text-gray-400 mb-8">Calculate SRS signal levels, SNR, resolution, and imaging speed for label-free chemical imaging.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Pump λ (nm)</span>
          <input type="number" value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} min={600} max={1100}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Raman Shift (cm⁻¹)</span>
          <input type="number" value={ramanShift} onChange={e => setRamanShift(+e.target.value)} min={200} max={4000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Numerical Aperture</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.1} max={1.7} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pump Power (mW)</span>
          <input type="number" value={pumpPower} onChange={e => setPumpPower(+e.target.value)} min={1} max={500}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Stokes Power (mW)</span>
          <input type="number" value={stokesPower} onChange={e => setStokesPower(+e.target.value)} min={1} max={500}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pixel Dwell (µs)</span>
          <input type="number" value={pixelDwell} onChange={e => setPixelDwell(+e.target.value)} min={0.1} max={100}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stokes λ</p>
          <p className="text-2xl font-bold text-blue-400">{stokesWavelength.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Resolution</p>
          <p className="text-2xl font-bold text-green-400">{lateralRes.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Frame Time ({nPixel}×{nPixel})</p>
          <p className="text-2xl font-bold text-yellow-400">{frameTime.toFixed(2)} s</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beat Frequency</p>
          <p className="text-2xl font-bold text-purple-400">{(beatFreq / 1e12).toFixed(1)} THz</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>S_SRS ∝ Im[χ⁽³⁾] × I_pump × I_stokes × L</p>
          <p>SRG: pump gains energy at Raman resonance</p>
          <p>SRL: Stokes loses energy at Raman resonance</p>
          <p>SNR ∝ √(P_pump × P_stokes × τ_dwell) / shot_noise</p>
          <p>No non-resonant background (unlike CARS)</p>
          <p>Frame time = N² × τ_pixel (for N×N frame)</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <Plot data={snrChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "SNR vs Pump Power", font: { size: 13 } }, xaxis: { title: "Pump Power (mW)", gridcolor: "#374151" }, yaxis: { title: "SNR", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} style={{ width: "100%", height: 320 }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <Plot data={depthChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Signal vs Tissue Depth", font: { size: 13 } }, xaxis: { title: "Depth (µm)", gridcolor: "#374151" }, yaxis: { title: "Signal (a.u.)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} style={{ width: "100%", height: 320 }} />
        </div>
      </div>
    </div>
  );
}
