"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ElectronSpectroscopyPage() {
  const [photonEnergy, setPhotonEnergy] = useURLState("photonEnergy", 1486.6); // Al Kα
  const [bindingEnergy, setBindingEnergy] = useURLState("bindingEnergy", 285); // C 1s
  const [workFunction, setWorkFunction] = useURLState("workFunction", 4.5);
  const [analyzerWorkFunction, setAnalyzerWorkFunction] = useURLState("analyzerWorkFunction", 4.2);
  const [fwhm, setFwhm] = useURLState("fwhm", 1.2);
  const [temperature, setTemperature] = useURLState("temperature", 300);

  // Einstein photoelectric equation: E_k = hν - E_B - φ_analyzer
  // If E_k ≤ 0, no photoelectron is emitted (below threshold)
  const kineticEnergy = photonEnergy - bindingEnergy - analyzerWorkFunction;
  const alFermi = 1486.6;
  const mgFermi = 1253.6;
  const heI = 21.22;

  // IMFP (inelastic mean free path) — Seah-Dench universal curve (nm)
  // λ = 143/E_k² + 0.054√E_k  (Seah & Dench, Surf. Interface Anal. 1979)
  const imfp = kineticEnergy > 0 ? 143 / (kineticEnergy * kineticEnergy) + 0.054 * Math.sqrt(kineticEnergy) : NaN;
  const infoDepth = imfp > 0 ? 3 * imfp : NaN;

  const spectrumData = useMemo(() => {
    const bes = Array.from({ length: 800 }, (_, i) => 0 + (i / 800) * photonEnergy);
    // Simulate XPS spectrum with peaks
    const peaks = [
      { name: "C 1s", center: 285, width: fwhm, amp: 100, color: "#60a5fa" },
      { name: "C 1s (C-O)", center: 286.5, width: fwhm * 1.2, amp: 40, color: "#60a5fa" },
      { name: "C 1s (C=O)", center: 288, width: fwhm * 1.3, amp: 25, color: "#60a5fa" },
      { name: "O 1s", center: 532, width: fwhm * 1.1, amp: 70, color: "#f87171" },
      { name: "N 1s", center: 400, width: fwhm * 1.2, amp: 30, color: "#34d399" },
      { name: "Valence band", center: 10, width: 5, amp: 15, color: "#fbbf24" },
    ];

    // Pre-compute Gaussian intensities for Shirley-like background (smooth integral)
    const gaussianIntensities = bes.map(be => {
      let intensity = 0;
      for (const p of peaks) {
        intensity += p.amp * Math.exp(-4 * Math.LN2 * Math.pow((be - p.center) / p.width, 2));
      }
      return intensity;
    });

    // Asymmetric Doniach-Šunjić lineshape (simplified with Gaussian + exponential tail)
    const spectrum = bes.map((be, idx) => {
      let intensity = 0;
      for (const p of peaks) {
        const gauss = p.amp * Math.exp(-4 * Math.LN2 * Math.pow((be - p.center) / p.width, 2));
        const asym = be < p.center ? 0 : p.amp * 0.3 * Math.exp(-(be - p.center) / (p.width * 2));
        intensity += gauss + asym;
      }
      // Shirley-like background: smooth integral of peak intensity
      // (integrated from high-BE side, normalized)
      const totalIntegral = gaussianIntensities.reduce((sum, v) => sum + v, 0);
      const integratedFromRight = gaussianIntensities.slice(idx).reduce((sum, v) => sum + v, 0);
      intensity += 0.05 * (totalIntegral > 0 ? integratedFromRight : 0);
      return intensity;
    });

    return [
      { x: bes, y: spectrum, type: "scatter" as const, mode: "lines" as const, name: "XPS Spectrum", line: { color: "#e5e7eb", width: 1.5 } },
      { x: bes, y: bes.map(be => {
        const p = peaks[0];
        return p.amp * Math.exp(-4 * Math.LN2 * Math.pow((be - p.center) / p.width, 2));
      }), type: "scatter" as const, mode: "lines" as const, name: "C 1s fit", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [photonEnergy, fwhm]);

  const depthData = useMemo(() => {
    const depths = Array.from({ length: 200 }, (_, i) => (i / 200) * 100); // nm
    // IMFP (inelastic mean free path) — Seah-Dench universal curve (nm)
    const ke = kineticEnergy;
    const lambda = ke > 0 ? 143 / (ke * ke) + 0.054 * Math.sqrt(ke) : 1; // fallback for chart
    const attenuation = depths.map(d => Math.exp(-d / lambda));
    return [
      { x: depths, y: attenuation.map(a => a * 100), type: "scatter" as const, mode: "lines" as const, name: "Signal", line: { color: "#60a5fa", width: 2 } },
      { x: [lambda, lambda], y: [0, 100], type: "scatter" as const, mode: "lines" as const, name: "λ (IMFP)", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [kineticEnergy]);

  const infoDepth = 3 * imfp;

  const xraySources = [
    { name: "Al Kα", energy: 1486.6, ke: (1486.6 - bindingEnergy - analyzerWorkFunction).toFixed(1) },
    { name: "Mg Kα", energy: 1253.6, ke: (1253.6 - bindingEnergy - analyzerWorkFunction).toFixed(1) },
    { name: "Ag Lα", energy: 2984.3, ke: (2984.3 - bindingEnergy - analyzerWorkFunction).toFixed(1) },
    { name: "He I (UPS)", energy: 21.22, ke: (21.22 - bindingEnergy - analyzerWorkFunction).toFixed(1) },
  ];

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Electron Spectroscopy (XPS/UPS)" description="Photoelectron spectroscopy for surface composition, chemical state, and electronic structure.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Photon Energy (eV)" value={photonEnergy} onChange={setPhotonEnergy} min={10} max={10000} />
        <ValidatedNumberInput label="Binding Energy of Interest (eV)" value={bindingEnergy} onChange={setBindingEnergy} min={0} max={2000} />
        <ValidatedNumberInput label="Sample Work Function (eV)" value={workFunction} onChange={setWorkFunction} min={1} max={6} />
        <ValidatedNumberInput label="Peak FWHM (eV)" value={fwhm} onChange={setFwhm} min={0.1} max={5} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Einstein:</span> E<sub>k</sub> = hν − E<sub>B</sub> − ϕ</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">IMFP (Seah-Dench):</span> λ = 143/(E<sub>k</sub>²) + 0.054√E<sub>k</sub> nm</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Attenuation:</span> I(d) = I₀ exp(−d/λ)</p>
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">Info depth:</span> ~3λ (95% signal from this depth)</p>
        <p className="text-xs text-gray-500 mt-1">Note: φ_sample cancels for grounded conductors in XPS (Fermi level alignment). For UPS spectral cutoff, φ_sample is relevant.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-blue-400">{kineticEnergy > 0 ? kineticEnergy.toFixed(1) + " eV" : "Below threshold"}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-green-400">{!isNaN(imfp) ? imfp.toFixed(1) + " nm" : "N/A"}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-yellow-400">{!isNaN(infoDepth) ? infoDepth.toFixed(1) + " nm" : "N/A"}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-red-400">{!isNaN(infoDepth) ? (infoDepth < 30 ? "High" : infoDepth < 60 ? "Medium" : "Bulk") : "N/A"}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Simulated XPS Spectrum</h3>
        <ChartPanel data={spectrumData} layout={{
          xaxis: { title: "Binding Energy (eV)", gridcolor: "#374151", color: "#9ca3af", autorange: "reversed" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151", color: "#9ca3af" },
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          legend: { orientation: "h", y: -0.2 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Surface Sensitivity (IMFP Attenuation)</h3>
        <ChartPanel data={depthData} layout={{
          xaxis: { title: "Depth (nm)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Signal (%)", gridcolor: "#374151", color: "#9ca3af" },
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          legend: { orientation: "h", y: -0.2 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">X-ray Sources for E<sub>B</sub> = {bindingEnergy} eV</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {xraySources.map(s => (
            <div key={s.name} className={`rounded p-2 ${parseFloat(s.ke) > 0 ? "bg-gray-800" : "bg-red-900/30"}`}>
              <p className="text-green-400 text-sm font-semibold">{s.name}</p>
                            <p className="text-blue-400 text-xs">E<sub>k</sub> = {s.ke} eV</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">XPS vs UPS</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-400 font-semibold mb-1">XPS (hν ~ 1–2 keV)</p>
            <ul className="text-gray-300 space-y-1">
              <li>• Core level electrons</li>
              <li>• Elemental identification</li>
              <li>• Chemical state analysis</li>
              <li>• Quantitative composition</li>
            </ul>
          </div>
          <div>
            <p className="text-green-400 font-semibold mb-1">UPS (hν ~ 20–40 eV)</p>
            <ul className="text-gray-300 space-y-1">
              <li>• Valence band structure</li>
              <li>• Work function measurement</li>
              <li>• HOMO/LUMO levels</li>
              <li>• Higher surface sensitivity</li>
            </ul>
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
