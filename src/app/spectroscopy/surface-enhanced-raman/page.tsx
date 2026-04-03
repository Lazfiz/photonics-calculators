"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SurfaceEnhancedRamanPage() {
  const [enhancementFactor, setEnhancementFactor] = useState(1e6);
  const [normalIntensity, setNormalIntensity] = useState(1);
  const [hotspotDensity, setHotspotDensity] = useState(0.01);
  const [nanoparticleRadius, setNanoparticleRadius] = useState(50);
  const [laserWavelength, setLaserWavelength] = useState(633);

  const chartData = useMemo(() => {
    // Enhancement vs nanoparticle size for different gaps
    const radii = Array.from({ length: 200 }, (_, i) => 10 + (i / 200) * 190);
    const gaps = [1, 2, 5, 10];

    return gaps.map((gap, idx) => {
      const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];
      const enh = radii.map(r => {
        const ratio = gap / r;
        // Simplified EM enhancement: |E/E₀|⁴ ~ (r/gap)^4 (dipole coupling)
        const emEnh = Math.min(Math.pow(r / gap, 4) / 1e6, 1e12);
        return emEnh;
      });
      return {
        x: radii, y: enh, type: "scatter" as const, mode: "lines" as const,
        name: `Gap = ${gap} nm`, line: { color: colors[idx] },
      };
    });
  }, []);

  const spectrumData = useMemo(() => {
    const shifts = Array.from({ length: 500 }, (_, i) => (i / 500) * 3500);
    const peaks = [
      { pos: 520, width: 15, amp: 0.8 },
      { pos: 1000, width: 20, amp: 0.4 },
      { pos: 1350, width: 25, amp: 0.6 },
      { pos: 1580, width: 20, amp: 1.0 },
      { pos: 2850, width: 30, amp: 0.5 },
      { pos: 2950, width: 30, amp: 0.7 },
    ];
    const normal = shifts.map(s => {
      let y = 0;
      for (const p of peaks) y += p.amp * Math.exp(-0.5 * ((s - p.pos) / p.width) ** 2);
      return y * normalIntensity;
    });
    const enhanced = normal.map(y => y * enhancementFactor);

    return [
      { x: shifts, y: normal, type: "scatter" as const, mode: "lines" as const, name: "Normal Raman", line: { color: "#6b7280" } },
      { x: shifts, y: enhanced, type: "scatter" as const, mode: "lines" as const, name: "SERS", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [enhancementFactor, normalIntensity]);

  const eFieldEnh = Math.pow(enhancementFactor, 0.25);
  const sersIntensity = normalIntensity * enhancementFactor;
  const detectionLimit = normalIntensity / enhancementFactor;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Surface-Enhanced Raman Spectroscopy (SERS)</h1>
      <p className="text-gray-400 mb-8">EM and chemical enhancement mechanisms, hotspots, and detection limit estimation.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Enhancement Factor G</span>
          <input type="number" value={enhancementFactor} onChange={e => setEnhancementFactor(+e.target.value)} min={1} step={1e4}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Normal Raman Intensity (a.u.)</span>
          <input type="number" value={normalIntensity} onChange={e => setNormalIntensity(+e.target.value)} min={0.01} step={0.1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Nanoparticle Radius (nm)</span>
          <input type="number" value={nanoparticleRadius} onChange={e => setNanoparticleRadius(+e.target.value)} min={5} max={200}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Laser Wavelength (nm)</span>
          <input type="number" value={laserWavelength} onChange={e => setLaserWavelength(+e.target.value)} min={200} max={2000}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">EM Enhancement:</span> G<sub>EM</sub> = |E<sub>loc</sub>/E<sub>0</sub>|⁴</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Dipole coupling:</span> |E/E₀|² ~ (a/d)³ (sphere gap model)</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Total:</span> G = G<sub>EM</sub> × G<sub>chem</sub></p>
        <p className="text-gray-300 text-sm"><span className="text-blue-400 font-mono">Detection limit:</span> I<sub>min</sub> = I<sub>normal</sub> / G</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-xs">E-field Enhancement</p>
          <p className="text-2xl font-bold text-blue-400">{eFieldEnh.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-xs">SERS Intensity</p>
          <p className="text-2xl font-bold text-green-400">{sersIntensity.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-xs">Detection Limit Factor</p>
          <p className="text-2xl font-bold text-yellow-400">{detectionLimit.toExponential(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">SERS vs Normal Raman Spectrum</h3>
        <Plot data={spectrumData} layout={{
          xaxis: { title: "Raman Shift (cm⁻¹)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Normal Intensity", gridcolor: "#374151", color: "#9ca3af", rangemode: "tozero" },
          yaxis2: { title: "SERS Intensity", overlaying: "y", side: "right", gridcolor: "#374151", color: "#9ca3af" },
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          legend: { orientation: "h", y: -0.2 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">EM Enhancement vs Nanoparticle Radius</h3>
        <Plot data={chartData} layout={{
          xaxis: { title: "Nanoparticle Radius (nm)", gridcolor: "#374151", color: "#9ca3af", type: "log" },
          yaxis: { title: "Enhancement Factor", gridcolor: "#374151", color: "#9ca3af", type: "log" },
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          legend: { orientation: "h", y: -0.2 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Concepts</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong className="text-blue-400">EM mechanism</strong>: Localized surface plasmon resonance (LSPR) amplifies E-field by 10²–10³</li>
          <li>• <strong className="text-green-400">Hotspots</strong>: Nanogaps between particles where |E/E₀|⁴ can reach 10⁸–10¹¹</li>
          <li>• <strong className="text-yellow-400">Chemical enhancement</strong>: Charge transfer adds ~10–100× on top of EM</li>
          <li>• <strong className="text-red-400">Single-molecule SERS</strong>: Achievable at hotspots with G &gt; 10⁹</li>
        </ul>
      </div>
    </div>
  );
}
