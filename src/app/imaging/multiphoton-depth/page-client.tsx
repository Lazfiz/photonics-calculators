"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function MultiphotonDepthPage() {
  const [na, setNa] = useURLState("na", 0.8);
  const [wavelength, setWavelength] = useURLState("wavelength", 800);
  const [n, setN] = useURLState("n", 1.33);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100);
  const [repRate, setRepRate] = useURLState("repRate", 80);
  const [avgPower, setAvgPower] = useURLState("avgPower", 20);
  const [absorption, setAbsorption] = useURLState("absorption", 0.02);
  const [scattering, setScattering] = useURLState("scattering", 0.1);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const lamEff = lam / 2;
    const lateralRes = 0.325 * lam / na * 1e9;
    const axialRes = 0.532 * lam / (n - Math.sqrt(Math.max(0, n * n - na * na))) * 1e6;
    const pulseEnergy = (avgPower * 1e-3) / (repRate * 1e6) * 1e9;
    const peakPower = (pulseEnergy * 1e-9) / (pulseWidth * 1e-15) * 1e-3;
    const beamWaist = 0.32 * lam / na * 1e6; // Gaussian beam waist w₀
    const rayleighRange = Math.PI * beamWaist * beamWaist * 1e-6 * n / lam;
    const attenuation = absorption + scattering;
    const depth1e2 = -Math.log(0.01) / (2 * attenuation) * 1000;
    const depth1e3 = -Math.log(0.001) / (2 * attenuation) * 1000;
    const genEfficiency = na * na / (n * n);
    return { lamEff, lateralRes, axialRes, pulseEnergy, peakPower, beamWaist, rayleighRange, depth1e2, depth1e3, genEfficiency };
  }, [na, wavelength, n, pulseWidth, repRate, avgPower, absorption, scattering]);

  const plotData = useMemo(() => {
    const depths = [];
    const signal = [];
    const excitation = [];
    for (let d = 0; d <= 1000; d += 5) {
      depths.push(d);
      const att = Math.exp(-(absorption + scattering) * d / 1000);
      signal.push(att * att * 100);
      excitation.push(att * 100);
    }
    return [
      { x: depths, y: signal, name: "2P signal (%)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: depths, y: excitation, name: "Excitation (%)", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [absorption, scattering]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Multiphoton Imaging Depth Calculator" description="Two-photon excitation depth penetration, resolution, and laser parameters.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <ValidatedNumberInput label="Objective NA" value={na} onChange={setNa} min={0.2} max={1.5} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Excitation wavelength (nm)</label>
            <ValidatedNumberInput label="Excitation wavelength (nm)" value={wavelength} onChange={setWavelength} />
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
            <label className="block text-sm text-gray-400 mb-1">Rep rate (MHz)</label>
            <ValidatedNumberInput label="Rep rate (MHz)" value={repRate} onChange={setRepRate} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Average power (mW)</label>
            <ValidatedNumberInput label="Average power (mW)" value={avgPower} onChange={setAvgPower} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Absorption coeff (mm⁻¹)</label>
            <ValidatedNumberInput label="Absorption coeff (mm⁻¹)" value={absorption} onChange={setAbsorption} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Scattering coeff (mm⁻¹)</label>
            <ValidatedNumberInput label="Scattering coeff (mm⁻¹)" value={scattering} onChange={setScattering} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective λ (½ excitation)</span><span className="font-mono text-blue-400">{(results.lamEff * 1e9).toFixed(0)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-green-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial resolution</span><span className="font-mono text-cyan-400">{results.axialRes.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pulse energy</span><span className="font-mono text-yellow-400">{results.pulseEnergy.toFixed(2)} nJ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak power</span><span className="font-mono text-purple-400">{results.peakPower.toFixed(1)} kW</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Depth at 1% signal</span><span className="font-mono text-red-400">{results.depth1e2.toFixed(0)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Depth at 0.1% signal</span><span className="font-mono text-orange-400">{results.depth1e3.toFixed(0)} µm</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Lateral: 0.325λ/NA | Axial: 0.532λ/(n - √(n²-NA²))</p>
            <p>Signal ∝ exp(-2µ·d) | Depth = -ln(threshold)/(2µ)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Signal &amp; Excitation vs Depth</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Depth (µm)", gridcolor: "#333" }, yaxis: { title: "%", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
