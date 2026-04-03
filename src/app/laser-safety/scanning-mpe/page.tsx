"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ScanningMPEPage() {
  const [wavelength, setWavelength] = useState(532);
  const [beamDiam, setBeamDiam] = useState(0.5); // mm at retina image
  const [scanRate, setScanRate] = useState(100); // Hz
  const [scanAngle, setScanAngle] = useState(30); // degrees
  const [workingDistance, setWorkingDistance] = useState(100); // cm

  // Scanning MPE: when a beam scans across the pupil, dwell time per point is reduced
  // t_dwell = beam_diam / (scan_speed) at the cornea
  // scan_speed = 2π × f × D × sin(θ) (tangential speed)
  // The MPE is evaluated at t_dwell instead of the full exposure time
  // MPE_scan = MPE(t_dwell) for each pass, with correction for multiple passes

  const results = useMemo(() => {
    const lam = wavelength / 1000; // µm
    const D = workingDistance / 100; // m
    const theta = scanAngle * Math.PI / 180;

    // Scan linear speed at the pupil plane
    const scanSpeed = 2 * Math.PI * scanRate * D * Math.sin(theta); // m/s
    const beamDiam_m = beamDiam / 1000; // m

    // Dwell time: time for beam to cross its own diameter
    const tDwell = beamDiam_m / scanSpeed; // seconds

    // For very fast scanning, the reduced MPE at t_dwell can be higher
    // MPE(t) = 1.8e-3 × t^0.75 J/cm² for 400-700nm, t<0.7s
    let mpeDwell: number;
    if (lam >= 0.4 && lam < 0.7) {
      mpeDwell = 1.8e-3 * Math.pow(Math.min(tDwell, 0.7), 0.75);
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpeDwell = 1.8e-3 * CA * Math.pow(Math.min(tDwell, 0.7), 0.75);
    } else {
      mpeDwell = 1e-3 * Math.pow(Math.min(tDwell, 10), 0.75);
    }

    // MPE for stationary beam (t=10s for comparison)
    const tStationary = 10;
    let mpeStationary: number;
    if (lam >= 0.4 && lam < 0.7) {
      mpeStationary = 1e-3 * Math.pow(tStationary, 0.75);
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpeStationary = 1e-3 * CA * Math.pow(tStationary, 0.75);
    } else {
      mpeStationary = 1e-3 * Math.pow(tStationary, 0.75);
    }

    // Number of passes per second
    const passesPerSec = scanRate * 2; // back and forth
    // Correction for multiple passes (if total exposure > 0.25s)
    const totalPulses = passesPerSec * 0.25; // aversion response window
    const Cp = totalPulses > 1 ? Math.pow(totalPulses, -0.25) : 1;
    const mpeScanFinal = mpeDwell * Cp;

    return {
      scanSpeed: scanSpeed * 100, // cm/s
      tDwell: tDwell * 1e6, // µs
      mpeDwell: mpeDwell * 1e6, // µJ/cm²
      mpeStationary: mpeStationary * 1e6, // µJ/cm²
      mpeScanFinal: mpeScanFinal * 1e6,
      Cp,
      benefit: mpeScanFinal / mpeStationary,
    };
  }, [wavelength, beamDiam, scanRate, scanAngle, workingDistance]);

  const chartData = useMemo(() => {
    const rates = Array.from({ length: 150 }, (_, i) => 1 + i * 20);
    const D = workingDistance / 100;
    const theta = scanAngle * Math.PI / 180;

    const dwellTimes = rates.map(f => {
      const speed = 2 * Math.PI * f * D * Math.sin(theta);
      return (beamDiam / 1000) / speed * 1e6; // µs
    });

    const lam = wavelength / 1000;
    const mpeScanVals = rates.map(f => {
      const speed = 2 * Math.PI * f * D * Math.sin(theta);
      const td = (beamDiam / 1000) / speed;
      const tClamp = Math.min(td, 0.7);
      return (1.8e-3 * Math.pow(tClamp, 0.75)) * 1e6;
    });

    return [
      { x: rates, y: dwellTimes, type: "scatter" as const, mode: "lines" as const, name: "Dwell Time (µs)", line: { color: "#fbbf24" }, yaxis: "y" },
      { x: rates, y: mpeScanVals, type: "scatter" as const, mode: "lines" as const, name: "MPE (µJ/cm²)", line: { color: "#60a5fa" }, yaxis: "y2" },
    ];
  }, [wavelength, beamDiam, scanAngle, workingDistance]);

  const layout = {
    paper_bgcolor: "#030712",
    plot_bgcolor: "#030712",
    font: { color: "#9ca3af" },
    xaxis: { title: "Scan Rate (Hz)", gridcolor: "#1f2937", color: "#9ca3af", type: "log" as const },
    yaxis: { title: "Dwell Time (µs)", gridcolor: "#1f2937", color: "#fbbf24", type: "log" as const },
    yaxis2: { title: "MPE (µJ/cm²)", gridcolor: "#1f2937", color: "#60a5fa", overlaying: "y" as const, side: "right" as const },
    margin: { t: 30, b: 50, l: 70, r: 70 },
    legend: { font: { color: "#d1d5db" } },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/laser-safety" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Laser Safety</Link>
      <h1 className="text-3xl font-bold mb-2">Scanned Beam MPE</h1>
      <p className="text-gray-400 mb-8">Calculates the effective MPE for scanning laser beams where dwell time per retinal point is reduced compared to stationary exposure.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Beam Diameter (mm)</label>
          <input type="number" step="0.1" value={beamDiam} onChange={e => setBeamDiam(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Scan Rate (Hz)</label>
          <input type="number" value={scanRate} onChange={e => setScanRate(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Scan Angle (°)</label>
          <input type="number" value={scanAngle} onChange={e => setScanAngle(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Working Distance (cm)</label>
          <input type="number" value={workingDistance} onChange={e => setWorkingDistance(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Dwell Time</div>
          <div className="text-2xl font-bold text-yellow-400">{results.tDwell.toExponential(2)}</div>
          <div className="text-xs text-gray-500">µs</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Scan MPE</div>
          <div className="text-2xl font-bold text-blue-400">{results.mpeScanFinal.toExponential(2)}</div>
          <div className="text-xs text-gray-500">µJ/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Stationary MPE</div>
          <div className="text-2xl font-bold text-red-400">{results.mpeStationary.toExponential(2)}</div>
          <div className="text-xs text-gray-500">µJ/cm²</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Scanning Benefit</div>
          <div className="text-2xl font-bold text-green-400">{results.benefit.toFixed(1)}×</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 font-mono text-sm text-gray-300">
        <p className="text-gray-500 mb-1">Key Formulas:</p>
        <p>v<sub>scan</sub> = 2π × f × D × sin(θ)</p>
        <p>t<sub>dwell</sub> = d<sub>beam</sub> / v<sub>scan</sub></p>
        <p>MPE(t<sub>dwell</sub>) = 1.8×10⁻³ × t<sub>dwell</sub><sup>0.75</sup> J/cm²</p>
        <p className="text-yellow-400 mt-2">⚠ Scanning benefit is limited by minimum angular subtense α<sub>min</sub> = 1.5 mrad</p>
      </div>

      <Plot data={chartData} layout={layout} config={{ responsive: true }} className="w-full h-[400px]" />
    </div>
  );
}
