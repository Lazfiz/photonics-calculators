"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function FiberGyroscopePage() {
  const [coilDiameter, setCoilDiameter] = useState(100); // mm
  const [fiberLength, setFiberLength] = useState(500); // m
  const [wavelength, setWavelength] = useState(1550); // nm
  const [n_core, setN_core] = useState(1.468);
  const [sourcePower, setSourcePower] = useState(10); // mW
  const [detectorNoise, setDetectorNoise] = useState(-150); // dBm/√Hz
  const [sourceRIN, setSourceRIN] = useState(-160); // dB/Hz
  const [losses, setLosses] = useState(3); // dB total round-trip

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const R = coilDiameter * 1e-3 / 2; // radius in m
    const A = Math.PI * R * R; // coil area
    const N = 1; // number of turns (effective for Sagnac)
    const L = fiberLength;

    // Sagnac effect: Δφ = 8πNAΩ / (λc)
    // Scale factor: S = 4πLA / (λc) (rad/s per rad/s)
    const c = 3e8;
    const scaleFactor = 4 * Math.PI * L * A / (lambda * c); // rad/(rad/s)
    const sagnacConst = 8 * Math.PI * L * A / (lambda * c); // Δφ = sagnacConst × Ω

    // For Earth rotation: Ω = 15°/h = 7.27e-5 rad/s
    const earthRotation = 7.27e-5;
    const phaseEarth = sagnacConst * earthRotation;

    // Noise
    const P_det = sourcePower * 1e-3 * Math.pow(10, -losses / 10);
    const shotNoise = Math.sqrt(2 * 6.626e-34 * 3e8 / (lambda * P_det)); // rad/√Hz
    const thermalNoise = 1e-7; // rad/√Hz (typical)
    const RIN_noise = Math.pow(10, sourceRIN / 20) * P_det / (2 * 6.626e-34 * 3e8 / lambda); // simplified

    // Angle random walk
    const ARW_shot = shotNoise / scaleFactor; // (rad/s)/√Hz
    const ARW_deg = ARW_shot * (180 / Math.PI) * 3600; // deg/√hr

    // Bias stability
    const biasStability = thermalNoise / scaleFactor * (180 / Math.PI) * 3600; // deg/hr

    // Minimum detectable rotation rate
    const minOmega = shotNoise / sagnacConst; // rad/s

    // Number of turns in coil
    const turns = L / (2 * Math.PI * R);
    const coilVolume = A * 2 * Math.PI * R * turns * 1e9; // mm³ (simplified)

    return { scaleFactor, sagnacConst, phaseEarth, shotNoise, ARW_deg, biasStability, minOmega, turns, coilVolume, P_det };
  }, [coilDiameter, fiberLength, wavelength, n_core, sourcePower, detectorNoise, sourceRIN, losses]);

  const chartData = useMemo(() => {
    // ARW vs fiber length
    const lengths = Array.from({ length: 100 }, (_, i) => 50 + i * 20);
    const ARWs = lengths.map(L => {
      const R = coilDiameter * 1e-3 / 2;
      const A = Math.PI * R * R;
      const lambda = wavelength * 1e-9;
      const sf = 4 * Math.PI * L * A / (lambda * 3e8);
      const P = sourcePower * 1e-3 * Math.pow(10, -losses / 10);
      const sn = Math.sqrt(2 * 6.626e-34 * 3e8 / (lambda * P));
      return sn / sf * (180 / Math.PI) * 3600;
    });

    // Phase shift vs rotation rate
    const omegas = Array.from({ length: 100 }, (_, i) => i * 0.01);
    const phases = omegas.map(o => calc.sagnacConst * o);

    return [
      { x: lengths, y: ARWs, type: "scatter" as const, mode: "lines" as const, name: "ARW (°/√hr)", line: { color: "#f87171" }, xaxis: "x", yaxis: "y" },
      { x: omegas, y: phases, type: "scatter" as const, mode: "lines" as const, name: "Δφ (rad)", line: { color: "#60a5fa" }, xaxis: "x2", yaxis: "y2" },
    ];
  }, [coilDiameter, fiberLength, wavelength, sourcePower, losses]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Optic Gyroscope (FOG)" description="Sagnac effect, scale factor, angle random walk, and bias stability for fiber optic gyroscopes.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Coil Diameter (mm)</span>
          <input type="number" value={coilDiameter} onChange={e => setCoilDiameter(+e.target.value)} min={1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fiber Length (m)</span>
          <input type="number" value={fiberLength} onChange={e => setFiberLength(+e.target.value)} min={1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} min={400}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Source Power (mW)</span>
          <input type="number" value={sourcePower} onChange={e => setSourcePower(+e.target.value)} min={0.01} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Round-trip Losses (dB)</span>
          <input type="number" value={losses} onChange={e => setLosses(+e.target.value)} min={0} step="any"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Scale Factor</p>
          <p className="text-xl font-bold text-red-400">{calc.scaleFactor.toExponential(3)}</p>
          <p className="text-xs text-gray-500">rad/(rad/s)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">ARW (shot)</p>
          <p className="text-xl font-bold text-blue-400">{calc.ARW_deg.toFixed(4)} °/√hr</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Earth Δφ</p>
          <p className="text-xl font-bold text-green-400">{calc.phaseEarth.toExponential(3)} rad</p>
          <p className="text-xs text-gray-500">@ 15°/hr rotation</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Min Ω</p>
          <p className="text-xl font-bold text-yellow-400">{(calc.minOmega * 180 / Math.PI * 3600).toFixed(4)} °/hr</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Sagnac: Δφ = 8πNALΩ / (λc)</p>
          <p>Scale factor: S = 4πLA / (λc)</p>
          <p>Shot noise: σ_φ = √(2hc / (λP_det))</p>
          <p>ARW = σ_φ / S [rad/s/√Hz]</p>
          <p>Min detectable: Ω_min = σ_φ × λc / (8πLA)</p>
          <p>c = 3×10⁸ m/s, h = 6.626×10⁻³⁴ J·s</p>
        </div>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Fiber Length (m)", gridcolor: "#374151", domain: [0, 0.48] },
        yaxis: { title: "ARW (°/√hr)", gridcolor: "#374151" },
        xaxis2: { title: "Rotation Rate (rad/s)", gridcolor: "#374151", anchor: "y2", domain: [0.55, 1] },
        yaxis2: { title: "Phase Shift (rad)", gridcolor: "#374151", anchor: "x2" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30 },
      }} />
    </CalculatorShell>
  );
}
