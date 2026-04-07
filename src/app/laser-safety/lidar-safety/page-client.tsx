"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function LidarSafetyPage() {
  const [pulseEnergy, setPulseEnergy] = useState(10); // µJ
  const [repRate, setRepRate] = useState(200); // kHz
  const [pulseWidth, setPulseWidth] = useState(5); // ns
  const [wavelength, setWavelength] = useState(905); // nm
  const [beamDia, setBeamDia] = useState(3); // mm
  const [divergence, setDivergence] = useState(3); // mrad
  const [scanRange, setScanRange] = useState(100); // m

  const avgPower = pulseEnergy * 1e-6 * repRate * 1e3; // W
  const prf = repRate * 1e3; // Hz

  // MPE for 905nm (retinal hazard, single pulse)
  const singlePulseMpeJcm2 = 5e-7; // J/cm² for t < 1 ns to ~10 ns (simplified)
  // For longer pulses
  const tPulse = pulseWidth * 1e-9;
  const mpeSingle = tPulse < 1e-7 ? 5e-7 : 1.8 * Math.pow(tPulse, 0.75) * 1e-3 * 1e-3;

  // Average MPE for scanning (0.25s)
  const avgMpeWcm2 = wavelength <= 700 ? 2.5 : 1.8 / (Math.pow(0.25, 0.75) * 1000);

  // PRF correction
  const nPulses = Math.min(prf * 0.25, 86400);
  const prfCorrection = Math.pow(nPulses, -0.25);
  const correctedMpe = mpeSingle * prfCorrection;

  const beamAreaCm2 = Math.PI * Math.pow(beamDia / 20, 2);
  const pulseEdensity = (pulseEnergy * 1e-6) / beamAreaCm2;
  const safetyRatio = correctedMpe > 0 ? pulseEdensity / correctedMpe : Infinity;

  // NOHD
  const nohd = useMemo(() => {
    const a = (beamDia / 2) / 1000;
    const phi = divergence / 1000;
    const mpeW = avgMpeWcm2 * 1e4; // W/m²
    const factor = 1.27 * avgPower / (mpeW * a * a);
    if (factor <= 1) return 0;
    return (1 / phi) * (Math.sqrt(factor) - 1);
  }, [avgPower, beamDia, divergence, avgMpeWcm2]);

  // Beam at scan range
  const beamDiaAtRange = beamDia + scanRange * divergence;
  const beamAreaAtRange = Math.PI * Math.pow(beamDiaAtRange / 20, 2);
  const pulseDensityAtRange = (pulseEnergy * 1e-6) / beamAreaAtRange;
  const odRequired = safetyRatio > 1 ? Math.ceil(Math.log10(safetyRatio)) : 0;

  const chartData = useMemo(() => {
    const distances = Array.from({ length: 100 }, (_, i) => i * Math.max(nohd, 200) * 1.3 / 100);
    const pulseE = distances.map(z => {
      const bd = beamDia + z * divergence;
      return (pulseEnergy * 1e-6) / (Math.PI * Math.pow(bd / 20, 2)) * 1e6; // µJ/cm²
    });
    const avgIrr = distances.map(z => {
      const bd = beamDia + z * divergence;
      return avgPower / (Math.PI * Math.pow(bd / 20, 2)); // W/cm²
    });
    return [
      { x: distances, y: pulseE, type: "scatter" as const, mode: "lines" as const, name: "Pulse energy density", line: { color: "#60a5fa" },
        yaxis: "y" },
      { x: [0, Math.max(...distances)], y: [correctedMpe * 1e6, correctedMpe * 1e6], type: "scatter" as const, mode: "lines" as const, name: "PRF-corrected MPE", line: { color: "#f87171", dash: "dash" },
        yaxis: "y" },
      { x: distances, y: avgIrr, type: "scatter" as const, mode: "lines" as const, name: "Avg irradiance", line: { color: "#a78bfa" },
        yaxis: "y2" },
    ];
  }, [pulseEnergy, beamDia, divergence, avgPower, correctedMpe, nohd]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="LiDAR Laser Safety Calculator" description="Analyze pulse energy, PRF-corrected MPE, and NOHD for LiDAR systems (905/1550 nm).">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Pulse Energy (µJ)" value={pulseEnergy} onChange={setPulseEnergy} />
        <ValidatedNumberInput label="Rep Rate (kHz)" value={repRate} onChange={setRepRate} />
        <ValidatedNumberInput label="Pulse Width (ns)" value={pulseWidth} onChange={setPulseWidth} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDia} onChange={setBeamDia} />
        <ValidatedNumberInput label="Divergence (mrad)" value={divergence} onChange={setDivergence} step="0.1" />
        <ValidatedNumberInput label="Scan Range (m)" value={scanRange} onChange={setScanRange} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Average Power</p>
          <p className="text-2xl font-bold text-blue-400">{avgPower.toFixed(2)} W</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">PRF-corrected MPE</p>
          <p className="text-2xl font-bold text-green-400">{(correctedMpe * 1e6).toFixed(4)} µJ/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">NOHD (avg power)</p>
          <p className="text-2xl font-bold text-red-400">{nohd.toFixed(1)} m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <p className="text-sm text-gray-400">Pulse E at {scanRange}m</p>
          <p className="text-2xl font-bold text-yellow-400">{(pulseDensityAtRange * 1e6).toFixed(4)} µJ/cm²</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <p>P<sub>avg</sub> = E<sub>p</sub> × f<sub>rep</sub></p>
          <p>MPE<sub>single</sub> ≈ 5 × 10<sup>−7</sup> J/cm² (τ &lt; 100 ns, 400–1050 nm)</p>
          <p>MPE<sub>corrected</sub> = MPE<sub>single</sub> × N<sup>−0.25</sup> where N = f<sub>rep</sub> × T</p>
          <p>E(z) = E<sub>p</sub> / (π(d₀ + zφ)²/4)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Distance (m)", gridcolor: "#374151" },
          yaxis: { title: "Pulse Energy Density (µJ/cm²)", gridcolor: "#374151", type: "log", color: "#60a5fa" },
          yaxis2: { title: "Avg Irradiance (W/cm²)", gridcolor: "#374151", type: "log", overlaying: "y", side: "right", color: "#a78bfa" },
          margin: { t: 30, r: 70, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
