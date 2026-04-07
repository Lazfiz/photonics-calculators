"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
export default function AdaptiveOpticsMicroscopyPage() {
  const [na, setNa] = useURLState("na", 1.4);
  const [wavelength, setWavelength] = useURLState("wavelength", 800);
  const [numModes, setNumModes] = useURLState("numModes", 15);
  const [rmsWavefrontError, setRmsWavefrontError] = useURLState("rmsWavefrontError", 0.5);
  const [correctionEfficiency, setCorrectionEfficiency] = useURLState("correctionEfficiency", 0.85);
  const [tissueScattering, setTissueScattering] = useURLState("tissueScattering", 0.3);

  const results = useMemo(() => {
    const lambda_um = wavelength * 1e-3;
    const resDiffraction = 0.61 * lambda_um / na;
    const strehlUncorrected = Math.exp(-Math.pow(2 * Math.PI * rmsWavefrontError / lambda_um, 2));
    const rmsAfter = rmsWavefrontError * (1 - correctionEfficiency);
    const strehlCorrected = Math.exp(-Math.pow(2 * Math.PI * rmsAfter / lambda_um, 2));
    const resAO = resDiffraction / Math.sqrt(strehlCorrected);
    const maréchalLimit = lambda_um / 14;
    const modesCorrected = Math.round(numModes * correctionEfficiency);

    const modes: number[] = [];
    const strehls: number[] = [];
    for (let n = 0; n <= 65; n += 1) {
      modes.push(n);
      const corrected = rmsWavefrontError * Math.max(0, 1 - n / numModes);
      strehls.push(Math.exp(-Math.pow(2 * Math.PI * corrected / lambda_um, 2)));
    }

    return { resDiffraction, strehlUncorrected, rmsAfter, strehlCorrected, resAO, maréchalLimit, modesCorrected, modes, strehls };
  }, [na, wavelength, numModes, rmsWavefrontError, correctionEfficiency, tissueScattering]);

  const plotData = useMemo(() => [
    {
      x: results.modes, y: results.strehls,
      type: "scatter" as const, mode: "lines" as const,
      name: "Strehl ratio", line: { color: "#60a5fa", width: 2 },
    },
    {
      x: [results.modesCorrected], y: [results.strehlCorrected],
      type: "scatter" as const, mode: "markers" as const,
      name: "Current config", marker: { color: "#f87171", size: 10 },
    },
  ], [results]);

  const darkLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#d1d5db" }, xaxis: { title: "Zernike Modes Corrected", gridcolor: "#374151" },
    yaxis: { title: "Strehl Ratio", gridcolor: "#374151", range: [0, 1.05] },
    legend: { x: 0.02, y: 0.95 }, margin: { t: 30, r: 30, b: 50, l: 60 },
  };

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Adaptive Optics in Microscopy" description="Wavefront correction, Strehl ratio recovery, and resolution improvement for deep-tissue imaging.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Numerical Aperture (NA)</label>
            <input type="number" step={0.01} min={0.1} max={1.8} value={na} onChange={e => setNa(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} min={200} max={2000} value={wavelength} onChange={e => setWavelength(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Total Zernike Modes</label>
            <input type="number" step={1} min={1} max={65} value={numModes} onChange={e => setNumModes(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">RMS Wavefront Error (µm)</label>
            <input type="number" step={0.05} min={0.01} max={5} value={rmsWavefrontError} onChange={e => setRmsWavefrontError(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Correction Efficiency</label>
            <input type="number" step={0.05} min={0} max={1} value={correctionEfficiency} onChange={e => setCorrectionEfficiency(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tissue Scattering (µm⁻¹)</label>
            <input type="number" step={0.05} min={0} max={5} value={tissueScattering} onChange={e => setTissueScattering(+e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-lg">Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Diffraction-Limited Res.</div>
              <div className="text-xl font-mono text-blue-400">{(results.resDiffraction * 1000).toFixed(1)} nm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">AO-Corrected Res.</div>
              <div className="text-xl font-mono text-green-400">{(results.resAO * 1000).toFixed(1)} nm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Strehl (uncorrected)</div>
              <div className="text-xl font-mono text-red-400">{results.strehlUncorrected.toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Strehl (corrected)</div>
              <div className="text-xl font-mono text-green-400">{results.strehlCorrected.toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">RMS After Correction</div>
              <div className="text-xl font-mono text-yellow-400">{results.rmsAfter.toFixed(4)} µm</div>
            </div>
            <div className="bg-gray-800 rounded p-3">
              <div className="text-xs text-gray-400">Modes Corrected</div>
              <div className="text-xl font-mono text-purple-400">{results.modesCorrected}</div>
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
          <p>S = exp(-(2π·W_rms/λ)²)</p>
          <p>r_diffraction = 0.61 λ / NA</p>
          <p>r_AO ≈ r_diff / √S (for S &lt; 1)</p>
          <p>W_rms(after) = W_rms · (1 - η)</p>
          <p>Maréchal criterion: W_rms &lt; λ/14 → S &gt; 0.8</p>
        </div>
        <div className="text-sm text-gray-400 mt-4 space-y-1">
          <p>Adaptive optics compensates sample-induced aberrations that degrade resolution and signal in deep-tissue microscopy. Deformable mirrors or spatial light modulators correct the wavefront in real-time.</p>
          <p>The number of Zernike modes required depends on the aberration complexity: shallow tissue needs few modes, while deep or heterogeneous samples may need 50+ modes. Guide stars (fluorescent beads, multiphoton-excited fluorescence) enable wavefront sensing within the sample.</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
