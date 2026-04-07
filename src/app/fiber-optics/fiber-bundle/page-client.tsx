"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function FiberBundlePage() {
  const [fiberCount, setFiberCount] = useState(37);
  const [fiberCoreDia, setFiberCoreDia] = useState(62.5); // μm
  const [fiberCladDia, setFiberCladDia] = useState(125); // μm
  const [fillFactor, setFillFactor] = useState(0.85);
  const [packing, setPacking] = useState<"hexagonal" | "square">("hexagonal");

  const calc = useMemo(() => {
    const N = fiberCount;
    const d = fiberCladDia * 1e-3; // mm

    // Number of fibers in hexagonal rings: 1, 7, 19, 37, 61, 91...
    const ringForN = (n: number) => {
      if (n === 1) return 0;
      let total = 1, ring = 1;
      while (total < n) { total += 6 * ring; ring++; }
      return ring;
    };

    const rings = ringForN(N);
    // Hexagonal bundle diameter
    const bundleDiaHex = (2 * rings + 1) * d;
    // Square bundle diameter
    const side = Math.ceil(Math.sqrt(N)) * d;
    const bundleDiaSq = side * Math.sqrt(2);

    const bundleDia = packing === "hexagonal" ? bundleDiaHex : bundleDiaSq;
    const coreArea = N * Math.PI * Math.pow(fiberCoreDia / 2, 2);
    const cladArea = N * Math.PI * Math.pow(fiberCladDia / 2, 2);
    const bundleArea = Math.PI * Math.pow(bundleDia / 2, 2);
    const effectiveFF = (cladArea / bundleArea) * fillFactor;
    const coreFF = (coreArea / bundleArea) * fillFactor;
    const NA = 0.22; // typical multimode
    const acceptanceAngle = Math.asin(NA) * 180 / Math.PI;
    const etendue = coreArea * Math.PI * Math.pow(NA, 2); // μm²·sr (per fiber)
    const totalEtendue = etendue * N;

    // Transmission: coupling loss due to packing gaps
    const transmissionLoss = -10 * Math.log10(effectiveFF);

    return { rings, bundleDia, coreArea, cladArea, bundleArea, effectiveFF, coreFF, NA, acceptanceAngle, etendue, totalEtendue, transmissionLoss };
  }, [fiberCount, fiberCoreDia, fiberCladDia, fillFactor, packing]);

  const chartData = useMemo(() => {
    const counts = Array.from({ length: 20 }, (_, i) => 1 + i * 6);
    const diameters = counts.map(n => {
      const rings = Math.ceil((-1 + Math.sqrt(1 + 4 * (n - 1) / 3)) / 2);
      return (2 * rings + 1) * fiberCladDia * 1e-3;
    });
    const fillFactors = counts.map(n => {
      const cladArea = n * Math.PI * Math.pow(fiberCladDia / 2, 2);
      const bd = diameters[counts.indexOf(n)];
      const bundleArea = Math.PI * Math.pow(bd / 2, 2);
      return (cladArea / bundleArea) * fillFactor;
    });

    return [
      { x: counts, y: diameters, type: "scatter" as const, mode: "lines+markers" as const, name: "Bundle Ø (mm)", line: { color: "#f87171" }, yaxis: "y" },
      { x: counts, y: fillFactors.map(f => f * 100), type: "scatter" as const, mode: "lines+markers" as const, name: "Fill Factor (%)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [fiberCladDia, fillFactor]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Bundle Design" description="Calculate bundle geometry, fill factor, étendue, and coupling efficiency for fiber optic bundles.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Number of Fibers" value={fiberCount} onChange={setFiberCount} min={1} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Packing Geometry</span>
          <select value={packing} onChange={e => setPacking(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="hexagonal">Hexagonal</option>
            <option value="square">Square</option>
          </select>
        </label>
        <ValidatedNumberInput label="Fiber Cladding Ø (μm)" value={fiberCladDia} onChange={setFiberCladDia} min={1} step="any" />
        <ValidatedNumberInput label="Fiber Core Ø (μm)" value={fiberCoreDia} onChange={setFiberCoreDia} min={1} step="any" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fill Factor</span>
          <input type="range" value={fillFactor} onChange={e => setFillFactor(+e.target.value)} min={0.5} max={1} step={0.01}
            className="mt-1 w-full" />
          <span className="text-gray-400 text-xs">{(fillFactor * 100).toFixed(0)}%</span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bundle Ø</p>
          <p className="text-xl font-bold text-red-400">{calc.bundleDia.toFixed(3)} mm</p>
          <p className="text-xs text-gray-500">{calc.rings} ring(s)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Fill</p>
          <p className="text-xl font-bold text-blue-400">{(calc.effectiveFF * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Core Fill</p>
          <p className="text-xl font-bold text-green-400">{(calc.coreFF * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coupling Loss</p>
          <p className="text-xl font-bold text-yellow-400">{calc.transmissionLoss.toFixed(2)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Hexagonal rings: N_total = 1 + 3n(n+1) = 3n² + 3n + 1</p>
          <p>Bundle diameter: D = (2n + 1) × d_clad</p>
          <p>Fill factor: FF = (N × π r²_clad) / (π R²_bundle) × η</p>
          <p>Étendue: G = A_core × π × NA² (mm²·sr)</p>
          <p>Max hexagonal FF = π/(2√3) ≈ 90.69%</p>
        </div>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Number of Fibers", gridcolor: "#374151" },
        yaxis: { title: "Bundle Diameter (mm)", gridcolor: "#374151" },
        yaxis2: { title: "Fill Factor (%)", overlaying: "y", side: "right", gridcolor: "#374151" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30, r: 60 },
      }} />
    </CalculatorShell>
  );
}
