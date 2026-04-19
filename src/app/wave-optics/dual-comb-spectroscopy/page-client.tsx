"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function DualCombSpectroscopyPage() {
  const [repRate1, setRepRate1] = useURLState("repRate1", 250); // MHz
  const [repRate2, setRepRate2] = useURLState("repRate2", 250.001); // MHz
  const [centerWavelength, setCenterWavelength] = useURLState("centerWavelength", 1550); // nm

  const fCenter = 299792.458 / centerWavelength; // THz (c in nm·THz)
  const deltaFRep = Math.abs(repRate1 - repRate2) * 1e3; // kHz → MHz
  const deltaFRepMHz = Math.abs(repRate1 - repRate2); // MHz

  // Optical combs: f_n = n × f_rep (simplified, CEO=0)
  // For display, show a few comb teeth around center frequency
  const chartData = useMemo(() => {
    const N = 500;
    // Show ~10 THz bandwidth around center
    const fMin = fCenter - 5;
    const fMax = fCenter + 5;
    const f = Array.from({ length: N }, (_, i) => fMin + (fMax - fMin) * i / (N - 1));

    // Comb teeth as delta-like peaks (Gaussian-broadened for visibility)
    const teethWidth = 0.0005; // THz — broadening for visibility
    const comb1 = f.map(fi => {
      // Find nearest comb tooth: n = round(fi / f_rep_THz)
      const n = Math.round(fi * 1e3 / repRate1); // fi in THz, repRate in MHz → fi*1e3/repRate
      const fTooth = n * repRate1 / 1e3; // back to THz
      return Math.exp(-((fi - fTooth) ** 2) / (2 * teethWidth ** 2));
    });
    const comb2 = f.map(fi => {
      const n = Math.round(fi * 1e3 / repRate2);
      const fTooth = n * repRate2 / 1e3;
      return Math.exp(-((fi - fTooth) ** 2) / (2 * teethWidth ** 2));
    });

    return [
      { x: f, y: comb1, type: "scatter" as const, mode: "lines" as const, name: "Comb 1", line: { color: "#60a5fa" } },
      { x: f, y: comb2, type: "scatter" as const, mode: "lines" as const, name: "Comb 2", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [repRate1, repRate2, centerWavelength, fCenter]);

  // RF beat note spectrum: down-converted to RF domain
  // Beat notes at f_RF = n × Δf_rep (MHz)
  const beatData = useMemo(() => {
    const N = 200;
    const fRepAvg = (repRate1 + repRate2) / 2;
    const numTeeth = Math.round(10e3 / fRepAvg); // ~10 THz bandwidth / f_rep
    const fRfMax = Math.min(numTeeth * deltaFRepMHz, 1000); // MHz, cap at 1 GHz
    const fRf = Array.from({ length: N }, (_, i) => (fRfMax * i) / (N - 1));
    // Each RF beat note has amplitude ~1 (ideal)
    const beat = fRf.map(frf => {
      const n = Math.round(frf / deltaFRepMHz);
      const fExact = n * deltaFRepMHz;
      if (n <= 0 || n > numTeeth) return 0;
      // Gaussian-broadened teeth
      const width = deltaFRepMHz * 0.3;
      return Math.exp(-((frf - fExact) ** 2) / (2 * width ** 2));
    });
    return [
      { x: fRf, y: beat, type: "scatter" as const, mode: "lines" as const, name: "RF Beat Notes", line: { color: "#34d399", width: 2 } },
    ];
  }, [repRate1, repRate2]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Dual-Comb Spectroscopy" description="High-resolution spectroscopy using two frequency combs with slightly different repetition rates.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Rep Rate 1 (MHz)" value={repRate1} onChange={setRepRate1} step="0.001" />
        <ValidatedNumberInput label="Rep Rate 2 (MHz)" value={repRate2} onChange={setRepRate2} step="0.001" />
        <ValidatedNumberInput label="Center λ (nm)" value={centerWavelength} onChange={setCenterWavelength} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 grid gap-2 sm:grid-cols-3">
        <p className="text-gray-300">Δf_rep: <span className="text-blue-400 font-mono">{deltaFRep.toFixed(1)} kHz</span></p>
        <p className="text-gray-300">f_center: <span className="text-green-400 font-mono">{fCenter.toFixed(1)} THz</span></p>
        <p className="text-gray-300">Update rate: <span className="text-orange-400 font-mono">{deltaFRep.toFixed(1)} kHz</span></p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">
          f<sub>n</sub> = n · f<sub>rep</sub> &nbsp;|&nbsp; f<sub>RF,n</sub> = n · Δf<sub>rep</sub> &nbsp;|&nbsp; Δf<sub>rep</sub> = |f<sub>rep1</sub> − f<sub>rep2</sub>|
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm text-gray-400 mb-2">Optical Comb Spectrum</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Frequency (THz)", gridcolor: "#374151" },
          yaxis: { title: "Amplitude (a.u.)", gridcolor: "#374151" },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true, legend: { x: 0.01, y: 0.99 }
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">RF Beat Note Spectrum (down-converted)</h3>
        <ChartPanel data={beatData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "RF Frequency (MHz)", gridcolor: "#374151" },
          yaxis: { title: "Amplitude (a.u.)", gridcolor: "#374151" },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
        }} />
      </div>
    </CalculatorShell>
  );
}
