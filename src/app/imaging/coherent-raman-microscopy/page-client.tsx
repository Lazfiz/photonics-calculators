"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function CoherentRamanMicroscopyPage() {
  const [pumpWavelength, setPumpWavelength] = useState(800);
  const [ramanShift, setRamanShift] = useState(2850);
  const [na, setNa] = useState(1.0);
  const [pumpPower, setPumpPower] = useState(100);
  const [stokesPower, setStokesPower] = useState(80);
  const [pulseWidth, setPulseWidth] = useState(5);
  const [repRate, setRepRate] = useState(20);

  const stokesWavelength = 1 / (1 / (pumpWavelength * 1e-3) - ramanShift / 1e7) * 1e3;
  const energyPump = 1240 / pumpWavelength;
  const energyStokes = 1240 / stokesWavelength;
  const energyBeat = energyPump - energyStokes;

  // CARS/SRS resolution
  const lateralRes = 0.61 * pumpWavelength / na;
  const axialRes = 2 * 1.33 * pumpWavelength / (na * na);

  // Spectral resolution (Fourier-limited)
  const spectralRes = 0.44 * (pumpWavelength * 1e-3) ** 2 / (pulseWidth * 1e-3); // cm⁻¹

  const snrChart = useMemo(() => {
    const shifts = Array.from({ length: 100 }, (_, i) => 500 + i * 50);
    const stokesLams = shifts.map(s => 1 / (1 / (pumpWavelength * 1e-3) - s / 1e7) * 1e3);
    return [
      { x: shifts, y: shifts.map(() => Math.sqrt(pumpPower * stokesPower) * 0.1), type: "scatter", mode: "lines", name: "CARS Signal", line: { color: "#34d399" } },
      { x: shifts, y: shifts.map(s => s * spectralRes * 0.001), type: "scatter", mode: "lines", name: "Non-resonant BG", line: { color: "#f87171", dash: "dash" } },
      { x: [ramanShift], y: [Math.sqrt(pumpPower * stokesPower) * 0.1], type: "scatter", mode: "markers", name: "Current", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [pumpPower, stokesPower, ramanShift, spectralRes]);

  const wavelengthChart = useMemo(() => {
    const shifts = Array.from({ length: 100 }, (_, i) => 500 + i * 50);
    return [
      { x: shifts, y: shifts.map(s => 1 / (1 / (pumpWavelength * 1e-3) - s / 1e7) * 1e3), type: "scatter", mode: "lines", name: "Stokes λ", line: { color: "#60a5fa" } },
      { x: [ramanShift], y: [stokesWavelength], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [pumpWavelength, ramanShift, stokesWavelength]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Coherent Raman Microscopy Calculator" description="Calculate Stokes wavelengths, spectral resolution, and spatial resolution for CARS and SRS microscopy.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pump λ (nm)</span>
          <input type="number" value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} min={600} max={1100}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Raman Shift (cm⁻¹)</span>
          <input type="number" value={ramanShift} onChange={e => setRamanShift(+e.target.value)} min={200} max={4000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Numerical Aperture</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.1} max={1.7} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pulse Width (ps)</span>
          <input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} min={0.05} max={20} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pump Power (mW)</span>
          <input type="number" value={pumpPower} onChange={e => setPumpPower(+e.target.value)} min={1} max={500}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Stokes Power (mW)</span>
          <input type="number" value={stokesPower} onChange={e => setStokesPower(+e.target.value)} min={1} max={500}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Rep. Rate (MHz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} min={0.1} max={100}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Stokes λ</p>
          <p className="text-2xl font-bold text-blue-400">{stokesWavelength.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spectral Resolution</p>
          <p className="text-2xl font-bold text-green-400">{spectralRes.toFixed(1)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Resolution</p>
          <p className="text-2xl font-bold text-yellow-400">{lateralRes.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Axial Resolution</p>
          <p className="text-2xl font-bold text-purple-400">{axialRes.toFixed(0)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>1/λ_Stokes = 1/λ_Pump - Δν̃/10⁷  (Δν̃ in cm⁻¹)</p>
          <p>E_beat = E_pump - E_Stokes (Raman shift energy)</p>
          <p>δν̃_spectral = 0.44λ²/(c×τ) (Fourier-limited bandwidth)</p>
          <p>Δx_lateral = 0.61λ_Pump/NA</p>
          <p>Δz_axial = 2nλ_Pump/NA²</p>
          <p>I_CARS ∝ |χ_NR + Σ χ_R/(Ω-ω_i+iΓ_i)|²</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={wavelengthChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Stokes λ vs Raman Shift", font: { size: 13 } }, xaxis: { title: "Raman Shift (cm⁻¹)", gridcolor: "#374151" }, yaxis: { title: "Stokes λ (nm)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={snrChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Signal & Background (arb. units)", font: { size: 13 } }, xaxis: { title: "Raman Shift (cm⁻¹)", gridcolor: "#374151" }, yaxis: { title: "Signal (a.u.)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
