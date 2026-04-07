"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function HarmonicGenerationPage() {
  const [wavelength, setWavelength] = useState(800);
  const [na, setNa] = useState(0.8);
  const [power, setPower] = useState(50);
  const [pulseWidth, setPulseWidth] = useState(100);
  const [repetitionRate, setRepetitionRate] = useState(80);
  const [order, setOrder] = useState(2);

  const harmonicWavelength = wavelength / order;
  const peakPower = (power * 1000) / (pulseWidth * 1e-12) / 1e6; // in MW
  const averagePowerPerPulse = power / repetitionRate;
  const peakIntensity = (peakPower * 1e6) / (Math.PI * (0.61 * wavelength * 1e-3 / na) ** 2) / 1e12; // TW/cm²

  // SHG conversion efficiency estimate (proportional to intensity and χ²)
  const shgEfficiency = 1e-12 * peakIntensity * peakIntensity * 0.01;
  const thgEfficiency = 1e-24 * peakIntensity * peakIntensity * peakIntensity * 0.001;

  const chartData = useMemo(() => {
    const wavelengths = Array.from({ length: 100 }, (_, i) => 600 + i * 8);
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.018);
    return [
      { x: wavelengths, y: wavelengths.map(w => w / order), type: "scatter", mode: "lines", name: `${order}HG Wavelength`, line: { color: "#60a5fa" } },
      { x: [wavelength], y: [harmonicWavelength], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, order, harmonicWavelength]);

  const efficiencyChart = useMemo(() => {
    const powers = Array.from({ length: 60 }, (_, i) => 5 + i * 3);
    return [
      { x: powers, y: powers.map(p => 1e-12 * ((p * 1000 / (pulseWidth * 1e-12) / 1e6 * 1e6) / (Math.PI * (0.61 * wavelength * 1e-3 / na) ** 2) / 1e12) ** 2 * 0.01), type: "scatter", mode: "lines", name: "SHG Efficiency", line: { color: "#34d399" } },
      { x: powers, y: powers.map(p => 1e-24 * ((p * 1000 / (pulseWidth * 1e-12) / 1e6 * 1e6) / (Math.PI * (0.61 * wavelength * 1e-3 / na) ** 2) / 1e12) ** 3 * 0.001), type: "scatter", mode: "lines", name: "THG Efficiency", line: { color: "#fbbf24" } },
    ];
  }, [wavelength, na, pulseWidth]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Harmonic Generation Microscopy Calculator" description="Calculate harmonic wavelengths, peak intensities, and conversion efficiencies for nonlinear harmonic generation microscopy.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Fundamental λ (nm)" value={wavelength} onChange={setWavelength} min={400} max={1600} />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Average Power (mW)" value={power} onChange={setPower} min={1} max={500} />
        <ValidatedNumberInput label="Pulse Width (fs)" value={pulseWidth} onChange={setPulseWidth} min={10} max={1000} />
        <ValidatedNumberInput label="Rep. Rate (MHz)" value={repetitionRate} onChange={setRepetitionRate} min={1} max={250} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Harmonic Order</span>
          <select value={order} onChange={e => setOrder(+e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={2}>2nd Harmonic (SHG)</option>
            <option value={3}>3rd Harmonic (THG)</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Harmonic λ</p>
          <p className="text-2xl font-bold text-blue-400">{harmonicWavelength.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power</p>
          <p className="text-2xl font-bold text-green-400">{peakPower.toFixed(1)} MW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Intensity</p>
          <p className="text-2xl font-bold text-yellow-400">{peakIntensity.toFixed(2)} TW/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Energy/Pulse</p>
          <p className="text-2xl font-bold text-purple-400">{averagePowerPerPulse.toFixed(2)} nJ</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>λ_harmonic = λ_fundamental / n</p>
          <p>P_peak = P_avg / (f_rep × τ_pulse)</p>
          <p>I_peak = P_peak / (π × w₀²)  where w₀ = 0.61λ/NA</p>
          <p>η_SHG ∝ I² × d_eff² × L²  (sinc² phase-matching)</p>
          <p>η_THG ∝ I³ × χ⁽³⁾² × L²</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <ChartPanel data={chartData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, title: { text: "Harmonic Wavelength vs Fundamental", font: { size: 14 } }, xaxis: { title: "Fundamental λ (nm)", gridcolor: "#374151" }, yaxis: { title: "Harmonic λ (nm)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.15 }, margin: { t: 40, b: 50 } }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <ChartPanel data={efficiencyChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, title: { text: "Conversion Efficiency vs Power", font: { size: 14 } }, xaxis: { title: "Average Power (mW)", gridcolor: "#374151" }, yaxis: { title: "Relative Efficiency", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.15 }, margin: { t: 40, b: 50 } }} />
      </div>
    </CalculatorShell>
  );
}
