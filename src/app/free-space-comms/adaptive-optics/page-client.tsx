"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
export default function AdaptiveOpticsPage() {
  const [c2n, setC2n] = useURLState("c2n", 1e-14);
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [range, setRange] = useURLState("range", 1);
  const [diameter, setDiameter] = useURLState("diameter", 10);
  const [aoActuators, setAoActuators] = useURLState("aoActuators", 127);
  const [aoBandwidth, setAoBandwidth] = useURLState("aoBandwidth", 500);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const Cn2 = c2n;
    // Fried parameter (coherence length)
    const r0 = Math.pow(0.423 * Math.pow(2 * Math.PI / lambda, 2) * Cn2 * range * 1e3, -3 / 5) * 1e2; // in cm
    // Greenwood frequency
    const V = 10; // average wind speed m/s
    const fG = 0.43 * V / r0 * 1e-2; // Hz (r0 in m)
    // Strehl ratio without AO
    const strehlNoAO = 1 / (1 + (diameter * 1e-2 / (r0 * 1e-2)) ** 2);
    // AO corrected Strehl (Maréchal approximation)
    const nModes = Math.sqrt(aoActuators) - 1; // number of corrected Zernike modes
    const residualPhase = 0.2944 * Math.pow(nModes, -Math.sqrt(3) / 2); // Noll residual
    const bandwidthFactor = 1 / (1 + Math.pow(fG / aoBandwidth, 5 / 3));
    const strehlAO = Math.exp(-residualPhase * bandwidthFactor * Math.pow(diameter * 1e-2 / (r0 * 1e-2), 5 / 3));
    // Improvement factor
    const improvement = strehlAO / strehlNoAO;
    // Isoplanatic angle
    const theta0 = Math.pow(2.91 * Math.pow(2 * Math.PI / lambda, 2) * Cn2 * range * 1e3, -3 / 5) * 1e3 * 1e6; // μrad
    return { r0, fG, strehlNoAO, strehlAO, improvement, theta0, nModes };
  }, [c2n, wavelength, range, diameter, aoActuators, aoBandwidth]);

  const plotData = useMemo(() => {
    const Cn2s = Array.from({ length: 200 }, (_, i) => 1e-17 + i * 1e-16);
    const lambda = wavelength * 1e-9;
    const r0s = Cn2s.map((cn2) => Math.pow(0.423 * Math.pow(2 * Math.PI / lambda, 2) * cn2 * range * 1e3, -3 / 5) * 1e2);
    return [
      { x: Cn2s, y: r0s, type: "scatter", mode: "lines", name: "r₀", line: { color: "#06b6d4" } },
      { x: Cn2s, y: r0s.map(() => diameter), type: "scatter", mode: "lines", name: "Aperture", line: { color: "#f43f5e", dash: "dash" } },
    ];
  }, [wavelength, range, diameter]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm">
                <p className="text-cyan-300 mt-1 font-mono">r₀ = [0.423·(2π/λ)²·Cn²·L]^(-3/5)</p>
        <p className="text-cyan-300 font-mono">f_G = 0.43·V/r₀ &nbsp; (Greenwood frequency)</p>
        <p className="text-gray-500 mt-1">Strehl ratio ≈ exp(−σ²_φ) after AO correction</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Cn² (m^(-2/3))", c2n, setC2n],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["Range (km)", range, setRange],
            ["Aperture Diameter (cm)", diameter, setDiameter],
            ["AO Actuators", aoActuators, setAoActuators],
            ["AO Bandwidth (Hz)", aoBandwidth, setAoBandwidth],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Fried Parameter r₀</span><span>{calc.r0.toFixed(1)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Greenwood Freq f_G</span><span>{calc.fG.toFixed(0)} Hz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Isoplanatic Angle θ₀</span><span>{calc.theta0.toFixed(1)} μrad</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Strehl (no AO)</span><span className="text-red-400">{calc.strehlNoAO.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Strehl (with AO)</span><span className="text-green-400">{calc.strehlAO.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">AO Improvement</span><span className="text-yellow-400">{calc.improvement.toFixed(1)}×</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Cn² (m⁻²/³)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
              yaxis: { title: "Length (cm)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 50, l: 60 }, font: { color: "#9ca3af" }, legend: { x: 0.02, y: 0.98 },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
