"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


// Calcite (CaCO₃) - uniaxial negative crystal, very strong birefringence
// Sellmeier from Ghosh (1999)
const sellmeierNo = (wl_um: number) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + 2.0680 * l2 / (l2 - 0.01347) + 0.00309 * l2 / (l2 - 0.00000) + 2.0896 * l2 / (l2 - 58.36));
};
const sellmeierNe = (wl_um: number) => {
  const l2 = wl_um * wl_um;
  return Math.sqrt(1 + 2.1635 * l2 / (l2 - 0.01550) + 0.00333 * l2 / (l2 - 0.00000) + 2.1815 * l2 / (l2 - 61.50));
};

const calcite = {
  crystal: "Trigonal (uniaxial −)",
  spaceGroup: "R3̄c",
  lattice: { a: 4.990, c: 17.062 }, // Å
  density: 2.71, // g/cm³
  thermalCond: 3.5, // W/(m·K)
  hardness: 75, // Mohs ≈ 3
  bandgap: 6.0, // eV
  dn_dT: { o: -1.2e-6, e: -2.8e-6 },
  thermalExpansion: { parallel: 25.6e-6, perpendicular: -5.6e-6 },
  cleavage: "Perfect rhombohedral {1014}",
  solubility: "0.0014 g/100mL (25°C, water)",
  transmission: [200, 3300], // nm
  no589: 1.6584,
  ne589: 1.4864,
};

