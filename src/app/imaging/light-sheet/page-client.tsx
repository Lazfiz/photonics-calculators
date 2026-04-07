"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function LightSheetPage() {
  const [naDet, setNaDet] = useState(0.8);
  const [naIll, setNaIll] = useState(0.1);
  const [wavelength, setWavelength] = useState(488);
  const [n, setN] = useState(1.33);
  const [gaussSigma, setGaussSigma] = useState(0);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const lateralRes = 0.61 * lam / naDet * 1e9;
    const axResIll = 2 * n * lam / (naIll * naIll) * 1e9;
    const axResDet = 2 * n * lam / (naDet * naDet) * 1e9;
    const sheetThickness = n * lam / (naIll * naIll) * 1e6;
    const rayleighRange = n * lam / (Math.PI * naIll * naIll) * 1e6;
    const effectiveAx = Math.sqrt(axResIll ** 2 + axResDet ** 2);
    return { lateralRes, axResIll, axResDet, sheetThickness, rayleighRange, effectiveAx };
  }, [naDet, naIll, wavelength, n]);

  const plotData = useMemo(() => {
    const nas = [];
    const sheets = [];
    const detAx = [];
    for (let x = 0.02; x <= 0.5; x += 0.005) {
      nas.push(x);
      const lam = wavelength * 1e-9;
      sheets.push(n * lam / (x * x) * 1e6);
      detAx.push(2 * n * lam / (naDet * naDet) * 1e6);
    }
    return [
      { x: nas, y: sheets, name: "Sheet thickness", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: nas, y: detAx, name: `Detector axial (${naDet})`, line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [naDet, wavelength, n]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Light Sheet Microscopy Calculator" description="Light sheet thickness, resolution, and Rayleigh range for LSFM/SPIM.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Detection NA</label>
            <input type="number" step={0.01} min={0.1} max={1.8} value={naDet} onChange={e => setNaDet(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Illumination NA</label>
            <input type="number" step={0.01} min={0.01} max={1.0} value={naIll} onChange={e => setNaIll(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
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
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-green-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial (illumination)</span><span className="font-mono text-yellow-400">{results.axResIll.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial (detection)</span><span className="font-mono text-red-400">{results.axResDet.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective axial</span><span className="font-mono text-purple-400">{results.effectiveAx.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Rayleigh range</span><span className="font-mono">{results.rayleighRange.toFixed(2)} µm</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Sheet: t = nλ/NA²_ill | Lateral: d = 0.61λ/NA_det</p>
            <p>Rayleigh: z_R = nλ/(π·NA²_ill)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Sheet Thickness &amp; Detector Axial vs Illumination NA</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Illumination NA", gridcolor: "#333" }, yaxis: { title: "Thickness (µm)", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
