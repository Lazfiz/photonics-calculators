"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ScintillationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [distance, setDistance] = useURLState("distance", 1); // km
  const [cz, setCz] = useURLState("cz", 1.7e-14); // Cn² m^-2/3
  const [apertureDiameter, setApertureDiameter] = useURLState("apertureDiameter", 0.1); // m
  const [turbulenceModel, setTurbulenceModel] = useState<"weak" | "moderate" | "strong">("weak");

  const results = useMemo(() => {
    const wl = wavelength * 1e-9;
    const L = distance * 1e3;
    const k = 2 * Math.PI / wl;

    // Rytov variance
    const sigmaR2 = 1.23 * Math.pow(cz, 1) * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6);

    // Fried parameter
    const r0 = Math.pow(0.423 * Math.pow(k, 2) * cz * L, -3 / 5);

    // Scintillation index
    let sigmaI2: number;
    if (sigmaR2 < 1) {
      sigmaI2 = sigmaR2; // weak turbulence
    } else {
      sigmaI2 = 1 + 0.86 * Math.pow(sigmaR2, -2 / 5); // moderate-strong
    }

    // Aperture averaging factor
    const D = apertureDiameter;
    const apertureFactor = D > 0 ? Math.pow(1 + 1.062 * Math.pow(sigmaR2, 7 / 6) * Math.pow(D / (Math.sqrt(wl * L)), 2), -7 / 6) : 1;
    const sigmaI2Averaged = sigmaI2 * apertureFactor;

    // Fade probability (log-normal model for weak turbulence)
    const fadeThresholds = Array.from({ length: 50 }, (_, i) => -30 + i * 0.5);
    const fadeProb = fadeThresholds.map((T) => {
      const Tlinear = Math.pow(10, T / 10);
      return 0.5 * (1 - erf(Math.abs(T) / (Math.sqrt(2) * Math.sqrt(sigmaI2Averaged) * 10 * Math.log10(Math.E))));
    });

    // Scintillation vs distance
    const distances = Array.from({ length: 50 }, (_, i) => (i + 1) * 0.05);
    const sigmaR2VsDist = distances.map((d) => {
      const Ld = d * 1e3;
      return 1.23 * cz * Math.pow(k, 7 / 6) * Math.pow(Ld, 11 / 6);
    });

    // Scintillation vs Cn²
    const cn2Range = Array.from({ length: 50 }, (_, i) => 1e-16 * Math.pow(10, i * 3 / 50));
    const sigmaI2VsCn2 = cn2Range.map((c) => {
      const sr2 = 1.23 * c * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6);
      return sr2 < 1 ? sr2 : 1 + 0.86 * Math.pow(sr2, -2 / 5);
    });

    // BER estimate for OOK with scintillation
    const snrPerBit = Array.from({ length: 50 }, (_, i) => 0 + i * 0.5);
    const berWithScint = snrPerBit.map((snr) => {
      const snrLinear = Math.pow(10, snr / 10);
      const effectiveSnr = snrLinear / (1 + sigmaI2Averaged);
      return 0.5 * Math.exp(-effectiveSnr / 2);
    });
    const berNoScint = snrPerBit.map((snr) => {
      const snrLinear = Math.pow(10, snr / 10);
      return 0.5 * Math.exp(-snrLinear / 2);
    });

    return { sigmaR2, r0, sigmaI2, apertureFactor, sigmaI2Averaged, fadeThresholds, fadeProb, distances, sigmaR2VsDist, cn2Range, sigmaI2VsCn2, snrPerBit, berWithScint, berNoScint };
  }, [wavelength, distance, cz, apertureDiameter]);

  return (
    <CalculatorShell backHref="/free-space-comms" backLabel="Free Space Comms" title="Scintillation Index" description="Rytov variance, aperture averaging, and fade probability for atmospheric turbulence.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Parameters</h2>
          {[
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength },
            { label: "Link Distance (km)", val: distance, set: setDistance },
            { label: "Cn² (m⁻²/³)", val: cz, set: setCz },
            { label: "Aperture Diameter (m)", val: apertureDiameter, set: setApertureDiameter },
          ].map(({ label, val, set }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} step="any" />
            </div>
          ))}
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Quick Presets</label>
            <div className="flex gap-2">
              {(["weak", "moderate", "strong"] as const).map((m) => (
                <button key={m} onClick={() => { setCz(m === "weak" ? 1.7e-14 : m === "moderate" ? 5e-14 : 1.7e-13); setTurbulenceModel(m); }}
                  className={`px-3 py-1 text-xs rounded border transition ${turbulenceModel === m ? "bg-blue-600 border-blue-500" : "bg-gray-800 border-gray-700 hover:border-blue-500"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-3">
            <ResultRow label="Rytov Variance σ²R" value={results.sigmaR2.toFixed(4)} />
            <ResultRow label="Fried Parameter r₀" value={`${(results.r0 * 100).toFixed(2)} cm`} />
            <ResultRow label="Scintillation Index σ²I" value={results.sigmaI2.toFixed(4)} />
            <ResultRow label="Aperture Averaging Factor" value={results.apertureFactor.toFixed(4)} />
            <ResultRow label="Averaged σ²I" value={results.sigmaI2Averaged.toFixed(4)} />
            <ResultRow label="Turbulence Regime" value={results.sigmaR2 < 0.3 ? "Weak" : results.sigmaR2 < 5 ? "Moderate" : "Strong"} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">BER with Scintillation (OOK)</h2>
          <ChartPanel data={[
              { type: "scatter" as const, mode: "lines" as const, x: results.snrPerBit, y: results.berNoScint, name: "No scintillation", line: { color: "#3b82f6", dash: "dash" } },
              { type: "scatter" as const, mode: "lines" as const, x: results.snrPerBit, y: results.berWithScint, name: "With scintillation", line: { color: "#ef4444", width: 2 } },
            ]}
            layout={{
              xaxis: { title: "SNR/bit (dB)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "BER", color: "#9ca3af", gridcolor: "#374151", type: "log" },
              margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
              legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
            }}
           
           
          />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Rytov Variance vs Distance</h2>
          <ChartPanel data={[{ type: "scatter" as const, mode: "lines" as const, x: results.distances, y: results.sigmaR2VsDist, line: { color: "#22c55e", width: 2 } }]}
            layout={{
              xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "σ²R", color: "#9ca3af", gridcolor: "#374151" },
              margin: { l: 50, r: 20, t: 20, b: 50 }, paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#d1d5db" },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}

function erf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
