"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function CCDvsCMOSPage() {
  const [pixelSize, setPixelSize] = useState(6.5);
  const [readNoiseCCD, setReadNoiseCCD] = useState(3);
  const [readNoiseCMOS, setReadNoiseCMOS] = useState(1.5);
  const [fullWell, setFullWell] = useState(20000);
  const [darkCurrent, setDarkCurrent] = useState(0.01);
  const [exposureTime, setExposureTime] = useState(1);

  const darkNoise = Math.sqrt(darkCurrent * exposureTime);
  const ccdSNR = fullWell > 0 ? fullWell / Math.sqrt(fullWell + readNoiseCCD ** 2 + darkNoise ** 2) : 0;
  const cmosSNR = fullWell > 0 ? fullWell / Math.sqrt(fullWell + readNoiseCMOS ** 2 + darkNoise ** 2) : 0;
  const dynamicRangeCCD = fullWell / readNoiseCCD;
  const dynamicRangeCMOS = fullWell / readNoiseCMOS;

  const chartData = useMemo(() => {
    const signals = Array.from({ length: 100 }, (_, i) => (i + 1) * (fullWell / 100));
    const dn = Math.sqrt(darkCurrent * exposureTime);
    return [
      { x: signals, y: signals.map(s => s / Math.sqrt(Math.max(s, 1) + readNoiseCCD ** 2 + dn ** 2)), type: "scatter" as const, mode: "lines" as const, name: "CCD", line: { color: "#60a5fa" } },
      { x: signals, y: signals.map(s => s / Math.sqrt(Math.max(s, 1) + readNoiseCMOS ** 2 + dn ** 2)), type: "scatter" as const, mode: "lines" as const, name: "CMOS", line: { color: "#34d399" } },
    ];
  }, [fullWell, readNoiseCCD, readNoiseCMOS, darkCurrent, exposureTime]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">CCD vs CMOS Comparison</h1>
      <p className="text-gray-400 mb-8">Compare SNR and dynamic range between CCD and CMOS detectors with configurable parameters.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Pixel Size (µm)</span>
          <input type="number" value={pixelSize} onChange={e => setPixelSize(+e.target.value)} min={1} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">CCD Read Noise (e⁻)</span>
          <input type="number" value={readNoiseCCD} onChange={e => setReadNoiseCCD(+e.target.value)} min={0.5} step="0.5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">CMOS Read Noise (e⁻)</span>
          <input type="number" value={readNoiseCMOS} onChange={e => setReadNoiseCMOS(+e.target.value)} min={0.3} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Full Well Capacity (e⁻)</span>
          <input type="number" value={fullWell} onChange={e => setFullWell(+e.target.value)} min={1000} step="1000"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Dark Current (e⁻/px/s)</span>
          <input type="number" value={darkCurrent} onChange={e => setDarkCurrent(+e.target.value)} min={0} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min={0.001} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">CCD SNR (full well)</p>
          <p className="text-2xl font-bold text-blue-400">{ccdSNR.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">CMOS SNR (full well)</p>
          <p className="text-2xl font-bold text-green-400">{cmosSNR.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">CCD Dynamic Range</p>
          <p className="text-2xl font-bold text-yellow-400">{(20 * Math.log10(dynamicRangeCCD)).toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">CMOS Dynamic Range</p>
          <p className="text-2xl font-bold text-purple-400">{(20 * Math.log10(dynamicRangeCMOS)).toFixed(1)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Signal (e⁻)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
