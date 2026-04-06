"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function BesselBeamPage() {
  const [wavelength, setWavelength] = useState(632.8); // nm
  const [alpha, setAlpha] = useState(0.01); // NA-like parameter (rad)
  const [maxR, setMaxR] = useState(200); // µm

  const besselArg = (r: number) => alpha * r;
  // Approximate J0 and J1 using series
  function besselJ0(x: number): number {
    if (Math.abs(x) < 1e-10) return 1;
    const ax = Math.abs(x);
    if (ax < 8) {
      let sum = 1, term = 1;
      for (let k = 1; k <= 25; k++) {
        term *= -(x * x) / (4 * k * k);
        sum += term;
        if (Math.abs(term) < 1e-15) break;
      }
      return sum;
    }
    // Asymptotic
    const p = Math.PI / 4;
    return Math.sqrt(2 / (Math.PI * ax)) * Math.cos(ax - p);
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

  const calc = useMemo(() => {
    const N = 500;
    const rs = Array.from({ length: N }, (_, i) => (maxR * i) / (N - 1));

    // J0 Bessel beam intensity
    const intensityJ0 = rs.map(r => {
      const j0 = besselJ0(alpha * r);
      return j0 * j0;
    });

    // J1 Bessel beam intensity
    const intensityJ1 = rs.map(r => {
      const j1 = besselJ1(alpha * r);
      return j1 * j1;
    });

    // 2D J0 heatmap
    const N2 = 150;
    const extent = maxR;
    const xs = Array.from({ length: N2 }, (_, i) => -extent + (2 * extent * i) / (N2 - 1));
    const z: number[][] = [];
    for (let j = N2 - 1; j >= 0; j--) {
      const row: number[] = [];
      for (let i = 0; i < N2; i++) {
        const r = Math.sqrt(xs[i] * xs[i] + xs[j] * xs[j]);
        const j0 = besselJ0(alpha * r);
        row.push(j0 * j0);
      }
      z.push(row);
    }

    // Max propagation distance (approx): z_max ≈ w_input / alpha
    const zMaxApprox = 5000 / alpha; // µm, assuming ~5mm input beam
    const centralLobeWidth = 2.405 / alpha; // first zero of J0
    const centralLobeFWHM = centralLobeWidth * 1.13; // approximate FWHM from first zero

    return { rs, intensityJ0, intensityJ1, z, xs, zMaxApprox, centralLobeWidth, centralLobeFWHM };
  }, [wavelength, alpha, maxR]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Bessel Beam Calculator" description="Non-diffracting beam profiles and propagation.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Cone angle α (rad)</span>
          <input type="number" value={alpha} onChange={e => setAlpha(+e.target.value)} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Max radius (µm)</span>
          <input type="number" value={maxR} onChange={e => setMaxR(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Central Lobe Width</p>
          <p className="text-xl font-bold text-blue-400">{calc.centralLobeWidth.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM (approx)</p>
          <p className="text-xl font-bold text-green-400">{calc.centralLobeFWHM.toFixed(1)} µm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Propagation</p>
          <p className="text-xl font-bold text-orange-400">{(calc.zMaxApprox / 1000).toFixed(1)} mm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <p className="text-gray-300 text-sm mb-2 font-mono">
          E(r) = J₀(α·r)  |  Central lobe first zero: r = 2.405/α
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <ChartPanel data={[
          { x: calc.rs, y: calc.intensityJ0, type: "scatter" as const, mode: "lines" as const, name: "J₀ intensity", line: { color: "#60a5fa" } },
          { x: calc.rs, y: calc.intensityJ1, type: "scatter" as const, mode: "lines" as const, name: "J₁ intensity", line: { color: "#f87171" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "r (µm)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" }, margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[{ z: calc.z, x: calc.xs, y: calc.xs, type: "heatmap" as const, colorscale: "Inferno", name: "J₀ 2D" }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "x (µm)", gridcolor: "#374151" },
          yaxis: { title: "y (µm)", gridcolor: "#374151" }, margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
