"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function ChromaticDispersionPage() {
  const [dispersionCoeff, setDispersionCoeff] = useURLState("dispersionCoeff", 17); // ps/(nm·km) for SMF
  const [dispersionSlope, setDispersionSlope] = useURLState("dispersionSlope", 0.056); // ps/(nm²·km)
  const [zeroDispWavelength, setZeroDispWavelength] = useURLState("zeroDispWavelength", 1310); // nm
  const [length, setLength] = useURLState("length", 80); // km
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [sourceLineWidth, setSourceLineWidth] = useURLState("sourceLineWidth", 0.1); // nm (laser)
  const [pulseWidth, setPulseWidth] = useURLState("pulseWidth", 50); // ps (initial pulse)
  const [modulationBW, setModulationBW] = useURLState("modulationBW", 10); // GHz (signal bandwidth)

  const calc = useMemo(() => {
    // Dispersion at operating wavelength
    const deltaLambda = wavelength - zeroDispWavelength;
    const D = dispersionCoeff + dispersionSlope * deltaLambda; // ps/(nm·km)

    // Total accumulated dispersion
    const totalDispersion = D * length; // ps/nm

    // Pulse broadening (Gaussian pulse)
    const deltaT = Math.abs(D) * length * sourceLineWidth; // ps
    const broadenedPulse = Math.sqrt(pulseWidth ** 2 + deltaT ** 2); // ps

    // Dispersion-induced power penalty (for NRZ)
    // Penalty ≈ 5·log10(1 + (π·D·L·Δλ·B)² / 4)
    const B_THz = modulationBW * 1e-3; // GHz → THz (ps × THz = dimensionless)
    const penaltyArg = (Math.PI * Math.abs(D) * length * sourceLineWidth * B_THz) / 4;
    const penalty = 5 * Math.log10(1 + penaltyArg ** 2); // dB

    // Dispersion length
    const T0 = pulseWidth / (2 * Math.sqrt(Math.LN2)); // ps, 1/e half-width
    // LD = T0²/|β₂| where β₂ = -λ²·D/(2πc) in ps²/km
    const lambda_m = wavelength * 1e-9; // nm → m
    const c_ms = 2.998e8; // m/s
    const beta2 = -(lambda_m ** 2 * D) / (2 * Math.PI * c_ms) * 1e24; // ps²/km
    const LD = beta2 !== 0 ? T0 ** 2 / Math.abs(beta2) : Infinity; // km

    // Maximum data rate (3dB bandwidth limited by dispersion)
    // B_max ≈ 0.44 / (|D| · L · Δλ) [THz] for Gaussian
    const maxBR = 0.44 / (Math.abs(D) * length * sourceLineWidth) * 1000; // GHz

    // Dispersion parameter over wavelength range (for plot)
    return { D, totalDispersion, deltaT, broadenedPulse, penalty, LD, maxBR };
  }, [dispersionCoeff, dispersionSlope, zeroDispWavelength, length, wavelength, sourceLineWidth, pulseWidth, modulationBW]);

  const spectralData = useMemo(() => {
    const wavelengths = Array.from({ length: 300 }, (_, i) => 1200 + i * 0.6);
    const D_vals = wavelengths.map(w => dispersionCoeff + dispersionSlope * (w - zeroDispWavelength));
    return [{
      x: wavelengths, y: D_vals, type: "scatter" as const, mode: "lines" as const,
      name: "D(λ)", line: { color: "#3b82f6", width: 2 },
    }, {
      x: [wavelength], y: [calc.D], type: "scatter" as const, mode: "markers" as const,
      name: "Operating λ", marker: { color: "#f87171", size: 10 },
    }, {
      x: [zeroDispWavelength, zeroDispWavelength], y: [-5, 30], type: "scatter" as const, mode: "lines" as const,
      name: "λ₀", line: { color: "#fbbf24", dash: "dash" },
    }];
  }, [calc.D, zeroDispWavelength, wavelength]);

  const lengthData = useMemo(() => {
    const lengths = Array.from({ length: 100 }, (_, i) => (i + 1) * 2);
    const broadening = lengths.map(l => {
      const dt = Math.abs(calc.D) * l * sourceLineWidth;
      return Math.sqrt(pulseWidth ** 2 + dt ** 2);
    });
    const penalty = lengths.map(l => {
      const B_THz = modulationBW * 1e-3;
      const arg = (Math.PI * Math.abs(calc.D) * l * sourceLineWidth * B_THz) / 4;
      return 5 * Math.log10(1 + arg ** 2);
    });
    return [
      { x: lengths, y: broadening, type: "scatter" as const, mode: "lines" as const, name: "Pulse Width (ps)", line: { color: "#22c55e" }, yaxis: "y" },
      { x: lengths, y: penalty, type: "scatter" as const, mode: "lines" as const, name: "Penalty (dB)", line: { color: "#f97316" }, yaxis: "y2" },
    ];
  }, [calc.D, sourceLineWidth, pulseWidth, modulationBW]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Chromatic Dispersion (CD)" description="Calculate chromatic dispersion, pulse broadening, and system penalties for single-mode fiber.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="D₀ (ps/nm/km) at λ₀" value={dispersionCoeff} onChange={setDispersionCoeff} step="0.5" />
        <ValidatedNumberInput label="Dispersion Slope S₀ (ps/nm²/km)" value={dispersionSlope} onChange={setDispersionSlope} step="0.001" />
        <ValidatedNumberInput label="Zero Dispersion Wavelength λ₀ (nm)" value={zeroDispWavelength} onChange={setZeroDispWavelength} step="1" />
        <ValidatedNumberInput label="Operating Wavelength (nm)" value={wavelength} onChange={setWavelength} step="1" />
        <ValidatedNumberInput label="Fiber Length (km)" value={length} onChange={setLength} min={0.1} step="1" />
        <ValidatedNumberInput label="Source Linewidth (nm)" value={sourceLineWidth} onChange={setSourceLineWidth} min={0.001} step="0.01" />
        <ValidatedNumberInput label="Initial Pulse Width (ps)" value={pulseWidth} onChange={setPulseWidth} step="1" />
        <ValidatedNumberInput label="Modulation BW (GHz)" value={modulationBW} onChange={setModulationBW} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">D(λ)</p>
          <p className="text-xl font-bold text-blue-400">{calc.D.toFixed(2)} <span className="text-sm">ps/nm/km</span></p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Accumulated Dispersion</p>
          <p className="text-xl font-bold text-green-400">{calc.totalDispersion.toFixed(0)} <span className="text-sm">ps/nm</span></p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Broadened Pulse</p>
          <p className="text-xl font-bold text-yellow-400">{calc.broadenedPulse.toFixed(2)} <span className="text-sm">ps</span></p>
          <p className="text-xs text-gray-500">from {pulseWidth} ps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dispersion Penalty</p>
          <p className={`text-xl font-bold ${calc.penalty > 1 ? "text-red-400" : calc.penalty > 0.5 ? "text-yellow-400" : "text-green-400"}`}>{calc.penalty.toFixed(2)} dB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dispersion Length</p>
          <p className="text-xl font-bold text-purple-400">{calc.LD.toFixed(1)} km</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Data Rate</p>
          <p className="text-xl font-bold text-cyan-400">{calc.maxBR.toFixed(1)} GHz</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pulse Broadening</p>
          <p className="text-xl font-bold text-orange-400">{calc.deltaT.toFixed(2)} ps</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Dispersion vs Wavelength</h3>
        <ChartPanel data={spectralData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "D (ps/nm/km)", gridcolor: "#374151", color: "#9ca3af" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          legend: { bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Pulse Broadening & Penalty vs Length</h3>
        <ChartPanel data={lengthData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Length (km)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Pulse Width (ps)", gridcolor: "#374151", color: "#22c55e" },
          yaxis2: { title: "Penalty (dB)", gridcolor: "#374151", color: "#f97316", overlaying: "y", side: "right" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 60, b: 40, l: 60 }, height: 350,
          legend: { bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>D(λ) = D₀ + S₀ · (λ - λ₀)</p>
          <p>ΔT = |D| · L · Δλ [pulse broadening]</p>
          <p>T_out = √(T_in² + ΔT²) [Gaussian]</p>
          <p>Penalty = 5·log₁₀(1 + (π·D·L·Δλ·B/4)²) [dB]</p>
          <p>L_D = T₀² / |β₂| [dispersion length]</p>
          <p>B_max ≈ 0.44 / (|D|·L·Δλ) [Gaussian, THz]</p>
          <p>SMF-28: D=17 ps/nm/km @1550nm, S=0.056 ps/nm²/km, λ₀=1310nm</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
