"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function FiberBraggGratingSensorPage() {
  const [gratingPeriod, setGratingPeriod] = useState(535); // nm
  const [effectiveIndex, setEffectiveIndex] = useState(1.468);
  const [gratingLength, setGratingLength] = useState(10); // mm
  const [indexModulation, setIndexModulation] = useState(1e-4);
  const [strain, setStrain] = useState(0); // µε (microstrain)
  const [temperature, setTemperature] = useState(25); // °C
  const [tempChange, setTempChange] = useState(0); // °C change from reference
  const [strainSensitivity, setStrainSensitivity] = useState(1.2); // pm/µε
  const [tempSensitivity, setTempSensitivity] = useState(10); // pm/°C

  const calc = useMemo(() => {
    // Bragg wavelength
    const lambdaB = 2 * effectiveIndex * gratingPeriod; // nm
    
    // Peak reflectivity (uniform grating)
    // R = tanh²(κ·L) where κ = π·Δn/λ
    const kappa = Math.PI * indexModulation / (lambdaB * 1e-9);
    const L = gratingLength * 1e-3;
    const reflectivity = Math.pow(Math.tanh(kappa * L), 2);
    
    // Bandwidth (FWHM for uniform grating)
    // Δλ = λ_B · (s² + 1)^(1/2) / (N·s) where s = κ·L, N = L/Λ
    const N = L / (gratingPeriod * 1e-9);
    const s = kappa * L;
    const bandwidth = lambdaB * Math.sqrt(s * s + 1) / (N * s || 1); // nm
    
    // Strain-induced wavelength shift
    const strainShift = strain * strainSensitivity / 1000; // nm
    
    // Temperature-induced wavelength shift
    const tempShift = tempChange * tempSensitivity / 1000; // nm
    
    // Total wavelength shift
    const totalShift = strainShift + tempShift;
    
    // Shifted Bragg wavelength
    const shiftedLambdaB = lambdaB + totalShift;
    
    // Photoelastic coefficient (typical for silica)
    const peCoeff = 0.22;
    
    // Thermo-optic coefficient (typical for silica)
    const dn_dT = 8.6e-6; // /°C
    
    // Thermal expansion coefficient
    const alpha = 0.55e-6; // /°C
    
    return { lambdaB, reflectivity, bandwidth, strainShift, tempShift, totalShift, shiftedLambdaB, kappa, s, N };
  }, [gratingPeriod, effectiveIndex, gratingLength, indexModulation, strain, temperature, tempChange, strainSensitivity, tempSensitivity]);

  const spectralData = useMemo(() => {
    const lambdaB = calc.lambdaB;
    const deltaLambda = Array.from({ length: 500 }, (_, i) => (i - 250) * 0.005);
    
    // Reflection spectrum (sinc-squared for uniform grating)
    const x = deltaLambda.map(d => (d - calc.totalShift * 1e3) / (calc.bandwidth * 1e3)); // normalized
    const reflection = x.map(xi => {
      if (Math.abs(xi) < 0.001) return calc.reflectivity;
      return calc.reflectivity * Math.pow(Math.sin(Math.PI * xi * calc.s) / (Math.PI * xi * calc.s), 2);
    });
    
    const currentMarker = {
      x: [calc.shiftedLambdaB],
      y: [calc.reflectivity],
      type: "scatter" as const,
      mode: "markers" as const,
      marker: { color: "#f87171", size: 10 },
      name: "Peak",
    };
    
    return [
      { x: deltaLambda.map(d => lambdaB + d / 1e3), y: reflection, type: "scatter" as const, mode: "lines" as const, name: "Reflection", line: { color: "#3b82f6", width: 2 }, fill: "tozeroy" as const, fillcolor: "rgba(59,130,246,0.2)" },
      currentMarker,
    ];
  }, [calc]);

  const strainData = useMemo(() => {
    const strains = Array.from({ length: 100 }, (_, i) => i * 10); // 0-1000 µε
    const shifts = strains.map(s => s * strainSensitivity / 1000);
    return [{ x: strains, y: shifts, type: "scatter" as const, mode: "lines" as const, name: "Strain Shift", line: { color: "#22c55e", width: 2 } }];
  }, [strainSensitivity]);

  const tempData = useMemo(() => {
    const temps = Array.from({ length: 100 }, (_, i) => -50 + i); // -50 to +50 °C
    const shifts = temps.map(t => t * tempSensitivity / 1000);
    return [{ x: temps, y: shifts, type: "scatter" as const, mode: "lines" as const, name: "Temp Shift", line: { color: "#f97316", width: 2 } }];
  }, [tempSensitivity]);

  const crossSensData = useMemo(() => {
    // 2D heatmap: strain vs temp → wavelength shift
    const strains = [0, 100, 200, 300, 400, 500];
    const temps = [-20, 0, 20, 40, 60, 80];
    const z = strains.map(s => temps.map(t => (s * strainSensitivity + t * tempSensitivity) / 1000));
    
    return [{
      z, x: temps, y: strains,
      type: "heatmap" as const,
      colorscale: "Viridis" as const,
      colorbar: { title: { text: "Δλ (nm)", side: "right" } },
    }];
  }, [strainSensitivity, tempSensitivity]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Bragg Grating Sensor" description="Calculate FBG wavelength shift for strain and temperature sensing applications.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Grating Period Λ (nm)</span>
          <input type="number" value={gratingPeriod} onChange={e => setGratingPeriod(+e.target.value)} step="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Effective Index n_eff</span>
          <input type="number" value={effectiveIndex} onChange={e => setEffectiveIndex(+e.target.value)} step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Grating Length (mm)</span>
          <input type="number" value={gratingLength} onChange={e => setGratingLength(+e.target.value)} step="0.5"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Index Modulation Δn</span>
          <input type="number" value={indexModulation} onChange={e => setIndexModulation(+e.target.value)} step={1e-5}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Strain (µε)</span>
          <input type="number" value={strain} onChange={e => setStrain(+e.target.value)} step="10"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Temperature Change (°C)</span>
          <input type="number" value={tempChange} onChange={e => setTempChange(+e.target.value)} step="1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Strain Sensitivity (pm/µε)</span>
          <input type="number" value={strainSensitivity} onChange={e => setStrainSensitivity(+e.target.value)} step="0.1"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Temp Sensitivity (pm/°C)</span>
          <input type="number" value={tempSensitivity} onChange={e => setTempSensitivity(+e.target.value)} step="0.5"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bragg Wavelength</p>
          <p className="text-xl font-bold text-blue-400">{calc.lambdaB.toFixed(2)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Reflectivity</p>
          <p className="text-xl font-bold text-green-400">{(calc.reflectivity * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bandwidth (FWHM)</p>
          <p className="text-xl font-bold text-purple-400">{(calc.bandwidth * 1e3).toFixed(2)} pm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Shifted λ_B</p>
          <p className="text-xl font-bold text-orange-400">{calc.shiftedLambdaB.toFixed(3)} nm</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strain Shift</p>
          <p className="text-xl font-bold text-green-400">{(calc.strainShift * 1e3).toFixed(2)} pm</p>
          <p className="text-xs text-gray-500">{strain} µε × {strainSensitivity} pm/µε</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Temperature Shift</p>
          <p className="text-xl font-bold text-orange-400">{(calc.tempShift * 1e3).toFixed(2)} pm</p>
          <p className="text-xs text-gray-500">{tempChange}°C × {tempSensitivity} pm/°C</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Shift</p>
          <p className="text-xl font-bold text-red-400">{(calc.totalShift * 1e3).toFixed(2)} pm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Reflection Spectrum</h3>
        <ChartPanel data={spectralData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Reflectivity", gridcolor: "#374151", color: "#9ca3af", range: [0, 1.1] },
          font: { color: "#e5e7eb" }, margin: { t: 10, r: 20, b: 40, l: 50 }, height: 300,
        }} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Wavelength Shift vs Strain</h3>
          <ChartPanel data={strainData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Strain (µε)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Δλ (nm)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 10, r: 10, b: 40, l: 50 }, height: 250,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Wavelength Shift vs Temperature</h3>
          <ChartPanel data={tempData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "ΔT (°C)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Δλ (nm)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 10, r: 10, b: 40, l: 50 }, height: 250,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>λ_B = 2·n_eff·Λ [Bragg condition]</p>
          <p>R = tanh²(κ·L) where κ = π·Δn/λ [reflectivity]</p>
          <p>Δλ/λ_B = (1 - p_e)·ε + (α + ξ)·ΔT</p>
          <p>p_e ≈ 0.22 (photoelastic coeff), ξ ≈ 8.6×10⁻⁶/°C (thermo-optic)</p>
          <p>Typical: K_ε ≈ 1.2 pm/µε, K_T ≈ 10 pm/°C @ 1550nm</p>
          <p>Cross-sensitivity requires compensation techniques (dual-grating, etc.)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
