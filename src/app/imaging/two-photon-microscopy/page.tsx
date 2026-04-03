"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function TwoPhotonMicroscopyPage() {
  const [wavelength, setWavelength] = useState(800);
  const [na, setNa] = useState(0.8);
  const [pulseWidth, setPulseWidth] = useState(100);
  const [repRate, setRepRate] = useState(80);
  const [avgPower, setAvgPower] = useState(30);
  const [exposureDepth, setExposureDepth] = useState(200);
  const [refractiveIndex, setRefractiveIndex] = useState(1.33);
  const [scatteringCoeff, setScatteringCoeff] = useState(100);

  // Two-photon excitation wavelength (effective)
  const onePhotonEquiv = wavelength / 2;

  // Lateral resolution
  const lateralRes = 0.325 * wavelength / na;
  const axialRes = 0.532 * wavelength / (na * na);

  // Two-photon excitation volume
  const w0 = 0.61 * wavelength / (na * 1000); // µm
  const zR = Math.PI * w0 * w0 * refractiveIndex / (wavelength / 1000);
  const excitationVolume = Math.PI * w0 * w0 * zR; // µm³

  // Peak intensity
  const energyPerPulse = (avgPower * 1000 / repRate) * 1e-9; // J
  const peakPower = energyPerPulse / (pulseWidth * 1e-15); // W
  const spotArea = Math.PI * (w0 * 1e-6) ** 2;
  const peakIntensity = peakPower / spotArea / 1e12; // TW/cm²

  // Power at depth (scattering model)
  const powerAtDepth = avgPower * Math.exp(-scatteringCoeff * exposureDepth / 1e4);

  // Penetration depth (1/e)
  const penetrationDepth = 1e4 / scatteringCoeff;

  const depthChart = useMemo(() => {
    const depths = Array.from({ length: 80 }, (_, i) => i * 25);
    return [
      { x: depths, y: depths.map(d => avgPower * Math.exp(-scatteringCoeff * d / 1e4)), type: "scatter", mode: "lines", name: "Power at depth", line: { color: "#60a5fa" } },
      { x: depths, y: depths.map(d => avgPower * Math.exp(-scatteringCoeff * d / 1e4) ** 2), type: "scatter", mode: "lines", name: "2P Signal", line: { color: "#34d399" } },
      { x: [exposureDepth], y: [powerAtDepth], type: "scatter", mode: "markers", name: "Current depth", marker: { color: "#f87171", size: 12 } },
    ];
  }, [avgPower, scatteringCoeff, exposureDepth, powerAtDepth]);

  const resolutionChart = useMemo(() => {
    const nas = Array.from({ length: 80 }, (_, i) => 0.2 + i * 0.018);
    return [
      { x: nas, y: nas.map(n => 0.325 * wavelength / n), type: "scatter", mode: "lines", name: "Lateral", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(n => 0.532 * wavelength / (n * n)), type: "scatter", mode: "lines", name: "Axial", line: { color: "#fbbf24" } },
      { x: [na], y: [lateralRes], type: "scatter", mode: "markers", name: "Current Lat.", marker: { color: "#34d399", size: 12 } },
      { x: [na], y: [axialRes], type: "scatter", mode: "markers", name: "Current Ax.", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [wavelength, na, lateralRes, axialRes]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Two-Photon Microscopy Calculator" description="Calculate resolution, excitation volume, peak intensity, and depth penetration for two-photon fluorescence microscopy.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Excitation λ (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={680} max={1100}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">NA</span>
          <input type="number" value={na} onChange={e => setNa(+e.target.value)} min={0.1} max={1.7} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Pulse Width (fs)</span>
          <input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} min={10} max={500}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Avg Power (mW)</span>
          <input type="number" value={avgPower} onChange={e => setAvgPower(+e.target.value)} min={1} max={200}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Rep. Rate (MHz)</span>
          <input type="number" value={repRate} onChange={e => setRepRate(+e.target.value)} min={0.1} max={250}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Refractive Index</span>
          <input type="number" value={refractiveIndex} onChange={e => setRefractiveIndex(+e.target.value)} min={1.0} max={1.8} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Scattering Coeff (cm⁻¹)</span>
          <input type="number" value={scatteringCoeff} onChange={e => setScatteringCoeff(+e.target.value)} min={10} max={500}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Depth (µm)</span>
          <input type="number" value={exposureDepth} onChange={e => setExposureDepth(+e.target.value)} min={0} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
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
          <p className="text-sm text-gray-400">Power at Depth</p>
          <p className="text-2xl font-bold text-yellow-400">{powerAtDepth.toFixed(1)} mW</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Resolution</p>
          <p className="text-2xl font-bold text-blue-400">{lateralRes.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Axial Resolution</p>
          <p className="text-2xl font-bold text-yellow-400">{axialRes.toFixed(0)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range</p>
          <p className="text-2xl font-bold text-purple-400">{zR.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Penetration (1/e)</p>
          <p className="text-2xl font-bold text-red-400">{penetrationDepth.toFixed(0)} µm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>Δx_lateral = 0.325λ/NA (2P, ~0.53× widefield at 1P equiv.)</p>
          <p>Δz_axial = 0.532λ/NA²</p>
          <p>w₀ = 0.61λ/NA, z_R = πw₀²n/λ</p>
          <p>V_excitation ≈ πw₀² × z_R</p>
          <p>I_peak = E_pulse / (τ × A_spot)</p>
          <p>P(z) = P₀ × exp(-µs × z)</p>
          <p>I_2P ∝ P² (quadratic dependence on intensity)</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={resolutionChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Resolution vs NA", font: { size: 13 } }, xaxis: { title: "NA", gridcolor: "#374151" }, yaxis: { title: "Resolution (nm)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <ChartPanel data={depthChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af", size: 11 }, title: { text: "Power & Signal vs Depth", font: { size: 13 } }, xaxis: { title: "Depth (µm)", gridcolor: "#374151" }, yaxis: { title: "Power / Signal (a.u.)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 40, b: 55 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
