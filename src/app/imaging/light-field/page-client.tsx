"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function LightFieldPage() {
  const [na, setNa] = useURLState("na", 0.2);
  const [magnification, setMagnification] = useURLState("magnification", 20);
  const [pixelSize, setPixelSize] = useURLState("pixelSize", 6.5);
  const [microlensPitch, setMicrolensPitch] = useURLState("microlensPitch", 150);
  const [wavelength, setWavelength] = useURLState("wavelength", 550);

  const results = useMemo(() => {
    const lambda_um = wavelength * 1e-3;
    const resLateral = 0.61 * lambda_um / na;
    const rayPixels = microlensPitch / pixelSize; // MLA pitch / sensor pixel pitch (image space)
    const angularRange = Math.asin(Math.min(na, 1)); // objective collection cone half-angle
    const resAngular = angularRange / rayPixels; // angular sampling per pixel
    const depthOfField = lambda_um / (na * na); // simplified diffraction DOF
    const subApertureNA = na / rayPixels; // NA per sub-aperture view

    const angles: number[] = [];
    const psfSizes: number[] = [];
    const anglesDeg: number[] = [];
    for (let a = -angularRange; a <= angularRange; a += angularRange / 100) {
      angles.push(a);
      anglesDeg.push(a * 180 / Math.PI);
      const blur = Math.abs(a) * (microlensPitch / na);
      psfSizes.push(blur);
    }

    return { resLateral, resAngular, angularRange, rayPixels, depthOfField, subApertureNA, angles, anglesDeg, psfSizes };
  }, [na, magnification, pixelSize, microlensPitch, wavelength]);

  const plotData = useMemo(() => [
    {
      x: results.anglesDeg, y: results.psfSizes.map(v => v * 1000),
      type: "scatter" as const, mode: "lines" as const,
      name: "Angular PSF spread", line: { color: "#60a5fa", width: 2 },
    },
  ], [results]);

  const darkLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d1d5db" }, xaxis: { title: "Angle (°)", gridcolor: "#374151" },
    yaxis: { title: "PSF Spread (nm)", gridcolor: "#374151" },
    legend: { x: 0.02, y: 0.95 }, margin: { t: 30, r: 30, b: 50, l: 60 },
  };

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Light Field Microscopy" description="Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <ValidatedNumberInput label="Objective NA" value={na} onChange={setNa} min={0.05} max={1.8} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Magnification</label>
            <ValidatedNumberInput label="Magnification" value={magnification} onChange={setMagnification} min={1} max={200} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pixel Size (µm)</label>
            <ValidatedNumberInput label="Pixel Size (µm)" value={pixelSize} onChange={setPixelSize} min={1} max={20} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Microlens Pitch (µm)</label>
            <ValidatedNumberInput label="Microlens Pitch (µm)" value={microlensPitch} onChange={setMicrolensPitch} min={50} max={500} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={2000} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Lateral Resolution</div>
              <div className="text-xl font-mono text-blue-400">{(results.resLateral * 1000).toFixed(1)} nm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Angular Resolution</div>
              <div className="text-xl font-mono text-green-400">{(results.resAngular * 1000).toFixed(2)} mrad</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Rays per Microlens</div>
              <div className="text-xl font-mono text-gray-300">{results.rayPixels.toFixed(1)} px</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Depth of Field</div>
              <div className="text-xl font-mono text-yellow-400">{results.depthOfField.toFixed(2)} µm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Sub-aperture NA</div>
              <div className="text-xl font-mono text-purple-400">{results.subApertureNA.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <ChartPanel data={plotData} layout={darkLayout} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>r_lateral = 0.61 λ / NA</p>
          <p>Δθ = θ_max / N_rays</p>
          <p>θ_max = arcsin(NA)</p>
          <p>N_rays = p_ML / p_pixel</p>
          <p>NA_sub = NA / N_rays</p>
        </div>
        <div className="text-sm text-gray-400 mt-4 space-y-1">
          <p>Light field microscopy captures both spatial and angular information by placing a microlens array at the native image plane. Each microlens samples a different spatial position while the pixels behind it encode angular rays.</p>
          <p>The spatial-angular tradeoff means increasing angular sampling (more rays per microlens) reduces spatial sampling and vice versa. Synthetic aperture techniques can recover resolution by computationally combining views.</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
