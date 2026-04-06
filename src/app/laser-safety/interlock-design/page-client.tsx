"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function InterlockDesignPage() {
  const [laserPower, setLaserPower] = useURLState("laserPower", 5000); // mW
  const [wavelength, setWavelength] = useURLState("wavelength", 1064); // nm
  const [beamDiam, setBeamDiam] = useURLState("beamDiam", 5); // mm
  const [shutterTime, setShutterTime] = useURLState("shutterTime", 50); // ms (shutter response)
  const [humanResponse, setHumanResponse] = useURLState("humanResponse", 200); // ms (reaction time)
  const [accessDistance, setAccessDistance] = useURLState("accessDistance", 50); // cm (distance to hazard)

  const results = useMemo(() => {
    const P = laserPower / 1000; // W
    const lam = wavelength / 1000; // µm
    const a = beamDiam / 10; // cm
    const area = Math.PI * (a / 2) ** 2; // cm²
    const t_shutter = shutterTime / 1000; // s
    const t_human = humanResponse / 1000; // s
    const d = accessDistance; // cm

    // Total interlock response time
    const totalResponseTime = t_shutter + t_human;

    // Irradiance from beam
    const irradiance = P / area; // W/cm²

    // MPE at response time
    let mpe: number; // J/cm²
    if (lam >= 0.4 && lam < 0.7) {
      mpe = 1.8e-3 * Math.pow(Math.min(totalResponseTime, 10), 0.75);
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpe = 1.8e-3 * CA * Math.pow(Math.min(totalResponseTime, 10), 0.75);
    } else if (lam >= 1.05 && lam < 1.4) {
      mpe = totalResponseTime > 10 ? 0.1 : 0.01 * totalResponseTime;
    } else if (lam >= 1.4 && lam <= 1.8) {
      mpe = 0.1;
    } else {
      mpe = 1e-3;
    }

    // Fluence during response time
    const fluence = irradiance * totalResponseTime * 1000; // mJ/cm²

    // Hazard ratio
    const hazardRatio = fluence / (mpe * 1000);

    // Maximum safe response time (where fluence = MPE)
    // E * t = MPE(t) -> solve for t
    // For visible: E * t = 1.8e-3 * t^0.75
    // t^0.25 = 1.8e-3 / E
    // t = (1.8e-3 / E)^4
    let maxSafeTime: number;
    if (lam >= 0.4 && lam < 0.7) {
      maxSafeTime = Math.pow(1.8e-3 / irradiance, 4);
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      maxSafeTime = Math.pow((1.8e-3 * CA) / irradiance, 4);
    } else {
      maxSafeTime = 0.01 / irradiance;
    }
    maxSafeTime = Math.max(1e-6, maxSafeTime);

    // Required shutter time (assuming human response fixed)
    const requiredShutterTime = Math.max(0, maxSafeTime - t_human);

    // Interlock class recommendation
    let interlockClass: string;
    let safetyLevel: string;
    if (hazardRatio < 0.1) {
      interlockClass = "Standard Interlock";
      safetyLevel = "Adequate - standard interlock sufficient";
    } else if (hazardRatio < 1) {
      interlockClass = "Fast Interlock";
      safetyLevel = "Marginal - fast shutter recommended";
    } else if (hazardRatio < 10) {
      interlockClass = "Safety-Critical Interlock";
      safetyLevel = "Inadequate - high-speed shutter required";
    } else {
      interlockClass = "Fail-Safe System Required";
      safetyLevel = "DANGEROUS - interlock cannot respond fast enough";
    }

    // IEC 60825-1 time of flight considerations
    // If person can reach hazard zone faster than interlock responds
    const personSpeed = 100; // cm/s (fast arm movement)
    const accessTime = d / personSpeed;
    const accessHazard = accessTime < totalResponseTime;

    return {
      totalResponseTime, irradiance, mpe: mpe * 1000, fluence, hazardRatio,
      maxSafeTime, requiredShutterTime, interlockClass, safetyLevel,
      accessTime, accessHazard,
      shutterSafety: shutterTime <= requiredShutterTime * 1000,
    };
  }, [laserPower, wavelength, beamDiam, shutterTime, humanResponse, accessDistance]);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 200 }, (_, i) => 1e-4 + i * 0.01);
    const fluence = times.map(t => results.irradiance * t * 1000);
    const mpeLine = times.map(t => {
      if (t < 0.25) return 1.8 * Math.pow(t, 0.75);
      if (t < 10) return 1.8 * Math.pow(t, 0.75);
      return 1.8 * Math.pow(10, 0.75);
    });

    return [
      { x: times, y: fluence, type: "scatter" as const, mode: "lines" as const, name: "Actual Fluence", line: { color: "#f87171", width: 2 } },
      { x: times, y: mpeLine, type: "scatter" as const, mode: "lines" as const, name: "MPE (visible)", line: { color: "#60a5fa", dash: "dash" } },
      {
        x: [results.totalResponseTime], y: [results.fluence],
        type: "scatter" as const, mode: "markers" as const, name: "At Interlock Time",
        marker: { color: results.hazardRatio > 1 ? "#ef4444" : "#22c55e", size: 14, symbol: "x" },
      },
    ];
  }, [results]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Interlock Time Calculation" description="Calculates required interlock/shutter response time based on laser hazard level. IEC 60825-1 and ANSI Z136.1 require interlocks to terminate emission before exposure exceeds MPE.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Laser Power (mW)" value={laserPower} onChange={setLaserPower} min={0.001} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={20000} />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDiam} onChange={setBeamDiam} min={0.1} step="0.1" />
        <ValidatedNumberInput label="Shutter Response (ms)" value={shutterTime} onChange={setShutterTime} min={0.1} step="0.1" />
        <ValidatedNumberInput label="Human Reaction Time (ms)" value={humanResponse} onChange={setHumanResponse} min={50} />
        <ValidatedNumberInput label="Access Distance (cm)" value={accessDistance} onChange={setAccessDistance} min={10} />
      </div>

      <div className={`bg-gray-900 border rounded-lg p-6 mb-6 ${results.hazardRatio < 1 ? "border-green-700" : "border-red-700"}`}>
        <p className="text-sm text-gray-400">Interlock Assessment</p>
        <p className={`text-2xl font-bold ${results.hazardRatio < 1 ? "text-green-400" : "text-red-400"}`}>{results.interlockClass}</p>
        <p className="text-sm text-gray-400 mt-2">{results.safetyLevel}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Total Response Time</p>
          <p className="text-3xl font-bold text-blue-400">{(results.totalResponseTime * 1000).toFixed(0)} ms</p>
          <p className="text-sm text-gray-500 mt-1">Shutter + Human reaction</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Fluence During Response</p>
          <p className={`text-3xl font-bold ${results.hazardRatio > 1 ? "text-red-400" : "text-green-400"}`}>{results.fluence.toFixed(2)} mJ/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">MPE at Response Time</p>
          <p className="text-3xl font-bold text-green-400">{results.mpe.toFixed(3)} mJ/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Hazard Ratio</p>
          <p className={`text-3xl font-bold ${results.hazardRatio > 1 ? "text-red-400" : "text-green-400"}`}>{results.hazardRatio.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">{results.hazardRatio < 1 ? "✓ Within MPE" : "✗ EXCEEDS MPE"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Max Safe Response Time</p>
          <p className="text-3xl font-bold text-cyan-400">{(results.maxSafeTime * 1000).toFixed(2)} ms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Required Shutter Time</p>
          <p className="text-3xl font-bold text-purple-400">{Math.max(0, results.requiredShutterTime * 1000).toFixed(2)} ms</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Access Time</p>
          <p className="text-3xl font-bold text-amber-400">{(results.accessTime * 1000).toFixed(0)} ms</p>
          <p className="text-sm text-gray-500 mt-1">{results.accessHazard ? "⚠ Faster than interlock" : "✓ Slower than interlock"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Time (s)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "Fluence (mJ/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-gray-300 text-sm space-y-2 font-mono">
          <p>t<sub>total</sub> = t<sub>shutter</sub> + t<sub>human</sub></p>
          <p>H = E × t<sub>total</sub> (fluence during interlock response)</p>
          <p>MPE = 1.8 × t<sup>0.75</sup> mJ/cm² (visible, t &lt; 10s)</p>
          <p>Hazard ratio = H / MPE(t<sub>total</sub>)</p>
          <p>Max safe time: solve E × t = MPE(t) → t = (1.8/E)<sup>4</sup></p>
          <p>Access time = distance / arm_speed (≈100 cm/s)</p>
          <p>Requirement: t<sub>total</sub> &lt; t<sub>max_safe</sub></p>
        </div>
      </div>
    </CalculatorShell>
  );
}
