"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


export default function SBSThresholdPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10); // km
  const [coreDiameter, setCoreDiameter] = useURLState("coreDiameter", 9); // μm
  const [effectiveArea, setEffectiveArea] = useURLState("effectiveArea", 80); // μm²
  const [loss, setLoss] = useURLState("loss", 0.2); // dB/km
  const [brillouinGain, setBrillouinGain] = useURLState("brillouinGain", 5e-11); // m/W
  const [brillouinBandwidth, setBrillouinBandwidth] = useURLState("brillouinBandwidth", 35); // MHz
  const [laserLinewidth, setLaserLinewidth] = useURLState("laserLinewidth", 1); // MHz

  const results = useMemo(() => {
    const wl = wavelength * 1e-9;
    const L = fiberLength * 1e3;
    const Aeff = effectiveArea * 1e-12; // m²
    const alpha = loss / (10 * Math.log10(Math.E)) / 1e3; // Np/m
    const gB = brillouinGain;

    // Effective length
    const Leff = (1 - Math.exp(-alpha * L)) / alpha;

    // Threshold (Smith formula)
    const pthUnpolarized = 21 * Aeff / (gB * Leff); // W
    const pth = pthUnpolarized * 2; // account for polarization scrambling

    // Spectral broadening factor
    const deltaNuB = brillouinBandwidth * 1e6;
    const deltaNuL = laserLinewidth * 1e6;
    const spectralFactor = (deltaNuB + deltaNuL) / deltaNuB;
    const pthCorrected = pth * spectralFactor;

    // SBS gain coefficient vs linewidth
    const linewidths = Array.from({ length: 50 }, (_, i) => 0.1 + i * 2);
    const gainVsLinewidth = linewidths.map((lw) => gB / ((1 + lw / brillouinBandwidth)));

    // Threshold vs fiber length
    const lengths = Array.from({ length: 50 }, (_, i) => (i + 1) * 2);
    const thresholdVsLength = lengths.map((l) => {
      const Le = (1 - Math.exp(-alpha * l * 1e3)) / alpha;
      return (21 * Aeff / (gB * Le) * 2 * spectralFactor) * 1e3; // mW
    });

    // Threshold vs effective area
    const areas = Array.from({ length: 50 }, (_, i) => 20 + i * 4);
    const thresholdVsArea = areas.map((a) => {
      const A = a * 1e-12;
      return (21 * A / (gB * Leff) * 2 * spectralFactor) * 1e3; // mW
    });

    // Backscatter power vs input power
    const inputPowers = Array.from({ length: 50 }, (_, i) => (i + 1) * 2);
    const backscatter = inputPowers.map((pin) => {
      const pinW = pin / 1000;
      if (pinW < pthCorrected * 0.5) {
        return pin * 0.001; // Rayleigh ~0.1%
      } else {
        // Exponential growth above threshold
        const factor = Math.exp(gB * Leff * pinW / Aeff);
        return Math.min(pin * 0.5, pin * 0.001 * factor);
      }
    });

    return { pthUnpolarized, pth, pthCorrected, Leff, linewidths, gainVsLinewidth, lengths, thresholdVsLength, areas, thresholdVsArea, inputPowers, backscatter, spectralFactor };
  }, [wavelength, fiberLength, coreDiameter, effectiveArea, loss, brillouinGain, brillouinBandwidth, laserLinewidth]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="SBS Threshold Power" description="Calculate Stimulated Brillouin Scattering threshold for optical fibers.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Fiber Parameters</h2>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "Fiber Length (km)", val: fiberLength, set: setFiberLength },
            { label: "Core Diameter (μm)", val: coreDiameter, set: setCoreDiameter },
            { label: "Effective Area (μm²)", val: effectiveArea, set: setEffectiveArea },
            { label: "Loss (dB/km)", val: loss, set: setLoss },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step="any" value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Brillouin Parameters</h2>
          {[
            { label: "Brillouin Gain gB (m/W)", val: brillouinGain, set: setBrillouinGain },
            { label: "Brillouin Bandwidth (MHz)", val: brillouinBandwidth, set: setBrillouinBandwidth },
            { label: "Laser Linewidth (MHz)", val: laserLinewidth, set: setLaserLinewidth },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step="any" value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Effective Length" value={`${(results.Leff / 1000).toFixed(2)} km`} />
            <ResultRow label="Spectral Broadening Factor" value={results.spectralFactor.toFixed(3)} />
            <ResultRow label="Threshold (unpolarized)" value={`${(results.pthUnpolarized * 1000).toFixed(1)} mW`} />
            <ResultRow label="Threshold (polarized)" value={`${(results.pth * 1000).toFixed(1)} mW`} />
            <ResultRow label="Threshold (corrected)" value={`${(results.pthCorrected * 1000).toFixed(1)} mW`} />
            <ResultRow label="Threshold" value={`${(10 * Math.log10(results.pthCorrected * 1000)).toFixed(1)} dBm`} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Backscatter vs Input Power</h2>
          <ChartPanel data={[
              { type: "scatter" as const, mode: "lines" as const, x: results.inputPowers, y: results.backscatter, name: "Backscatter", line: { color: "#ef4444", width: 2 } },
              { type: "scatter" as const, mode: "lines" as const, x: results.inputPowers, y: results.inputPowers.map((p) => p * 0.001), name: "Rayleigh", line: { color: "#3b82f6", dash: "dash" } },
            ]}
            layout={{
              xaxis: { title: "Input Power (mW)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Backscatter Power (mW)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Threshold vs Fiber Length</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.lengths, y: results.thresholdVsLength, line: { color: "#22c55e", width: 2 } }]}
            layout={{
              xaxis: { title: "Fiber Length (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "SBS Threshold (mW)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Threshold vs Effective Area</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.areas, y: results.thresholdVsArea, line: { color: "#f59e0b", width: 2 } }]}
            layout={{
              xaxis: { title: "Effective Area (μm²)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "SBS Threshold (mW)", color: "#9ca3af", gridcolor: "#374151" },
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
