"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function ElectronSpectroscopyPage() {
  const [photonEnergy, setPhotonEnergy] = useState(1486.6); // Al Kα
  const [bindingEnergy, setBindingEnergy] = useState(285); // C 1s
  const [workFunction, setWorkFunction] = useState(4.5);
  const [analyzerWorkFunction, setAnalyzerWorkFunction] = useState(4.2);
  const [fwhm, setFwhm] = useState(1.2);
  const [temperature, setTemperature] = useState(300);

  const kineticEnergy = photonEnergy - bindingEnergy - workFunction;
  const alFermi = 1486.6;
  const mgFermi = 1253.6;
  const heI = 21.22;

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

    // Asymmetric Doniach-Šunjić lineshape (simplified with Gaussian)
    const spectrum = bes.map(be => {
      let intensity = 0;
      for (const p of peaks) {
        if (be > p.center - 5 * p.width && be < p.center + 5 * p.width) {
          // Gaussian + exponential tail (asymmetric)
          const gauss = p.amp * Math.exp(-0.5 * Math.pow((be - p.center) / p.width, 2));
          const asym = be < p.center ? 0 : p.amp * 0.3 * Math.exp(-(be - p.center) / (p.width * 2));
          intensity += gauss + asym;
        }
      }
      // Secondary electron background (Shirley-like)
      const integrated = peaks.filter(p => be < p.center).reduce((sum, p) => sum + p.amp, 0);
      intensity += 0.05 * integrated;
      return intensity;
    });

    return [
      { x: bes, y: spectrum, type: "scatter" as const, mode: "lines" as const, name: "XPS Spectrum", line: { color: "#e5e7eb", width: 1.5 } },
      { x: bes, y: bes.map(be => {
        const p = peaks[0];
        return p.amp * Math.exp(-0.5 * Math.pow((be - p.center) / p.width, 2));
      }), type: "scatter" as const, mode: "lines" as const, name: "C 1s fit", line: { color: "#60a5fa", dash: "dash" } },
    ];
  }, [photonEnergy, fwhm]);

  const depthData = useMemo(() => {
    const depths = Array.from({ length: 200 }, (_, i) => (i / 200) * 100);
    // IMFP (inelastic mean free path) - universal curve
    const ke = kineticEnergy;
    const lambda = 1430 / (ke * ke) + 0.054 * Math.sqrt(ke); // TPP-2M simplified (Å)
    const attenuation = depths.map(d => Math.exp(-d / lambda));
    return [
      { x: depths, y: attenuation.map(a => a * 100), type: "scatter" as const, mode: "lines" as const, name: "Signal", line: { color: "#60a5fa", width: 2 } },
      { x: [lambda, lambda], y: [0, 100], type: "scatter" as const, mode: "lines" as const, name: "λ (IMFP)", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [kineticEnergy]);

  const imfp = 1430 / (kineticEnergy * kineticEnergy) + 0.054 * Math.sqrt(kineticEnergy);
  const infoDepth = 3 * imfp;
  const fermiDirac = 1 / (1 + Math.exp(0));

  const xraySources = [
    { name: "Al Kα", energy: 1486.6, ke: (1486.6 - bindingEnergy - workFunction).toFixed(1) },
    { name: "Mg Kα", energy: 1253.6, ke: (1253.6 - bindingEnergy - workFunction).toFixed(1) },
    { name: "Ag Lα", energy: 2984.3, ke: (2984.3 - bindingEnergy - workFunction).toFixed(1) },
    { name: "He I (UPS)", energy: 21.22, ke: (21.22 - bindingEnergy - workFunction).toFixed(1) },
  ];

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Electron Spectroscopy (XPS/UPS)" description="Photoelectron spectroscopy for surface composition, chemical state, and electronic structure.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Photon Energy (eV)</span>
          <input type="number" value={photonEnergy} onChange={e => setPhotonEnergy(+e.target.value)} min={10} max={10000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Binding Energy of Interest (eV)</span>
          <input type="number" value={bindingEnergy} onChange={e => setBindingEnergy(+e.target.value)} min={0} max={2000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Sample Work Function (eV)</span>
          <input type="number" value={workFunction} onChange={e => setWorkFunction(+e.target.value)} min={1} max={6} step={0.1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Peak FWHM (eV)</span>
          <input type="number" value={fwhm} onChange={e => setFwhm(+e.target.value)} min={0.1} max={5} step={0.1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Einstein:</span> E<sub>k</sub> = hν − E<sub>B</sub> − ϕ</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">IMFP (TPP-2M):</span> λ = 1430/(E<sub>k</sub>²) + 0.054√E<sub>k</sub> Å</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Attenuation:</span> I(d) = I₀ exp(−d/λ)</p>
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">Info depth:</span> ~3λ (95% signal from this depth)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-blue-400">{kineticEnergy.toFixed(1)} eV</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-green-400">{imfp.toFixed(1)} Å</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-yellow-400">{infoDepth.toFixed(1)} Å</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-red-400">{infoDepth < 30 ? "High" : infoDepth < 60 ? "Medium" : "Bulk"}</p>
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
          xaxis: { title: "Depth (Å)", gridcolor: "#374151", color: "#9ca3af" },
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
