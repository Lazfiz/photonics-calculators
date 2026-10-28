"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  G652_LAMBDA0, G652_S0, SMF_THERMAL_DELAY_COEFF, groupDelay, loopFsr, sellmeierDispersion, sellmeierSlope,
} from "../../../physics/fiber-optics/chromatic-dispersion";
import { rmsBroadening } from "../../../physics/fiber-optics/dispersion-comp";
import { c } from "../../../physics/constants";

const nm = 1e-9, ps = 1e-12;
const PS_NM_KM = 1e-6;
const PS_KM_K = 1e-15; // ps/(km·K) → s/(m·K)
const T_REF = 25; // °C

export default function FiberDelayLineCalculator() {
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 100, { min: 0.001 }); // m
  const [groupIndex, setGroupIndex] = useURLState("refractiveIndex", 1.468, { min: 1, max: 3 }); // SMF-28 group index at 1550 nm
  const [signalWavelength, setSignalWavelength] = useURLState("signalWavelength", 1550, { min: 1260, max: 1625 }); // nm
  const [inputBitRate, setInputBitRate] = useURLState("inputBitRate", 10, { min: 0.001 }); // Gb/s
  const [temperature, setTemperature] = useURLState("temperature", 35, { min: -60, max: 150 }); // °C
  const [thermalCoeff, setThermalCoeff] = useURLState("thermalCoeff", SMF_THERMAL_DELAY_COEFF / PS_KM_K, { min: 0, max: 100 }); // ps/(km·K)
  const [spectralWidth, setSpectralWidth] = useURLState("spectralWidth", 0.1, { min: 0 }); // nm, rms

  const valid = fiberLength > 0 && groupIndex >= 1 && signalWavelength > 0 && inputBitRate > 0 && spectralWidth >= 0;

  const calc = useMemo(() => {
    if (!valid) return null;
    const lam = signalWavelength * nm;
    const tau = groupDelay(fiberLength, groupIndex);
    // Standard single-mode fibre (ITU-T G.652 form) at the signal wavelength.
    const D = sellmeierDispersion(lam, G652_LAMBDA0, G652_S0);
    const S = sellmeierSlope(lam, G652_LAMBDA0, G652_S0);
    return {
      tau,
      vg: c / groupIndex,
      bitSlots: tau * inputBitRate * 1e9,
      D,
      broadening: rmsBroadening(D * fiberLength, S * fiberLength, spectralWidth * nm),
      thermal: thermalCoeff * PS_KM_K * fiberLength * (temperature - T_REF),
      fsr: loopFsr(fiberLength, groupIndex),
    };
  }, [valid, fiberLength, groupIndex, signalWavelength, inputBitRate, temperature, thermalCoeff, spectralWidth]);

  // Narrow-source regime: the broad-source formula needs σ_λ well above the modulation bandwidth λ²B/c.
  const narrowSource = valid && spectralWidth * nm < (3 * (signalWavelength * nm) ** 2 * inputBitRate * 1e9) / c;

  const delayCurve = useMemo(() => {
    const lengths = Array.from({ length: 101 }, (_, i) => (i * 5 * Math.max(fiberLength, 1)) / 100);
    return [
      { x: lengths, y: lengths.map(l => groupDelay(l, groupIndex) * 1e9), type: "scatter" as const, mode: "lines" as const, name: "Delay (ns)", line: { color: "#3b82f6", width: 2 } },
      { x: [fiberLength], y: [calc ? calc.tau * 1e9 : null], type: "scatter" as const, mode: "markers" as const, name: "This line", marker: { color: "#f87171", size: 10 } },
    ];
  }, [fiberLength, groupIndex, calc]);

  const dispersionCurve = useMemo(() => {
    const wls = Array.from({ length: 74 }, (_, i) => 1260 + i * 5);
    return [
      { x: wls, y: wls.map(w => sellmeierDispersion(w * nm, G652_LAMBDA0, G652_S0) / PS_NM_KM), type: "scatter" as const, mode: "lines" as const, name: "G.652 D(λ)", line: { color: "#10b981", width: 2 } },
      { x: [signalWavelength], y: [calc ? calc.D / PS_NM_KM : null], type: "scatter" as const, mode: "markers" as const, name: "Signal λ", marker: { color: "#f87171", size: 10 } },
    ];
  }, [signalWavelength, calc]);

  const layout1 = {
    title: "Delay vs Fiber Length",
    xaxis: { title: "Fiber Length (m)", gridcolor: "#374151" },
    yaxis: { title: "Delay (ns)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  const layout2 = {
    title: "Standard SMF Dispersion (G.652)",
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Dispersion (ps/nm·km)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  const row = (label: string, value: string, cls = "font-mono") => (
    <div className="flex justify-between"><span className="text-gray-400">{label}</span><span className={cls}>{value}</span></div>
  );
  const show = (v: number | undefined, digits: number, unit: string) =>
    v !== undefined && Number.isFinite(v) ? `${v.toFixed(digits)} ${unit}` : "—";

  return (
    <>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ValidatedNumberInput label="Fiber Length (m)" value={fiberLength} onChange={setFiberLength} min={0.001} />
            <ValidatedNumberInput label="Group Index n_g" value={groupIndex} onChange={setGroupIndex} min={1} max={3} step="0.001" />
            <ValidatedNumberInput label="Signal Wavelength (nm)" value={signalWavelength} onChange={setSignalWavelength} min={1260} max={1625} />
            <ValidatedNumberInput label="Input Bit Rate (Gb/s)" value={inputBitRate} onChange={setInputBitRate} min={0.001} />
            <ValidatedNumberInput label="Source rms Spectral Width σ_λ (nm)" value={spectralWidth} onChange={setSpectralWidth} min={0} step="0.01" />
            <ValidatedNumberInput label="Temperature (°C)" value={temperature} onChange={setTemperature} min={-60} max={150} />
            <ValidatedNumberInput label="Thermal Delay Coeff. (ps/(km·K))" value={thermalCoeff} onChange={setThermalCoeff} min={0} max={100} step="0.1" />
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                {row("Propagation delay:", show(calc ? calc.tau * 1e9 : undefined, 3, "ns"), "font-mono text-green-400 text-lg")}
                {row("Group velocity:", show(calc ? calc.vg / 1e8 : undefined, 4, "× 10⁸ m/s"))}
                {row("Group path n_g·L:", show(calc ? groupIndex * fiberLength : undefined, 2, "m"))}
                {row("Bit slots stored:", show(calc?.bitSlots, 1, "bits"), "font-mono text-blue-400")}
                {row("SMF dispersion D(λ):", show(calc ? calc.D / PS_NM_KM : undefined, 2, "ps/(nm·km)"))}
                {row("rms dispersive spread:", show(calc ? calc.broadening / ps : undefined, 3, "ps"), "font-mono text-yellow-400")}
                {row(`Delay change vs ${T_REF} °C:`, show(calc ? calc.thermal / ps : undefined, 2, "ps"))}
                {row("Loop FSR:", show(calc ? calc.fsr / 1e6 : undefined, 4, "MHz"))}
              </div>
              {narrowSource && (
                <p className="mt-3 text-xs text-yellow-400">
                  Narrow source (σ_λ &lt; 3λ²B/c): the broad-source spread above underestimates the broadening.
                </p>
              )}
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">τ = n_g · L / c</p>
              <p className="font-mono text-sm mt-1">FSR = c / (n_g · L)</p>
              <p className="font-mono text-sm mt-1">D(λ) = (S₀/4)(λ − λ₀⁴/λ³), S₀ = 0.092, λ₀ = 1310 nm</p>
              <p className="font-mono text-sm mt-1">σ_D = L·√((Dσ_λ)² + ½(Sσ_λ²)²)</p>
              <p className="font-mono text-sm mt-1">Δτ_T = (dτ/dT per km) · L · ΔT  [SMF-28: 37.4 ps/(km·K)]</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={delayCurve} layout={layout1} />
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={dispersionCurve} layout={layout2} />
          </div>
        </div>
    </>
  );
}
