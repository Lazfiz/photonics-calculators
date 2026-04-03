"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FiberBraggGratingCalculator() {
  const [braggWavelength, setBraggWavelength] = useState<number>(1550); // nm
  const [effectiveIndex, setEffectiveIndex] = useState<number>(1.468);
  const [gratingLength, setGratingLength] = useState<number>(10); // mm
  const [indexModulation, setIndexModulation] = useState<number>(1e-4); // Δn
  const [gratingType, setGratingType] = useState<"uniform" | "apodized" | "chirped">("uniform");
  const [chirpRate, setChirpRate] = useState<number>(0.1); // nm/mm

  // Grating period
  const gratingPeriod = useMemo(() => {
    return braggWavelength / (2 * effectiveIndex);
  }, [braggWavelength, effectiveIndex]);

  // Number of periods
  const numPeriods = useMemo(() => {
    const periodNm = gratingPeriod; // nm
    const lengthNm = gratingLength * 1e6; // mm to nm
    return lengthNm / periodNm;
  }, [gratingPeriod, gratingLength]);

  // Reflectivity for uniform grating
  const reflectivity = useMemo(() => {
    const kappa = Math.PI * indexModulation / braggWavelength; // coupling coefficient
    const L = gratingLength * 1e-3; // mm to m
    const kappaL = kappa * L * 1e6; // scale to reasonable range
    return Math.tanh(kappaL) ** 2;
  }, [indexModulation, braggWavelength, gratingLength]);

  // Bandwidth (FWHM) for uniform grating
  const bandwidth = useMemo(() => {
    const L = gratingLength * 1e-3; // mm to m
    const lambda = braggWavelength * 1e-9;
    const kappa = Math.PI * indexModulation / braggWavelength;
    const kappaL = kappa * L * 1e6;
    const deltaLambda = (lambda / Math.PI) * Math.sqrt((Math.PI * indexModulation / lambda * 1e3) ** 2 + (Math.PI / (gratingLength * 1e-3)) ** 2) * 1e12;
    // Simplified: Δλ ≈ λ² · Δn / (n_eff · L) for weak gratings
    return (braggWavelength ** 2 * indexModulation) / (effectiveIndex * gratingLength * 1e6) * 1e9;
  }, [braggWavelength, effectiveIndex, indexModulation, gratingLength]);

  // Chirped grating bandwidth
  const chirpedBandwidth = useMemo(() => {
    if (gratingType !== "chirped") return 0;
    return chirpRate * gratingLength;
  }, [gratingType, chirpRate, gratingLength]);

  // Total bandwidth
  const totalBandwidth = gratingType === "chirped" ? chirpedBandwidth : bandwidth;

  // Dispersion of chirped grating
  const dispersion = useMemo(() => {
    if (gratingType !== "chirped" || chirpRate === 0) return 0;
    // D ≈ 2n_eff/(c · chirp_rate) ps/(nm·km)
    const c = 3e8;
    const chirpNmPerM = chirpRate * 1e6; // nm/mm to nm/m
    return (2 * effectiveIndex) / (c * chirpNmPerM) * 1e12; // ps/nm for the grating
  }, [gratingType, chirpRate, effectiveIndex]);

  // Reflection spectrum
  const spectrum = useMemo(() => {
    const wavelengths: number[] = [];
    const reflections: number[] = [];

    const L = gratingLength * 1e-3;
    const kappa = Math.PI * indexModulation / braggWavelength;
    const kappaL = kappa * L * 1e6;

    const bw = gratingType === "chirped" ? chirpedBandwidth : bandwidth * 2;
    const center = braggWavelength;

    for (let w = center - bw * 2; w <= center + bw * 2; w += 0.01) {
      wavelengths.push(w);
      let deltaLambda = w - center;

      if (gratingType === "chirped") {
        // Chirped grating: broader, flatter response
        const sigma = chirpedBandwidth / 2.355;
        const R = reflectivity * Math.exp(-0.5 * (deltaLambda / sigma) ** 2);
        reflections.push(R);
      } else if (gratingType === "apodized") {
        // Apodized: smoother sidelobes
        const deltaBeta = 2 * Math.PI * effectiveIndex * (1 / w - 1 / braggWavelength) * 1e9;
        const gammaSq = kappaL ** 2 - deltaBeta ** 2;
        let R: number;
        if (gammaSq > 0) {
          R = (kappaL / Math.sqrt(gammaSq)) ** 2 * Math.sinh(Math.sqrt(gammaSq)) ** 2 / Math.cosh(Math.sqrt(gammaSq)) ** 2;
        } else {
          R = (kappaL / Math.sqrt(-gammaSq)) ** 2 * Math.sin(Math.sqrt(-gammaSq)) ** 2;
        }
        // Apply apodization envelope
        const envelope = Math.exp(-(deltaLambda / (bandwidth * 1.5)) ** 2);
        reflections.push(Math.min(1, R * envelope));
      } else {
        // Uniform
        const deltaBeta = 2 * Math.PI * effectiveIndex * (1 / w - 1 / braggWavelength) * 1e9;
        const gammaSq = kappaL ** 2 - deltaBeta ** 2;
        let R: number;
        if (gammaSq > 0) {
          R = Math.tanh(Math.sqrt(gammaSq)) ** 2;
        } else {
          R = (kappaL / Math.sqrt(-gammaSq)) ** 2 * Math.sin(Math.sqrt(-gammaSq)) ** 2;
        }
        reflections.push(Math.min(1, R));
      }
    }

    return {
      x: wavelengths, y: reflections, type: "scatter" as const, mode: "lines" as const,
      name: "Reflection", line: { color: "#3b82f6", width: 2 },
    };
  }, [braggWavelength, effectiveIndex, gratingLength, indexModulation, gratingType, bandwidth, chirpedBandwidth, reflectivity]);

  const layout = {
    title: "Fiber Bragg Grating Reflection Spectrum",
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Reflectivity", gridcolor: "#374151", range: [0, 1.05] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true,
    legend: { x: 0.02, y: 0.98 }, height: 400,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">← Back to Fiber Optics</Link>
        <h1 className="text-3xl font-bold mb-2">Fiber Bragg Grating Calculator</h1>
        <p className="text-gray-400 mb-8">Design and analyze FBG reflectivity, bandwidth, and spectral response</p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Grating Type</label>
              <select value={gratingType} onChange={(e) => setGratingType(e.target.value as "uniform" | "apodized" | "chirped")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                <option value="uniform">Uniform</option>
                <option value="apodized">Apodized (Gaussian)</option>
                <option value="chirped">Chirped</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bragg Wavelength (nm)</label>
              <input type="number" value={braggWavelength} onChange={(e) => setBraggWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Effective Index n_eff</label>
              <input type="number" value={effectiveIndex} onChange={(e) => setEffectiveIndex(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.0001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Grating Length (mm)</label>
              <input type="number" value={gratingLength} onChange={(e) => setGratingLength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.5" min="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Index Modulation Δn</label>
              <input type="number" value={indexModulation} onChange={(e) => setIndexModulation(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1e-5" />
            </div>
            {gratingType === "chirped" && (
              <div>
                <label className="block text-sm font-medium mb-2">Chirp Rate (nm/mm)</label>
                <input type="number" value={chirpRate} onChange={(e) => setChirpRate(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.01" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Grating period Λ:</span><span className="font-mono">{gratingPeriod.toFixed(4)} nm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Number of periods:</span><span className="font-mono">{numPeriods.toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Peak reflectivity:</span><span className={`font-mono text-lg ${reflectivity > 0.99 ? "text-green-400" : "text-blue-400"}`}>{(reflectivity * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">FWHM bandwidth:</span><span className="font-mono">{bandwidth.toFixed(3)} nm</span></div>
                {gratingType === "chirped" && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-400">Chirped bandwidth:</span><span className="font-mono text-yellow-400">{chirpedBandwidth.toFixed(1)} nm</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Grating dispersion:</span><span className="font-mono">{dispersion.toFixed(1)} ps/nm</span></div>
                  </>
                )}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">λ_B = 2 · n_eff · Λ</p>
              <p className="font-mono text-sm mt-1">R = tanh²(κ·L)</p>
              <p className="font-mono text-sm mt-1">Δλ ≈ λ²·Δn / (n_eff·L)</p>
              <p className="font-mono text-sm mt-1">κ = π·Δn / λ</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <Plot data={[spectrum]} layout={layout} config={{ responsive: true }} className="w-full" />
        </div>
      </div>
    </div>
  );
}
