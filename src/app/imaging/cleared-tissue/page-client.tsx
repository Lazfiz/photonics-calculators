"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function ClearedTissuePage() {
  const [na, setNa] = useURLState("na", 1.2);
  const [wavelength, setWavelength] = useURLState("wavelength", 680);
  const [nMedium, setNMedium] = useURLState("nMedium", 1.52);
  const [tissueThickness, setTissueThickness] = useURLState("tissueThickness", 1000);
  const [absorptionCoeff, setAbsorptionCoeff] = useURLState("absorptionCoeff", 0.01);
  const [scatteringCoeff, setScatteringCoeff] = useURLState("scatteringCoeff", 0.02);
  const [objectiveWD, setObjectiveWD] = useURLState("objectiveWD", 3000);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const lateralRes = 0.61 * lam / na * 1e9;
    const axialRes = 2 * nMedium * lam / (na * na) * 1e6;
    const transmission = Math.exp(-(absorptionCoeff + scatteringCoeff) * tissueThickness);
    const imagingDepth = objectiveWD * (na / nMedium);
    const riMismatchPenalty = ((na / nMedium) ** 4);
    const snrLoss = -10 * Math.log10(Math.max(transmission, 1e-10));
    const ballPhotonFrac = Math.exp(-(absorptionCoeff + scatteringCoeff) * tissueThickness);
    return { lateralRes, axialRes, transmission, imagingDepth, riMismatchPenalty, snrLoss, ballPhotonFrac };
  }, [na, wavelength, nMedium, tissueThickness, absorptionCoeff, scatteringCoeff, objectiveWD]);

  const plotData = useMemo(() => {
    const depths = [];
    const transmissions = [];
    const ballFracs = [];
    for (let d = 0; d <= 5000; d += 50) {
      depths.push(d);
      transmissions.push(Math.exp(-(absorptionCoeff + scatteringCoeff) * d) * 100);
      ballFracs.push(Math.exp(-(absorptionCoeff + scatteringCoeff) * d) * 100);
    }
    return [
      { x: depths, y: transmissions, name: "Total transmission (%)", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: depths, y: ballFracs, name: "Ballistic fraction (%)", line: { color: "#34d399" }, type: "scatter", mode: "lines" },
    ];
  }, [absorptionCoeff, scatteringCoeff]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Cleared Tissue Imaging Calculator" description="Optical clearing tissue imaging: resolution, transmission, ballistic photon fraction, and RI matching.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective NA</label>
            <ValidatedNumberInput label="Objective NA" value={na} onChange={setNa} min={0.2} max={1.7} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Medium refractive index</label>
            <ValidatedNumberInput label="Medium refractive index" value={nMedium} onChange={setNMedium} min={1.0} max={1.8} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tissue thickness (µm)</label>
            <ValidatedNumberInput label="Tissue thickness (µm)" value={tissueThickness} onChange={setTissueThickness} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Absorption coeff (µm⁻¹)</label>
            <ValidatedNumberInput label="Absorption coeff (µm⁻¹)" value={absorptionCoeff} onChange={setAbsorptionCoeff} min={0} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Scattering coeff (µm⁻¹)</label>
            <ValidatedNumberInput label="Scattering coeff (µm⁻¹)" value={scatteringCoeff} onChange={setScatteringCoeff} min={0} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective WD (µm)</label>
            <ValidatedNumberInput label="Objective WD (µm)" value={objectiveWD} onChange={setObjectiveWD} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral resolution</span><span className="font-mono text-blue-400">{results.lateralRes.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Axial resolution</span><span className="font-mono text-green-400">{results.axialRes.toFixed(2)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Transmission</span><span className="font-mono text-cyan-400">{(results.transmission * 100).toFixed(2)}%</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Ballistic photon frac.</span><span className="font-mono text-yellow-400">{(results.ballPhotonFrac * 100).toFixed(2)}%</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Max imaging depth</span><span className="font-mono text-purple-400">{results.imagingDepth.toFixed(0)} µm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">RI mismatch penalty</span><span className="font-mono text-red-400">{(results.riMismatchPenalty * 100).toFixed(1)}%</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">SNR loss</span><span className="font-mono text-orange-400">{results.snrLoss.toFixed(1)} dB</span></div>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>T = exp(-(µ_a + µ_s)·d) | Ballistic = exp(-µ_s·d)</p>
            <p>RI penalty = (NA/n)⁴ | d_max = WD × (NA/n)</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Transmission &amp; Ballistic Fraction vs Depth</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Depth (µm)", gridcolor: "#333" }, yaxis: { title: "%", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