export default function CalcitePropertiesPage() {
  const [wavelength, setWavelength] = useState(589);
  const [thickness, setThickness] = useState(1); // mm
  const [angle, setAngle] = useState(0); // degrees from optic axis

  const no = useMemo(() => sellmeierNo(wavelength / 1000), [wavelength]);
  const ne = useMemo(() => sellmeierNe(wavelength / 1000), [wavelength]);
  const biref = Math.abs(ne - no);

  // Walk-off angle: tan(ρ) = (ne² - no²)sin(2θ) / (2(ne²cos²θ + no²sin²θ))
  const walkoff = useMemo(() => {
    const theta = angle * Math.PI / 180;
    if (Math.abs(angle) < 0.01 || Math.abs(angle - 90) < 0.01) return 0;
    const no2 = no * no, ne2 = ne * ne;
    const tanRho = (ne2 - no2) * Math.sin(2 * theta) / (2 * (ne2 * Math.cos(theta) ** 2 + no2 * Math.sin(theta) ** 2));
    return Math.atan(tanRho) * 180 / Math.PI;
  }, [no, ne, angle]);

  // Lateral beam displacement at exit
  const displacement = useMemo(() => {
    return thickness * Math.tan(walkoff * Math.PI / 180); // mm
  }, [thickness, walkoff]);

  const dispersionChart = useMemo(() => {
    const wls = Array.from({ length: 250 }, (_, i) => 0.22 + i * 0.006);
    return {
      data: [
        { x: wls.map(w => w * 1000), y: wls.map(sellmeierNo), type: "scatter" as const, mode: "lines" as const, name: "n<sub>o</sub>", line: { color: "#60a5fa" } },
        { x: wls.map(w => w * 1000), y: wls.map(sellmeierNe), type: "scatter" as const, mode: "lines" as const, name: "n<sub>e</sub>", line: { color: "#f87171" } },
      ],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Refractive Index", font: { color: "#9ca3af" } } }, title: { text: "Calcite Dispersion (uniaxial −)", font: { color: "#e5e7eb" } } }
    };
  }, []);

  const birefChart = useMemo(() => {
    const wls = Array.from({ length: 250 }, (_, i) => 0.22 + i * 0.006);
    const dn = wls.map(w => Math.abs(sellmeierNe(w) - sellmeierNo(w)));
    return {
      data: [{ x: wls.map(w => w * 1000), y: dn, type: "scatter" as const, mode: "lines" as const, fill: "tozeroy" as const, fillcolor: "rgba(52,211,153,0.15)", line: { color: "#34d399" } }],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Wavelength (nm)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Δn = n<sub>o</sub> - n<sub>e</sub>", font: { color: "#9ca3af" } } }, title: { text: "Birefringence (largest of common crystals)", font: { color: "#e5e7eb" } } }
    };
  }, []);

  const walkoffChart = useMemo(() => {
    const angles = Array.from({ length: 180 }, (_, i) => i * 0.5);
    const walkoffs = angles.map(a => {
      const theta = a * Math.PI / 180;
      if (a < 0.5 || Math.abs(a - 90) < 0.5) return 0;
      const no2 = no * no, ne2 = ne * ne;
      const tanRho = (ne2 - no2) * Math.sin(2 * theta) / (2 * (ne2 * Math.cos(theta) ** 2 + no2 * Math.sin(theta) ** 2));
      return Math.atan(tanRho) * 180 / Math.PI;
    });
    return {
      data: [
        { x: angles, y: walkoffs, type: "scatter" as const, mode: "lines" as const, line: { color: "#fbbf24" } },
        { x: [angle], y: [walkoff], type: "scatter" as const, mode: "markers" as const, marker: { color: "#f87171", size: 12 } },
      ],
      layout: { ...baseLayout, xaxis: { ...baseLayout.xaxis, title: { text: "Angle from optic axis (°)", font: { color: "#9ca3af" } } }, yaxis: { ...baseLayout.yaxis, title: { text: "Walk-off angle (°)", font: { color: "#9ca3af" } } }, title: { text: "Extraordinary Ray Walk-off: tan(ρ) = (n<sub>e</sub>²−n<sub>o</sub>²)sin2θ / 2(n<sub>e</sub>²cos²θ+n<sub>o</sub>²sin²θ)", font: { color: "#e5e7eb" } } }
    };
  }, [angle, no, ne, walkoff]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Calcite (CaCO₃) Properties" description="Uniaxial negative crystal with the largest birefringence of common optical crystals. Δn ≈ 0.172 at 589nm.">
            
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-gray-400">Wavelength: {wavelength} nm</label>
          <input type="range" min={250} max={3000} value={wavelength} onChange={e => setWavelength(+e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-400">Angle from optic axis: {angle.toFixed(1)}°</label>
          <input type="range" min={0} max={90} step={0.5} value={angle} onChange={e => setAngle(+e.target.value)} />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-400">Thickness: {thickness} mm</label>
        <input type="range" min={0.1} max={20} step={0.1} value={thickness} onChange={e => setThickness(+e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-900 rounded-lg">
        <div><div className="text-gray-400 text-xs">n<sub>o</sub></div><div className="text-2xl font-bold text-blue-400">{no.toFixed(5)}</div></div>
        <div><div className="text-gray-400 text-xs">n<sub>e</sub></div><div className="text-2xl font-bold text-red-400">{ne.toFixed(5)}</div></div>
        <div><div className="text-gray-400 text-xs">Δn (birefringence)</div><div className="text-2xl font-bold text-green-400">{biref.toFixed(5)}</div></div>
        <div><div className="text-gray-400 text-xs">Walk-off</div><div className="text-2xl font-bold text-yellow-400">{walkoff.toFixed(2)}°</div></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-900 rounded-lg">
        <div><div className="text-gray-400 text-xs">Beam displacement</div><div className="text-xl font-bold">{displacement.toFixed(3)} mm</div></div>
        <div><div className="text-gray-400 text-xs">Crystal</div><div className="text-sm">{calcite.crystal}</div></div>
        <div><div className="text-gray-400 text-xs">Density</div><div className="text-sm">{calcite.density} g/cm³</div></div>
        <div><div className="text-gray-400 text-xs">Hardness</div><div className="text-sm">Mohs {calcite.hardness}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel data={dispersionChart.data} layout={dispersionChart.layout} config={plotConfig} />
        <ChartPanel data={birefChart.data} layout={birefChart.layout} config={plotConfig} />
        <div className="lg:col-span-2"><ChartPanel data={walkoffChart.data} layout={walkoffChart.layout} config={plotConfig} /></div>
      </div>
    </CalculatorShell>
  );
}

const baseLayout = { paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" }, xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, margin: { t: 50, r: 20, b: 50, l: 60 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" } };
const plotConfig = { responsive: true, displayModeBar: false };
