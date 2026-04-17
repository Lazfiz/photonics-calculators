"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function AdaptiveOpticsPage() {
  const [numZernike, setNumZernike] = useURLState("numZernike", 15);
  const [rmsWavefront, setRmsWavefront] = useURLState("rmsWavefront", 0.5); // waves
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [dmStroke, setDmStroke] = useURLState("dmStroke", 5); // µm
  const [dmActuators, setDmActuators] = useURLState("dmActuators", 32);

  const results = useMemo(() => {
    const strehlBefore = Math.exp(-((2 * Math.PI * rmsWavefront) ** 2));
    const correctedRms = rmsWavefront * Math.sqrt(1 - numZernike / (numZernike + 4));
    const strehlAfter = Math.exp(-((2 * Math.PI * correctedRms) ** 2));
    const correctionFactor = (rmsWavefront - correctedRms) / rmsWavefront * 100;
    // Fitting error: Kolmogorov turbulence gives σ²_fit ∝ (d/r0)^(5/3).
    // For N actuators across aperture, d = D/N, so σ_fit ∝ N^(-5/6).
    // Hardy (1998), Noll (1976).
    const fittingError = 0.3 * rmsWavefront * Math.pow(dmActuators, -5 / 6);
    const residualRms = Math.sqrt(correctedRms ** 2 + fittingError ** 2);
    const strehlWithFitting = Math.exp(-((2 * Math.PI * residualRms) ** 2));
    const phaseWrap = (2 * dmStroke * 1e3) / wavelength; // waves correctable (2×stroke in nm / λ)
    return { strehlBefore, strehlAfter, correctedRms, correctionFactor, fittingError, residualRms, strehlWithFitting, phaseWrap };
  }, [numZernike, rmsWavefront, wavelength, dmStroke, dmActuators]);

  const plotData = useMemo(() => {
    const modes = [];
    const strehls = [];
    const corrected = [];
    for (let z = 1; z <= 65; z++) {
      modes.push(z);
      const sBefore = Math.exp(-((2 * Math.PI * rmsWavefront) ** 2));
      const cRms = rmsWavefront * Math.sqrt(1 - z / (z + 4));
      strehls.push(Math.exp(-((2 * Math.PI * cRms) ** 2)));
      corrected.push(cRms);
    }
    return [
      { x: modes, y: strehls, name: "Strehl ratio", line: { color: "#60a5fa" }, type: "scatter", mode: "lines", yaxis: "y" },
      { x: modes, y: corrected, name: "Residual RMS (waves)", line: { color: "#f87171" }, type: "scatter", mode: "lines", yaxis: "y2" },
    ];
  }, [rmsWavefront]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Adaptive Optics Calculator" description="AO correction performance, Strehl ratio, and deformable mirror requirements.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Number of Zernike modes corrected</label>
            <ValidatedNumberInput label="Number of Zernike modes corrected" value={numZernike} onChange={setNumZernike} min={1} max={65} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Input RMS wavefront error (waves)</label>
            <ValidatedNumberInput label="Input RMS wavefront error (waves)" value={rmsWavefront} onChange={setRmsWavefront} min={0.01} max={5} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">DM actuators (across)</label>
            <ValidatedNumberInput label="DM actuators (across)" value={dmActuators} onChange={setDmActuators} min={4} max={128} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">DM stroke (µm)</label>
            <ValidatedNumberInput label="DM stroke (µm)" value={dmStroke} onChange={setDmStroke} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Strehl (uncorrected)</span><span className="font-mono text-red-400">{results.strehlBefore.toFixed(4)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Strehl (mode correction)</span><span className="font-mono text-green-400">{results.strehlAfter.toFixed(4)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Residual RMS (modes)</span><span className="font-mono">{results.correctedRms.toFixed(3)} λ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Fitting error</span><span className="font-mono text-yellow-400">{results.fittingError.toFixed(3)} λ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Strehl (with fitting)</span><span className="font-mono text-blue-400">{results.strehlWithFitting.toFixed(4)}</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Correction efficiency</span><span className="font-mono text-purple-400">{results.correctionFactor.toFixed(1)}%</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Phase wrap limit</span><span className="font-mono">{results.phaseWrap.toFixed(2)} λ</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>Strehl: S = exp(-(2π·σ)²)</p>
            <p>Corrected σ = σ₀·√(1 - N/(N+4))</p>
            <p>Fitting error ≈ 0.3·σ₀·N_act^(-5/6)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Strehl Ratio &amp; Residual RMS vs Zernike Modes</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Zernike modes corrected", gridcolor: "#333" },
          yaxis: { title: "Strehl ratio", gridcolor: "#333", range: [0, 1] },
          yaxis2: { title: "Residual RMS (λ)", gridcolor: "#333", overlaying: "y", side: "right" },
          legend: { font: { size: 11 } }, margin: { l: 60, r: 60, t: 20, b: 60 }
        }} />
      </div>
    </CalculatorShell>
  );
}
