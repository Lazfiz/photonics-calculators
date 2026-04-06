"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ThreePhotonMicroscopyPage() {
  const [wavelength, setWavelength] = useState(1300);
  const [na, setNa] = useState(0.8);
  const [pulseWidth, setPulseWidth] = useState(100);
  const [repRate, setRepRate] = useState(1);
  const [avgPower, setAvgPower] = useState(100);
  const [refractiveIndex, setRefractiveIndex] = useState(1.33);
  const [scatteringCoeff, setScatteringCoeff] = useState(60);
  const [depth, setDepth] = useState(500);

  const onePhotonEquiv = wavelength / 3;
  const twoPhotonEquiv = wavelength / 2;

  // 3P lateral resolution (improved confinement)
  const lateralRes3P = 0.235 * wavelength / na;
  const lateralRes2P = 0.325 * wavelength / na;
  const axialRes3P = 0.36 * wavelength / (na * na);

  // Excitation volume
  const w0 = 0.61 * wavelength / (na * 1000);
  const zR = Math.PI * w0 * w0 * refractiveIndex / (wavelength / 1000);
  // 3-photon excitation volume ≈ V_2P × √(2/3) / 3 (PSF-derived scaling)
  const excitationVolume = Math.PI * w0 * w0 * zR * 0.5 * Math.sqrt(2 / 3) / 3;

  // Peak intensity
  const energyPerPulse = (avgPower * 1000 / repRate) * 1e-9;
  const peakPower = energyPerPulse / (pulseWidth * 1e-15);
  const spotArea = Math.PI * (w0 * 1e-6) ** 2;
  const peakIntensity = peakPower / spotArea / 1e12;

  // Power at depth (lower scattering at longer wavelength)
  const powerAtDepth = avgPower * Math.exp(-scatteringCoeff * depth / 1e4);
  const signal3P = Math.pow(powerAtDepth / avgPower, 3);

  const depthChart = useMemo(() => {
    const depths = Array.from({ length: 80 }, (_, i) => i * 25);
    return [
      { x: depths, y: depths.map(d => Math.exp(-scatteringCoeff * d / 1e4)), type: "scatter", mode: "lines", name: "Linear (1P)", line: { color: "#60a5fa" } },
      { x: depths, y: depths.map(d => Math.exp(-scatteringCoeff * d / 1e4) ** 2), type: "scatter", mode: "lines", name: "Quadratic (2P)", line: { color: "#fbbf24" } },
      { x: depths, y: depths.map(d => Math.exp(-scatteringCoeff * d / 1e4) ** 3), type: "scatter", mode: "lines", name: "Cubic (3P)", line: { color: "#34d399" } },
      { x: [depth], y: [signal3P], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [scatteringCoeff, depth, signal3P]);

  const resolutionChart = useMemo(() => {
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.018);
    return [
      { x: nas, y: nas.map(n => 0.235 * wavelength / n), type: "scatter", mode: "lines", name: "3P Lateral", line: { color: "#34d399" } },
      { x: nas, y: nas.map(n => 0.325 * wavelength / n), type: "scatter", mode: "lines", name: "2P Lateral", line: { color: "#60a5fa", dash: "dash" } },
      { x: nas, y: nas.map(n => 0.36 * wavelength / (n * n)), type: "scatter", mode: "lines", name: "3P Axial", line: { color: "#fbbf24" } },
      { x: [na], y: [lateralRes3P], type: "scatter", mode: "markers", name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelength, na, lateralRes3P]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Three-Photon Microscopy Calculator" description="Calculate resolution, excitation volume, and depth penetration for three-photon excitation microscopy at 1300+ nm.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Excitation λ (nm)" value={wavelength} onChange={setWavelength} min={1000} max={1800} />
        <ValidatedNumberInput label="NA" value={na} onChange={setNa} min={0.1} max={1.7} step="0.01" />
        <ValidatedNumberInput label="Pulse Width (fs)" value={pulseWidth} onChange={setPulseWidth} min={10} max={500} />
        <ValidatedNumberInput label="Avg Power (mW)" value={avgPower} onChange={setAvgPower} min={1} max={500} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Rep. Rate (MHz)" value={repRate} onChange={setRepRate} min={0.01} max={250} step="0.01" />
        <ValidatedNumberInput label="Refractive Index" value={refractiveIndex} onChange={setRefractiveIndex} min={1.0} max={1.8} step="0.01" />
        <ValidatedNumberInput label="Scattering Coeff (cm⁻¹)" value={scatteringCoeff} onChange={setScatteringCoeff} min={10} max={500} />
        <ValidatedNumberInput label="Depth (µm)" value={depth} onChange={setDepth} min={0} max={3000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">1P Equivalent λ</p>
          <p className="text-2xl font-bold text-pink-400">{onePhotonEquiv.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Intensity</p>
          <p className="text-2xl font-bold text-green-400">{peakIntensity.toFixed(1)} TW/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Excitation Volume</p>
          <p className="text-2xl font-bold text-blue-400">{excitationVolume.toFixed(3)} µm³</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Relative 3P Signal</p>
          <p className="text-2xl font-bold text-yellow-400">{signal3P.toFixed(4)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">3P Lateral Res</p>
          <p className="text-2xl font-bold text-green-400">{lateralRes3P.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">3P Axial Res</p>
          <p className="text-2xl font-bold text-yellow-400">{axialRes3P.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Power at Depth</p>
          <p className="text-2xl font-bold text-blue-400">{powerAtDepth.toFixed(1)} mW</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Energy/Pulse</p>
          <p className="text-2xl font-bold text-purple-400">{(energyPerPulse * 1e9).toFixed(1)} nJ</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>λ_1P_equiv = λ_excitation / 3</p>
          <p>Δx_3P = 0.235λ/NA (tighter confinement than 2P)</p>
          <p>Δz_3P = 0.36λ/NA²</p>
          <p>I_3P ∝ I³ (cubic intensity dependence)</p>
          <p>P(z) = P₀ × exp(-µs × z) (reduced µs at longer λ)</p>
          <p>Signal ∝ [P(z)]³ (out-of-focus suppression)</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={resolutionChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Resolution vs NA", font: { size: 13 } }, xaxis: { title: "NA", gridcolor: "#374151" }, yaxis: { title: "Resolution (nm)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={depthChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Signal vs Depth (1P/2P/3P)", font: { size: 13 } }, xaxis: { title: "Depth (µm)", gridcolor: "#374151" }, yaxis: { title: "Relative Signal", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
