"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
const dyes = [
  { label: "GFP", onePhoton: 488 },
  { label: "YFP", onePhoton: 514 },
  { label: "RFP/mCherry", onePhoton: 587 },
  { label: "Fluorescein", onePhoton: 494 },
  { label: "Rhodamine B", onePhoton: 540 },
  { label: "DAPI", onePhoton: 358 },
  { label: "Custom", onePhoton: 0 },
];

export default function TwoPhotonPage() {
  const [dyeIdx, setDyeIdx] = useState(0);
  const [customWl, setCustomWl] = useState(500);
  const [na, setNa] = useState(1.0);
  const [avgPower, setAvgPower] = useState(20);
  const [repRate, setRepRate] = useState(80);
  const [pulseWidth, setPulseWidth] = useState(100);
  const [n, setN] = useState(1.33);

  const onePhotonWl = dyeIdx === 6 ? customWl : dyes[dyeIdx].onePhoton;
  const twoPhotonWl = onePhotonWl * 2;

  const results = useMemo(() => {
    const peakPower = (avgPower * 1e-3) / (repRate * 1e6 * pulseWidth * 1e-15);
    const lambda_m = twoPhotonWl * 1e-9;
    const lateralRes = 0.61 * lambda_m / na * 1e9;
    const axialRes = 2 * n * lambda_m / (na * na) * 1e9;
    const dof = n * lambda_m / (na * na) * 1e6;
    const exVolume = Math.PI * (lateralRes / 2) ** 2 * axialRes * 1e-27; // m³
    const crossSection = 1e-58 * (twoPhotonWl / 800) ** 2; // ~1 GM in m⁴·s/photon, rough estimate
    return { peakPower, lateralRes, axialRes, dof, exVolume, crossSection };
  }, [twoPhotonWl, na, avgPower, repRate, pulseWidth, n]);

  const plotData = useMemo(() => {
    const depths = [];
    const onePhotonInt = [];
    const twoPhotonInt = [];
    const muOne = 0.1; // mm⁻¹ typical tissue
    const muTwo = 0.05;
    for (let z = 0; z <= 1000; z += 10) {
      depths.push(z);
      onePhotonInt.push(Math.exp(-muOne * z));
      twoPhotonInt.push(Math.exp(-muTwo * z));
    }
    return [
      { x: depths, y: onePhotonInt, name: "1P Excitation", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: depths, y: twoPhotonInt, name: "2P Excitation", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
    ];
  }, []);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Two-Photon Microscopy Calculator" description="Excitation wavelength, resolution, and pulse parameters for two-photon fluorescence microscopy.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fluorophore</label>
            <select value={dyeIdx} onChange={e => setDyeIdx(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              {dyes.map((d, i) => <option key={i} value={i}>{d.label} ({d.onePhoton || customWl} nm 1P)</option>)}
            </select>
          </div>
          {dyeIdx === 6 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Custom 1P wavelength (nm)</label>
              <input type="number" step={1} value={customWl} onChange={e => setCustomWl(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">NA</label>
            <input type="number" step={0.01} min={0.1} max={1.8} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <input type="number" step={0.01} value={n} onChange={e => setN(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Average power (mW)</label>
            <input type="number" step={1} value={avgPower} onChange={e => setAvgPower(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rep rate (MHz)</label>
            <input type="number" step={1} value={repRate} onChange={e => setRepRate(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pulse width (fs)</label>
            <input type="number" step={10} value={pulseWidth} onChange={e => setPulseWidth(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">1P excitation λ</span><span className="font-mono">{onePhotonWl} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">2P excitation λ</span><span className="font-mono text-blue-400">{twoPhotonWl} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-green-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial resolution</span><span className="font-mono text-yellow-400">{results.axialRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Depth of field</span><span className="font-mono">{results.dof.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Peak power</span><span className="font-mono text-red-400">{(results.peakPower / 1e3).toFixed(1)} kW</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>2P λ ≈ 2 × λ₁ₚ (due to virtual state)</p>
            <p>Lateral: d = 0.61·λ/NA | Axial: d = 2nλ/NA²</p>
            <p>P_peak = P_avg / (f_rep · τ_pulse)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Excitation Intensity vs Tissue Depth</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Depth (µm)", gridcolor: "#333" }, yaxis: { title: "Relative intensity", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
