"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";
import { useURLState } from "../../../hooks/use-url-state";
export default function PRFCorrectionPage() {
  const [singlePulseMPE, setSinglePulseMPE] = useURLState("singlePulseMPE", 1); // µJ/cm²
  const [prf, setPrf] = useURLState("prf", 1000); // Hz
  const [exposureDuration, setExposureDuration] = useURLState("exposureDuration", 10); // s

  // For repetitive pulses, MPE is reduced by correction factor Cₚ
  // Cₚ = N^(-0.25) for N pulses in the exposure window
  // where N = PRF × T (number of pulses during exposure)
  // MPE_repetitive = MPE_single × Cₚ
  // Note: Cₚ only applies when N > 1 and PRF > 1 Hz (thermal regime)
  // For very high PRF, treated as CW

  const results = useMemo(() => {
    const N = prf * exposureDuration;
    const Cp = Math.pow(N, -0.25);
    const mpeRep = singlePulseMPE * Cp;

    // Also check average power MPE (CW equivalent)
    // MPE_avg = MPE_single_pulse_for_T / T
    // Single pulse MPE for T seconds: MPE_T = MPE_base × (T/t_pulse)^(-0.25) simplified
    const mpeRep_uJ = mpeRep;
    const reduction_dB = -10 * Math.log10(Cp);

    // Threshold PRF where correction becomes significant (Cp < 0.5)
    // N = (1/Cp)^4, so N = 16 for Cp=0.5
    const thresholdN = 16;

    return {
      N, Cp, mpeRep_uJ, reduction_dB, thresholdN,
      isCWLike: prf >= 10000, // treated as CW above ~10 kHz
    };
  }, [singlePulseMPE, prf, exposureDuration]);

  const chartData = useMemo(() => {
    const prfs = Array.from({ length: 200 }, (_, i) => 1 + i * 500);
    const cpVals = prfs.map(f => Math.pow(f * exposureDuration, -0.25));
    const mpeVals = prfs.map(f => singlePulseMPE * Math.pow(f * exposureDuration, -0.25));

    return [
      { x: prfs, y: cpVals, type: "scatter" as const, mode: "lines" as const, name: "Cₚ (correction factor)", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: prfs, y: mpeVals, type: "scatter" as const, mode: "lines" as const, name: "MPE (µJ/cm²)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [singlePulseMPE, exposureDuration]);

  const layout = {
    paper_bgcolor: "#030712",
    plot_bgcolor: "#030712",
    font: { color: "#9ca3af" },
    xaxis: { title: "PRF (Hz)", gridcolor: "#1f2937", color: "#9ca3af", type: "log" as const },
    yaxis: { title: "Correction Factor Cₚ", gridcolor: "#1f2937", color: "#60a5fa", range: [0, 1.1] },
    yaxis2: { title: "MPE (µJ/cm²)", gridcolor: "#1f2937", color: "#f87171", overlaying: "y" as const, side: "right" as const },
    margin: { t: 30, b: 50, l: 60, r: 60 },
    legend: { font: { color: "#d1d5db" } },
  };

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="PRF Correction Factor" description="Calculates the repetitive-pulse correction factor Cp for pulsed laser MPE per ANSI Z136.1 §8.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Single Pulse MPE (µJ/cm²)</label>
          <input type="number" step="0.1" value={singlePulseMPE} onChange={e => setSinglePulseMPE(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Pulse Repetition Rate (Hz)</label>
          <input type="number" value={prf} onChange={e => setPrf(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Exposure Duration (s)</label>
          <input type="number" step="1" value={exposureDuration} onChange={e => setExposureDuration(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Total Pulses (N)</div>
          <div className="text-2xl font-bold text-yellow-400">{results.N.toExponential(2)}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">C<sub>p</sub></div>
          <div className="text-2xl font-bold text-blue-400">{results.Cp.toFixed(4)}</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Corrected MPE</div>
          <div className="text-2xl font-bold text-green-400">{results.mpeRep_uJ.toExponential(2)}</div>
          <div className="text-xs text-gray-500">µJ/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Reduction</div>
          <div className="text-2xl font-bold text-red-400">{results.reduction_dB.toFixed(1)} dB</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <p className="text-gray-500 mb-1">Key Formulas:</p>
        <p>N = PRF × T (total pulses in exposure window T)</p>
        <p>C<sub>p</sub> = N<sup>-1/4</sup> = (PRF × T)<sup>-0.25</sup></p>
        <p>MPE<sub>repetitive</sub> = MPE<sub>single</sub> × C<sub>p</sub></p>
        <p className="text-yellow-400 mt-2">⚠ When C<sub>p</sub> &lt; C<sub>p</sub>(single pulse), use the single-pulse MPE instead</p>
      </div>

      <ChartPanel data={chartData} layout={layout} className="w-full h-[400px]" />
    </CalculatorShell>
  );
}
