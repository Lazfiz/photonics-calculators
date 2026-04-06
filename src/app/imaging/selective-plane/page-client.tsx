"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


export default function SelectivePlanePage() {
  const [naIll, setNaIll] = useURLState("naIll", 0.05);
  const [wavelength, setWavelength] = useURLState("wavelength", 488);
  const [n, setN] = useURLState("n", 1.45);
  const [naDet, setNaDet] = useURLState("naDet", 1.0);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const sheetThickness = n * lam / (naIll * naIll) * 1e6;
    const rayleighRange = n * lam / (Math.PI * naIll * naIll) * 1e6;
    const confocalParam = Math.PI * sheetThickness * sheetThickness / (4 * lam * 1e6);
    const lateralRes = 0.61 * lam / naDet * 1e9;
    const axialResDet = 2 * n * lam / (naDet * naDet) * 1e9;
    const axialResIll = 2 * n * lam / (naIll * naIll) * 1e9;
    const effectiveAxial = Math.sqrt(axialResDet ** 2 + axialResIll ** 2);
    const beamWaist = lam / (Math.PI * naIll) * 1e6;
    const divergence = 2 * naIll / n;
    return { sheetThickness, rayleighRange, confocalParam, lateralRes, axialResDet, axialResIll, effectiveAxial, beamWaist, divergence };
  }, [naIll, wavelength, n, naDet]);

  const plotData = useMemo(() => {
    const nas = [];
    const thicknesses = [];
    const ranges = [];
    for (let x = 0.01; x <= 0.3; x += 0.003) {
      nas.push(x);
      const lam = wavelength * 1e-9;
      thicknesses.push(n * lam / (x * x) * 1e6);
      ranges.push(n * lam / (Math.PI * x * x) * 1e6);
    }
    return [
      { x: nas, y: thicknesses, name: "Sheet thickness", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: nas, y: ranges, name: "Rayleigh range", line: { color: "#34d399" }, type: "scatter", mode: "lines" },
    ];
  }, [wavelength, n]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Selective Plane Illumination Calculator" description="SPIM illumination parameters: sheet thickness, beam waist, Rayleigh range, and confocal parameter.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Illumination NA</label>
            <input type="number" step={0.005} min={0.01} max={0.5} value={naIll} onChange={e => setNaIll(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Detection NA</label>
            <input type="number" step={0.01} min={0.1} max={1.8} value={naDet} onChange={e => setNaDet(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <input type="number" step={0.01} value={n} onChange={e => setN(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Sheet thickness</span><span className="font-mono text-blue-400">{results.sheetThickness.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Beam waist (w₀)</span><span className="font-mono text-cyan-400">{results.beamWaist.toFixed(3)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Rayleigh range</span><span className="font-mono text-green-400">{results.rayleighRange.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Confocal parameter (2z_R)</span><span className="font-mono text-purple-400">{(results.rayleighRange * 2).toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Divergence (rad)</span><span className="font-mono text-yellow-400">{results.divergence.toFixed(4)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-emerald-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective axial</span><span className="font-mono text-red-400">{results.effectiveAxial.toFixed(1)} nm</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Sheet: t = nλ/NA²_ill | w₀ = λ/(π·NA_ill)</p>
            <p>z_R = nλ/(π·NA²_ill) | θ_div = 2·NA_ill/n</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Sheet Thickness &amp; Rayleigh Range vs Illumination NA</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Illumination NA", gridcolor: "#333" }, yaxis: { title: "µm", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
