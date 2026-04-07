"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
interface Material {
  name: string;
  B1: number; B2: number; B3: number;
  C1: number; C2: number; C3: number;
}

const materials: Record<string, Material> = {
  "Fused Silica": { name: "Fused Silica (Malitson 1965)", B1: 0.6961663, B2: 0.4079426, B3: 0.8974794, C1: 0.00467914825849, C2: 0.01351206307396, C3: 97.93400253792099 },
  "BK7": { name: "BK7 (SCHOTT)", B1: 1.03961212, B2: 0.231792344, B3: 1.01046945, C1: 0.00600069867, C2: 0.0200179144, C3: 103.560653 },
  "CaF2": { name: "CaF₂", B1: 0.5675888, B2: 0.4710914, B3: 3.8484723, C1: 0.00252643, C2: 0.01007833, C3: 1200.556 },
  "SiO2": { name: "SiO₂ (Crystal Quartz, o-ray)", B1: 0.6961663, B2: 0.4079426, B3: 0.8974794, C1: 0.0684043, C2: 0.1162414, C3: 9.896161 },
  "Ge": { name: "Germanium", B1: 4.009489, B2: 0.3922679, B3: 4.213251, C1: 0.1383964, C2: 0.2918464, C3: 2.507735 },
  "ZnSe": { name: "ZnSe", B1: 4.458137, B2: 0.4697145, B3: 2.895563, C1: 0.2008599, C2: 0.3943669, C3: 2.302026 },
  "Diamond": { name: "Diamond", B1: 0.3306, B2: 4.3356, B3: 0.0, C1: 0.01150, C2: 0.03770, C3: 0.0 },
};

const wavelengthPresets = [486.1, 532, 589.3, 632.8, 1064, 1310, 1550];
const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
const currentHref = "/materials/sellmeier";

function sellmeier(m: Material, lambdaUm: number): number {
  const l2 = lambdaUm * lambdaUm;
  const n2 = 1 + m.B1 * l2 / (l2 - m.C1) + m.B2 * l2 / (l2 - m.C2) + m.B3 * l2 / (l2 - m.C3);
  return Math.sqrt(n2);
}

export default function SellmeierPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [selected, setSelected] = useState("Fused Silica");
  const [compareAll, setCompareAll] = useState(true);

  const n = useMemo(() => sellmeier(materials[selected], wavelength / 1000), [selected, wavelength]);
  const mat = materials[selected];

  const series = useMemo(() => {
    const ws: number[] = [];
    for (let w = 400; w <= 2000; w += 5) ws.push(w);

    if (!compareAll) {
      return [{ name: mat.name, color: "#60a5fa", points: ws.map((x) => ({ x, y: sellmeier(mat, x / 1000) })) }];
    }

    return Object.entries(materials).map(([key, m], i) => ({
      name: m.name,
      color: colors[i % colors.length],
      points: ws.map((x) => ({ x, y: sellmeier(m, x / 1000) })),
      dashed: key !== selected,
      showPoints: false,
    }));
  }, [selected, compareAll, mat]);

  const dn = useMemo(() => {
    const delta = 1;
    const n1 = sellmeier(mat, (wavelength - delta) / 1000);
    const n2 = sellmeier(mat, (wavelength + delta) / 1000);
    return (n2 - n1) / (2 * delta);
  }, [mat, wavelength]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Sellmeier Equation" description="Interactive dispersion explorer using Sellmeier coefficients to compute refractive index versus wavelength.">
      <div className="mb-5 flex flex-wrap gap-2">
        {wavelengthPresets.map((preset) => (
          <button
            key={preset}
            onClick={() => setWavelength(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition ${wavelength === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset} nm
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300">
            <input type="checkbox" checked={compareAll} onChange={(e) => setCompareAll(e.target.checked)} className="h-4 w-4" />
            Compare all materials on the same chart
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={200} max={5000} step={0.1} unit="nm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label={`Refractive index at ${wavelength.toFixed(1)} nm`} value={n.toFixed(6)} tone="blue" />
        <ResultCard label="Material" value={mat.name} tone="purple" />
        <ResultCard label="Local slope dn/dλ" value={dn.toExponential(3)} tone="green" subtext="Approx. per nm" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <p className="text-sm text-gray-400 mb-2">Sellmeier coefficients for {mat.name}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-gray-300">
          <span>B₁: {mat.B1}</span>
          <span>B₂: {mat.B2}</span>
          <span>B₃: {mat.B3}</span>
          <span>C₁: {mat.C1} µm²</span>
          <span>C₂: {mat.C2} µm²</span>
          <span>C₃: {mat.C3} µm²</span>
        </div>
      </div>

      <SimpleLineChart title="Dispersion curves" xLabel="Wavelength (nm)" yLabel="Refractive index n" series={series} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
