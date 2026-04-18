"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ShackHartmannPage() {
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelengthNm", 632.8);
  const [apertureDiameterMm, setApertureDiameterMm] = useURLState("apertureDiameterMm", 8);
  const [lensletPitchUm, setLensletPitchUm] = useURLState("lensletPitchUm", 300);
  const [lensletFocalMm, setLensletFocalMm] = useURLState("lensletFocalMm", 20);
  const [detectorPixelUm, setDetectorPixelUm] = useURLState("detectorPixelUm", 5.5);
  const [rmsWavefrontNm, setRmsWavefrontNm] = useURLState("rmsWavefrontNm", 150);
  const [dynamicRangeWaves, setDynamicRangeWaves] = useURLState("dynamicRangeWaves", 5);
  const [numSubapertures, setNumSubapertures] = useURLState("numSubapertures", 0);

  const lambda = wavelengthNm * 1e-9;
  const D = apertureDiameterMm * 1e-3;
  const d = lensletPitchUm * 1e-6;
  const f = lensletFocalMm * 1e-3;
  const rmsWaves = rmsWavefrontNm / wavelengthNm;

  const calculatedSubaps = Math.round((D / d) ** 2);
  const totalSubaps = numSubapertures > 0 ? numSubapertures : calculatedSubaps;
  const subapDiameter = D / Math.sqrt(totalSubaps) * 1e3; // mm
  const diffLimit = 1.22 * lambda * f / d * 1e6; // µm spot size on detector
  const spotSizePixels = diffLimit / detectorPixelUm;
  const angularSensitivity = detectorPixelUm * 1e-6 / f; // rad/px
  const wavefrontSensitivity = angularSensitivity * d * 1e9; // nm/px
  const dynamicRangeNm = dynamicRangeWaves * wavelengthNm;
  const maxTilt = dynamicRangeWaves * wavelengthNm * 1e-6 / subapDiameter; // rad (nm→mm via 1e-6)
  const strehl = Math.exp(-((2 * Math.PI * rmsWaves) ** 2));

  const centroidNoise = useMemo(() => {
    const photons = Array.from({ length: 30 }, (_, i) => 10 + i * 100);
    const noise = photons.map(n => detectorPixelUm / Math.sqrt(n));
    return [
      { x: photons, y: noise, type: "scatter", mode: "lines" as const, name: "Centroid Noise", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [detectorPixelUm]);

  const spotSizeChart = useMemo(() => {
    const pitches = Array.from({ length: 30 }, (_, i) => 100 + i * 20);
    const spots = pitches.map(p => 1.22 * lambda * f / (p * 1e-6) * 1e6);
    return [
      { x: pitches, y: spots, type: "scatter", mode: "lines" as const, name: "Spot Size", line: { color: "#34d399", width: 2 } },
      { x: [lensletPitchUm], y: [diffLimit], type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [lambda, lensletPitchUm, diffLimit]);

  const subapertureGrid = useMemo(() => {
    const n = Math.round(Math.sqrt(totalSubaps));
    const x = [], y = [], s = [], c = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        x.push(i);
        y.push(j);
        const tilt = 0.5 * Math.sin(i * 0.5) + 0.3 * Math.cos(j * 0.7);
        s.push(tilt);
        c.push(tilt > 0 ? "#60a5fa" : "#f87171");
      }
    }
    return [{ x, y, type: "scatter", mode: "markers" as const, marker: { size: 12, color: c }, showlegend: false }];
  }, [totalSubaps]);

  const dynamicRangeChart = useMemo(() => {
    const waves = Array.from({ length: 20 }, (_, i) => 0.5 + i * 0.5);
    const nm = waves.map(w => w * wavelengthNm);
    return [{ x: waves, y: nm, type: "scatter", mode: "lines" as const, name: "Dynamic Range", line: { color: "#a78bfa", width: 2 } }];
  }, [wavelengthNm]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Shack-Hartmann Sensor" description="SHWFS design: spot size, centroid precision, sensitivity, dynamic range, and sub-aperture layout.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Sub-apertures</p>
          <p className="text-2xl font-bold text-blue-400">{totalSubaps}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spot Size (Airy)</p>
          <p className="text-2xl font-bold text-green-400">{diffLimit.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Wavefront Sensitivity</p>
          <p className="text-2xl font-bold text-yellow-400">{wavefrontSensitivity.toFixed(1)} nm/px</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Strehl Ratio</p>
          <p className="text-2xl font-bold text-purple-400">{strehl.toFixed(3)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={400} max={1100} step="10" />
        <ValidatedNumberInput label="Aperture (mm)" value={apertureDiameterMm} onChange={setApertureDiameterMm} min={1} max={100} step="1" />
        <ValidatedNumberInput label="Lenslet Pitch (µm)" value={lensletPitchUm} onChange={setLensletPitchUm} min={50} max={1000} step="10" />
        <ValidatedNumberInput label="Lenslet f (mm)" value={lensletFocalMm} onChange={setLensletFocalMm} min={1} max={100} step="1" />
        <ValidatedNumberInput label="Detector Pixel (µm)" value={detectorPixelUm} onChange={setDetectorPixelUm} min={1} max={20} step="0.5" />
        <ValidatedNumberInput label="RMS Wavefront (nm)" value={rmsWavefrontNm} onChange={setRmsWavefrontNm} min={1} max={2000} step="5" />
        <ValidatedNumberInput label="Dynamic Range (waves)" value={dynamicRangeWaves} onChange={setDynamicRangeWaves} min={0.5} max={20} step="0.5" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="space-y-2 text-gray-300 text-sm font-mono">
          <p>Δx = f · ∂W/∂x — Local wavefront tilt → spot displacement</p>
          <p>d_spot = 1.22 λ f / d_lenslet — Airy disk at detector</p>
          <p>σ_centroid = p_det / √N_ph — Photon-limited centroid precision</p>
          <p>DR = Δx_max / d_spot — Dynamic range in spot diameters</p>
          <p>σ_W = (p / f) · d_lenslet — Wavefront sensitivity (nm/px)</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Sub-aperture Grid (tilt visualization)</h3>
          <ChartPanel data={subapertureGrid} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "x", scaleanchor: "y" }, yaxis: { title: "y" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Spot Size vs Lenslet Pitch</h3>
          <ChartPanel data={spotSizeChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Lenslet Pitch (µm)" }, yaxis: { title: "Spot Size (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Centroid Noise vs Photons</h3>
          <ChartPanel data={centroidNoise} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Photons/subap" }, yaxis: { title: "Noise (µm)" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Dynamic Range</h3>
          <ChartPanel data={dynamicRangeChart} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Waves" }, yaxis: { title: "nm" }, margin: { t: 20, b: 40, l: 50, r: 20 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
