"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function SpatialFilterPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1064); // nm
  const [inputBeamDiam, setInputBeamDiam] = useURLState("inputBeamDiam", 1000); // µm (1/e²)
  const [focalLength, setFocalLength] = useURLState("focalLength", 50); // mm
  const [m2, setM2] = useURLState("m2", 1.0);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-3; // µm
    const w0 = inputBeamDiam / 2; // µm
    const f = focalLength * 1000; // µm

    // Gaussian beam focused waist
    const wFocus = lambda * f / (Math.PI * w0); // µm
    const wFocusM2 = wFocus * m2;

    // Recommended pinhole sizes
    const airyDisk = 1.22 * lambda * f / inputBeamDiam; // µm
    const pinhole60 = 1.0 * wFocusM2; // 60% transmission (1× waist)
    const pinhole80 = 1.3 * wFocusM2; // ~80% transmission
    const pinhole95 = 1.5 * wFocusM2; // ~95% transmission
    const pinhole99 = 2.0 * wFocusM2; // ~99% transmission

    // Power throughput vs pinhole diameter
    const N = 200;
    const diameters = Array.from({ length: N }, (_, i) => (4 * wFocusM2 * i) / (N - 1));
    const throughput = diameters.map(d => {
      const r = d / 2;
      return 1 - Math.exp(-2 * r * r / (wFocusM2 * wFocusM2));
    });

    // Diffraction from pinhole (approximate Airy)
    const N2 = 150;
    const propDist = 100; // mm
    const z = propDist * 1000; // µm
    const ext = 200; // µm
    const xs = Array.from({ length: N2 }, (_, i) => -ext + (2 * ext * i) / (N2 - 1));
    const k = 2 * Math.PI / lambda;
    const pinhole = pinhole80;

    const z2d: number[][] = [];
    for (let j = N2 - 1; j >= 0; j--) {
      const row: number[] = [];
      for (let i = 0; i < N2; i++) {
        const rho = Math.sqrt(xs[i] * xs[i] + xs[j] * xs[j]);
        if (rho < 1e-10) { row.push(1); continue; }
        const arg = k * pinhole * rho / z;
        const j1v = besselJ1(arg);
        const airy = 2 * j1v / arg;
        row.push(airy * airy);
      }
      z2d.push(row);
    }

    return { wFocus, wFocusM2, airyDisk, pinhole60, pinhole80, pinhole95, pinhole99, diameters, throughput, z2d, xs };
  }, [wavelength, inputBeamDiam, focalLength, m2]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Spatial Filter Pinhole Sizing" description="Calculate optimal pinhole diameter for spatial filtering.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Input beam 1/e² diameter (µm)" value={inputBeamDiam} onChange={setInputBeamDiam} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Lens focal length (mm)" value={focalLength} onChange={setFocalLength} />
        <ValidatedNumberInput label="M² factor" value={m2} onChange={setM2} min={1} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Focused Waist (M²=1)</p>
          <p className="text-xl font-bold text-blue-400">{calc.wFocus.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Airy Disk Diameter</p>
          <p className="text-xl font-bold text-green-400">{calc.airyDisk.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Recommended Pinhole</p>
          <p className="text-xl font-bold text-orange-400">{calc.pinhole80.toFixed(1)} µm</p>
          <p className="text-xs text-gray-500">(~80% throughput)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Conservative Pinhole</p>
          <p className="text-xl font-bold text-purple-400">{calc.pinhole60.toFixed(1)} µm</p>
          <p className="text-xs text-gray-500">(~60% throughput)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <p className="text-gray-300 text-sm mb-2 font-mono">
          w_f = λf/(πw₀)  |  P/P₀ = 1 − exp(−2r²/w²)  |  Airy = 1.22λf/D
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <ChartPanel data={[{
          x: calc.diameters, y: calc.throughput,
          type: "scatter" as const, mode: "lines" as const, name: "Power throughput",
          line: { color: "#60a5fa" },
        }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Pinhole diameter (µm)", gridcolor: "#374151" },
          yaxis: { title: "Throughput", gridcolor: "#374151" }, margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[{ z: calc.z2d, x: calc.xs, y: calc.xs, type: "heatmap" as const, colorscale: "Inferno" }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "x (µm)", gridcolor: "#374151" },
          yaxis: { title: "y (µm)", gridcolor: "#374151" }, margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}

function besselJ1(x: number): number {
  if (Math.abs(x) < 1e-10) return 0;
  if (Math.abs(x) < 8) {
    let sum = x / 2, term = x / 2;
    for (let k = 1; k <= 25; k++) {
      term *= -(x * x) / (4 * k * (k + 1));
      sum += term;
      if (Math.abs(term) < 1e-15) break;
    }
    return sum;
  }
  const ax = Math.abs(x);
  return Math.sqrt(2 / (Math.PI * ax)) * Math.cos(ax - 3 * Math.PI / 4);
}
