"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
type FiberType = "PM" | "PCF" | "EDF" | "TDF" | "YDF" | "Bi1060" | "Chalcogenide" | "Fluoride";

const fiberDB: Record<FiberType, {
  name: string; core: number; cladding: number; NA: number; att1350: number; att1550: number;
  MFD: number; lambdaMin: number; lambdaMax: number; description: string;
}> = {
  PM: { name: "PM Fiber (PANDA)", core: 4.1, cladding: 125, NA: 0.14, att1350: 0.5, att1550: 0.3, MFD: 10.4, lambdaMin: 1000, lambdaMax: 1700, description: "Polarization-maintaining fiber with stress rods" },
  PCF: { name: "Photonic Crystal Fiber", core: 1.5, cladding: 125, NA: 0.45, att1350: 1.0, att1550: 0.5, MFD: 3.5, lambdaMin: 400, lambdaMax: 2000, description: "Microstructured air-hole cladding" },
  EDF: { name: "Erbium-Doped Fiber", core: 3.5, cladding: 125, NA: 0.22, att1350: 3.0, att1550: 2.5, MFD: 9.5, lambdaMin: 900, lambdaMax: 1650, description: "Er³⁺ doped, 1530-1565 nm gain band" },
  TDF: { name: "Thulium-Doped Fiber", core: 4.0, cladding: 125, NA: 0.20, att1350: 5.0, att1550: 15.0, MFD: 8.0, lambdaMin: 1700, lambdaMax: 2100, description: "Tm³⁺ doped, ~2 μm emission" },
  YDF: { name: "Ytterbium-Doped Fiber", core: 4.5, cladding: 125, NA: 0.18, att1350: 8.0, att1550: 50.0, MFD: 10.0, lambdaMin: 970, lambdaMax: 1100, description: "Yb³⁺ doped, 1030-1100 nm gain" },
  Bi1060: { name: "Bismuth-Doped Fiber", core: 5.0, cladding: 125, NA: 0.16, att1350: 2.0, att1550: 1.5, MFD: 11.0, lambdaMin: 1100, lambdaMax: 1450, description: "Bi³⁺ doped, ~1.1-1.3 μm emission" },
  Chalcogenide: { name: "Chalcogenide (As₂S₃)", core: 5.0, cladding: 125, NA: 0.35, att1350: 0.1, att1550: 0.15, MFD: 12.0, lambdaMin: 1000, lambdaMax: 6500, description: "IR-transmitting glass, high nonlinearity" },
  Fluoride: { name: "Fluoride (ZBLAN)", core: 4.0, cladding: 125, NA: 0.20, att1350: 0.02, att1550: 0.03, MFD: 9.0, lambdaMin: 400, lambdaMax: 4500, description: "Ultra-low loss mid-IR fiber" },
};

export default function SpecialtyFiberPage() {
  const [fiber, setFiber] = useState<FiberType>("PM");
  const [length, setLength] = useURLState("length", 10);
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);

  const spec = fiberDB[fiber];

  const calc = useMemo(() => {
    const lam = wavelength;
    const inBand = lam >= spec.lambdaMin && lam <= spec.lambdaMax;
    // Interpolate attenuation
    const f = (lam - 1350) / 200;
    const att = spec.att1350 + (spec.att1550 - spec.att1350) * f;
    const totalLoss = att * length;
    const V = (2 * Math.PI * (spec.core / 2) * spec.NA) / lam;
    const isSingleMode = V < 2.405;
    return { att: Math.max(0, att), totalLoss, V, isSingleMode, inBand };
  }, [fiber, wavelength, length]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => spec.lambdaMin + (spec.lambdaMax - spec.lambdaMin) * i / 199);
    const atts = wls.map(wl => {
      const f = (wl - 1350) / 200;
      return Math.max(0, spec.att1350 + (spec.att1550 - spec.att1350) * f);
    });

    return [
      { x: wls, y: atts, type: "scatter" as const, mode: "lines" as const, name: "Attenuation", line: { color: "#f87171" } },
      { x: [wavelength], y: [calc.att], type: "scatter" as const, mode: "markers" as const, name: "Selected λ", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [fiber, wavelength]);

  const compareData = useMemo(() => {
    const types: FiberType[] = ["PM", "PCF", "EDF", "TDF", "YDF", "Chalcogenide", "Fluoride"];
    return [{
      x: types.map(t => fiberDB[t].name.split("(")[0].trim()),
      y: types.map(t => fiberDB[t].NA),
      type: "bar" as const, name: "NA",
      marker: { color: types.map(t => t === fiber ? "#f87171" : "#4b5563") },
    }];
  }, [fiber]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Specialty Fiber Types" description="Compare properties of specialty optical fibers: PM, PCF, rare-earth doped, chalcogenide, and fluoride.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fiber Type</span>
          <select value={fiber} onChange={e => setFiber(e.target.value as FiberType)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(fiberDB).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Length (km)" value={length} onChange={setLength} min={0.01} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} max={7000} />
      </div>

      <p className="text-gray-300 mb-6 text-sm italic">{spec.description}</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">NA</p>
          <p className="text-xl font-bold text-blue-400">{spec.NA.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">MFD (μm)</p>
          <p className="text-xl font-bold text-green-400">{spec.MFD}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V-number</p>
          <p className="text-xl font-bold text-yellow-400">{calc.V.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{calc.isSingleMode ? "Single-mode" : "Multi-mode"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Loss</p>
          <p className="text-xl font-bold text-red-400">{calc.totalLoss.toFixed(1)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Attenuation Spectrum</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151", range: [spec.lambdaMin, spec.lambdaMax] },
          yaxis: { title: "Attenuation (dB/km)", color: "#9ca3af", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 350,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Numerical Aperture Comparison</h3>
        <ChartPanel data={compareData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Fiber Type", color: "#9ca3af", gridcolor: "#374151", tickangle: -30 },
          yaxis: { title: "NA", color: "#9ca3af", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 60, l: 50 }, height: 300,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>V = π · d · NA / λ</p>
          <p>Single-mode: V &lt; 2.405</p>
          <p>P_total = P₀ · 10<sup>-αL/10</sup></p>
        </div>
      </div>
    </CalculatorShell>
  );
}
