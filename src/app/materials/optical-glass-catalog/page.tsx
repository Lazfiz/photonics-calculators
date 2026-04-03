"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface GlassEntry {
  name: string;
  manufacturer: string;
  nd: number;
  vd: number;
  B: number[];
  C: number[];
  density: number;
  Tg: number;
  dndt: number;
}

const CATALOG: Record<string, GlassEntry> = {
  BK7: { name: "BK7", manufacturer: "SCHOTT", nd: 1.5168, vd: 64.17, B: [1.03961212, 0.231792344, 1.01046945], C: [0.00600069867, 0.0200179144, 103.560653], density: 2.51, Tg: 557, dndt: 1.1e-6 },
  SF11: { name: "SF11", manufacturer: "SCHOTT", nd: 1.7847, vd: 25.76, B: [1.73759695, 0.313747346, 1.89878101], C: [0.013188707, 0.0623068142, 155.23629], density: 3.14, Tg: 498, dndt: -1.0e-6 },
  F2: { name: "F2", manufacturer: "SCHOTT", nd: 1.6200, vd: 36.37, B: [1.34533359, 0.209073176, 0.937357162], C: [0.0097863, 0.0476865628, 111.8877], density: 3.61, Tg: 434, dndt: 1.5e-6 },
  SK16: { name: "SK16", manufacturer: "SCHOTT", nd: 1.6227, vd: 56.72, B: [1.22315922, 0.236196226, 1.06399336], C: [0.00588959, 0.0130447795, 85.01451], density: 3.35, Tg: 639, dndt: -0.5e-6 },
  LaK9: { name: "LaK9", manufacturer: "SCHOTT", nd: 1.6910, vd: 54.71, B: [1.44551749, 0.25371485, 1.24855657], C: [0.00596609, 0.013339644, 83.10249], density: 3.48, Tg: 658, dndt: -2.5e-6 },
  SFL6: { name: "SFL6", manufacturer: "OHARA", nd: 1.8052, vd: 25.39, B: [1.694854, 0.308416, 1.749507], C: [0.012048, 0.058467, 145.81], density: 3.73, Tg: 485, dndt: 0.3e-6 },
  NSL36: { name: "NSL36", manufacturer: "OHARA", nd: 1.8061, vd: 40.92, B: [1.5933, 0.34462, 1.7993], C: [0.01078, 0.04785, 112.55], density: 3.62, Tg: 530, dndt: -1.2e-6 },
  BAK4: { name: "BAK4", manufacturer: "SCHOTT", nd: 1.5688, vd: 56.06, B: [1.1467, 0.2083, 0.9182], C: [0.00579, 0.01205, 92.56], density: 3.10, Tg: 598, dndt: 0.8e-6 },
  LLF1: { name: "LLF1", manufacturer: "SCHOTT", nd: 1.5481, vd: 45.89, B: [1.0846, 0.2398, 0.9490], C: [0.00610, 0.01812, 105.68], density: 2.94, Tg: 530, dndt: 1.4e-6 },
  FK5: { name: "FK5", manufacturer: "SCHOTT", nd: 1.4875, vd: 70.41, B: [0.9982, 0.2085, 0.8851], C: [0.00564, 0.01412, 96.78], density: 2.45, Tg: 545, dndt: -0.3e-6 },
};

const sellmeierN = (wl_um: number, B: number[], C: number[]) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + B[0] * l2 / (l2 - C[0]) + B[1] * l2 / (l2 - C[1]) + B[2] * l2 / (l2 - C[2]));
};

export default function OpticalGlassCatalogPage() {
  const [selected, setSelected] = useState<string[]>(["BK7", "SF11", "LaK9", "FK5"]);

  const toggleGlass = (g: string) => setSelected(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const ndVdChart = useMemo(() => ({
    data: Object.entries(CATALOG).map(([key, g]) => ({
      x: [g.vd], y: [g.nd],
      type: "scatter" as const, mode: "markers+text" as const,
      name: g.name, text: [g.name],
      textposition: "top center" as const,
      marker: { color: selected.includes(key) ? "#60a5fa" : "#374151", size: selected.includes(key) ? 12 : 8 }
    })),
    layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "V<sub>d</sub> (Abbe Number)", font: { color: "#9ca3af" } }, range: [20, 80] }, yaxis: { ...baseLayout.yaxis, title: { text: "n<sub>d</sub>", font: { color: "#9ca3af" } }, range: [1.45, 1.85] }, title: { text: "Glass Map (n<sub>d</sub> vs V<sub>d</sub>)", font: { color: "#e5e7eb" } } }
  }), [selected]);

  const dispersionChart = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 0.3 + i * 0.007);
    const colors = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee", "#84cc16", "#e879f9"];
    return {
      data: selected.map((key, i) => {
        const g = CATALOG[key];
        return { x: wls.map(w => w * 1000), y: wls.map(w => sellmeierN(w, g.B, g.C)), type: "scatter" as const, mode: "lines" as const, name: g.name, line: { color: colors[i % colors.length] } };
      }),
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Refractive Index n(λ)", font: { color: "#9ca3af" } } }, title: { text: "Dispersion Curves", font: { color: "#e5e7eb" } } }
    };
  }, [selected]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">Optical Glass Catalog</h1>
      <p className="text-gray-400 mb-8">Interactive glass map and dispersion curves. <span className="text-gray-500">Sellmeier: n²(λ) = 1 + Σ B<sub>i</sub>λ²/(λ² - C<sub>i</sub>)</span></p>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Glasses (click to toggle)</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATALOG).map(([key, g]) => (
            <button key={key} onClick={() => toggleGlass(key)} className={`px-3 py-1 rounded text-sm ${selected.includes(key) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>{g.name}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Plot data={ndVdChart.data} layout={ndVdChart.layout} config={plotConfig} />
        <Plot data={dispersionChart.data} layout={dispersionChart.layout} config={plotConfig} />
      </div>

      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Glass Properties Table</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700 text-gray-400">
            <th className="py-2 px-3 text-left">Glass</th><th className="py-2 px-3">Mfg</th><th className="py-2 px-3">n<sub>d</sub></th><th className="py-2 px-3">V<sub>d</sub></th><th className="py-2 px-3">ρ (g/cm³)</th><th className="py-2 px-3">T<sub>g</sub> (°C)</th><th className="py-2 px-3">dn/dT (×10⁻⁶/K)</th>
          </tr></thead>
          <tbody>
            {Object.entries(CATALOG).map(([key, g]) => (
              <tr key={key} className="border-b border-gray-800 hover:bg-gray-900">
                <td className="py-2 px-3 font-medium">{g.name}</td>
                <td className="py-2 px-3 text-center">{g.manufacturer}</td>
                <td className="py-2 px-3 text-center">{g.nd.toFixed(4)}</td>
                <td className="py-2 px-3 text-center">{g.vd.toFixed(2)}</td>
                <td className="py-2 px-3 text-center">{g.density.toFixed(2)}</td>
                <td className="py-2 px-3 text-center">{g.Tg}</td>
                <td className="py-2 px-3 text-center">{g.dndt > 0 ? "+" : ""}{(g.dndt * 1e6).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const baseLayout = {
  paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
  xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" },
  yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" },
  margin: { t: 50, r: 20, b: 50, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" },
};
const plotConfig = { responsive: true, displayModeBar: false };
