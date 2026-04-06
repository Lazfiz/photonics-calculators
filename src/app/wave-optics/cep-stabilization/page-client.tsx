"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function CEPStabilizationPage() {
  const [wavelength, setWavelength] = useState(800);
  const [pulseDuration, setPulseDuration] = useState(5); // fs
  const [cepOffset, setCepOffset] = useState(0); // rad
  const [cycles, setCycles] = useState(2);

  const period = wavelength * 1e-9 / 3e8 * 1e15; // fs
  const carrierFreq = 1 / period; // PHz
  const spectralWidth = 0.44 / pulseDuration; // THz (Gaussian TL)
  const phaseSlipPerCycle = 2 * Math.PI;

  const chartData = useMemo(() => {
    const N = 500;
    const tMax = cycles * period;
    const ts = Array.from({ length: N }, (_, i) => i / N * tMax - tMax * 0.1);
    const envelope = ts.map(t => {
      const env = Math.exp(-2.77 * Math.pow(t / pulseDuration, 2));
      return env;
    });
    const carrier = ts.map(t => envelope[ts.indexOf(t)] * Math.cos(2 * Math.PI * carrierFreq * t * 1e-3 + cepOffset));
    // recalc properly
    const carrier2 = ts.map((t, i) => envelope[i] * Math.cos(2 * Math.PI * t / period + cepOffset));
    const envUpper = envelope;
    const envLower = envelope.map(e => -e);
    return [
      { x: ts, y: carrier2, type: "scatter" as const, mode: "lines" as const, name: "E-field", line: { color: "#60a5fa", width: 1.5 } },
      { x: ts, y: envUpper, type: "scatter" as const, mode: "lines" as const, name: "Envelope", line: { color: "#f87171", dash: "dash" } },
      { x: ts, y: envLower, type: "scatter" as const, mode: "lines" as const, name: "", line: { color: "#f87171", dash: "dash" }, showlegend: false },
    ];
  }, [wavelength, pulseDuration, cepOffset, cycles, period]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Carrier-Envelope Phase (CEP)" description="CEP offset effects on few-cycle pulse electric field.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Pulse Duration (fs FWHM)" value={pulseDuration} onChange={setPulseDuration} step="any" />
        <ValidatedNumberInput label="CEP φ₀ (rad)" value={cepOffset} onChange={setCepOffset} step="any" />
        <ValidatedNumberInput label="Display Cycles" value={cycles} onChange={setCycles} min={1} max={10} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Optical Period</p>
          <p className="text-xl font-bold text-blue-400">{period.toFixed(3)} fs</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Cycles per Pulse</p>
          <p className="text-xl font-bold text-green-400">{(pulseDuration / period).toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spectral Bandwidth (TL)</p>
          <p className="text-xl font-bold text-orange-400">{(spectralWidth * 1000).toFixed(0)} GHz</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">E(t) = A(t) · cos(ωt + φ₀) &nbsp;|&nbsp; Δφ<sub>CE</sub> = ω<sub>g</sub>/ω₀ · 2π per pulse</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Time (fs)", gridcolor: "#374151" },
          yaxis: { title: "E-field (a.u.)", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
