"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function GiresTournoisPage() {
  const [reflectivity, setReflectivity] = useURLState("reflectivity", 0.7);
  const [thickness, setThickness] = useURLState("thickness", 500); // nm
  const [n, setN] = useURLState("n", 2.3); // refractive index of coating
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm center
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 100); // nm range to plot

  // Gires-Tournois interferometer: high-reflectivity back surface (R₂≈1), partial front surface R₁
  // Phase response: φ(δ) = -2 arctan[(1-√R₁)/(1+√R₁) · tan(δ/2)]
  // where δ = 4πnL/λ is the round-trip phase
  // GDD = d²φ/dω² = -(2L²n²/c) · (1-R₁)·sin(δ) / (1+R₁-2√R₁·cos(δ))

  const chartData = useMemo(() => {
    const lambdas = Array.from({ length: 400 }, (_, i) => wavelength - bandwidth / 2 + i * bandwidth / 400);
    const phase: number[] = [];
    const gdd: number[] = [];

    const sqrtR = Math.sqrt(reflectivity);
    const L = thickness; // nm (coating thickness)
    const r = (1 - sqrtR) / (1 + sqrtR);

    for (const lam of lambdas) {
      const delta = 4 * Math.PI * n * L / lam;
      // Phase
      const phi = -2 * Math.atan(r * Math.tan(delta / 2));
      phase.push(phi);

      // GDD in fs²: GDD = -8n²L²(1-R)√R·sin(δ) / [c²·(1+R+2√R·cos(δ))²]
      // Derived: dφ/dδ = -(1-R)/(1+R+2√R·cos δ), τ = (2nL/c)(1-R)/(1+R+2√R·cos δ),
      // GDD = d²φ/dω² = -8n²L²(1-R)√R·sin(δ) / [c²·(1+R+2√R·cos δ)²]
      const c_nm_fs = 299792.458; // speed of light in nm/fs
      const denom_gdd = 1 + reflectivity + 2 * sqrtR * Math.cos(delta);
      const gddVal = -8 * n * n * L * L * (1 - reflectivity) * sqrtR * Math.sin(delta) / (c_nm_fs * c_nm_fs * denom_gdd * denom_gdd);
      gdd.push(gddVal);
    }

    return [
      { x: lambdas, y: phase, type: "scatter", mode: "lines", name: "Phase φ(λ)", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: lambdas, y: gdd, type: "scatter", mode: "lines", name: "GDD (fs²)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
    ];
  }, [reflectivity, thickness, n, wavelength, bandwidth]);

  // Reflectivity vs wavelength
  const reflectData = useMemo(() => {
    const lambdas = Array.from({ length: 400 }, (_, i) => wavelength - bandwidth / 2 + i * bandwidth / 400);
    const sqrtR = Math.sqrt(reflectivity);
    const r = (1 - sqrtR) / (1 + sqrtR);
    const Rs = lambdas.map(lam => {
      const delta = 4 * Math.PI * n * thickness / lam;
      const phi = -2 * Math.atan(r * Math.tan(delta / 2));
      // Amplitude reflectivity of GTI is always √R₁ (high)
      // The power reflectivity is R₁ (constant) - that's the key feature of GTI
      return reflectivity;
    });
    return [{ x: lambdas, y: Rs, type: "scatter", mode: "lines", name: "Reflectivity", line: { color: "#34d399", width: 2 } }];
  }, [reflectivity, thickness, n, wavelength, bandwidth]);

  // Group delay
  const gdData = useMemo(() => {
    const lambdas = Array.from({ length: 400 }, (_, i) => wavelength - bandwidth / 2 + i * bandwidth / 400);
    const sqrtR = Math.sqrt(reflectivity);
    const r = (1 - sqrtR) / (1 + sqrtR);

    const gd = lambdas.map(lam => {
      const delta = 4 * Math.PI * n * thickness / lam;
      // dφ/dδ = -(1-R)/(1+R+2√R·cos δ) (derived from GTI phase)
      // τ = -dφ/dω = (2nL/c)·(1-R)/(1+R+2√R·cos δ) [in fs, with c in nm/fs]
      const denom_gd = 1 + reflectivity + 2 * sqrtR * Math.cos(delta);
      const tau = 2 * n * thickness * (1 - reflectivity) / (299792.458 * denom_gd); // fs
      return tau;
    });

    return [{ x: lambdas, y: gd, type: "scatter", mode: "lines", name: "Group Delay (fs)", line: { color: "#fbbf24", width: 2 } }];
  }, [reflectivity, thickness, n, wavelength, bandwidth]);

  const layout1 = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Phase (rad)", gridcolor: "#374151" },
    yaxis2: { title: "GDD (fs²)", overlaying: "y", side: "right", gridcolor: "transparent", titlefont: { color: "#f87171" }, tickfont: { color: "#f87171" } },
    margin: { t: 30, r: 70, b: 50, l: 70 },
    legend: { x: 0.01, y: 0.99, bgcolor: "transparent" },
  };

  const layout2 = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Group Delay (fs)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const sqrtR = Math.sqrt(reflectivity);
  const deltaCenter = 4 * Math.PI * n * thickness / wavelength;
  const denomCenter = 1 + reflectivity + 2 * sqrtR * Math.cos(deltaCenter);
  const gddCenter = -8 * n * n * thickness * thickness * (1 - reflectivity) * sqrtR * Math.sin(deltaCenter) / (299792.458 * 299792.458 * denomCenter * denomCenter);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Gires-Tournois Interferometer" description="Dispersion control via a GTI — constant reflectivity with tunable group delay dispersion.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">δ</span> = 4πnL / λ (round-trip phase)</p>
        <p><span className="text-blue-400">φ(δ)</span> = −2 arctan[(1−√R)/(1+√R) · tan(δ/2)]</p>
        <p><span className="text-blue-400">GDD</span> = −8n²L²(1−R)√R·sin(δ) / [c²·(1+R+2√R·cos(δ))²]</p>
        <p className="text-yellow-400">Key: Power reflectivity = R₁ (constant) regardless of δ</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Front Surface R₁" value={reflectivity} onChange={setReflectivity} min={0.01} max={0.99} step="0.01" />
        <ValidatedNumberInput label="Coating Thickness (nm)" value={thickness} onChange={setThickness} />
        <ValidatedNumberInput label="Refractive Index n" value={n} onChange={setN} step="0.01" />
        <ValidatedNumberInput label="Center λ (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Plot Bandwidth (nm)" value={bandwidth} onChange={setBandwidth} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Power Reflectivity</p>
          <p className="text-xl font-bold text-green-400">{(reflectivity * 100).toFixed(1)}% (constant)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Round-trip Phase δ₀</p>
          <p className="text-xl font-bold text-blue-400">{(deltaCenter % (2 * Math.PI)).toFixed(3)} rad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">GDD at Center λ</p>
          <p className="text-xl font-bold text-orange-400">{gddCenter.toFixed(1)} fs²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm text-gray-400 mb-2">Phase & GDD vs Wavelength</h3>
        <ChartPanel data={chartData} layout={layout1} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Group Delay</h3>
        <ChartPanel data={gdData} layout={layout2} />
      </div>
    </CalculatorShell>
  );
}
