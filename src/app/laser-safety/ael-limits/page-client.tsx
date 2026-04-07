"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function AELLimitsPage() {
  const [wavelength, setWavelength] = useState(632);
  const [classification, setClassification] = useState<string>("3B");
  const [emissionDuration, setEmissionDuration] = useState(0.25);

  const classOptions = ["1", "2", "3R", "3B", "4"] as const;

  const ael = useMemo(() => {
    const lam = wavelength / 1000; // µm
    const t = emissionDuration;

    // Simplified AEL formulas per IEC 60825-1 / ANSI Z136
    // Class 1 AEL = MPE × limiting aperture area (roughly)
    // For 400-700nm: Class 1 AEL ≈ 0.39 µW (CW), or 0.2 µJ (pulse)
    // Class 2: 1 mW CW (visible only)
    // Class 3R: 5× Class 2 = 5 mW CW
    // Class 3B: 500 mW CW
    // Class 4: > 500 mW CW

    let aelVal: number; // in mW for CW
    if (lam >= 0.4 && lam < 0.7) {
      switch (classification) {
        case "1": aelVal = 0.00039; break;
        case "2": aelVal = 1.0; break;
        case "3R": aelVal = 5.0; break;
        case "3B": aelVal = 500; break;
        default: aelVal = 500;
      }
    } else {
      switch (classification) {
        case "1": aelVal = 0.001; break;
        case "2": aelVal = 1.0; break;
        case "3R": aelVal = 5.0; break;
        case "3B": aelVal = 500; break;
        default: aelVal = 500;
      }
    }

    // For pulsed, convert to energy: E = P × t
    if (t < 0.25) {
      return aelVal * t * 1000; // return in mJ
    }
    return aelVal; // return in mW
  }, [wavelength, classification, emissionDuration]);

  const unit = emissionDuration < 0.25 ? "mJ" : "mW";
  const quantity = emissionDuration < 0.25 ? "Energy" : "Power";

  const chartData = useMemo(() => {
    const times = Array.from({ length: 100 }, (_, i) => Math.pow(10, -6 + i * 0.08));
    const vals = classOptions.map(cls => {
      let aelBase: number;
      if (cls === "1") aelBase = 0.00039;
      else if (cls === "2") aelBase = 1.0;
      else if (cls === "3R") aelBase = 5.0;
      else if (cls === "3B") aelBase = 500;
      else aelBase = 500;
      return {
        x: times, y: times.map(t => aelBase * t * 1000),
        type: "scatter" as const, mode: "lines" as const,
        name: `Class ${cls}`, line: { color: ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#c084fc"][classOptions.indexOf(cls)] }
      };
    });
    return vals;
  }, []);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety" title="Accessible Emission Limits (AEL)" description="IEC 60825-1 laser classification AEL thresholds. Simplified model for educational reference.">
            
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={180} max={1800} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Classification</span>
          <select value={classification} onChange={e => setClassification(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {classOptions.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Emission Duration (s)" value={emissionDuration} onChange={setEmissionDuration} min={1e-9} max={100} step="any" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <p className="text-sm text-gray-400">Class {classification} AEL ({quantity})</p>
        <p className="text-3xl font-bold text-blue-400">{ael < 0.001 ? ael.toExponential(2) : ael.toFixed(4)} {unit}</p>
        <p className="text-sm text-gray-500 mt-1">λ = {wavelength} nm, t = {emissionDuration} s</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Exposure Time (s)", type: "log", gridcolor: "#374151" },
          yaxis: { title: "AEL (mJ)", type: "log", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </CalculatorShell>
  );
}
