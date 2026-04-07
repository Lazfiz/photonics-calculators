"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function TerahertzSpectroscopyPage() {
  const [freqStart, setFreqStart] = useState(0.1);
  const [freqEnd, setFreqEnd] = useState(5);
  const [temperature, setTemperature] = useState(293);
  const [sampleThickness, setSampleThickness] = useState(0.1);
  const [refractiveIndex, setRefractiveIndex] = useState(1.5);
  const [absorptionCoeff, setAbsorptionCoeff] = useState(5);

  const transmissionData = useMemo(() => {
    const freqs = Array.from({ length: 500 }, (_, i) => freqStart + (i / 500) * (freqEnd - freqStart));
    // Simple model: absorption increases with frequency (rotational + translational modes)
    const alpha = freqs.map(f => absorptionCoeff * Math.pow(f, 2));
    const transmission = alpha.map(a => Math.exp(-a * sampleThickness));
    return [
      { x: freqs, y: transmission.map(t => t * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmission %", line: { color: "#60a5fa", width: 2 } },
      { x: freqs, y: alpha, type: "scatter" as const, mode: "lines" as const, name: "Absorption Coeff (cm⁻¹)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
    ];
  }, [freqStart, freqEnd, sampleThickness, absorptionCoeff]);

  const absorptionFeatures = useMemo(() => {
    // Simulate THz absorption features (phonon modes, lattice vibrations)
    const freqs = Array.from({ length: 500 }, (_, i) => freqStart + (i / 500) * (freqEnd - freqStart));
    const features = [
      { center: 0.5, width: 0.1, amp: 0.3 },
      { center: 1.2, width: 0.15, amp: 0.6 },
      { center: 1.8, width: 0.08, amp: 0.4 },
      { center: 2.5, width: 0.2, amp: 0.8 },
      { center: 3.2, width: 0.12, amp: 0.5 },
      { center: 4.0, width: 0.25, amp: 0.7 },
    ];
    const spectrum = freqs.map(f => {
      let alpha = absorptionCoeff * f * f;
      for (const feat of features) {
        alpha += feat.amp * 20 * Math.exp(-0.5 * Math.pow((f - feat.center) / feat.width, 2));
      }
      return Math.exp(-alpha * sampleThickness);
    });
    return [
      { x: freqs, y: spectrum.map(s => s * 100), type: "scatter" as const, mode: "lines" as const, name: "With features", line: { color: "#34d399", width: 2 } },
    ];
  }, [freqStart, freqEnd, sampleThickness, absorptionCoeff]);

  const permittivityData = useMemo(() => {
    const freqs = Array.from({ length: 300 }, (_, i) => 0.1 + (i / 300) * 4.9);
    // Debye relaxation model
    const epsStatic = 4.0;
    const epsInf = 2.5;
    const tau = 0.5; // ps
    const realPart = freqs.map(f => epsInf + (epsStatic - epsInf) / (1 + Math.pow(2 * Math.PI * f * tau, 2)));
    const imagPart = freqs.map(f => (epsStatic - epsInf) * 2 * Math.PI * f * tau / (1 + Math.pow(2 * Math.PI * f * tau, 2)));
    return [
      { x: freqs, y: realPart, type: "scatter" as const, mode: "lines" as const, name: "ε' (real)", line: { color: "#60a5fa" } },
      { x: freqs, y: imagPart, type: "scatter" as const, mode: "lines" as const, name: "ε'' (imag)", line: { color: "#f87171" } },
    ];
  }, []);

  const kBT = 0.695 * temperature; // cm⁻¹
  const minFreq = freqStart;
  const maxFreq = freqEnd;
  const photonEnergyMin = 33.356 * minFreq; // cm⁻¹
  const photonEnergyMax = 33.356 * maxFreq;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Terahertz (THz) Spectroscopy" description="Probing low-energy excitations: phonon modes, hydrogen bonding, lattice vibrations (0.1–10 THz).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Frequency Start (THz)" value={freqStart} onChange={setFreqStart} min={0.01} max={10} />
        <ValidatedNumberInput label="Frequency End (THz)" value={freqEnd} onChange={setFreqEnd} min={0.1} max={10} />
        <ValidatedNumberInput label="Sample Thickness (cm)" value={sampleThickness} onChange={setSampleThickness} min={0.01} max={5} />
        <ValidatedNumberInput label="Absorption Coeff Scale (cm⁻¹/THz²)" value={absorptionCoeff} onChange={setAbsorptionCoeff} min={0.1} max={100} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Transmission:</span> T = exp(−α × d)</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Debye relaxation:</span> ε*(ω) = ε∞ + (εₛ − ε∞) / (1 + jωτ)</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Phase:</span> φ = 2πf × n × d / c</p>
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">k<sub>B</sub>T at {temperature}K:</span> {kBT.toFixed(1)} cm⁻¹ ({(kBT * 0.03).toFixed(2)} THz)</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-blue-400">{photonEnergyMin.toFixed(0)}–{photonEnergyMax.toFixed(0)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-green-400">{(3e8 / (maxFreq * 1e12) * 1e3).toFixed(0)}–{(3e8 / (minFreq * 1e12) * 1e3).toFixed(0)} μm</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-yellow-400">{refractiveIndex}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">THz Transmission & Absorption</h3>
        <ChartPanel data={transmissionData} layout={{
          xaxis: { title: "Frequency (THz)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Transmission (%)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis2: { title: "α (cm⁻¹)", overlaying: "y", side: "right", gridcolor: "#374151", color: "#9ca3af" },
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          legend: { orientation: "h", y: -0.25 },
        }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">With Absorption Features</h3>
          <ChartPanel data={absorptionFeatures} layout={{
            xaxis: { title: "Frequency (THz)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Transmission (%)", gridcolor: "#374151", color: "#9ca3af" },
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Dielectric Function (Debye)</h3>
          <ChartPanel data={permittivityData} layout={{
            xaxis: { title: "Frequency (THz)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "ε", gridcolor: "#374151", color: "#9ca3af" },
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
            legend: { orientation: "h", y: -0.2 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Applications</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong className="text-blue-400">Pharmaceuticals</strong>: Polymorph identification, tablet coating analysis</li>
          <li>• <strong className="text-green-400">Security</strong>: Concealed object detection, explosive identification</li>
          <li>• <strong className="text-yellow-400">Semiconductors</strong>: Carrier dynamics, bandgap characterization</li>
          <li>• <strong className="text-red-400">Biomolecules</strong>: Protein collective modes, DNA backbone vibrations</li>
        </ul>
      </div>
    </CalculatorShell>
  );
}
