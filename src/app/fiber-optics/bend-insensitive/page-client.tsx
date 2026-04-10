"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function BendInsensitivePage() {
  const [radius, setRadius] = useURLState("radius", 7.5); // mm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [trenchDepth, setTrenchDepth] = useURLState("trenchDepth", 0.018); // Δ (trench relative index)
  const [trenchWidth, setTrenchWidth] = useURLState("trenchWidth", 5); // μm
  const [hasTrench, setHasTrench] = useState(true);

  // Standard SMF parameters
  const n1 = 1.4682; const n2 = 1.4629;
  const a = 4.1; // core radius μm
  const delta = (n1 - n2) / n1;
  const NA = Math.sqrt(n1 * n1 - n2 * n2);
  const lambdaC = 2 * Math.PI * a * 1e-6 * NA / 2.405 * 1e9; // cutoff wavelength (nm)

  const calc = useMemo(() => {
    const R = radius * 1e-3;
    const lam = wavelength * 1e-9;
    const k0 = 2 * Math.PI / lam;

    // Marcuse bend loss: α = (C₁/(2a)) · exp(-2Rγ)
    // γ = (2Δ·n₁·k₀) · (2.748 - 0.996·λ/λc)
    const gamma = (2 * delta * n1 * k0) * (2.748 - 0.996 * wavelength / lambdaC);
    const V = k0 * a * 1e-6 * NA;
    // Simplified Marcuse coefficient C₁ ≈ √(π)/(2a) for fundamental mode
    const C1 = Math.sqrt(Math.PI) / (2 * a * 1e-6);
    const loss_std = C1 * Math.exp(-2 * R * gamma);
    const loss_std_dB = 10 * Math.log10(Math.exp(1)) * loss_std;

    // Bend-insensitive fiber with trench
    let loss_bi_dB = loss_std_dB;
    if (hasTrench) {
      // Trench reduces bend loss exponentially based on trench parameters
      // Effective improvement factor: exp(2 * Δ_trench * k * w_trench)
      const k = 2 * Math.PI * n2 / lam;
      const improvement = Math.exp(2 * trenchDepth * k * trenchWidth * 1e-6);
      loss_bi_dB = loss_std_dB / improvement;
    }

    // ITU-T G.657 categories (spec limits are for 20 turns around mandrel)
    const loss20 = loss_bi_dB * 20;
    let category = "Standard (G.652)";
    if (loss20 <= 0.2 && radius <= 7.5) category = "G.657.B3";
    else if (loss20 <= 0.5 && radius <= 7.5) category = "G.657.B2";
    else if (loss20 <= 1.5 && radius <= 5) category = "G.657.A2";
    else if (loss20 <= 1.5 && radius <= 7.5) category = "G.657.A1";

    return { loss_std_dB, loss_bi_dB, NA, category };
  }, [radius, wavelength, hasTrench, trenchDepth, trenchWidth]);

  const chartData = useMemo(() => {
    const radii = Array.from({ length: 100 }, (_, i) => 3 + i * 0.3);
    const lam = wavelength * 1e-9;
    const k0 = 2 * Math.PI / lam;
    const gamma = (2 * delta * n1 * k0) * (2.748 - 0.996 * wavelength / lambdaC);
    const C1 = Math.sqrt(Math.PI) / (2 * a * 1e-6);

    const stdLosses = radii.map(R => {
      const loss = C1 * Math.exp(-2 * (R * 1e-3) * gamma);
      return 10 * Math.log10(Math.exp(1)) * loss;
    });

    const biLosses = radii.map((R, i) => {
      if (!hasTrench) return stdLosses[i];
      const k = 2 * Math.PI * n2 / lam;
      const improvement = Math.exp(2 * trenchDepth * k * trenchWidth * 1e-6);
      return stdLosses[i] / improvement;
    });

    return [
      { x: radii, y: stdLosses, type: "scatter" as const, mode: "lines" as const, name: "Standard SMF", line: { color: "#f87171", width: 2 } },
      { x: radii, y: biLosses, type: "scatter" as const, mode: "lines" as const, name: "Bend-Insensitive", line: { color: "#34d399", width: 2 } },
      { x: [radius, radius], y: [1e-4, 10], type: "scatter" as const, mode: "lines" as const, name: "Current R", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [radius, wavelength, hasTrench, trenchDepth, trenchWidth]);

  const improvementData = useMemo(() => {
    const radii = Array.from({ length: 50 }, (_, i) => 5 + i * 0.5);
    const lam = wavelength * 1e-9;
    const k0 = 2 * Math.PI / lam;
    const gamma = (2 * delta * n1 * k0) * (2.748 - 0.996 * wavelength / lambdaC);
    const C1 = Math.sqrt(Math.PI) / (2 * a * 1e-6);

    const depths = [0.01, 0.015, 0.018, 0.025];
    return depths.map(td => ({
      x: radii,
      y: radii.map(R => {
        const loss = C1 * Math.exp(-2 * (R * 1e-3) * gamma);
        const loss_dB = 10 * Math.log10(Math.exp(1)) * loss;
        const k = 2 * Math.PI * n2 / lam;
        const imp = Math.exp(2 * td * k * trenchWidth * 1e-6);
        return loss_dB / imp;
      }),
      type: "scatter" as const, mode: "lines" as const,
      name: `Δ=${td}`, line: { width: 1.5 },
    }));
  }, [wavelength, trenchWidth]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Bend-Insensitive Fiber Design" description="Design and analyze bend-insensitive fibers with depressed cladding trenches (ITU-T G.657).">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Bend Radius (mm)" value={radius} onChange={setRadius} min={1} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={800} max={1700} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-gray-300 text-sm flex items-center gap-2">
            Depressed Trench
            <input type="checkbox" checked={hasTrench} onChange={e => setHasTrench(e.target.checked)} className="rounded" />
          </span>
        </label>
        {hasTrench && (
          <>
            <ValidatedNumberInput label="Trench Depth Δ" value={trenchDepth} onChange={setTrenchDepth} min={0.001} max={0.05} step="0.001" />
            <ValidatedNumberInput label="Trench Width (μm)" value={trenchWidth} onChange={setTrenchWidth} min={1} max={20} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Std SMF Loss</p>
          <p className="text-xl font-bold text-red-400">{calc.loss_std_dB < 0.001 ? "<0.001" : calc.loss_std_dB.toFixed(3)} dB/turn</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">BI Fiber Loss</p>
          <p className="text-xl font-bold text-green-400">{calc.loss_bi_dB < 0.001 ? "<0.001" : calc.loss_bi_dB.toFixed(4)} dB/turn</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Loss @ 20 turns</p>
          <p className="text-xl font-bold text-green-400">{calc.loss_bi_dB * 20 < 0.001 ? "<0.001" : (calc.loss_bi_dB * 20).toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ITU-T Category</p>
          <p className="text-xl font-bold text-blue-400">{calc.category}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Bend Loss vs Radius</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Bend Radius (mm)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Loss (dB/turn)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      {hasTrench && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold mb-3">Trench Depth Effect on Bend Loss</h3>
          <ChartPanel data={improvementData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Bend Radius (mm)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "BI Fiber Loss (dB/turn)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 300,
            legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
          }} />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>α_bend ≈ √π/(2a) · exp(-2Rγ) [Marcuse]</p>
          <p>γ = (2Δn₁k₀)(2.748 - 0.996λ/λ<sub>c</sub>)</p>
          <p>Improvement = exp(2Δ_trench · k · w_trench)</p>
          <p>G.657.A: ≤0.75 dB @ R=10mm, G.657.B: ≤0.25 dB @ R=7.5mm</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
