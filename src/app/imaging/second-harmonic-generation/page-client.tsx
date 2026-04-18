"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function SecondHarmonicGenerationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 800);
  const [na, setNa] = useURLState("na", 0.8);
  const [n, setN] = useURLState("n", 1.33);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100);
  const [avgPower, setAvgPower] = useURLState("avgPower", 50);
  const [repRate, setRepRate] = useURLState("repRate", 80);
  const [chi2, setChi2] = useURLState("chi2", 1); // pm/V (effective)
  const [crystalLength, setCrystalLength] = useURLState("crystalLength", 10); // µm
  const [dn, setDn] = useURLState("dn", 0.01); // dispersion |n(2ω)-n(ω)|

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const shgWavelength = lam / 2;
    const shgNm = shgWavelength * 1e9;
    const lateralRes = 0.325 * lam / na * 1e9;
    const coherenceLength = lam / (4 * dn);
    const pulseEnergy = (avgPower * 1e-3) / (repRate * 1e6) * 1e9;
    const w0 = 0.325 * lam / na;
    const peakIntensity = (pulseEnergy * 1e-9) / (Math.PI * w0 * w0 * pulseWidth * 1e-15);
    const L_m = crystalLength * 1e-6;
    const chi2_mV = chi2 * 1e-12;
    const shgEfficiency = 8 * Math.PI ** 2 * chi2_mV ** 2 * peakIntensity * L_m ** 2 / (Math.pow(n, 3) * lam * lam * 299792458 * 8.854e-12);
    const fwdBwdRatio = 1;
    const spectralBandwidth = 0.44 / (pulseWidth * 1e-15) * 1e-12;
    return { shgNm, lateralRes, pulseEnergy, peakIntensity, coherenceLength, shgEfficiency: Math.min(shgEfficiency, 1), fwdBwdRatio, spectralBandwidth };
  }, [wavelength, na, n, pulseWidth, avgPower, repRate, chi2, crystalLength, dn]);

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
            <ValidatedNumberInput label="Excitation wavelength (nm)" value={wavelength} onChange={setWavelength} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <ValidatedNumberInput label="Objective NA" value={na} onChange={setNa} min={0.2} max={1.5} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <ValidatedNumberInput label="Refractive index (n)" value={n} onChange={setN} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse width (fs)</label>
            <ValidatedNumberInput label="Pulse width (fs)" value={pulseWidth} onChange={setPulseWidth} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Average power (mW)</label>
            <ValidatedNumberInput label="Average power (mW)" value={avgPower} onChange={setAvgPower} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rep rate (MHz)</label>
            <ValidatedNumberInput label="Rep rate (MHz)" value={repRate} onChange={setRepRate} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">χ² effective (pm/V)</label>
            <ValidatedNumberInput label="χ² effective (pm/V)" value={chi2} onChange={setChi2} min={0.01} max={100} step="0.1" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sample thickness (µm)</label>
            <ValidatedNumberInput label="Sample thickness (µm)" value={crystalLength} onChange={setCrystalLength} min={1} max={1000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dispersion Δn = |n(2ω)−n(ω)|</label>
            <ValidatedNumberInput label="Dispersion Δn" value={dn} onChange={setDn} min={0.001} max={0.5} step="0.001" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SHG wavelength</span><span className="font-mono text-blue-400">{results.shgNm.toFixed(0)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-green-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pulse energy</span><span className="font-mono text-yellow-400">{results.pulseEnergy.toFixed(2)} nJ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak intensity (est.)</span><span className="font-mono text-purple-400">{results.peakIntensity.toExponential(2)} W/m²</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Fwd/Bwd ratio</span><span className="font-mono text-cyan-400">~{results.fwdBwdRatio} (depends on sample)</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Coherence length</span><span className="font-mono text-blue-300">{(results.coherenceLength * 1e6).toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SHG efficiency (est.)</span><span className="font-mono text-pink-400">{(results.shgEfficiency * 100).toExponential(2)} %</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Spectral bandwidth</span><span className="font-mono text-orange-400">{results.spectralBandwidth.toFixed(2)} THz</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>λ_SHG = λ_exc / 2 | Lateral: 0.325λ/NA</p>
            <p>L_c = λ/(4Δn) | I_SHG ∝ χ²²·I²·L² | Bandwidth: 0.44/τ_p</p>
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
