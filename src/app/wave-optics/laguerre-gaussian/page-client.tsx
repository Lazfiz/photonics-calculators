"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
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
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [waist, setWaist] = useURLState("waist", 50);
  const [p, setP] = useURLState("p", 0);
  const [l, setL] = useURLState("l", 1);

  const w0 = waist;
  const zR = Math.PI * w0 * w0 / wavelength; // mm (µm²/nm = mm)
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
        const norm = Math.sqrt(factorial(p) / (Math.PI * factorial(p + absL))) / w0;
        const radial = norm * Math.pow(rho, absL) * Lpl * Math.exp(-rho * rho / 2);
        // Physical intensity: |u|² = |radial|² (|exp(ilθ)|² = 1, azimuthally symmetric)
        row.push(radial * radial);
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
      const norm = Math.sqrt(factorial(p) / (Math.PI * factorial(p + absL))) / w0;
      const radial = norm * Math.pow(rho, absL) * Lpl * Math.exp(-rho * rho / 2);
      return radial * radial;
    });
    return [{ x: rs, y: intensity, type: "scatter" as const, mode: "lines" as const, name: "Radial intensity", line: { color: "#60a5fa" } }];
  }, [waist, p, l]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Laguerre-Gaussian Modes" description="Donut modes with orbital angular momentum.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Beam Waist w₀ (µm)" value={waist} onChange={setWaist} step="any" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Radial index p (0–4)" value={p} onChange={setP} min={0} max={4} />
        <ValidatedNumberInput label="Azimuthal index l (−5 to 5)" value={l} onChange={setL} />
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
          u<sub>pl</sub>(r,θ) = C · (√2·r/w₀)<sup>|{l}|</sup> · L<sub>{p}</sub><sup>|{l}|</sup>(2r²/w₀²) · exp(−r²/w₀²) · exp(i{l}θ)
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
