"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function WavefrontSensorPage() {
  const [numLenslets, setNumLenslets] = useState(12);
  const [lensletPitch, setLensletPitch] = useState(150); // µm
  const [focalLength, setFocalLength] = useState(18); // mm
  const [wavelength, setWavelength] = useState(550);
  const [pixelSize, setPixelSize] = useState(5.5); // µm
  const [sensorSize, setSensorSize] = useState(6.5); // mm

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const spotSize = 1.22 * focalLength * 1e-3 * lam / (lensletPitch * 1e-6) * 1e6; // µm
    const dynamicRange = (lensletPitch / 2) / (spotSize / 2);
    const sensitivity = spotSize * pixelSize / (2 * focalLength * 1e3); // waves/pixel
    const fov = sensorSize * 1e3 / (focalLength * 1e3) * 1e3; // mrad
    const minWavefrontRes = pixelSize / (lensletPitch * 1e-6) * lam * 1e9; // nm
    const numActuators = numLenslets * numLenslets;
    const subapDiam = lensletPitch * 1e-6; // m
    const coherentLength = (0.31 * lam / (numLenslets * 0.1 + 0.01)) * 1e9; // rough r0 estimate, nm
    const crossTalk = Math.exp(-(lensletPitch / (spotSize * 2)) ** 2) * 100;
    return { spotSize, dynamicRange, sensitivity, fov, minWavefrontRes, numActuators, crossTalk, coherentLength };
  }, [numLenslets, lensletPitch, focalLength, wavelength, pixelSize, sensorSize]);

  const plotData = useMemo(() => {
    const pitches = [];
    const spotSizes = [];
    const dynRanges = [];
    const lam = wavelength * 1e-9;
    for (let p = 50; p <= 500; p += 5) {
      pitches.push(p);
      const ss = 1.22 * focalLength * 1e-3 * lam / (p * 1e-6) * 1e6;
      spotSizes.push(ss);
      dynRanges.push((p / 2) / (ss / 2));
    }
    return [
      { x: pitches, y: spotSizes, name: "Spot size (µm)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines", yaxis: "y" },
      { x: pitches, y: dynRanges, name: "Dynamic range", line: { color: "#f87171" }, type: "scatter", mode: "lines", yaxis: "y2" },
    ];
  }, [focalLength, wavelength]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:underline mb-6 inline-block">← Imaging &amp; Microscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Shack-Hartmann Wavefront Sensor Calculator</h1>
      <p className="text-gray-400 mb-8">Design parameters for Shack-Hartmann wavefront sensors including spot size, sensitivity, and dynamic range.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lenslets across aperture</label>
            <input type="number" step={1} min={4} max={64} value={numLenslets} onChange={e => setNumLenslets(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lenslet pitch (µm)</label>
            <input type="number" step={10} value={lensletPitch} onChange={e => setLensletPitch(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lenslet focal length (mm)</label>
            <input type="number" step={1} value={focalLength} onChange={e => setFocalLength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Camera pixel size (µm)</label>
            <input type="number" step={0.1} value={pixelSize} onChange={e => setPixelSize(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Camera sensor size (mm)</label>
            <input type="number" step={0.5} value={sensorSize} onChange={e => setSensorSize(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
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
            <p>Spot: d = 1.22·f·λ/d_lenslet</p>
            <p>Dynamic range ≈ pitch / spot_size</p>
            <p>Sensitivity ≈ λ·(pixel/pitch)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Spot Size &amp; Dynamic Range vs Lenslet Pitch</h2>
        <Plot data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Lenslet pitch (µm)", gridcolor: "#333" },
          yaxis: { title: "Spot size (µm)", gridcolor: "#333" },
          yaxis2: { title: "Dynamic range", gridcolor: "#333", overlaying: "y", side: "right" },
          legend: { font: { size: 11 } }, margin: { l: 60, r: 60, t: 20, b: 60 }
        }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "400px" }} />
      </div>
    </div>
  );
}
