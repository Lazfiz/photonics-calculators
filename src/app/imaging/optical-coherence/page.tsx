"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function OpticalCoherencePage() {
  const [wavelengthNm, setWavelengthNm] = useState(1310);
  const [bandwidthNm, setBandwidthNm] = useState(100);
  const [refractiveIndex, setRefractiveIndex] = useState(1.33);
  const [coherenceLengthMm, setCoherenceLengthMm] = useState(0.015);
  const [sourcePowerMw, setSourcePowerMw] = useState(10);
  const [sampleReflectivity, setSampleReflectivity] = useState(0.01);
  const [couplingEfficiency, setCouplingEfficiency] = useState(0.6);
  const [detectorResponsivity, setDetectorResponsivity] = useState(0.8);

  const wavelengthM = wavelengthNm * 1e-9;
  const bandwidthM = bandwidthNm * 1e-9;
  const coherenceLengthCalc = (2 * Math.LN2 / Math.PI) * (wavelengthM ** 2) / bandwidthM * 1e3; // mm
  const coherenceTime = coherenceLengthCalc * 1e-3 / (3e8 / refractiveIndex) * 1e15; // fs
  const axialResolution = (2 * Math.LN2 / Math.PI) * (wavelengthM ** 2) / bandwidthM * 1e6; // µm
  const lateralResolution = (0.37 * wavelengthM) / 0.05; // µm for NA=0.05 typical
  const opticalPathDiff = 2 * refractiveIndex * 0.5 * 1e-3; // for 0.5mm sample

  const backscatteredPower = sourcePowerMw * 1e-3 * couplingEfficiency * sampleReflectivity * 2; // W
  const snrEstimate = 10 * Math.log10(backscatteredPower * detectorResponsivity / 1e-9); // dB vs 1nW noise floor

  const coherenceLengthChart = useMemo(() => {
    const bw = Array.from({ length: 60 }, (_, i) => 10 + i * 5);
    const cl = bw.map(b => (2 * Math.LN2 / Math.PI) * ((wavelengthNm * 1e-9) ** 2) / (b * 1e-9) * 1e3);
    return [
      { x: bw, y: cl, type: "scatter", mode: "lines" as const, name: "Coherence Length", line: { color: "#60a5fa", width: 2 } },
      { x: [bandwidthNm], y: [coherenceLengthCalc], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [wavelengthNm, bandwidthNm, coherenceLengthCalc]);

  const axialResChart = useMemo(() => {
    const bw = Array.from({ length: 60 }, (_, i) => 10 + i * 5);
    const ar = bw.map(b => (2 * Math.LN2 / Math.PI) * ((wavelengthNm * 1e-9) ** 2) / (b * 1e-9) * 1e6);
    return [
      { x: bw, y: ar, type: "scatter", mode: "lines" as const, name: "Axial Resolution", line: { color: "#34d399", width: 2 } },
      { x: [bandwidthNm], y: [axialResolution], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [wavelengthNm, bandwidthNm, axialResolution]);

  const spectrumChart = useMemo(() => {
    const freqs = Array.from({ length: 200 }, (_, i) => wavelengthNm - 200 + i * 2);
    const center = wavelengthNm;
    const sigma = bandwidthNm / 2.355;
    const intensity = freqs.map(f => Math.exp(-0.5 * ((f - center) / sigma) ** 2));
    return [{ x: freqs, y: intensity, type: "scatter", mode: "lines" as const, name: "Source Spectrum", line: { color: "#a78bfa", width: 2 } }];
  }, [wavelengthNm, bandwidthNm]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Optical Coherence Theory" description="Temporal coherence, coherence length, axial resolution, and SNR estimation for OCT systems.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coherence Length</p>
          <p className="text-2xl font-bold text-blue-400">{coherenceLengthCalc.toFixed(3)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Axial Resolution</p>
          <p className="text-2xl font-bold text-green-400">{axialResolution.toFixed(2)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coherence Time</p>
          <p className="text-2xl font-bold text-yellow-400">{coherenceTime.toFixed(1)} fs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Est. SNR</p>
          <p className="text-2xl font-bold text-purple-400">{snrEstimate.toFixed(1)} dB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Center Wavelength (nm)</span>
          <input type="number" value={wavelengthNm} onChange={e => setWavelengthNm(+e.target.value)} min={600} max={1600} step="10"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bandwidth FWHM (nm)</span>
          <input type="number" value={bandwidthNm} onChange={e => setBandwidthNm(+e.target.value)} min={5} max={300} step="5"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Refractive Index</span>
          <input type="number" value={refractiveIndex} onChange={e => setRefractiveIndex(+e.target.value)} min={1} max={1.8} step="0.01"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Source Power (mW)</span>
          <input type="number" value={sourcePowerMw} onChange={e => setSourcePowerMw(+e.target.value)} min={0.1} max={100} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Sample Reflectivity</span>
          <input type="number" value={sampleReflectivity} onChange={e => setSampleReflectivity(+e.target.value)} min={0.0001} max={0.1} step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Coupling Efficiency</span>
          <input type="number" value={couplingEfficiency} onChange={e => setCouplingEfficiency(+e.target.value)} min={0.1} max={0.9} step="0.05"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>l_c = (2 ln 2 / π) · λ₀² / Δλ</p>
          <p>Δz_axial = l_c / 2n = (ln 2 / πn) · λ₀² / Δλ</p>
          <p>τ_c = l_c · n / c</p>
          <p>SNR ∝ P_s · R · η · ρ / P_noise</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Source Spectrum</h3>
          <ChartPanel data={spectrumChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)" }, yaxis: { title: "Intensity (a.u.)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Coherence Length vs Bandwidth</h3>
          <ChartPanel data={coherenceLengthChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Bandwidth (nm)" }, yaxis: { title: "Coherence Length (mm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Axial Resolution vs Bandwidth</h3>
          <ChartPanel data={axialResChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Bandwidth (nm)" }, yaxis: { title: "Axial Resolution (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
