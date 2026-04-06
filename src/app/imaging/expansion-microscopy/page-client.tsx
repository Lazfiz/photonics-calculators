"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function ExpansionMicroscopyPage() {
  const [magnification, setMagnification] = useState(4);
  const [originalRes, setOriginalRes] = useState(250);
  const [probeSize, setProbeSize] = useState(10);
  const [labelLinkerLen, setLabelLinkerLen] = useState(15);
  const [gelThickness, setGelThickness] = useState(50);
  const [na, setNa] = useState(1.2);

  const results = useMemo(() => {
    const effectiveRes = originalRes / magnification;
    const effectiveProbeSize = probeSize / magnification;
    const effectiveLabelSize = labelLinkerLen / magnification;
    const expansionFactor = magnification;
    const physicalResLimit = 0.61 * 525e-9 / na * 1e9 / magnification;
    const fovShrink = 1 / magnification;
    const sampleVolume = gelThickness * magnification;
    return { effectiveRes, effectiveProbeSize, effectiveLabelSize, expansionFactor, physicalResLimit, fovShrink, sampleVolume };
  }, [magnification, originalRes, probeSize, labelLinkerLen, gelThickness, na]);

  const plotData = useMemo(() => {
    const mags = [];
    const res = [];
    const physLimit = [];
    for (let m = 1; m <= 20; m += 0.5) {
      mags.push(m);
      res.push(originalRes / m);
      physLimit.push(0.61 * 525e-9 / na * 1e9 / m);
    }
    return [
      { x: mags, y: res, name: "Effective resolution", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: mags, y: physLimit, name: "Physical limit (525nm)", line: { color: "#f87171", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [originalRes, na]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Expansion Microscopy Calculator" description="ExM effective resolution, probe size reduction, and expansion trade-offs.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Expansion factor (×)</label>
            <input type="number" step={0.5} min={1} max={20} value={magnification} onChange={e => setMagnification(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Original resolution (nm)</label>
            <input type="number" step={10} value={originalRes} onChange={e => setOriginalRes(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Probe size (nm)</label>
            <input type="number" step={1} value={probeSize} onChange={e => setProbeSize(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Label-linker length (nm)</label>
            <input type="number" step={1} value={labelLinkerLen} onChange={e => setLabelLinkerLen(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Gel thickness (µm)</label>
            <input type="number" step={5} value={gelThickness} onChange={e => setGelThickness(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Imaging NA</label>
            <input type="number" step={0.05} min={0.4} max={1.7} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective resolution</span><span className="font-mono text-blue-400">{results.effectiveRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective probe size</span><span className="font-mono text-green-400">{results.effectiveProbeSize.toFixed(2)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective label size</span><span className="font-mono text-cyan-400">{results.effectiveLabelSize.toFixed(2)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Physical res. limit</span><span className="font-mono text-yellow-400">{results.physicalResLimit.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">FOV shrinkage</span><span className="font-mono text-purple-400">{(results.fovShrink * 100).toFixed(1)}%</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Expanded gel thickness</span><span className="font-mono text-red-400">{results.sampleVolume.toFixed(0)} µm</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>d_eff = d_original / M | Probe_eff = probe / M</p>
            <p>Physical limit: 0.61λ / (NA × M)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Effective Resolution vs Expansion Factor</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Expansion Factor (×)", gridcolor: "#333" }, yaxis: { title: "Resolution (nm)", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
