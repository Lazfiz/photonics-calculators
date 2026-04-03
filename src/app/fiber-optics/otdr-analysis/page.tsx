"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function OTDRAnalysisPage() {
  const [pulseWidth, setPulseWidth] = useState(100); // ns
  const [fiberLength, setFiberLength] = useState(50); // km
  const [attenuationCoeff, setAttenuationCoeff] = useState(0.2); // dB/km
  const [refractiveIndex, setRefractiveIndex] = useState(1.4682);
  const [backscatterCoeff, setBackscatterCoeff] = useState(-79); // dB (typical SMF)
  const [connectorLoss, setConnectorLoss] = useState(0.5); // dB
  const [spliceLoss, setSpliceLoss] = useState(0.1); // dB
  const [numSplices, setNumSplices] = useState(5);
  const [eventAtKm, setEventAtKm] = useState(25); // km

  const calc = useMemo(() => {
    const c = 3e8;
    const n = refractiveIndex;
    const v_group = c / n;

    // Distance resolution (spatial resolution)
    const distResolution = (pulseWidth * 1e-9 * v_group) / 2 * 1e3; // m
    const distResKm = distResolution / 1000;

    // Dead zone
    const deadZone = pulseWidth * 1e-9 * v_group * 1e3 / 2 * 5; // approx meters

    // Dynamic range
    const dynamicRange = backscatterCoeff - (-50); // typical noise floor at -50 dBm
    const maxRange = dynamicRange / attenuationCoeff;

    // Return loss from event (Fresnel reflection)
    const returnLoss = -20 * Math.log10(Math.abs((n - 1) / (n + 1)));

    // Reflectance
    const reflectance_dB = -20 * Math.log10(Math.abs((n - 1) / (n + 1)));

    // Two-point attenuation measurement
    const levelAtEvent = backscatterCoeff - attenuationCoeff * eventAtKm;
    const levelAtEnd = backscatterCoeff - attenuationCoeff * fiberLength;

    // Total loss budget
    const fiberLoss = attenuationCoeff * fiberLength;
    const totalSpliceLoss = spliceLoss * numSplices;
    const totalConnectorLoss = connectorLoss * 2; // both ends
    const totalLoss = fiberLoss + totalSpliceLoss + totalConnectorLoss;

    // Sampling interval
    const samplingDist = distResolution / 4; // typical 4x oversampling

    return { distResKm, deadZone, dynamicRange, maxRange, returnLoss, reflectance_dB, levelAtEvent, levelAtEnd, fiberLoss, totalSpliceLoss, totalConnectorLoss, totalLoss, samplingDist };
  }, [pulseWidth, fiberLength, attenuationCoeff, refractiveIndex, backscatterCoeff, connectorLoss, spliceLoss, numSplices, eventAtKm]);

  const traceData = useMemo(() => {
    const n = refractiveIndex;
    const v_group = 3e8 / n;
    const resolution = (pulseWidth * 1e-9 * v_group) / 2; // m
    const numPoints = Math.ceil(fiberLength * 1000 / resolution);
    const step = fiberLength / numPoints;

    const distances: number[] = [];
    const levels: number[] = [];
    const noise = 0.05; // noise amplitude in dB

    for (let i = 0; i <= numPoints; i++) {
      const d = i * step;
      distances.push(d);

      let level = backscatterCoeff - attenuationCoeff * d;

      // Add connector reflections at 0 and fiber length
      if (d < step * 2) level += 14; // front face reflection spike
      if (d > fiberLength - step * 2) level += 12; // end face reflection

      // Add splice events
      for (let s = 1; s <= numSplices; s++) {
        const splicePos = (s / (numSplices + 1)) * fiberLength;
        if (Math.abs(d - splicePos) < step * 3) {
          level -= spliceLoss; // step loss
        }
      }

      // Add random noise
      level += (Math.random() - 0.5) * noise * 2;

      // Clamp
      if (d > fiberLength) level = -50 + Math.random() * 2;

      levels.push(level);
    }

    return [
      { x: distances, y: levels, type: "scatter" as const, mode: "lines" as const, name: "OTDR Trace", line: { color: "#34d399", width: 1.5 } },
      // Linear fit (backscatter slope)
      { x: [0, fiberLength], y: [backscatterCoeff, backscatterCoeff - attenuationCoeff * fiberLength], type: "scatter" as const, mode: "lines" as const, name: "Fiber Loss Slope", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [pulseWidth, fiberLength, attenuationCoeff, refractiveIndex, backscatterCoeff, spliceLoss, numSplices]);

  const pulseComparison = useMemo(() => {
    const pulses = [10, 30, 100, 300, 1000, 10000];
    return pulses.map(pw => ({
      x: [pw],
      y: [((pw * 1e-9 * 3e8 / refractiveIndex) / 2 * 1e3)], // resolution in meters
      type: "bar" as const, name: `${pw} ns`,
      marker: { color: pw === pulseWidth ? "#f87171" : "#4b5563" },
    }));
  }, [pulseWidth, refractiveIndex]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">OTDR Analysis</h1>
      <p className="text-gray-400 mb-8">Simulate OTDR traces, calculate spatial resolution, dynamic range, dead zones, and event analysis for fiber characterization.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Pulse Width (ns)</span>
          <input type="number" value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Fiber Length (km)</span>
          <input type="number" value={fiberLength} onChange={e => setFiberLength(+e.target.value)} min={0.1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Attenuation (dB/km)</span>
          <input type="number" value={attenuationCoeff} onChange={e => setAttenuationCoeff(+e.target.value)} step="0.01"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Refractive Index</span>
          <input type="number" value={refractiveIndex} onChange={e => setRefractiveIndex(+e.target.value)} step="0.0001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Backscatter Coeff. (dB)</span>
          <input type="number" value={backscatterCoeff} onChange={e => setBackscatterCoeff(+e.target.value)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Splices</span>
          <input type="number" value={numSplices} onChange={e => setNumSplices(+e.target.value)} min={0}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spatial Resolution</p>
          <p className="text-xl font-bold text-green-400">{calc.distResKm.toFixed(3)} km</p>
          <p className="text-xs text-gray-500">{(calc.distResKm * 1000).toFixed(1)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dead Zone</p>
          <p className="text-xl font-bold text-yellow-400">{calc.deadZone.toFixed(0)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Dynamic Range</p>
          <p className="text-xl font-bold text-blue-400">{calc.dynamicRange.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Range</p>
          <p className="text-xl font-bold text-purple-400">{calc.maxRange.toFixed(1)} km</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fiber Loss</p>
          <p className="text-lg font-bold text-red-400">{calc.fiberLoss.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Splice Loss</p>
          <p className="text-lg font-bold text-orange-400">{calc.totalSpliceLoss.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Connector Loss</p>
          <p className="text-lg font-bold text-cyan-400">{calc.totalConnectorLoss.toFixed(1)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Loss</p>
          <p className="text-lg font-bold text-pink-400">{calc.totalLoss.toFixed(1)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Simulated OTDR Trace</h3>
        <Plot data={traceData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Power (dB)", color: "#9ca3af", gridcolor: "#374151", autorange: "reversed" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 380,
          legend: { x: 0.02, y: 0.02, bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} config={{ displayModeBar: false }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Spatial Resolution vs Pulse Width</h3>
        <Plot data={pulseComparison} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Pulse Width (ns)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          yaxis: { title: "Resolution (m)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 300,
          showlegend: false,
        }} config={{ displayModeBar: false }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Δd = v_g · τ / 2 = c·τ / (2n) [spatial resolution]</p>
          <p>Backscatter power: P_bs = P₀ · (NA)² · W · λ² / (4n₁² · c · τ) [per pulse]</p>
          <p>Dynamic Range = P_bs - Noise Floor</p>
          <p>Fresnel reflection: R = ((n₁-n₂)/(n₁+n₂))²</p>
          <p>Return Loss = -10·log₁₀(R)</p>
          <p>Trade-off: Short pulse → better resolution, less range; Long pulse → more range, less resolution</p>
        </div>
      </div>
    </div>
  );
}
