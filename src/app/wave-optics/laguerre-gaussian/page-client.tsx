"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function laguerreL(p: number, l: number, x: number): number {
  if (p === 0) return 1;
  if (p === 1) return 1 + l - x;
  let l0 = 1, l1 = 1 + l - x;
  for (let k = 2; k <= p; k++) {
    const l2 = ((2 * k - 1 + l - x) * l1 - (k - 1 + l) * l0) / k;
    l0 = l1;
    l1 = l2;
  }
  return l1;
}

export default function LaguerreGaussianPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [waist, setWaist] = useState(50);
  const [p, setP] = useState(0);
  const [l, setL] = useState(1);

  const w0 = waist;
  const zR = Math.PI * w0 * w0 / wavelength * 1000;
  const absL = Math.abs(l);
  const orbitalAngularMomentum = l; // ℏ per photon

  const chartData = useMemo(() => {
    const extent = w0 * 4;
    const N = 150;
    const xs = Array.from({ length: N }, (_, i) => -extent + (2 * extent * i) / (N - 1));
    const ys = Array.from({ length: N }, (_, i) => -extent + (2 * extent * i) / (N - 1));

    const z: number[][] = [];
    for (let j = N - 1; j >= 0; j--) {
      const row: number[] = [];
      for (let i = 0; i < N; i++) {
        const x = xs[i], y = ys[j];
        const r = Math.sqrt(x * x + y * y);
        const theta = Math.atan2(y, x);
        const rho = Math.SQRT2 * r / w0;
        const Lpl = laguerreL(p, absL, rho * rho);
        const norm = Math.sqrt(2 * factorial(p) / (Math.PI * factorial(p + absL))) / w0;
        const radial = norm * Math.pow(rho, absL) * Lpl * Math.exp(-rho * rho / 2);
        const azimuthal = Math.cos(l * theta);
        const field = radial * azimuthal;
        row.push(field * field);
      }
      z.push(row);
    }
    return [{ z, x: xs, y: ys, type: "heatmap" as const, colorscale: "Inferno", name: `LG p=${p} l=${l}` }];
  }, [wavelength, waist, p, l]);

  // Radial profile
  const radialData = useMemo(() => {
    const rMax = w0 * 4;
    const N = 200;
    const rs = Array.from({ length: N }, (_, i) => (rMax * i) / (N - 1));
    const intensity = rs.map(r => {
      const rho = Math.SQRT2 * r / w0;
      const Lpl = laguerreL(p, absL, rho * rho);
      const norm = Math.sqrt(2 * factorial(p) / (Math.PI * factorial(p + absL))) / w0;
      const radial = norm * Math.pow(rho, absL) * Lpl * Math.exp(-rho * rho / 2);
      return radial * radial;
    });
    return [{ x: rs, y: intensity, type: "scatter" as const, mode: "lines" as const, name: "Radial intensity", line: { color: "#60a5fa" } }];
  }, [waist, p, l]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Laguerre-Gaussian Modes" description="Donut modes with orbital angular momentum.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Beam Waist w₀ (µm)</span>
          <input type="number" value={waist} onChange={e => setWaist(+e.target.value)} step="any" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Radial index p (0–4)</span>
          <input type="number" value={p} onChange={e => setP(Math.min(4, Math.max(0, +e.target.value)))} min={0} max={4} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Azimuthal index l (−5 to 5)</span>
          <input type="number" value={l} onChange={e => setL(Math.min(5, Math.max(-5, +e.target.value)))} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Mode</p>
          <p className="text-xl font-bold text-blue-400">LG<sub>{p}</sub><sup>{l}</sup></p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">OAM (ℏ/photon)</p>
          <p className="text-xl font-bold text-green-400">{l}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Rayleigh Range</p>
          <p className="text-xl font-bold text-orange-400">{zR.toFixed(2)} mm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <p className="text-gray-300 text-sm mb-2 font-mono">
          u<sub>pl</sub>(r,θ) = C · (√2·r/w₀)<sup>|{l}|</sup> · L<sub>{p}</sub><sup>|{l}|</sup>(2r²/w₀²) · exp(−r²/w₀²) · exp(i{absL}θ)
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "x (µm)", gridcolor: "#374151" },
          yaxis: { title: "y (µm)", gridcolor: "#374151" }, margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={radialData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "r (µm)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" }, margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
