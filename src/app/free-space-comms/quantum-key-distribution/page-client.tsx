"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
export default function QuantumKeyDistributionPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);
  const [txPower, setTxPower] = useState(-10); // dBm (weak coherent source)
  const [range, setRange] = useURLState("range", 50); // km
  const [fiberLoss, setFiberLoss] = useURLState("fiberLoss", 0.2); // dB/km
  const [detectorEfficiency, setDetectorEfficiency] = useURLState("detectorEfficiency", 0.15);
  const [darkCountRate, setDarkCountRate] = useURLState("darkCountRate", 100); // Hz
  const [repRate, setRepRate] = useURLState("repRate", 1e9); // Hz (pulse repetition)
  const [errorTolerance, setErrorTolerance] = useURLState("errorTolerance", 0.11); // QBER threshold ~11%

  // QKD Key Rate: R = 0.5 * f_clock * Y * (1 - h(e)) * η
  // where Y = yield, e = QBER, h = binary entropy, η = efficiency
  // Using Decoy-state BB84 protocol model (Lo-Ma-Chen)
  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;

    // Channel transmission
    const totalLoss = fiberLoss * range;
    const channelTransmission = Math.pow(10, -totalLoss / 10);

    // Mean photon number (optimal μ ≈ 1 for decoy states)
    const mu = 0.5; // signal state mean photon number

    // Single photon gain Q_1 = Y_1 * μ * exp(-μ)
    // Y_1 ≈ η for low dark counts
    const eta_total = channelTransmission * detectorEfficiency;
    const Y0 = darkCountRate / repRate; // yield from dark count per pulse
    const Y1 = Y0 + eta_total * (1 - Y0);
    const Q1 = Y1 * mu * Math.exp(-mu);

    // Error rate e_1 = e_det + (e_0 * Y_0 / Y_1)
    const e_det = 0.01; // detector error ~1%
    const e_0 = 0.5; // random error for dark counts
    const e1 = (e_det * eta_total + 0.5 * Y0) / (eta_total + Y0);

    // Quantum bit error rate (overall)
    const Q_mu = 1 - Math.exp(-mu * eta_total) + Y0; // total gain
    const E_mu = (e_det * (1 - Math.exp(-mu * eta_total)) + 0.5 * Y0) / Q_mu;
    const QBER = E_mu;

    // Secure key rate (finite-key, with privacy amplification)
    // R = 0.5 * f_rep * Q_1 * [1 - h(e_1) - h(E_μ)]
    const h = (x: number) => {
      if (x <= 0 || x >= 1) return 0;
      return -x * Math.log2(x) - (1 - x) * Math.log2(1 - x);
    };
    const privacyAmp = 1 - h(e1) - Math.max(0, h(E_mu) - h(e1)) * 0.1; // simplified
    const keyRate = 0.5 * repRate * Q1 * Math.max(0, 1 - h(e1) - h(E_mu) * 0.5);

    // Secret key fraction
    const skf = keyRate / (0.5 * repRate);

    // Max range for positive key rate
    // Key rate → 0 when QBER → 11% (Shor-Preskill threshold)
    const maxRange = Math.log(1 / (detectorEfficiency * (1 - errorTolerance))) / (fiberLoss * Math.log(10));

    // Protocol comparison: CV-QKD vs DV-QKD
    const cvQkdRate = range < 80 ? repRate * 0.01 * Math.pow(10, -fiberLoss * range / 10) : 0;

    return {
      totalLoss, channelTransmission, eta_total, Y0, Y1, Q1, e1, Q_mu, QBER,
      keyRate, keyRateKbps: keyRate / 1000, skf, maxRange, cvQkdRate,
      isSecure: QBER < errorTolerance,
    };
  }, [wavelength, txPower, range, fiberLoss, detectorEfficiency, darkCountRate, repRate, errorTolerance]);

  const plotData = useMemo(() => {
    const ranges = Array.from({ length: 100 }, (_, i) => 1 + i * 1); // 1-100 km
    const mu = 0.5;
    const h = (x: number) => {
      if (x <= 0 || x >= 1) return 0;
      return -x * Math.log2(x) - (1 - x) * Math.log2(1 - x);
    };

    const bb84 = ranges.map((r) => {
      const totalLoss = fiberLoss * r;
      const trans = Math.pow(10, -totalLoss / 10);
      const eta = trans * detectorEfficiency;
      const Y0 = darkCountRate / repRate;
      const Y1 = Y0 + eta * (1 - Y0);
      const Q1 = Y1 * mu * Math.exp(-mu);
      const Q_mu = 1 - Math.exp(-mu * eta) + Y0;
      const E_mu = (0.01 * (1 - Math.exp(-mu * eta)) + 0.5 * Y0) / Q_mu;
      const e1 = (0.01 * eta + 0.5 * Y0) / (eta + Y0);
      return 0.5 * repRate * Q1 * Math.max(0, 1 - h(e1) - h(E_mu) * 0.5) / 1000; // kbps
    });

    const cvQkd = ranges.map((r) => {
      if (r > 80) return 0;
      return repRate * 0.01 * Math.pow(10, -fiberLoss * r / 10) / 1000; // kbps
    });

    return [
      { x: ranges, y: bb84, type: "scatter", mode: "lines", name: "BB84 (decoy)", line: { color: "#06b6d4" } },
      { x: ranges, y: cvQkd, type: "scatter", mode: "lines", name: "CV-QKD", line: { color: "#a855f7" } },
    ];
  }, [fiberLoss, detectorEfficiency, darkCountRate, repRate]);

  const plotData2 = useMemo(() => {
    const ranges = Array.from({ length: 100 }, (_, i) => 1 + i * 1);
    const mu = 0.5;

    const qber = ranges.map((r) => {
      const totalLoss = fiberLoss * r;
      const trans = Math.pow(10, -totalLoss / 10);
      const eta = trans * detectorEfficiency;
      const Y0 = darkCountRate / repRate;
      const Q_mu = 1 - Math.exp(-mu * eta) + Y0;
      return (0.01 * (1 - Math.exp(-mu * eta)) + 0.5 * Y0) / Q_mu;
    });

    return [
      { x: ranges, y: qber.map((q) => q * 100), type: "scatter", mode: "lines", name: "QBER", line: { color: "#f97316" } },
    ];
  }, [fiberLoss, detectorEfficiency, darkCountRate, repRate]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Wavelength (nm)", wavelength, setWavelength],
            ["TX Power (dBm)", txPower, setTxPower],
            ["Range (km)", range, setRange],
            ["Fiber Loss (dB/km)", fiberLoss, setFiberLoss, 0.01],
            ["Detector Efficiency", detectorEfficiency, setDetectorEfficiency, 0.01],
            ["Dark Count Rate (Hz)", darkCountRate, setDarkCountRate],
            ["Pulse Rate (Hz)", repRate, setRepRate],
            ["QBER Threshold", errorTolerance, setErrorTolerance, 0.01],
          ].map(([label, val, set, step]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} step={step as number | undefined}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Channel Loss</span><span>{calc.totalLoss.toFixed(1)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Transmission η_ch</span><span>{(calc.channelTransmission * 100).toFixed(4)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total η (det)</span><span>{(calc.eta_total * 100).toFixed(4)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Yield Y_1</span><span>{calc.Y1.toExponential(3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Single-photon Gain Q_1</span><span>{calc.Q1.toExponential(3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">QBER</span>
                <span className={`${calc.QBER < errorTolerance ? "text-green-400" : "text-red-400"} font-bold`}>{(calc.QBER * 100).toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Secure Key Rate</span>
                <span className={`font-bold ${calc.keyRateKbps > 0 ? "text-green-400" : "text-red-400"}`}>
                  {calc.keyRateKbps > 0 ? `${calc.keyRateKbps.toFixed(2)} kbps` : "No secure key"}
                </span></div>
              <div className="flex justify-between"><span className="text-gray-400">Secret Key Fraction</span><span>{(calc.skf * 100).toFixed(4)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Max Range</span><span>{calc.maxRange.toFixed(1)} km</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Security</span>
                <span className={calc.isSecure ? "text-green-400" : "text-red-400"}>{calc.isSecure ? "✓ Secure" : "✗ Insecure"}</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Key Rate vs Range</h3>
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Range (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Key Rate (kbps)", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">QBER vs Range</h3>
            <ChartPanel data={plotData2} layout={{
              xaxis: { title: "Range (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "QBER (%)", color: "#9ca3af", gridcolor: "#374151", range: [0, 20] },
              shapes: [{ type: "line", x0: 0, x1: 100, y0: errorTolerance * 100, y1: errorTolerance * 100, line: { color: "red", dash: "dash" } }],
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
