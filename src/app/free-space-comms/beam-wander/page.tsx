"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function BeamWanderPage() {
  const [cn2, setCn2] = useState(1e-15);
  const [pathLength, setPathLength] = useState(1);
  const [beamRadius, setBeamRadius] = useState(2);
  const [wavelength, setWavelength] = useState(1550);

  const calc = useMemo(() => {
    const L = pathLength * 1e3;
    const lambda = wavelength * 1e-9;
    const variance = 1.83 * cn2 * Math.pow(L, 3) * Math.pow(lambda, -1 / 6);
    const rms = Math.sqrt(variance) * 100; // m -> cm
    const pointingLoss = rms > 0 ? -10 * Math.log10(Math.exp(-2 * Math.pow(rms / 100 / beamRadius / 100, 2))) : 0;
    // Simplified: pointing loss ≈ 8.686 * (σ/w)² dB
    const pointingLossDb = 8.686 * Math.pow(rms / 100 / (beamRadius / 100), 2);
    return { variance, rms, pointingLossDb };
  }, [cn2, pathLength, beamRadius, wavelength]);

  const plotData = useMemo(() => {
    const L = pathLength * 1e3;
    const lambda = wavelength * 1e-9;
    const w = beamRadius / 100;
    const cn2Vals = Array.from({ length: 200 }, (_, i) => 1e-17 + i * (1e-13 - 1e-17) / 199);
    const wanders = cn2Vals.map((c) => Math.sqrt(1.83 * c * Math.pow(L, 3) * Math.pow(lambda, -1 / 6)) * 100);
    return [{ x: cn2Vals, y: wanders, type: "scatter", mode: "lines", name: "RMS Wander", line: { color: "#a78bfa" } }];
  }, [pathLength, beamRadius, wavelength]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      <Link href="/free-space-comms" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">← Back to Free-Space Comms</Link>
      <h1 className="text-3xl font-bold mb-6">Beam Wander Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-violet-400">Inputs</h2>
          {[
            ["Cn² (m⁻²ᐟ³)", cn2, setCn2, 1e-15],
            ["Path Length (km)", pathLength, setPathLength, 1],
            ["Beam Radius (cm)", beamRadius, setBeamRadius, 2],
            ["Wavelength (nm)", wavelength, setWavelength, 1550],
          ].map(([label, val, set, def]) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} step={label === "Cn²" ? "1e-16" : undefined}
                onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-violet-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Wander Variance</span><span>{calc.variance.toExponential(2)} m²</span></div>
              <div className="flex justify-between"><span className="text-gray-400">RMS Wander</span><span>{calc.rms.toFixed(3)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Pointing Loss</span><span>{calc.pointingLossDb.toFixed(2)} dB</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <Plot data={plotData} layout={{
              xaxis: { title: "Cn² (m⁻²ᐟ³)", type: "log", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "RMS Wander (cm)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 60 }, font: { color: "#9ca3af" },
            }} config={{ displayModeBar: false }} style={{ width: "100%", height: 300 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
