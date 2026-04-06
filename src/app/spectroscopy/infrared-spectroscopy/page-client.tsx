"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function InfraredSpectroscopyPage() {
  const [wavenumberStart, setWavenumberStart] = useState(400);
  const [wavenumberEnd, setWavenumberEnd] = useState(4000);
  const [pathLength, setPathLength] = useState(0.01);
  const [concentration, setConcentration] = useState(0.1);

  // Common IR absorption bands
  const bands = [
    { name: "O-H stretch", center: 3400, width: 200, eps: 80 },
    { name: "N-H stretch", center: 3300, width: 150, eps: 30 },
    { name: "C≡C stretch", center: 2150, width: 20, eps: 5 },
    { name: "C=O stretch", center: 1720, width: 30, eps: 300 },
    { name: "C=C stretch", center: 1650, width: 25, eps: 20 },
    { name: "C-H bend", center: 1450, width: 30, eps: 15 },
    { name: "C-O stretch", center: 1050, width: 80, eps: 50 },
    { name: "C-H rock", center: 720, width: 40, eps: 10 },
  ];

  const spectrumData = useMemo(() => {
    const wn = Array.from({ length: 800 }, (_, i) => wavenumberStart + (i / 800) * (wavenumberEnd - wavenumberStart));
    const absorbance = wn.map(w => {
      let a = 0;
      for (const b of bands) {
        a += b.eps * concentration * pathLength * Math.exp(-0.5 * Math.pow((w - b.center) / b.width, 2));
      }
      return a;
    });
    const transmittance = absorbance.map(a => Math.pow(10, -a));
    return [
      { x: wn, y: transmittance.map(t => t * 100), type: "scatter" as const, mode: "lines" as const, name: "Transmittance %", line: { color: "#60a5fa" },
        yaxis: "y" },
      { x: wn, y: absorbance, type: "scatter" as const, mode: "lines" as const, name: "Absorbance", line: { color: "#f87171" },
        yaxis: "y2" },
    ];
  }, [wavenumberStart, wavenumberEnd, pathLength, concentration]);

  const wavelengthData = useMemo(() => {
    const wn = Array.from({ length: 500 }, (_, i) => 400 + (i / 500) * 3600);
    const wl = wn.map(w => 1e4 / w); // wavenumber to wavelength in μm
    return [
      { x: wl, y: wn, type: "scatter" as const, mode: "lines" as const, name: "ν̃ vs λ", line: { color: "#34d399" } },
    ];
  }, []);

  const selectedBands = bands.filter(b => b.center >= wavenumberStart && b.center <= wavenumberEnd);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Infrared (IR) Spectroscopy" description="Molecular vibrational absorption in the mid-infrared region (400–4000 cm⁻¹).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Range Start (cm⁻¹)" value={wavenumberStart} onChange={setWavenumberStart} min={400} max={4000} />
        <ValidatedNumberInput label="Range End (cm⁻¹)" value={wavenumberEnd} onChange={setWavenumberEnd} min={400} max={4000} />
        <ValidatedNumberInput label="Path Length (cm)" value={pathLength} onChange={setPathLength} min={0.001} max={10} />
        <ValidatedNumberInput label="Concentration (M)" value={concentration} onChange={setConcentration} min={0.001} max={10} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Beer-Lambert:</span> A = ε × c × l</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Transmittance:</span> T = 10<sup>−A</sup></p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Wavenumber:</span> ν̃ = 1/λ = ν/c</p>
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">Hooke&apos;s law:</span> ν̃ = (1/2πc)√(k/μ)</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">IR Spectrum</h3>
        <ChartPanel data={spectrumData} layout={{
          xaxis: { title: "Wavenumber (cm⁻¹)", gridcolor: "#374151", color: "#9ca3af", autorange: "reversed" },
          yaxis: { title: "Transmittance (%)", gridcolor: "#374151", color: "#9ca3af", range: [0, 105] },
          yaxis2: { title: "Absorbance", overlaying: "y", side: "right", gridcolor: "#374151", color: "#9ca3af" },
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          legend: { orientation: "h", y: -0.2 },
        }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Bands in Selected Range</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {selectedBands.map(b => {
            const a = b.eps * concentration * pathLength;
            return (
              <div key={b.name} className="bg-gray-800 rounded p-2">
                <span className="text-green-400">{b.name}</span>: {b.center} cm⁻¹
                <span className="text-gray-500 ml-2">ε={b.eps} M⁻¹cm⁻¹</span>
                <span className="text-blue-400 ml-2">A={a.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">IR Region Guide</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-400 font-semibold mb-1">Functional Group Region</p>
            <p className="text-gray-300">1500–4000 cm⁻¹: X-H stretches, C=O, C≡C, C≡N</p>
          </div>
          <div>
            <p className="text-yellow-400 font-semibold mb-1">Fingerprint Region</p>
            <p className="text-gray-300">400–1500 cm⁻¹: C-C, C-O, C-N, bending modes</p>
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
