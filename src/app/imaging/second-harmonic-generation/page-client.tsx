"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
export default function SecondHarmonicGenerationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 800);
  const [na, setNa] = useURLState("na", 0.8);
  const [n, setN] = useURLState("n", 1.33);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100);
  const [avgPower, setAvgPower] = useURLState("avgPower", 50);
  const [repRate, setRepRate] = useURLState("repRate", 80);
  const [chi2, setChi2] = useURLState("chi2", 1);
  const [crystalLength, setCrystalLength] = useURLState("crystalLength", 10);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const shgWavelength = lam / 2;
    const shgNm = shgWavelength * 1e9;
    const lateralRes = 0.325 * lam / na * 1e9;
    const coherenceLength = lam / (4 * Math.abs(n - n));
    const pulseEnergy = (avgPower * 1e-3) / (repRate * 1e6) * 1e9;
    const peakIntensity = (pulseEnergy * 1e-9) / (Math.PI * (lam / na) ** 2 * pulseWidth * 1e-15);
    const shgEfficiency = chi2 * chi2 * (peakIntensity * 1e-4) * crystalLength * crystalLength * 1e-6;
    const fwdBwdRatio = 1;
    const spectralBandwidth = 0.44 / (pulseWidth * 1e-15) * 1e-12;
    return { shgNm, lateralRes, pulseEnergy, peakIntensity, shgEfficiency, fwdBwdRatio, spectralBandwidth };
  }, [wavelength, na, n, pulseWidth, avgPower, repRate, chi2, crystalLength]);

  const plotData = useMemo(() => {
    const wavelengths = [];
    const shgWavelengths = [];
    const lateralRes = [];
    for (let w = 700; w <= 1100; w += 5) {
      wavelengths.push(w);
      shgWavelengths.push(w / 2);
      lateralRes.push(0.325 * w * 1e-9 / na * 1e9);
    }
    return [
      { x: wavelengths, y: shgWavelengths, name: "SHG wavelength (nm)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines", yaxis: "y" },
      { x: wavelengths, y: lateralRes, name: "Lateral res (nm)", line: { color: "#f87171" }, type: "scatter", mode: "lines", yaxis: "y2" },
    ];
  }, [na]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Second Harmonic Generation (SHG) Calculator" description="SHG signal properties, wavelength conversion, and imaging resolution for collagen and other non-centrosymmetric structures.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Excitation wavelength (nm)</label>
            <input type="number" step={5} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <input type="number" step={0.05} min={0.2} max={1.5} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <input type="number" step={0.01} value={n} onChange={e => setN(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse width (fs)</label>
            <input type="number" step={10} value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Average power (mW)</label>
            <input type="number" step={5} value={avgPower} onChange={e => setAvgPower(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rep rate (MHz)</label>
            <input type="number" step={10} value={repRate} onChange={e => setRepRate(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SHG wavelength</span><span className="font-mono text-blue-400">{results.shgNm.toFixed(0)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-green-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pulse energy</span><span className="font-mono text-yellow-400">{results.pulseEnergy.toFixed(2)} nJ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak intensity (est.)</span><span className="font-mono text-purple-400">{results.peakIntensity.toExponential(2)} W/m²</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Fwd/Bwd ratio</span><span className="font-mono text-cyan-400">~{results.fwdBwdRatio} (depends on sample)</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Spectral bandwidth</span><span className="font-mono text-orange-400">{results.spectralBandwidth.toFixed(2)} THz</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>λ_SHG = λ_exc / 2 | Lateral: 0.325λ/NA</p>
            <p>I_SHG ∝ χ²² · I² · L² | Bandwidth: 0.44/τ_p</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">SHG Wavelength &amp; Resolution vs Excitation Wavelength</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Excitation λ (nm)", gridcolor: "#333" }, yaxis: { title: "SHG λ (nm)", gridcolor: "#333", side: "left" }, yaxis2: { title: "Lateral res (nm)", gridcolor: "#333", side: "right", overlaying: "y" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 60, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
