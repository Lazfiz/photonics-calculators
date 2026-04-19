"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function CoherentAntiStokesRamanPage() {
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 532);
  const [stokesWavelength, setStokesWavelength] = useURLState("stokesWavelength", 630);
  const [ramanShift, setRamanShift] = useURLState("ramanShift", 2880);
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 5);
  const [peakPower, setPeakPower] = useURLState("peakPower", 1e6);

  const calcAntiStokesWL = () => {
    const invP = 1e7 / pumpWavelength;
    const invS = 1e7 / stokesWavelength;
    const invAS = 2 * invP - invS;
    return invAS > 0 ? 1e7 / invAS : NaN;
  };

  const antiStokesWL = calcAntiStokesWL();

  const calcRamanShift = () => {
    const invP = 1e7 / pumpWavelength;
    const invS = 1e7 / stokesWavelength;
    return invP - invS;
  };

  const actualShift = calcRamanShift();

  const spectrumData = useMemo(() => {
    const shifts = Array.from({ length: 500 }, (_, i) => (i / 500) * 4000);
    const pumpCm = 1e7 / pumpWavelength;
    const stokesCm = 1e7 / stokesWavelength;

    // Non-resonant background + resonant CARS signal
    const cars = shifts.map(s => {
      const delta = s - ramanShift;
      const gamma = 25;
      const denomMag2 = delta * delta + gamma * gamma;
      const chiR_re = 50 * delta / denomMag2;
      const chiR_im = -50 * gamma / denomMag2;
      const chi_re = 10 + chiR_re; // χ_NR + Re(χ_R)
      const chi_im = chiR_im; // Im(χ_R)
      return chi_re * chi_re + chi_im * chi_im; // |χ³|²
    });
    const maxC = Math.max(...cars);
    const normCars = cars.map(c => c / maxC);

    return [
      { x: shifts, y: normCars, type: "scatter" as const, mode: "lines" as const, name: "CARS Signal", line: { color: "#60a5fa", width: 2 } },
      { x: shifts, y: shifts.map(s => {
        const d = s - ramanShift;
        return 0.3 * Math.exp(-0.5 * Math.pow(d / 25, 2));
      }), type: "scatter" as const, mode: "lines" as const, name: "Spontaneous Raman", line: { color: "#6b7280", dash: "dash" } },
    ];
  }, [ramanShift]);

  const energyData = useMemo(() => {
    const pumpCm = 1e7 / pumpWavelength;
    const stokesCm = 1e7 / stokesWavelength;
    const asCm = 2 * pumpCm - stokesCm;
    return [
      { x: [pumpCm, pumpCm], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "Pump (ω₁)", line: { color: "#f87171", width: 3 } },
      { x: [stokesCm, stokesCm], y: [0, 0.7], type: "scatter" as const, mode: "lines" as const, name: "Stokes (ω₂)", line: { color: "#fbbf24", width: 3 } },
      { x: [asCm, asCm], y: [0, 1.1], type: "scatter" as const, mode: "lines" as const, name: "CARS (ω₃)", line: { color: "#60a5fa", width: 3, dash: "dash" } },
    ];
  }, [pumpWavelength, stokesWavelength]);

  const coherenceTime = pulseWidth * 1e-12 / 2.355; // FWHM → σ
  const spectralRes = 1 / (coherenceTime * 2.998e10);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Coherent Anti-Stokes Raman Scattering (CARS)" description="Four-wave mixing process for label-free vibrational imaging with chemical specificity.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Pump Wavelength ω₁ (nm)" value={pumpWavelength} onChange={setPumpWavelength} min={200} max={2000} />
        <ValidatedNumberInput label="Stokes Wavelength ω₂ (nm)" value={stokesWavelength} onChange={setStokesWavelength} min={pumpWavelength} max={2000} />
        <ValidatedNumberInput label="Raman Shift ν̃ (cm⁻¹)" value={ramanShift} onChange={setRamanShift} min={100} max={4500} />
        <ValidatedNumberInput label="Pulse Width (ps)" value={pulseWidth} onChange={setPulseWidth} min={0.01} max={100} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Energy conservation:</span> ω<sub>AS</sub> = 2ω₁ − ω₂</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Raman shift:</span> ν̃ = 1/λ₁ − 1/λ₂ (cm⁻¹)</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Third-order susceptibility:</span> χ⁽³⁾ = χ<sub>R</sub> + χ<sub>NR</sub></p>
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">CARS intensity:</span> I<sub>CARS</sub> ∝ |χ⁽³⁾|² × I₁² × I₂</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-blue-400">{antiStokesWL ? antiStokesWL.toFixed(1) : "—"} nm</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-green-400">{actualShift.toFixed(0)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-yellow-400">{spectralRes.toFixed(1)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-red-400">{(coherenceTime * 1e12).toFixed(1)} ps</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">CARS Spectrum (with non-resonant background)</h3>
        <ChartPanel data={spectrumData} layout={{
          xaxis: { title: "Raman Shift (cm⁻¹)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Signal (a.u.)", gridcolor: "#374151", color: "#9ca3af" },
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          legend: { orientation: "h", y: -0.2 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Concepts</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong className="text-blue-400">Coherent</strong>: Signal emitted in specific direction (phase-matched), not isotropic</li>
          <li>• <strong className="text-red-400">Non-resonant background</strong>: Real part of χ⁽³⁾ causes dispersive line shape</li>
          <li>• <strong className="text-green-400">Advantages</strong>: orders of magnitude stronger than spontaneous Raman, video-rate imaging</li>
          <li>• <strong className="text-yellow-400">Disadvantages</strong>: non-resonant background, requires two synchronized lasers</li>
        </ul>
      </div>
    </CalculatorShell>
  );
}
