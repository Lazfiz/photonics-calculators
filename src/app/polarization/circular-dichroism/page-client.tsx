"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export default function CircularDichroismPage() {
  const [absL, setAbsL] = useState(0.5);
  const [absR, setAbsR] = useState(0.4);
  const [pathLength, setPathLength] = useState(1.0); // cm
  const [concentration, setConcentration] = useState(1.0); // mM
  const [wavelength, setWavelength] = useState(220); // nm
  const [temperature, setTemperature] = useState(25); // °C

  // CD calculations
  const results = useMemo(() => {
    const deltaA = absL - absR;
    const deltaE = deltaA / (concentration * pathLength); // M⁻¹cm⁻¹
    // Convert to molar ellipticity [θ] = 3298 * Δε
    const molarEllipticity = 3298 * deltaE;
    // Mean residue ellipticity (for proteins)
    const meanResidueEllipticity = molarEllipticity / 1; // assuming 1 residue
    // g-factor (anisotropy factor)
    const gFactor = deltaA / ((absL + absR) / 2);
    // Ellipticity in millidegrees
    const ellipticityMdeg = deltaA * 32980 * Math.log(10) / 2; // approximate
    // Dissymmetry factor
    const dissymmetry = gFactor;

    return { deltaA, deltaE, molarEllipticity, meanResidueEllipticity, gFactor, ellipticityMdeg, dissymmetry };
  }, [absL, absR, concentration, pathLength]);

  // Simulated CD spectrum
  const cdSpectrum = useMemo(() => {
    const wls = Array.from({ length: 150 }, (_, i) => 190 + i * 1.5);
    // Typical protein CD spectrum with alpha-helix signature
    const cdVals = wls.map((wl) => {
      // Negative bands at 208 and 222 nm (alpha-helix), positive at 190 nm
      const h208 = -30000 * Math.exp(-((wl - 208) ** 2) / 50);
      const h222 = -25000 * Math.exp(-((wl - 222) ** 2) / 50);
      const h190 = 60000 * Math.exp(-((wl - 190) ** 2) / 30);
      // Add some noise
      const noise = (Math.random() - 0.5) * 1000;
      return h208 + h222 + h190 + noise;
    });
    return { wls, cdVals };
  }, []);

  // Secondary structure estimation
  const structureEstimate = useMemo(() => {
    // Simple empirical correlation from 222 nm signal
    const signal222 = -25000; // baseline from spectrum
    const alphaHelix = Math.min(100, Math.max(0, -signal222 / 400));
    const betaSheet = 20; // simplified
    const randomCoil = 100 - alphaHelix - betaSheet;
    return { alphaHelix: alphaHelix.toFixed(1), betaSheet: betaSheet.toFixed(1), randomCoil: randomCoil.toFixed(1) };
  }, []);

  const plotLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#111827",
    font: { color: "#e5e7eb" },
    margin: { t: 30, b: 40, l: 60, r: 10 },
    xaxis: { color: "#9ca3af", gridcolor: "#374151", title: "Wavelength (nm)" },
    yaxis: { color: "#9ca3af", gridcolor: "#374151" },
    legend: { font: { color: "#9ca3af" } },
  };

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Circular Dichroism" description="Calculate CD parameters: ΔA, Δε, molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.">
            
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Sample Parameters</h2>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Absorbance LCP (A<sub>L</sub>)</label>
            <input type="number" step={0.01} value={absL} onChange={(e) => setAbsL(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Absorbance RCP (A<sub>R</sub>)</label>
            <input type="number" step={0.01} value={absR} onChange={(e) => setAbsR(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Path length (cm)</label>
            <input type="number" step={0.01} value={pathLength} onChange={(e) => setPathLength(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Concentration (mM)</label>
            <input type="number" step={0.01} value={concentration} onChange={(e) => setConcentration(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Wavelength (nm)</label>
            <input type="number" value={wavelength} onChange={(e) => setWavelength(parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Temperature (°C)</label>
            <input type="number" step={0.1} value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">CD Results</h2>
          <div className="space-y-1">
            <ResultRow label="ΔA = AL − AR" value={results.deltaA.toFixed(4)} />
            <ResultRow label="Δε (M⁻¹cm⁻¹)" value={results.deltaE.toFixed(2)} />
            <ResultRow label="[θ] (deg·cm²·dmol⁻¹)" value={results.molarEllipticity.toFixed(0)} />
            <ResultRow label="[θ]MR (mean residue)" value={results.meanResidueEllipticity.toFixed(0)} />
            <ResultRow label="g-factor" value={results.gFactor.toFixed(6)} />
            <ResultRow label="Ellipticity (mdeg)" value={results.ellipticityMdeg.toFixed(2)} />
          </div>
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400">Dichroic ratio</div>
            <div className="text-xl font-bold">{(absL / (absR || 0.001)).toFixed(3)}</div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Secondary Structure (Est.)</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">α-Helix</span>
                <span className="font-bold">{structureEstimate.alphaHelix}%</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${structureEstimate.alphaHelix}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">β-Sheet</span>
                <span className="font-bold">{structureEstimate.betaSheet}%</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${structureEstimate.betaSheet}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Random coil</span>
                <span className="font-bold">{structureEstimate.randomCoil}%</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${structureEstimate.randomCoil}%` }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">* Simplified estimation based on 222 nm signal</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-4">Simulated CD Spectrum (Protein)</h2>
        <ChartPanel data={[
          { x: cdSpectrum.wls, y: cdSpectrum.cdVals, type: "scatter", mode: "lines", line: { color: "#3b82f6", width: 2 } },
        ]} layout={{ ...plotLayout, height: 300, yaxis: { ...plotLayout.yaxis, title: "[θ] (deg·cm²·dmol⁻¹)" } }} />
        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> α-helix: negative at 208, 222 nm</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-400 inline-block" /> β-sheet: negative at 218 nm</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>ΔA = A<sub>L</sub> − A<sub>R</sub></p>
          <p>Δε = ΔA / (c · l) &nbsp;— differential molar extinction</p>
          <p>[θ] = 3298 · Δε &nbsp;— molar ellipticity (deg·cm²·dmol⁻¹)</p>
          <p>g = ΔA / A<sub>avg</sub> = (A<sub>L</sub> − A<sub>R</sub>) / ((A<sub>L</sub> + A<sub>R</sub>)/2)</p>
          <p>θ (mdeg) = 32980 · ΔA / 2</p>
          <p>For proteins: α-helix signature at 208, 222 nm (negative)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
