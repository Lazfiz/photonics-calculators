"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function SpectralResponsePage() {
  const [responsivityPeak, setResponsivityPeak] = useURLState("responsivityPeak", 0.6); // A/W at peak
  const [peakWavelength, setPeakWavelength] = useURLState("peakWavelength", 700); // nm
  const [bandwidthNm, setBandwidthNm] = useURLState("bandwidthNm", 300); // spectral bandwidth
  const [temperature, setTemperature] = useURLState("temperature", 25); // °C

  // Spectral response R(λ) = R_peak * gaussian-like shape
  const chartData = useMemo(() => {
    const wl = Array.from({ length: 400 }, (_, i) => 200 + i * 2.5); // 200-1200nm
    const sigma = bandwidthNm / 2.355; // FWHM to sigma
    const R = wl.map(w => {
      const r = responsivityPeak * Math.exp(-0.5 * Math.pow((w - peakWavelength) / sigma, 2));
      // Temperature coefficient: ~0.1%/°C shift
      const tempShift = 1 + (temperature - 25) * 0.001;
      return r * tempShift;
    });
    // Also show QE curve (R = η * q * λ / hc)
    const hc = 1.986e-25; // J·m
    const QE = R.map((r, i) => {
      const lam = wl[i] * 1e-9;
      return (r * hc / (1.6e-19 * lam));
    });
    return [
      { x: wl, y: R, type: "scatter" as const, mode: "lines" as const, name: "Responsivity (A/W)", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: wl, y: QE, type: "scatter" as const, mode: "lines" as const, name: "QE (%)", line: { color: "#f87171", width: 2, dash: "dash" }, yaxis: "y2" },
    ];
  }, [responsivityPeak, peakWavelength, bandwidthNm, temperature]);

  const sigma = bandwidthNm / 2.355;
  const cutoffShort = peakWavelength - 2.5 * sigma;
  const cutoffLong = peakWavelength + 2.5 * sigma;

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Spectral Response" description="R(λ) = η(λ) · q · λ / (h·c). Responsivity and quantum efficiency as a function of wavelength.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Peak Responsivity (A/W)" value={responsivityPeak} onChange={setResponsivityPeak} />
        <ValidatedNumberInput label="Peak Wavelength (nm)" value={peakWavelength} onChange={setPeakWavelength} />
        <ValidatedNumberInput label="Spectral Bandwidth FWHM (nm)" value={bandwidthNm} onChange={setBandwidthNm} />
        <ValidatedNumberInput label="Temperature (°C)" value={temperature} onChange={setTemperature} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300">Cutoff range: <span className="text-blue-400 font-mono">{cutoffShort.toFixed(0)}–{cutoffLong.toFixed(0)} nm</span></p>
        <p className="text-gray-300 text-sm mt-1">R(λ) = R<sub>peak</sub> · exp(−(λ−λ<sub>peak</sub>)² / 2σ²)</p>
        <p className="text-sm text-gray-300">η(λ) = R(λ) · h · c / (q · λ)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Responsivity (A/W)", gridcolor: "#374151" },
        yaxis2: { title: "QE (%)", gridcolor: "#374151", overlaying: "y", side: "right", range: [0, 100] },
        margin: { t: 20, b: 40, l: 70, r: 60 }, autosize: true, showlegend: true
      }} />
    </CalculatorShell>
  );
}
