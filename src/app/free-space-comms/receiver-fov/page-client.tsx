"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


export default function ReceiverFovPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [rxAperture, setRxAperture] = useURLState("rxAperture", 0.2); // m
  const [fovHalfAngle, setFovHalfAngle] = useURLState("fovHalfAngle", 5); // mrad
  const [opticalEfficiency, setOpticalEfficiency] = useURLState("opticalEfficiency", 0.7);
  const [backgroundType, setBackgroundType] = useState<"day-sky" | "night-sky" | "urban" | "moonlit">("day-sky");
  const [filterBandwidth, setFilterBandwidth] = useURLState("filterBandwidth", 1); // nm

  const backgroundRadiance: Record<string, number> = {
    "day-sky": 150, // W/m²/sr/μm
    "night-sky": 0.001,
    "urban": 10,
    "moonlit": 0.01,
  };

  const results = useMemo(() => {
    const wl = wavelength * 1e-9;
    const Dr = rxAperture;
    const fovRad = (fovHalfAngle * 1e-3) * 2; // full FOV in rad
    const omega = Math.PI * Math.pow(fovRad / 2, 2); // solid angle (approx for small angles)

    // Background power collected
    const Lb = backgroundRadiance[backgroundType]; // W/m²/sr/μm
    const bwMeters = filterBandwidth * 1e-9;
    const bwMicrons = filterBandwidth * 1e-3;
    const Pb = Lb * bwMicrons * omega * Math.PI / 4 * Dr * Dr * opticalEfficiency; // W
    const PbdBm = 10 * Math.log10(Pb * 1000);

    // Signal geometric collection area
    const collectionArea = Math.PI / 4 * Dr * Dr;

    // SNR for given signal power
    const signalPowers = Array.from({ length: 50 }, (_, i) => -60 + i * 1.5); // dBm
    const snr = signalPowers.map((s) => {
      const Ps = Math.pow(10, s / 10) * 1e-3; // W
      const shotNoiseElectrons = 2 * (Ps + Pb) / (1.2398 / (wavelength * 1e6)) * 1e-3; // simplified
      const thermalNoise = 1e-12; // typical
      return 10 * Math.log10(Math.pow(Ps, 2) / (shotNoiseElectrons * 1.6e-19 + thermalNoise * thermalNoise));
    });

    // Background power vs FOV
    const fovRange = Array.from({ length: 50 }, (_, i) => (i + 1) * 0.5);
    const bgPowerVsFov = fovRange.map((fov) => {
      const o = Math.PI * Math.pow((fov * 1e-3) / 2, 2);
      return Lb * bwMicrons * o * Math.PI / 4 * Dr * Dr * opticalEfficiency;
    });

    // Background power vs filter bandwidth
    const bwRange = Array.from({ length: 50 }, (_, i) => 0.1 + i * 0.2);
    const bgPowerVsBw = bwRange.map((bw) => {
      const bwm = bw * 1e-3;
      return Lb * bwm * omega * Math.PI / 4 * Dr * Dr * opticalEfficiency;
    });

    // Required FOV for background = signal (given -30dBm signal)
    const targetSignal = 1e-6; // -30 dBm
    const requiredOmega = targetSignal / (Lb * bwMicrons * Math.PI / 4 * Dr * Dr * opticalEfficiency);
    const requiredFov = 2 * Math.sqrt(requiredOmega / Math.PI) * 1e3; // mrad

    return { Pb, PbdBm, omega, collectionArea, signalPowers, snr, fovRange, bgPowerVsFov, bwRange, bgPowerVsBw, requiredFov, Lb };
  }, [wavelength, rxAperture, fovHalfAngle, opticalEfficiency, backgroundType, filterBandwidth]);

  return (
    <CalculatorShell backHref="/free-space-comms" backLabel="Free Space Comms" title="Receiver FOV vs Background Noise" description="Analyze receiver field of view trade-offs against background radiation noise.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Parameters</h2>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "RX Aperture (m)", val: rxAperture, set: setRxAperture },
            { label: "FOV Half-Angle (mrad)", val: fovHalfAngle, set: setFovHalfAngle },
            { label: "Optical Efficiency", val: opticalEfficiency, set: setOpticalEfficiency },
            { label: "Optical Filter BW (nm)", val: filterBandwidth, set: setFilterBandwidth },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step="any" value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Background Type</label>
            <div className="flex flex-wrap gap-2">
              {(["day-sky", "night-sky", "urban", "moonlit"] as const).map((t) => (
                <button key={t} onClick={() => setBackgroundType(t)}
                  className={`px-3 py-1 text-xs rounded border transition ${backgroundType === t ? "bg-blue-600 border-blue-500" : "bg-gray-800 border-gray-700 hover:border-blue-500"}`}>
                  {t.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Background Radiance" value={`${results.Lb} W/m²/sr/μm`} />
            <ResultRow label="Solid Angle Ω" value={`${results.omega.toExponential(3)} sr`} />
            <ResultRow label="Collection Area" value={`${(results.collectionArea * 1e4).toFixed(2)} cm²`} />
            <ResultRow label="Background Power" value={`${results.PbdBm.toFixed(1)} dBm`} />
            <ResultRow label="Background Power" value={`${results.Pb.toExponential(3)} W`} />
            <ResultRow label="Max FOV (Bg = -30dBm signal)" value={`${results.requiredFov.toFixed(1)} mrad`} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Background Power vs FOV</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.fovRange, y: results.bgPowerVsFov.map((p) => 10 * Math.log10(p * 1000)), line: { color: "#3b82f6", width: 2 } }]}
            layout={{
              xaxis: { title: "Full FOV (mrad)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Background Power (dBm)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Background Power vs Filter BW</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.bwRange, y: results.bgPowerVsBw.map((p) => 10 * Math.log10(p * 1000)), line: { color: "#22c55e", width: 2 } }]}
            layout={{
              xaxis: { title: "Filter Bandwidth (nm)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "Background Power (dBm)", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
