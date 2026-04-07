"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function FiberCharacterizationPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [coreIndex, setCoreIndex] = useState(1.4682);
  const [claddingIndex, setCladdingIndex] = useState(1.4629);
  const [coreRadius, setCoreRadius] = useState(4.1); // μm
  const [cutoffWavelength, setCutoffWavelength] = useState(1260); // nm
  const [attenuation, setAttenuation] = useState(0.2); // dB/km

  const calc = useMemo(() => {
    const n1 = coreIndex;
    const n2 = claddingIndex;
    const a = coreRadius * 1e-6;
    const lam = wavelength * 1e-9;
    const NA = Math.sqrt(n1 * n1 - n2 * n2);
    const delta = (n1 - n2) / n1;
    const V = (2 * Math.PI * a * NA) / lam;

    // MFD (Marcuse approximation for SMF)
    const w = a * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6)); // mode field radius
    const MFD = 2 * w * 1e6; // μm

    // Effective area A_eff
    const A_eff = Math.PI * w * w * 1e12; // μm²

    // Chromatic dispersion
    const S0 = 0.092; // ps/(nm²·km) typical slope
    const lam0 = 1310; // nm zero dispersion
    const D = (S0 / 4) * (wavelength - Math.pow(lam0, 4) / Math.pow(wavelength, 3));

    // Group velocity
    const beta1 = n1 / 3e8; // simplified
    const v_g = 1 / beta1;

    // Nonlinear coefficient γ
    const n2_nl = 2.6e-20; // m²/W nonlinear refractive index
    const gamma = (2 * Math.PI * n2_nl) / (lam * A_eff * 1e-12) * 1e3; // 1/(W·km)

    // Confinement factor Γ
    const Gamma = 1 - 1 / V; // simplified for SMF

    // Numerical aperture verification
    const acceptance_angle = Math.asin(Math.min(NA, 1)) * 180 / Math.PI;

    // Effective refractive index (normalized propagation constant)
    const b_param = 1 - Math.pow(n2 / n1, 2); // normalized
    const n_eff_approx = n2 + (n1 - n2) * 0.8; // rough approximation

    return { NA, V, MFD, A_eff, D, gamma, Gamma, acceptance_angle, delta, n_eff_approx, lam0 };
  }, [wavelength, coreIndex, claddingIndex, coreRadius, cutoffWavelength]);

  const vNumberData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 800 + i * 5);
    const NA = Math.sqrt(coreIndex ** 2 - claddingIndex ** 2);
    const a = coreRadius * 1e-6;
    const Vs = wls.map(wl => (2 * Math.PI * a * NA) / (wl * 1e-9));
    return [
      { x: wls, y: Vs, type: "scatter" as const, mode: "lines" as const, name: "V-number", line: { color: "#60a5fa", width: 2 } },
      { x: [800, 1800], y: [2.405, 2.405], type: "scatter" as const, mode: "lines" as const, name: "V=2.405 (cutoff)", line: { color: "#f87171", dash: "dash" } },
      { x: [wavelength, wavelength], y: [0, 5], type: "scatter" as const, mode: "lines" as const, name: "Current λ", line: { color: "#fbbf24", dash: "dashdot" } },
    ];
  }, [wavelength, coreIndex, claddingIndex, coreRadius]);

  const mfdData = useMemo(() => {
    const wls = Array.from({ length: 150 }, (_, i) => 1200 + i * 4);
    const NA = Math.sqrt(coreIndex ** 2 - claddingIndex ** 2);
    const a = coreRadius * 1e-6;
    return [{
      x: wls,
      y: wls.map(wl => {
        const V = (2 * Math.PI * a * NA) / (wl * 1e-9);
        const w = a * (0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6));
        return 2 * w * 1e6;
      }),
      type: "scatter" as const, mode: "lines" as const, name: "MFD",
      line: { color: "#34d399", width: 2 },
    }];
  }, [coreIndex, claddingIndex, coreRadius]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Characterization" description="Comprehensive fiber parameter calculation: V-number, MFD, effective area, nonlinear coefficient, dispersion, and confinement.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={800} max={1700} />
        <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} step="0.0001" />
        <ValidatedNumberInput label="Cladding Index n₂" value={claddingIndex} onChange={setCladdingIndex} step="0.0001" />
        <ValidatedNumberInput label="Core Radius (μm)" value={coreRadius} onChange={setCoreRadius} min={1} step="0.1" />
        <ValidatedNumberInput label="Cutoff Wavelength (nm)" value={cutoffWavelength} onChange={setCutoffWavelength} />
        <ValidatedNumberInput label="Attenuation (dB/km)" value={attenuation} onChange={setAttenuation} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V-number</p>
          <p className="text-xl font-bold text-blue-400">{calc.V.toFixed(3)}</p>
          <p className="text-xs text-gray-500">{calc.V < 2.405 ? "Single-mode" : "Multi-mode"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">MFD (μm)</p>
          <p className="text-xl font-bold text-green-400">{calc.MFD.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">A_eff (μm²)</p>
          <p className="text-xl font-bold text-yellow-400">{calc.A_eff.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">γ (1/W/km)</p>
          <p className="text-xl font-bold text-purple-400">{calc.gamma.toFixed(3)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">NA</p>
          <p className="text-xl font-bold text-cyan-400">{calc.NA.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Acceptance Angle</p>
          <p className="text-xl font-bold text-orange-400">{calc.acceptance_angle.toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">D (ps/nm/km)</p>
          <p className="text-xl font-bold text-pink-400">{calc.D.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δ (rel. index)</p>
          <p className="text-xl font-bold text-teal-400">{(calc.delta * 100).toFixed(3)}%</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">V-number vs Wavelength</h3>
          <ChartPanel data={vNumberData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "λ (nm)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "V", color: "#9ca3af", gridcolor: "#374151", range: [0, 5] },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 320,
            legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af", size: 10 } },
          }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Mode Field Diameter vs Wavelength</h3>
          <ChartPanel data={mfdData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "λ (nm)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "MFD (μm)", color: "#9ca3af", gridcolor: "#374151" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 320,
            showlegend: false,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>V = π · d · NA / λ</p>
          <p>w/a ≈ 0.65 + 1.619/V^1.5 + 2.879/V^6 [Marcuse MFD]</p>
          <p>A_eff = π · w²</p>
          <p>γ = 2πn₂ / (λA_eff) [nonlinear coefficient]</p>
          <p>D(λ) = S₀/4 · (λ - λ₀⁴/λ³)</p>
          <p>NA = √(n₁² - n₂²)</p>
          <p>θ_a = arcsin(NA) [acceptance half-angle]</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
