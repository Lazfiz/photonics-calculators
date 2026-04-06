"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


// Crystalline Quartz (SiO₂) - uniaxial positive crystal
// Sellmeier from Ghosh (1999)
const sellmeierNo = (wl_um: number) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + 1.35406 * l2 / (l2 - 0.00657) + 0.01055 * l2 / (l2 - 0.00025) + 1.0988 * l2 / (l2 - 101.5));
};
const sellmeierNe = (wl_um: number) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + 1.38101 * l2 / (l2 - 0.00696) + 0.01093 * l2 / (l2 - 0.00027) + 1.1023 * l2 / (l2 - 108.2));
};

const quartz = {
  crystal: "Trigonal (uniaxial +)",
  spaceGroup: "P3₁21 / P3₂21",
  lattice: { a: 4.913, c: 5.405 }, // Å
  density: 2.65, // g/cm³
  thermalCond: { parallel: 6.5, perpendicular: 4.2 }, // W/(m·K)
  hardness: 741, // Knoop
  bandgap: 9.0, // eV
  dn_dT: { o: -5.2e-6, e: -6.1e-6 },
  thermalExpansion: { parallel: 7.1e-6, perpendicular: 13.2e-6 },
  meltingPoint: 1713, // °C (α→β transition at 573°C)
  transmission: [150, 4000], // nm
  piezoelectric: true,
  opticalRotation: 21.7, // deg/mm at 589nm
};

export default function QuartzCrystalPage() {
  const [wavelength, setWavelength] = useState(589);

  const no = useMemo(() => sellmeierNo(wavelength / 1000), [wavelength]);
  const ne = useMemo(() => sellmeierNe(wavelength / 1000), [wavelength]);
  const biref = Math.abs(ne - no);

  // Optical rotation (approximate: scales as 1/λ²)
  const opticalRot = useMemo(() => {
    return quartz.opticalRotation * Math.pow(589 / wavelength, 2);
  }, [wavelength]);

  const dispersionChart = useMemo(() => {
    const wls = Array.from({ length: 250 }, (_, i) => 0.2 + i * 0.006);
    return {
      data: [
        { x: wls.map(w => w * 1000), y: wls.map(sellmeierNo), type: "scatter" as const, mode: "lines" as const, name: "n<sub>o</sub>", line: { color: "#60a5fa" } },
        { x: wls.map(w => w * 1000), y: wls.map(sellmeierNe), type: "scatter" as const, mode: "lines" as const, name: "n<sub>e</sub>", line: { color: "#f87171" } },
      ],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Refractive Index", font: { color: "#9ca3af" } } }, title: { text: "Quartz Dispersion", font: { color: "#e5e7eb" } } }
    };
  }, []);

  const birefChart = useMemo(() => {
    const wls = Array.from({ length: 250 }, (_, i) => 0.2 + i * 0.006);
    const dn = wls.map(w => Math.abs(sellmeierNe(w) - sellmeierNo(w)));
    return {
      data: [{ x: wls.map(w => w * 1000), y: dn, type: "scatter" as const, mode: "lines" as const, fill: "tozeroy" as const, fillcolor: "rgba(52,211,153,0.15)", line: { color: "#34d399" } }],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Δn = |n<sub>e</sub> - n<sub>o</sub>|", font: { color: "#9ca3af" } } }, title: { text: "Birefringence", font: { color: "#e5e7eb" } } }
    };
  }, []);

  const rotationChart = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 200 + i * 15);
    const rot = wls.map(w => quartz.opticalRotation * Math.pow(589 / w, 2));
    return {
      data: [{ x: wls, y: rot, type: "scatter" as const, mode: "lines" as const, line: { color: "#fbbf24" } },
        { x: [wavelength], y: [opticalRot], type: "scatter" as const, mode: "markers" as const, marker: { color: "#f87171", size: 10 } }],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Optical Rotation (°/mm)", font: { color: "#9ca3af" } } }, title: { text: "Optical Activity: ρ(λ) ∝ 1/λ²", font: { color: "#e5e7eb" } } }
    };
  }, [wavelength, opticalRot]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Quartz Crystal (SiO₂) Properties" description="Uniaxial positive, optically active, piezoelectric. Sellmeier dispersion for o & e rays.">
            
      <div className="mb-4">
        <label className="text-sm text-gray-400">Wavelength: {wavelength} nm</label>
        <input type="range" min={250} max={3500} value={wavelength} onChange={e => setWavelength(+e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-900 rounded-lg">
        <div><div className="text-gray-400 text-xs">n<sub>o</sub></div><div className="text-2xl font-bold text-blue-400">{no.toFixed(5)}</div></div>
        <div><div className="text-gray-400 text-xs">n<sub>e</sub></div><div className="text-2xl font-bold text-red-400">{ne.toFixed(5)}</div></div>
        <div><div className="text-gray-400 text-xs">Δn</div><div className="text-2xl font-bold text-green-400">{biref.toFixed(5)}</div></div>
        <div><div className="text-gray-400 text-xs">Opt. Rotation</div><div className="text-2xl font-bold text-yellow-400">{opticalRot.toFixed(1)} °/mm</div></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 p-4 bg-gray-900 rounded-lg">
        <div><div className="text-gray-400 text-xs">Crystal</div><div className="text-sm">{quartz.crystal}</div></div>
        <div><div className="text-gray-400 text-xs">Density</div><div className="text-sm">{quartz.density} g/cm³</div></div>
        <div><div className="text-gray-400 text-xs">Piezoelectric</div><div className="text-sm">✓ Yes</div></div>
        <div><div className="text-gray-400 text-xs">dn/dT (o)</div><div className="text-sm">{quartz.dn_dT.o}×10⁻⁶/K</div></div>
        <div><div className="text-gray-400 text-xs">CTE (∥/⊥)</div><div className="text-sm">{quartz.thermalExpansion.parallel}/{quartz.thermalExpansion.perpendicular} ×10⁻⁶/K</div></div>
        <div><div className="text-gray-400 text-xs">α→β transition</div><div className="text-sm">573°C</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel data={dispersionChart.data} layout={dispersionChart.layout} config={plotConfig} />
        <ChartPanel data={birefChart.data} layout={birefChart.layout} config={plotConfig} />
        <div className="lg:col-span-2"><ChartPanel data={rotationChart.data} layout={rotationChart.layout} config={plotConfig} /></div>
      </div>
    </CalculatorShell>
  );
}

const baseLayout = { paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" }, xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, margin: { t: 50, r: 20, b: 50, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" } };
const plotConfig = { responsive: true, displayModeBar: false };
