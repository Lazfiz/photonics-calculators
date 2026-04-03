"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function PointAheadPage() {
  const [range, setRange] = useState(40000); // km (LEO)
  const [relVelocity, setRelVelocity] = useState(7); // km/s
  const [wavelength, setWavelength] = useState(1550); // nm
  const [txAperture, setTxAperture] = useState(10); // cm

  const calc = useMemo(() => {
    const R = range * 1e3; // m
    const v = relVelocity * 1e3; // m/s
    const lambda = wavelength * 1e-9;

    // Point-ahead angle (rad) = v × R / c
    const c = 3e8;
    const thetaPA = v * R / c;
    const thetaPA_urad = thetaPA * 1e6;

    // Half-power beamwidth
    const D = txAperture * 1e-2;
    const thetaBW = 1.22 * lambda / D;
    const thetaBW_urad = thetaBW * 1e6;

    // Ratio of PA angle to beamwidth
    const ratio = thetaPA / thetaBW;

    // Time of flight
    const tof = R / c; // seconds

    // Required pointing accuracy (fraction of beamwidth)
    const pointingAccuracy_urad = thetaBW_urad / 10; // 1/10 beamwidth rule

    return { thetaPA_urad, thetaBW_urad, ratio, tof, pointingAccuracy_urad };
  }, [range, relVelocity, wavelength, txAperture]);

  const plotData = useMemo(() => {
    const c = 3e8;
    const ranges = Array.from({ length: 200 }, (_, i) => 100 + i * 250); // km
    const paAngles = ranges.map((r) => relVelocity * 1e3 * r * 1e3 / c * 1e6);
    const tofs = ranges.map((r) => r * 1e3 / c);

    return [
      { x: ranges, y: paAngles, type: "scatter", mode: "lines", name: "PA Angle (μrad)", line: { color: "#06b6d4" }, yaxis: "y" },
      { x: ranges, y: tofs, type: "scatter", mode: "lines", name: "Time of Flight (ms)", line: { color: "#f59e0b" }, yaxis: "y2" },
    ];
  }, [relVelocity]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
            
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Link Range (km)", range, setRange],
            ["Relative Velocity (km/s)", relVelocity, setRelVelocity],
            ["Wavelength (nm)", wavelength, setWavelength],
            ["TX Aperture (cm)", txAperture, setTxAperture],
          ].map(([label, val, set]) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <input type="number" value={val} onChange={(e) => set(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          ))}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
            <p><strong className="text-gray-400">Presets:</strong></p>
            <div className="flex gap-2 mt-1">
              {[
                ["LEO-LEO", 2000, 14],
                ["LEO-Ground", 500, 7],
                ["GEO-Ground", 36000, 0.05],
                ["Deep Space", 2000000, 30],
              ].map(([name, r, v]) => (
                <button key={name} onClick={() => { setRange(r); setRelVelocity(v); }}
                  className="bg-gray-800 hover:bg-gray-700 text-xs px-2 py-1 rounded text-gray-300">{name}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-400">Point-Ahead Angle</span><span className="text-cyan-300">{calc.thetaPA_urad.toFixed(1)} μrad</span></div>
              <div className="flex justify-between"><span className="text-gray-400">TX Beamwidth</span><span>{calc.thetaBW_urad.toFixed(1)} μrad</span></div>
              <div className="flex justify-between"><span className="text-gray-400">PA / Beamwidth</span><span className={calc.ratio < 1 ? "text-green-400" : "text-red-400"}>{calc.ratio.toFixed(3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Time of Flight</span><span>{(calc.tof * 1e3).toFixed(2)} ms</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Req. Pointing Acc.</span><span>{calc.pointingAccuracy_urad.toFixed(1)} μrad (BW/10)</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">θ<sub>PA</sub> = v × R / c</strong></p>
            <p><strong className="text-gray-400">θ<sub>BW</sub> = 1.22 λ / D</strong></p>
            <p>If θ<sub>PA</sub> ≫ θ<sub>BW</sub>, the TX must lead the RX by the full PA angle. The beam must be steered to compensate.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Range (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "PA Angle (μrad)", color: "#06b6d4", gridcolor: "#374151" },
              yaxis2: { title: "TOF (ms)", color: "#f59e0b", gridcolor: "#374151", overlaying: "y", side: "right" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 30, r: 60, b: 40, l: 60 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
