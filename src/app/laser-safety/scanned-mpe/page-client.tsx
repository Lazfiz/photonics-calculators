"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import LaserSafetyDisclaimer from "../../../components/laser-safety-disclaimer";
import LaserSafetyQuarantineBanner from "../../../components/laser-safety-quarantine-banner";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ScannedMPEPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 532); // nm
  const [scanFreq, setScanFreq] = useURLState("scanFreq", 1000); // Hz
  const [spotDiam, setSpotDiam] = useURLState("spotDiam", 0.5); // mm (1/e²)
  const [scanWidth, setScanWidth] = useURLState("scanWidth", 50); // mm total scan width

  // For scanned beams, the MPE is modified:
  // If a point on the retina is exposed for less than 10s,
  // use single-pulse MPE. Otherwise use CW MPE.
  //
  // Dwell time per spot: t_dwell ≈ d / (f × W)
  // where d = spot diameter, f = scan freq, W = scan width
  //
  // Modified MPE for scanning:
  // MPE_scan = MPE_CW × (t_dwell / T_max)^(1/4) for t_dwell < T_max
  // where T_max = 10s for visible

  const results = useMemo(() => {
    const lam = wavelength / 1000; // µm
    const d_cm = spotDiam / 10; // cm
    const W_cm = scanWidth / 10; // cm

    // Dwell time
    const tDwell = d_cm / (scanFreq * W_cm); // seconds

    // CW MPE for visible (400-700nm): 1.8×10⁻³ × t^0.75 J/cm² for t ≤ 10s
    // For t > 10s: MPE = 1.8×10⁻³ × 10^0.75 = 10.1 mJ/cm² (constant)
    const tEff = Math.min(tDwell, 10);
    let mpeCW: number; // J/cm²
    if (lam >= 0.4 && lam < 0.7) {
      mpeCW = 1.8e-3 * Math.pow(tEff, 0.75);
    } else if (lam >= 0.7 && lam < 1.05) {
      const CA = Math.pow(10, 0.02 * (lam - 0.7));
      mpeCW = 1.8e-3 * CA * Math.pow(tEff, 0.75);
    } else {
      mpeCW = 1.8e-3 * Math.pow(tEff, 0.75);
    }

    // Scanned MPE modification factor
    // N = number of pulses at a point = f × t_dwell (should be ≤ 1 for single pass)
    // If N > 1 (multiple passes), apply repetition rate correction
    const N = scanFreq * tDwell;
    const nCorrected = Math.max(N, 1);

    // Repetition MPE: MPE_rep = MPE_single × n^(-1/4)
    const mpeSinglePulse = 1.8e-3 * Math.pow(1e-3, 0.75); // ~1µs approximation
    let mpeScanned: number;
    if (tDwell >= 10) {
      mpeScanned = mpeCW;
    } else {
      mpeScanned = mpeCW;
      // Apply multiple-pass correction if applicable
      if (nCorrected > 1) {
        mpeScanned = mpeSinglePulse * Math.pow(nCorrected, -0.25);
      }
    }

    return { tDwell, mpeCW, mpeScanned, N: nCorrected };
  }, [wavelength, scanFreq, spotDiam, scanWidth]);

  const chartData = useMemo(() => {
    const freqs = Array.from({ length: 100 }, (_, i) => 10 + (i / 99) * 9990);
    const mpeValues = freqs.map(f => {
      const td = (spotDiam / 10) / (f * (scanWidth / 10));
      const tEff = Math.min(td, 10);
      const lam = wavelength / 1000;
      let mpe = 1.8e-3 * Math.pow(tEff, 0.75);
      if (lam >= 0.7 && lam < 1.05) mpe *= Math.pow(10, 0.02 * (lam - 0.7));
      return mpe * 1000; // mJ/cm²
    });
    const dwellTimes = freqs.map(f => (spotDiam / 10) / (f * (scanWidth / 10)));
    return { freqs, mpeValues, dwellTimes };
  }, [wavelength, spotDiam, scanWidth]);

  return (
    <CalculatorShell backHref="/laser-safety" backLabel="Laser Safety">
      <LaserSafetyDisclaimer />
      <LaserSafetyQuarantineBanner />
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-3xl font-bold mb-2">Scanned Beam MPE</h1>
        <p className="text-gray-400 mb-8">Calculate MPE for scanned laser beams based on dwell time per point.</p>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Formulas</h2>
          <div className="bg-[#0d0d14] rounded-lg p-4 font-mono text-sm space-y-2">
            <p>t<sub>dwell</sub> = d / (f × W)</p>
            <p>MPE<sub>CW</sub> = 1.8×10⁻³ × t^0.75 J/cm²  (400–700 nm, t ≤ 10s)</p>
            <p>MPE<sub>scan</sub> = MPE<sub>CW</sub>(t<sub>dwell</sub>)  for single-pass</p>
            <p>Repetition: MPE<sub>rep</sub> = MPE<sub>single</sub> × N^(−1/4)</p>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
              <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="1" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Scan Frequency (Hz)</label>
              <ValidatedNumberInput label="Scan Frequency (Hz)" value={scanFreq} onChange={setScanFreq} step="100" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Spot Diameter (mm, 1/e²)</label>
              <ValidatedNumberInput label="Spot Diameter (mm, 1/e²)" value={spotDiam} onChange={setSpotDiam} step="0.1" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Scan Width (mm)</label>
              <ValidatedNumberInput label="Scan Width (mm)" value={scanWidth} onChange={setScanWidth} step="1" />
            </div>
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Dwell Time", value: results.tDwell < 0.001 ? results.tDwell.toExponential(2) : results.tDwell.toFixed(4), unit: "s" },
              { label: "CW MPE", value: (results.mpeCW * 1000).toFixed(3), unit: "mJ/cm²" },
              { label: "Scanned MPE", value: (results.mpeScanned * 1000).toFixed(3), unit: "mJ/cm²" },
              { label: "Pulses at point", value: results.N.toFixed(2), unit: "" },
            ].map(item => (
              <div key={item.label} className="bg-[#0d0d14] rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-xl font-bold">{item.value} <span className="text-sm text-gray-400">{item.unit}</span></p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#12121a] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">MPE vs Scan Frequency</h2>
          <ChartPanel
            data={[
              {
                x: chartData.freqs, y: chartData.mpeValues, type: "scatter", mode: "lines",
                name: "MPE (mJ/cm²)", line: { color: "#3b82f6", width: 2 },
              },
              {
                x: chartData.freqs, y: chartData.dwellTimes.map(t => t * 1000), type: "scatter", mode: "lines",
                name: "Dwell time (ms)", line: { color: "#f59e0b", width: 2, dash: "dash" },
                yaxis: "y2",
              },
            ]}
            layout={{
              xaxis: { title: "Scan Frequency (Hz)", color: "#9ca3af", gridcolor: "#1f2937", type: "log" },
              yaxis: { title: "MPE (mJ/cm²)", color: "#9ca3af", gridcolor: "#1f2937" },
              yaxis2: { title: "Dwell time (ms)", color: "#f59e0b", overlaying: "y", side: "right", gridcolor: "transparent" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" }, legend: { orientation: "h", y: -0.2 },
              margin: { t: 30, r: 70, b: 60, l: 70 },
            }}
           
           
          />
        </div>
      </div>
    </CalculatorShell>
  );
}
