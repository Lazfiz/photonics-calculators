"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DoubleLayerARPage() {
  const [n1, setN1] = useState(1.38);
  const [n2, setN2] = useState(1.70);
  const [nSub, setNSub] = useState(1.52);
  const [nInc, setNInc] = useState(1.0);
  const [designWl, setDesignWl] = useState(550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 300 + i * 500 / 400);
    const d1 = designWl / (4 * n1);
    const d2 = designWl / (4 * n2);

    const R = wls.map(wl => {
      // Transfer matrix method for 2 layers
      const delta1 = (2 * Math.PI * n1 * d1) / wl;
      const delta2 = (2 * Math.PI * n2 * d2) / wl;

      // Interface Fresnel coefficients
      const r01 = (nInc - n1) / (nInc + n1);
      const r12 = (n1 - n2) / (n1 + n2);
      const r23 = (n2 - nSub) / (n2 + nSub);

      // 2x2 matrices for each layer
      // M_j = [[cos(d_j), -i*sin(d_j)/n_j], [-i*n_j*sin(d_j), cos(d_j)]]
      // Product M = M1 * M2
      const c1 = Math.cos(delta1), s1 = Math.sin(delta1);
      const c2 = Math.cos(delta2), s2 = Math.sin(delta2);

      // M1 * M2
      const M11 = c1 * c2 - (s1 * s2 * n2) / n1;
      const M12 = (-1 / n1) * c1 * s2 - (1 / n2) * s1 * c2;
      const M21 = -n1 * s1 * c2 - n2 * c1 * s2;
      const M22 = c1 * c2 - (n1 * s1 * s2) / n2;

      // r = (M11*n_inc + M12*n_inc*n_sub - M21 - M22*n_sub) / (M11*n_inc + M12*n_inc*n_sub + M21 + M22*n_sub)
      const num = M11 * nInc + M12 * nInc * nSub - M21 - M22 * nSub;
      const den = M11 * nInc + M12 * nInc * nSub + M21 + M22 * nSub;
      return (num / den) ** 2;
    });

    const T = wls.map((_, i) => 1 - R[i]);
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [n1, n2, nSub, nInc, designWl]);

  const d1 = designWl / (4 * n1);
  const d2 = designWl / (4 * n2);
  const optN1 = Math.pow(nInc * nInc * nInc * nSub, 0.25);
  const optN2 = Math.pow(nInc * nSub * nSub * nSub, 0.25);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Two-Layer AR Coating</h1>
      <p className="text-gray-400 mb-8">
        Transfer-matrix method for two-layer V-coat or W-coat AR designs. Both layers at quarter-wave optical thickness.
        Optimal indices: n₁ = (n<sub>inc</sub>³ · n<sub>sub</sub>)<sup>¼</sup>, n₂ = (n<sub>inc</sub> · n<sub>sub</sub>³)<sup>¼</sup>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n₁ (outer layer)</span>
          <input type="number" value={n1} onChange={e => setN1(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n₂ (inner layer)</span>
          <input type="number" value={n2} onChange={e => setN2(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>substrate</sub></span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>incident</sub></span>
          <input type="number" value={nInc} onChange={e => setNInc(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Design λ (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">d₁ = λ/(4n₁) = <span className="text-blue-400 font-mono">{d1.toFixed(1)} nm</span></p>
        <p className="text-gray-300">d₂ = λ/(4n₂) = <span className="text-blue-400 font-mono">{d2.toFixed(1)} nm</span></p>
        <p className="text-gray-300">Optimal n₁ = <span className="text-green-400 font-mono">{optN1.toFixed(3)}</span></p>
        <p className="text-gray-300">Optimal n₂ = <span className="text-green-400 font-mono">{optN2.toFixed(3)}</span></p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "R / T", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
      }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
