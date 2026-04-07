"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function NonzeroDispersionPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [length, setLength] = useURLState("length", 80); // km
  const [dispSlope, setDispSlope] = useURLState("dispSlope", 0.05); // ps/(nm²·km)
  const [dispAt1550, setDispAt1550] = useURLState("dispAt1550", 4.5); // ps/(nm·km) - typical NZ-DSF
  const [zeroDispWl, setZeroDispWl] = useURLState("zeroDispWl", 1450); // nm
  const [channelSpacing, setChannelSpacing] = useURLState("channelSpacing", 100); // GHz
  const [channels, setChannels] = useURLState("channels", 40);

  const calc = useMemo(() => {
    const lam = wavelength;
    // D(λ) = S₀/4 · (λ - λ⁴₀/λ³)  [Sellmeier approx]
    // Or linear: D(λ) = D(1550) + S · (λ - 1550)
    const D = dispAt1550 + dispSlope * (lam - 1550);
    // Also using zero-dispersion wavelength model
    const D2 = (dispSlope / 4) * (lam - Math.pow(zeroDispWl, 4) / Math.pow(lam, 3));

    // Accumulated dispersion
    const totalDisp = D * length;

    // SPM-induced spectral broadening limit
    const bitRate = channelSpacing * 1e9; // approximate
    const bwLimit = Math.abs(D) > 0 ? 1 / (Math.abs(D) * length) : Infinity; // nm

    // FWM efficiency consideration
    // Phase mismatch: Δβ = 2π · D · Δλ² / λ²
    const deltaLambda = channelSpacing / (3e5 / lam * 1e-3); // nm spacing
    const deltaBeta = 2 * Math.PI * D * 1e-6 * Math.pow(deltaLambda, 2) / Math.pow(lam * 1e-9, 2);

    // Compare to standard SMF and DSF
    const dSMF = 17 + 0.056 * (lam - 1550); // ps/(nm·km)
    const dDSF = -1 + 0.05 * (lam - 1550); // ps/(nm·km)

    return { D, D2, totalDisp, bwLimit, deltaBeta, dSMF, dDSF };
  }, [wavelength, length, dispSlope, dispAt1550, zeroDispWl, channelSpacing]);

  const dispCurveData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 1300 + i * 3);
    const nzdsf = wls.map(wl => dispAt1550 + dispSlope * (wl - 1550));
    const smf = wls.map(wl => 17 + 0.056 * (wl - 1550));
    const dsf = wls.map(wl => -1 + 0.05 * (wl - 1550));

    return [
      { x: wls, y: smf, type: "scatter" as const, mode: "lines" as const, name: "SMF (G.652)", line: { color: "#f87171", dash: "dash" } },
      { x: wls, y: dsf, type: "scatter" as const, mode: "lines" as const, name: "DSF (G.653)", line: { color: "#a78bfa", dash: "dot" } },
      { x: wls, y: nzdsf, type: "scatter" as const, mode: "lines" as const, name: "NZ-DSF (G.655)", line: { color: "#34d399", width: 2.5 } },
      { x: [wavelength], y: [calc.D], type: "scatter" as const, mode: "markers" as const, name: "Selected λ", marker: { color: "#fbbf24", size: 12 } },
    ];
  }, [wavelength, dispSlope, dispAt1550]);

  const accumulatedData = useMemo(() => {
    const lengths = Array.from({ length: 100 }, (_, i) => i + 1);
    return [
      { x: lengths, y: lengths.map(l => l * calc.dSMF), type: "scatter" as const, mode: "lines" as const, name: "SMF", line: { color: "#f87171" } },
      { x: lengths, y: lengths.map(l => l * calc.dDSF), type: "scatter" as const, mode: "lines" as const, name: "DSF", line: { color: "#a78bfa" } },
      { x: lengths, y: lengths.map(l => l * calc.D), type: "scatter" as const, mode: "lines" as const, name: "NZ-DSF", line: { color: "#34d399", width: 2 } },
      { x: [length, length], y: [0, 3000], type: "scatter" as const, mode: "lines" as const, name: "Link length", line: { color: "#fbbf24", dash: "dash" } },
    ];
  }, [length, calc]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Non-Zero Dispersion Shifted Fiber (NZ-DSF)" description="Design NZ-DSF fibers (G.655) with optimized dispersion for DWDM systems — balancing dispersion and nonlinearity.">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={1300} max={1650} />
        <ValidatedNumberInput label="Link Length (km)" value={length} onChange={setLength} min={1} />
        <ValidatedNumberInput label="D @ 1550 nm (ps/nm/km)" value={dispAt1550} onChange={setDispAt1550} step="0.1" />
        <ValidatedNumberInput label="Dispersion Slope S₀ (ps/nm²/km)" value={dispSlope} onChange={setDispSlope} step="0.001" />
        <ValidatedNumberInput label="Channel Spacing (GHz)" value={channelSpacing} onChange={setChannelSpacing} min={25} />
        <ValidatedNumberInput label="Zero Dispersion λ₀ (nm)" value={zeroDispWl} onChange={setZeroDispWl} min={1300} max={1550} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">D(λ) NZ-DSF</p>
          <p className="text-xl font-bold text-green-400">{calc.D.toFixed(2)} ps/nm/km</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Dispersion</p>
          <p className="text-xl font-bold text-yellow-400">{calc.totalDisp.toFixed(0)} ps/nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">BW Limit (1/disp)</p>
          <p className="text-xl font-bold text-blue-400">{calc.bwLimit === Infinity ? "∞" : calc.bwLimit.toFixed(1)} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">SMF Comparison</p>
          <p className="text-xl font-bold text-red-400">{calc.dSMF.toFixed(1)} ps/nm/km</p>
          <p className="text-xs text-gray-500">{(calc.dSMF / Math.max(Math.abs(calc.D), 0.01)).toFixed(1)}× NZ-DSF</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Chromatic Dispersion vs Wavelength</h3>
        <ChartPanel data={dispCurveData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "D (ps/nm·km)", color: "#9ca3af", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 380,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
          shapes: [{ type: "line" as const, x0: 0, x1: 1700, y0: 0, y1: 0, line: { color: "#6b7280", width: 1, dash: "dot" } }],
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Accumulated Dispersion vs Distance</h3>
        <ChartPanel data={accumulatedData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Total Dispersion (ps/nm)", color: "#9ca3af", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>D(λ) = D(1550) + S₀ · (λ - 1550)</p>
          <p>D(λ) = S₀/4 · (λ - λ₀⁴/λ³) [zero-dispersion model]</p>
          <p>σ_total = D · L · Δλ [dispersion-induced pulse broadening]</p>
          <p>Δβ_FWM = 2πD·Δλ²/λ² [FWM phase mismatch]</p>
          <p>G.655: 1 ≤ |D| ≤ 10 ps/(nm·km) @ 1530-1565nm</p>
          <p>Trade-off: Low D → more FWM; High D → more compensation needed</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
