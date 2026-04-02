"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PMDPage() {
  const [dgdPsPerSqrtKm, setDgdPsPerSqrtKm] = useState(0.5);
  const [fiberLength, setFiberLength] = useState(100); // km
  const [bitRate, setBitRate] = useState(10); // Gbps
  const [channelCount, setChannelCount] = useState(40);
  const [channelSpacing, setChannelSpacing] = useState(100); // GHz

  const results = useMemo(() => {
    const meanDGD = dgdPsPerSqrtKm * Math.sqrt(fiberLength);
    const maxDGD = 3.57 * meanDGD; // Maxwellian: probability of exceeding is 4.5e-5
    const maxDGDdB = 10 * Math.log10(maxDGD / meanDGD);
    const symbolPeriod = 1e12 / (bitRate * 1e9); // ps
    const dgdTolerance = 0.3 * symbolPeriod; // ~30% of bit period for 1dB penalty
    const maxReach = Math.pow(dgdTolerance / (3.57 * dgdPsPerSqrtKm), 2);
    const powerPenalty = 10 * Math.log10(1 + Math.pow(meanDGD / symbolPeriod, 2) * Math.PI * Math.PI / 4);
    const bandwidthLimit = 1 / (4 * meanDGD * 1e-12) / 1e12; // THz

    // Maxwellian PDF
    const x = Array.from({ length: 200 }, (_, i) => (i / 200) * maxDGD * 1.5);
    const pdf = x.map((xi) => {
      const a = meanDGD * 2 / (Math.PI * meanDGD * meanDGD);
      const norm = xi * xi * xi / (meanDGD ** 4);
      const exp = Math.exp(-2 * xi * xi / (Math.PI * meanDGD * meanDGD));
      return a * norm * exp;
    });
    const cdf = x.reduce((acc: number[], xi) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
      const dx = x[1] - x[0];
      const a = meanDGD * 2 / (Math.PI * meanDGD * meanDGD);
      const norm = xi * xi * xi / (meanDGD ** 4);
      const exp = Math.exp(-2 * xi * xi / (Math.PI * meanDGD * meanDGD));
      return [...acc, prev + a * norm * exp * dx];
    }, []);

    // DGD vs length
    const lengths = Array.from({ length: 50 }, (_, i) => (i + 1) * 10);
    const dgdVsLength = lengths.map((l) => dgdPsPerSqrtKm * Math.sqrt(l));
    const maxDgdVsLength = lengths.map((l) => 3.57 * dgdPsPerSqrtKm * Math.sqrt(l));

    // Power penalty vs DGD
    const dgdRange = Array.from({ length: 100 }, (_, i) => (i / 100) * symbolPeriod * 2);
    const penaltyVsDgd = dgdRange.map((d) => 10 * Math.log10(1 + Math.pow(d / symbolPeriod, 2) * Math.PI * Math.PI / 4));

    return { meanDGD, maxDGD, maxDGDdB, symbolPeriod, dgdTolerance, maxReach, powerPenalty, bandwidthLimit, x, pdf, cdf, lengths, dgdVsLength, maxDgdVsLength, dgdRange, penaltyVsDgd };
  }, [dgdPsPerSqrtKm, fiberLength, bitRate, channelCount, channelSpacing]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:underline mb-6 inline-block">← Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Polarization Mode Dispersion</h1>
      <p className="text-gray-400 mb-6">Calculate PMD-induced DGD, Maxwellian statistics, and system penalties.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Parameters</h2>
          {[
            { label: "PMD Coefficient (ps/√km)", val: dgdPsPerSqrtKm, set: setDgdPsPerSqrtKm },
            { label: "Fiber Length (km)", val: fiberLength, set: setFiberLength },
            { label: "Bit Rate (Gbps)", val: bitRate, set: setBitRate },
            { label: "Channel Count", val: channelCount, set: setChannelCount },
            { label: "Channel Spacing (GHz)", val: channelSpacing, set: setChannelSpacing },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step="any" value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Mean DGD" value={`${results.meanDGD.toFixed(2)} ps`} />
            <ResultRow label="Max DGD (3.57× mean)" value={`${results.maxDGD.toFixed(2)} ps`} />
            <ResultRow label="Max/Mean Ratio" value={`${results.maxDGDdB.toFixed(1)} dB`} />
            <ResultRow label="Symbol Period" value={`${results.symbolPeriod.toFixed(1)} ps`} />
            <ResultRow label="DGD Tolerance (30% T)" value={`${results.dgdTolerance.toFixed(2)} ps`} />
            <ResultRow label="Max Reach (DGD-limited)" value={`${results.maxReach.toFixed(1)} km`} />
            <ResultRow label="Mean Power Penalty" value={`${results.powerPenalty.toFixed(3)} dB`} />
            <ResultRow label="3dB Bandwidth Limit" value={`${results.bandwidthLimit.toFixed(2)} THz`} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Maxwellian DGD Distribution</h2>
          <Plot
            data={[
              { type: "scatter" as const, mode: "lines" as const, x: results.x, y: results.pdf, name: "PDF", line: { color: "#3b82f6" } },
              { type: "scatter" as const, mode: "lines" as const, x: results.x, y: results.cdf, name: "CDF", line: { color: "#22c55e", dash: "dash" }, yaxis: "y2" },
            ]}
            layout={{
              xaxis: { title: "DGD (ps)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "PDF", color: "#9ca3af", gridcolor: "#374151" },
              yaxis2: { title: "CDF", overlaying: "y", side: "right", color: "#22c55e", gridcolor: "transparent", range: [0, 1] },
              margin: { l: 50, r: 50, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "350px" }}
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Power Penalty vs DGD</h2>
          <Plot
            data={[{ type: "scatter" as const, mode: "lines" as const, x: results.dgdRange, y: results.penaltyVsDgd, line: { color: "#ef4444", width: 2 } }]}
            layout={{
              xaxis: { title: "DGD (ps)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Power Penalty (dB)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "350px" }}
          />
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
