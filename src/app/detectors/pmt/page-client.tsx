"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
// PMT: Photomultiplier Tube
// Gain = δ^n where δ = secondary emission ratio, n = number of dynodes
// SNR = signal_electrons / sqrt((signal_electrons + dark_electrons) * ENF)
export default function PMTPage() {
  const [numDynodes, setNumDynodes] = useURLState("numDynodes", 10);
  const [secondaryEmission, setSecondaryEmission] = useURLState("secondaryEmission", 3.5);
  const [qe, setQe] = useURLState("qe", 0.25);
  const [darkCurrent, setDarkCurrent] = useURLState("darkCurrent", 1); // nA
  const [photonRate, setPhotonRate] = useURLState("photonRate", 1e6); // photons/s
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 100); // MHz

  const gain = Math.pow(secondaryEmission, numDynodes);
  const signalElectrons = photonRate * qe;
  const signalCurrent = signalElectrons * 1.602e-19 * gain;
  const darkElectrons = (darkCurrent * 1e-9) / (1.602e-19 * gain);

  // Gain vs dynode stages for different δ
  const gainVsDynodes = useMemo(() => {
    const stages = Array.from({ length: 16 }, (_, i) => i + 1);
    const deltas = [2.5, 3.0, 3.5, 4.0, 4.5];
    return stages.map(s => {
      const vals = deltas.map(d => ({ d, g: Math.pow(d, s) }));
      return { stage: s, vals };
    });
  }, []);

  // SNR vs gain (varying secondary emission)
  const snrVsGain = useMemo(() => {
    const deltas = Array.from({ length: 100 }, (_, i) => 2 + i * 0.03);
    const snrVals = deltas.map(d => {
      const g = Math.pow(d, numDynodes);
      const sig = photonRate * qe;
      const darkE = (darkCurrent * 1e-9) / (1.602e-19 * g);
      const enf = d / (d - 1); // exact ENF for identical dynodes with Poisson statistics
      // SNR with noise bandwidth: rates / sqrt(2*BW*(rate_sum)*ENF)
      // Note: PMT gain cancels from SNR (amplifies signal and noise equally)
      const bwHz = bandwidth * 1e6;
      return sig / Math.sqrt(2 * bwHz * (sig + darkE) * enf);
    });
    return { deltas, snrVals };
  }, [numDynodes, qe, darkCurrent, photonRate, bandwidth]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Number of Dynodes" value={numDynodes} onChange={setNumDynodes} min={4} max={14} step="1" />
        <ValidatedNumberInput label="Secondary Emission Ratio (δ)" value={secondaryEmission} onChange={setSecondaryEmission} min={1.5} max={6} step="0.1" />
        <ValidatedNumberInput label="Quantum Efficiency" value={qe} onChange={setQe} min={0.01} max={0.5} step="0.01" />
        <ValidatedNumberInput label="Dark Current (nA)" value={darkCurrent} onChange={setDarkCurrent} min={0.01} step="0.1" />
        <ValidatedNumberInput label="Photon Rate (photons/s)" value={photonRate} onChange={setPhotonRate} step="1e5" />
        <ValidatedNumberInput label="Bandwidth (MHz)" value={bandwidth} onChange={setBandwidth} min={1} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Gain (δⁿ)" value={gain.toExponential(2)} tone="blue" />
        <ResultCard label="Signal Current" value={`${(signalCurrent * 1e6).toFixed(2)} μA`} tone="green" />
        <ResultCard label="Photoelectrons/s" value={signalElectrons.toExponential(2)} tone="yellow" />
        <ResultCard label="ENF" value={(secondaryEmission / (secondaryEmission - 1)).toFixed(3)} tone="purple" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>Gain G = δ<sup>n</sup></p>
        <p>I<sub>signal</sub> = R<sub>ph</sub> · QE · e · G</p>
        <p>ENF = δ / (δ−1) (excess noise factor)</p>
        <p>SNR = R<sub>pe</sub> / √(2·BW·(R<sub>pe</sub> + R<sub>dark</sub>)·ENF)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={[2.5, 3.0, 3.5, 4.0, 4.5].map((d, i) => ({
          x: Array.from({ length: 16 }, (_, j) => j + 1),
          y: Array.from({ length: 16 }, (_, j) => Math.pow(d, j + 1)),
          type: "scatter" as const, mode: "lines" as const,
          name: `δ=${d}`,
          line: { color: ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"][i] },
        }))} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Gain vs Dynode Stages", font: { size: 12 } },
          xaxis: { title: "Dynode Stages", gridcolor: "#374151" },
          yaxis: { title: "Gain", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />

        <ChartPanel data={[{ x: snrVsGain.deltas, y: snrVsGain.snrVals, type: "scatter" as const, mode: "lines" as const,
          name: "SNR", line: { color: "#34d399" } }]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "SNR vs Secondary Emission Ratio", font: { size: 12 } },
          xaxis: { title: "δ (secondary emission)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent", font: { size: 10 } },
        }} />
      </div>
    </div>
  );
}
