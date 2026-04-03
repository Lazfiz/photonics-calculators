"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AdaptiveOpticsGainPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [cn2, setCn2] = useState(1e-15);
  const [range, setRange] = useState(1000); // m
  const [r0, setR0] = useState(0); // cm, 0 = auto-calculate
  const [numActuators, setNumActuators] = useState(64); // DM actuators across
  const [bandwidth, setBandwidth] = useState(100); // Hz, AO correction bandwidth
  const [windSpeed, setWindSpeed] = useState(5); // m/s
  const [strehlTarget, setStrehlTarget] = useState(0.8);

  // AO Strehl ratio: S = exp(-σ_φ²)
  // σ_φ² = σ_fitting² + σ_temporal² + σ_WFS²
  // σ_fitting² ≈ 1.03 (d/r0)^(5/3) where d = D/N_act
  // σ_temporal² ≈ (f_G / f_3dB)^(5/3) where f_G = V/r0 (Greenwood freq)
  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const k = 2 * Math.PI / lambda;
    const L = range;

    // Fried parameter (if not specified)
    const r0_calc = r0 > 0 ? r0 * 1e-2 : Math.pow(0.423 * k * k * cn2 * L, -3 / 5);
    const r0_cm = r0_calc * 100;

    // Greenwood frequency
    const fG = 0.43 * windSpeed / r0_calc; // Hz

    // Tyler frequency (for aniso-planatism)
    const fT = 0.31 * windSpeed / r0_calc;

    // Fitting error: subaperture size d = D_act / N_act (assume D_act = 4*r0 for full correction)
    const D_act = 4 * r0_calc;
    const d = D_act / numActuators;
    const sigmaFit2 = 0.28 * Math.pow(d / r0_calc, 5 / 3);

    // Temporal error (servo lag)
    const sigmaTime2 = Math.pow(fG / bandwidth, 5 / 3);

    // WFS noise (photon noise, assume bright guide beacon)
    const sigmaWFS2 = 0.01; // small for bright beacon

    // Total wavefront error variance
    const sigmaTotal = sigmaFit2 + sigmaTime2 + sigmaWFS2;

    // Strehl ratio (Maréchal approximation)
    const strehl = Math.exp(-sigmaTotal);

    // Required actuator count for target Strehl
    // S = exp(-0.28 * (D/(N*r0))^(5/3))
    // N_required = D / (r0 * (−ln(S)/0.28)^(3/5))
    const N_required = D_act / (r0_calc * Math.pow(-Math.log(strehlTarget) / 0.28, 3 / 5));

    // Required bandwidth
    const BW_required = fG / Math.pow(-Math.log(strehlTarget) * 0.5, 3 / 5);

    // Gain over uncorrected (open-loop strehl ≈ exp(-(D/r0)^(5/3)))
    const sigma_uncorrected = Math.pow(D_act / r0_calc, 5 / 3);
    const strehl_open = Math.exp(-sigma_uncorrected);
    const gainLinear = strehl / Math.max(strehl_open, 1e-20);
    const gainDB = 10 * Math.log10(Math.max(gainLinear, 1e-20));

    // Corrected beam quality factor M²
    const M2 = 1 / Math.sqrt(Math.max(strehl, 0.01));

    return {
      r0_cm, fG, fT, sigmaFit2, sigmaTime2, sigmaWFS2, sigmaTotal,
      strehl, N_required, BW_required, strehl_open, gainLinear, gainDB, M2,
    };
  }, [wavelength, cn2, range, r0, numActuators, bandwidth, windSpeed, strehlTarget]);

  const plotData = useMemo(() => {
    const actuators = Array.from({ length: 50 }, (_, i) => 4 + i * 2);
    const lambda = wavelength * 1e-9;
    const k = 2 * Math.PI / lambda;
    const r0_calc = r0 > 0 ? r0 * 1e-2 : Math.pow(0.423 * k * k * cn2 * range, -3 / 5);
    const D_act = 4 * r0_calc;
    const fG = 0.43 * windSpeed / r0_calc;

    const strehls = actuators.map((N) => {
      const d = D_act / N;
      const sF = 0.28 * Math.pow(d / r0_calc, 5 / 3);
      const sT = Math.pow(fG / bandwidth, 5 / 3);
      return Math.exp(-(sF + sT + 0.01));
    });

    return [{ x: actuators, y: strehls, type: "scatter", mode: "lines+markers", name: "Strehl", line: { color: "#06b6d4" } }];
  }, [wavelength, cn2, range, r0, bandwidth, windSpeed]);

  const plotData2 = useMemo(() => {
    const bws = Array.from({ length: 50 }, (_, i) => 10 + i * 20);
    const lambda = wavelength * 1e-9;
    const k = 2 * Math.PI / lambda;
    const r0_calc = r0 > 0 ? r0 * 1e-2 : Math.pow(0.423 * k * k * cn2 * range, -3 / 5);
    const fG = 0.43 * windSpeed / r0_calc;
    const D_act = 4 * r0_calc;
    const d = D_act / numActuators;
    const sF = 0.28 * Math.pow(d / r0_calc, 5 / 3);

    const strehls = bws.map((bw) => {
      const sT = Math.pow(fG / bw, 5 / 3);
      return Math.exp(-(sF + sT + 0.01));
    });

    return [{ x: bws, y: strehls, type: "scatter", mode: "lines", name: "Strehl", line: { color: "#f97316" } }];
  }, [wavelength, cn2, range, r0, numActuators, windSpeed]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      <Link href="/free-space-comms" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">← Back to Free-Space Comms</Link>
      <h1 className="text-3xl font-bold mb-6">Adaptive Optics Gain Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Wavelength (nm)", wavelength, setWavelength],
            ["C_n² (m⁻²ᐟ³)", cn2, setCn2, 1e-15],
            ["Range (m)", range, setRange],
            ["r₀ (cm, 0=auto)", r0, setR0],
            ["Num Actuators", numActuators, setNumActuators],
            ["AO Bandwidth (Hz)", bandwidth, setBandwidth],
            ["Wind Speed (m/s)", windSpeed, setWindSpeed],
            ["Target Strehl", strehlTarget, setStrehlTarget, 0.01],
          ].map(([label, val, set, step]) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} step={step as number | undefined}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Fried Parameter r₀</span><span>{calc.r0_cm.toFixed(2)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Greenwood Freq f_G</span><span>{calc.fG.toFixed(1)} Hz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Tyler Freq f_T</span><span>{calc.fT.toFixed(1)} Hz</span></div>
              <div className="flex justify-between"><span className="text-gray-400">σ² fitting</span><span>{calc.sigmaFit2.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">σ² temporal</span><span>{calc.sigmaTime2.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">σ² total</span><span>{calc.sigmaTotal.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Strehl Ratio</span>
                <span className={calc.strehl > 0.8 ? "text-green-400" : calc.strehl > 0.5 ? "text-yellow-400" : "text-red-400"} className="font-bold">{calc.strehl.toFixed(4)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Open-loop Strehl</span><span>{calc.strehl_open.toExponential(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">AO Gain</span><span className="text-green-400 font-bold">{calc.gainDB.toFixed(1)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">M² (corrected)</span><span>{calc.M2.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">N_act for target</span><span>{Math.ceil(calc.N_required)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">BW for target</span><span>{calc.BW_required.toFixed(0)} Hz</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Strehl vs Actuators</h3>
            <Plot data={plotData} layout={{
              xaxis: { title: "Actuators", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Strehl", color: "#9ca3af", gridcolor: "#374151", range: [0, 1] },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} config={{ displayModeBar: false }} style={{ width: "100%", height: 250 }} />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Strehl vs Bandwidth</h3>
            <Plot data={plotData2} layout={{
              xaxis: { title: "Bandwidth (Hz)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Strehl", color: "#9ca3af", gridcolor: "#374151", range: [0, 1] },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} config={{ displayModeBar: false }} style={{ width: "100%", height: 250 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
