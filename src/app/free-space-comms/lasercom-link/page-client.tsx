"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function LasercomLinkPage() {
  const [txPower, setTxPower] = useState(20); // dBm
  const [txAperture, setTxAperture] = useState(5); // cm
  const [rxAperture, setRxAperture] = useState(10); // cm
  const [wavelength, setWavelength] = useState(1550); // nm
  const [range, setRange] = useState(500); // km
  const [txEfficiency, setTxEfficiency] = useState(0.8);
  const [rxEfficiency, setRxEfficiency] = useState(0.7);
  const [pointingLoss, setPointingLoss] = useState(3); // dB
  const [atmosLoss, setAtmosLoss] = useState(2); // dB

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const dTx = txAperture * 1e-2;
    const dRx = rxAperture * 1e-2;
    const R = range * 1e3;

    // TX gain (Gaussian beam approximation)
    const txGain = 10 * Math.log10((Math.PI * dTx / lambda) ** 2 * txEfficiency);
    // RX gain
    const rxGain = 10 * Math.log10((Math.PI * dRx / lambda) ** 2 * rxEfficiency);
    // FSPL
    const fspl = 20 * Math.log10(4 * Math.PI * R / lambda);
    // Received power
    const pr = txPower + txGain + rxGain - fspl - pointingLoss - atmosLoss;

    // Spot size at receiver
    const spotRadius = lambda * R / (Math.PI * dTx / 2) * 1e2; // cm
    // Geometric coupling loss
    const couplingRatio = Math.min(1, (dRx / 2 / spotRadius) ** 2);
    const couplingLoss = 10 * Math.log10(Math.max(couplingRatio, 1e-10));

    return { txGain, rxGain, fspl, pr, spotRadius, couplingLoss };
  }, [txPower, txAperture, rxAperture, wavelength, range, txEfficiency, rxEfficiency, pointingLoss, atmosLoss]);

  const plotData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const dTx = txAperture * 1e-2;
    const dRx = rxAperture * 1e-2;
    const txG = 10 * Math.log10((Math.PI * dTx / lambda) ** 2 * txEfficiency);
    const rxG = 10 * Math.log10((Math.PI * dRx / lambda) ** 2 * rxEfficiency);
    const ranges = Array.from({ length: 300 }, (_, i) => 10 + i * 10);
    const powers = ranges.map((r) => {
      const R = r * 1e3;
      const fspl = 20 * Math.log10(4 * Math.PI * R / lambda);
      return txPower + txG + rxG - fspl - pointingLoss - atmosLoss;
    });
    const spotRadii = ranges.map((r) => {
      const R = r * 1e3;
      return lambda * R / (Math.PI * dTx / 2) * 1e2;
    });
    return [
      { x: ranges, y: powers, type: "scatter", mode: "lines", name: "Rx Power (dBm)", line: { color: "#06b6d4" }, yaxis: "y" },
      { x: ranges, y: spotRadii, type: "scatter", mode: "lines", name: "Spot Radius (cm)", line: { color: "#f59e0b" }, yaxis: "y2" },
    ];
  }, [txPower, txAperture, rxAperture, wavelength, txEfficiency, rxEfficiency, pointingLoss, atmosLoss]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
            
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["TX Power (dBm)", txPower, setTxPower, -10, 40],
            ["TX Aperture Diameter (cm)", txAperture, setTxAperture, 1, 50],
            ["RX Aperture Diameter (cm)", rxAperture, setRxAperture, 1, 100],
            ["Wavelength (nm)", wavelength, setWavelength, 400, 2000],
            ["Range (km)", range, setRange, 1, 50000],
            ["TX Efficiency", txEfficiency, setTxEfficiency, 0.1, 1],
            ["RX Efficiency", rxEfficiency, setRxEfficiency, 0.1, 1],
            ["Pointing Loss (dB)", pointingLoss, setPointingLoss, 0, 20],
            ["Atmospheric Loss (dB)", atmosLoss, setAtmosLoss, 0, 20],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))} step={typeof val === "number" && val < 2 ? 0.01 : 1}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-400">TX Gain</span><span>{calc.txGain.toFixed(1)} dBi</span></div>
              <div className="flex justify-between"><span className="text-gray-400">RX Gain</span><span>{calc.rxGain.toFixed(1)} dBi</span></div>
              <div className="flex justify-between"><span className="text-gray-400">FSPL</span><span>{calc.fspl.toFixed(1)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Spot Radius at RX</span><span>{calc.spotRadius.toFixed(1)} cm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Coupling Loss</span><span>{calc.couplingLoss.toFixed(1)} dB</span></div>
              <div className="flex justify-between font-bold"><span className="text-gray-300">Received Power</span><span className={calc.pr > -40 ? "text-green-400" : "text-red-400"}>{calc.pr.toFixed(1)} dBm</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">TX Gain:</strong> G<sub>tx</sub> = (π D<sub>tx</sub> / λ)² η<sub>tx</sub></p>
            <p><strong className="text-gray-400">RX Gain:</strong> G<sub>rx</sub> = (π D<sub>rx</sub> / λ)² η<sub>rx</sub></p>
            <p><strong className="text-gray-400">FSPL:</strong> 20 log₁₀(4πR/λ)</p>
            <p><strong className="text-gray-400">Spot Radius:</strong> w = 2λR / (π D<sub>tx</sub>)</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Range (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Rx Power (dBm)", color: "#06b6d4", gridcolor: "#374151" },
              yaxis2: { title: "Spot Radius (cm)", color: "#f59e0b", gridcolor: "#374151", overlaying: "y", side: "right" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 30, r: 60, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
