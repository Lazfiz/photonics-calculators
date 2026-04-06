"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function NearInfraredPage() {
  const [wavelengthStart, setWavelengthStart] = useState(780);
  const [wavelengthEnd, setWavelengthEnd] = useState(2500);
  const [pathLength, setPathLength] = useState(1);
  const [waterContent, setWaterContent] = useState(0.8);
  const [scatteringCoeff, setScatteringCoeff] = useState(10);

  // NIR overtone/combination bands
  const nirBands = [
    { name: "1st overtone O-H", center: 1450, width: 80, eps: 5 },
    { name: "1st overtone C-H", center: 1690, width: 40, eps: 3 },
    { name: "1st overtone N-H", center: 1500, width: 50, eps: 4 },
    { name: "Combination O-H", center: 1900, width: 100, eps: 10 },
    { name: "Combination C-H", center: 2100, width: 60, eps: 2 },
    { name: "Combination N-H", center: 2180, width: 50, eps: 3 },
    { name: "2nd overtone O-H", center: 960, width: 50, eps: 1 },
    { name: "2nd overtone C-H", center: 1210, width: 30, eps: 0.5 },
    { name: "2nd overtone N-H", center: 1040, width: 40, eps: 0.8 },
  ];

  const spectrumData = useMemo(() => {
    const wl = Array.from({ length: 600 }, (_, i) => wavelengthStart + (i / 600) * (wavelengthEnd - wavelengthStart));
    const absorbance = wl.map(w => {
      let a = 0;
      for (const b of nirBands) {
        // Scale water bands by water content
        const isWater = b.name.includes("O-H");
        const scale = isWater ? waterContent : (1 - waterContent);
        a += b.eps * scale * pathLength * Math.exp(-0.5 * Math.pow((w - b.center) / b.width, 2));
      }
      // Add scattering baseline
      a += scatteringCoeff * pathLength * Math.pow(1000 / w, 2) * 0.01;
      return a;
    });
    const transmittance = absorbance.map(a => Math.pow(10, -a));
    return [
      { x: wl, y: absorbance, type: "scatter" as const, mode: "lines" as const, name: "Absorbance", line: { color: "#60a5fa" } },
      { x: wl, y: transmittance.map(t => t * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmittance %",
        line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [wavelengthStart, wavelengthEnd, pathLength, waterContent, scatteringCoeff]);

  const overtoneData = useMemo(() => {
    // Fundamental at 3400 cm⁻¹ → overtones
    const fundamental = 3400;
    const overtones = [1, 2, 3, 4, 5];
    const positions = overtones.map(n => fundamental / n);
    const intensities = overtones.map(n => 1 / Math.pow(n, 2));
    return [
      { x: positions, y: intensities, type: "bar" as const, name: "Overtone Intensity", marker: { color: "#60a5fa" } },
    ];
  }, []);

  const region = wavelengthEnd <= 1100 ? "NIR-A (780-1100 nm)" : wavelengthStart >= 1100 && wavelengthEnd <= 1350 ? "NIR-B (1100-1350 nm)" : wavelengthStart >= 1350 ? "NIR-C (1350-2500 nm)" : "Multi-region";

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Near-Infrared (NIR) Spectroscopy" description="Overtone and combination band analysis for non-destructive composition measurement.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength Start (nm)</span>
          <input type="number" value={wavelengthStart} onChange={e => setWavelengthStart(+e.target.value)} min={780} max={2500}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength End (nm)</span>
          <input type="number" value={wavelengthEnd} onChange={e => setWavelengthEnd(+e.target.value)} min={780} max={2500}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Path Length (cm)</span>
          <input type="number" value={pathLength} onChange={e => setPathLength(+e.target.value)} min={0.01} max={10} step={0.1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Water Content (fraction)</span>
          <input type="number" value={waterContent} onChange={e => setWaterContent(+e.target.value)} min={0} max={1} step={0.05}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Overtone:</span> ν̃<sub>n</sub> ≈ n × ν̃<sub>fundamental</sub> × (1 − χₑ(n²−1))</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Combination:</span> ν̃<sub>comb</sub> = ν̃₁ + ν̃₂</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Intensity:</span> I<sub>n</sub> ∝ 1/n² (anharmonic decay)</p>
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">Modified Beer-Lambert:</span> A = εcL + G (scattering term)</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-blue-400">{region}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-green-400">{(1e7 / wavelengthEnd).toFixed(0)}–{(1e7 / wavelengthStart).toFixed(0)} cm⁻¹</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-lg font-bold text-yellow-400">μ'<sub>s</sub> = {scatteringCoeff}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">NIR Absorption Spectrum</h3>
        <ChartPanel data={spectrumData} layout={{
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Absorbance", gridcolor: "#374151", color: "#9ca3af" },
          yaxis2: { title: "Transmittance %", overlaying: "y", side: "right", gridcolor: "#374151", color: "#9ca3af" },
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          legend: { orientation: "h", y: -0.2 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">NIR Band Assignments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          {nirBands.map(b => (
            <div key={b.name} className="bg-gray-800 rounded p-2">
              <span className="text-green-400">{b.name}</span>
                          </div>
          ))}
        </div>
      </div>
    </CalculatorShell>
  );
}
