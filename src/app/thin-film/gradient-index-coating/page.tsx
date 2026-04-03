"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function GradientIndexCoatingPage() {
  const [n1, setN1] = useState(1.0);
  const [nSurface, setNSurface] = useState(1.23);
  const [nSub, setNSub] = useState(1.52);
  const [thickness, setThickness] = useState(500);
  const [profile, setProfile] = useState<"linear" | "cosine" | "exponential">("cosine");
  const [designWl, setDesignWl] = useState(550);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    // Approximate gradient-index coating reflectance
    // Divide into N thin sub-layers, apply transfer matrix
    const N = 50;
    const dz = thickness / N;

    const R = wls.map(wl => {
      let re = 1, im = 0; // Start with reflected amplitude from substrate side
      for (let j = N - 1; j >= 0; j--) {
        const frac = j / (N - 1); // 0 at surface, 1 at substrate
        let nLayer: number;
        if (profile === "linear") {
          nLayer = nSurface + (nSub - nSurface) * frac;
        } else if (profile === "cosine") {
          nLayer = (nSurface + nSub) / 2 + (nSurface - nSub) / 2 * Math.cos(Math.PI * frac);
        } else {
          nLayer = nSurface * Math.pow(nSub / nSurface, frac);
        }
        const delta = (2 * Math.PI * nLayer * dz) / wl;
        const r = j === 0
          ? (n1 - nLayer) / (n1 + nLayer)
          : (() => {
              const fracPrev = (j + 1) / (N - 1);
              let nPrev: number;
              if (profile === "linear") nPrev = nSurface + (nSub - nSurface) * fracPrev;
              else if (profile === "cosine") nPrev = (nSurface + nSub) / 2 + (nSurface - nSub) / 2 * Math.cos(Math.PI * fracPrev);
              else nPrev = nSurface * Math.pow(nSub / nSurface, fracPrev);
              return (nLayer - nPrev) / (nLayer + nPrev);
            })();
        const newRe = re * Math.cos(delta) - im * Math.sin(delta) + r;
        const newIm = re * Math.sin(delta) + im * Math.cos(delta);
        re = newRe;
        im = newIm;
      }
      return Math.min(re * re + im * im, 1);
    });

    // Refractive index profile
    const z = Array.from({ length: 100 }, (_, i) => (i * thickness) / 99);
    const nProfile = z.map(zi => {
      const frac = zi / thickness;
      if (profile === "linear") return nSurface + (nSub - nSurface) * frac;
      if (profile === "cosine") return (nSurface + nSub) / 2 + (nSurface - nSub) / 2 * Math.cos(Math.PI * frac);
      return nSurface * Math.pow(nSub / nSurface, frac);
    });

    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#60a5fa" } },
    ];
  }, [n1, nSurface, nSub, thickness, profile]);

  const z = Array.from({ length: 100 }, (_, i) => (i * thickness) / 99);
  const nProfile = z.map(zi => {
    const frac = zi / thickness;
    if (profile === "linear") return nSurface + (nSub - nSurface) * frac;
    if (profile === "cosine") return (nSurface + nSub) / 2 + (nSurface - nSub) / 2 * Math.cos(Math.PI * frac);
    return nSurface * Math.pow(nSub / nSurface, frac);
  });

  const optimalN = Math.sqrt(n1 * nSub);
  const gradIndexData = [
    { x: z, y: nProfile, type: "scatter" as const, mode: "lines" as const, name: "n(z)", line: { color: "#a78bfa" } },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Gradient Index Coating</h1>
      <p className="text-gray-400 mb-8">Gradient-index (GRIN) antireflection coatings use a continuously varying refractive index to suppress Fresnel reflections over a broad bandwidth.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">n (incident)</span>
          <input type="number" value={n1} onChange={e => setN1(+e.target.value)} step="0.01" min="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n (surface)</span>
          <input type="number" value={nSurface} onChange={e => setNSurface(+e.target.value)} step="0.01" min="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n (substrate)</span>
          <input type="number" value={nSub} onChange={e => setNSub(+e.target.value)} step="0.01" min="0.1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Thickness (nm)</span>
          <input type="number" value={thickness} onChange={e => setThickness(+e.target.value)} step="50" min="10" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Index Profile</span>
          <select value={profile} onChange={e => setProfile(e.target.value as "linear" | "cosine" | "exponential")} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="linear">Linear</option>
            <option value="cosine">Cosine ( quintic-like)</option>
            <option value="exponential">Exponential</option>
          </select></label>
        <label className="block"><span className="text-gray-300 text-sm">Design Wavelength (nm)</span>
          <input type="number" value={designWl} onChange={e => setDesignWl(+e.target.value)} step="10" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ideal n (surface)</p>
          <p className="text-xl font-bold text-green-400">{optimalN.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n range</p>
          <p className="text-xl font-bold text-blue-400">{nSurface.toFixed(2)} → {nSub.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Thickness</p>
          <p className="text-xl font-bold text-yellow-400">{thickness} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">GRIN Coating Theory</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Ideal: n(z) = n₁·(n₂/n₁)^(z/d)</p>
          <p>Cosine: n(z) = (n₁+n₂)/2 + (n₁−n₂)/2·cos(πz/d)</p>
          <p>For perfect matching: n_surface = √(n_incident · n_substrate)</p>
          <p>Transfer matrix with continuous n(z): divide into sub-layers</p>
          <p>Advantage: broadband AR vs. discrete quarter-wave stacks</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Refractive Index Profile</h3>
          <Plot data={gradIndexData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Depth z (nm)", gridcolor: "#374151" },
            yaxis: { title: "Refractive Index", gridcolor: "#374151" },
            margin: { t: 20, r: 30, b: 40, l: 60 },
            height: 250,
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <Plot data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>
    </div>
  );
}
