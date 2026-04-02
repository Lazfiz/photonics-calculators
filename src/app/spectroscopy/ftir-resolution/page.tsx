"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FtirResolutionPage() {
  const [maxOPD, setMaxOPD] = useState(1.0); // cm
  const [spectralRange, setSpectralRange] = useState(4000); // cm⁻¹ max
  const [apodization, setApodization] = useState<"boxcar" | "nortonbeermedium" | "blackmanharris" | "happgenzel">("boxcar");
  const [mirrorVelocity, setMirrorVelocity] = useState(1.0); // cm/s

  const apodFactors: Record<string, number> = {
    boxcar: 0.60,
    nortonbeermedium: 0.80,
    blackmanharris: 1.45,
    happgenzel: 1.20,
  };

  const nominalResolution = 1 / maxOPD; // cm⁻¹
  const effectiveResolution = nominalResolution * apodFactors[apodization];
  const dataPoints = 2 * maxOPD * spectralRange;
  const scanTime = 2 * maxOPD / mirrorVelocity; // seconds for single scan

  const chartData = useMemo(() => {
    // Spectral resolution as function of OPD
    const opds = Array.from({ length: 200 }, (_, i) => 0.1 + i * 9.9 / 200);
    const traces: any[] = [
      {
        x: opds, y: opds.map(opd => 1 / opd),
        type: "scatter" as const, mode: "lines" as const,
        name: "Boxcar", line: { color: "#60a5fa" },
      },
    ];
    // Add lines for other apodization functions
    Object.entries(apodFactors).forEach(([name, factor], idx) => {
      if (name === "boxcar") return;
      const colors = ["#f87171", "#34d399", "#fbbf24"];
      traces.push({
        x: opds, y: opds.map(opd => factor / opd),
        type: "scatter" as const, mode: "lines" as const,
        name: name.replace(/([A-Z])/g, " $1").trim(),
        line: { color: colors[idx - 1], dash: "dash" },
      });
    });
    // Current point marker
    traces.push({
      x: [maxOPD], y: [effectiveResolution],
      type: "scatter" as const, mode: "markers" as const,
      name: "Current", marker: { color: "#c084fc", size: 12 },
    });
    return traces;
  }, [maxOPD, effectiveResolution]);

  // Interferogram simulation (single frequency)
  const interferogramData = useMemo(() => {
    const nu0 = 1000; // cm⁻¹ test frequency
    const N = 500;
    const x = Array.from({ length: N }, (_, i) => (i / N) * maxOPD);
    const y = x.map(xi => {
      const raw = Math.cos(2 * Math.PI * nu0 * xi);
      // Apply apodization
      let apod = 1;
      const frac = xi / maxOPD;
      if (apodization === "nortonbeermedium") apod = 1 - frac * frac;
      else if (apodization === "blackmanharris") apod = 0.35875 - 0.48829 * Math.cos(Math.PI * frac) + 0.14128 * Math.cos(2 * Math.PI * frac) - 0.01168 * Math.cos(3 * Math.PI * frac);
      else if (apodization === "happgenzel") apod = (1 - frac) * (1 + Math.cos(Math.PI * frac));
      return raw * apod;
    });
    return [{ x, y, type: "scatter" as const, mode: "lines" as const, name: "Interferogram", line: { color: "#fbbf24" } }];
  }, [maxOPD, apodization]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">FTIR Resolution Calculator</h1>
      <p className="text-gray-400 mb-8">Spectral resolution from maximum optical path difference (OPD) and apodization function.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Max OPD (cm)</span>
          <input type="number" value={maxOPD} onChange={e => setMaxOPD(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Spectral Range (cm⁻¹)</span>
          <input type="number" value={spectralRange} onChange={e => setSpectralRange(+e.target.value)} min="100"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Apodization</span>
          <select value={apodization} onChange={e => setApodization(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="boxcar">Boxcar (no apodization)</option>
            <option value="nortonbeermedium">Norton-Beer Medium</option>
            <option value="blackmanharris">Blackman-Harris</option>
            <option value="happgenzel">Happ-Genzel</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Mirror Velocity (cm/s)</span>
          <input type="number" value={mirrorVelocity} onChange={e => setMirrorVelocity(+e.target.value)} min="0.01" step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nominal Resolution</p>
          <p className="text-xl font-bold text-blue-400">{nominalResolution.toFixed(3)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Effective Resolution</p>
          <p className="text-xl font-bold text-green-400">{effectiveResolution.toFixed(3)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Data Points</p>
          <p className="text-xl font-bold text-yellow-400">{Math.round(dataPoints).toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Scan Time (single)</p>
          <p className="text-xl font-bold text-purple-400">{scanTime.toFixed(1)} s</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>δν = 1 / Δ<sub>max</sub> (boxcar), where Δ<sub>max</sub> = max OPD</p>
        <p>Apodization broadens: δν<sub>eff</sub> = k · δν<sub>nominal</sub></p>
        <p>Data points N = 2 · Δ<sub>max</sub> · ν<sub>max</sub></p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Resolution vs OPD</p>
          <Plot data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af", size: 11 },
            xaxis: { title: "Max OPD (cm)", gridcolor: "#374151" },
            yaxis: { title: "Resolution (cm⁻¹)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 }, legend: { bgcolor: "transparent", font: { size: 9 } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Interferogram (ν₀ = 1000 cm⁻¹)</p>
          <Plot data={interferogramData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af", size: 11 },
            xaxis: { title: "OPD (cm)", gridcolor: "#374151" },
            yaxis: { title: "Signal (a.u.)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 }, showlegend: false,
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
