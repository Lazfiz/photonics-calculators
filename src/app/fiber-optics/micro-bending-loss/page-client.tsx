"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function MicrobendingLossPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.1); // µm
  const [coreNA, setCoreNA] = useURLState("coreNA", 0.12);
  const [coatingModulus, setCoatingModulus] = useURLState("coatingModulus", 0.5); // MPa (soft coating)
  const [correlationLength, setCorrelationLength] = useURLState("correlationLength", 500); // µm
  const [rmsAmplitude, setRmsAmplitude] = useURLState("rmsAmplitude", 0.1); // µm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 1); // km

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-3; // µm
    const a = coreRadius;
    const n1 = 1.468;
    const n2 = Math.sqrt(n1 * n1 - coreNA * coreNA);
    const V = coreNA * 2 * Math.PI * a / lambda;
    
    // Mode field diameter approximation (Marcuse, V-parameterized)
    const w = a * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));
    
    // Propagation constant difference
    const beta = n1 * 2 * Math.PI / lambda;
    const beta_clad = n2 * 2 * Math.PI / lambda;
    const deltaBeta = beta - beta_clad;
    
    // Microbend loss coefficient (Gloge formula)
    // α = (k²·w⁴ / 4) · (Δβ)² · Φ(Δβ) [Np/m]
    // where Φ is the power spectral density of the microbends
    // Assuming Gaussian correlation: Φ(Ω) = A²·L_c·√π·exp(-(Ω·L_c/2)²)
    
    const k0 = 2 * Math.PI / lambda;
    const Lc = correlationLength;
    const A = rmsAmplitude;
    
    // Power spectrum at spatial frequency Δβ
    const Omega = deltaBeta;
    const phiOmega = A * A * Lc * Math.sqrt(Math.PI) * Math.exp(-Math.pow(Omega * Lc / 2, 2));
    
    // Microbend loss coefficient
    const alphaMicroNp = (k0 * k0 * Math.pow(w, 4) / 4) * Math.pow(deltaBeta, 2) * phiOmega;
    const alphaMicrodB = alphaMicroNp * 4.343; // dB/m
    
    // Total loss over fiber length
    const totalLoss = alphaMicrodB * fiberLength * 1000; // dB
    
    // Sensitivity factor
    const sensitivity = Math.pow(w / a, 4);
    
    // Coating effect (soft coating reduces microbend loss)
    const coatingFactor = Math.sqrt(0.5 / coatingModulus); // relative to 0.5 MPa reference
    const effectiveLoss = totalLoss * coatingFactor;
    
    return { w, V, alphaMicrodB, totalLoss, sensitivity, coatingFactor, effectiveLoss, deltaBeta };
  }, [wavelength, coreRadius, coreNA, coatingModulus, correlationLength, rmsAmplitude, fiberLength]);

  const wavelengthData = useMemo(() => {
    const wavelengths = Array.from({ length: 150 }, (_, i) => 1200 + i * 3);
    const a = coreRadius;
    const n1 = 1.468;
    const n2 = Math.sqrt(n1 * n1 - coreNA * coreNA);
    const Lc = correlationLength;
    const A = rmsAmplitude;
    
    const loss = wavelengths.map(wl => {
      const lam = wl * 1e-3;
      const w = a * (0.65 + 1.619 / Math.pow(coreNA, 1.5) + 2.879 / Math.pow(coreNA, 6));
      const k0 = 2 * Math.PI / lam;
      const beta = n1 * 2 * Math.PI / lam;
      const beta_c = n2 * 2 * Math.PI / lam;
      const dB = beta - beta_c;
      const phi = A * A * Lc * Math.sqrt(Math.PI) * Math.exp(-Math.pow(dB * Lc / 2, 2));
      return (k0 * k0 * Math.pow(w, 4) / 4) * dB * dB * phi * 4.343 * 1000;
    });
    
    return [{ x: wavelengths, y: loss, type: "scatter" as const, mode: "lines" as const, name: "Microbend Loss", line: { color: "#f97316", width: 2 } }];
  }, [coreRadius, coreNA, correlationLength, rmsAmplitude]);

  const amplitudeData = useMemo(() => {
    const amplitudes = Array.from({ length: 100 }, (_, i) => 0.01 + i * 0.01);
    const lambda = wavelength * 1e-3;
    const a = coreRadius;
    const n1 = 1.468;
    const n2 = Math.sqrt(n1 * n1 - coreNA * coreNA);
    const Lc = correlationLength;
    const k0 = 2 * Math.PI / lambda;
    const w = a * (0.65 + 1.619 / Math.pow(coreNA, 1.5) + 2.879 / Math.pow(coreNA, 6));
    const beta = n1 * 2 * Math.PI / lambda;
    const beta_c = n2 * 2 * Math.PI / lambda;
    const dB = beta - beta_c;
    
    const loss = amplitudes.map(A => {
      const phi = A * A * Lc * Math.sqrt(Math.PI) * Math.exp(-Math.pow(dB * Lc / 2, 2));
      return (k0 * k0 * Math.pow(w, 4) / 4) * dB * dB * phi * 4.343 * 1000;
    });
    
    return [{ x: amplitudes, y: loss, type: "scatter" as const, mode: "lines" as const, name: "Loss vs Amplitude", line: { color: "#a78bfa", width: 2 } }];
  }, [wavelength, coreRadius, coreNA, correlationLength]);

  const correlationData = useMemo(() => {
    const lengths = Array.from({ length: 100 }, (_, i) => 10 + i * 20);
    const lambda = wavelength * 1e-3;
    const a = coreRadius;
    const n1 = 1.468;
    const n2 = Math.sqrt(n1 * n1 - coreNA * coreNA);
    const A = rmsAmplitude;
    const k0 = 2 * Math.PI / lambda;
    const w = a * (0.65 + 1.619 / Math.pow(coreNA, 1.5) + 2.879 / Math.pow(coreNA, 6));
    const beta = n1 * 2 * Math.PI / lambda;
    const beta_c = n2 * 2 * Math.PI / lambda;
    const dB = beta - beta_c;
    
    const loss = lengths.map(Lc => {
      const phi = A * A * Lc * Math.sqrt(Math.PI) * Math.exp(-Math.pow(dB * Lc / 2, 2));
      return (k0 * k0 * Math.pow(w, 4) / 4) * dB * dB * phi * 4.343 * 1000;
    });
    
    return [{ x: lengths, y: loss, type: "scatter" as const, mode: "lines" as const, name: "Loss vs Lc", line: { color: "#22c55e", width: 2 } }];
  }, [wavelength, coreRadius, coreNA, rmsAmplitude]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Microbending Loss" description="Calculate microbending-induced loss from random perturbations, coating properties, and fiber parameters.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="10" />
        <ValidatedNumberInput label="Core Radius (µm)" value={coreRadius} onChange={setCoreRadius} step="0.1" />
        <ValidatedNumberInput label="Core NA" value={coreNA} onChange={setCoreNA} step="0.01" />
        <ValidatedNumberInput label="Coating Modulus (MPa)" value={coatingModulus} onChange={setCoatingModulus} min={0.1} step="0.1" />
        <ValidatedNumberInput label="Correlation Length L_c (µm)" value={correlationLength} onChange={setCorrelationLength} step="10" />
        <ValidatedNumberInput label="RMS Amplitude (µm)" value={rmsAmplitude} onChange={setRmsAmplitude} min={0.001} step="0.01" />
        <ValidatedNumberInput label="Fiber Length (km)" value={fiberLength} onChange={setFiberLength} min={0.1} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Loss Coefficient</p>
          <p className="text-xl font-bold text-red-400">{calc.alphaMicrodB.toFixed(4)} <span className="text-sm">dB/m</span></p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Loss ({fiberLength} km)</p>
          <p className={`text-xl font-bold ${calc.totalLoss > 0.5 ? "text-red-400" : calc.totalLoss > 0.1 ? "text-yellow-400" : "text-green-400"}`}>{calc.totalLoss.toFixed(4)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">MFD</p>
          <p className="text-xl font-bold text-blue-400">{calc.w.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Sensitivity Factor</p>
          <p className="text-xl font-bold text-purple-400">{calc.sensitivity.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coating Reduction Factor</p>
          <p className="text-xl font-bold text-cyan-400">{calc.coatingFactor.toFixed(3)}</p>
          <p className="text-xs text-gray-500">Soft coating reduces loss</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Loss</p>
          <p className="text-xl font-bold text-orange-400">{calc.effectiveLoss.toFixed(4)} dB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Loss vs Wavelength</h3>
          <ChartPanel data={wavelengthData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "λ (nm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Loss (dB/km)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 10, r: 10, b: 40, l: 50 }, height: 200,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Loss vs RMS Amplitude</h3>
          <ChartPanel data={amplitudeData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "A_rms (µm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Loss (dB/km)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 10, r: 10, b: 40, l: 50 }, height: 200,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Loss vs Correlation Length</h3>
          <ChartPanel data={correlationData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "L_c (µm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Loss (dB/km)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 10, r: 10, b: 40, l: 50 }, height: 200,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>α = (k₀²·w⁴/4)·Δβ²·Φ(Δβ) [Np/m] — Gloge formula</p>
          <p>Φ(Ω) = A²·L_c·√π·exp(-(Ω·L_c/2)²) — Gaussian PSD</p>
          <p>Δβ = (2π/λ)·(n₁ - n₂) — propagation constant difference</p>
          <p>Loss ∝ w⁴ ∝ MFD⁴ — larger mode = more sensitive</p>
          <p>Soft coating (low modulus) reduces microbend sensitivity</p>
          <p>Typical: L_c = 100-1000 µm, A_rms = 0.01-0.5 µm</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
