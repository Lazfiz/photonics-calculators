"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function DiversityReceptionPage() {
  const [numRx, setNumRx] = useState(2);
  const erf = (x: number) => {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * ax);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-ax * ax);
    return sign * y;
  };
  const [separation, setSeparation] = useState(10);
  const [c2n, setC2n] = useState(1e-14);
  const [wavelength, setWavelength] = useState(1550);
  const [range, setRange] = useState(1);
  const [combineMethod, setCombineMethod] = useState<"sc" | "egc" | "mrc">("mrc");

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const Cn2 = c2n;
    // Fried parameter
    const r0 = Math.pow(0.423 * Math.pow(2 * Math.PI / lambda, 2) * Cn2 * range * 1e3, -3 / 5);
    // Spatial coherence radius at receiver
    const rho0 = r0;
    // Correlation between receivers
    const rhoCorr = Math.exp(-Math.pow(separation / rho0, 5 / 3));
    // Scintillation index (Rytov variance)
    const sigmaR2 = 1.23 * Math.pow(2 * Math.PI / lambda, 7 / 6) * Math.pow(Cn2, 1) * Math.pow(range * 1e3, 11 / 6);
    // Diversity gain
    let diversityGain: number;
    let combinedSigma2: number;
    if (combineMethod === "sc") {
      // Selection combining: ~N * (1-rho) improvement
      diversityGain = 10 * Math.log10(numRx * (1 - rhoCorr) + rhoCorr);
      combinedSigma2 = sigmaR2 / numRx;
    } else if (combineMethod === "egc") {
      // Equal gain combining
      diversityGain = 10 * Math.log10(numRx * (1 - rhoCorr) + rhoCorr) + 3 * Math.log10(numRx);
      combinedSigma2 = sigmaR2 / (numRx * (1 - rhoCorr) + rhoCorr);
    } else {
      // Maximal ratio combining
      diversityGain = 10 * Math.log10(numRx) * (1 - rhoCorr * 0.5);
      combinedSigma2 = sigmaR2 / (numRx * numRx * (1 - rhoCorr) + rhoCorr);
    }
    // Outage probability (simplified log-normal model)
    const threshold = 3; // fade margin in sigma
    const outage = 0.5 * (1 + erf(-threshold / Math.sqrt(2 * combinedSigma2)));
    return { r0, rhoCorr, sigmaR2, diversityGain, combinedSigma2, outage };
  }, [numRx, separation, c2n, wavelength, range, combineMethod]);

  const plotData = useMemo(() => {
    const seps = Array.from({ length: 200 }, (_, i) => 0.5 + i * 0.25);
    const lambda = wavelength * 1e-9;
    const r0 = Math.pow(0.423 * Math.pow(2 * Math.PI / lambda, 2) * c2n * range * 1e3, -3 / 5);
    const methods = ["sc", "egc", "mrc"] as const;
    const colors = ["#06b6d4", "#a78bfa", "#22c55e"];
    return methods.map((m, idx) => ({
      x: seps, y: seps.map((s) => {
        const rho = Math.exp(-Math.pow(s / r0, 5 / 3));
        if (m === "sc") return 10 * Math.log10(numRx * (1 - rho) + rho);
        if (m === "egc") return 10 * Math.log10(numRx * (1 - rho) + rho) + 3 * Math.log10(numRx);
        return 10 * Math.log10(numRx) * (1 - rho * 0.5);
      }),
      type: "scatter" as const, mode: "lines", name: m.toUpperCase(), line: { color: colors[idx] },
    }));
  }, [numRx, c2n, wavelength, range]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm">
                <p className="text-cyan-300 mt-1 font-mono">ρ = exp(−(d/r₀)^(5/3)) &nbsp; (inter-receiver correlation)</p>
        <p className="text-gray-500 mt-1">Optimal separation ≈ r₀ for decorrelated channels. Combine via SC/EGC/MRC.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Number of Receivers", numRx, setNumRx],
            ["RX Separation (cm)", separation, setSeparation],
            ["Cn² (m^(-2/3))", c2n, setC2n],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["Range (km)", range, setRange],
          ].map(([label, val, set]) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Combining Method</label>
            <select value={combineMethod} onChange={(e) => setCombineMethod(e.target.value as "sc" | "egc" | "mrc")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
              <option value="sc">Selection Combining (SC)</option>
              <option value="egc">Equal Gain Combining (EGC)</option>
              <option value="mrc">Maximal Ratio Combining (MRC)</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Fried Parameter r₀</span><span>{(calc.r0 * 100).toFixed(1)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Inter-RX Correlation ρ</span><span>{calc.rhoCorr.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Rytov Variance σ²_R</span><span>{calc.sigmaR2.toFixed(3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Diversity Gain</span><span className="text-green-400">{calc.diversityGain.toFixed(1)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Combined Scintillation</span><span>{calc.combinedSigma2.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Outage Probability</span><span className="text-yellow-400">{(calc.outage * 100).toFixed(2)}%</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Separation (cm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Diversity Gain (dB)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" }, legend: { x: 0.02, y: 0.98 },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
