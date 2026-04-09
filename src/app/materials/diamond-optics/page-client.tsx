"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
// Diamond Sellmeier: D. D. Duvvuri, et al.
const sellmeierN = (wl_um: number) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + 0.3306 * l2 / (l2 - 0.0) + 4.3356 * l2 / (l2 - 0.0) + 0.0);
};
// Simplified: n ≈ 2.38 + small dispersion. Use measured values instead.
const diamondN = (wl_nm: number) => {
  // Approximation from data
  const wl_um = wl_nm / 1000;
  return 2.38 + 0.03 / (wl_um * wl_um) - 0.0005;
};

const diamondData = {
  n589: 2.4175, // at 589nm
  n500: 2.4264,
  n400: 2.4630,
  n300: 2.5410,
  n200: 2.7150,
  n10600: 2.3819,
  thermalCond: { value: 2200, unit: "W/(m·K)" }, // type IIa at RT
  hardness: { value: 10000, unit: "kg/mm² (Vickers)" },
  bandgap: 5.47, // eV
  dn_dT: 1.0e-6, // ×10⁻⁶/K
  thermalExpansion: 0.8e-6, // ×10⁻⁶/K
  transmission: [0.225, 5000], // nm (UV cutoff to thermal)
  lattice: 3.567, // Å
  density: 3.515, // g/cm³
};

export default function DiamondOpticsPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 589);

  const n = useMemo(() => diamondN(wavelength), [wavelength]);

  const dispersionChart = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 150 + i * 15);
    const ns = wls.map(diamondN);
    return {
      data: [{ x: wls, y: ns, type: "scatter" as const, mode: "lines" as const, line: { color: "#60a5fa" } },
        { x: [wavelength], y: [n], type: "scatter" as const, mode: "markers" as const, marker: { color: "#f87171", size: 12 } }],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Refractive Index n", font: { color: "#9ca3af" } } }, title: { text: "Diamond Dispersion", font: { color: "#e5e7eb" } } }
    };
  }, [wavelength, n]);

  const compareChart = useMemo(() => {
    const materials = ["Diamond", "Sapphire", "SiC", "ZnSe", "Ge"];
    const n_vals = [2.42, 1.77, 2.65, 2.40, 4.00];
    const tc_vals = [2200, 35, 490, 18, 60];
    return {
      data: [
        { x: materials, y: n_vals, type: "bar" as const, name: "n (at 589nm)", marker: { color: "#60a5fa" }, yaxis: "y" },
        { x: materials, y: tc_vals, type: "bar" as const, name: "κ (W/m·K)", marker: { color: "#f87171" }, yaxis: "y2" },
      ],
      layout: { ...baseLayout, barmode: "group" as const, yaxis: { ...baseLayout.yaxis, title: { text: "n", font: { color: "#60a5fa" } } }, yaxis2: { title: { text: "W/(m·K)", font: { color: "#f87171" } }, overlaying: "y" as const, side: "right" as const, gridcolor: "rgba(0,0,0,0)" }, title: { text: "Diamond vs Other IR Materials", font: { color: "#e5e7eb" } } }
    };
  }, []);

  // Two-photon absorption edge
  const tpaChart = useMemo(() => {
    const wls = Array.from({ length: 100 }, (_, i) => 200 + i * 10);
    const T = wls.map(wl => {
      if (wl < 225) return 0;
      if (wl < 250) return ((wl - 225) / 25) ** 2;
      return 0.99 - 0.03 * Math.exp(-(wl - 250) / 100);
    });
    return {
      data: [{ x: wls, y: T.map(t => t * 100), type: "scatter" as const, mode: "lines" as const, fill: "tozeroy" as const, fillcolor: "rgba(96,165,250,0.15)", line: { color: "#60a5fa" } }],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Transmission (%)", font: { color: "#9ca3af" } }, range: [0, 100] }, title: { text: "Diamond Transmission (1mm thick)", font: { color: "#e5e7eb" } } }
    };
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Diamond Optics" description="Diamond — the ultimate optical material. Bandgap: 5.47 eV. n ≈ 2.42.">
            
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-900 rounded-lg">
        <div><div className="text-gray-400 text-xs">n at {wavelength}nm</div><div className="text-2xl font-bold text-blue-400">{n.toFixed(4)}</div></div>
        <div><div className="text-gray-400 text-xs">Thermal Cond.</div><div className="text-2xl font-bold text-red-400">{diamondData.thermalCond.value} W/(m·K)</div></div>
        <div><div className="text-gray-400 text-xs">Bandgap</div><div className="text-2xl font-bold">{diamondData.bandgap} eV</div></div>
        <div><div className="text-gray-400 text-xs">Hardness</div><div className="text-xl font-bold">{(diamondData.hardness.value / 1000).toFixed(0)} GPa</div></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-900 rounded-lg">
        <div><div className="text-gray-400 text-xs">Lattice Constant</div><div className="text-lg">{diamondData.lattice} Å</div></div>
        <div><div className="text-gray-400 text-xs">Density</div><div className="text-lg">{diamondData.density} g/cm³</div></div>
        <div><div className="text-gray-400 text-xs">dn/dT</div><div className="text-lg">{diamondData.dn_dT > 0 ? "+" : ""}{diamondData.dn_dT}×10⁻⁶/K</div></div>
        <div><div className="text-gray-400 text-xs">CTE</div><div className="text-lg">{diamondData.thermalExpansion}×10⁻⁶/K</div></div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-400">Wavelength: {wavelength} nm</label>
        <input type="range" aria-label="Wavelength: {wavelength} nm" min={200} max={10000} value={wavelength} onChange={e => setWavelength(+e.target.value)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel data={dispersionChart.data} layout={dispersionChart.layout} config={plotConfig} />
        <ChartPanel data={tpaChart.data} layout={tpaChart.layout} config={plotConfig} />
        <div className="lg:col-span-2">
          <ChartPanel data={compareChart.data} layout={compareChart.layout} config={plotConfig} />
        </div>
      </div>
    </CalculatorShell>
  );
}

const baseLayout = { paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" }, xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, margin: { t: 50, r: 20, b: 50, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" } };
const plotConfig = { responsive: true, displayModeBar: false };
