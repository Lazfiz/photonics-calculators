"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function AtmospherePage() {
  const [wavelength, setWavelength] = useState(1550); // nm
  const [distance, setDistance] = useState(1); // km
  const [visibility, setVisibility] = useState(23); // km
  const [altitude, setAltitude] = useState(0); // m
  const [humidity, setHumidity] = useState(50); // %

  const results = useMemo(() => {
    const wl = wavelength / 1000; // μm

    // Molecular (Rayleigh) scattering - simplified
    const rayleighCoeff = 0.008569 / (wl ** 4) * (1 + 0.0113 / (wl ** 2) + 0.00013 / (wl ** 4)); // km^-1

    // Aerosol extinction - Kim model
    let q: number;
    if (visibility < 0.5) q = 0;
    else if (visibility < 1) q = 0.585 * Math.pow(visibility, -0.33);
    else if (visibility < 6) q = 1.3;
    else q = 1.6;

    const aerosolCoeff = (3.91 / visibility) * Math.pow(0.55 / wl, q); // km^-1

    // Molecular absorption bands (simplified model for common wavelengths)
    const h2oCoeff = getH2OAbsorption(wl, humidity); // km^-1
    const co2Coeff = getCO2Absorption(wl); // km^-1

    const totalCoeff = rayleighCoeff + aerosolCoeff + h2oCoeff + co2Coeff;
    const transmission = Math.exp(-totalCoeff * distance);
    const totalLoss = -10 * Math.log10(transmission);
    const rayleighLoss = -10 * Math.log10(Math.exp(-rayleighCoeff * distance));
    const aerosolLoss = -10 * Math.log10(Math.exp(-aerosolCoeff * distance));
    const molecularLoss = rayleighLoss + (-10 * Math.log10(Math.exp(-(h2oCoeff + co2Coeff) * distance)));

    // Spectrum
    const wavelengths = Array.from({ length: 200 }, (_, i) => 400 + i * 8);
    const rayleighSpectrum = wavelengths.map((w) => {
      const wu = w / 1000;
      return Math.exp(-(0.008569 / (wu ** 4)) * distance);
    });
    const aerosolSpectrum = wavelengths.map((w) => {
      const wu = w / 1000;
      return Math.exp(-(3.91 / visibility) * Math.pow(0.55 / wu, q) * distance);
    });
    const totalSpectrum = wavelengths.map((_, i) => rayleighSpectrum[i] * aerosolSpectrum[i]);

    return { rayleighCoeff, aerosolCoeff, h2oCoeff, co2Coeff, totalCoeff, transmission, totalLoss, rayleighLoss, aerosolLoss, molecularLoss, wavelengths, rayleighSpectrum, aerosolSpectrum, totalSpectrum };
  }, [wavelength, distance, visibility, altitude, humidity]);

  // Transmission vs distance
  const distRange = useMemo(() => {
    const distances = Array.from({ length: 100 }, (_, i) => (i + 1) * 0.1);
    const trans = distances.map((d) => Math.exp(-results.totalCoeff * d));
    return { distances, trans };
  }, [results.totalCoeff]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      <Link href="/free-space-comms" className="text-blue-400 hover:underline mb-6 inline-block">← Free Space Comms</Link>
      <h1 className="text-3xl font-bold mb-2">Atmospheric Transmission</h1>
      <p className="text-gray-400 mb-6">Molecular and aerosol extinction for free-space optical links.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Parameters</h2>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "Distance (km)", val: distance, set: setDistance },
            { label: "Visibility (km)", val: visibility, set: setVisibility },
            { label: "Altitude (m)", val: altitude, set: setAltitude },
            { label: "Relative Humidity (%)", val: humidity, set: setHumidity },
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
            <ResultRow label="Rayleigh Coeff." value={`${results.rayleighCoeff.toExponential(3)} km⁻¹`} />
            <ResultRow label="Aerosol Coeff." value={`${results.aerosolCoeff.toExponential(3)} km⁻¹`} />
            <ResultRow label="H₂O Absorption" value={`${results.h2oCoeff.toExponential(3)} km⁻¹`} />
            <ResultRow label="CO₂ Absorption" value={`${results.co2Coeff.toExponential(3)} km⁻¹`} />
            <ResultRow label="Total Extinction" value={`${results.totalCoeff.toFixed(4)} km⁻¹`} />
            <ResultRow label="Transmission" value={`${(results.transmission * 100).toFixed(2)}%`} />
            <ResultRow label="Total Loss" value={`${results.totalLoss.toFixed(2)} dB`} />
            <ResultRow label="Rayleigh Loss" value={`${results.rayleighLoss.toFixed(2)} dB`} />
            <ResultRow label="Aerosol Loss" value={`${results.aerosolLoss.toFixed(2)} dB`} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Transmission vs Wavelength</h2>
          <Plot
            data={[
              { type: "scatter" as const, mode: "lines" as const, x: results.wavelengths, y: results.rayleighSpectrum, name: "Rayleigh", line: { color: "#3b82f6", dash: "dash" } },
              { type: "scatter" as const, mode: "lines" as const, x: results.wavelengths, y: results.aerosolSpectrum, name: "Aerosol", line: { color: "#f59e0b", dash: "dash" } },
              { type: "scatter" as const, mode: "lines" as const, x: results.wavelengths, y: results.totalSpectrum, name: "Total", line: { color: "#22c55e", width: 2 } },
            ]}
            layout={{
              xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Transmission", color: "#9ca3af", gridcolor: "#374151", range: [0, 1.05] },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "350px" }}
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Transmission vs Distance</h2>
          <Plot
            data={[{ type: "scatter" as const, mode: "lines" as const, x: distRange.distances, y: distRange.trans, line: { color: "#ef4444", width: 2 } }]}
            layout={{
              xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Transmission", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "350px" }}
          />
        </div>
      </div>
    </div>
  );
}

function getH2OAbsorption(wl: number, humidity: number): number {
  // Simplified water vapor absorption bands
  const bands: [number, number, number][] = [
    [0.72, 0.05, 0.1], [0.82, 0.1, 0.15], [0.94, 0.3, 0.2],
    [1.13, 0.2, 0.1], [1.38, 1.5, 0.3], [1.87, 2.0, 0.3],
    [2.7, 5.0, 0.5], [6.3, 10.0, 1.0],
  ];
  let coeff = 0;
  const hFactor = humidity / 50;
  for (const [center, strength, width] of bands) {
    coeff += strength * hFactor * Math.exp(-Math.pow(wl - center, 2) / (2 * width * width));
  }
  return coeff;
}

function getCO2Absorption(wl: number): number {
  const bands: [number, number, number][] = [
    [2.7, 0.5, 0.2], [4.3, 3.0, 0.3], [15, 5.0, 2.0],
  ];
  let coeff = 0;
  for (const [center, strength, width] of bands) {
    coeff += strength * Math.exp(-Math.pow(wl - center, 2) / (2 * width * width));
  }
  return coeff;
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
