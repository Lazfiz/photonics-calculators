"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function ClearedTissuePage() {
  const [na, setNa] = useState(1.2);
  const [wavelength, setWavelength] = useState(680);
  const [nMedium, setNMedium] = useState(1.52);
  const [tissueThickness, setTissueThickness] = useState(1000);
  const [absorptionCoeff, setAbsorptionCoeff] = useState(0.01);
  const [scatteringCoeff, setScatteringCoeff] = useState(0.02);
  const [objectiveWD, setObjectiveWD] = useState(3000);

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const lateralRes = 0.61 * lam / na * 1e9;
    const axialRes = 2 * nMedium * lam / (na * na) * 1e6;
    const reducedScattering = scatteringCoeff * (1 - absorptionCoeff / (absorptionCoeff + scatteringCoeff));
    const transmission = Math.exp(-(absorptionCoeff + scatteringCoeff) * tissueThickness / 1000);
    const imagingDepth = objectiveWD * (na / nMedium);
    const riMismatchPenalty = ((na / nMedium) ** 4);
    const snrLoss = -10 * Math.log10(Math.max(transmission, 1e-10));
    const ballPhotonFrac = Math.exp(-scatteringCoeff * tissueThickness / 1000);
    return { lateralRes, axialRes, transmission, imagingDepth, riMismatchPenalty, snrLoss, ballPhotonFrac, reducedScattering };
  }, [na, wavelength, nMedium, tissueThickness, absorptionCoeff, scatteringCoeff, objectiveWD]);

  const plotData = useMemo(() => {
    const depths = [];
    const transmissions = [];
    const ballFracs = [];
    for (let d = 0; d <= 5000; d += 50) {
      depths.push(d);
      transmissions.push(Math.exp(-(absorptionCoeff + scatteringCoeff) * d / 1000) * 100);
      ballFracs.push(Math.exp(-scatteringCoeff * d / 1000) * 100);
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
            <input type="number" step={0.05} min={0.2} max={1.7} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={10} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Medium refractive index</label>
            <input type="number" step={0.01} min={1.0} max={1.8} value={nMedium} onChange={e => setNMedium(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tissue thickness (µm)</label>
            <input type="number" step={100} value={tissueThickness} onChange={e => setTissueThickness(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Absorption coeff (µm⁻¹)</label>
            <input type="number" step={0.005} min={0} value={absorptionCoeff} onChange={e => setAbsorptionCoeff(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Scattering coeff (µm⁻¹)</label>
            <input type="number" step={0.005} min={0} value={scatteringCoeff} onChange={e => setScatteringCoeff(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Objective WD (µm)</label>
            <input type="number" step={100} value={objectiveWD} onChange={e => setObjectiveWD(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
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
