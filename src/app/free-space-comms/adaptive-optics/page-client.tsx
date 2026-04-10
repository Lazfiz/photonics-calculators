"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function AdaptiveOpticsPage() {
  const [c2n, setC2n] = useURLState("c2n", 1e-14);
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [range, setRange] = useURLState("range", 1);
  const [diameter, setDiameter] = useURLState("diameter", 10);
  const [aoActuators, setAoActuators] = useURLState("aoActuators", 127);
  const [aoBandwidth, setAoBandwidth] = useURLState("aoBandwidth", 500);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9; // m
    const Cn2 = c2n;
    const L = range * 1e3; // km → m
    const k = 2 * Math.PI / lambda; // wavenumber
    const D = diameter * 1e-2; // cm → m

    // Fried parameter (coherence length)
    const r0_m = Math.pow(0.423 * k * k * Cn2 * L, -3 / 5); // meters
    const r0 = r0_m * 100; // cm

    // Greenwood frequency
    const V = 10; // average wind speed m/s
    const fG = 0.43 * V / r0_m; // Hz

    // Strehl ratio without AO (long exposure, Kolmogorov)
    const strehlNoAO = Math.exp(-1.03 * Math.pow(D / r0_m, 5 / 3));

    // AO corrected Strehl (Maréchal approximation)
    // Number of corrected Zernike modes ≈ number of actuators
    const nModes = aoActuators;
    // Noll fitting error
    const sigma2_fit = 0.2944 * Math.pow(nModes, -Math.sqrt(3) / 2) * Math.pow(D / r0_m, 5 / 3);
    // Bandwidth (temporal) error
    const sigma2_bw = 0.3 * Math.pow(fG / aoBandwidth, 5 / 3) * Math.pow(D / r0_m, 5 / 3);
    const sigma2_total = sigma2_fit + sigma2_bw;
    const strehlAO = Math.exp(-sigma2_total);

    // Improvement factor
    const improvement = strehlAO / strehlNoAO;

    // Isoplanatic angle (uniform turbulence path)
    // θ₀ = [2.91·k²·Cn²·∫₀ᴸ z^(5/3) dz]^(-3/5)
    // ∫₀ᴸ z^(5/3) dz = 3L^(8/3)/8
    const integral = 3 * Math.pow(L, 8 / 3) / 8;
    const theta0_rad = Math.pow(2.91 * k * k * Cn2 * integral, -3 / 5);
    const theta0 = theta0_rad * 1e6; // rad → μrad

    return { r0, fG, strehlNoAO, strehlAO, improvement, theta0, nModes };
  }, [c2n, wavelength, range, diameter, aoActuators, aoBandwidth]);

  const plotData = useMemo(() => {
    const Cn2s = Array.from({ length: 200 }, (_, i) => 1e-17 + i * 1e-16);
    const lambda = wavelength * 1e-9;
    const k = 2 * Math.PI / lambda;
    const L = range * 1e3;
    const r0s = Cn2s.map((cn2) => Math.pow(0.423 * k * k * cn2 * L, -3 / 5) * 100); // cm
    return [
      { x: Cn2s, y: r0s, type: "scatter", mode: "lines", name: "r₀", line: { color: "#06b6d4" } },
      { x: Cn2s, y: r0s.map(() => diameter), type: "scatter", mode: "lines", name: "Aperture", line: { color: "#f43f5e", dash: "dash" } },
    ];
  }, [wavelength, range, diameter]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm">
                <p className="text-cyan-300 mt-1 font-mono">r₀ = [0.423·k²·Cn²·L]^(-3/5)</p>
        <p className="text-cyan-300 font-mono">f_G = 0.43·V/r₀ &nbsp; (Greenwood frequency)</p>
        <p className="text-cyan-300 font-mono">S = exp(−1.03·(D/r₀)^(5/3)) &nbsp; (no AO)</p>
        <p className="text-gray-500 mt-1">S_AO ≈ exp(−σ²_fit − σ²_bw) where σ² follows Noll + Tyler</p>
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
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
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
