"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  SMF28_THERMAL_COEFFICIENT, braggShift, braggWavelength, couplingCoefficient, effectivePhotoelastic,
  firstZeroBandwidth, peakReflectance, strainGaugeFactor, uniformFwhm, uniformGratingReflectance,
} from "../../../physics/fiber-optics/fiber-bragg-grating";

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

export default function FiberBraggGratingSensorPage() {
  const [gratingPeriod, setGratingPeriod] = useURLState("gratingPeriod", 535.6); // nm
  const [effectiveIndex, setEffectiveIndex] = useURLState("effectiveIndex", 1.447);
  const [gratingLength, setGratingLength] = useURLState("gratingLength", 10); // mm
  const [indexModulation, setIndexModulation] = useURLState("indexModulation", 1e-4);
  const [strain, setStrain] = useURLState("strain", 500); // µε
  const [tempChange, setTempChange] = useURLState("tempChange", 20); // K
  const [thermalCoeff, setThermalCoeff] = useURLState("thermalCoeff", SMF28_THERMAL_COEFFICIENT * 1e6); // 1e-6/K

  const calc = useMemo(() => {
    const nEff = clamp(effectiveIndex, 1, 3);
    const lambdaB = braggWavelength(nEff, clamp(gratingPeriod, 100, 1500) * 1e-9);
    const g = { lambdaB, nEff, length: clamp(gratingLength, 0.1, 1000) * 1e-3, deltaN: clamp(indexModulation, 1e-8, 1e-2) };
    const pe = effectivePhotoelastic(nEff);
    const gauge = strainGaugeFactor(nEff);
    const KT = clamp(thermalCoeff, 0, 100) * 1e-6;
    const eps = clamp(strain, -1e4, 1e4) * 1e-6;
    const dT = clamp(tempChange, -100, 100); // K_T is linear only within tens of kelvin of 20 °C
    const strainShift = braggShift(lambdaB, eps, 0, gauge, KT);
    const tempShift = braggShift(lambdaB, 0, dT, gauge, KT);
    const totalShift = strainShift + tempShift;
    return {
      g, lambdaB, pe, gauge, KT, strainShift, tempShift, totalShift, shiftedLambdaB: lambdaB + totalShift,
      reflectivity: peakReflectance(couplingCoefficient(g.deltaN, lambdaB) * g.length),
      fwhm: uniformFwhm(g), zeroWidth: firstZeroBandwidth(g),
      strainPm: braggShift(lambdaB, 1e-6, 0, gauge, KT) * 1e12, // pm/µε
      tempPm: braggShift(lambdaB, 0, 1, gauge, KT) * 1e12, // pm/K
    };
  }, [gratingPeriod, effectiveIndex, gratingLength, indexModulation, strain, tempChange, thermalCoeff]);

  const spectralData = useMemo(() => {
    const { g, lambdaB, shiftedLambdaB, zeroWidth } = calc;
    // Each trace is sampled across its own peak, so a narrow band isn't missed when the shift is large.
    const trace = (center: number, name: string, color: string) => {
      const xs = Array.from({ length: 601 }, (_, i) => center + (i / 300 - 1) * 1.5 * zeroWidth);
      return {
        x: xs.map((x) => x * 1e9),
        y: xs.map((x) => uniformGratingReflectance({ ...g, lambdaB: center }, x)),
        type: "scatter" as const, mode: "lines" as const, name, line: { color, width: 2 },
      };
    };
    return [trace(lambdaB, "Reference", "#6b7280"), trace(shiftedLambdaB, "Strained / heated", "#3b82f6")];
  }, [calc]);

  const strainData = useMemo(() => {
    const strains = Array.from({ length: 101 }, (_, i) => i * 20); // 0–2000 µε
    return [{ x: strains, y: strains.map((s) => s * calc.strainPm / 1000), type: "scatter" as const, mode: "lines" as const, name: "Strain shift", line: { color: "#22c55e", width: 2 } }];
  }, [calc.strainPm]);

  const tempData = useMemo(() => {
    const temps = Array.from({ length: 101 }, (_, i) => -50 + i); // −50 … +50 K
    return [{ x: temps, y: temps.map((t) => t * calc.tempPm / 1000), type: "scatter" as const, mode: "lines" as const, name: "Temperature shift", line: { color: "#f97316", width: 2 } }];
  }, [calc.tempPm]);

  const crossSensData = useMemo(() => {
    const strains = [0, 100, 200, 300, 400, 500];
    const temps = [-20, 0, 20, 40, 60, 80];
    const z = strains.map((s) => temps.map((t) => (s * calc.strainPm + t * calc.tempPm) / 1000));
    return [{
      z, x: temps, y: strains, type: "heatmap" as const, colorscale: "Viridis" as const,
      colorbar: { title: { text: "Δλ (nm)", side: "right" } },
    }];
  }, [calc.strainPm, calc.tempPm]);

  const pm = (v: number) => `${(v * 1e12).toFixed(1)} pm`;
  const chartLayout = (xTitle: string, yTitle: string, height = 250) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    xaxis: { title: xTitle, gridcolor: "#374151", color: "#9ca3af" },
    yaxis: { title: yTitle, gridcolor: "#374151", color: "#9ca3af" },
    font: { color: "#e5e7eb" }, margin: { t: 10, r: 10, b: 40, l: 50 }, height,
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Grating Period Λ (nm)" value={gratingPeriod} onChange={setGratingPeriod} min={100} max={1500} step="0.1" />
        <ValidatedNumberInput label="Effective Index n_eff (phase)" value={effectiveIndex} onChange={setEffectiveIndex} min={1} max={3} step="0.001" />
        <ValidatedNumberInput label="Grating Length (mm)" value={gratingLength} onChange={setGratingLength} min={0.1} max={1000} step="0.5" />
        <ValidatedNumberInput label="Index Modulation Δn" value={indexModulation} onChange={setIndexModulation} min={1e-8} max={1e-2} />
        <ValidatedNumberInput label="Strain (µε)" value={strain} onChange={setStrain} min={-1e4} max={1e4} step="10" />
        <ValidatedNumberInput label="Temperature Change ΔT (K)" value={tempChange} onChange={setTempChange} min={-100} max={100} step="1" />
        <ValidatedNumberInput label="Thermal Coefficient K_T (10⁻⁶/K)" value={thermalCoeff} onChange={setThermalCoeff} min={0} max={100} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bragg Wavelength</p>
          <p className="text-xl font-bold text-blue-400">{(calc.lambdaB * 1e9).toFixed(2)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Reflectance</p>
          <p className="text-xl font-bold text-green-400">{(calc.reflectivity * 100).toFixed(1)} %</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM / First-Zero Width</p>
          <p className="text-xl font-bold text-purple-400">{pm(calc.fwhm)} / {pm(calc.zeroWidth)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Shifted λ_B</p>
          <p className="text-xl font-bold text-orange-400">{(calc.shiftedLambdaB * 1e9).toFixed(3)} nm</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strain Shift</p>
          <p className="text-xl font-bold text-green-400">{pm(calc.strainShift)}</p>
          <p className="text-xs text-gray-400">{calc.strainPm.toFixed(3)} pm/µε (1 − p_e = {calc.gauge.toFixed(4)})</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Temperature Shift</p>
          <p className="text-xl font-bold text-orange-400">{pm(calc.tempShift)}</p>
          <p className="text-xs text-gray-400">{calc.tempPm.toFixed(2)} pm/K</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Shift</p>
          <p className="text-xl font-bold text-red-400">{pm(calc.totalShift)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Reflection Spectrum</h3>
        <ChartPanel data={spectralData} layout={{ ...chartLayout("Wavelength (nm)", "Reflectance", 300), yaxis: { title: "Reflectance", gridcolor: "#374151", color: "#9ca3af", range: [0, 1.05] } }} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Wavelength Shift vs Strain</h3>
          <ChartPanel data={strainData} layout={chartLayout("Strain (µε)", "Δλ (nm)")} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Wavelength Shift vs Temperature</h3>
          <ChartPanel data={tempData} layout={chartLayout("ΔT (K)", "Δλ (nm)")} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold mb-3">Cross-Sensitivity: Δλ for Strain and Temperature Together</h3>
        <ChartPanel data={crossSensData} layout={chartLayout("ΔT (K)", "Strain (µε)", 300)} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>λ_B = 2·n_eff·Λ; R_max = tanh²(πΔn·L/λ_B) (Erdogan 1997)</p>
          <p>Δλ_B/λ_B = (1 − p_e)·ε + K_T·ΔT (Kersey 1997)</p>
          <p>p_e = (n²/2)[p₁₂ − ν(p₁₁ + p₁₂)] = {calc.pe.toFixed(4)} with p₁₁ 0.113, p₁₂ 0.252, ν 0.16</p>
          <p>K_T = (1/n)dn/dT + α = 6.165×10⁻⁶/K for SMF-28 at 20 °C (Cosme 2026)</p>
          <p>A single grating cannot separate strain from temperature: use a strain-free reference grating.</p>
        </div>
      </div>
    </>
  );
}
