"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function SecondHarmonicPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 800); // nm, fundamental
  const [pulseEnergy, setPulseEnergy] = useURLState("pulseEnergy", 10); // nJ
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100); // fs
  const [na, setNa] = useURLState("na", 0.8);
  const [n, setN] = useURLState("n", 1.33);
  const [chi2, setChi2] = useURLState("chi2", 1.0); // pm/V (effective)
  const [thickness, setThickness] = useURLState("thickness", 100); // µm, sample thickness

  const results = useMemo(() => {
    const shgWavelength = wavelength / 2;
    const peakPower = pulseEnergy * 1e-9 / (pulseWidth * 1e-15); // W
    const w0 = 0.32 * wavelength * 1e-9 / na; // Gaussian beam waist (m)
    const intensity = 2 * peakPower / (Math.PI * w0 * w0); // W/m²
    const dn = 0.01; // approximate dispersion for biological tissue
    const coherenceLength = shgWavelength * 1e-9 / (2 * dn);
    const coherenceLengthSafe = isFinite(coherenceLength) && coherenceLength > 0 ? coherenceLength : 5e-6;
    // Simplified SHG power estimate with phase-matching term
    const phaseArg = Math.PI * (thickness * 1e-6) / (2 * coherenceLengthSafe);
    const sinc = Math.abs(phaseArg) > 1e-10 ? Math.sin(phaseArg) / phaseArg : 1;
    const P_shg = 4e-24 * (chi2) ** 2 * peakPower ** 2 * (thickness * 1e-6) ** 2 / (w0 * w0) * sinc * sinc;
    const conversionEff = P_shg / peakPower * 100;
    return { shgWavelength, peakPower, intensity, coherenceLength: coherenceLengthSafe, P_shg, conversionEff, w0 };
  }, [wavelength, pulseEnergy, pulseWidth, na, n, chi2, thickness]);

  const plotData = useMemo(() => {
    const thicknesses = [];
    const powers = [];
    const phaseMatched = [];
    for (let t = 1; t <= 500; t += 2) {
      thicknesses.push(t);
      const L = t * 1e-6;
      // Non-phase-matched: L² · sinc²(ΔkL/2)
      const phaseArg = Math.PI * L / (2 * results.coherenceLength);
      const sinc = Math.abs(phaseArg) > 1e-10 ? Math.sin(phaseArg) / phaseArg : 1;
      const P = 4e-24 * chi2 ** 2 * peakPower ** 2 * L ** 2 / (results.w0 ** 2) * sinc * sinc;
      powers.push(P * 1e9);
      // Phase matched: L² only (no sinc oscillation)
      const Pc = 4e-24 * chi2 ** 2 * peakPower ** 2 * L ** 2 / (results.w0 ** 2);
      phaseMatched.push(Pc * 1e9);
    }
    return [
      { x: thicknesses, y: powers, name: "SHG power (non-PM)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: thicknesses, y: phaseMatched, name: "SHG power (phase-matched)", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [chi2, pulseEnergy, results.w0]);

  const phasePlot = useMemo(() => {
    const thicknesses = [];
    const efficiency = [];
    const Lc = results.coherenceLength * 1e6; // µm
    for (let t = 0.1; t <= 20; t += 0.05) {
      thicknesses.push(t);
      const x = Math.PI * t / (2 * Lc);
      const sinc = x !== 0 ? Math.sin(x) / x : 1;
      efficiency.push(sinc * sinc);
    }
    return [
      { x: thicknesses, y: efficiency, name: "η(L) ∝ sinc²(ΔkL/2)", line: { color: "#4ade80" }, type: "scatter", mode: "lines" },
    ];
  }, [results.coherenceLength]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Second Harmonic Generation Calculator" description="SHG signal estimation, coherence length, and phase matching for nonlinear imaging.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fundamental wavelength (nm)</label>
            <ValidatedNumberInput label="Fundamental wavelength (nm)" value={wavelength} onChange={setWavelength} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse energy (nJ)</label>
            <ValidatedNumberInput label="Pulse energy (nJ)" value={pulseEnergy} onChange={setPulseEnergy} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse width (fs)</label>
            <ValidatedNumberInput label="Pulse width (fs)" value={pulseWidth} onChange={setPulseWidth} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">NA</label>
            <ValidatedNumberInput label="NA" value={na} onChange={setNa} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">χ² effective (pm/V)</label>
            <ValidatedNumberInput label="χ² effective (pm/V)" value={chi2} onChange={setChi2} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sample thickness (µm)</label>
            <ValidatedNumberInput label="Sample thickness (µm)" value={thickness} onChange={setThickness} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SHG wavelength</span><span className="font-mono text-blue-400">{results.shgWavelength} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak power</span><span className="font-mono text-red-400">{(results.peakPower / 1e6).toFixed(1)} MW</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak intensity</span><span className="font-mono text-yellow-400">{(results.intensity / 1e16).toFixed(2)} × 10¹⁶ W/m²</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Coherence length L_c</span><span className="font-mono text-green-400">{(results.coherenceLength * 1e6).toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SHG power (est.)</span><span className="font-mono text-purple-400">{(results.P_shg * 1e9).toExponential(2)} nW</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>λ_SHG = λ_fund / 2</p>
            <p>L_c = λ_SHG / (2|n(2ω) − n(ω)|)</p>
            <p>P_2ω ∝ (χ²)² · P²_ω · L² · sinc²(ΔkL/2)</p>
            <p>SHG requires non-centrosymmetric media</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">SHG Power vs Sample Thickness</h2>
          <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Thickness (µm)", gridcolor: "#333" }, yaxis: { title: "SHG power (nW)", gridcolor: "#333" }, legend: { font: { size: 10 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Phase Matching Efficiency</h2>
          <ChartPanel data={phasePlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Thickness (µm)", gridcolor: "#333" }, yaxis: { title: "Relative efficiency", gridcolor: "#333", range: [0, 1.1] }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
