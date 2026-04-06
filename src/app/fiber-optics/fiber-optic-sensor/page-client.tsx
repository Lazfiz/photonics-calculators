"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

type SensorType = "fbg" | "mach_zehnder" | "fabry_perot" | "evanescent";

export default function FiberOpticSensorPage() {
  const [sensorType, setSensorType] = useState<SensorType>("fbg");
  const [wavelength, setWavelength] = useState(1550); // nm
  const [temperature, setTemperature] = useState(25); // °C
  const [strain, setStrain] = useState(0); // με
  const [pressure, setPressure] = useState(101.325); // kPa
  const [gaugeLength, setGaugeLength] = useState(10); // mm (for MZI)
  const [cavityLength, setCavityLength] = useState(20); // μm (for FP)
  const [n_eff, setN_eff] = useState(1.468);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;

    switch (sensorType) {
      case "fbg": {
        // FBG: Δλ/λ = (1-pe)ε + (α+ξ)ΔT
        const pe = 0.22; // photoelastic coefficient
        const alpha = 0.55e-6; // thermal expansion (1/K)
        const xi = 6.67e-6; // thermo-optic (1/K)
        const dlambda_strain = wavelength * (1 - pe) * strain * 1e-6;
        const dlambda_temp = wavelength * (alpha + xi) * (temperature - 25);
        const dlambda_total = dlambda_strain + dlambda_temp;
        const strainSensitivity = wavelength * (1 - pe) * 1e-6; // nm/με
        const tempSensitivity = wavelength * (alpha + xi); // nm/°C
        return { dlambda_total, strainSensitivity, tempSensitivity, dlambda_strain, dlambda_temp, type: "FBG" };
      }
      case "mach_zehnder": {
        // MZI: Δφ = (2π/λ) × n_eff × L × (ε × (1-pe) + ΔT × (α+ξ))
        const pe = 0.22;
        const alpha = 0.55e-6;
        const xi = 6.67e-6;
        const L = gaugeLength * 1e-3;
        const delta_n = n_eff * ((1 - pe) * strain * 1e-6 + (alpha + xi) * (temperature - 25));
        const delta_phi = (2 * Math.PI / lambda) * delta_n * L;
        const phaseStrain = (2 * Math.PI / lambda) * n_eff * (1 - pe) * 1e-6 * L;
        const phaseTemp = (2 * Math.PI / lambda) * n_eff * (alpha + xi) * L;
        // Pressure sensitivity
        const delta_phi_p = (2 * Math.PI / lambda) * n_eff * L * 3e-12 * (pressure - 101.325) * 1e3;
        return { delta_phi, phaseStrain, phaseTemp, delta_phi_p, type: "MZI" };
      }
      case "fabry_perot": {
        // FP: FSR = λ²/(2nL), fringe shift with cavity change
        const L = cavityLength * 1e-6;
        const FSR = (wavelength * 1e-9) ** 2 / (2 * n_eff * L);
        const finesse = 30; // typical for low-finesse FP
        // Temperature: cavity changes by thermal expansion
        const alpha = 0.55e-6;
        const dL = L * alpha * (temperature - 25);
        const dlambda = (wavelength * 1e-9 / (2 * n_eff * L)) * dL * 1e9;
        // Strain: direct cavity length change
        const dL_strain = L * strain * 1e-6;
        const dlambda_strain = (wavelength * 1e-9 / (2 * n_eff * L)) * dL_strain * 1e9;
        return { FSR: FSR * 1e9, finesse, dlambda, dlambda_strain, type: "Fabry-Pérot" };
      }
      case "evanescent": {
        // Evanescent sensor: intensity modulation
        const n_ext = 1.33 + 0.001 * (temperature - 25); // water RI temp dep
        const NA = 0.22;
        const V = (2 * Math.PI / (wavelength * 1e-3)) * 4.5 * NA;
        const w = 4.5 * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));
        const gamma = Math.sqrt(2 * Math.PI * NA / (wavelength * 1e-3 * w));
        const cladRemaining = 1; // μm
        const sensitivity = gamma * Math.exp(-2 * gamma * cladRemaining);
        const intensityChange = sensitivity * (n_ext - 1.33) * 100;
        return { sensitivity, intensityChange, n_ext, type: "Evanescent" };
      }
    }
  }, [sensorType, wavelength, temperature, strain, pressure, gaugeLength, cavityLength, n_eff]);

  const chartData = useMemo(() => {
    if (sensorType === "fbg") {
      const strains = Array.from({ length: 100 }, (_, i) => i * 10);
      const shifts = strains.map(s => {
        const pe = 0.22;
        return wavelength * (1 - pe) * s * 1e-6;
      });
      const temps = Array.from({ length: 100 }, (_, i) => -50 + i * 1.5);
      const tshifts = temps.map(t => {
        return wavelength * (0.55e-6 + 6.67e-6) * (t - 25);
      });
      return [
        { x: strains, y: shifts, type: "scatter" as const, mode: "lines" as const, name: "Strain shift", line: { color: "#f87171" } },
        { x: temps, y: tshifts, type: "scatter" as const, mode: "lines" as const, name: "Temp shift", line: { color: "#60a5fa" } },
      ];
    }
    if (sensorType === "mach_zehnder") {
      const strains = Array.from({ length: 100 }, (_, i) => i * 10);
      const phases = strains.map(s => {
        const pe = 0.22;
        return (2 * Math.PI / (wavelength * 1e-9)) * n_eff * (1 - pe) * s * 1e-6 * gaugeLength * 1e-3;
      });
      return [{ x: strains, y: phases, type: "scatter" as const, mode: "lines" as const, name: "Phase shift (rad)", line: { color: "#34d399" } }];
    }
    if (sensorType === "fabry_perot") {
      const wls = Array.from({ length: 500 }, (_, i) => 1520 + i * 0.1);
      const L = cavityLength * 1e-6;
      const spectrum = wls.map(wl => {
        const FSR = (wl * 1e-9) ** 2 / (2 * n_eff * L);
        const F = 30;
        return (1 / (1 + (2 * F / Math.PI) ** 2 * Math.pow(Math.sin(Math.PI * (wl - wavelength) / (FSR * 1e9)), 2)));
      });
      return [{ x: wls, y: spectrum.map(s => s * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmission (%)", line: { color: "#a78bfa" } }];
    }
    // evanescent
    const n_exts = Array.from({ length: 100 }, (_, i) => 1.33 + i * 0.002);
    const V = (2 * Math.PI / (wavelength * 1e-3)) * 4.5 * 0.22;
    const w = 4.5 * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));
    const gamma = Math.sqrt(2 * Math.PI * 0.22 / (wavelength * 1e-3 * w));
    const intensities = n_exts.map(n => gamma * Math.exp(-2 * gamma * 1) * (n - 1.33) * 100);
    return [{ x: n_exts, y: intensities, type: "scatter" as const, mode: "lines" as const, name: "Δ Intensity (%)", line: { color: "#fbbf24" } }];
  }, [sensorType, wavelength, gaugeLength, cavityLength, n_eff, temperature]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Optic Sensors" description="Calculate sensitivity, resolution, and response for FBG, MZI, Fabry-Pérot, and evanescent fiber sensors.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Sensor Type</span>
          <select value={sensorType} onChange={e => setSensorType(e.target.value as SensorType)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="fbg">Fiber Bragg Grating (FBG)</option>
            <option value="mach_zehnder">Mach-Zehnder Interferometer</option>
            <option value="fabry_perot">Fabry-Pérot Cavity</option>
            <option value="evanescent">Evanescent Field</option>
          </select>
        </label>
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} />
        <ValidatedNumberInput label="Temperature (°C)" value={temperature} onChange={setTemperature} step="any" />
        <ValidatedNumberInput label="Strain (με)" value={strain} onChange={setStrain} step="any" />
        {sensorType === "mach_zehnder" && (
          <ValidatedNumberInput label="Gauge Length (mm)" value={gaugeLength} onChange={setGaugeLength} min={0.1} step="any" />
        )}
        {sensorType === "fabry_perot" && (
          <ValidatedNumberInput label="Cavity Length (μm)" value={cavityLength} onChange={setCavityLength} min={0.1} step="any" />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {sensorType === "fbg" && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total Shift</p>
              <p className="text-xl font-bold text-red-400">{(calc as any).dlambda_total.toFixed(4)} nm</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Strain Sens.</p>
              <p className="text-xl font-bold text-blue-400">{(calc as any).strainSensitivity.toFixed(4)} nm/με</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Temp Sens.</p>
              <p className="text-xl font-bold text-green-400">{(calc as any).tempSensitivity.toFixed(4)} nm/°C</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Center λ</p>
              <p className="text-xl font-bold text-yellow-400">{(wavelength + (calc as any).dlambda_total).toFixed(3)} nm</p>
            </div>
          </>
        )}
        {sensorType === "mach_zehnder" && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Phase Shift</p>
              <p className="text-xl font-bold text-green-400">{(calc as any).delta_phi.toFixed(3)} rad</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Strain</p>
              <p className="text-xl font-bold text-blue-400">{((calc as any).phaseStrain * 1e-6).toFixed(3)} rad/με</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Temperature</p>
              <p className="text-xl font-bold text-red-400">{((calc as any).phaseTemp).toFixed(4)} rad/°C</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Pressure</p>
              <p className="text-xl font-bold text-yellow-400">{((calc as any).delta_phi_p).toFixed(6)} rad</p>
            </div>
          </>
        )}
        {sensorType === "fabry_perot" && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">FSR</p>
              <p className="text-xl font-bold text-purple-400">{(calc as any).FSR.toFixed(2)} nm</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Finesse</p>
              <p className="text-xl font-bold text-blue-400">{(calc as any).finesse}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Temp Shift</p>
              <p className="text-xl font-bold text-green-400">{(calc as any).dlambda.toFixed(6)} nm</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Strain Shift</p>
              <p className="text-xl font-bold text-yellow-400">{(calc as any).dlambda_strain.toFixed(6)} nm</p>
            </div>
          </>
        )}
        {sensorType === "evanescent" && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Sensitivity</p>
              <p className="text-xl font-bold text-yellow-400">{(calc as any).sensitivity.toFixed(4)} /RIU</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Δ Intensity</p>
              <p className="text-xl font-bold text-green-400">{(calc as any).intensityChange.toFixed(4)}%</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">External n</p>
              <p className="text-xl font-bold text-blue-400">{(calc as any).n_ext.toFixed(5)}</p>
            </div>
          </>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          {sensorType === "fbg" && (
            <>
              <p>FBG: Δλ/λ = (1-pₑ)ε + (α+ξ)ΔT</p>
              <p>pₑ ≈ 0.22 (effective photoelastic)</p>
              <p>α = 0.55×10⁻⁶ /K, ξ = 6.67×10⁻⁶ /K</p>
              <p>Strain sens: ~1.2 pm/με @ 1550nm</p>
              <p>Temp sens: ~10 pm/°C @ 1550nm</p>
            </>
          )}
          {sensorType === "mach_zehnder" && (
            <>
              <p>Δφ = (2π/λ) × Δ(nL)</p>
              <p>Δ(nL) = nL[(1-pₑ)ε + (α+ξ)ΔT]</p>
              <p>Longer gauge → higher sensitivity</p>
            </>
          )}
          {sensorType === "fabry_perot" && (
            <>
              <p>FSR = λ² / (2nL)</p>
              <p>Airy function: T = 1/(1 + (2F/π)² sin²(δ/2))</p>
              <p>δ = 4πnL/λ</p>
            </>
          )}
          {sensorType === "evanescent" && (
            <>
              <p>ΔI/I ∝ γ exp(-2γd) Δn_ext</p>
              <p>γ = √(2π NA / (λ w₀))</p>
              <p>Best for bio/chemical sensing</p>
            </>
          )}
        </div>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: sensorType === "evanescent" ? "External RI" : sensorType === "fabry_perot" ? "Wavelength (nm)" : sensorType === "mach_zehnder" ? "Strain (με)" : "Parameter", gridcolor: "#374151" },
        yaxis: { title: "Response", gridcolor: "#374151" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30 },
      }} />
    </CalculatorShell>
  );
}
