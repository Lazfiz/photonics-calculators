"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
// Silicon Photodiode Parameters
// Bandgap: E_g ≈ 1.12 eV at 300K → λ_c ≈ 1100 nm
// QE: η = (1-R)·(1 - exp(-α·d)) with wavelength-dependent α
// α(λ) for Si: empirical model, peaks around 800nm, falls off near bandgap
// Dark current: I_d ∝ T^3 · exp(-E_g/2kT) for generation-recombination
// Responsivity: R = η·q·λ/(h·c)

export default function SiliconPhotodiodePage() {
  const [temperature, setTemperature] = useURLState("temperature", 293); // K
  const [depletionWidth, setDepletionWidth] = useURLState("depletionWidth", 10); // μm
  const [area, setArea] = useURLState("area", 1); // mm²
  const [reverseBias, setReverseBias] = useURLState("reverseBias", 5); // V
  const [surfaceReflectivity, setSurfaceReflectivity] = useURLState("surfaceReflectivity", 0.05);

  const k = 1.381e-23;
  const q = 1.602e-19;
  const h = 6.626e-34;
  const c = 3e8;

  // Si bandgap temperature dependence (Varshni)
  const Eg300 = 1.12; // eV at 300K
  const alphaVarshni = 4.73e-4; // eV/K
  const betaVarshni = 636; // K
  const Eg = Eg300 - (alphaVarshni * temperature ** 2) / (temperature + betaVarshni);
  const cutoffWavelength = 1240 / Eg;

  // Absorption coefficient for Si (Green & Keevers 1995, cm⁻¹)
  // Piecewise log-linear interpolation from tabulated data
  const absorptionCoeff = (wavelengthNm: number): number => {
    const wl = wavelengthNm;
    if (wl < 300) return 1.5e6;
    if (wl > cutoffWavelength) return 0;
    // Anchor points: [wavelength_nm, alpha_cm^-1]
    const table: [number, number][] = [
      [300, 1.5e6], [350, 1.0e5], [400, 7.0e4], [450, 2.2e4],
      [500, 1.1e4], [550, 4.5e3], [600, 2.4e3], [650, 1.5e3],
      [700, 8.0e2], [750, 4.0e2], [800, 1.0e2], [850, 5.0e1],
      [900, 1.5e1], [950, 5.0], [1000, 1.0], [1050, 0.3],
      [1100, 0.05],
    ];
    // Find bracketing segment, interpolate in log space
    for (let i = 0; i < table.length - 1; i++) {
      if (wl <= table[i + 1][0]) {
        const f = (wl - table[i][0]) / (table[i + 1][0] - table[i][0]);
        const logAlpha = Math.log10(table[i][1]) + f * (Math.log10(table[i + 1][1]) - Math.log10(table[i][1]));
        return Math.pow(10, logAlpha);
      }
    }
    return 0;
  };

  // QE calculation
  const calcQE = (wavelengthNm: number): number => {
    const alpha = absorptionCoeff(wavelengthNm);
    const d = depletionWidth * 1e-4; // μm to cm
    if (alpha === 0) return 0;
    return (1 - surfaceReflectivity) * (1 - Math.exp(-alpha * d));
  };

  // Responsivity
  const calcResponsivity = (wavelengthNm: number): number => {
    return calcQE(wavelengthNm) * (wavelengthNm * 1e-9) * q / (h * c);
  };

  // Dark current (GR-dominated for Si at moderate bias)
  const areaCm2 = area * 1e-2;
  const ni = 1.5e10 * Math.pow(temperature / 300, 1.5) * Math.exp(-Eg * q / (2 * k * temperature) + Eg300 * q / (2 * k * 300));
  const tau = 1e-3; // carrier lifetime, s
  const darkCurrent = q * ni * areaCm2 * depletionWidth * 1e-4 / (2 * tau);

  // Capacitance (abrupt junction approximation)
  const epsilonSi = 11.7 * 8.85e-14; // F/cm
  const dopingConcentration = 1e15; // cm^-3
  const builtInVoltage = 0.6;
  const depletionCap = epsilonSi * areaCm2 / (depletionWidth * 1e-4); // F
  const capPF = depletionCap * 1e12;

  // Spectral response chart
  const spectralChart = useMemo(() => {
    const wl = Array.from({ length: 250 }, (_, i) => 300 + i * 4);
    return [
      { x: wl, y: wl.map(w => calcQE(w) * 100), type: "scatter", mode: "lines", name: "QE (%)", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: wl, y: wl.map(w => calcResponsivity(w)), type: "scatter", mode: "lines", name: "R (A/W)", line: { color: "#34d399", width: 2 }, yaxis: "y2" },
    ];
  }, [temperature, depletionWidth, surfaceReflectivity, cutoffWavelength]);

  // Dark current vs temperature
  const darkVsTemp = useMemo(() => {
    const temps = Array.from({ length: 150 }, (_, i) => 220 + i * 100 / 150);
    return [{
      x: temps, y: temps.map(T => {
        const EgT = Eg300 - (alphaVarshni * T ** 2) / (T + betaVarshni);
        const niT = 1.5e10 * Math.pow(T / 300, 1.5) * Math.exp(-EgT * q / (2 * k * T) + Eg300 * q / (2 * k * 300));
        return (q * niT * areaCm2 * depletionWidth * 1e-4 / (2 * tau)) * 1e9;
      }), type: "scatter", mode: "lines", name: "I_dark", line: { color: "#f87171", width: 2 },
    }];
  }, [areaCm2, depletionWidth]);

  // QE vs depletion width
  const qeVsWidth = useMemo(() => {
    const widths = Array.from({ length: 100 }, (_, i) => 1 + i * 50 / 100);
    const wl700 = 700;
    const wl900 = 900;
    const wl1000 = 1000;
    return [
      { x: widths, y: widths.map(w => (1 - surfaceReflectivity) * (1 - Math.exp(-absorptionCoeff(wl700) * w * 1e-4)) * 100), type: "scatter", mode: "lines", name: "700 nm", line: { color: "#60a5fa", width: 2 } },
      { x: widths, y: widths.map(w => (1 - surfaceReflectivity) * (1 - Math.exp(-absorptionCoeff(wl900) * w * 1e-4)) * 100), type: "scatter", mode: "lines", name: "900 nm", line: { color: "#34d399", width: 2 } },
      { x: widths, y: widths.map(w => (1 - surfaceReflectivity) * (1 - Math.exp(-absorptionCoeff(wl1000) * w * 1e-4)) * 100), type: "scatter", mode: "lines", name: "1000 nm", line: { color: "#fbbf24", width: 2 } },
    ];
  }, [surfaceReflectivity, cutoffWavelength]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Temperature (K)" value={temperature} onChange={setTemperature} min={200} max={400} step="5" />
        <ValidatedNumberInput label="Depletion Width (μm)" value={depletionWidth} onChange={setDepletionWidth} min={1} max={500} step="1" />
        <ValidatedNumberInput label="Active Area (mm²)" value={area} onChange={setArea} min={0.01} step="0.1" />
        <ValidatedNumberInput label="Surface Reflectivity" value={surfaceReflectivity} onChange={setSurfaceReflectivity} min={0} max={0.5} step="0.01" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard label="Bandgap E_g" value={`${Eg.toFixed(4)} eV`} tone="blue" />
          <ResultCard label="Cutoff Wavelength" value={`${cutoffWavelength.toFixed(0)} nm`} tone="blue" />
          <ResultCard label="Peak QE @ 700nm" value={`${(calcQE(700) * 100).toFixed(1)}%`} tone="blue" />
          <ResultCard label="Peak Responsivity @ 900nm" value={`${calcResponsivity(900).toFixed(3)} A/W`} tone="blue" />
          <ResultCard label="Dark Current" value={`${(darkCurrent * 1e9).toFixed(3)} nA`} tone="blue" />
          <ResultCard label="Junction Capacitance" value={`${capPF.toFixed(2)} pF`} tone="blue" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Spectral Response</h3>
          <ChartPanel data={spectralChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "QE (%)", gridcolor: "#374151", side: "left" },
            yaxis2: { title: "R (A/W)", overlaying: "y", side: "right", gridcolor: "#374151" },
            margin: { t: 20, b: 40, l: 60, r: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">QE vs Depletion Width</h3>
          <ChartPanel data={qeVsWidth} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Depletion Width (μm)", gridcolor: "#374151" },
            yaxis: { title: "QE (%)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} />
        </div>
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Dark Current vs Temperature</h3>
          <ChartPanel data={darkVsTemp} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Temperature (K)", gridcolor: "#374151" },
            yaxis: { title: "I_dark (nA)", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} />
        </div>
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
        <h3 className="text-white font-semibold mb-2">Formulas</h3>
        <p>E_g(T) = E_g0 - αT²/(T+β) [Varshni]</p>
        <p>λ_c = 1240 / E_g</p>
        <p>η(λ) = (1-R)·(1 - exp(-α·d))</p>
        <p>R(λ) = η·q·λ/(h·c)</p>
        <p>I_dark ∝ n_i · W · A / τ</p>
      </div>
    </div>
  );
}
