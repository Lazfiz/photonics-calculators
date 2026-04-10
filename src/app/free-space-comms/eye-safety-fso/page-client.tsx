"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function EyeSafetyFsoPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [txPower, setTxPower] = useURLState("txPower", 100); // mW
  const [beamDivergence, setBeamDivergence] = useURLState("beamDivergence", 0.5); // mrad
  const [exposureTime, setExposureTime] = useURLState("exposureTime", 10); // seconds
  const [distance, setDistance] = useURLState("distance", 2); // meters (NOHD calc)

  // MPE and corneal irradiance calculations
  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const lambdaUm = wavelength / 1000;
    const P = txPower / 1000; // W
    const theta = beamDivergence * 1e-3; // rad
    const t = exposureTime; // s

    // Beam radius at distance
    const beamRadius = distance * theta / 2; // m
    const beamArea = Math.PI * beamRadius ** 2; // m²
    const irradiance = P / Math.max(beamArea, 1e-10); // W/m²

    // MPE per IEC 60825-1 / ANSI Z136
    // For 400-1400 nm: retinal hazard region
    // For >1400 nm: corneal/lens hazard
    let mpeWm2: number;
    let mpeJm2: number;
    let classification = "";
    const cA = (wavelength > 700 && wavelength <= 1400) ? Math.max(1, 10 ** ((lambdaUm - 0.7) / 0.5)) : 1;

    if (wavelength >= 400 && wavelength <= 1400) {
      // Retinal hazard: MPE = 1.8 × C_A × t^(-0.25) J/cm² (for t > 0.7s simplified)
      // C_A = 10^((λ-700)/500) per ANSI Z136, λ in μm
      mpeJm2 = 1.8 * cA * Math.pow(t, -0.25) * 1e4; // J/m²
      mpeWm2 = mpeJm2 / t;
      classification = "Retinal Hazard Zone";
    } else if (wavelength > 1400 && wavelength <= 2600) {
      // Corneal hazard: MPE ≈ 100 × t^(-0.25) W/cm² (simplified for IR)
      mpeWm2 = 100 * Math.pow(t, -0.25) * 1e4; // W/m²
      mpeJm2 = mpeWm2 * t;
      classification = "Corneal Hazard Zone";
    } else {
      mpeWm2 = 1000; // UV simplified
      mpeJm2 = mpeWm2 * t;
      classification = "UV Hazard Zone";
    }

    // NOHD (Nominal Ocular Hazard Distance) for diverging beam
    // Beam radius at NOHD: P/(π·r²) = MPE → r = √(P/(π·MPE))
    // Distance: NOHD = r / (θ/2) = 2·√(P/(π·MPE)) / θ
    const nohd = theta > 0 ? 2 * Math.sqrt(P / (Math.PI * mpeWm2)) / theta : Infinity;

    // Safety factor
    const safetyFactor = mpeWm2 / irradiance;

    // AEL for Class 1 (accessible emission limit) per IEC 60825-1
    let ael: number; // watts
    if (wavelength >= 400 && wavelength <= 700) {
      ael = 0.39e-6; // 0.39 μW CW
    } else if (wavelength > 700 && wavelength <= 1400) {
      ael = 0.39e-6 * cA;
    } else {
      ael = 10e-3; // 10 mW for >1400nm (corneal absorption protects retina)
    }

    // Laser classification (simplified per IEC 60825-1)
    let laserClass = "Class 1";
    if (P > 0.5) {
      laserClass = "Class 4"; // > 500 mW
    } else if (P > 5e-3) {
      laserClass = "Class 3B"; // 5–500 mW
    } else if (wavelength >= 400 && wavelength <= 700) {
      if (P > 1e-3) {
        laserClass = "Class 3R"; // 1–5 mW visible
      } else if (P > ael) {
        laserClass = "Class 2"; // AEL–1 mW (blink reflex)
      }
    } else {
      if (P > 5 * ael) {
        laserClass = "Class 3R"; // 5× Class 1 AEL for IR
      }
    }

    // Ocular irradiance at distance
    const ocularIrrWm2 = irradiance;
    const ocularIrrDBm = 10 * Math.log10(ocularIrrWm2 * 1e3);

    return { mpeWm2, mpeJm2, nohd, safetyFactor, irradiance, classification, ael, laserClass, ocularIrrDBm };
  }, [wavelength, txPower, beamDivergence, exposureTime, distance]);

  const plotData = useMemo(() => {
    const P = txPower / 1000;
    const distances = Array.from({ length: 200 }, (_, i) => 0.1 + i * 0.5);
    const theta = beamDivergence * 1e-3;
    const t = exposureTime;
    const lambdaUm = wavelength / 1000;

    let mpeWm2: number;
    if (wavelength >= 400 && wavelength <= 1400) {
      const cA = Math.max(1, 10 ** ((lambdaUm - 0.7) / 0.5));
      mpeWm2 = 1.8 * cA * Math.pow(t, -0.25) * 1e4 / t;
    } else if (wavelength > 1400 && wavelength <= 2600) {
      mpeWm2 = 100 * Math.pow(t, -0.25) * 1e4;
    } else {
      mpeWm2 = 1000;
    }

    const irradiances = distances.map((d) => {
      const r = d * theta / 2;
      return P / Math.max(Math.PI * r ** 2, 1e-10);
    });

    return [
      { x: distances, y: irradiances, type: "scatter", mode: "lines", name: "Irradiance (W/m²)", line: { color: "#06b6d4" } },
      { x: [distances[0], distances[distances.length - 1]], y: [mpeWm2, mpeWm2], type: "scatter", mode: "lines", name: "MPE", line: { color: "#ef4444", dash: "dash" } },
    ];
  }, [txPower, beamDivergence, wavelength, exposureTime]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-5xl mx-auto">
            
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          {[
            ["Wavelength (nm)", wavelength, setWavelength],
            ["TX Power (mW)", txPower, setTxPower],
            ["Beam Divergence (mrad)", beamDivergence, setBeamDivergence],
            ["Exposure Time (s)", exposureTime, setExposureTime],
            ["Distance for Check (m)", distance, setDistance],
          ].map(([label, val, set]: any) => (
            <div key={label as string}>
              <label className="block text-sm text-gray-400 mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
            </div>
          ))}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
            <div className="flex gap-2 flex-wrap">
              {([["1550nm, 100mW", 1550, 100], ["850nm, 10mW", 850, 10], ["1064nm, 50mW", 1064, 50]]).map(([name, w, p]: any) => (
                <button key={name} onClick={() => { setWavelength(w); setTxPower(p); }}
                  className="bg-gray-800 hover:bg-gray-700 text-xs px-2 py-1 rounded text-gray-300">{name}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between"><span className="text-gray-400">Hazard Zone</span><span className="text-yellow-400">{calc.classification}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Laser Class</span><span className={calc.laserClass === "Class 1" ? "text-green-400" : "text-red-400"}>{calc.laserClass}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">MPE (irradiance)</span><span>{calc.mpeWm2.toFixed(1)} W/m²</span></div>
              <div className="flex justify-between"><span className="text-gray-400">MPE (radiant exposure)</span><span>{calc.mpeJm2.toFixed(1)} J/m²</span></div>
              <div className="flex justify-between"><span className="text-gray-400">NOHD</span><span className="text-cyan-300">{calc.nohd.toFixed(2)} m</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Irradiance @ {distance}m</span><span>{calc.irradiance.toFixed(1)} W/m²</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Safety Factor</span><span className={calc.safetyFactor > 1 ? "text-green-400" : "text-red-400"}>{calc.safetyFactor.toFixed(1)}×</span></div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">Irradiance:</strong> E = P / (π r²)</p>
            <p><strong className="text-gray-400">NOHD:</strong> r = √(P / (π × MPE))</p>
            <p><strong className="text-gray-400">400-1400 nm:</strong> Retinal hazard — extended source rules may apply</p>
            <p><strong className="text-gray-400">&gt;1400 nm:</strong> Corneal/lens hazard — generally eye-safe at moderate power</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Distance (m)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
              yaxis: { title: "Irradiance (W/m²)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 70 }, font: { color: "#9ca3af" }, legend: { font: { size: 10 } },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
