"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SecondHarmonicMicroscopyPage() {
  const [wavelength, setWavelength] = useState(800);
  const [na, setNa] = useState(0.8);
  const [power, setPower] = useState(50);
  const [pulseWidth, setPulseWidth] = useState(100);
  const [repRate, setRepRate] = useState(80);
  const [thickness, setThickness] = useState(1);

  const shgWavelength = wavelength / 2;
  const energyPerPulse = (power * 1000 / repRate) * 1e-9;
  const peakPower = energyPerPulse / (pulseWidth * 1e-15);
  const w0 = 0.61 * wavelength / (na * 1000);
  const spotArea = Math.PI * (w0 * 1e-6) ** 2;
  const peakIntensity = peakPower / spotArea / 1e12;

  // SHG signal ∝ I² × d_eff² × L² × sinc²(ΔkL/2)
  const coherenceLength = Math.PI / (4 * Math.PI * (1.33 - 1) / shgWavelength * 1e-3);
  const shgSignal = peakIntensity * peakIntensity * thickness * thickness * 1e-6;

  // Phase matching parameter
  const deltaN = 0.33; // typical birefringence
  const deltaK = 4 * Math.PI * deltaN / shgWavelength * 1e-3;
  const sincFactor = thickness > 0 ? Math.pow(Math.sin(deltaK * thickness / 2) / (deltaK * thickness / 2), 2) : 1;

  const resolutionChart = useMemo(() => {
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.018);
    return [
      { x: nas, y: nas.map(n => 0.325 * wavelength / n), type: "scatter", mode: "lines", name: "Excitation", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(n => 0.61 * shgWavelength / n), type: "scatter", mode: "lines", name: "SHG Emission", line: { color: "#34d399" } },
      { x: [na], y: [0.325 * wavelength / na], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, shgWavelength, na]);

  const phaseChart = useMemo(() => {
    const thicknesses = Array.from({ length: 80 }, (_, i) => 0.1 + i * 0.15);
    return [
      { x: thicknesses, y: thicknesses.map(t => Math.pow(Math.sin(deltaK * t / 2) / (deltaK * t / 2), 2)), type: "scatter", mode: "lines", name: "sinc²(ΔkL/2)", line: { color: "#f472b6" } },
      { x: thicknesses, y: thicknesses.map(t => t * t), type: "scatter", mode: "lines", name: "L² growth", line: { color: "#60a5fa", dash: "dash" } },
      { x: [thickness], y: [sincFactor], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [deltaK, thickness, sincFactor]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Second-Harmonic Generation Microscopy Calculator</h1>
      <p className="text-gray-400 mb-8">Calculate SHG wavelength, resolution, phase matching, and signal strength for SHG microscopy of collagen, muscle, and other non-centrosymmetric structures.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Excitation λ (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={600} max={1300}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">NA</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.1} max={1.7} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Avg Power (mW)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} min={1} max={500}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pulse Width (fs)</span>
          <input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} min={10} max={500}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Rep. Rate (MHz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} min={0.1} max={250}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Sample Thickness (µm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} min={0.01} max={100} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SHG Wavelength</p>
          <p className="text-2xl font-bold text-green-400">{shgWavelength.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Intensity</p>
          <p className="text-2xl font-bold text-blue-400">{peakIntensity.toFixed(1)} TW/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coherence Length</p>
          <p className="text-2xl font-bold text-yellow-400">{coherenceLength.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Phase Match Factor</p>
          <p className="text-2xl font-bold text-pink-400">{sincFactor.toFixed(3)}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>λ_SHG = λ_excitation / 2</p>
          <p>I_SHG ∝ |χ⁽²⁾|² × I² × L² × sinc²(ΔkL/2)</p>
          <p>Δk = 2(ω·n(ω) - 2ω·n(2ω))/c</p>
          <p>L_coh = π/Δk (coherence length)</p>
          <p>No phase-matching needed in tightly focused geometry</p>
          <p>Forward SHG ∝ L² (constructive), Backward SHG ∝ constant</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <Plot data={resolutionChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Resolution vs NA", font: { size: 13 } }, xaxis: { title: "NA", gridcolor: "#374151" }, yaxis: { title: "Resolution (nm)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} style={{ width: "100%", height: 320 }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <Plot data={phaseChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Phase Matching vs Thickness", font: { size: 13 } }, xaxis: { title: "Thickness (µm)", gridcolor: "#374151" }, yaxis: { title: "Efficiency (a.u.)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} style={{ width: "100%", height: 320 }} />
        </div>
      </div>
    </div>
  );
}
