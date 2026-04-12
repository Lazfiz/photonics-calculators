"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function SpectralResolutionPage() {
  const [mode, setMode] = useState("grating");
  const [grooveDensity, setGrooveDensity] = useURLState("grooveDensity", 1200);
  const [focalLength, setFocalLength] = useURLState("focalLength", 500);
  const [slitWidth, setSlitWidth] = useURLState("slitWidth", 25);
  const [order, setOrder] = useURLState("order", 1);
  const [gratingWL, setGratingWL] = useURLState("gratingWL", 500);
  const [dispersion, setDispersion] = useURLState("dispersion", 0.02);
  const [finesse, setFinesse] = useURLState("finesse", 50);
  const [fsrNm, setFsrNm] = useURLState("fsrNm", 0.05);

  // Slit-limited resolution: δλ = s·d·cosβ/(m·f). s in μm→mm, d=1/g lines/mm, f in mm
  const d_mm = 1 / grooveDensity;
  const betaRad = Math.asin(order * gratingWL * 1e-6 / d_mm - Math.sin(centralAngle * Math.PI / 180));
  const gratingResNm = (slitWidth * 1e-3 * d_mm * Math.cos(betaRad)) / (focalLength * order) * 1e6;
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
        <ValidatedNumberInput label="Central Wavelength (nm)" value={gratingWL} onChange={setGratingWL} min={100} />
        {mode === "grating" && <>
          <ValidatedNumberInput label="Groove Density (lines/mm)" value={grooveDensity} onChange={setGrooveDensity} min={10} />
          <ValidatedNumberInput label="Focal Length (mm)" value={focalLength} onChange={setFocalLength} min={10} />
          <ValidatedNumberInput label="Slit Width (μm)" value={slitWidth} onChange={setSlitWidth} min={1} />
          <ValidatedNumberInput label="Diffraction Order" value={order} onChange={setOrder} min={1} max={10} />
        </>}
        {mode === "prism" && <>
          <ValidatedNumberInput label="Slit Width (μm)" value={slitWidth} onChange={setSlitWidth} min={1} />
          <ValidatedNumberInput label="Focal Length (mm)" value={focalLength} onChange={setFocalLength} min={10} />
          <ValidatedNumberInput label="Angular Dispersion (rad/nm)" value={dispersion} onChange={setDispersion} min={1e-5} step="0.001" />
        </>}
        {mode === "fabry-perot" && <>
          <ValidatedNumberInput label="Finesse ℱ" value={finesse} onChange={setFinesse} min={2} step="1" />
          <ValidatedNumberInput label="FSR (nm)" value={fsrNm} onChange={setFsrNm} min={0.001} step="0.01" />
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
          <p className="text-xl font-bold text-blue-400">{(currentRes * 1e7 / (gratingWL * gratingWL)).toFixed(2)} cm⁻¹</p>
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
