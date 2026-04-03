"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Silicon Photodiode Parameters
// Bandgap: E_g ≈ 1.12 eV at 300K → λ_c ≈ 1100 nm
// QE: η = (1-R)·(1 - exp(-α·d)) with wavelength-dependent α
// α(λ) for Si: empirical model, peaks around 800nm, falls off near bandgap
// Dark current: I_d ∝ T^3 · exp(-E_g/2kT) for generation-recombination
// Responsivity: R = η·q·λ/(h·c)

export default function SiliconPhotodiodePage() {
  const [temperature, setTemperature] = useState(293); // K
  const [depletionWidth, setDepletionWidth] = useState(10); // μm
  const [area, setArea] = useState(1); // mm²
  const [reverseBias, setReverseBias] = useState(5); // V
  const [surfaceReflectivity, setSurfaceReflectivity] = useState(0.05);

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

  // Absorption coefficient for Si (empirical)
  const absorptionCoeff = (wavelengthNm: number): number => {
    const wl = wavelengthNm;
    if (wl < 300) return 1e6;
    if (wl > cutoffWavelength) return 0;
    // Empirical fit for Si
    if (wl < 500) return 1e4 * Math.exp((500 - wl) / 50);
    if (wl < 800) return 1e3 + 5e3 * Math.exp((800 - wl) / 150);
    return 1e3 * Math.pow(cutoffWavelength / wl, 3);
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
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Silicon Photodiode</h1>
      <p className="text-gray-400 mb-8">Si photodiode spectral response, QE, responsivity, dark current, and junction capacitance.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} min="200" max="400" step="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Depletion Width (μm)</span>
          <input type="number" value={depletionWidth} onChange={e => setDepletionWidth(+e.target.value)} min="1" max="500" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Active Area (mm²)</span>
          <input type="number" value={area} onChange={e => setArea(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Surface Reflectivity</span>
          <input type="number" value={surfaceReflectivity} onChange={e => setSurfaceReflectivity(+e.target.value)} min="0" max="0.5" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><span className="text-gray-400 text-sm">Bandgap E_g</span><div className="text-xl font-mono">{Eg.toFixed(4)} eV</div></div>
          <div><span className="text-gray-400 text-sm">Cutoff Wavelength</span><div className="text-xl font-mono text-green-400">{cutoffWavelength.toFixed(0)} nm</div></div>
          <div><span className="text-gray-400 text-sm">Peak QE @ 700nm</span><div className="text-xl font-mono">{(calcQE(700) * 100).toFixed(1)}%</div></div>
          <div><span className="text-gray-400 text-sm">Peak Responsivity @ 900nm</span><div className="text-xl font-mono">{calcResponsivity(900).toFixed(3)} A/W</div></div>
          <div><span className="text-gray-400 text-sm">Dark Current</span><div className="text-xl font-mono">{(darkCurrent * 1e9).toFixed(3)} nA</div></div>
          <div><span className="text-gray-400 text-sm">Junction Capacitance</span><div className="text-xl font-mono">{capPF.toFixed(2)} pF</div></div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Spectral Response</h3>
          <Plot data={spectralChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "QE (%)", gridcolor: "#374151", side: "left" },
            yaxis2: { title: "R (A/W)", overlaying: "y", side: "right", gridcolor: "#374151" },
            margin: { t: 20, b: 40, l: 60, r: 60 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">QE vs Depletion Width</h3>
          <Plot data={qeVsWidth} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Depletion Width (μm)", gridcolor: "#374151" },
            yaxis: { title: "QE (%)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Dark Current vs Temperature</h3>
          <Plot data={darkVsTemp} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Temperature (K)", gridcolor: "#374151" },
            yaxis: { title: "I_dark (nA)", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
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
