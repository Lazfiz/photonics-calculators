"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function FourierSelfCombPage() {
  const [repetitionRate, setRepetitionRate] = useURLState("repetitionRate", 250); // MHz
  const [centerWavelength, setCenterWavelength] = useURLState("centerWavelength", 1550); // nm
  const [bandwidthNm, setBandwidthNm] = useURLState("bandwidthNm", 100);
  const [combLines, setCombLines] = useURLState("combLines", 50);

  const chartData = useMemo(() => {
    const c = 3e8;
    const repFreq = repetitionRate * 1e6;
    const centerFreq = c / (centerWavelength * 1e-9);
    const deltaLambda = bandwidthNm * 1e-9;
    const fMin = c / ((centerWavelength + bandwidthNm / 2) * 1e-9);
    const fMax = c / ((centerWavelength - bandwidthNm / 2) * 1e-9);
    const fLow = Math.min(fMin, fMax);
    const fHigh = Math.max(fMin, fMax);

    // Comb teeth: equally spaced by f_rep, centered on f_ceo
    const fCeos = Array.from({ length: combLines }, (_, i) => {
      const offset = (i - combLines / 2) * repFreq * 0.3;
      return centerFreq + offset;
    });

    // For each CEO offset, plot comb teeth within bandwidth
    const traces: any[] = [];
    fCeos.forEach((fCeo, idx) => {
      const nMin = Math.ceil((fLow - fCeo) / repFreq);
      const nMax = Math.floor((fHigh - fCeo) / repFreq);
      const freqs: number[] = [];
      const amps: number[] = [];
      for (let n = nMin; n <= nMax; n++) {
        const f = fCeo + n * repFreq;
        if (f >= fLow && f <= fHigh) {
          freqs.push(f / 1e12); // THz
          // Gaussian envelope
          const relF = (f - centerFreq) / (repFreq * combLines * 0.15);
          amps.push(Math.exp(-relF * relF));
        }
      }
      if (freqs.length > 0) {
        const alpha = idx === Math.floor(combLines / 2) ? 1.0 : 0.15;
        traces.push({
          x: freqs, y: amps, type: "scatter", mode: "lines+markers",
          name: `f_CEO offset ${((idx - combLines / 2) * repFreq * 0.3 / 1e6).toFixed(0)} MHz`,
          line: { color: `rgba(96,165,250,${alpha})`, width: 1 },
          marker: { size: idx === Math.floor(combLines / 2) ? 4 : 2 },
          showlegend: idx === Math.floor(combLines / 2),
        });
      }
    });

    return traces;
  }, [repetitionRate, centerWavelength, bandwidthNm, combLines]);

  const c = 3e8;
  const fRep = repetitionRate * 1e6;
  const spacingNm = centerWavelength ** 2 * fRep / c;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Fourier Self-Comb Spectroscopy" description="Optical frequency comb from a single microresonator. Dual-comb spectroscopy without two separate lasers.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Repetition Rate f_rep (MHz)" value={repetitionRate} onChange={setRepetitionRate} min={1} max={10000} />
        <ValidatedNumberInput label="Center Wavelength (nm)" value={centerWavelength} onChange={setCenterWavelength} min={400} max={3000} />
        <ValidatedNumberInput label="Optical Bandwidth (nm)" value={bandwidthNm} onChange={setBandwidthNm} min={1} max={1000} />
        <ValidatedNumberInput label="Number of CEO Offsets" value={combLines} onChange={setCombLines} min={3} max={100} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Comb teeth:</span> f_n = f_CEO + n · f_rep</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Mode spacing (λ):</span> Δλ = λ₀² · f_rep / c</p>
        <p className="text-gray-300 text-sm mb-2"><span className="text-blue-400 font-mono">Self-comb condition:</span> D₁ ≠ 0, FSR_anomalous = m · f_rep</p>
        <p className="text-sm text-gray-300">Microresonator solitons produce equispaced comb lines enabling DCS with a single device.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Computed Values</h3>
        <p className="text-sm text-gray-300"><span className="text-green-400">f_rep:</span> {repetitionRate} MHz</p>
        <p className="text-sm text-gray-300"><span className="text-green-400">Mode spacing:</span> {spacingNm.toFixed(4)} nm</p>
        <p className="text-sm text-gray-300"><span className="text-green-400">Lines in bandwidth:</span> {Math.floor(bandwidthNm / spacingNm)}</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
          title: { text: "Fourier Self-Comb Spectrum", font: { color: "white" } },
          xaxis: { title: "Frequency (THz)", gridcolor: "#374151" },
          yaxis: { title: "Amplitude (a.u.)", gridcolor: "#374151" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
          showlegend: true, legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>
    </CalculatorShell>
  );
}
