"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// InGaAs Photodetector Parameters
// Cutoff wavelength: λ_c = 1240 / E_g(eV)
// In0.53Ga0.47As lattice-matched to InP: E_g ≈ 0.75 eV → λ_c ≈ 1650 nm
// Dark current: I_d = A·J_s·[exp(qV/nkT) - 1] + generation-recombination
// J_s ~ T^(3/2)·exp(-E_g/2kT) for GR current
// QE: η = (1-R)·(1 - exp(-α·d)) where α is absorption coefficient
// α(λ) ≈ α_0·√(hν - E_g) for direct bandgap

export default function IngaasParametersPage() {
  const [temperature, setTemperature] = useState(293); // K
  const [indiumFraction, setIndiumFraction] = useState(0.53);
  const [absorptionThickness, setAbsorptionThickness] = useState(3); // μm
  const [area, setArea] = useState(0.1); // mm²
  const [biasVoltage, setBiasVoltage] = useState(0.5); // V
  const [idealityFactor, setIdealityFactor] = useState(1.2);

  const k = 1.381e-23;
  const q = 1.602e-19;
  const h = 6.626e-34;
  const c = 3e8;

  // Bandgap: E_g(In_xGa_(1-x)As) = 0.36 + 0.63·x + 0.43·x²  (eV, at 300K)
  const Eg = 0.36 + 0.63 * indiumFraction + 0.43 * indiumFraction * indiumFraction;
  const EgT = Eg - 2.7e-4 * (temperature - 300) * (Eg - 0.5) / Eg; // Varshni approx
  const cutoffWavelength = 1240 / EgT;

  // Absorption coefficient model: α = α_0·√(E_photon - E_g) for direct bandgap
  const alpha0 = 1e4; // cm^-1·eV^-0.5 (typical for InGaAs)
  const absorptionCoeff = (wavelengthNm: number) => {
    const E_photon = 1240 / wavelengthNm;
    return E_photon > EgT ? alpha0 * Math.sqrt(E_photon - EgT) : 0;
  };

  // QE calculation with anti-reflection coating (R ≈ 0.02)
  const R_surface = 0.02;
  const calcQE = (wavelengthNm: number) => {
    const alpha = absorptionCoeff(wavelengthNm);
    const d = absorptionThickness * 1e-4; // μm to cm
    return (1 - R_surface) * (1 - Math.exp(-alpha * d));
  };

  // Dark current: I_d ≈ A·J_0·exp(qV/nkT) + I_gr
  const areaCm2 = area * 1e-2; // mm² to cm²
  const J0 = 1e-8; // A/cm² typical
  const Vt = k * temperature / q;
  const diffusionDark = areaCm2 * J0 * (Math.exp(q * biasVoltage / (idealityFactor * Vt)) - 1);
  const grDark = areaCm2 * 1e-6 * Math.pow(temperature / 300, 1.5) * Math.exp(-EgT * q / (2 * k * temperature));
  const totalDark = diffusionDark + grDark;

  // NEP and D*
  const R850 = calcQE(850) * 850e-9 * q / (h * c);
  const R1300 = calcQE(1300) * 1300e-9 * q / (h * c);
  const R1550 = calcQE(1550) * 1550e-9 * q / (h * c);
  const nep1550 = Math.sqrt(2 * q * totalDark) / R1550;
  const Dstar1550 = nep1550 > 0 ? Math.sqrt(areaCm2) / nep1550 : 0;

  // Spectral QE chart
  const spectralQE = useMemo(() => {
    const wl = Array.from({ length: 300 }, (_, i) => 800 + i * 1.2);
    return [{
      x: wl, y: wl.map(w => calcQE(w) * 100), type: "scatter", mode: "lines",
      name: "QE (%)", line: { color: "#60a5fa", width: 2 },
    }, {
      x: [cutoffWavelength, cutoffWavelength], y: [0, 100], type: "scatter", mode: "lines",
      name: `λ_c = ${cutoffWavelength.toFixed(0)} nm`, line: { color: "#f87171", width: 1, dash: "dash" },
    }];
  }, [temperature, indiumFraction, absorptionThickness]);

  // Dark current vs temperature
  const darkVsTemp = useMemo(() => {
    const temps = Array.from({ length: 150 }, (_, i) => 200 + i * 200 / 150);
    return [{
      x: temps, y: temps.map(T => {
        const EgTlocal = Eg - 2.7e-4 * (T - 300) * (Eg - 0.5) / Eg;
        const Vtlocal = k * T / q;
        const diff = areaCm2 * J0 * (Math.exp(q * biasVoltage / (idealityFactor * Vtlocal)) - 1);
        const gr = areaCm2 * 1e-6 * Math.pow(T / 300, 1.5) * Math.exp(-EgTlocal * q / (2 * k * T));
        return (diff + gr) * 1e9;
      }), type: "scatter", mode: "lines", name: "Total Dark Current", line: { color: "#fbbf24", width: 2 },
    }];
  }, [Eg, biasVoltage, idealityFactor, areaCm2]);

  // Bandgap vs In fraction
  const bandgapChart = useMemo(() => {
    const x = Array.from({ length: 200 }, (_, i) => 0.3 + i * 0.4 / 200);
    return [{
      x: x.map(xi => (1240 / (0.36 + 0.63 * xi + 0.43 * xi * xi))),
      y: x, type: "scatter", mode: "lines",
      name: "λ_c vs In fraction", line: { color: "#34d399", width: 2 },
    }];
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">InGaAs Detector Parameters</h1>
      <p className="text-gray-400 mb-8">InₓGa₁₋ₓAs bandgap, cutoff wavelength, QE, dark current, and NEP for SWIR detectors.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} min="200" max="400" step="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Indium Fraction (x)</span>
          <input type="number" value={indiumFraction} onChange={e => setIndiumFraction(+e.target.value)} min="0" max="1" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Absorption Thickness (μm)</span>
          <input type="number" value={absorptionThickness} onChange={e => setAbsorptionThickness(+e.target.value)} min="0.1" step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Active Area (mm²)</span>
          <input type="number" value={area} onChange={e => setArea(+e.target.value)} min="0.01" step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Bias Voltage (V)</span>
          <input type="number" value={biasVoltage} onChange={e => setBiasVoltage(+e.target.value)} min="-5" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Ideality Factor</span>
          <input type="number" value={idealityFactor} onChange={e => setIdealityFactor(+e.target.value)} min="1" max="2" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><span className="text-gray-400 text-sm">Bandgap E_g</span><div className="text-xl font-mono">{EgT.toFixed(3)} eV</div></div>
          <div><span className="text-gray-400 text-sm">Cutoff Wavelength</span><div className="text-xl font-mono text-green-400">{cutoffWavelength.toFixed(0)} nm</div></div>
          <div><span className="text-gray-400 text-sm">Peak QE (1300 nm)</span><div className="text-xl font-mono">{(calcQE(1300) * 100).toFixed(1)}%</div></div>
          <div><span className="text-gray-400 text-sm">Dark Current</span><div className="text-xl font-mono">{totalDark.toExponential(3)} A</div></div>
          <div><span className="text-gray-400 text-sm">R @ 1550 nm</span><div className="text-xl font-mono">{R1550.toFixed(3)} A/W</div></div>
          <div><span className="text-gray-400 text-sm">NEP @ 1550 nm</span><div className="text-xl font-mono">{nep1550.toExponential(3)} W/√Hz</div></div>
          <div className="sm:col-span-2"><span className="text-gray-400 text-sm">D* @ 1550 nm</span><div className="text-xl font-mono">{Dstar1550.toExponential(3)} cm·Hz^½/W</div></div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Spectral QE</h3>
          <Plot data={spectralQE} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "QE (%)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Dark Current vs Temperature</h3>
          <Plot data={darkVsTemp} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Temperature (K)", gridcolor: "#374151" },
            yaxis: { title: "I_dark (nA)", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
        </div>
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-gray-400">
        <h3 className="text-white font-semibold mb-2">Formulas</h3>
        <p>E_g(InₓGa₁₋ₓAs) = 0.36 + 0.63x + 0.43x² eV</p>
        <p>λ_c = 1240 / E_g</p>
        <p>α(λ) = α₀·√(hν - E_g) for direct bandgap</p>
        <p>η(λ) = (1-R)·(1 - exp(-α·d))</p>
      </div>
    </div>
  );
}
