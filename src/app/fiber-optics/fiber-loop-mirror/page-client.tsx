"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function FiberLoopMirrorPage() {
  const [couplingRatio, setCouplingRatio] = useURLState("couplingRatio", 50); // %
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 1); // m
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [n_eff, setN_eff] = useURLState("n_eff", 1.468);
  const [dispersion, setDispersion] = useURLState("dispersion", 17); // ps/(nm·km)
  const [birefringence, setBirefringence] = useURLState("birefringence", 5e-7);
  const [includePM, setIncludePM] = useState(true);

  const calc = useMemo(() => {
    const k = couplingRatio / 100;
    const lambda = wavelength * 1e-9;
    const L = fiberLength;
    const beta = 2 * Math.PI * n_eff / lambda;

    // Sagnac loop mirror: reflectance R = 4k(1-k)sin²(βL)
    // For ideal fiber: sin²(βL) varies rapidly, average = 0.5
    // Without PM: average reflectance = 2k(1-k)
    const avgReflectance = 2 * k * (1 - k);
    const peakReflectance = 4 * k * (1 - k);
    const transmission = 1 - avgReflectance;

    // Free spectral range (for birefringent filter configuration)
    const FSR_biref = lambda * lambda / (birefringence * L);

    // With PM fiber: acts as a comb filter
    // Periodic peaks with FSR = λ²/(Δn·L)
    const finesse_biref = includePM ? Math.PI * Math.sqrt(avgReflectance) / (1 - avgReflectance) : 0;

    // Phase shift needed for 50% transmission at k=0.5
    const phaseShift50 = Math.PI / 4;

    // Chromatic dispersion effect on mirror bandwidth
    const D = dispersion * 1e-6; // s/(m²)
    const bandwidthLimit = 1 / (Math.abs(D) * L * 1e12); // THz, simplified

    // Round-trip phase
    const phaseRT = beta * 2 * L;

    return { avgReflectance, peakReflectance, transmission, FSR_biref, finesse_biref, phaseShift50, bandwidthLimit, phaseRT, k };
  }, [couplingRatio, fiberLength, wavelength, n_eff, dispersion, birefringence, includePM]);

  const chartData = useMemo(() => {
    // Reflectance vs coupling ratio
    const ks = Array.from({ length: 100 }, (_, i) => i / 100);
    const avgR = ks.map(k => 2 * k * (1 - k));
    const peakR = ks.map(k => 4 * k * (1 - k));

    // Spectral response for birefringent loop mirror
    const wls = Array.from({ length: 500 }, (_, i) => wavelength - 5 + i * 0.02);
    const specResponse = includePM ? wls.map(wl => {
      const phase = 2 * Math.PI * birefringence * fiberLength / (wl * 1e-9);
      return Math.cos(phase * 0.5) ** 2 * calc.avgReflectance;
    }) : [];

    return [
      { x: ks.map(k => k * 100), y: avgR.map(r => r * 100), type: "scatter" as const, mode: "lines" as const, name: "Avg Reflectance", line: { color: "#f87171" } },
      { x: ks.map(k => k * 100), y: peakR.map(r => r * 100), type: "scatter" as const, mode: "lines" as const, name: "Peak Reflectance", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [couplingRatio, birefringence, fiberLength, includePM]);

  const spectrumData = useMemo(() => {
    if (!includePM) return [];
    const wls = Array.from({ length: 500 }, (_, i) => wavelength - 5 + i * 0.02);
    return [{
      x: wls, y: wls.map(wl => {
        const phase = 2 * Math.PI * birefringence * fiberLength / (wl * 1e-9);
        return Math.cos(phase * 0.5) ** 2 * 100;
      }),
      type: "scatter" as const, mode: "lines" as const, name: "Transmission (%)", line: { color: "#34d399" },
    }];
  }, [includePM, wavelength, birefringence, fiberLength]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Fiber Loop Mirror (Sagnac)" description="Sagnac fiber loop mirror reflectance, spectral response, and birefringent filter design.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Coupling Ratio (%)" value={couplingRatio} onChange={setCouplingRatio} min={0} max={100} />
        <ValidatedNumberInput label="Loop Length (m)" value={fiberLength} onChange={setFiberLength} min={0.01} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} />
        <ValidatedNumberInput label="Birefringence (Δn)" value={birefringence} onChange={setBirefringence} min={0} step="1e-8" />
        <label className="block flex items-center gap-2 mt-4">
          <input type="checkbox" checked={includePM} onChange={e => setIncludePM(e.target.checked)}
            className="bg-gray-900 border-gray-700 rounded" />
          <span className="text-sm text-gray-300">PM Fiber (comb filter)</span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Avg Reflectance</p>
          <p className="text-xl font-bold text-red-400">{(calc.avgReflectance * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className="text-xl font-bold text-blue-400">{(calc.transmission * 100).toFixed(1)}%</p>
        </div>
        {includePM && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">FSR (biref)</p>
              <p className="text-xl font-bold text-green-400">{(calc.FSR_biref * 1e9).toFixed(2)} nm</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-400">Finesse</p>
              <p className="text-xl font-bold text-yellow-400">{calc.finesse_biref.toFixed(2)}</p>
            </div>
          </>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Reflectance: R = 4k(1-k)sin²(βL), avg R = 2k(1-k)</p>
          <p>Transmission: T = 1 - R_avg = 1 - 2k(1-k)</p>
          <p>FSR (birefringent): Δλ = λ² / (Δn · L)</p>
          <p>Round-trip phase: φ = 2βL = 4πn_eff L / λ</p>
          <p>At k=0.5: T = 100% (perfect mirror)</p>
        </div>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        title: { text: "Reflectance vs Coupling Ratio", font: { color: "#e5e7eb", size: 14 } },
        xaxis: { title: "Coupling Ratio (%)", gridcolor: "#374151", range: [0, 100] },
        yaxis: { title: "Reflectance (%)", gridcolor: "#374151", range: [0, 105] },
        legend: { x: 0.6, y: 0.99 },
        margin: { t: 40 },
      }} />

      {includePM && spectrumData.length > 0 && (
        <ChartPanel data={spectrumData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          title: { text: "Spectral Response (PM Loop Mirror)", font: { color: "#e5e7eb", size: 14 } },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Transmission (%)", gridcolor: "#374151" },
          margin: { t: 40 },
        }} />
      )}
    </CalculatorShell>
  );
}
