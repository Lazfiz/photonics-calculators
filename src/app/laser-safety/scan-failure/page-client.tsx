"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function ScanFailurePage() {
  const [power, setPower] = useState(1000); // mW
  const [beamDiam, setBeamDiam] = useState(5); // mm
  const [scanAngle, setScanAngle] = useState(60); // degrees total
  const [scanFreq, setScanFreq] = useState(20); // Hz
  const [failDuration, setFailDuration] = useState(0.01); // s

  const results = useMemo(() => {
    const P = power / 1000; // W
    const a = beamDiam / 10; // cm
    const area = Math.PI * (a / 2) ** 2; // cm²
    const irradiance = P / area; // W/cm²

    // Normal scanning: dwell time per point
    const totalAngleRad = (scanAngle * Math.PI) / 180;
    const normalDwellTime = failDuration / (scanFreq * totalAngleRad / (2 * Math.PI));
    // Simplified: dwell ≈ beam_diam / (scan_speed)
    const scanSpeed = scanFreq * 2 * scanAngle; // deg/s
    const beamWidthDeg = (beamDiam / 1000) / (0.01) * (180 / Math.PI); // rough angular beam width
    const normalDwell = beamWidthDeg / scanSpeed; // seconds

    // If scanner fails: beam dwells at single point for failDuration
    const failedIrradiance = irradiance; // W/cm² at single point
    const failedFluence = failedIrradiance * failDuration * 1000; // mJ/cm²

    // MPE for aversion response time
    const mpeAversion = 1.8 * Math.pow(0.25, 0.75); // mJ/cm² (visible)
    const mpeFailTime = 1.8 * Math.pow(failDuration, 0.75); // mJ/cm²

    const ratio = failedFluence / mpeFailTime;
    const aversionRatio = failedFluence / mpeAversion;

    // Scan failure distance where fluence drops to MPE
    // At distance r, beam area grows, irradiance drops
    // Simplified: NOHD for static beam at given power
    const mpeIrr = mpeFailTime / (failDuration * 1000); // W/cm²
    const safeDist = Math.sqrt(P / (Math.PI * mpeIrr)); // cm (approximate)

    return {
      irradiance,
      normalDwell,
      failedFluence,
      mpeAversion,
      mpeFailTime,
      ratio,
      aversionRatio,
      safeDist,
      scanSpeed,
    };
  }, [power, beamDiam, scanAngle, scanFreq, failDuration]);

  const chartData = useMemo(() => {
    const times = Array.from({ length: 200 }, (_, i) => 1e-4 + i * 5e-4);
    const fluence = times.map(t => results.irradiance * t * 1000);
    const mpeLine = times.map(t => 1.8 * Math.pow(t, 0.75));

    return [
      { x: times, y: fluence, type: "scatter" as const, mode: "lines" as const, name: "Fluence at failure", line: { color: "#f87171", width: 2 } },
      { x: times, y: mpeLine, type: "scatter" as const, mode: "lines" as const, name: "MPE", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [results]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Scan Failure Analysis" description="Analyzes hazard when a scanning laser fails to scan, causing the beam to dwell on a single point. IEC 60825-1 scan failure assessment.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Power (mW)" value={power} onChange={setPower} min={0.1} step="any" />
        <ValidatedNumberInput label="Beam Diameter (mm)" value={beamDiam} onChange={setBeamDiam} min={0.1} step="0.1" />
        <ValidatedNumberInput label="Scan Angle (°)" value={scanAngle} onChange={setScanAngle} min={1} max={360} />
        <ValidatedNumberInput label="Scan Frequency (Hz)" value={scanFreq} onChange={setScanFreq} min={1} />
        <ValidatedNumberInput label="Failure Duration (s)" value={failDuration} onChange={setFailDuration} min={1e-6} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Beam Irradiance</p>
          <p className="text-3xl font-bold text-blue-400">{results.irradiance.toFixed(2)} W/cm²</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Fluence at Failure</p>
          <p className={`text-3xl font-bold ${results.ratio > 1 ? "text-red-400" : "text-green-400"}`}>{results.failedFluence.toFixed(3)} mJ/cm²</p>
          <p className="text-sm text-gray-500 mt-1">t = {failDuration} s</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Hazard Ratio (vs MPE at t_fail)</p>
          <p className={`text-3xl font-bold ${results.ratio > 1 ? "text-red-400" : "text-green-400"}`}>{results.ratio.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Hazard Ratio (vs aversion MPE)</p>
          <p className={`text-3xl font-bold ${results.aversionRatio > 1 ? "text-red-400" : "text-green-400"}`}>{results.aversionRatio.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Exposure Time (s)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "Fluence (mJ/cm²)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-gray-300 text-sm space-y-2 font-mono">
          <p>H = E × t (fluence at failure point)</p>
          <p>MPE = 1.8 × t<sup>0.75</sup> mJ/cm² (visible, t &lt; 10s)</p>
          <p>Hazard ratio = H / MPE(t<sub>fail</sub>)</p>
          <p>Scan speed = 2 × f × θ (deg/s)</p>
          <p>Normal dwell ≈ beam_width / scan_speed</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
