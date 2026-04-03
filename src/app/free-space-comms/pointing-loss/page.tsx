"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function PointingLossPage() {
  const [wavelength, setWavelength] = useState(1550);
  const [txBeamWaist, setTxBeamWaist] = useState(2.5); // cm
  const [jitterRMS, setJitterRMS] = useState(1); // μrad
  const [misalign, setMisalign] = useState(0); // μrad
  const [rxAperture, setRxAperture] = useState(10); // cm

  // Gaussian beam pointing loss model
  // Pointing error: radial offset at receiver = range * θ_error
  // Fractional power captured by aperture with offset d from beam center:
  // η = 1 - exp(-2d²/w²) for uniform circular aperture approximation
  // Combined with Gaussian beam divergence
  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const w0 = txBeamWaist * 1e-2; // m
    const theta_div = lambda / (Math.PI * w0); // rad (half-angle divergence)
    const theta_div_urad = theta_div * 1e6;

    // Total pointing error (RMS of jitter + static misalignment)
    const totalErrorRad = Math.sqrt(jitterRMS * jitterRMS + misalign * misalign) * 1e-6;

    // At range R=1km (normalized), beam radius w(z) = w0 * sqrt(1 + (z/zR)²)
    const zR = Math.PI * w0 * w0 / lambda;
    const R = 1000; // 1 km reference
    const wR = w0 * Math.sqrt(1 + (R / zR) ** 2);

    // Fractional power loss due to pointing offset
    // Using: η_point = exp(-2 * θ_err² / θ_div²) for Gaussian beam
    const etaPoint = Math.exp(-2 * totalErrorRad * totalErrorRad / (theta_div * theta_div));
    const pointingLoss = -10 * Math.log10(Math.max(etaPoint, 1e-12));

    // Also compute aperture coupling with pointing error
    const offsetAtRx = totalErrorRad * R; // m
    const rxRadius = rxAperture * 1e-2 / 2;
    // Fraction of Gaussian beam captured by offset aperture
    // η ≈ exp(-2(offset/wR)²) * [1 - exp(-2(rxR/wR)²)]
    const etaAperture = 1 - Math.exp(-2 * (rxRadius / wR) ** 2);
    const etaCombined = etaPoint * etaAperture;
    const totalLoss = -10 * Math.log10(Math.max(etaCombined, 1e-12));

    return { theta_div_urad, pointingLoss, etaPoint, etaAperture, etaCombined, totalLoss, wR_cm: wR * 100 };
  }, [wavelength, txBeamWaist, jitterRMS, misalign, rxAperture]);

  const plotData = useMemo(() => {
    const jitterVals = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.15);
    const lambda = wavelength * 1e-9;
    const w0 = txBeamWaist * 1e-2;
    const theta_div = lambda / (Math.PI * w0);

    const losses = jitterVals.map((j) => {
      const err = Math.sqrt(j * j + misalign * misalign) * 1e-6;
      const eta = Math.exp(-2 * err * err / (theta_div * theta_div));
      return -10 * Math.log10(Math.max(eta, 1e-12));
    });

    const rxRadius = rxAperture * 1e-2 / 2;
    const zR = Math.PI * w0 * w0 / lambda;
    const R = 1000;
    const wR = w0 * Math.sqrt(1 + (R / zR) ** 2);
    const etaAp = 1 - Math.exp(-2 * (rxRadius / wR) ** 2);

    const totalLosses = jitterVals.map((j) => {
      const err = Math.sqrt(j * j + misalign * misalign) * 1e-6;
      const eta = Math.exp(-2 * err * err / (theta_div * theta_div));
      return -10 * Math.log10(Math.max(eta * etaAp, 1e-12));
    });

    return [
      { x: jitterVals, y: losses, type: "scatter", mode: "lines", name: "Pointing Only", line: { color: "#06b6d4" } },
      { x: jitterVals, y: totalLosses, type: "scatter", mode: "lines", name: "Pointing + Aperture", line: { color: "#f97316" } },
    ];
  }, [wavelength, txBeamWaist, misalign, rxAperture]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Wavelength (nm)", wavelength, setWavelength],
            ["TX Beam Waist (cm)", txBeamWaist, setTxBeamWaist],
            ["Jitter RMS (μrad)", jitterRMS, setJitterRMS],
            ["Static Misalignment (μrad)", misalign, setMisalign],
            ["RX Aperture (cm)", rxAperture, setRxAperture],
          ].map(([label, val, set]) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Beam Divergence</span><span>{calc.theta_div_urad.toFixed(1)} μrad</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Beam Radius @ 1km</span><span>{calc.wR_cm.toFixed(1)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Pointing η</span><span>{(calc.etaPoint * 100).toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Aperture η</span><span>{(calc.etaAperture * 100).toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Pointing Loss</span><span>{calc.pointingLoss.toFixed(2)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Combined Loss</span><span className="text-orange-400 font-bold">{calc.totalLoss.toFixed(2)} dB</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Loss vs Jitter RMS</h3>
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Jitter RMS (μrad)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Loss (dB)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
