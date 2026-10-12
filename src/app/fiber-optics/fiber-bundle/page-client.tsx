"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  HEX_PACKING_LIMIT, bundleFill, fiberEtendue, hexBundleDiameter, hexFiberCount, hexRingCount, squareBundleDiameter,
} from "../../../physics/fiber-optics/fiber-bundle";

type Packing = "hexagonal" | "square";
const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function FiberBundlePage() {
  const [countRaw, setFiberCount] = useURLState("fiberCount", 37);
  const [coreRaw, setFiberCoreDia] = useURLState("fiberCoreDia", 62.5); // µm
  const [cladRaw, setFiberCladDia] = useURLState("fiberCladDia", 125); // µm
  const [naRaw, setNa] = useURLState("na", 0.22);
  const [packingRaw, setPacking] = useURLState("packing", "hexagonal");
  const packing: Packing = packingRaw === "square" ? "square" : "hexagonal";

  const N = Math.round(clamp(countRaw, 1, 10000));
  const dClad_um = clamp(cladRaw, 1, 5000);
  const dCore_um = clamp(coreRaw, 0.1, dClad_um);
  const na = clamp(naRaw, 0.01, 1);

  const calc = useMemo(() => {
    const dClad = dClad_um * 1e-6, dCore = dCore_um * 1e-6;
    const D = packing === "hexagonal" ? hexBundleDiameter(N, dClad) : squareBundleDiameter(N, dClad);
    const coreFill = bundleFill(N, dCore, D);
    return {
      D,
      rings: hexRingCount(N),
      fullCount: hexFiberCount(hexRingCount(N)),
      cladFill: bundleFill(N, dClad, D),
      coreFill,
      packingLoss: -10 * Math.log10(coreFill),
      etendue: N * fiberEtendue(dCore, na) * 1e6, // mm²·sr
      arrayLimit: HEX_PACKING_LIMIT * (dCore / dClad) ** 2,
    };
  }, [N, dCore_um, dClad_um, na, packing]);

  const chartData = useMemo(() => {
    // Full hexagonal bundles, 0–12 rings.
    const counts = Array.from({ length: 13 }, (_, n) => hexFiberCount(n));
    const diameters = counts.map(n => hexBundleDiameter(n, dClad_um * 1e-3)); // mm
    const fills = counts.map((n, i) => bundleFill(n, dCore_um * 1e-3, diameters[i]) * 100);
    return [
      { x: counts, y: diameters, type: "scatter" as const, mode: "lines+markers" as const, name: "Bundle Ø (mm)", line: { color: "#f87171" }, yaxis: "y" },
      { x: counts, y: fills, type: "scatter" as const, mode: "lines+markers" as const, name: "Core fill (%)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [dCore_um, dClad_um]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Number of Fibers" value={countRaw} onChange={setFiberCount} min={1} max={10000} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Packing Geometry</span>
          <select value={packing} onChange={e => setPacking(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="hexagonal">Hexagonal rings</option>
            <option value="square">Square grid</option>
          </select>
        </label>
        <ValidatedNumberInput label="Fiber Cladding Ø (µm)" value={cladRaw} onChange={setFiberCladDia} min={1} max={5000} step="any" />
        <ValidatedNumberInput label="Fiber Core Ø (µm)" value={coreRaw} onChange={setFiberCoreDia} min={0.1} max={5000} step="any" />
        <ValidatedNumberInput label="Fiber NA" value={naRaw} onChange={setNa} min={0.01} max={1} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card label="Bundle Ø" value={`${(calc.D * 1e3).toFixed(3)} mm`}
          sub={packing === "hexagonal" ? `${calc.rings} ring(s); full at ${calc.fullCount} fibres` : "circle around the square grid"} tone="text-red-400" />
        <Card label="Cladding Fill" value={`${(calc.cladFill * 100).toFixed(1)} %`} sub="N·(d_clad/D)²" tone="text-blue-400" />
        <Card label="Core Fill" value={`${(calc.coreFill * 100).toFixed(2)} %`} sub="N·(d_core/D)²: light-guiding area" tone="text-green-400" />
        <Card label="Packing-Fraction Loss" value={`${calc.packingLoss.toFixed(2)} dB`} sub="uniform spot filling the bundle circle" tone="text-yellow-400" />
        <Card label="Total Étendue" value={`${calc.etendue.toExponential(3)} mm²·sr`} sub="N·π·A_core·NA²" tone="text-purple-400" />
        <Card label="Infinite-Array Core Fill" value={`${(calc.arrayLimit * 100).toFixed(2)} %`} sub="π/(2√3)·(d_core/d_clad)²" tone="text-gray-200" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Hexagonal rings: n full rings hold 3n(n + 1) + 1 fibres (1, 7, 19, 37, 61, …)</p>
          <p>Bundle diameter: D = (2n + 1)·d_clad (hex); D = ((m − 1)√2 + 1)·d_clad, m = ⌈√N⌉ (square)</p>
          <p>Core fill: N·(d_core/D)²; packing loss = −10·log₁₀(core fill)</p>
          <p>Étendue: G = π·A_core·NA² per fibre (in air)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Touching fibres with no glue or buffer. A partly filled outer ring still needs the full ring diameter. Full
          hexagonal rings fill at most 75 % of their circle, so for large bundles a circular close packing is about
          10 % smaller in diameter.
        </p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        title: { text: "Full Hexagonal Bundles", font: { color: "#e5e7eb", size: 14 } },
        xaxis: { title: "Number of Fibers", gridcolor: "#374151" },
        yaxis: { title: "Bundle Diameter (mm)", gridcolor: "#374151" },
        yaxis2: { title: "Core Fill (%)", overlaying: "y", side: "right", gridcolor: "#374151" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 40, r: 60 },
      }} />
    </>
  );
}
