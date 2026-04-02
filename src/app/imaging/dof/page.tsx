"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function DepthOfFieldPage() {
  const [na, setNa] = useState(0.4);
  const [wavelength, setWavelength] = useState(550);
  const [magnification, setMagnification] = useState(40);
  const [pixelSize, setPixelSize] = useState(6.5);
  const [n, setN] = useState(1.52);

  const results = useMemo(() => {
    const lambda_um = wavelength * 1e-3; // nm → µm
    const diffraction = (lambda_um * n) / (na * na);
    const detector = (n * pixelSize) / (magnification * na);
    const total = diffraction + detector;
    return { diffraction, detector, total };
  }, [na, wavelength, magnification, pixelSize, n]);

  const plotData = useMemo(() => {
    const nas: number[] = [];
    const diffs: number[] = [];
    const dets: number[] = [];
    const totals: number[] = [];
    for (let x = 0.05; x <= 1.5; x += 0.01) {
      nas.push(x);
      const lam = wavelength * 1e-3;
      const d = (lam * n) / (x * x);
      const e = (n * pixelSize) / (magnification * x);
      diffs.push(d);
      dets.push(e);
      totals.push(d + e);
    }
    return [
      { x: nas, y: totals, type: "scatter" as const, mode: "lines" as const, name: "Total DOF", line: { color: "#60a5fa" } },
      { x: nas, y: diffs, type: "scatter" as const, mode: "lines" as const, name: "Diffraction", line: { color: "#34d399", dash: "dash" } },
      { x: nas, y: dets, type: "scatter" as const, mode: "lines" as const, name: "Detector", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [wavelength, n, pixelSize, magnification]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:underline mb-6 inline-block">← Imaging &amp; Microscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Depth of Field</h1>
      <p className="text-gray-400 mb-8">Microscope depth of field including diffraction and detector contributions.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Numerical Aperture (NA)</label>
            <input type="number" step={0.01} min={0.01} max={1.8} value={na} onChange={e => setNa(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} min={200} max={2000} value={wavelength} onChange={e => setWavelength(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Magnification (×)</label>
            <input type="number" step={1} min={1} max={200} value={magnification} onChange={e => setMagnification(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pixel size (µm)</label>
            <input type="number" step={0.1} min={0.1} max={50} value={pixelSize} onChange={e => setPixelSize(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <input type="number" step={0.01} min={1} max={2} value={n} onChange={e => setN(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Diffraction contribution</span>
            <span className="font-mono text-green-400">{results.diffraction.toFixed(3)} µm</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Detector contribution</span>
            <span className="font-mono text-yellow-400">{results.detector.toFixed(3)} µm</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Total DOF</span>
            <span className="font-mono text-blue-400 text-lg font-bold">{results.total.toFixed(3)} µm</span>
          </div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>DOF = λn / NA² + ne / (M·NA)</p>
            <p>λ = wavelength, n = refractive index, e = pixel size, M = magnification</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">DOF vs NA</h2>
        <Plot
          data={plotData}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#ccc" },
            xaxis: { title: "NA", gridcolor: "#333" },
            yaxis: { title: "DOF (µm)", gridcolor: "#333" },
            legend: { font: { size: 10 } },
            margin: { l: 60, r: 20, t: 20, b: 40 },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%", height: "400px" }}
        />
      </div>
    </div>
  );
}
