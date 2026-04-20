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
    // Si absorption depth (1/α) piecewise linear approximation
    // Reference: Green & Keevers, Sol. Energy Mater. Sol. Cells (1995)
    const wl = wavelength;
    if (wl < 350) return 0.01 + (wl - 300) * 0.0004;
    if (wl < 400) return 0.03 + (wl - 350) * 0.0014;
    if (wl < 450) return 0.1 + (wl - 400) * 0.008;
    if (wl < 500) return 0.5 + (wl - 450) * 0.01;
    if (wl < 550) return 1.0 + (wl - 500) * 0.014;
    if (wl < 600) return 1.7 + (wl - 550) * 0.016;
    if (wl < 700) return 2.5 + (wl - 600) * 0.025;
    if (wl < 800) return 5.0 + (wl - 700) * 0.05;
    if (wl < 900) return 10.0 + (wl - 800) * 0.2;
    if (wl < 1000) return 30.0 + (wl - 900) * 0.7;
    return 100.0 + (wl - 1000) * 4.0;
  }, [wavelength]);

  const diffusionCrosstalk = Math.min(0.5, Math.sqrt(absorptionDepth / depletionDepth) * 0.1);
  const totalCrosstalk = Math.sqrt(diffusionCrosstalk ** 2 + crosstalkCoeff ** 2);

  const mtfCrosstalk = (freq: number) => {
    const u = Math.PI * freq * pixelPitch;
    const sinc = u === 0 ? 1 : Math.abs(Math.sin(u) / u);
    return sinc / (1 + totalCrosstalk * (2 * Math.PI * freq * pixelPitch) ** 2);
  };

  const chartData = useMemo(() => {
    // Crosstalk vs wavelength
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * (1100 - 300) / 299);
    const absDepths = wls.map(wl => {
      // Si absorption depth (1/α) — same model as above
      if (wl < 350) return 0.01 + (wl - 300) * 0.0004;
      if (wl < 400) return 0.03 + (wl - 350) * 0.0014;
      if (wl < 450) return 0.1 + (wl - 400) * 0.008;
      if (wl < 500) return 0.5 + (wl - 450) * 0.01;
      if (wl < 550) return 1.0 + (wl - 500) * 0.014;
      if (wl < 600) return 1.7 + (wl - 550) * 0.016;
      if (wl < 700) return 2.5 + (wl - 600) * 0.025;
      if (wl < 800) return 5.0 + (wl - 700) * 0.05;
      if (wl < 900) return 10.0 + (wl - 800) * 0.2;
      if (wl < 1000) return 30.0 + (wl - 900) * 0.7;
      return 100.0 + (wl - 1000) * 4.0;
    });
    const diffCt = absDepths.map(d => Math.min(0.5, Math.sqrt(d / depletionDepth) * 0.1));
    const totalCt = diffCt.map(dc => Math.sqrt(dc ** 2 + crosstalkCoeff ** 2));

    // MTF vs spatial frequency
    const freqs = Array.from({ length: 200 }, (_, i) => i * 1 / (pixelPitch) / 200);
    const mtf = freqs.map((f, i) => mtfIdeal[i] / (1 + totalCrosstalk * (2 * Math.PI * f * pixelPitch) ** 2));
    const mtfIdeal = freqs.map(f => { const u = Math.PI * f * pixelPitch; return u === 0 ? 1 : Math.abs(Math.sin(u) / u); }); // sinc

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
