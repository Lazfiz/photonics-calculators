"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function CoherentAntiStokesPage() {
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 800);
  const [stokesWavelength, setStokesWavelength] = useURLState("stokesWavelength", 1040);
  const [na, setNa] = useURLState("na", 0.8);
  const [n, setN] = useURLState("n", 1.33);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 100);
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 50);
  const [stokesPower, setStokesPower] = useURLState("stokesPower", 30);
  const [repRate, setRepRate] = useURLState("repRate", 80);
  const [linewidth, setLinewidth] = useURLState("linewidth", 10);

  const results = useMemo(() => {
    const lamP = pumpWavelength * 1e-9;
    const lamS = stokesWavelength * 1e-9;
    const wavenumberP = 1 / (lamP * 100);
    const wavenumberS = 1 / (lamS * 100);
    const ramanShift = (wavenumberP - wavenumberS);
    const carsWavelength = 1 / (2 * wavenumberP - wavenumberS) * 1e7;
    const lateralRes = 0.325 * lamP / na * 1e9;
    const pumpPulseE = (pumpPower * 1e-3) / (repRate * 1e6) * 1e9;
    const stokesPulseE = (stokesPower * 1e-3) / (repRate * 1e6) * 1e9;
    const spectralRes = 1 / (2 * Math.PI * pulseWidth * 1e-15) * 1e-12;
    const nonResonantBg = pumpPower * stokesPower / (ramanShift * ramanShift);
    const excitationBandwidth = 0.44 / (pulseWidth * 1e-15);
    const chi3Imag = Math.PI / (ramanShift * ramanShift);
    return { ramanShift, carsWavelength, lateralRes, pumpPulseE, stokesPulseE, spectralRes, nonResonantBg, excitationBandwidth, chi3Imag };
  }, [pumpWavelength, stokesWavelength, na, n, pulseWidth, pumpPower, stokesPower, repRate, linewidth]);

  const plotData = useMemo(() => {
    const stokes = [];
    const shifts = [];
    const carsLambda = [];
    for (let s = pumpWavelength + 100; s <= pumpWavelength + 600; s += 5) {
      stokes.push(s);
      const wP = 1 / (pumpWavelength * 1e-7);
      const wS = 1 / (s * 1e-7);
      shifts.push((wP - wS));
      carsLambda.push(1 / (2 * wP - wS) * 1e7);
    }
    return [
      { x: stokes, y: shifts, name: "Raman shift (cm⁻¹)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines", yaxis: "y" },
      { x: stokes, y: carsLambda, name: "CARS λ (nm)", line: { color: "#34d399" }, type: "scatter", mode: "lines", yaxis: "y2" },
    ];
  }, [pumpWavelength]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="CARS Imaging Calculator" description="Coherent Anti-Stokes Raman Scattering: vibrational shift, CARS wavelength, and laser parameters.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pump wavelength (nm)</label>
            <ValidatedNumberInput label="Pump wavelength (nm)" value={pumpWavelength} onChange={setPumpWavelength} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Stokes wavelength (nm)</label>
            <ValidatedNumberInput label="Stokes wavelength (nm)" value={stokesWavelength} onChange={setStokesWavelength} />
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
            <label className="block text-sm text-gray-400 mb-1">Pump power (mW)</label>
            <ValidatedNumberInput label="Pump power (mW)" value={pumpPower} onChange={setPumpPower} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Stokes power (mW)</label>
            <ValidatedNumberInput label="Stokes power (mW)" value={stokesPower} onChange={setStokesPower} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rep rate (MHz)</label>
            <ValidatedNumberInput label="Rep rate (MHz)" value={repRate} onChange={setRepRate} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Raman shift</span><span className="font-mono text-blue-400">{results.ramanShift.toFixed(1)} cm⁻¹</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">CARS wavelength</span><span className="font-mono text-green-400">{results.carsWavelength.toFixed(0)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-cyan-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pump pulse energy</span><span className="font-mono text-yellow-400">{results.pumpPulseE.toFixed(2)} nJ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Stokes pulse energy</span><span className="font-mono text-orange-400">{results.stokesPulseE.toFixed(2)} nJ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Spectral resolution</span><span className="font-mono text-purple-400">{results.spectralRes.toFixed(2)} THz</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Non-resonant BG (rel.)</span><span className="font-mono text-red-400">{results.nonResonantBg.toFixed(4)}</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Ω = 1/λ_pump - 1/λ_stokes (cm⁻¹)</p>
            <p>λ_CARS = 1/(2·ν̃_pump - ν̃_stokes)</p>
            <p>I_CARS ∝ |χ³|² · I_pump² · I_stokes</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Raman Shift &amp; CARS λ vs Stokes Wavelength</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Stokes λ (nm)", gridcolor: "#333" }, yaxis: { title: "Raman shift (cm⁻¹)", gridcolor: "#333", side: "left" }, yaxis2: { title: "CARS λ (nm)", gridcolor: "#333", side: "right", overlaying: "y" }, legend: { font: { size: 11 } }, margin: { l: 70, r: 60, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
