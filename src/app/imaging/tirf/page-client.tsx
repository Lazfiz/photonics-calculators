"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function TIRFPage() {
  const [na, setNa] = useState(1.49);
  const [n1, setN1] = useState(1.518); // glass
  const [n2, setN2] = useState(1.33); // water/buffer
  const [wavelength, setWavelength] = useState(488);
  const [angleOffset, setAngleOffset] = useState(0.1); // degrees beyond critical

  const results = useMemo(() => {
    const thetaC = Math.asin(n2 / n1) * (180 / Math.PI);
    const thetaI = thetaC + angleOffset;
    const thetaI_rad = thetaI * Math.PI / 180;
    const penetrationDepth = wavelength * 1e-9 / (2 * Math.PI * Math.sqrt(n1 * n1 * Math.sin(thetaI_rad) ** 2 - n2 * n2)) * 1e9;
    const evanescentAt100nm = Math.exp(-100 / penetrationDepth);
    const maxAngle = Math.asin(na / n1) * (180 / Math.PI);
    const evanescentRange = penetrationDepth > 0 ? true : false;
    return { thetaC, thetaI, penetrationDepth, evanescentAt100nm, maxAngle, evanescentRange };
  }, [na, n1, n2, wavelength, angleOffset]);

  const plotData = useMemo(() => {
    const angles = [];
    const depths = [];
    const thetaC_rad = Math.asin(n2 / n1);
    for (let deg = Math.ceil(results.thetaC * 10) / 10; deg <= results.maxAngle; deg += 0.1) {
      const rad = deg * Math.PI / 180;
      const d = wavelength * 1e-9 / (2 * Math.PI * Math.sqrt(n1 * n1 * Math.sin(rad) ** 2 - n2 * n2)) * 1e9;
      if (d > 0 && d < 1000) {
        angles.push(deg);
        depths.push(d);
      }
    }
    return [
      { x: angles, y: depths, name: "Penetration depth", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
    ];
  }, [na, n1, n2, wavelength]);

  const decayPlot = useMemo(() => {
    const z = [];
    const intensity = [];
    for (let i = 0; i <= 500; i += 5) {
      z.push(i);
      intensity.push(Math.exp(-i / results.penetrationDepth));
    }
    return [
      { x: z, y: intensity, name: "Evanescent field", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
      { x: [results.penetrationDepth, results.penetrationDepth], y: [0, 1], name: "d = 1/e", line: { color: "#4ade80", dash: "dash" }, type: "scatter", mode: "lines" },
    ];
  }, [results.penetrationDepth]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="TIRF Penetration Depth Calculator" description="Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <input type="number" step={0.01} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">n₁ (coverslip / immersion)</label>
            <input type="number" step={0.001} value={n1} onChange={e => setN1(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">n₂ (sample medium)</label>
            <input type="number" step={0.01} value={n2} onChange={e => setN2(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Angle beyond critical (°)</label>
            <input type="number" step={0.05} value={angleOffset} onChange={e => setAngleOffset(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Critical angle θ_c</span><span className="font-mono text-yellow-400">{results.thetaC.toFixed(2)}°</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Incidence angle θ_i</span><span className="font-mono text-blue-400">{results.thetaI.toFixed(2)}°</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Max angle (NA limit)</span><span className="font-mono">{results.maxAngle.toFixed(2)}°</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Penetration depth d</span><span className="font-mono text-green-400">{results.penetrationDepth.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Intensity at 100 nm</span><span className="font-mono text-purple-400">{(results.evanescentAt100nm * 100).toFixed(1)}%</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>θ_c = arcsin(n₂/n₁)</p>
            <p>d = λ / (2π √(n₁²sin²θ_i − n₂²))</p>
            <p>I(z) = I₀ · exp(−z/d)</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Penetration Depth vs Angle</h2>
          <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Incidence angle (°)", gridcolor: "#333" }, yaxis: { title: "Depth (nm)", gridcolor: "#333" }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Evanescent Field Decay</h2>
          <ChartPanel data={decayPlot} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Distance from surface (nm)", gridcolor: "#333" }, yaxis: { title: "Relative intensity", gridcolor: "#333" }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
