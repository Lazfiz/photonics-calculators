"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function DualCombSpectroscopyPage() {
  const [repRate1, setRepRate1] = useURLState("repRate1", 100); // MHz
  const [repRate2, setRepRate2] = useURLState("repRate2", 100.001); // MHz
  const [ceoFreq1, setCeoFreq1] = useURLState("ceoFreq1", 20); // MHz
  const [ceoFreq2, setCeoFreq2] = useURLState("ceoFreq2", 20.1); // MHz
  const [centerWavelength, setCenterWavelength] = useURLState("centerWavelength", 1550); // nm
  const [numModes, setNumModes] = useURLState("numModes", 200000);

  const c = 3e8;
  const frep1Hz = repRate1 * 1e6;
  const frep2Hz = repRate2 * 1e6;
  const deltaFrep = Math.abs(frep2Hz - frep1Hz);
  const deltaFceo = Math.abs(ceoFreq2 - ceoFreq1) * 1e6; // Hz
  const centerFreq = c / (centerWavelength * 1e-9);

  // Optical bandwidth: (N-1) * f_rep per comb
  const opticalBW1 = (numModes - 1) * frep1Hz;
  const opticalBW2 = (numModes - 1) * frep2Hz;
  const opticalBW = (opticalBW1 + opticalBW2) / 2; // average for display
  const opticalBWnm = (centerWavelength ** 2 * opticalBW) / (c * 1e9);
  const updateTime = deltaFrep > 0 ? 1 / deltaFrep : Infinity;
  const resolutionHz = frep1Hz; // Optical resolution = comb tooth spacing (f_rep)
  const resolutionNm = (centerWavelength ** 2 * resolutionHz) / (c * 1e9);

  const chartData = useMemo(() => {
    const step = Math.max(1, Math.floor(numModes / 500));
    const count = Math.floor(numModes / step);
    // Comb modes: f_n = n * f_rep + f_CEO (exact comb equation)
    const nMin1 = Math.round((centerFreq - opticalBW1 / 2 - ceoFreq1 * 1e6) / frep1Hz);
    const nMin2 = Math.round((centerFreq - opticalBW2 / 2 - ceoFreq2 * 1e6) / frep2Hz);
    const modes1 = Array.from({ length: count }, (_, i) => (nMin1 + i * step) * frep1Hz + ceoFreq1 * 1e6);
    const modes2 = Array.from({ length: count }, (_, i) => (nMin2 + i * step) * frep2Hz + ceoFreq2 * 1e6);
    return [
      { x: modes1.map(f => (f - centerFreq) / 1e12), y: modes1.map(() => 1), type: "scatter", mode: "lines",
        name: `Comb 1 (${repRate1} MHz)`, line: { color: "#34d399", width: 1 } },
      { x: modes2.map(f => (f - centerFreq) / 1e12), y: modes2.map(() => 0.8), type: "scatter", mode: "lines",
        name: `Comb 2 (${repRate2} MHz)`, line: { color: "#f87171", width: 1 } },
    ];
  }, [repRate1, repRate2, numModes, centerFreq, opticalBW1, opticalBW2, ceoFreq1, ceoFreq2]);

  const rfData = useMemo(() => {
    if (deltaFrep === 0) return [];
    // Multi-heterodyne RF beat notes: f_RF,n = |Δf_CEO + n·Δf_rep|
    // These fold into the detection band [0, f_rep/2]
    const maxN = Math.min(numModes, Math.floor(frep1Hz / (2 * deltaFrep)));
    const rfBeats = Array.from({ length: maxN }, (_, i) => Math.abs(deltaFceo + i * deltaFrep));
    // Fold into Nyquist band
    const foldedBeats = rfBeats.map(f => {
      const nyq = frep1Hz / 2;
      const folded = f % nyq;
      return folded > nyq / 2 ? nyq - folded : folded;
    });
    // Build histogram-style plot
    const maxRf = frep1Hz / 2;
    const bins = 500;
    const rfBins = Array.from({ length: bins }, (_, i) => i * maxRf / bins);
    const rfIntensity = rfBins.map((_, i) => {
      const f = (i + 0.5) * maxRf / bins;
      return foldedBeats.reduce((sum, fb) => sum + Math.exp(-((f - fb) ** 2) / (deltaFrep * 0.3) ** 2), 0);
    });
    const maxI = Math.max(...rfIntensity, 1);
    return [
      { x: rfBins.map(f => f / 1e6), y: rfIntensity.map(v => v / maxI), type: "scatter", mode: "lines",
        name: "RF Multi-Heterodyne", line: { color: "#a78bfa", width: 2 }, fill: "tozeroy", fillcolor: "rgba(167,139,250,0.1)" },
    ];
  }, [deltaFrep, deltaFceo, frep1Hz, numModes]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Dual-Comb Spectroscopy Calculator" description="Model dual-comb spectroscopy parameters: resolution, bandwidth, update rate, and multi-heterodyne RF spectrum.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Comb 1 Rep Rate (MHz)" value={repRate1} onChange={setRepRate1} min={10} step="0.1" />
        <ValidatedNumberInput label="Comb 2 Rep Rate (MHz)" value={repRate2} onChange={setRepRate2} min={10} step="0.0001" />
        <ValidatedNumberInput label="Center Wavelength (nm)" value={centerWavelength} onChange={setCenterWavelength} min={400} />
        <ValidatedNumberInput label="Number of Comb Modes" value={numModes} onChange={setNumModes} min={1000} step="10000" />
        <ValidatedNumberInput label="f_CEO Comb 1 (MHz)" value={ceoFreq1} onChange={setCeoFreq1} min={0} step="0.1" />
        <ValidatedNumberInput label="f_CEO Comb 2 (MHz)" value={ceoFreq2} onChange={setCeoFreq2} min={0} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δf_rep (RF spacing)</p>
          <p className="text-xl font-bold text-green-400">{deltaFrep > 0 ? deltaFrep.toFixed(0) + " Hz" : "N/A (identical)"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Update Time</p>
          <p className="text-xl font-bold text-blue-400">{isFinite(updateTime) ? (updateTime * 1e6).toFixed(1) + " μs" : "N/A"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Bandwidth</p>
          <p className="text-xl font-bold text-yellow-400">{opticalBWnm.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Resolution (nm)</p>
          <p className="text-xl font-bold text-red-400">{resolutionNm.toExponential(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>fₙ = f_CEO + n · f_rep — comb mode frequencies</p>
        <p>Spectral resolution = f_rep (comb tooth spacing)</p>
        <p>Update time = 1/Δf_rep (one full interferogram period)</p>
        <p>Optical BW ≈ N_modes × f_rep → maps to RF domain 0 to f_rep</p>
        <p className="text-gray-500">Multi-heterodyne: each optical comb pair maps to a unique RF beat note</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "Optical Comb Teeth", font: { size: 13 } },
          xaxis: { title: "Relative Frequency (THz)", gridcolor: "#374151" },
          yaxis: { title: "Amplitude", gridcolor: "#374151", range: [0, 1.2] },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />
        <ChartPanel data={rfData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "RF Multi-Heterodyne Spectrum", font: { size: 13 } },
          xaxis: { title: "RF Frequency (MHz)", gridcolor: "#374151" },
          yaxis: { title: "Intensity", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
        }} />
      </div>
    </CalculatorShell>
  );
}
