"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function ResolutionPage() {
  const [gratingLines, setGratingLines] = useState(1200);
  const [gratingWidth, setGratingWidth] = useState(50);
  const [order, setOrder] = useState(1);
  const [wavelength, setWavelength] = useState(550);

  const resolvingPower = gratingLines * gratingWidth * order / 1e6; // N*m*order where N = lines/mm * width_mm / 1000
  // Actually: R = mN where N = total illuminated lines = lines/mm * width_mm
  const N = gratingLines * gratingWidth;
  const R = order * N;
  const deltaLambda = wavelength / R;

  const angleOfIncidence = Math.asin(wavelength * order / 1e6 / gratingLines) * 180 / Math.PI;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/spectroscopy" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Spectroscopy</Link>
      <h1 className="text-3xl font-bold mb-2">Spectral Resolution</h1>
      <p className="text-gray-400 mb-8">Resolving power and minimum resolvable wavelength for a diffraction grating spectrometer.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Grating (lines/mm)</span>
          <input type="number" value={gratingLines} onChange={e => setGratingLines(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Grating Width (mm)</span>
          <input type="number" value={gratingWidth} onChange={e => setGratingWidth(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Diffraction Order</span>
          <input type="number" value={order} onChange={e => setOrder(+e.target.value)} min={1} max={5} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Lines (N)</p>
          <p className="text-xl font-bold text-white">{N.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Resolving Power (R)</p>
          <p className="text-xl font-bold text-blue-400">{R.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Min Δλ</p>
          <p className="text-xl font-bold text-green-400">{deltaLambda.toFixed(4)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-sm text-gray-400">
        <p className="font-semibold text-white mb-2">Formulas</p>
        <p>R = mN = m × (lines/mm) × W</p>
        <p>Δλ<sub>min</sub> = λ / R</p>
        <p>sin(θ) = mλ / d = mλ × (lines/mm) × 10<sup>-6</sup></p>
      </div>
    </div>
  );
}
