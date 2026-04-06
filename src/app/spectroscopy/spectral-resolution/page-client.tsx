"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function SpectralResolutionPage() {
  const [mode, setMode] = useState("grating");
  const [grooveDensity, setGrooveDensity] = useState(1200);
  const [focalLength, setFocalLength] = useState(500);
  const [slitWidth, setSlitWidth] = useState(25);
  const [order, setOrder] = useState(1);
  const [gratingWL, setGratingWL] = useState(500);
  const [dispersion, setDispersion] = useState(0.02);
  const [finesse, setFinesse] = useState(50);
  const [fsrNm, setFsrNm] = useState(0.05);

  const gratingResNm = (slitWidth * 1e-3) / (focalLength * grooveDensity * order) * gratingWL;
  const currentRes = mode === "grating" ? gratingResNm : mode === "fabry-perot" ? fsrNm / finesse : (slitWidth * 1e-3) / (focalLength * dispersion);
  const currentRP = gratingWL / currentRes;

  const chartData = useMemo(() => {
    const fwhm = currentRes;
    const center = gratingWL;
    const range = Math.max(fwhm * 20, 0.5);
    const x = Array.from({ length: 500 }, (_, i) => center - range / 2 + i * range / 500);
    const gamma = fwhm / 2;
    const lorentzian = x.map(xi => 1 / (1 + ((xi - center) / gamma) ** 2));
    return [
      { x, y: lorentzian, type: "scatter", mode: "lines", name: "ILS (Lorentzian)",
        line: { color: "#34d399", width: 2 }, fill: "tozeroy", fillcolor: "rgba(52,211,153,0.1)" },
      { x: [center - fwhm / 2, center + fwhm / 2], y: [0.5, 0.5], type: "scatter", mode: "lines",
        name: `FWHM = ${fwhm.toFixed(4)} nm`, line: { color: "#fbbf24", width: 2, dash: "dash" } },
    ];
  }, [currentRes, gratingWL]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Spectral Resolution Calculator" description="Compare spectral resolution across grating, prism, and Fabry-Pérot spectrometers.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Instrument Type</span>
          <select value={mode} onChange={e => setMode(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="grating">Diffraction Grating</option>
            <option value="prism">Prism</option>
            <option value="fabry-perot">Fabry-Pérot</option>
          </select>
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Central Wavelength (nm)</span>
          <input type="number" value={gratingWL} onChange={e => setGratingWL(+e.target.value)} min="100"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        {mode === "grating" && <>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Groove Density (lines/mm)</span>
            <input type="number" value={grooveDensity} onChange={e => setGrooveDensity(+e.target.value)} min="10"
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Focal Length (mm)</span>
            <input type="number" value={focalLength} onChange={e => setFocalLength(+e.target.value)} min="10"
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Slit Width (μm)</span>
            <input type="number" value={slitWidth} onChange={e => setSlitWidth(+e.target.value)} min="1"
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Diffraction Order</span>
            <input type="number" value={order} onChange={e => setOrder(+e.target.value)} min="1" max="10"
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        </>}
        {mode === "prism" && <>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Slit Width (μm)</span>
            <input type="number" value={slitWidth} onChange={e => setSlitWidth(+e.target.value)} min="1"
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Focal Length (mm)</span>
            <input type="number" value={focalLength} onChange={e => setFocalLength(+e.target.value)} min="10"
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Angular Dispersion (rad/nm)</span>
            <input type="number" value={dispersion} onChange={e => setDispersion(+e.target.value)} min="1e-5" step="0.001"
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        </>}
        {mode === "fabry-perot" && <>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">Finesse ℱ</span>
            <input type="number" value={finesse} onChange={e => setFinesse(+e.target.value)} min="2" step="1"
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
          <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">FSR (nm)</span>
            <input type="number" value={fsrNm} onChange={e => setFsrNm(+e.target.value)} min="0.001" step="0.01"
              className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        </>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spectral Resolution δλ</p>
          <p className="text-xl font-bold text-green-400">{currentRes.toFixed(4)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Resolving Power λ/δλ</p>
          <p className="text-xl font-bold text-yellow-400">{currentRP.toFixed(0)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bandwidth (cm⁻¹)</p>
          <p className="text-xl font-bold text-blue-400">{(currentRes / gratingWL * 1e7).toFixed(2)} cm⁻¹</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><strong>Grating:</strong> δλ = w·d·cos(θ) / (m·f) ≈ w / (f·σ·m) · λ (small angle)</p>
        <p><strong>Prism:</strong> δλ = w / (f · dθ/dλ)</p>
        <p><strong>Fabry-Pérot:</strong> δλ = FSR / ℱ, R = ℱ · m ≈ λ/δλ</p>
        <p className="text-gray-500">ILS approximated as Lorentzian: L(λ) = 1 / [1 + ((λ−λ₀)/(δλ/2))²]</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Normalized Intensity", gridcolor: "#374151", range: [0, 1.1] },
        margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      }} />
    </CalculatorShell>
  );
}
