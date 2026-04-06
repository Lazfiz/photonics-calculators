"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function AcquisitionTrackingPage() {
  const [fov, setFov] = useState(1); // mrad
  const [uncertainty, setUncertainty] = useState(5); // mrad 3σ
  const [scanRate, setScanRate] = useState(10); // deg/s
  const [beaconPower, setBeaconPower] = useState(0); // dBm
  const [wavelength, setWavelength] = useState(1550); // nm
  const [rxSensitivity, setRxSensitivity] = useState(-40); // dBm
  const [detectorNoise, setDetectorNoise] = useState(100); // nW
  const [bandwidth, setBandwidth] = useState(1); // kHz

  const calc = useMemo(() => {
    // Acquisition probability (Gaussian uncertainty in circular FOV)
    const sigma = uncertainty / 3;
    const fovRad = fov * 1e-3;
    // P_acquire = 1 - exp(-FOV² / (2σ²))
    const pAcq = 1 - Math.exp(-(fovRad ** 2) / (2 * (sigma * 1e-3) ** 2));

    // Scan time (raster scan covering 3σ uncertainty cone)
    const coneAngle = (2 * uncertainty * 1e-3 * 180 / Math.PI); // deg
    const scanLines = Math.ceil(coneAngle / (fov * 180 / Math.PI));
    const scanTime = scanLines * (coneAngle / scanRate); // seconds

    // Tracking jitter (beamwidth fraction)
    const lambda = wavelength * 1e-9;
    const beamwidth = 1.22 * lambda / (apertureForGain(30, lambda)); // approx
    const jitter_mrad = Math.sqrt(detectorNoise * 1e-9 / (beaconPower * 1e-3)) * 1e3 * 0.1;

    // SNR at detector
    const beaconW = 10 ** ((beaconPower - 30) / 10);
    const noiseW = detectorNoise * 1e-9;
    const snr = beaconW / noiseW;

    // Link margin for acquisition beacon
    const margin = beaconPower - rxSensitivity;

    return { pAcq, scanTime, scanLines, snr, margin, jitter_mrad };
  }, [fov, uncertainty, scanRate, beaconPower, wavelength, rxSensitivity, detectorNoise, bandwidth]);

  // Helper - rough aperture for a given gain
  function apertureForGain(gain_dBi: number, lambda: number) {
    const g = 10 ** (gain_dBi / 10);
    return Math.sqrt(g) * lambda / Math.PI;
  }

  const plotData = useMemo(() => {
    const fovs = Array.from({ length: 200 }, (_, i) => 0.1 + i * 0.05);
    const probs = fovs.map((f) => {
      const sigma = uncertainty / 3;
      const fRad = f * 1e-3;
      return (1 - Math.exp(-(fRad ** 2) / (2 * (sigma * 1e-3) ** 2))) * 100;
    });
    const scanTimes = fovs.map((f) => {
      const coneAngle = (2 * uncertainty * 1e-3 * 180 / Math.PI);
      const lines = Math.ceil(coneAngle / (f * 180 / Math.PI));
      return lines * (coneAngle / scanRate);
    });
    return [
      { x: fovs, y: probs, type: "scatter", mode: "lines", name: "Acq. Probability (%)", line: { color: "#06b6d4" }, yaxis: "y" },
      { x: fovs, y: scanTimes, type: "scatter", mode: "lines", name: "Scan Time (s)", line: { color: "#f59e0b" }, yaxis: "y2" },
    ];
  }, [uncertainty, scanRate]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
            
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Receiver FOV (mrad)", fov, setFov],
            ["Position Uncertainty 3σ (mrad)", uncertainty, setUncertainty],
            ["Scan Rate (°/s)", scanRate, setScanRate],
            ["Beacon Power (dBm)", beaconPower, setBeaconPower],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["RX Sensitivity (dBm)", rxSensitivity, setRxSensitivity],
            ["Detector Noise Floor (nW)", detectorNoise, setDetectorNoise],
            ["Tracking Bandwidth (kHz)", bandwidth, setBandwidth],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} step={val < 2 ? 0.1 : 1}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-400">Acq. Probability</span><span className={calc.pAcq > 0.9 ? "text-green-400" : "text-yellow-400"}>{(calc.pAcq * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Scan Lines</span><span>{calc.scanLines}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Scan Time</span><span>{calc.scanTime.toFixed(1)} s</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Beacon SNR</span><span>{calc.snr.toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Beacon Margin</span><span className={calc.margin > 0 ? "text-green-400" : "text-red-400"}>{calc.margin.toFixed(1)} dB</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">P<sub>acq</sub>:</strong> 1 − exp(−FOV² / 2σ²)</p>
            <p><strong className="text-gray-400">Scan Time:</strong> N<sub>lines</sub> × (cone / scan rate)</p>
            <p><strong className="text-gray-400">SNR:</strong> P<sub>beacon</sub> / P<sub>noise</sub></p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "FOV (mrad)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Acq. Probability (%)", color: "#06b6d4", gridcolor: "#374151", range: [0, 105] },
              yaxis2: { title: "Scan Time (s)", color: "#f59e0b", gridcolor: "#374151", overlaying: "y", side: "right" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 30, r: 60, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
