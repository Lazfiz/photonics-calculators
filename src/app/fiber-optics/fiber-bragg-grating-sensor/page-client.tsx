"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function FiberBraggGratingSensorPage() {
  const [gratingPeriod, setGratingPeriod] = useURLState("gratingPeriod", 535); // nm
  const [effectiveIndex, setEffectiveIndex] = useURLState("effectiveIndex", 1.468);
  const [gratingLength, setGratingLength] = useURLState("gratingLength", 10); // mm
  const [indexModulation, setIndexModulation] = useURLState("indexModulation", 1e-4);
  const [strain, setStrain] = useURLState("strain", 0); // µε (microstrain)
  const [temperature, setTemperature] = useURLState("temperature", 25); // °C
  const [tempChange, setTempChange] = useURLState("tempChange", 0); // °C change from reference
  const [strainSensitivity, setStrainSensitivity] = useURLState("strainSensitivity", 1.2); // pm/µε
  const [tempSensitivity, setTempSensitivity] = useURLState("tempSensitivity", 10); // pm/°C

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
    
    return { lambdaB, reflectivity, bandwidth, strainShift, tempShift, totalShift, shiftedLambdaB, kappa, s, N };
  }, [gratingPeriod, effectiveIndex, gratingLength, indexModulation, strain, temperature, tempChange, strainSensitivity, tempSensitivity]);

  const spectralData = useMemo(() => {
    const lambdaB = calc.lambdaB;
    const kappa = calc.kappa;
    const kappaL = calc.s;
    const L = gratingLength * 1e-3; // m

    // Use ±3× bandwidth range centered on shifted Bragg wavelength
    const halfRange = Math.max(bandwidth * 3, 0.1); // nm
    const step = halfRange * 4 / 500; // nm per point
    const wavelengths: number[] = [];
    const reflections: number[] = [];

    for (let i = 0; i <= 500; i++) {
      const w = calc.shiftedLambdaB - halfRange + i * step;
      wavelengths.push(w);

      // Coupled-mode detuning: δL = 2π·n_eff·L·(1/λ - 1/λ_B_shifted)
      const deltaBeta = 2 * Math.PI * effectiveIndex * gratingLength * 1e6 * (1 / w - 1 / calc.shiftedLambdaB);
      const gammaSq = kappaL * kappaL - deltaBeta * deltaBeta;
      let R: number;
      if (gammaSq > 0) {
        R = Math.tanh(Math.sqrt(gammaSq)) ** 2;
      } else if (gammaSq < 0) {
        R = (kappaL / Math.sqrt(-gammaSq)) ** 2 * Math.sin(Math.sqrt(-gammaSq)) ** 2;
      } else {
        R = Math.tanh(kappaL) ** 2;
      }
      reflections.push(Math.min(1, R));
    }

    const currentMarker = {
      x: [calc.shiftedLambdaB],
      y: [calc.reflectivity],
      type: "scatter" as const,
      mode: "markers" as const,
      marker: { color: "#f87171", size: 10 },
      name: "Peak",
    };

    return [
      { x: wavelengths, y: reflections, type: "scatter" as const, mode: "lines" as const, name: "Reflection", line: { color: "#3b82f6", width: 2 }, fill: "tozeroy" as const, fillcolor: "rgba(59,130,246,0.2)" },
      currentMarker,
    ];
  }, [calc, bandwidth, effectiveIndex, gratingLength]);

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
        <ValidatedNumberInput label="Grating Period Λ (nm)" value={gratingPeriod} onChange={setGratingPeriod} step="1" />
        <ValidatedNumberInput label="Effective Index n_eff" value={effectiveIndex} onChange={setEffectiveIndex} step="0.001" />
        <ValidatedNumberInput label="Grating Length (mm)" value={gratingLength} onChange={setGratingLength} step="0.5" />
        <ValidatedNumberInput label="Index Modulation Δn" value={indexModulation} onChange={setIndexModulation} />
        <ValidatedNumberInput label="Strain (µε)" value={strain} onChange={setStrain} step="10" />
        <ValidatedNumberInput label="Temperature Change (°C)" value={tempChange} onChange={setTempChange} step="1" />
        <ValidatedNumberInput label="Strain Sensitivity (pm/µε)" value={strainSensitivity} onChange={setStrainSensitivity} step="0.1" />
        <ValidatedNumberInput label="Temp Sensitivity (pm/°C)" value={tempSensitivity} onChange={setTempSensitivity} step="0.5" />
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
