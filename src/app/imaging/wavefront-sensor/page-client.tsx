"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function WavefrontSensorPage() {
  const [numLenslets, setNumLenslets] = useURLState("numLenslets", 12);
  const [lensletPitch, setLensletPitch] = useURLState("lensletPitch", 150); // µm
  const [focalLength, setFocalLength] = useURLState("focalLength", 18); // mm
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [pixelSize, setPixelSize] = useURLState("pixelSize", 5.5); // µm
  const [sensorSize, setSensorSize] = useURLState("sensorSize", 6.5); // mm

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const spotSize = 2.44 * focalLength * 1e-3 * lam / (lensletPitch * 1e-6) * 1e6; // µm (Airy diameter)
    const dynamicRange = lensletPitch / spotSize;
    const sensitivity = (pixelSize * lensletPitch) / (focalLength * wavelength); // waves/pixel (µm·µm)/(mm·nm)=1
    const fov = (lensletPitch * 1e-3) / (focalLength) * 1e3; // mrad (subaperture FOV)
    const minWavefrontRes = (pixelSize * 1e-6) / (focalLength * 1e-3) * (lensletPitch * 1e-6) * 1e9; // nm (slope × pitch)
    const numActuators = numLenslets * numLenslets;
    const subapDiam = lensletPitch * 1e-6; // m
    const coherentLength = (0.31 * lam / (numLenslets * 0.1 + 0.01)) * 1e9; // rough r0 estimate, nm
    const crossTalk = Math.exp(-Math.pow(lensletPitch / (spotSize * 2), 2)) * 100;
    return { spotSize, dynamicRange, sensitivity, fov, minWavefrontRes, numActuators, crossTalk };
  }, [numLenslets, lensletPitch, focalLength, wavelength, pixelSize, sensorSize]);

  const plotData = useMemo(() => {
    const pitches = [];
    const spotSizes = [];
    const dynRanges = [];
    const lam = wavelength * 1e-9;
    for (let p = 50; p <= 500; p += 5) {
      pitches.push(p);
      const ss = 2.44 * focalLength * 1e-3 * lam / (p * 1e-6) * 1e6;
      spotSizes.push(ss);
      dynRanges.push(p / ss);
    }
    return [
      { x: pitches, y: spotSizes, name: "Spot size (µm)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines", yaxis: "y" },
      { x: pitches, y: dynRanges, name: "Dynamic range", line: { color: "#f87171" }, type: "scatter", mode: "lines", yaxis: "y2" },
    ];
  }, [focalLength, wavelength]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Shack-Hartmann Wavefront Sensor Calculator" description="Design parameters for Shack-Hartmann wavefront sensors including spot size, sensitivity, and dynamic range.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lenslets across aperture</label>
            <ValidatedNumberInput label="Lenslets across aperture" value={numLenslets} onChange={setNumLenslets} min={4} max={64} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lenslet pitch (µm)</label>
            <ValidatedNumberInput label="Lenslet pitch (µm)" value={lensletPitch} onChange={setLensletPitch} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lenslet focal length (mm)</label>
            <ValidatedNumberInput label="Lenslet focal length (mm)" value={focalLength} onChange={setFocalLength} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Camera pixel size (µm)</label>
            <ValidatedNumberInput label="Camera pixel size (µm)" value={pixelSize} onChange={setPixelSize} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Camera sensor size (mm)</label>
            <ValidatedNumberInput label="Camera sensor size (mm)" value={sensorSize} onChange={setSensorSize} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Spot diameter (Airy)</span><span className="font-mono text-blue-400">{results.spotSize.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Dynamic range</span><span className="font-mono text-green-400">{results.dynamicRange.toFixed(1)}×</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Sensitivity</span><span className="font-mono text-yellow-400">{results.sensitivity.toExponential(2)} λ/pix</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Min wavefront res</span><span className="font-mono">{results.minWavefrontRes.toFixed(2)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Subaperture FOV</span><span className="font-mono">{results.fov.toFixed(1)} mrad</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Total subapertures</span><span className="font-mono">{results.numActuators}</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Spot: d = 2.44·f·λ/d_lenslet (Airy diameter)</p>
            <p>Dynamic range ≈ pitch / spot_size</p>
            <p>Sensitivity = (pixel·pitch) / (f·λ) [waves/px]</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Spot Size &amp; Dynamic Range vs Lenslet Pitch</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Lenslet pitch (µm)", gridcolor: "#333" },
          yaxis: { title: "Spot size (µm)", gridcolor: "#333" },
          yaxis2: { title: "Dynamic range", gridcolor: "#333", overlaying: "y", side: "right" },
          legend: { font: { size: 11 } }, margin: { l: 60, r: 60, t: 20, b: 60 }
        }} />
      </div>
    </CalculatorShell>
  );
}
