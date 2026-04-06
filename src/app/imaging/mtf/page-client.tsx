"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function MTFPage() {
  const [na, setNa] = useState(0.95);
  const [wavelength, setWavelength] = useState(550);
  const [defocus, setDefocus] = useState(0);

  const mtfCurve = useMemo(() => {
    const lambda_um = wavelength * 1e-3;
    const fc = (2 * na) / lambda_um; // cutoff freq in lp/µm
    const W = Math.PI * na * na * defocus / lambda_um; // defocus wave aberration (radians)

    const freqs: number[] = [];
    const mtfVals: number[] = [];
    for (let f = 0; f <= fc; f += fc / 500) {
      freqs.push(f);
      const fn = f / fc;
      if (fn >= 1) {
        mtfVals.push(0);
      } else {
        const incoherent = (2 / Math.PI) * (Math.acos(fn) - fn * Math.sqrt(1 - fn * fn));
        // Apply defocus: simple Strehl-like attenuation
        const defocusFactor = defocus === 0 ? 1 : Math.exp(-2 * (W * fn) * (W * fn));
        mtfVals.push(incoherent * defocusFactor);
      }
    }
    return { freqs, mtfVals, fc };
  }, [na, wavelength, defocus]);

  const plotData = useMemo(() => {
    const lambda_um = wavelength * 1e-3;
    const fc = (2 * na) / lambda_um;
    const defocusValues = [0, 0.5, 1, 2, 5];
    const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#c084fc"];

    return defocusValues.map((df, i) => {
      const W = Math.PI * na * na * df / lambda_um;
      const freqs: number[] = [];
      const vals: number[] = [];
      for (let f = 0; f <= fc; f += fc / 500) {
        freqs.push(f);
        const fn = f / fc;
        if (fn >= 1) { vals.push(0); continue; }
        const incoherent = (2 / Math.PI) * (Math.acos(fn) - fn * Math.sqrt(1 - fn * fn));
        const defocusFactor = df === 0 ? 1 : Math.exp(-2 * (W * fn) * (W * fn));
        vals.push(incoherent * defocusFactor);
      }
      return {
        x: freqs, y: vals, type: "scatter" as const, mode: "lines" as const,
        name: `Δf = ${df} µm`, line: { color: colors[i] },
      };
    });
  }, [na, wavelength]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Modulation Transfer Function" description="Diffraction-limited incoherent MTF with defocus effects.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Numerical Aperture (NA)</label>
            <input type="number" step={0.01} min={0.01} max={1.8} value={na} onChange={e => setNa(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} min={200} max={2000} value={wavelength} onChange={e => setWavelength(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Defocus (µm)</label>
            <input type="number" step={0.1} min={0} max={50} value={defocus} onChange={e => setDefocus(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Cutoff frequency</span>
            <span className="font-mono text-blue-400">{mtfCurve.fc.toFixed(1)} lp/µm</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
            <span className="text-gray-400">Cutoff (lp/mm)</span>
            <span className="font-mono text-green-400">{(mtfCurve.fc * 1000).toFixed(0)} lp/mm</span>
          </div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>f_c = 2·NA / λ</p>
            <p>MTF(f) = (2/π)[arccos(f/f_c) − (f/f_c)√(1−(f/f_c)²)]</p>
            <p>Defocus: Gaussian attenuation model</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">MTF vs Spatial Frequency (multiple defocus values)</h2>
        <ChartPanel data={plotData}
          layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#ccc" },
            xaxis: { title: "Spatial Frequency (lp/µm)", gridcolor: "#333", range: [0, undefined] },
            yaxis: { title: "MTF", gridcolor: "#333", range: [0, 1.05] },
            legend: { font: { size: 10 } },
            margin: { l: 60, r: 20, t: 20, b: 50 },
          }}
         
         
        />
      </div>
    </CalculatorShell>
  );
}
