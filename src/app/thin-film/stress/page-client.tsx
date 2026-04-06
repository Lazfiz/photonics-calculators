"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function StressPage() {
  const [filmStress, setFilmStress] = useState(-200); // MPa
  const [filmThickness, setFilmThickness] = useURLState("filmThickness", 500); // nm
  const [substrateThickness, setSubstrateThickness] = useURLState("substrateThickness", 1); // mm
  const [eSubstrate, setESubstrate] = useURLState("eSubstrate", 70); // GPa (glass ~70)
  const [nuSubstrate, setNuSubstrate] = useURLState("nuSubstrate", 0.22); // Poisson's ratio

  const chartData = useMemo(() => {
    const thicknesses = Array.from({ length: 200 }, (_, i) => 100 + i * 4900 / 200);
    const curvatures = thicknesses.map(tf => {
      const tf_m = tf * 1e-9;
      const ts_m = substrateThickness * 1e-3;
      const sigma = filmStress * 1e6; // Pa
      const E = eSubstrate * 1e9;
      const R = (E * ts_m * ts_m) / (6 * sigma * tf_m);
      return 1 / R; // curvature 1/m
    });
    const stresses = Array.from({ length: 200 }, (_, i) => -500 + i * 1000 / 200);
    const curvForStress = stresses.map(s => {
      const tf_m = filmThickness * 1e-9;
      const ts_m = substrateThickness * 1e-3;
      const sigma = s * 1e6;
      const E = eSubstrate * 1e9;
      const R = (E * ts_m * ts_m) / (6 * sigma * tf_m);
      return 1 / R;
    });
    return [
      { x: thicknesses, y: curvatures, type: "scatter" as const, mode: "lines" as const, name: "vs Thickness", line: { color: "#60a5fa" }, xaxis: "x" },
      { x: stresses, y: curvForStress, type: "scatter" as const, mode: "lines" as const, name: "vs Stress", line: { color: "#f87171" }, xaxis: "x2" },
    ];
  }, [filmStress, filmThickness, substrateThickness, eSubstrate, nuSubstrate]);

  const tf_m = filmThickness * 1e-9;
  const ts_m = substrateThickness * 1e-3;
  const sigma = filmStress * 1e6;
  const E = eSubstrate * 1e9;
  const R = (E * ts_m * ts_m) / (6 * sigma * tf_m);
  const curvature = 1 / R;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Coating Stress & Curvature" description="Stoney's equation: σ = E·ts²/(6·R·tf). Relates film stress to substrate curvature.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Film Stress (MPa, compressive = negative)" value={filmStress} onChange={setFilmStress} />
        <ValidatedNumberInput label="Film Thickness (nm)" value={filmThickness} onChange={setFilmThickness} />
        <ValidatedNumberInput label="Substrate Thickness (mm)" value={substrateThickness} onChange={setSubstrateThickness} step="0.1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">E<sub>substrate</sub> (GPa)</span>
          <input type="number" value={eSubstrate} onChange={e => setESubstrate(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Radius of curvature = <span className="text-blue-400 font-mono">{R.toFixed(2)} m</span></p>
        <p className="text-gray-300">Curvature (1/R) = <span className="text-blue-400 font-mono">{curvature.toExponential(3)} m⁻¹</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        grid: { rows: 1, columns: 2, pattern: "independent" },
        xaxis: { title: "Film Thickness (nm)", gridcolor: "#374151", domain: [0, 0.47] },
        xaxis2: { title: "Film Stress (MPa)", gridcolor: "#374151", anchor: "y2", domain: [0.53, 1] },
        yaxis: { title: "Curvature (m⁻¹)", gridcolor: "#374151" },
        yaxis2: { title: "Curvature (m⁻¹)", gridcolor: "#374151", anchor: "x2" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true
      }} />
    </CalculatorShell>
  );
}
