"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function PixelCrosstalkPage() {
  const [pixelPitch, setPixelPitch] = useURLState("pixelPitch", 5.0); // µm
  const [depletionDepth, setDepletionDepth] = useURLState("depletionDepth", 10); // µm
  const [wavelength, setWavelength] = useURLState("wavelength", 550); // nm
  const [crosstalkCoeff, setCrosstalkCoeff] = useURLState("crosstalkCoeff", 0.03); // electrical crosstalk fraction

  // Optical crosstalk from charge diffusion
  // Crosstalk increases with absorption depth (longer wavelength = deeper absorption)
  // Simple model: crosstalk ~ sqrt(absorption_depth / depletion_depth) for partially depleted
  const absorptionDepth = useMemo(() => {
    // Si absorption depth approximation (µm) vs wavelength (nm)
    // Rough fit to Si absorption coefficient data
    const wl = wavelength;
    if (wl < 400) return 0.1;
    if (wl < 500) return 0.5 + (wl - 400) * 0.04;
    if (wl < 700) return 4.5 + (wl - 500) * 0.08;
    if (wl < 900) return 20.5 + (wl - 700) * 0.6;
    return 140.5 + (wl - 900) * 1.5;
  }, [wavelength]);

  const diffusionCrosstalk = Math.min(0.5, Math.sqrt(absorptionDepth / depletionDepth) * 0.1);
  const totalCrosstalk = Math.sqrt(diffusionCrosstalk ** 2 + crosstalkCoeff ** 2);

  const mtfCrosstalk = (freq: number) => 1 / (1 + totalCrosstalk * (2 * Math.PI * freq * pixelPitch) ** 2);

  const chartData = useMemo(() => {
    // Crosstalk vs wavelength
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 700 / 300);
    const absDepths = wls.map(wl => {
      if (wl < 400) return 0.1;
      if (wl < 500) return 0.5 + (wl - 400) * 0.04;
      if (wl < 700) return 4.5 + (wl - 500) * 0.08;
      if (wl < 900) return 20.5 + (wl - 700) * 0.6;
      return 140.5 + (wl - 900) * 1.5;
    });
    const diffCt = absDepths.map(d => Math.min(0.5, Math.sqrt(d / depletionDepth) * 0.1));
    const totalCt = diffCt.map(dc => Math.sqrt(dc ** 2 + crosstalkCoeff ** 2));

    // MTF vs spatial frequency
    const freqs = Array.from({ length: 200 }, (_, i) => i * 1 / (pixelPitch) / 200);
    const mtf = freqs.map(f => 1 / (1 + totalCrosstalk * (2 * Math.PI * f * pixelPitch) ** 2));
    const mtfIdeal = freqs.map(f => f <= 1 / (2 * pixelPitch) ? 1 : 0); // Nyquist box

    return [
      { x: wls, y: diffCt.map(c => c * 100), type: "scatter" as const, mode: "lines" as const,
        name: "Diffusion Crosstalk", line: { color: "#60a5fa" }, xaxis: "x", yaxis: "y" },
      { x: wls, y: totalCt.map(c => c * 100), type: "scatter" as const, mode: "lines" as const,
        name: "Total Crosstalk", line: { color: "#f87171", width: 2 }, xaxis: "x", yaxis: "y" },
      { x: [wavelength], y: [totalCrosstalk * 100], type: "scatter" as const, mode: "markers" as const,
        name: "Selected λ", marker: { color: "#fbbf24", size: 10 }, xaxis: "x", yaxis: "y" },
      { x: freqs, y: mtf, type: "scatter" as const, mode: "lines" as const,
        name: "MTF (with crosstalk)", line: { color: "#34d399" }, xaxis: "x2", yaxis: "y2" },
      { x: freqs, y: mtfIdeal, type: "scatter" as const, mode: "lines" as const,
        name: "Ideal Pixel MTF", line: { color: "#9ca3af", dash: "dash" }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [wavelength, pixelPitch, depletionDepth, crosstalkCoeff, totalCrosstalk]);

  const nyquistFreq = 1 / (2 * pixelPitch); // cycles/µm
  const mtfAtNyquist = mtfCrosstalk(nyquistFreq);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Pixel Pitch (µm)" value={pixelPitch} onChange={setPixelPitch} min={0.5} step="0.1" />
        <ValidatedNumberInput label="Depletion Depth (µm)" value={depletionDepth} onChange={setDepletionDepth} min={1} step="1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={1100} />
        <ValidatedNumberInput label="Electrical Crosstalk" value={crosstalkCoeff} onChange={setCrosstalkCoeff} min={0} max={0.5} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Absorption Depth" value={`${absorptionDepth.toFixed(1)} µm`} tone="blue" />
        <ResultCard label="Diffusion Crosstalk" value={`${(diffusionCrosstalk * 100).toFixed(2)}%`} tone="green" />
        <ResultCard label="Total Crosstalk" value={`${(totalCrosstalk * 100).toFixed(2)}%`} tone="red" />
        <ResultCard label="MTF @ Nyquist" value={`${(mtfAtNyquist * 100).toFixed(1)}%`} tone="yellow" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Optical crosstalk ~ √(d<sub>abs</sub> / d<sub>depl</sub>) (charge diffusion model)</p>
        <p>Total = √(crosstalk<sub>optical</sub>² + crosstalk<sub>electrical</sub>²)</p>
        <p>Nyquist frequency: f<sub>N</sub> = 1 / (2 · p), where p = pixel pitch</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Crosstalk vs Wavelength</p>
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af", size: 11 },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Crosstalk (%)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 }, legend: { bgcolor: "transparent", font: { size: 9 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">MTF Degradation</p>
          <ChartPanel data={chartData.filter((_, i) => i >= 3)} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af", size: 11 },
            xaxis: { title: "Spatial Freq (cycles/µm)", gridcolor: "#374151", anchor: "y2" },
            yaxis: { title: "MTF", gridcolor: "#374151", anchor: "x2", domain: [0, 1] },
            xaxis2: { title: "Spatial Freq (cycles/µm)", gridcolor: "#374151", anchor: "y2" },
            yaxis2: { title: "MTF", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 }, legend: { bgcolor: "transparent", font: { size: 9 } },
          }} />
        </div>
      </div>
    </div>
  );
}
