"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

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
    const P_tx = Math.pow(10, (txPower - 30) / 10); // dBm → W
    const h_planck = 6.626e-34;
    const c = 3e8;
    const E_photon = h_planck * c / lambda;

    // Channel transmission
    const totalLoss = fiberLoss * range;
    const channelTransmission = Math.pow(10, -totalLoss / 10);

    // Mean photon number from TX power: μ = P·T_pulse/(h·c/λ)
    // T_pulse = 1/f_rep, so μ = P/(f_rep · E_photon)
    const mu = P_tx / (repRate * E_photon);

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

    // Secure key rate (Lo-Ma-Chen decoy-state BB84, single-photon contribution)
    // R = 0.5 * f_rep * Q_1 * [1 - h(e_1)]
    const h = (x: number) => {
      if (x <= 0 || x >= 1) return 0;
      return -x * Math.log2(x) - (1 - x) * Math.log2(1 - x);
    };
    const keyRate = 0.5 * repRate * Q1 * Math.max(0, 1 - h(e1));

    // Secret key fraction
    const skf = keyRate / (0.5 * repRate);

    // Max range: binary search for when key rate → 0
    let maxRange = 0;
    {
      let lo = 0, hi = 500;
      for (let i = 0; i < 60; i++) {
        const r = (lo + hi) / 2;
        const loss = fiberLoss * r;
        const eta = Math.pow(10, -loss / 10) * detectorEfficiency;
        const y0 = darkCountRate / repRate;
        const y1 = y0 + eta * (1 - y0);
        const q1 = y1 * mu * Math.exp(-mu);
        const e1r = (0.01 * eta + 0.5 * y0) / (eta + y0);
        const kr = 0.5 * repRate * q1 * Math.max(0, 1 - h(e1r));
        if (kr > 0) lo = r; else hi = r;
      }
      maxRange = lo;
    }

    // Protocol comparison: CV-QKD vs DV-QKD
    const cvQkdRate = range < 80 ? repRate * 0.01 * Math.pow(10, -fiberLoss * range / 10) : 0;

    return {
      totalLoss, channelTransmission, eta_total, Y0, Y1, Q1, e1, Q_mu, QBER,
      keyRate, keyRateKbps: keyRate / 1000, skf, maxRange, cvQkdRate,
      isSecure: QBER < errorTolerance,
    };
  }, [wavelength, txPower, range, fiberLoss, detectorEfficiency, darkCountRate, repRate]);

  const plotData = useMemo(() => {
    const ranges = Array.from({ length: 100 }, (_, i) => 1 + i * 1); // 1-100 km
    const P_tx = Math.pow(10, (txPower - 30) / 10);
    const lambda = wavelength * 1e-9;
    const mu = P_tx / (repRate * 6.626e-34 * 3e8 / lambda);
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
      const e1 = (0.01 * eta + 0.5 * Y0) / (eta + Y0);
      return 0.5 * repRate * Q1 * Math.max(0, 1 - h(e1)) / 1000; // kbps
    });

    const cvQkd = ranges.map((r) => {
      if (r > 80) return 0;
      return repRate * 0.01 * Math.pow(10, -fiberLoss * r / 10) / 1000; // kbps
    });

    return [
      { x: ranges, y: bb84, type: "scatter", mode: "lines", name: "BB84 (decoy)", line: { color: "#06b6d4" } },
      { x: ranges, y: cvQkd, type: "scatter", mode: "lines", name: "CV-QKD", line: { color: "#a855f7" } },
    ];
  }, [fiberLoss, detectorEfficiency, darkCountRate, repRate, wavelength, txPower]);

  const plotData2 = useMemo(() => {
    const ranges = Array.from({ length: 100 }, (_, i) => 1 + i * 1);
    const P_tx = Math.pow(10, (txPower - 30) / 10);
    const lambda = wavelength * 1e-9;
    const mu = P_tx / (repRate * 6.626e-34 * 3e8 / lambda);

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
  }, [fiberLoss, detectorEfficiency, darkCountRate, repRate, wavelength, txPower]);

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
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
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
