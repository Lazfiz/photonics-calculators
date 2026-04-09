"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function PointingErrorPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [distance, setDistance] = useURLState("distance", 1); // km
  const [txAperture, setTxAperture] = useURLState("txAperture", 0.05); // m
  const [rxAperture, setRxAperture] = useURLState("rxAperture", 0.2); // m
  const [jitterAzimuth, setJitterAzimuth] = useURLState("jitterAzimuth", 1); // μrad RMS
  const [jitterElevation, setJitterElevation] = useURLState("jitterElevation", 1); // μrad RMS

  const results = useMemo(() => {
    const wl = wavelength * 1e-9;
    const L = distance * 1e3;
    const Dt = txAperture;
    const Dr = rxAperture;

    // Beam divergence (full angle)
    const divergence = 2.44 * wl / Dt; // rad (Airy disk)
    const divergenceUrad = divergence * 1e6;
    const beamWaist = wl * L / (Math.PI * Dt / 2); // beam radius at receiver
    const beamDiameter = 2 * beamWaist;

    // Gaussian beam model
    const w0 = Dt / 2;
    const zR = Math.PI * w0 * w0 / wl;
    const w = w0 * Math.sqrt(1 + Math.pow(L / zR, 2));
    const beamRadius = w;

    // Geometric loss (no pointing error)
    const geometricLoss = -10 * Math.log10(Math.pow(Dr / (2 * beamRadius), 2));
    // Cap at 0 if rx > beam
    const geomLossCapped = Math.max(0, geometricLoss);

    // Pointing error loss (Rician model)
    const sigmaAz = jitterAzimuth * 1e-6;
    const sigmaEl = jitterElevation * 1e-6;
    const sigma = Math.sqrt(sigmaAz * sigmaAz + sigmaEl * sigmaEl);

    // h(ξ) = exp(-2ξ²) for pointing error PDF where ξ = r/w
    const xi = sigma / beamRadius;
    const pointingLoss = -10 * Math.log10(1 / (1 + 0.89 * xi * xi)); // simplified
    const totalLoss = geomLossCapped + pointingLoss;

    // Pointing loss vs jitter
    const jitterRange = Array.from({ length: 100 }, (_, i) => (i + 1) * 0.1);
    const pointingLossVsJitter = jitterRange.map((j) => {
      const s = (j * 1e-6) / beamRadius;
      return -10 * Math.log10(1 / (1 + 0.89 * s * s));
    });

    // Total loss vs jitter
    const totalLossVsJitter = jitterRange.map((j) => {
      const s = (j * 1e-6) / beamRadius;
      const pl = -10 * Math.log10(1 / (1 + 0.89 * s * s));
      return geomLossCapped + pl;
    });

    // Pointing loss vs distance
    const distRange = Array.from({ length: 50 }, (_, i) => (i + 1) * 0.05);
    const lossVsDist = distRange.map((d) => {
      const Ld = d * 1e3;
      const wd = w0 * Math.sqrt(1 + Math.pow(Ld / zR, 2));
      const gl = Math.max(0, -10 * Math.log10(Math.pow(Dr / (2 * wd), 2)));
      const s = sigma / wd;
      const pl = -10 * Math.log10(1 / (1 + 0.89 * s * s));
      return gl + pl;
    });

    // Required tracking accuracy for 1dB pointing loss
    const requiredAccuracy = beamRadius * Math.sqrt((1 / 0.89) * (Math.pow(10, 1 / 10) - 1)) * 1e6; // μrad

    return { divergence, divergenceUrad, beamRadius, beamDiameter: 2 * beamRadius, geomLossCapped, pointingLoss, totalLoss, pointingLossVsJitter, totalLossVsJitter, jitterRange, lossVsDist, distRange, requiredAccuracy };
  }, [wavelength, distance, txAperture, rxAperture, jitterAzimuth, jitterElevation]);

  return (
    <CalculatorShell backHref="/free-space-comms" backLabel="Free Space Comms" title="Pointing Error Loss" description="Calculate pointing loss from beam jitter for FSO links.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Parameters</h2>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "Distance (km)", val: distance, set: setDistance },
            { label: "TX Aperture (m)", val: txAperture, set: setTxAperture },
            { label: "RX Aperture (m)", val: rxAperture, set: setRxAperture },
            { label: "Jitter Azimuth (μrad RMS)", val: jitterAzimuth, set: setJitterAzimuth },
            { label: "Jitter Elevation (μrad RMS)", val: jitterElevation, set: setJitterElevation },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} step="any" />
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Beam Divergence (full)" value={`${results.divergenceUrad.toFixed(1)} μrad`} />
            <ResultRow label="Beam Radius at RX" value={`${(results.beamRadius * 100).toFixed(1)} cm`} />
            <ResultRow label="Beam Diameter at RX" value={`${(results.beamDiameter * 100).toFixed(1)} cm`} />
            <ResultRow label="Geometric Loss" value={`${results.geomLossCapped.toFixed(2)} dB`} />
            <ResultRow label="Pointing Loss" value={`${results.pointingLoss.toFixed(2)} dB`} />
            <ResultRow label="Total Loss" value={`${results.totalLoss.toFixed(2)} dB`} />
            <ResultRow label="Required Accuracy (1dB loss)" value={`${results.requiredAccuracy.toFixed(1)} μrad`} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Loss vs Jitter</h2>
          <ChartPanel data={[
              { type: "scatter" as const, mode: "lines" as const, x: results.jitterRange, y: results.pointingLossVsJitter, name: "Pointing Loss", line: { color: "#3b82f6", dash: "dash" } },
              { type: "scatter" as const, mode: "lines" as const, x: results.jitterRange, y: results.totalLossVsJitter, name: "Total Loss", line: { color: "#ef4444", width: 2 } },
            ]}
            layout={{
              xaxis: { title: "Jitter (μrad RMS)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Loss (dB)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Total Loss vs Distance</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.distRange, y: results.lossVsDist, line: { color: "#22c55e", width: 2 } }]}
            layout={{
              xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Total Loss (dB)", color: "#9ca3af", gridcolor: "#374151" },
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
