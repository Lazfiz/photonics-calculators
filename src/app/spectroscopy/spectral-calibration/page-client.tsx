"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function SpectralCalibrationPage() {
  const [pixelCount, setPixelCount] = useURLState("pixelCount", 2048);
  const [centerWl, setCenterWl] = useURLState("centerWl", 600); // nm
  const [spectralWidth, setSpectralWidth] = useURLState("spectralWidth", 300); // nm total range
  const [lineWls, setLineWls] = useState("589.0,589.6,632.8,543.5,546.1");
  const [lineNames, setLineNames] = useState("Na D2,Na D1,HeNe,Green,Mercury");
  const [pixelNoise, setPixelNoise] = useURLState("pixelNoise", 0.5); // nm

  const chartData = useMemo(() => {
    const wls = lineWls.split(",").map(Number);
    const names = lineNames.split(",");
    const dispersion = spectralWidth / pixelCount; // nm/pixel

    // Map wavelength to pixel (linear)
    const wlToPixel = (wl: number) => ((wl - (centerWl - spectralWidth / 2)) / spectralWidth) * pixelCount;
    const pixelToWl = (px: number) => centerWl - spectralWidth / 2 + (px / pixelCount) * spectralWidth;

    // True positions + noise
    const truePixels = wls.map(wlToPixel);
    const measuredPixels = truePixels.map(p => p + (pixelNoise / dispersion) * (Math.random() - 0.5) * 2);

    // Linear fit through measured points
    const n = measuredPixels.length;
    const sx = measuredPixels.reduce((a, b) => a + b, 0);
    const sy = wls.reduce((a, b) => a + b, 0);
    const sxx = measuredPixels.reduce((a, b) => a + b * b, 0);
    const sxy = measuredPixels.reduce((a, b, i) => a + measuredPixels[i] * wls[i], 0);
    const denom = n * sxx - sx * sx;
    const slope = (n * sxy - sx * sy) / denom;
    const intercept = (sy - slope * sx) / n;

    // Calibration curve
    const calPixels = Array.from({ length: 200 }, (_, i) => (i / 199) * pixelCount);
    const trueWls = calPixels.map(pixelToWl);
    const fittedWls = calPixels.map(p => slope * p + intercept);
    const residual = fittedWls.map((fw, i) => fw - trueWls[i]);

    return {
      lines: wls.map((wl, i) => ({
        x: [wlToPixel(wl), wlToPixel(wl)], y: [0, 1], type: "scatter" as const, mode: "lines" as const,
        name: names[i] || `Line ${i}`, line: { color: "#fbbf24", dash: "dash", width: 1 }, showlegend: false,
      })),
      calCurve: [
        { x: calPixels, y: trueWls, type: "scatter" as const, mode: "lines" as const, name: "True λ(pixel)", line: { color: "#60a5fa" } },
        { x: calPixels, y: fittedWls, type: "scatter" as const, mode: "lines" as const, name: "Linear Fit", line: { color: "#f87171", dash: "dot" } },
        { x: measuredPixels, y: wls, type: "scatter" as const, mode: "markers" as const, name: "Measured Lines", marker: { color: "#fbbf24", size: 10 } },
      ],
      residual: { x: calPixels, y: residual, type: "scatter" as const, mode: "lines" as const, name: "Residual (nm)", line: { color: "#34d399" } },
      slope, intercept, dispersion,
    };
  }, [pixelCount, centerWl, spectralWidth, lineWls, lineNames, pixelNoise]);

  const dispersionNm = spectralWidth / pixelCount;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Spectral Calibration" description="Wavelength calibration using known emission lines and linear/polynomial fitting.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pixel Count" value={pixelCount} onChange={setPixelCount} min={64} />
        <ValidatedNumberInput label="Center λ (nm)" value={centerWl} onChange={setCenterWl} min={100} />
        <ValidatedNumberInput label="Spectral Width (nm)" value={spectralWidth} onChange={setSpectralWidth} min={1} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Line Wavelengths (nm, comma)</span>
          <input type="text" value={lineWls} onChange={e => setLineWls(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Line Names (comma)</span>
          <input type="text" value={lineNames} onChange={e => setLineNames(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Pixel Noise (nm)" value={pixelNoise} onChange={setPixelNoise} min={0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dispersion</p>
          <p className="text-xl font-bold text-blue-400">{dispersionNm.toFixed(4)} nm/px</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fit Slope</p>
          <p className="text-xl font-bold text-green-400">{chartData.slope.toFixed(6)} nm/px</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fit Intercept</p>
          <p className="text-xl font-bold text-yellow-400">{chartData.intercept.toFixed(2)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">λ = a·pixel + b</span> — linear calibration (first order).</p>
        <p><span className="text-green-400 font-mono">λ = a·pixel² + b·pixel + c</span> — quadratic for nonlinear dispersion.</p>
        <p>Use known atomic emission lines (Hg, Ne, Ar, Na) as reference wavelengths.</p>
      </div>

      <ChartPanel data={[...chartData.calCurve]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Pixel Number", gridcolor: "#374151" },
        yaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        height: 350, margin: { t: 30, b: 40 },
      }} />

      <ChartPanel data={[chartData.residual]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Pixel Number", gridcolor: "#374151" },
        yaxis: { title: "Residual (nm)", gridcolor: "#374151" },
        height: 250, margin: { t: 20, b: 40 },
      }} />
    </CalculatorShell>
  );
}
