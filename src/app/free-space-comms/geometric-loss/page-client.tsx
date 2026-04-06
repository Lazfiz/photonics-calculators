"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


export default function GeometricLossPage() {
  const [txBeamDivergence, setTxBeamDivergence] = useURLState("txBeamDivergence", 1);
  const [range, setRange] = useURLState("range", 1);
  const [txAperture, setTxAperture] = useURLState("txAperture", 5);
  const [rxAperture, setRxAperture] = useURLState("rxAperture", 10);
  const [wavelength, setWavelength] = useURLState("wavelength", 1550);

  const calc = useMemo(() => {
    const theta = txBeamDivergence * 1e-3; // mrad to rad
    const R = range * 1e3;
    const beamDiameter = 2 * R * Math.tan(theta / 2);
    const rxArea = Math.PI * (rxAperture * 1e-2 / 2) ** 2;
    const beamArea = Math.PI * (beamDiameter / 2) ** 2;
    const geometricLoss = 10 * Math.log10(rxArea / beamArea);
    const couplingEfficiency = rxArea / beamArea;
    const waist = wavelength * 1e-9 / (Math.PI * txAperture * 1e-3 * txBeamDivergence * 1e-3);
    return { beamDiameter, geometricLoss, couplingEfficiency, waist, beamArea: beamArea };
  }, [txBeamDivergence, range, rxAperture, txAperture, wavelength]);

  const plotData = useMemo(() => {
    const theta = txBeamDivergence * 1e-3;
    const ranges = Array.from({ length: 200 }, (_, i) => 0.05 + i * 0.05);
    const losses = ranges.map((r) => {
      const R = r * 1e3;
      const bd = 2 * R * Math.tan(theta / 2);
      return 10 * Math.log10((rxAperture * 1e-2) ** 2 / bd ** 2);
    });
    const diameters = ranges.map((r) => 2 * r * 1e3 * Math.tan(theta / 2));
    return [
      { x: ranges, y: losses, type: "scatter", mode: "lines", name: "Geom. Loss (dB)", yaxis: "y", line: { color: "#f43f5e" } },
      { x: ranges, y: diameters, type: "scatter", mode: "lines", name: "Beam Dia (m)", yaxis: "y2", line: { color: "#06b6d4" } },
    ];
  }, [txBeamDivergence, rxAperture]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 text-sm">
                <p className="text-cyan-300 mt-1 font-mono">L_geo = 10·log₁₀(A_rx / A_beam) = 20·log₁₀(d_rx / d_beam)</p>
        <p className="text-gray-500 mt-1">Beam diameter: d = 2R·tan(θ/2)</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["TX Beam Divergence (mrad)", txBeamDivergence, setTxBeamDivergence],
            ["Range (km)", range, setRange],
            ["TX Aperture (mm)", txAperture, setTxAperture],
            ["RX Aperture (cm)", rxAperture, setRxAperture],
            ["Wavelength (nm)", wavelength, setWavelength],
          ].map(([label, val, set]: any) => (
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
              <div className="flex justify-between"><span className="text-gray-400">Beam Diameter at RX</span><span>{calc.beamDiameter.toFixed(2)} m</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Geometric Loss</span><span className="text-red-400">{calc.geometricLoss.toFixed(1)} dB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Coupling Efficiency</span><span>{(calc.couplingEfficiency * 100).toFixed(4)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Beam Waist (est.)</span><span>{(calc.waist * 1e3).toFixed(2)} mm</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Range (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Loss (dB)", color: "#f43f5e", gridcolor: "#374151" },
              yaxis2: { title: "Beam Dia (m)", color: "#06b6d4", gridcolor: "#374151", overlaying: "y", side: "right" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 60, b: 40, l: 55 }, font: { color: "#9ca3af" }, legend: { x: 0.02, y: 0.98 },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
