"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function StructuredIlluminationPage() {
  const [na, setNa] = useURLState("na", 1.4);
  const [wavelength, setWavelength] = useURLState("wavelength", 488);
  const [modulationDepth, setModulationDepth] = useURLState("modulationDepth", 0.8);
  const [patternOrders, setPatternOrders] = useURLState("patternOrders", 2);

  const results = useMemo(() => {
    const lambda_um = wavelength * 1e-3;
    const res_widefield = 0.61 * lambda_um / na;
    const res_sim = res_widefield / patternOrders;
    const cutoff = (2 * na) / lambda_um;
    const expandedCutoff = cutoff * patternOrders;
    const nPhases = 2 * patternOrders - 1; // 3 for 2× SIM, 5 for 3× NL-SIM
    const nImages = 3 * nPhases; // 3 angles × nPhases
    const snrPenalty = Math.sqrt(nImages) / modulationDepth;

    const freqs: number[] = [];
    const otfWide: number[] = [];
    const otfSIM: number[] = [];
    for (let f = 0; f <= expandedCutoff; f += cutoff / 200) {
      freqs.push(f);
      const fn = Math.min(f / cutoff, 1);
      const wide = fn >= 1 ? 0 : (2 / Math.PI) * (Math.acos(fn) - fn * Math.sqrt(1 - fn * fn));
      otfWide.push(wide);
      const simFn = Math.min(f / (cutoff * patternOrders), 1);
      const sim = simFn >= 1 ? 0 : (2 / Math.PI) * (Math.acos(simFn) - simFn * Math.sqrt(1 - simFn * simFn));
      otfSIM.push(sim);
    }

    return { res_widefield, res_sim, cutoff, expandedCutoff, snrPenalty, nImages, freqs, otfWide, otfSIM };
  }, [na, wavelength, modulationDepth, patternOrders]);

  const plotData = useMemo(() => [
    {
      x: results.freqs, y: results.otfWide, type: "scatter" as const, mode: "lines" as const,
      name: "Widefield OTF", line: { color: "#f87171", width: 2 },
    },
    {
      x: results.freqs, y: results.otfSIM, type: "scatter" as const, mode: "lines" as const,
      name: "SIM OTF (expanded)", line: { color: "#60a5fa", width: 2 },
    },
  ], [results]);

  const darkLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d1d5db" }, xaxis: { title: "Spatial Frequency (lp/µm)", gridcolor: "#374151" },
    yaxis: { title: "OTF Magnitude", gridcolor: "#374151", range: [-0.05, 1.05] },
    legend: { x: 0.6, y: 0.95 }, margin: { t: 30, r: 30, b: 50, l: 60 },
  };

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Structured Illumination Microscopy" description="SIM resolution enhancement and OTF expansion via patterned illumination.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Numerical Aperture (NA)</label>
            <ValidatedNumberInput label="Numerical Aperture (NA)" value={na} onChange={setNa} min={0.1} max={1.8} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={2000} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pattern Modulation Depth</label>
            <ValidatedNumberInput label="Pattern Modulation Depth" value={modulationDepth} onChange={setModulationDepth} min={0.1} max={1} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Resolution Factor (2=linear, 3=nonlinear)</label>
            <ValidatedNumberInput label="Resolution Factor" value={patternOrders} onChange={setPatternOrders} min={2} max={5} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Widefield Resolution</div>
              <div className="text-xl font-mono text-red-400">{(results.res_widefield * 1000).toFixed(1)} nm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">SIM Resolution</div>
              <div className="text-xl font-mono text-blue-400">{(results.res_sim * 1000).toFixed(1)} nm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Cutoff Frequency</div>
              <div className="text-xl font-mono text-gray-300">{results.cutoff.toFixed(1)} lp/µm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">SNR Penalty (√N/m)</div>
              <div className="text-xl font-mono text-yellow-400">{results.snrPenalty.toFixed(2)}×</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Raw Images</div>
              <div className="text-xl font-mono text-gray-300">{results.nImages}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <ChartPanel data={plotData} layout={darkLayout} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>r_widefield = 0.61 λ / NA</p>
          <p>r_SIM = 0.61λ / (NA × N) (N = resolution factor)</p>
          <p>SNR penalty = √(N_images) / m  (3 angles × (2N−1) phases)</p>
          <p>Expanded OTF cutoff = N × (2·NA/λ)</p>
        </div>
        <div className="text-sm text-gray-400 mt-4 space-y-1">
          <p>Structured illumination doubles the effective resolution by shifting high-frequency information into the passband of the microscope OTF. Multiple pattern orientations (typically 3 angles × 3 phases = 9 images) are required to fill the expanded frequency support.</p>
          <p>The SNR penalty arises because information is redistributed across multiple frequency components; weakly modulated structures require more raw photon budget.</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
