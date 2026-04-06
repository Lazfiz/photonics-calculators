"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


export default function FiberDelayLineCalculator() {
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 100); // m
  const [refractiveIndex, setRefractiveIndex] = useURLState("refractiveIndex", 1.468);
  const [signalWavelength, setSignalWavelength] = useURLState("signalWavelength", 1550); // nm
  const [inputBitRate, setInputBitRate] = useURLState("inputBitRate", 10); // Gbps
  const [temperature, setTemperature] = useURLState("temperature", 25); // °C
  const [coefficient, setCoefficient] = useURLState("coefficient", 0.05); // ps/(nm·km) dispersion
  const [spectralWidth, setSpectralWidth] = useURLState("spectralWidth", 0.1); // nm

  // Propagation time
  const delay = useMemo(() => {
    const c = 3e8; // m/s
    return (refractiveIndex * fiberLength) / c; // seconds
  }, [fiberLength, refractiveIndex]);

  const delayNs = delay * 1e9; // nanoseconds
  const delayPs = delay * 1e12; // picoseconds

  // Group velocity
  const groupVelocity = 3e8 / refractiveIndex; // m/s

  // Optical path length
  const opticalPathLength = refractiveIndex * fiberLength;

  // Bit slots that fit
  const bitSlots = useMemo(() => {
    const bitPeriod = 1 / (inputBitRate * 1e9); // seconds
    return delay / bitPeriod;
  }, [delay, inputBitRate]);

  // Dispersion-induced pulse broadening
  const pulseBroadening = useMemo(() => {
    // Δτ = D · L · Δλ
    return Math.abs(coefficient) * (fiberLength / 1000) * spectralWidth; // ps
  }, [coefficient, fiberLength, spectralWidth]);

  // Temperature coefficient effect (typical: ~0.05 ps/(m·°C) for SMF)
  const tempCoeff = 0.05; // ps/(m·°C) - fiber thermo-optic coefficient
  const tempDelayChange = tempCoeff * fiberLength * temperature; // ps

  // Phase shift at signal wavelength
  const phaseShift = useMemo(() => {
    return (2 * Math.PI * refractiveIndex * fiberLength) / (signalWavelength * 1e-9);
  }, [refractiveIndex, fiberLength, signalWavelength]);

  // Free spectral range (if used as recirculating loop)
  const fsr = useMemo(() => {
    const c = 3e8;
    return c / (refractiveIndex * fiberLength); // Hz
  }, [refractiveIndex, fiberLength]);

  const fsrMHz = fsr / 1e6;

  // Delay vs length curve
  const delayCurve = useMemo(() => {
    const lengths: number[] = [];
    const delays: number[] = [];

    for (let l = 0; l <= 500; l += 5) {
      lengths.push(l);
      delays.push((refractiveIndex * l) / 3e8 * 1e9); // ns
    }

    return [{ x: lengths, y: delays, type: "scatter" as const, mode: "lines" as const, name: "Delay (ns)", line: { color: "#3b82f6", width: 2 } }];
  }, [refractiveIndex]);

  // Dispersion vs wavelength
  const dispersionCurve = useMemo(() => {
    const wavelengths: number[] = [];
    const dispersions: number[] = [];

    for (let w = 1300; w <= 1600; w += 2) {
      wavelengths.push(w);
      // Simplified dispersion model: D ≈ S₀(λ - λ₀) where λ₀ ≈ 1310nm
      const lambda0 = 1310;
      const S0 = 0.092; // ps/(nm²·km)
      dispersions.push(S0 * (w - lambda0));
    }

    return [{ x: wavelengths, y: dispersions, type: "scatter" as const, mode: "lines" as const, name: "Dispersion (ps/nm·km)", line: { color: "#10b981", width: 2 } }];
  }, []);

  const layout1 = {
    title: "Delay vs Fiber Length",
    xaxis: { title: "Fiber Length (m)", gridcolor: "#374151" },
    yaxis: { title: "Delay (ns)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  const layout2 = {
    title: "Fiber Dispersion Profile",
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Dispersion (ps/nm·km)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Length (m)</label>
              <input type="number" value={fiberLength} onChange={(e) => setFiberLength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Refractive Index n_eff</label>
              <input type="number" value={refractiveIndex} onChange={(e) => setRefractiveIndex(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Signal Wavelength (nm)</label>
              <input type="number" value={signalWavelength} onChange={(e) => setSignalWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Input Bit Rate (Gbps)</label>
              <input type="number" value={inputBitRate} onChange={(e) => setInputBitRate(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dispersion Coeff. (ps/nm·km)</label>
              <input type="number" value={coefficient} onChange={(e) => setCoefficient(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Spectral Width (nm)</label>
              <input type="number" value={spectralWidth} onChange={(e) => setSpectralWidth(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Temperature (°C)</label>
              <input type="number" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Propagation delay:</span><span className="font-mono text-green-400 text-lg">{delayNs.toFixed(3)} ns</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Delay in ps:</span><span className="font-mono">{delayPs.toFixed(1)} ps</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Group velocity:</span><span className="font-mono">{(groupVelocity / 1e8).toFixed(2)} × 10⁸ m/s</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Optical path length:</span><span className="font-mono">{opticalPathLength.toFixed(1)} m</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Bit slots stored:</span><span className="font-mono text-blue-400">{bitSlots.toFixed(1)} bits</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Pulse broadening:</span><span className="font-mono text-yellow-400">{pulseBroadening.toFixed(2)} ps</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Temp. delay change:</span><span className="font-mono">{tempDelayChange.toFixed(1)} ps</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Phase shift:</span><span className="font-mono">{(phaseShift / (2 * Math.PI)).toFixed(0)} × 2π</span></div>
                <div className="flex justify-between"><span className="text-gray-400">FSR:</span><span className="font-mono">{fsrMHz.toFixed(2)} MHz</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">τ = n · L / c</p>
              <p className="font-mono text-sm mt-1">v_g = c / n_eff</p>
              <p className="font-mono text-sm mt-1">Δτ_disp = D · L · Δλ</p>
              <p className="font-mono text-sm mt-1">FSR = c / (n · L)</p>
              <p className="font-mono text-sm mt-1">φ = 2π · n · L / λ</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={delayCurve} layout={layout1} />
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={dispersionCurve} layout={layout2} />
          </div>
        </div>
      </div>
    </div>
  );
}
