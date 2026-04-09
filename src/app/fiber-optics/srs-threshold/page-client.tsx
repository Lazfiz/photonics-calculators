"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function SRSThresholdPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10); // km
  const [effectiveArea, setEffectiveArea] = useURLState("effectiveArea", 80); // μm²
  const [loss, setLoss] = useURLState("loss", 0.2); // dB/km
  const [ramanGain, setRamanGain] = useURLState("ramanGain", 1e-13); // m/W
  const [ramanShift, setRamanShift] = useURLState("ramanShift", 13.2); // THz

  const results = useMemo(() => {
    const wl = wavelength * 1e-9;
    const L = fiberLength * 1e3;
    const Aeff = effectiveArea * 1e-12; // m²
    const alpha = loss / (10 * Math.log10(Math.E)) / 1e3; // Np/m
    const gR = ramanGain;

    // Effective length
    const Leff = (1 - Math.exp(-alpha * L)) / alpha;

    // SRS threshold (Smith formula)
    const pth = 16 * Aeff / (gR * Leff); // W

    // Raman wavelength
    const wlRaman = wl * wl / (wl - ramanShift * 1e12 * wl / 3e8); // approximate

    // Gain spectrum (Gaussian approximation of silica Raman gain)
    const shifts = Array.from({ length: 100 }, (_, i) => (i + 1) * 0.2); // THz
    const gainSpectrum = shifts.map((s) => {
      const peak = ramanShift;
      const width = 7; // THz
      return Math.exp(-Math.pow(s - peak, 2) / (2 * width * width));
    });

    // Threshold vs fiber length
    const lengths = Array.from({ length: 50 }, (_, i) => (i + 1) * 2);
    const thresholdVsLength = lengths.map((l) => {
      const Le = (1 - Math.exp(-alpha * l * 1e3)) / alpha;
      return (16 * Aeff / (gR * Le)) * 1e3; // mW
    });

    // Threshold vs effective area
    const areas = Array.from({ length: 50 }, (_, i) => 20 + i * 4);
    const thresholdVsArea = areas.map((a) => {
      const A = a * 1e-12;
      return (16 * A / (gR * Leff)) * 1e3; // mW
    });

    // Raman amplification vs input power
    const inputPowers = Array.from({ length: 50 }, (_, i) => 0.1 + i * 0.5);
    const ramanGain_dB = inputPowers.map((pin) => {
      const pinW = pin / 1000;
      const gainLinear = Math.exp(gR * Leff * pinW / Aeff);
      return 10 * Math.log10(gainLinear);
    });

    // Signal degradation (pump depletion) vs distance
    const distances = Array.from({ length: 50 }, (_, i) => (i + 1) * 0.2);
    const pumpDepletion = distances.map((d) => {
      const Le = (1 - Math.exp(-alpha * d * 1e3)) / alpha;
      const gain = Math.exp(gR * Le * (pth * 0.8) / Aeff);
      return 1 - 1 / gain; // fractional depletion
    });

    return { pth, Leff, wlRaman, shifts, gainSpectrum, lengths, thresholdVsLength, areas, thresholdVsArea, inputPowers, ramanGain_dB, distances, pumpDepletion };
  }, [wavelength, fiberLength, effectiveArea, loss, ramanGain, ramanShift]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="SRS Threshold Power" description="Calculate Stimulated Raman Scattering threshold for optical fibers.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Fiber Parameters</h2>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "Fiber Length (km)", val: fiberLength, set: setFiberLength },
            { label: "Effective Area (μm²)", val: effectiveArea, set: setEffectiveArea },
            { label: "Loss (dB/km)", val: loss, set: setLoss },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} step="any" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Raman Parameters</h2>
          {[
            { label: "Raman Gain gR (m/W)", val: ramanGain, set: setRamanGain },
            { label: "Raman Shift (THz)", val: ramanShift, set: setRamanShift },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} step="any" />
            </div>
          ))}
          <div className="mt-4 p-3 bg-gray-800 rounded text-sm text-gray-400">
            <p className="font-semibold text-gray-300 mb-1">Typical Values:</p>
            <p>• Silica fiber gR ≈ 1×10⁻¹³ m/W at 1550 nm</p>
            <p>• Raman shift ≈ 13.2 THz (≈100 nm at 1550 nm)</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Effective Length" value={`${(results.Leff / 1000).toFixed(2)} km`} />
            <ResultRow label="SRS Threshold" value={`${(results.pth * 1000).toFixed(1)} mW`} />
            <ResultRow label="SRS Threshold" value={`${(10 * Math.log10(results.pth * 1000)).toFixed(1)} dBm`} />
            <ResultRow label="SRS Threshold" value={`${(results.pth).toFixed(2)} W`} />
            <ResultRow label="Stokes Wavelength" value={`${(results.wlRaman * 1e9).toFixed(0)} nm`} />
            <ResultRow label="Frequency Shift" value={`${(ramanShift * 1e3).toFixed(0)} GHz`} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Silica Raman Gain Spectrum</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.shifts, y: results.gainSpectrum, line: { color: "#22c55e", width: 2 }, fill: "tozeroy", fillcolor: "rgba(34,197,94,0.1)" }]}
            layout={{
              xaxis: { title: "Frequency Shift (THz)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Normalized Gain", color: "#9ca3af", gridcolor: "#374151", range: [0, 1.05] },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Threshold vs Fiber Length</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.lengths, y: results.thresholdVsLength, line: { color: "#3b82f6", width: 2 } }]}
            layout={{
              xaxis: { title: "Fiber Length (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "SRS Threshold (mW)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Raman Gain vs Pump Power</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.inputPowers, y: results.ramanGain_dB, line: { color: "#f59e0b", width: 2 } }]}
            layout={{
              xaxis: { title: "Pump Power (W)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Raman Gain (dB)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
