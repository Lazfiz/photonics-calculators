"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { refractiveIndex, schottDnDt } from "../../../physics/materials/sellmeier";
import { SCHOTT_GLASSES, type GlassId } from "../../../physics/materials/sellmeier-data";

const GLASS_IDS = Object.keys(SCHOTT_GLASSES) as GlassId[];
const COLORS = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee", "#84cc16", "#e879f9"];
// e-line (mercury 546.07 nm), where SCHOTT data sheets quote dn/dT.
const LAMBDA_E = 546.07e-9;

export default function OpticalGlassCatalogPage() {
  const [selected, setSelected] = useState<GlassId[]>(["N-BK7", "N-SF11", "N-LAK9", "N-FK5"]);

  const toggleGlass = (g: GlassId) => setSelected((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const ndVdChart = useMemo(() => ({
    data: GLASS_IDS.map((id) => {
      const g = SCHOTT_GLASSES[id];
      return {
        x: [g.vd], y: [g.nd],
        type: "scatter" as const, mode: "markers+text" as const,
        name: g.name, text: [g.name],
        textposition: "top center" as const,
        marker: { color: selected.includes(id) ? "#60a5fa" : "#374151", size: selected.includes(id) ? 12 : 8 },
      };
    }),
    layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "V<sub>d</sub> (Abbe Number)", font: { color: "#9ca3af" } }, range: [20, 80] }, yaxis: { ...baseLayout.yaxis, title: { text: "n<sub>d</sub>", font: { color: "#9ca3af" } }, range: [1.45, 1.9] }, title: { text: "Glass Map (n<sub>d</sub> vs V<sub>d</sub>)", font: { color: "#e5e7eb" } } },
  }), [selected]);

  const dispersionChart = useMemo(() => ({
    data: selected.map((id, i) => {
      const g = SCHOTT_GLASSES[id];
      const [lo, hi] = g.model.range;
      const wl = Array.from({ length: 201 }, (_, k) => lo + (k * (hi - lo)) / 200);
      return {
        x: wl.map((w) => w * 1e9), y: wl.map((w) => refractiveIndex(g.model, w)),
        type: "scatter" as const, mode: "lines" as const, name: g.name, line: { color: COLORS[i % COLORS.length] },
      };
    }),
    layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Refractive Index n(λ)", font: { color: "#9ca3af" } } }, title: { text: "Dispersion Curves", font: { color: "#e5e7eb" } } },
  }), [selected]);

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Glasses (click to toggle)</h3>
        <div role="group" aria-label="Glasses" className="flex flex-wrap gap-2">
          {GLASS_IDS.map((id) => (
            <button key={id} onClick={() => toggleGlass(id)} aria-pressed={selected.includes(id)}
              className={`px-3 py-1 rounded text-sm ${selected.includes(id) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {SCHOTT_GLASSES[id].name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartPanel data={ndVdChart.data} layout={ndVdChart.layout} config={plotConfig} />
        <ChartPanel data={dispersionChart.data} layout={dispersionChart.layout} config={plotConfig} />
      </div>

      <div className="overflow-x-auto mb-8">
        <h3 className="text-lg font-semibold mb-3">SCHOTT Glass Properties</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-700 text-gray-400">
            <th className="py-2 px-3 text-left">Glass</th><th className="py-2 px-3">n<sub>d</sub></th><th className="py-2 px-3">V<sub>d</sub></th>
            <th className="py-2 px-3">ρ (g/cm³)</th><th className="py-2 px-3">dn/dT at 546 nm, 20 °C (×10⁻⁶/K)</th>
          </tr></thead>
          <tbody>
            {GLASS_IDS.map((id) => {
              const g = SCHOTT_GLASSES[id];
              const dndt = schottDnDt(g.model, g.thermal, LAMBDA_E, 20) * 1e6;
              return (
                <tr key={id} className="border-b border-gray-800 hover:bg-gray-900">
                  <td className="py-2 px-3 font-medium">{g.name}</td>
                  <td className="py-2 px-3 text-center">{g.nd.toFixed(5)}</td>
                  <td className="py-2 px-3 text-center">{g.vd.toFixed(2)}</td>
                  <td className="py-2 px-3 text-center">{(g.density / 1000).toFixed(2)}</td>
                  <td className="py-2 px-3 text-center">{dndt > 0 ? "+" : ""}{dndt.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Data</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">n²(λ) = 1 + Σ Bᵢλ²/(λ² − Cᵢ),   dn/dT = (n² − 1)/(2n) · (D₀ + E₀/(λ² − λ<sub>TK</sub>²)) at 20 °C</p>
          <p>
            Sellmeier coefficients, n<sub>d</sub>, V<sub>d</sub>, density and thermo-optic coefficients from the SCHOTT
            optical glass catalog (2017). Each formula reproduces its catalog n<sub>d</sub> to 1e-5 and V<sub>d</sub> to 0.01.
            dn/dT is the absolute coefficient (in vacuum) from SCHOTT TIE-19. Curves cover each glass&apos;s 0.3–2.5 µm
            data range.
          </p>
        </div>
      </div>
    </>
  );
}

const baseLayout = {
  paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
  xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" },
  yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" },
  margin: { t: 50, r: 20, b: 50, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" },
};
const plotConfig = { responsive: true, displayModeBar: false };
