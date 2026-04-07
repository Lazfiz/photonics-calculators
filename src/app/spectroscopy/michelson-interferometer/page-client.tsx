"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function MichelsonInterferometerPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1.0); // μm
  const [maxOPD, setMaxOPD] = useURLState("maxOPD", 100); // μm
  const [nPoints, setNPoints] = useURLState("nPoints", 256);
  const [nLines, setNLines] = useURLState("nLines", 3);
  const [sourceWidth, setSourceWidth] = useURLState("sourceWidth", 0.05); // μm bandwidth

  const chartData = useMemo(() => {
    const N = nPoints;
    const opd = Array.from({ length: N }, (_, i) => (i / (N - 1)) * maxOPD);
    const k0 = 2 * Math.PI / wavelength;

    // Build composite spectrum: multiple narrow lines
    const lines = Array.from({ length: nLines }, (_, i) => wavelength + (i - Math.floor(nLines / 2)) * 0.3);

    // Interferogram = sum of cosines (one per spectral line)
    const interferogram = opd.map(x => {
      let val = 0;
      for (const wl of lines) {
        val += Math.cos(2 * Math.PI * x / wl);
      }
      return val / lines.length;
    });

    // DFT to recover spectrum
    const freqs = Array.from({ length: N / 2 }, (_, i) => i / maxOPD);
    const spectrum = freqs.map((_, k) => {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) {
        const phase = (2 * Math.PI * k * opd[n]) / maxOPD;
        re += interferogram[n] * Math.cos(phase);
        im -= interferogram[n] * Math.sin(phase);
      }
      return Math.sqrt(re * re + im * im) / N;
    });

    // Convert freqs to wavelength (σ = 1/λ)
    const wavenumbers = freqs.map(f => f);
    const wavelengths = wavenumbers.map(s => s > 0 ? 1 / s : 0);

    return [
      { x: opd, y: interferogram, type: "scatter" as const, mode: "lines" as const, name: "Interferogram", line: { color: "#60a5fa" } },
      { x: wavenumbers, y: spectrum, type: "scatter" as const, mode: "lines" as const, name: "Recovered Spectrum", line: { color: "#f87171" }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [wavelength, maxOPD, nPoints, nLines, sourceWidth]);

  const resolution = 1 / maxOPD; // spectral resolution in μm⁻¹
  const resolvingPower = maxOPD / wavelength;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Michelson Interferometer" description="Interferogram → spectrum via Fourier transform. Core of FTIR spectroscopy.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Central λ (μm)" value={wavelength} onChange={setWavelength} min={0.1} />
        <ValidatedNumberInput label="Max OPD (μm)" value={maxOPD} onChange={setMaxOPD} min={1} />
        <ValidatedNumberInput label="Spectral Lines" value={nLines} onChange={setNLines} min={1} max={10} />
        <ValidatedNumberInput label="N Points" value={nPoints} onChange={setNPoints} min={8} max={2048} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Spectral Resolution</p>
          <p className="text-xl font-bold text-blue-400">{resolution.toFixed(4)} μm⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Resolving Power (λ/Δλ)</p>
          <p className="text-xl font-bold text-green-400">{resolvingPower.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">I(x) = ∫ B(σ)·cos(2πσx) dσ</span> — interferogram is cosine transform of spectrum.</p>
        <p><span className="text-green-400 font-mono">B(σ) = FT(I(x))</span> — spectrum recovered by Fourier transform.</p>
        <p><span className="text-red-400 font-mono">δσ = 1 / Δx_max</span> — resolution set by maximum OPD.</p>
        <p><span className="text-yellow-400 font-mono">Fellgett advantage:</span> multiplex — all frequencies measured simultaneously.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        grid: { rows: 2, columns: 1, pattern: "independent" },
        xaxis: { title: "Optical Path Difference (μm)", gridcolor: "#374151" },
        yaxis: { title: "Intensity", gridcolor: "#374151" },
        xaxis2: { title: "Wavenumber (μm⁻¹)", gridcolor: "#374151" },
        yaxis2: { title: "Spectral Intensity", gridcolor: "#374151" },
        height: 700, margin: { t: 30, b: 40 },
      }} />
    </CalculatorShell>
  );
}
