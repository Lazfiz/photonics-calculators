"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function OpticalSectioningPage() {
  const [na, setNa] = useState(1.4);
  const [wavelength, setWavelength] = useState(550);
  const [n, setN] = useState(1.52);
  const [pinholeAu, setPinholeAu] = useState(1.0);
  const [method, setMethod] = useState("confocal");

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const airyRadius = 1.22 * lam / (2 * na) * 1e6;
    const pinholeDia = pinholeAu * airyRadius;
    const widefieldAxial = 2 * n * lam / (na * na) * 1e6;
    const confocalAxial = widefieldAxial / Math.sqrt(1 + pinholeAu * pinholeAu * 0.3);
    const sectionThickness = confocalAxial;
    const opticalZoom = na / (2 * n * lam) * 1e6;
    return { airyRadius, pinholeDia, widefieldAxial, confocalAxial, sectionThickness, opticalZoom };
  }, [na, wavelength, n, pinholeAu, method]);

  const plotData = useMemo(() => {
    const auValues = [];
    const confAx = [];
    const wideAx = [];
    const lam = wavelength * 1e-9;
    const wfAx = 2 * n * lam / (na * na) * 1e6;
    for (let a = 0.1; a <= 5; a += 0.05) {
      auValues.push(a);
      confAx.push(wfAx / Math.sqrt(1 + a * a * 0.3));
      wideAx.push(wfAx);
    }
    return [
      { x: auValues, y: confAx, name: "Confocal", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: auValues, y: wideAx, name: "Widefield", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [na, wavelength, n]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:underline mb-6 inline-block">← Imaging &amp; Microscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Optical Sectioning Calculator</h1>
      <p className="text-gray-400 mb-8">Optical section thickness for confocal and widefield microscopy.</p>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">NA</label>
            <input type="number" step={0.01} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <input type="number" step={0.01} value={n} onChange={e => setN(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pinhole size (AU)</label>
            <input type="number" step={0.1} min={0.1} max={5} value={pinholeAu} onChange={e => setPinholeAu(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Airy radius</span><span className="font-mono">{results.airyRadius.toFixed(3)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Pinhole diameter</span><span className="font-mono text-blue-400">{results.pinholeDia.toFixed(3)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Widefield axial extent</span><span className="font-mono text-red-400">{results.widefieldAxial.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Confocal section thickness</span><span className="font-mono text-green-400">{results.confocalAxial.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Improvement factor</span><span className="font-mono text-yellow-400">{(results.widefieldAxial / results.confocalAxial).toFixed(2)}×</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Airy radius: r = 1.22λ/(2NA)</p>
            <p>Widefield axial: d = 2nλ/NA²</p>
            <p>Confocal: d_conf ≈ d_wf / √(1 + 0.3·AU²)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Section Thickness vs Pinhole Size (AU)</h2>
        <Plot data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Pinhole (AU)", gridcolor: "#333" }, yaxis: { title: "Axial extent (µm)", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: "100%", height: "400px" }} />
      </div>
    </div>
  );
}
