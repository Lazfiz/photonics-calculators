"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";


export default function MultiplePulsePage() {
  const [wavelength, setWavelength] = useState(532);
  const [pulseEnergy, setPulseEnergy] = useState(0.1); // µJ
  const [pulseWidth, setPulseWidth] = useState(10); // ns
  const [prf, setPrf] = useState(10000); // Hz
  const [numPulses, setNumPulses] = useState(1000);

  // Multiple pulse rules (ANSI Z136.1 §8):
  // 1. Single pulse MPE: H(τ) where τ = pulse width
  // 2. Average power MPE: H(T) / T × τ where T = total exposure time
  // 3. Repetitive pulse MPE: H(τ) × Cₚ where Cₚ = N^(-1/4)
  // 4. The MOST RESTRICTIVE of these three must be used
  //
  // Additional: thermal accumulation if pulse spacing < thermal relaxation time
  // T_thermal ≈ 1-10 µs for retinal, 1-100 ms for skin/corneal

  const mpeSingle = (wl: number, tau_s: number): number => {
    // MPE for single pulse of duration tau (seconds), J/cm²
    const lam = wl / 1000;
    if (lam >= 0.4 && lam < 0.7) {
      if (tau_s < 18e-6) return 5e-7; // 0.5 µJ/cm²
      if (tau_s < 0.7) return 1.8e-3 * Math.pow(tau_s, 0.75);
      return 1e-3 * Math.pow(tau_s, 0.75);
    }
    if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      const tEff = tau_s < 18e-6 ? 18e-6 : Math.min(tau_s, 0.7);
      return 1.8e-3 * CA * Math.pow(tEff, 0.75);
    }
    return 1e-3 * Math.pow(tau_s, 0.75);
  };

  const results = useMemo(() => {
    const tau = pulseWidth * 1e-9; // s
    const T_total = numPulses / prf; // total exposure time
    const N = numPulses;

    // 1. Single pulse MPE
    const mpe1 = mpeSingle(wavelength, tau); // J/cm²
    const mpe1_uJ = mpe1 * 1e6; // µJ/cm²

    // 2. Average power MPE (total exposure)
    const mpeTotal = mpeSingle(wavelength, T_total); // J/cm² for total time
    const mpeAvg_uJ = (mpeTotal / numPulses) * 1e6; // µJ/cm² per pulse equivalent

    // 3. Repetitive pulse MPE with Cp
    const Cp = Math.pow(N, -0.25);
    const mpeRep = mpe1 * Cp; // J/cm²
    const mpeRep_uJ = mpeRep * 1e6;

    // Most restrictive
    const mpeFinal = Math.min(mpe1, mpeRep, mpeTotal / numPulses);
    const mpeFinal_uJ = mpeFinal * 1e6;

    // Thermal relaxation check
    const pulseSpacing = 1 / prf; // s
    const thermalRelaxation = 1e-6; // ~1µs for retinal
    const thermalAccumulation = pulseSpacing < thermalRelaxation;

    // Safety check
    const pulseEnergy_J = pulseEnergy * 1e-6; // J/cm² (assuming 1cm² area)
    const margin = mpeFinal / pulseEnergy_J;

    return {
      mpe1_uJ, mpeAvg_uJ, mpeRep_uJ, mpeFinal_uJ,
      Cp, T_total: T_total * 1000,
      thermalAccumulation,
      margin,
      isSafe: margin >= 1,
      governingRule: mpeFinal === mpe1 ? "Single Pulse" :
                    mpeFinal === mpeRep ? "Repetitive (Cₚ)" : "Average Power",
    };
  }, [wavelength, pulseEnergy, pulseWidth, prf, numPulses]);

  const chartData = useMemo(() => {
    const Ns = Array.from({ length: 200 }, (_, i) => 1 + i * 50);
    const mpe1 = mpeSingle(wavelength, pulseWidth * 1e-9) * 1e6;

    const repVals = Ns.map(N => mpe1 * Math.pow(N, -0.25));
    const avgVals = Ns.map(N => mpeSingle(wavelength, N / prf) * 1e6 / N);
    const singleVals = Ns.map(() => mpe1);

    return [
      { x: Ns, y: singleVals, type: "scatter" as const, mode: "lines" as const, name: "Single Pulse MPE", line: { color: "#4ade80", dash: "dash" } },
      { x: Ns, y: repVals, type: "scatter" as const, mode: "lines" as const, name: "Repetitive MPE (Cₚ)", line: { color: "#60a5fa" } },
      { x: Ns, y: avgVals, type: "scatter" as const, mode: "lines" as const, name: "Average Power MPE", line: { color: "#f87171" } },
    ];
  }, [wavelength, pulseWidth, prf]);

  const layout = {
    paper_bgcolor: "#030712",
    plot_bgcolor: "#030712",
    font: { color: "#9ca3af" },
    xaxis: { title: "Number of Pulses (N)", gridcolor: "#1f2937", color: "#9ca3af", type: "log" as const },
    yaxis: { title: "MPE per Pulse (µJ/cm²)", gridcolor: "#1f2937", color: "#9ca3af", type: "log" as const },
    margin: { t: 30, b: 50, l: 70, r: 20 },
    legend: { font: { color: "#d1d5db" } },
  };

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Multiple Pulse Correction" description="Evaluates all three ANSI Z136.1 rules for repetitive pulse exposure and selects the most restrictive MPE.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Pulse Energy (µJ)</label>
          <input type="number" step="0.01" value={pulseEnergy} onChange={e => setPulseEnergy(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Pulse Width (ns)</label>
          <input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">PRF (Hz)</label>
          <input type="number" value={prf} onChange={e => setPrf(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Number of Pulses</label>
          <input type="number" value={numPulses} onChange={e => setNumPulses(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Single Pulse MPE</div>
          <div className="text-xl font-bold text-green-400">{results.mpe1_uJ.toExponential(2)}</div>
          <div className="text-xs text-gray-500">µJ/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Repetitive MPE (Cₚ)</div>
          <div className="text-xl font-bold text-blue-400">{results.mpeRep_uJ.toExponential(2)}</div>
          <div className="text-xs text-gray-500">µJ/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Avg Power MPE</div>
          <div className="text-xl font-bold text-red-400">{results.mpeAvg_uJ.toExponential(2)}</div>
          <div className="text-xs text-gray-500">µJ/cm²/pulse</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center border border-yellow-600">
          <div className="text-xs text-yellow-400">Governing Rule</div>
          <div className="text-lg font-bold text-yellow-300">{results.governingRule}</div>
          <div className="text-xs text-gray-500">MPE: {results.mpeFinal_uJ.toExponential(2)} µJ/cm²</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">C<sub>p</sub> Factor</div>
          <div className="text-2xl font-bold text-purple-400">{results.Cp.toFixed(4)}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Total Exposure</div>
          <div className="text-2xl font-bold text-gray-300">{results.T_total.toFixed(1)}</div>
          <div className="text-xs text-gray-500">ms</div>
        </div>
        <div className={`bg-gray-900 rounded-lg p-4 text-center ${results.isSafe ? "border border-green-600" : "border border-red-600"}`}>
          <div className="text-xs text-gray-400">Safety Margin</div>
          <div className={`text-2xl font-bold ${results.isSafe ? "text-green-400" : "text-red-400"}`}>{results.margin.toFixed(1)}×</div>
        </div>
      </div>

      {results.thermalAccumulation && (
        <div className="bg-red-950 border border-red-700 rounded-lg p-4 mb-6 text-sm text-red-300">
          ⚠ Thermal accumulation likely: pulse spacing ({(1/prf*1e6).toFixed(1)} µs) &lt; thermal relaxation time (~1 µs). Thermal effects may compound.
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <p className="text-gray-500 mb-1">Key Formulas (most restrictive governs):</p>
        <p>Rule 1: MPE<sub>single</sub> = H(τ) — single pulse MPE at pulse width τ</p>
        <p>Rule 2: MPE<sub>avg</sub> = H(T<sub>total</sub>) / N — average power limit</p>
        <p>Rule 3: MPE<sub>rep</sub> = H(τ) × N<sup>-1/4</sup> — repetitive pulse with C<sub>p</sub></p>
        <p className="text-yellow-400 mt-2">⚠ For pulse groups: apply to groups within T<sub>p</sub> if inter-group spacing &gt; T<sub>p</sub></p>
      </div>

      <ChartPanel data={chartData} layout={layout} className="w-full h-[400px]" />
    </CalculatorShell>
  );
}
