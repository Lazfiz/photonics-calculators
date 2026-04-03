"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SputteringDepositionPage() {
  const [targetMaterial, setTargetMaterial] = useState("SiO2");
  const [power, setPower] = useState(300);
  const [pressure, setPressure] = useState(3e-3);
  const [targetSubstrateDist, setTargetSubstrateDist] = useState(10);
  const [substrateTemp, setSubstrateTemp] = useState(200);
  const [gasType, setGasType] = useState("Ar");

  const targets: Record<string, { M1: number; M2: number; density: number; Us: number; name: string; n: number }> = {
    SiO2: { M1: 28, M2: 32, density: 2.2, Us: 4.7, name: "SiO₂", n: 1.46 },
    TiO2: { M1: 48, M2: 16, density: 4.23, Us: 4.9, name: "TiO₂", n: 2.35 },
    Ta2O5: { M1: 181, M2: 16, density: 8.2, Us: 5.2, name: "Ta₂O₅", n: 2.10 },
    Al2O3: { M1: 27, M2: 16, density: 3.95, Us: 4.8, name: "Al₂O₃", n: 1.63 },
    HfO2: { M1: 178.5, M2: 16, density: 9.68, Us: 5.3, name: "HfO₂", n: 2.05 },
    ZrO2: { M1: 91.2, M2: 16, density: 5.68, Us: 5.0, name: "ZrO₂", n: 2.10 },
    Nb2O5: { M1: 93, M2: 16, density: 4.6, Us: 5.1, name: "Nb₂O₅", n: 2.30 },
    MgF2: { M1: 24.3, M2: 19, density: 3.15, Us: 4.5, name: "MgF₂", n: 1.38 },
    Si3N4: { M1: 28, M2: 14, density: 3.17, Us: 5.0, name: "Si₃N₄", n: 2.00 },
  };

  const gasMasses: Record<string, number> = { Ar: 39.95, Kr: 83.8, Xe: 131.3, Ne: 20.18 };

  const target = targets[targetMaterial];
  const M_gas = gasMasses[gasType] || 39.95;

  const results = useMemo(() => {
    const P = power;
    const p_Pa = pressure * 133.322;
    const d = targetSubstrateDist * 1e-2;
    const T = (substrateTemp + 273.15);
    const M_avg = (target.M1 + 2 * target.M2) / 3;

    // Sputter yield (Yamamura model simplified)
    const gamma = 0.042 * M_gas * target.Us / ((M_gas + M_avg) * 10);
    const E_ion = 500; // typical self-bias voltage for RF sputtering
    const Eth = target.Us * 4;
    const Y = gamma * Math.sqrt(Math.max(E_ion - Eth, 0)) * Math.max(E_ion - Eth, 0) / 1000;
    const sputterYield = Math.max(Y, 0.01);

    // Deposition rate
    const J_ion = P / E_ion; // A (ion current)
    const atomFlux = J_ion * sputterYield / 1.6e-19;
    const depRate = (atomFlux * M_avg * 1.673e-27) / (target.density * 1e3 * 0.01) * 1e9; // nm/s
    const depRateAngstrom = depRate * 10;

    // Kinetic energy of sputtered atoms
    const E_sputtered = 3 * target.Us / 2;

    // Mean free path
    const mfp = 0.005 / pressure; // m
    const mfpCm = mfp * 100;

    // Thermalization probability
    const thermalizationProb = Math.max(0, 1 - Math.exp(-d / mfp));

    // Film stress estimate
    const stress = 200 * Math.sqrt(P / 300) * (1 + 0.5 * (1 - thermalizationProb));

    // Film density estimate
    const filmDensity = target.density * (0.85 + 0.1 * Math.min(thermalizationProb + 0.5, 1));

    // Energy per arriving atom
    const energyPerAtom = E_sputtered * (1 - thermalizationProb) + 0.5 * T / 300 * thermalizationProb;

    return { sputterYield, depRate, depRateAngstrom, E_sputtered, mfpCm, thermalizationProb, stress, filmDensity, energyPerAtom, E_ion };
  }, [targetMaterial, power, pressure, targetSubstrateDist, substrateTemp, gasType]);

  const sweepData = useMemo(() => {
    const powers = Array.from({ length: 80 }, (_, i) => 50 + i * 950 / 80);
    const rates = powers.map(P => {
      const E_ion = 500;
      const gamma = 0.042 * M_gas * target.Us / ((M_gas + (target.M1 + 2 * target.M2) / 3) * 10);
      const Eth = target.Us * 4;
      const Y = Math.max(gamma * Math.sqrt(Math.max(E_ion - Eth, 0)) * Math.max(E_ion - Eth, 0) / 1000, 0.01);
      const J_ion = P / E_ion;
      const atomFlux = J_ion * Y / 1.6e-19;
      return (atomFlux * (target.M1 + 2 * target.M2) / 3 * 1.673e-27) / (target.density * 1e3 * 0.01) * 1e9;
    });
    const stresses = powers.map(P => 200 * Math.sqrt(P / 300) * 1.5);
    return [
      { x: powers, y: rates, type: "scatter" as const, mode: "lines" as const, name: "Dep Rate (nm/s)", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: powers, y: stresses, type: "scatter" as const, mode: "lines" as const, name: "Stress (MPa)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [targetMaterial, gasType]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Sputtering Deposition</h1>
      <p className="text-gray-400 mb-8">Calculate sputter yield, deposition rate, thermalization, and film stress for magnetron sputtering processes.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Target Material</span>
          <select value={targetMaterial} onChange={e => setTargetMaterial(e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(targets).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select></label>
        <label className="block"><span className="text-gray-300 text-sm">Sputter Gas</span>
          <select value={gasType} onChange={e => setGasType(e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(gasMasses).map(([k]) => <option key={k} value={k}>{k}</option>)}
          </select></label>
        <label className="block"><span className="text-gray-300 text-sm">Power (W)</span>
          <input type="number" value={power} onChange={e => setPower(+e.target.value)} step="10" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Pressure (Torr)</span>
          <input type="number" value={pressure} onChange={e => setPressure(+e.target.value)} step="1e-4" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Target-Substrate Distance (cm)</span>
          <input type="number" value={targetSubstrateDist} onChange={e => setTargetSubstrateDist(+e.target.value)} step="0.5" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Substrate Temp (°C)</span>
          <input type="number" value={substrateTemp} onChange={e => setSubstrateTemp(+e.target.value)} step="10" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Sputter Yield Y: <span className="text-blue-400 font-mono">{results.sputterYield.toFixed(3)} atoms/ion</span></p>
        <p className="text-gray-300">Deposition Rate: <span className="text-blue-400 font-mono">{results.depRate.toFixed(3)} nm/s ({results.depRateAngstrom.toFixed(1)} Å/s)</span></p>
        <p className="text-gray-300">Sputtered Atom Energy: <span className="text-blue-400 font-mono">{results.E_sputtered.toFixed(1)} eV</span></p>
        <p className="text-gray-300">Ion Energy (est.): <span className="text-blue-400 font-mono">{results.E_ion} eV</span></p>
        <p className="text-gray-300">Mean Free Path: <span className="text-blue-400 font-mono">{results.mfpCm.toFixed(1)} cm</span></p>
        <p className="text-gray-300">Thermalization Prob.: <span className="text-blue-400 font-mono">{(results.thermalizationProb * 100).toFixed(1)}%</span></p>
        <p className="text-gray-300">Film Stress (est.): <span className="text-blue-400 font-mono">{results.stress.toFixed(1)} MPa</span></p>
        <p className="text-gray-300">Film Density (est.): <span className="text-blue-400 font-mono">{results.filmDensity.toFixed(2)} g/cm³</span></p>
        <p className="text-gray-300">Energy/Atom at Substrate: <span className="text-blue-400 font-mono">{results.energyPerAtom.toFixed(2)} eV</span></p>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>Y = γ·√(E<sub>ion</sub> − E<sub>th</sub>)·(E<sub>ion</sub> − E<sub>th</sub>) (sputter yield, simplified Yamamura)</p>
        <p>E<sub>th</sub> ≈ 4·U<sub>s</sub> (sputtering threshold energy)</p>
        <p>R<sub>dep</sub> = (J<sub>ion</sub>·Y·M) / (ρ·A·N<sub>A</sub>) (deposition rate)</p>
        <p>E<sub>sputtered</sub> ≈ 3U<sub>s</sub>/2 (Thompson energy distribution peak)</p>
        <p>λ<sub>mfp</sub> ≈ k<sub>T</sub>/P (mean free path)</p>
      </div>

      <Plot data={sweepData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Power (W)", gridcolor: "#374151" },
        yaxis: { title: "Dep Rate (nm/s)", gridcolor: "#374151", side: "left" },
        yaxis2: { title: "Stress (MPa)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 50, r: 50 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
