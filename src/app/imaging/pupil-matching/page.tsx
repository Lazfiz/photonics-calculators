"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PupilMatchingPage() {
  const [objectiveNA, setObjectiveNA] = useState(0.75);
  const [objectiveMag, setObjectiveMag] = useState(40);
  const [tubeLensFL, setTubeLensFL] = useState(200); // mm
  const [eyepieceMag, setEyepieceMag] = useState(10);
  const [eyePupil, setEyePupil] = useState(4); // mm

  const chartData = useMemo(() => {
    const nas = Array.from({ length: 200 }, (_, i) => 0.1 + i * 1.4 / 200);
    // Exit pupil diameter = (2 * tube_lens_FL * NA) / (objective_mag * eyepiece_mag)
    const exitPupils = nas.map(na => (2 * tubeLensFL * na) / (objectiveMag * eyepieceMag));
    // Eye pupil match
    const match = nas.map(na => {
      const exitP = (2 * tubeLensFL * na) / (objectiveMag * eyepieceMag);
      return Math.min(1, exitP / eyePupil);
    });
    return [
      { x: nas, y: exitPupils, type: "scatter" as const, mode: "lines" as const, name: "Exit Pupil (mm)", line: { color: "#60a5fa" } },
      { x: nas, y: nas.map(na => eyePupil), type: "scatter" as const, mode: "lines" as const, name: "Eye Pupil (mm)", line: { color: "#34d399", dash: "dash" } },
    ];
  }, [objectiveMag, tubeLensFL, eyepieceMag, eyePupil]);

  const exitPupil = (2 * tubeLensFL * objectiveNA) / (objectiveMag * eyepieceMag);
  const matchRatio = exitPupil / eyePupil;
  const optimalNA = (eyePupil * objectiveMag * eyepieceMag) / (2 * tubeLensFL);
  const totalMag = objectiveMag * eyepieceMag;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/imaging" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Imaging</Link>
      <h1 className="text-3xl font-bold mb-2">Pupil Matching in Microscopy</h1>
      <p className="text-gray-400 mb-8">Exit pupil = (2·f<sub>tube</sub>·NA)/(M<sub>obj</sub>·M<sub>eyepiece</sub>). Match to eye pupil (2-8mm) for optimal brightness.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Objective NA</span>
          <input type="number" value={objectiveNA} onChange={e => setObjectiveNA(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Objective Mag</span>
          <input type="number" value={objectiveMag} onChange={e => setObjectiveMag(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Tube Lens f (mm)</span>
          <input type="number" value={tubeLensFL} onChange={e => setTubeLensFL(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Eyepiece Mag</span>
          <input type="number" value={eyepieceMag} onChange={e => setEyepieceMag(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Eye Pupil (mm)</span>
          <input type="number" value={eyePupil} onChange={e => setEyePupil(+e.target.value)} step="0.5" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Exit pupil diameter = <span className="text-blue-400 font-mono">{exitPupil.toFixed(2)} mm</span></p>
        <p className="text-gray-300">Match ratio = <span className="text-blue-400 font-mono">{(matchRatio * 100).toFixed(0)}%</span></p>
        <p className="text-gray-300">Optimal NA for eye match = <span className="text-blue-400 font-mono">{optimalNA.toFixed(3)}</span></p>
        <p className="text-gray-300">Total magnification = <span className="text-blue-400 font-mono">{totalMag}×</span></p>
      </div>

      <Plot data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Objective NA", gridcolor: "#374151" }, yaxis: { title: "Pupil Diameter (mm)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true }} className="w-full" style={{ height: 400 }} />
    </div>
  );
}
