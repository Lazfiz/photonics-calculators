"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function ThirdHarmonicMicroscopyPage() {
  const [wavelength, setWavelength] = useState(1200);
  const [na, setNa] = useState(0.8);
  const [power, setPower] = useState(100);
  const [pulseWidth, setPulseWidth] = useState(100);
  const [repRate, setRepRate] = useState(80);
  const [refractiveIndex, setRefractiveIndex] = useState(1.33);

  const thgWavelength = wavelength / 3;
  const energyPerPulse = (power * 1000 / repRate) * 1e-9;
  const peakPower = energyPerPulse / (pulseWidth * 1e-15);
  const w0 = 0.61 * wavelength / (na * 1000);
  const spotArea = Math.PI * (w0 * 1e-6) ** 2;
  const peakIntensity = peakPower / spotArea / 1e12;

  // THG signal ∝ I³ × χ⁽³⁾²
  const thgSignal = Math.pow(peakIntensity, 3) * 1e-12;

  // Resolution at THG wavelength
  const lateralResExc = 0.61 * wavelength / na;
  const lateralResTHG = 0.61 * thgWavelength / na;

  // THG contrast mechanism: interface detection
  // Gouy phase shift causes THG cancellation in homogeneous medium
  const zR = Math.PI * w0 * w0 * refractiveIndex / (wavelength / 1000);
  const gouyPhaseShift = Math.PI; // total Gouy phase through focus

  const depthChart = useMemo(() => {
    const depths = Array.from({ length: 80 }, (_, i) => i * 25);
    return [
      { x: depths, y: depths.map(d => Math.exp(-40 * d / 1e4) ** 3), type: "scatter", mode: "lines", name: "THG Signal", line: { color: "#a78bfa" } },
      { x: depths, y: depths.map(d => Math.exp(-40 * d / 1e4) ** 2), type: "scatter", mode: "lines", name: "SHG (ref)", line: { color: "#34d399", dash: "dash" } },
      { x: depths, y: depths.map(d => Math.exp(-40 * d / 1e4)), type: "scatter", mode: "lines", name: "2PEF (ref)", line: { color: "#60a5fa", dash: "dot" } },
    ];
  }, []);

  const intensityChart = useMemo(() => {
    const powers = Array.from({ length: 60 }, (_, i) => 5 + i * 5);
    const baseI = peakPower / spotArea / 1e12;
    return [
      { x: powers, y: powers.map(p => Math.pow(baseI * p / power, 3) * 1e-12), type: "scatter", mode: "lines", name: "THG ∝ I³", line: { color: "#a78bfa" } },
      { x: powers, y: powers.map(p => Math.pow(baseI * p / power, 2) * 1e-6), type: "scatter", mode: "lines", name: "SHG ∝ I²", line: { color: "#34d399", dash: "dash" } },
      { x: [power], y: [thgSignal], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [power, peakPower, spotArea, thgSignal]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Third-Harmonic Generation Microscopy Calculator" description="Calculate THG wavelength, signal intensity, and resolution for label-free interface and heterogeneity imaging.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Excitation λ (nm)" value={wavelength} onChange={setWavelength} min={1000} max={1800} />
        <ValidatedNumberInput label="NA" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Avg Power (mW)" value={power} onChange={setPower} min={1} max={500} />
        <ValidatedNumberInput label="Pulse Width (fs)" value={pulseWidth} onChange={setPulseWidth} min={10} max={500} />
        <ValidatedNumberInput label="Rep. Rate (MHz)" value={repRate} onChange={setRepRate} min={0.1} max={250} />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">THG Wavelength</p>
          <p className="text-2xl font-bold text-purple-400">{thgWavelength.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Intensity</p>
          <p className="text-2xl font-bold text-blue-400">{peakIntensity.toFixed(1)} TW/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range</p>
          <p className="text-2xl font-bold text-green-400">{zR.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Energy/Pulse</p>
          <p className="text-2xl font-bold text-yellow-400">{(energyPerPulse * 1e9).toFixed(1)} nJ</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Excitation Spot (w₀)</p>
          <p className="text-2xl font-bold text-blue-400">{w0.toFixed(3)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Excitation Res</p>
          <p className="text-2xl font-bold text-green-400">{lateralResExc.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">THG Emission Res</p>
          <p className="text-2xl font-bold text-purple-400">{lateralResTHG.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">THG Signal (rel.)</p>
          <p className="text-2xl font-bold text-pink-400">{thgSignal.toExponential(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>λ_THG = λ_excitation / 3</p>
          <p>I_THG ∝ |χ⁽³⁾|² × I³</p>
          <p>Zero THG in homogeneous media (Gouy phase cancellation)</p>
          <p>THG signal at interfaces: Δχ⁽³⁾ generates detectable signal</p>
          <p>Contrast mechanism: refractive index mismatches, interfaces</p>
          <p>Applications: lipid bodies, myelin, cell membranes, crystals</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={intensityChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Signal vs Power (I³ vs I²)", font: { size: 13 } }, xaxis: { title: "Avg Power (mW)", gridcolor: "#374151" }, yaxis: { title: "Signal (a.u.)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={depthChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Signal Attenuation vs Depth", font: { size: 13 } }, xaxis: { title: "Depth (µm)", gridcolor: "#374151" }, yaxis: { title: "Relative Signal", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
