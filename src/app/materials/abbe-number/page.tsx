"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const MATERIALS: Record<string, { name: string; B: number[]; C: number[] }> = {
  BK7: { name: "BK7", B: [1.03961212, 0.231792344, 1.01046945], C: [0.00600069867, 0.0200179144, 103.560653] },
  FusedSilica: { name: "Fused Silica", B: [0.6961663, 0.4079426, 0.8974794], C: [0.0684043, 0.1162414, 9.896161] },
  SF11: { name: "SF11", B: [1.73759695, 0.313747346, 1.89878101], C: [0.013188707, 0.0623068142, 155.23629] },
  CaF2: { name: "CaF₂", B: [0.5675888, 0.4710914, 3.8484723], C: [0.00252643, 0.010078333, 1200.556] },
};

const sellmeierN = (wl_um: number, B: number[], C: number[]) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + B[0] * l2 / (l2 - C[0]) + B[1] * l2 / (l2 - C[1]) + B[2] * l2 / (l2 - C[2]));
};

export default function AbbeNumberPage() {
  const [material, setMaterial] = useState<keyof typeof MATERIALS>("BK7");

  const calc = useMemo(() => {
    const mat = MATERIALS[material];
    const nF = sellmeierN(0.48613, mat.B, mat.C);  // F-line (486.1 nm)
    const nD = sellmeierN(0.58756, mat.B, mat.C);  // D-line (587.6 nm)
    const nC = sellmeierN(0.65627, mat.B, mat.C);  // C-line (656.3 nm)
    const Vd = (nD - 1) / (nF - nC);
    return { nF, nD, nC, Vd };
  }, [material]);

  const chartData = useMemo(() => {
    const mat = MATERIALS[material];
    const wls = Array.from({ length: 200 }, (_, i) => 0.3 + i * 0.007); // µm
    const ns = wls.map(wl => sellmeierN(wl, mat.B, mat.C));

    return [
      { x: wls.map(w => w * 1000), y: ns, type: "scatter" as const, mode: "lines" as const, name: "n(λ)", line: { color: "#60a5fa" } },
      { x: [486.1, 587.6, 656.3], y: [calc.nF, calc.nD, calc.nC], type: "scatter" as const, mode: "markers" as const, name: "F/D/C lines", marker: { color: "#f87171", size: 10 } },
    ];
  }, [material, calc]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">Abbe Number (V<sub>d</sub>)</h1>
      <p className="text-gray-400 mb-8">Calculate Abbe number from Sellmeier coefficients. V<sub>d</sub> = (n<sub>D</sub> - 1)/(n<sub>F</sub> - n<sub>C</sub>).</p>

      <div className="mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Material</span>
          <select value={material} onChange={e => setMaterial(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n<sub>F</sub> (486.1 nm)</p>
          <p className="text-xl font-bold text-red-400">{calc.nF.toFixed(5)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n<sub>D</sub> (587.6 nm)</p>
          <p className="text-xl font-bold text-yellow-400">{calc.nD.toFixed(5)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n<sub>C</sub> (656.3 nm)</p>
          <p className="text-xl font-bold text-green-400">{calc.nC.toFixed(5)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Abbe Number V<sub>d</sub></p>
          <p className="text-xl font-bold text-blue-400">{calc.Vd.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Refractive Index n", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
