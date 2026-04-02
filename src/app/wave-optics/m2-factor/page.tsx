"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function M2FactorPage() {
  const [wavelength, setWavelength] = useState(1064); // nm
  const [w0, setW0] = useState(0.5); // mm, measured waist
  const [theta, setTheta] = useState(2); // mrad, measured divergence
  const [targetM2, setTargetM2] = useState(1.5);

  const calc = useMemo(() => {
    const lam = wavelength * 1e-6; // mm
    const w0m = w0; // mm
    const thetaRad = theta / 1000; // rad
    const thetaHalf = thetaRad / 2; // half-angle divergence

    // M² = (π * w0 * θ) / λ  (using half-angle divergence, w0 as 1/e² radius)
    const M2 = (Math.PI * w0m * thetaHalf) / lam;
    const M2dB = 10 * Math.log10(M2);

    // Diffraction-limited values
    const thetaDL = lam / (Math.PI * w0m);
    const w0DL = lam / (Math.PI * thetaHalf);

    // Beam parameter product BPP = w0 * θ
    const BPP = w0m * thetaHalf;

    return { M2, M2dB, thetaDL, w0DL, BPP };
  }, [wavelength, w0, theta]);

  const chartData = useMemo(() => {
    const lam = wavelength * 1e-6;
    // Plot beam radius vs z for different M² values
    const zR = Math.PI * w0 * w0 / lam;
    const zs = Array.from({ length: 200 }, (_, i) => -3 * zR + i * 0.03 * zR);
    const M2s = [1, 1.5, 2, 3];
    const colors = ["#22c55e", "#60a5fa", "#facc15", "#f87171"];

    const traces = M2s.map((M, idx) => {
      const ws = zs.map(z => w0 * Math.sqrt(1 + (M * z / zR) ** 2));
      return { x: zs, y: ws, type: "scatter" as const, mode: "lines" as const, name: `M² = ${M}`, line: { color: colors[idx] } };
    });

    return traces;
  }, [wavelength, w0]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Wave Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Beam Quality Factor M²</h1>
      <p className="text-gray-400 mb-8">M² = (π w₀ θ)/λ. M² = 1 for ideal Gaussian, higher for multimode beams.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={100}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Waist Radius w₀ (mm)</span>
          <input type="number" value={w0} onChange={e => setW0(+e.target.value)} min={0.001} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Divergence θ (mrad, full)</span>
          <input type="number" value={theta} onChange={e => setTheta(+e.target.value)} min={0.01} step="any"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className={`bg-gray-900 border ${calc.M2 <= 1.5 ? "border-green-800" : calc.M2 <= 2 ? "border-yellow-800" : "border-red-800"} rounded-lg p-6 mb-8`}>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-gray-400">M² Factor</p>
            <p className={`text-3xl font-bold ${calc.M2 <= 1.5 ? "text-green-400" : calc.M2 <= 2 ? "text-yellow-400" : "text-red-400"}`}>{calc.M2.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">vs Ideal (dB)</p>
            <p className="text-2xl font-bold text-blue-400">+{calc.M2dB.toFixed(1)} dB</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">DL Divergence</p>
            <p className="text-2xl font-bold text-yellow-400">{(calc.thetaDL * 1000).toFixed(2)} mrad</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">BPP</p>
            <p className="text-2xl font-bold text-green-400">{(calc.BPP * 1e6).toFixed(2)} mm·mrad</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "z (mm)", gridcolor: "#374151" },
          yaxis: { title: "Beam Radius w(z) (mm)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.7, y: 0.05 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
