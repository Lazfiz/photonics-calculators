"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
export default function LightSheetMicroscopyPage() {
  const [naDet, setNaDet] = useURLState("naDet", 0.8);
  const [naIll, setNaIll] = useURLState("naIll", 0.1);
  const [wavelength, setWavelength] = useURLState("wavelength", 488);
  const [n, setN] = useURLState("n", 1.33);
  const [sampleThickness, setSampleThickness] = useURLState("sampleThickness", 200);
  const [tiltAngle, setTiltAngle] = useURLState("tiltAngle", 45);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const sheetThickness = n * lam / (naIll * naIll) * 1e6;
    const lateralRes = 0.61 * lam / naDet * 1e9;
    const rayleighRange = n * lam / (Math.PI * naIll * naIll) * 1e6;
    const fov = sampleThickness / Math.cos((tiltAngle * Math.PI) / 180);
    const volumetricRate = (fov * fov * 1e-12) / 0.01; // approx frames
    const opticalSectioning = 2 * n * lam / (naIll * naIll) * 1e6;
    const workingDistRequirement = (sampleThickness / 2) / Math.cos((tiltAngle * Math.PI) / 180);
    return { sheetThickness, lateralRes, rayleighRange, fov, opticalSectioning, workingDistRequirement };
  }, [naDet, naIll, wavelength, n, sampleThickness, tiltAngle]);

  const plotData = useMemo(() => {
    const angles = [];
    const wdReq = [];
    const sheetTh = [];
    for (let a = 0; a <= 90; a += 1) {
      angles.push(a);
      wdReq.push((sampleThickness / 2) / Math.cos((a * Math.PI) / 180));
      sheetTh.push(results.sheetThickness);
    }
    return [
      { x: angles, y: wdReq, name: "WD requirement (µm)", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
      { x: angles, y: sheetTh, name: "Sheet thickness (µm)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
    ];
  }, [sampleThickness, results.sheetThickness]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Light Sheet Microscopy Design Calculator" description="Full light sheet microscope design parameters: sheet geometry, tilt geometry, and volume imaging.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Detection NA</label>
            <input type="number" step={0.01} min={0.1} max={1.8} value={naDet} onChange={e => setNaDet(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Illumination NA</label>
            <input type="number" step={0.01} min={0.01} max={1.0} value={naIll} onChange={e => setNaIll(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (n)</label>
            <input type="number" step={0.01} value={n} onChange={e => setN(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sample thickness (µm)</label>
            <input type="number" step={10} value={sampleThickness} onChange={e => setSampleThickness(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tilt angle (°)</label>
            <input type="number" step={1} min={0} max={90} value={tiltAngle} onChange={e => setTiltAngle(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Sheet thickness</span><span className="font-mono text-blue-400">{results.sheetThickness.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-green-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Optical sectioning</span><span className="font-mono text-yellow-400">{results.opticalSectioning.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Rayleigh range</span><span className="font-mono text-purple-400">{results.rayleighRange.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Effective FOV (tilt)</span><span className="font-mono text-cyan-400">{results.fov.toFixed(1)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">WD requirement</span><span className="font-mono text-red-400">{results.workingDistRequirement.toFixed(1)} µm</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Sheet: t = nλ/NA²_ill | Lateral: d = 0.61λ/NA_det</p>
            <p>FOV_eff = t_sample / cos(θ) | WD = t_sample/(2·cos(θ))</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Working Distance &amp; Sheet Thickness vs Tilt Angle</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Tilt Angle (°)", gridcolor: "#333" }, yaxis: { title: "µm", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
