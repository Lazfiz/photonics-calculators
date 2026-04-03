"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Cosmic ray detection in imaging sensors
// Cosmic ray flux: ~1 hit/cm²/min at sea level
// Energy deposition ~40 e⁻/μm in silicon
// Probability of N or more events: P(≥N) = 1 - sum(Poisson(0..N-1))
export default function CosmicRaysPage() {
  const [sensorArea, setSensorArea] = useState(1); // cm²
  const [exposureTime, setExposureTime] = useState(1); // s
  const [flux, setFlux] = useState(1); // hits/cm²/min
  const [pixelSize, setPixelSize] = useState(10); // μm
  const [energyDeposit, setEnergyDeposit] = useState(40); // e⁻/μm
  const [trackLength, setTrackLength] = useState(200); // μm typical track length
  const [numFrames, setNumFrames] = useState(100); // for statistics

  const fluxPerSec = flux / 60; // hits/cm²/s
  const expectedHits = fluxPerSec * sensorArea * exposureTime;
  const totalDeposited = expectedHits * energyDeposit * trackLength; // total electrons
  const pixelArea = pixelSize * pixelSize; // μm²
  const affectedPixels = Math.ceil(expectedHits * trackLength * pixelSize / (pixelArea * 1e-8)); // rough estimate
  const pixelFlux = expectedHits * pixelArea * 1e-8 / sensorArea; // hits per pixel per frame
  const cleanFrames = Math.exp(-pixelFlux) * 100; // % of frames with no hit on given pixel

  const chartData = useMemo(() => {
    const times = Array.from({ length: 200 }, (_, i) => 0.01 + i * 10 / 200);
    const hits = times.map(t => fluxPerSec * sensorArea * t);
    const maxHits = times.map(t => {
      const mu = fluxPerSec * sensorArea * t;
      // 99th percentile of Poisson
      let k = mu;
      let sum = 0;
      for (let n = 0; n <= mu + 5 * Math.sqrt(mu); n++) {
        let lp = n * Math.log(mu) - mu;
        for (let j = 2; j <= n; j++) lp -= Math.log(j);
        sum += Math.exp(lp);
        if (sum >= 0.99) { k = n; break; }
      }
      return k;
    });
    return [
      { x: times, y: hits, type: "scatter", mode: "lines",
        name: "Expected Hits", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: times, y: maxHits, type: "scatter", mode: "lines",
        name: "99th Percentile", line: { color: "#f87171", width: 2, dash: "dash" }, yaxis: "y" },
    ];
  }, [fluxPerSec, sensorArea]);

  const areaVsHits = useMemo(() => {
    const areas = Array.from({ length: 100 }, (_, i) => 0.01 + i * 10 / 100);
    return [
      { x: areas, y: areas.map(a => fluxPerSec * a * exposureTime), type: "scatter", mode: "lines",
        name: `Hits per ${exposureTime}s frame`, line: { color: "#34d399", width: 2 } },
    ];
  }, [fluxPerSec, exposureTime]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/detectors" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Detectors</Link>
      <h1 className="text-3xl font-bold mb-2">Cosmic Ray Detection</h1>
      <p className="text-gray-400 mb-8">Cosmic ray flux and impact on imaging sensors — estimate hit rates and affected pixels.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Sensor Area (cm²)</span>
          <input type="number" value={sensorArea} onChange={e => setSensorArea(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Exposure Time (s)</span>
          <input type="number" value={exposureTime} onChange={e => setExposureTime(+e.target.value)} min="0.001" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Cosmic Ray Flux (hits/cm²/min)</span>
          <input type="number" value={flux} onChange={e => setFlux(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Pixel Size (μm)</span>
          <input type="number" value={pixelSize} onChange={e => setPixelSize(+e.target.value)} min="1" step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Energy Deposition (e⁻/μm)</span>
          <input type="number" value={energyDeposit} onChange={e => setEnergyDeposit(+e.target.value)} min="1" step="5"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Track Length (μm)</span>
          <input type="number" value={trackLength} onChange={e => setTrackLength(+e.target.value)} min="10" step="10"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Expected Hits/Frame</p>
          <p className="text-xl font-bold text-blue-400">{expectedHits.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">e⁻ Deposited/Hit</p>
          <p className="text-xl font-bold text-red-400">{(energyDeposit * trackLength).toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Clean Pixel Frames</p>
          <p className="text-xl font-bold text-green-400">{cleanFrames.toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Hits in {numFrames} frames</p>
          <p className="text-xl font-bold text-yellow-400">~{(expectedHits * numFrames).toFixed(0)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Flux at sea level: ~1 hit/cm²/min (muons, secondary particles)</p>
        <p>N<sub>hits</sub> = Φ · A · t  (Poisson statistics)</p>
        <p>E<sub>deposited</sub> ≈ 40 e⁻/μm in Si → ~8000 e⁻ for 200μm track (>> typical pixel full well)</p>
        <p>Mitigation: frame subtraction, median filtering, pixel cluster rejection</p>
      </div>

      <Plot data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Exposure Time (s)", gridcolor: "#374151" },
        yaxis: { title: "Cosmic Ray Hits", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />

      <h2 className="text-xl font-bold mt-8 mb-4">Hits vs Sensor Area</h2>
      <Plot data={areaVsHits} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Sensor Area (cm²)", gridcolor: "#374151" },
        yaxis: { title: "Expected Hits per Frame", gridcolor: "#374151" },
        margin: { t: 30, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
      }} config={{ responsive: true, displayModeBar: false }} />
    </div>
  );
}
