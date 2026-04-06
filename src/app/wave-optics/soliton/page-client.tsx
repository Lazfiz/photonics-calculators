"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function SolitonPage() {
  const [pulseWidth, setPulseWidth] = useState(100); // fs FWHM
  const [peakPower, setPeakPower] = useState(5000); // W
  const [beta2, setBeta2] = useState(-11.83); // fs²/mm (silica @ 1550nm)
  const [gamma, setGamma] = useState(1.3); // 1/(W·km)
  const [distance, setDistance] = useState(50); // m

  // Soliton order and parameters
  const t0 = pulseWidth / (2 * Math.sqrt(Math.LN2)); // 1/e half-width from FWHM
  const LD = Math.pow(t0, 2) / Math.abs(beta2 * 1e3); // dispersion length in m (beta2 in fs²/mm)
  const P0 = 1 / (gamma * 1e-3 * LD); // soliton peak power in W
  const N = Math.sqrt(peakPower / P0); // soliton order

  // Split-step simulation (simplified)
  const chartData = useMemo(() => {
    const nZ = 150;
    const nT = 300;
    const zSpan = distance;
    const tSpan = 8 * t0;
    const dz = zSpan / nZ;
    const dt = 2 * tSpan / nT;

    // Initialize pulse: sech envelope
    let real = new Float64Array(nT);
    let imag = new Float64Array(nT);
    for (let i = 0; i < nT; i++) {
      const t = -tSpan + i * dt;
      real[i] = Math.sqrt(peakPower) / Math.cosh(t / t0);
      imag[i] = 0;
    }

    const zArr = [];
    const peakArr = [];
    const widthArr = [];

    const beta2SI = beta2 * 1e3; // fs²/m
    const gammaSI = gamma * 1e-3; // 1/(W·m)

    for (let step = 0; step <= nZ; step++) {
      // Measure
      let maxI = 0, w2 = 0, totalP = 0;
      for (let i = 0; i < nT; i++) {
        const p = real[i] * real[i] + imag[i] * imag[i];
        if (p > maxI) maxI = p;
        totalP += p;
        const t = -tSpan + i * dt;
        w2 += p * t * t;
      }
      if (totalP > 0) w2 /= totalP;
      zArr.push(step * dz);
      peakArr.push(maxI);
      widthArr.push(Math.sqrt(w2) / t0);

      if (step === nZ) break;

      // Half-step dispersion (frequency domain)
      const fftR = new Float64Array(nT);
      const fftI = new Float64Array(nT);
      for (let i = 0; i < nT; i++) {
        const om = (i < nT / 2 ? i : i - nT) * 2 * Math.PI / (nT * dt);
        const phase = -0.5 * beta2SI * om * om * dz / 2;
        const cosP = Math.cos(phase), sinP = Math.sin(phase);
        fftR[i] = real[i] * cosP - imag[i] * sinP;
        fftI[i] = real[i] * sinP + imag[i] * cosP;
      }
      real.set(fftR);
      imag.set(fftI);

      // Full-step nonlinearity
      for (let i = 0; i < nT; i++) {
        const p = real[i] * real[i] + imag[i] * imag[i];
        const phase = gammaSI * p * dz;
        const cosP = Math.cos(phase), sinP = Math.sin(phase);
        const newR = real[i] * cosP - imag[i] * sinP;
        const newI = real[i] * sinP + imag[i] * cosP;
        real[i] = newR;
        imag[i] = newI;
      }

      // Half-step dispersion
      for (let i = 0; i < nT; i++) {
        const om = (i < nT / 2 ? i : i - nT) * 2 * Math.PI / (nT * dt);
        const phase = -0.5 * beta2SI * om * om * dz / 2;
        const cosP = Math.cos(phase), sinP = Math.sin(phase);
        const newR = real[i] * cosP - imag[i] * sinP;
        const newI = real[i] * sinP + imag[i] * cosP;
        real[i] = newR;
        imag[i] = newI;
      }
    }

    return [
      { x: zArr, y: peakArr, type: "scatter", mode: "lines", name: "Peak power", line: { color: "#60a5fa", width: 2 } },
      { x: zArr, y: widthArr, type: "scatter", mode: "lines", name: "Pulse width (w/w₀)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
    ];
  }, [pulseWidth, peakPower, beta2, gamma, distance, t0]);

  const plotLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Distance z (m)", gridcolor: "#374151" },
    yaxis: { title: "Peak Power (W)", gridcolor: "#374151" },
    yaxis2: { title: "Pulse width / w₀", overlaying: "y", side: "right", gridcolor: "transparent", titlefont: { color: "#f87171" }, tickfont: { color: "#f87171" } },
    margin: { t: 30, r: 70, b: 50, l: 70 },
    legend: { x: 0.01, y: 0.99, bgcolor: "transparent", font: { size: 11 } },
  };

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Soliton Propagation" description="Fundamental and higher-order soliton dynamics via split-step Fourier simulation.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">NLS:</span> i ∂A/∂z = (β₂/2) ∂²A/∂T² − γ|A|²A</p>
        <p><span className="text-blue-400">L<sub>D</sub></span> = T₀² / |β₂|</p>
        <p><span className="text-blue-400">L<sub>NL</sub></span> = 1 / (γ P₀)</p>
        <p><span className="text-blue-400">N</span> = √(L<sub>D</sub> / L<sub>NL</sub>) = √(γ P₀ T₀² / |β₂|)</p>
        <p className="text-yellow-400">N=1: fundamental soliton (shape-preserving)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pulse FWHM (fs)" value={pulseWidth} onChange={setPulseWidth} />
        <ValidatedNumberInput label="Peak Power (W)" value={peakPower} onChange={setPeakPower} />
        <ValidatedNumberInput label="β₂ (fs²/mm)" value={beta2} onChange={setBeta2} step="any" />
        <ValidatedNumberInput label="γ (W⁻¹km⁻¹)" value={gamma} onChange={setGamma} step="0.1" />
        <ValidatedNumberInput label="Propagation Distance (m)" value={distance} onChange={setDistance} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">T₀ (1/e half-width)</p>
          <p className="text-xl font-bold text-blue-400">{t0.toFixed(1)} fs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dispersion Length L<sub>D</sub></p>
          <p className="text-xl font-bold text-green-400">{LD.toFixed(2)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Soliton Peak Power P₀</p>
          <p className="text-xl font-bold text-orange-400">{P0.toFixed(1)} W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Soliton Order N</p>
          <p className={`text-xl font-bold ${N < 1.1 ? "text-green-400" : N < 2.1 ? "text-yellow-400" : "text-red-400"}`}>{N.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={plotLayout} />
      </div>
    </CalculatorShell>
  );
}
