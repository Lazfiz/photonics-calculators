"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function PlenopticCameraPage() {
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelengthNm", 550);
  const [mainLensFocalMm, setMainLensFocalMm] = useURLState("mainLensFocalMm", 50);
  const [mainLensNA, setMainLensNA] = useURLState("mainLensNA", 0.2);
  const [microLensFocalMm, setMicroLensFocalMm] = useURLState("microLensFocalMm", 0.5);
  const [microLensPitchUm, setMicroLensPitchUm] = useURLState("microLensPitchUm", 150);
  const [pixelPitchUm, setPixelPitchUm] = useURLState("pixelPitchUm", 5.5);
  const [pixelsPerMicroLens, setPixelsPerMicroLens] = useURLState("pixelsPerMicroLens", 15);
  const [sensorWidthPx, setSensorWidthPx] = useURLState("sensorWidthPx", 4000);
  const [sensorHeightPx, setSensorHeightPx] = useURLState("sensorHeightPx", 3000);

  const lambdaUm = wavelengthNm * 1e-3;
  const fNumber = 1 / (2 * mainLensNA);
  const angularRes = Math.atan(pixelPitchUm / (microLensFocalMm * 1000)) * 180 / Math.PI * 60; // arcmin
  const spatialRes = microLensPitchUm;
  const numMicroLensX = Math.floor(sensorWidthPx / pixelsPerMicroLens);
  const numMicroLensY = Math.floor(sensorHeightPx / pixelsPerMicroLens);
  const totalViews = pixelsPerMicroLens ** 2;
  const depthRange = 2 * mainLensFocalMm * microLensFocalMm / (microLensPitchUm / 1000); // mm (approx)
  const lightFieldSize = numMicroLensX * numMicroLensY * totalViews;
  const fileMBytes = lightFieldSize * 2 / 1e6;
  const refocusedRange = (microLensPitchUm * pixelsPerMicroLens / 2 / 1000) * mainLensFocalMm / microLensFocalMm; // mm approx

  const depthVsPitch = useMemo(() => {
    const pitches = Array.from({ length: 30 }, (_, i) => 50 + i * 10);
    const depths = pitches.map(p => 2 * mainLensFocalMm * (microLensFocalMm) / (p / 1000));
    return [
      { x: pitches, y: depths, type: "scatter", mode: "lines" as const, name: "Depth Range", line: { color: "#60a5fa", width: 2 } },
      { x: [microLensPitchUm], y: [depthRange], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 } },
    ];
  }, [mainLensFocalMm, microLensFocalMm, microLensPitchUm, depthRange]);

  const viewsChart = useMemo(() => {
    const pml = Array.from({ length: 20 }, (_, i) => 5 + i * 2);
    const views = pml.map(p => p ** 2);
    const res = pml.map(p => microLensPitchUm); // spatial res stays same
    return [
      { x: pml, y: views, type: "scatter", mode: "lines" as const, name: "Total Views", line: { color: "#34d399", width: 2 }, yaxis: "y" },
      { x: [pixelsPerMicroLens], y: [totalViews], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 12 }, yaxis: "y" },
    ];
  }, [pixelsPerMicroLens, totalViews]);

  const tradeoffChart = useMemo(() => {
    const pml = Array.from({ length: 15 }, (_, i) => 5 + i * 3);
    const spatial = pml.map(() => spatialRes);
    const angular = pml.map(p => Math.atan(pixelPitchUm / (microLensFocalMm * 1000)) * 180 / Math.PI * 60 / p * p);
    return [
      { x: pml, y: pml.map(p => microLensPitchUm / p), type: "bar" as const, name: "Eff. Spatial (µm)", marker: { color: "#a78bfa" } },
    ];
  }, [microLensPitchUm, pixelPitchUm, microLensFocalMm]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Plenoptic Camera Design" description="Light field camera parameters: spatial-angular tradeoff, refocusing range, and data budgets.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spatial Resolution</p>
          <p className="text-2xl font-bold text-blue-400">{spatialRes} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular Resolution</p>
          <p className="text-2xl font-bold text-green-400">{angularRes.toFixed(1)} arcmin</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Views</p>
          <p className="text-2xl font-bold text-yellow-400">{totalViews}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Light Field Data</p>
          <p className="text-2xl font-bold text-purple-400">{fileMBytes.toFixed(0)} MB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={400} max={800} step="10" />
        <ValidatedNumberInput label="Main Lens f (mm)" value={mainLensFocalMm} onChange={setMainLensFocalMm} min={5} max={200} step="5" />
        <ValidatedNumberInput label="Main Lens NA" value={mainLensNA} onChange={setMainLensNA} min={0.05} max={0.5} step="0.01" />
        <ValidatedNumberInput label="Micro-lens f (mm)" value={microLensFocalMm} onChange={setMicroLensFocalMm} min={0.1} max={5} step="0.1" />
        <ValidatedNumberInput label="Micro-lens Pitch (µm)" value={microLensPitchUm} onChange={setMicroLensPitchUm} min={50} max={500} step="10" />
        <ValidatedNumberInput label="Pixels per Micro-lens" value={pixelsPerMicroLens} onChange={setPixelsPerMicroLens} min={3} max={30} step="1" />
        <ValidatedNumberInput label="Pixel Pitch (µm)" value={pixelPitchUm} onChange={setPixelPitchUm} min={1} max={15} step="0.5" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>L(u,v,s,t) — 4D light field parameterization</p>
          <p>Δθ = atan(Δp_pixel / f_µ) — Angular resolution</p>
          <p>Δx_spatial = p_µ — Spatial resolution (micro-lens pitch)</p>
          <p>Refocus: α·L(u,v,s + αu,t + αv) for virtual plane at 1/α</p>
          <p>Tradeoff: Δx · Δθ ≥ λ / D (diffraction limit)</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Depth Range vs Micro-lens Pitch</h3>
          <ChartPanel data={depthVsPitch} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Pitch (µm)" }, yaxis: { title: "Depth Range (mm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Views vs Pixels/Micro-lens</h3>
          <ChartPanel data={viewsChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "px/µ-lens" }, yaxis: { title: "Total Views" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Spatial-Angular Tradeoff</h3>
          <ChartPanel data={tradeoffChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "px/µ-lens" }, yaxis: { title: "Eff. Spatial Res. (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
