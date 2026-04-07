"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function SupercontinuumPage() {
  const [wavelength, setWavelength] = useState(1064); // nm pump
  const [pulseEnergy, setPulseEnergy] = useState(10); // nJ
  const [pulseDuration, setPulseDuration] = useState(100); // fs
  const [fiberLength, setFiberLength] = useState(10); // cm
  const [coreDiameter, setCoreDiameter] = useState(2); // µm (PCF)
  const [gamma, setGamma] = useState(100); // W⁻¹km⁻¹
  const [beta2, setBeta2] = useState(-10); // ps²/km (anomalous)

  const peakPower = pulseEnergy * 1e-9 / (pulseDuration * 1e-15); // W
  const Lsoliton = pulseDuration * 1e-15 ** 2 / Math.abs(beta2 * 1e-3); // m
  const P0soliton = Math.abs(beta2 * 1e-3) / (gamma * 1e-3 * (pulseDuration * 1e-15) ** 2); // W
  const Nsoliton = Math.sqrt(peakPower / P0soliton);
  const Lfibre = fiberLength * 1e-2;
  const LD = Lfibre / Lsoliton;

  // Soliton fission distance
  const Lfiss = Lsoliton / Nsoliton;

  // Estimate SC bandwidth (empirical)
  const scBandwidthNm = wavelength * Nsoliton * 1.5; // rough estimate

  // Dispersion length vs pulse duration
  const dispData = useMemo(() => {
    const durations = Array.from({ length: 200 }, (_, i) => 10 + i * 1000 / 200);
    const LDs = durations.map(t => {
      const ld = (t * 1e-15) ** 2 / Math.abs(beta2 * 1e-3);
      return ld * 100; // cm
    });
    return [
      { x: durations, y: LDs, type: "scatter", mode: "lines", name: "L_D", line: { color: "#60a5fa", width: 2 } },
      { x: [pulseDuration, pulseDuration], y: [0, LDs[100] * 1.5], type: "scatter", mode: "lines", name: "Current", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [pulseDuration, beta2]);

  // SC spectrum estimate (qualitative)
  const spectrumData = useMemo(() => {
    const wavelengths = Array.from({ length: 400 }, (_, i) => 300 + i * 1500 / 400);
    const omega0 = 2 * Math.PI * 3e8 / (wavelength * 1e-9);
    const spectrum = wavelengths.map(w => {
      const omega = 2 * Math.PI * 3e8 / (w * 1e-9);
      const deltaOmega = omega - omega0;
      const width = Nsoliton * 2 * Math.PI * 3e8 / (wavelength * 1e-9) / 20;
      const solitonPart = Math.exp(-0.5 * (deltaOmega / width) ** 2);
      const dispersivePart = 0.3 * Math.exp(-0.5 * ((deltaOmega + width * 3) / (width * 2)) ** 2);
      const sfgPart = 0.2 * Math.exp(-0.5 * ((deltaOmega - width * 4) / (width * 1.5)) ** 2);
      return Math.log10((solitonPart + dispersivePart + sfgPart) * 1000 + 1);
    });
    return [
      { x: wavelengths, y: spectrum, type: "scatter", mode: "lines", name: "SC Spectrum", fill: "tozeroy", line: { color: "#34d399", width: 2 } },
    ];
  }, [wavelength, pulseDuration, gamma, beta2, fiberLength, Nsoliton]);

  const dispLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Pulse duration (fs)", gridcolor: "#374151" },
    yaxis: { title: "Dispersion length (cm)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const spectrumLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Spectral power (dB)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Supercontinuum Generation" description="Broadband SC generation in photonic crystal fibers via soliton fission, SPM, and dispersive wave generation.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">N</span> = √(P<sub>peak</sub> / P<sub>0</sub>) — soliton number</p>
        <p><span className="text-blue-400">L<sub>D</sub></span> = τ₀² / |β₂| — dispersion length</p>
        <p><span className="text-blue-400">L<sub>NL</sub></span> = 1 / (γ P<sub>peak</sub>) — nonlinear length</p>
        <p><span className="text-blue-400">L<sub>fiss</sub></span> ≈ L<sub>D</sub> / N — soliton fission distance</p>
        <p><span className="text-blue-400">P<sub>0</sub></span> = |β₂| / (γ τ₀²) — soliton peak power</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pump λ (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Pulse Energy (nJ)" value={pulseEnergy} onChange={setPulseEnergy} />
        <ValidatedNumberInput label="Pulse Duration (fs)" value={pulseDuration} onChange={setPulseDuration} />
        <ValidatedNumberInput label="Fiber Length (cm)" value={fiberLength} onChange={setFiberLength} />
        <ValidatedNumberInput label="γ (W⁻¹km⁻¹)" value={gamma} onChange={setGamma} />
        <ValidatedNumberInput label="β₂ (ps²/km)" value={beta2} onChange={setBeta2} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Power</p>
          <p className="text-xl font-bold text-blue-400">{peakPower.toExponential(2)} W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Soliton Number N</p>
          <p className="text-xl font-bold text-green-400">{Nsoliton.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dispersion Length</p>
          <p className="text-xl font-bold text-orange-400">{(Lsoliton * 100).toFixed(2)} cm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Est. SC Bandwidth</p>
          <p className="text-xl font-bold text-purple-400">{scBandwidthNm.toFixed(0)} nm</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Soliton P₀</p>
          <p className="text-xl font-bold text-cyan-400">{P0soliton.toExponential(2)} W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fission Distance</p>
          <p className="text-xl font-bold text-yellow-400">{(Lfiss * 100).toFixed(2)} cm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">L / L<sub>D</sub></p>
          <p className="text-xl font-bold text-pink-400">{LD.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Regime</p>
          <p className="text-xl font-bold text-red-400">{beta2 < 0 ? (Nsoliton > 10 ? "Strong SC" : Nsoliton > 1 ? "Soliton fission" : "Perturbative") : "Normal dispersion"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={dispData} layout={dispLayout} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={spectrumData} layout={spectrumLayout} />
        </div>
      </div>
    </CalculatorShell>
  );
}
