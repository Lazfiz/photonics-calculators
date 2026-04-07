"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";

import ValidatedNumberInput from "../../../components/validated-number-input";
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
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Spectral Resolution" description="Resolving power and minimum resolvable wavelength for a diffraction grating spectrometer.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Grating (lines/mm)" value={gratingLines} onChange={setGratingLines} />
        <ValidatedNumberInput label="Grating Width (mm)" value={gratingWidth} onChange={setGratingWidth} />
        <ValidatedNumberInput label="Diffraction Order" value={order} onChange={setOrder} min={1} max={5} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
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
    </CalculatorShell>
  );
}
