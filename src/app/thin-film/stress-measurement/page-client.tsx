"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function StressMeasurementPage() {
  const [radius, setRadius] = useState(25);
  const [thickness, setThickness] = useState(100);
  const [nFilm, setNFilm] = useState(1.46);
  const [deflection, setDeflection] = useState(1e-6);
  const [poissonRatio, setPoissonRatio] = useState(0.22);
  const [youngsModulus, setYoungsModulus] = useState(70);
  const [substrateThickness, setSubstrateThickness] = useState(0.5);
  const [temperature, setTemperature] = useState(25);
  const [depositionTemp, setDepositionTemp] = useState(200);

  const results = useMemo(() => {
    const R = radius * 1e-3; // m
    const tf = thickness * 1e-9; // m
    const ts = substrateThickness * 1e-3; // m
    const h = deflection; // m
    const nu = poissonRatio;
    const Es = youngsModulus * 1e9; // Pa
    const nf = nFilm;
    const dT = Math.abs(temperature - depositionTemp);

    // Stoney equation: σ = Es·ts² / [6(1-ν)·R·tf] where R = curvature
    // For a disk with center deflection h: curvature κ ≈ h / R²
    const curvature = h / (R * R);
    const radiusOfCurvature = R * R / h;
    const stress = (Es * ts * ts) / (6 * (1 - nu) * radiusOfCurvature * tf);
    const stressMPa = stress / 1e6;

    // Force per unit width
    const forcePerWidth = stress * tf; // N/m

    // Film strain
    const strain = stress / (nf * 200e9); // assume film E ~ 200 GPa rough

    // Thermal stress component
    const alphaSub = 0.5e-6; // K⁻¹ typical glass
    const alphaFilm = 0.5e-6; // K⁻¹ typical oxide
    const thermalStress = (alphaFilm - alphaSub) * dT * nf * 200e9 / 1e6; // MPa

    // Intrinsic stress (total - thermal)
    const intrinsicStress = stressMPa - thermalStress;

    // Energy stored in film
    const energyPerArea = stress * stress * tf / (2 * nf * 200e9); // J/m²

    // Stoney formula validity check
    const thicknessRatio = tf / ts;
    const valid = thicknessRatio < 0.1;

    return { curvature, radiusOfCurvature, stressMPa, forcePerWidth, strain, thermalStress, intrinsicStress, energyPerArea, thicknessRatio, valid };
  }, [radius, thickness, nFilm, deflection, poissonRatio, youngsModulus, substrateThickness, temperature, depositionTemp]);

  const sweepData = useMemo(() => {
    const thicknesses = Array.from({ length: 80 }, (_, i) => 10 + i * 990 / 80);
    const stresses = thicknesses.map(tf => {
      const R = radius * 1e-3;
      const ts = substrateThickness * 1e-3;
      const h = deflection;
      const nu = poissonRatio;
      const Es = youngsModulus * 1e9;
      const filmT = tf * 1e-9;
      const Rc = R * R / h;
      return (Es * ts * ts) / (6 * (1 - nu) * Rc * filmT) / 1e6;
    });
    const energies = thicknesses.map(tf => {
      const R = radius * 1e-3;
      const ts = substrateThickness * 1e-3;
      const h = deflection;
      const nu = poissonRatio;
      const Es = youngsModulus * 1e9;
      const filmT = tf * 1e-9;
      const Rc = R * R / h;
      const sigma = (Es * ts * ts) / (6 * (1 - nu) * Rc * filmT);
      return sigma * sigma * filmT / (2 * nFilm * 200e9);
    });
    return [
      { x: thicknesses, y: stresses, type: "scatter" as const, mode: "lines" as const, name: "Stress (MPa)", line: { color: "#f87171" }, yaxis: "y" },
      { x: thicknesses, y: energies.map(e => e * 1e3), type: "scatter" as const, mode: "lines" as const, name: "Energy (mJ/m²)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [radius, deflection, poissonRatio, youngsModulus, substrateThickness, nFilm]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Thin Film Stress Measurement" description="Calculate film stress from substrate curvature using the Stoney equation. Includes thermal stress decomposition and stored elastic energy.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Substrate Radius (mm)</span>
          <input type="number" value={radius} onChange={e => setRadius(+e.target.value)} step="0.5" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Substrate Thickness (mm)</span>
          <input type="number" value={substrateThickness} onChange={e => setSubstrateThickness(+e.target.value)} step="0.05" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Film Thickness (nm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">n<sub>film</sub></span>
          <input type="number" value={nFilm} onChange={e => setNFilm(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Center Deflection (μm)</span>
          <input type="number" value={deflection * 1e6} onChange={e => setDeflection(+e.target.value * 1e-6)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">E<sub>substrate</sub> (GPa)</span>
          <input type="number" value={youngsModulus} onChange={e => setYoungsModulus(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">ν<sub>substrate</sub></span>
          <input type="number" value={poissonRatio} onChange={e => setPoissonRatio(+e.target.value)} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Deposition Temp (°C)</span>
          <input type="number" value={depositionTemp} onChange={e => setDepositionTemp(+e.target.value)} step="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Measurement Temp (°C)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Curvature κ: <span className="text-blue-400 font-mono">{results.curvature.toExponential(3)} m⁻¹</span></p>
        <p className="text-gray-300">Radius of Curvature: <span className="text-blue-400 font-mono">{results.radiusOfCurvature.toFixed(1)} m</span></p>
        <p className="text-gray-300">Film Stress σ: <span className="text-blue-400 font-mono">{results.stressMPa.toFixed(1)} MPa</span>
          <span className={`ml-2 text-xs ${results.stressMPa > 0 ? 'text-red-400' : 'text-green-400'}`}>({results.stressMPa > 0 ? 'tensile' : 'compressive'})</span></p>
        <p className="text-gray-300">Force/Width: <span className="text-blue-400 font-mono">{results.forcePerWidth.toFixed(3)} N/m</span></p>
        <p className="text-gray-300">Film Strain: <span className="text-blue-400 font-mono">{(results.strain * 1e6).toFixed(1)} μϵ</span></p>
        <p className="text-gray-300">Thermal Stress Component: <span className="text-blue-400 font-mono">{results.thermalStress.toFixed(1)} MPa</span></p>
        <p className="text-gray-300">Intrinsic Stress: <span className="text-blue-400 font-mono">{results.intrinsicStress.toFixed(1)} MPa</span></p>
        <p className="text-gray-300">Stored Energy: <span className="text-blue-400 font-mono">{(results.energyPerArea * 1e3).toFixed(3)} mJ/m²</span></p>
        <p className="text-gray-300">t<sub>film</sub>/t<sub>sub</sub>: <span className="text-blue-400 font-mono">{results.thicknessRatio.toExponential(3)}</span>
          {results.valid ? <span className="text-green-400 ml-2 text-xs">✓ Stoney valid</span> : <span className="text-yellow-400 ml-2 text-xs">⚠ Stoney approx.</span>}</p>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>σ<sub>f</sub> = E<sub>s</sub>·t<sub>s</sub>² / [6(1−ν)·R·t<sub>f</sub>] (Stoney equation)</p>
        <p>κ = h/R² (curvature from center deflection)</p>
        <p>σ<sub>thermal</sub> = E<sub>f</sub>·(α<sub>f</sub> − α<sub>s</sub>)·ΔT</p>
        <p>σ<sub>intrinsic</sub> = σ<sub>total</sub> − σ<sub>thermal</sub></p>
        <p>U = σ²·t<sub>f</sub> / (2E<sub>f</sub>) (elastic energy per area)</p>
      </div>

      <ChartPanel data={sweepData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Film Thickness (nm)", gridcolor: "#374151" },
        yaxis: { title: "Stress (MPa)", gridcolor: "#374151", side: "left" },
        yaxis2: { title: "Energy (mJ/m²)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 50, r: 50 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} />
    </CalculatorShell>
  );
}
