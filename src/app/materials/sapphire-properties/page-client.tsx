"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
// Sapphire (Al₂O₃) - uniaxial crystal, ordinary and extraordinary rays
const sellmeierNo = (wl_um: number) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + 1.4313493 * l2 / (l2 - 0.005279926) + 0.65054713 * l2 / (l2 - 0.014238284) + 5.3414021 * l2 / (l2 - 325.01734));
};
const sellmeierNe = (wl_um: number) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + 1.5039061 * l2 / (l2 - 0.005606943) + 0.55069141 * l2 / (l2 - 0.014981475) + 6.5927319 * l2 / (l2 - 402.89514));
};

const sapphire = {
  crystal: "Trigonal (uniaxial)",
  spaceGroup: "R3̄c",
  lattice: { a: 4.759, c: 12.991 }, // Å
  density: 3.98, // g/cm³
  thermalCond: { parallel: 35, perpendicular: 33 }, // W/(m·K)
  hardness: 2000, // Knoop
  bandgap: 8.8, // eV (indirect)
  dn_dT_o: 1.3e-6, dn_dT_e: 1.4e-6,
  thermalExpansion: { parallel: 5.6e-6, perpendicular: 5.0e-6 },
  meltingPoint: 2054, // °C
  transmission: [150, 5500], // nm
  youngsModulus: 400, // GPa
};

export default function SapphirePropertiesPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 589);

  const no = useMemo(() => sellmeierNo(wavelength / 1000), [wavelength]);
  const ne = useMemo(() => sellmeierNe(wavelength / 1000), [wavelength]);
  const biref = Math.abs(ne - no);

  const dispersionChart = useMemo(() => {
    const wls = Array.from({ length: 250 }, (_, i) => 0.15 + i * 0.006);
    return {
      data: [
        { x: wls.map(w => w * 1000), y: wls.map(sellmeierNo), type: "scatter" as const, mode: "lines" as const, name: "n<sub>o</sub> (ordinary)", line: { color: "#60a5fa" } },
        { x: wls.map(w => w * 1000), y: wls.map(sellmeierNe), type: "scatter" as const, mode: "lines" as const, name: "n<sub>e</sub> (extraordinary)", line: { color: "#f87171" } },
        { x: [wavelength], y: [no], type: "scatter" as const, mode: "markers" as const, name: "n<sub>o</sub> selected", marker: { color: "#60a5fa", size: 10 } },
        { x: [wavelength], y: [ne], type: "scatter" as const, mode: "markers" as const, name: "n<sub>e</sub> selected", marker: { color: "#f87171", size: 10 } },
      ],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Refractive Index", font: { color: "#9ca3af" } } }, title: { text: "Sapphire Dispersion (o-ray & e-ray)", font: { color: "#e5e7eb" } } }
    };
  }, [wavelength, no, ne]);

  const birefChart = useMemo(() => {
    const wls = Array.from({ length: 250 }, (_, i) => 0.15 + i * 0.006);
    const dn = wls.map(w => Math.abs(sellmeierNe(w) - sellmeierNo(w)));
    return {
      data: [{ x: wls.map(w => w * 1000), y: dn, type: "scatter" as const, mode: "lines" as const, fill: "tozeroy" as const, fillcolor: "rgba(52,211,153,0.15)", line: { color: "#34d399" } }],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Δn = |n<sub>e</sub> - n<sub>o</sub>|", font: { color: "#9ca3af" } } }, title: { text: "Birefringence", font: { color: "#e5e7eb" } } }
    };
  }, []);

  const thermalChart = useMemo(() => {
    const T = Array.from({ length: 100 }, (_, i) => 50 + i * 10);
    const no_vals = T.map(t => sellmeierNo(0.589) + sapphire.dn_dT_o * 1e-6 * (t - 25));
    const ne_vals = T.map(t => sellmeierNe(0.589) + sapphire.dn_dT_e * 1e-6 * (t - 25));
    return {
      data: [
        { x: T, y: no_vals, type: "scatter" as const, mode: "lines" as const, name: "n<sub>o</sub>(T)", line: { color: "#60a5fa" } },
        { x: T, y: ne_vals, type: "scatter" as const, mode: "lines" as const, name: "n<sub>e</sub>(T)", line: { color: "#f87171" } },
      ],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Temperature (°C)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Refractive Index", font: { color: "#9ca3af" } } }, title: { text: "Thermo-optic: n(T) = n₂₅ + (dn/dT)(T-25)", font: { color: "#e5e7eb" } } }
    };
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Sapphire (Al₂O₃) Properties" description="Uniaxial crystal. Sellmeier equations for ordinary and extraordinary rays.">
            
      <div className="mb-4">
        <label className="text-sm text-gray-400">Wavelength: {wavelength} nm</label>
        <input type="range" aria-label="Wavelength: {wavelength} nm" min={200} max={4000} value={wavelength} onChange={e => setWavelength(+e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-900 rounded-lg">
        <div><div className="text-gray-400 text-xs">n<sub>o</sub></div><div className="text-2xl font-bold text-blue-400">{no.toFixed(5)}</div></div>
        <div><div className="text-gray-400 text-xs">n<sub>e</sub></div><div className="text-2xl font-bold text-red-400">{ne.toFixed(5)}</div></div>
        <div><div className="text-gray-400 text-xs">Δn (birefringence)</div><div className="text-2xl font-bold text-green-400">{biref.toFixed(5)}</div></div>
        <div><div className="text-gray-400 text-xs">Bandgap</div><div className="text-2xl font-bold">{sapphire.bandgap} eV</div></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-900 rounded-lg">
        <div><div className="text-gray-400 text-xs">Crystal</div><div className="text-sm">{sapphire.crystal}</div></div>
        <div><div className="text-gray-400 text-xs">Thermal Cond.</div><div className="text-sm">∥{sapphire.thermalCond.parallel} ⊥{sapphire.thermalCond.perpendicular} W/(m·K)</div></div>
        <div><div className="text-gray-400 text-xs">Young&apos;s Modulus</div><div className="text-sm">{sapphire.youngsModulus} GPa</div></div>
        <div><div className="text-gray-400 text-xs">Melting Point</div><div className="text-sm">{sapphire.meltingPoint}°C</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel data={dispersionChart.data} layout={dispersionChart.layout} config={plotConfig} />
        <ChartPanel data={birefChart.data} layout={birefChart.layout} config={plotConfig} />
        <div className="lg:col-span-2"><ChartPanel data={thermalChart.data} layout={thermalChart.layout} config={plotConfig} /></div>
      </div>
    </CalculatorShell>
  );
}

const baseLayout = { paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" }, xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, margin: { t: 50, r: 20, b: 50, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" } };
const plotConfig = { responsive: true, displayModeBar: false };
