"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


// Simplified spectral shapes using Gaussian approximation
function gaussian(x: number, center: number, fwhm: number, amp: number) {
  const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2));
  return amp * Math.exp(-((x - center) ** 2) / (2 * sigma * sigma));
}

const fluorophores = [
  { label: "GFP", exCenter: 488, exFWHM: 20, emCenter: 509, emFWHM: 30, qy: 0.6 },
  { label: "YFP", exCenter: 514, exFWHM: 20, emCenter: 527, emFWHM: 35, qy: 0.61 },
  { label: "mCherry", exCenter: 587, exFWHM: 25, emCenter: 610, emFWHM: 40, qy: 0.22 },
  { label: "Cy5", exCenter: 649, exFWHM: 25, emCenter: 670, emFWHM: 35, qy: 0.28 },
  { label: "DAPI", exCenter: 358, exFWHM: 25, emCenter: 461, emFWHM: 50, qy: 0.92 },
  { label: "FITC", exCenter: 495, exFWHM: 18, emCenter: 519, emFWHM: 28, qy: 0.92 },
];

export default function FluorescenceSpectraPage() {
  const [dye1Idx, setDye1Idx] = useState(0);
  const [dye2Idx, setDye2Idx] = useState(2);
  const [filterCenter, setFilterCenter] = useState(525);
  const [filterBW, setFilterBW] = useState(30);
  const [showOverlap, setShowOverlap] = useState(true);

  const dye1 = fluorophores[dye1Idx];
  const dye2 = fluorophores[dye2Idx];

  const data = useMemo(() => {
    const wl = [];
    const ex1 = [], em1 = [], ex2 = [], em2 = [], filt = [];
    for (let w = 350; w <= 750; w += 1) {
      wl.push(w);
      ex1.push(gaussian(w, dye1.exCenter, dye1.exFWHM, 1));
      em1.push(gaussian(w, dye1.emCenter, dye1.emFWHM, 1));
      ex2.push(gaussian(w, dye2.exCenter, dye2.exFWHM, 1));
      em2.push(gaussian(w, dye2.emCenter, dye2.emFWHM, 1));
      filt.push(gaussian(w, filterCenter, filterBW, 1));
    }
    return { wl, ex1, em1, ex2, em2, filt };
  }, [dye1, dye2, filterCenter, filterBW]);

  // Calculate spectral overlap integral (simplified)
  const overlap = useMemo(() => {
    let integral = 0;
    for (let i = 0; i < data.wl.length; i++) {
      integral += data.em1[i] * data.ex2[i];
    }
    return integral;
  }, [data]);

  const spectraPlot = useMemo(() => {
    const traces = [
      { x: data.wl, y: data.ex1, name: `${dye1.label} Excitation`, line: { color: "#60a5fa", width: 2 }, type: "scatter", mode: "lines" },
      { x: data.wl, y: data.em1, name: `${dye1.label} Emission`, line: { color: "#4ade80", width: 2 }, type: "scatter", mode: "lines" },
      { x: data.wl, y: data.ex2, name: `${dye2.label} Excitation`, line: { color: "#60a5fa", width: 1, dash: "dash" }, type: "scatter", mode: "lines" },
      { x: data.wl, y: data.em2, name: `${dye2.label} Emission`, line: { color: "#f87171", width: 2 }, type: "scatter", mode: "lines" },
      { x: data.wl, y: data.filt, name: "Emission filter", line: { color: "#fbbf24", width: 1, dash: "dot" }, type: "scatter", mode: "lines" },
    ];
    if (showOverlap) {
      const overlapEmEx = data.wl.map((_, i) => Math.min(data.em1[i], data.ex2[i]));
      traces.push({ x: data.wl, y: overlapEmEx, name: "Spectral overlap", fill: "tozeroy", line: { color: "transparent" }, type: "scatter", mode: "lines", fillcolor: "rgba(168,85,247,0.3)" });
    }
    return traces;
  }, [data, dye1, dye2, showOverlap]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Fluorescence Spectra Overlap Calculator" description="Compare excitation/emission spectra, spectral overlap, and filter crosstalk.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fluorophore 1 (Donor)</label>
            <select value={dye1Idx} onChange={e => setDye1Idx(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              {fluorophores.map((f, i) => <option key={i} value={i}>{f.label} — Em: {f.emCenter} nm, QY: {f.qy}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fluorophore 2 (Acceptor)</label>
            <select value={dye2Idx} onChange={e => setDye2Idx(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              {fluorophores.map((f, i) => <option key={i} value={i}>{f.label} — Em: {f.emCenter} nm, QY: {f.qy}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Emission filter center (nm)</label>
            <input type="number" step={1} value={filterCenter} onChange={e => setFilterCenter(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Emission filter bandwidth (nm)</label>
            <input type="number" step={5} value={filterBW} onChange={e => setFilterBW(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showOverlap} onChange={e => setShowOverlap(e.target.checked)} />
            <span className="text-gray-400">Show spectral overlap</span>
          </label>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Spectral Properties</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">{dye1.label} Ex/Em</span><span className="font-mono text-green-400">{dye1.exCenter}/{dye1.emCenter} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">{dye1.label} QY</span><span className="font-mono">{dye1.qy}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">{dye2.label} Ex/Em</span><span className="font-mono text-red-400">{dye2.exCenter}/{dye2.emCenter} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">{dye2.label} QY</span><span className="font-mono">{dye2.qy}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Stokes shift (Dye 1)</span><span className="font-mono text-yellow-400">{dye1.emCenter - dye1.exCenter} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Spectral overlap J</span><span className="font-mono text-purple-400">{overlap.toFixed(1)} (a.u.)</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Separation (em1→em2)</span><span className="font-mono text-blue-400">{dye2.emCenter - dye1.emCenter} nm</span></div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Spectral Comparison</h2>
        <ChartPanel data={spectraPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#333" }, yaxis: { title: "Normalized intensity", gridcolor: "#333" }, legend: { font: { size: 10 }, orientation: "h", y: -0.15 }, margin: { l: 60, r: 20, t: 20, b: 80 } }} />
      </div>
    </CalculatorShell>
  );
}
