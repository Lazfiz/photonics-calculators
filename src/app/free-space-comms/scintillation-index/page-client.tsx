"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ScintillationIndexPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [cn2, setCn2] = useURLState("cn2", 1e-15);
  const [range, setRange] = useURLState("range", 1000); // m
  const [waveType, setWaveType] = useState<"plane" | "sphere">("plane");

  // Scintillation index (normalized variance of irradiance)
  // Weak turbulence: σ_I² = σ_R² = 1.23 C_n² k^(7/6) L^(11/6) [plane wave]
  // Strong turbulence: extended Rytov theory
  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const k = 2 * Math.PI / lambda;
    const L = range;
    const isPlane = waveType === "plane";

    // Rytov variance (Andrews & Phillips)
    const sigmaR2 = isPlane
      ? 1.23 * cn2 * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6)
      : 0.496 * cn2 * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6);

    // Fried parameter
    const r0 = Math.pow(0.423 * Math.pow(k, 2) * cn2 * L, -3 / 5) * 1e2; // cm

    // Atmospheric coherence length
    const rho0 = Math.pow(1.46 * Math.pow(cn2, 1) * Math.pow(k, 2) * L, -3 / 5); // m

    // Regime classification
    const regime = sigmaR2 < 0.3 ? "Weak" : sigmaR2 < 5 ? "Moderate" : "Strong";

    // Extended models for strong turbulence ( Andrews & Phillips )
    // Effective scintillation index accounting for strong fluctuations
    let sigmaI2: number;
    if (sigmaR2 <= 1) {
      sigmaI2 = sigmaR2; // Weak regime: σ_I² ≈ σ_R²
    } else {
      // Saturation regime approximation
      sigmaI2 = 1 + 1.86 * Math.pow(sigmaR2, -1 / 6);
    }

    // Log-amplitude variance
    const sigmaChi2 = Math.min(sigmaR2, 0.5); // saturates

    // Coherence time
    const V_transverse = 5; // m/s typical wind
    const tau0 = rho0 / V_transverse * 1000; // ms

    return { sigmaR2, sigmaI2, regime, r0, rho0: rho0 * 100, tau0, sigmaChi2 };
  }, [wavelength, cn2, range, waveType]);

  const plotData = useMemo(() => {
    const ranges = Array.from({ length: 150 }, (_, i) => 100 + i * 100); // 100m - 15km
    const lambda = wavelength * 1e-9;
    const k = 2 * Math.PI / lambda;
    const isPlane = waveType === "plane";
    const coeff = isPlane ? 1.23 : 0.496;

    const weak = ranges.map((L) => coeff * cn2 * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6));
    const strong = weak.map((sr) => sr <= 1 ? sr : 1 + 1.86 * Math.pow(sr, -1 / 6));

    return [
      { x: ranges.map((r) => r / 1000), y: weak, type: "scatter", mode: "lines", name: "Weak (σ_R²)", line: { color: "#06b6d4", dash: "dash" } },
      { x: ranges.map((r) => r / 1000), y: strong, type: "scatter", mode: "lines", name: "Effective σ_I²", line: { color: "#f97316" } },
    ];
  }, [wavelength, cn2, waveType]);

  const plotData2 = useMemo(() => {
    const cn2vals = Array.from({ length: 100 }, (_, i) => Math.pow(10, -17 + i * 0.04));
    const lambda = wavelength * 1e-9;
    const k = 2 * Math.PI / lambda;
    const isPlane = waveType === "plane";
    const coeff = isPlane ? 1.23 : 0.496;
    const L = range;

    const vals = cn2vals.map((c) => {
      const sr = coeff * c * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6);
      return sr <= 1 ? sr : 1 + 1.86 * Math.pow(sr, -1 / 6);
    });

    return [{ x: cn2vals.map((c) => c.toExponential(1)), y: vals, type: "scatter", mode: "lines", name: "σ_I²", line: { color: "#a855f7" } }];
  }, [wavelength, cn2, range, waveType]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Wavelength (nm)", wavelength, setWavelength],
            ["C_n² (m⁻²ᐟ³)", cn2, setCn2, 1e-15],
            ["Range (m)", range, setRange],
          ].map(([label, val, set, step]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
            </div>
          ))}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wave Type</label>
            <select value={waveType} onChange={(e) => setWaveType(e.target.value as "plane" | "sphere")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
              <option value="plane">Plane Wave (collimated)</option>
              <option value="sphere">Spherical Wave (diverging)</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Regime</span>
                <span className={calc.regime === "Weak" ? "text-green-400" : calc.regime === "Moderate" ? "text-yellow-400" : "text-red-400"}>{calc.regime}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Rytov Variance σ_R²</span><span>{calc.sigmaR2.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Scintillation Index σ_I²</span><span className="text-orange-400 font-bold">{calc.sigmaI2.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Log-amplitude σ_χ²</span><span>{calc.sigmaChi2.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Fried Parameter r₀</span><span>{calc.r0.toFixed(2)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Coherence Length ρ₀</span><span>{calc.rho0.toFixed(2)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Coherence Time τ₀</span><span>{calc.tau0.toFixed(1)} ms</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">σ_I² vs Range</h3>
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Range (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Scintillation Index", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
