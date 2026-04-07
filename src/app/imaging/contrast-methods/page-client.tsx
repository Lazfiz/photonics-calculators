"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
export default function ContrastMethodsPage() {
  const [method, setMethod] = useState("phase");
  const [na, setNa] = useURLState("na", 1.4);
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [n, setN] = useURLState("n", 1.52);
  const [phaseShift, setPhaseShift] = useURLState("phaseShift", 0.25); // waves for phase contrast
  const [shearAmount, setShearAmount] = useURLState("shearAmount", 0.2); // λ for DIC
  const [sampleThickness, setSampleThickness] = useURLState("sampleThickness", 5); // µm
  const [dnSample, setDnSample] = useURLState("dnSample", 0.005); // Δn for sample

  const results = useMemo(() => {
    const lam = wavelength * 1e-9;
    const opd = dnSample * sampleThickness * 1e-6; // m
    const opdWaves = opd / lam;
    const phaseAngle = 2 * Math.PI * opdWaves;

    // Phase contrast
    const pcPhaseRetard = phaseShift * 2 * Math.PI; // plate retardation
    const pcContrast = Math.sin(phaseAngle) * Math.sin(pcPhaseRetard);
    const pcAmplitude = 2 * Math.abs(Math.sin(pcPhaseRetard / 2));
    const pcTransmission = Math.cos(pcPhaseRetard / 2) ** 2;

    // DIC
    const shearDist = shearAmount * lam / na * 1e9; // nm lateral shear
    const dicOPD = dnSample * sampleThickness * 1e-6 * 2; // doubled in DIC
    const dicPhase = 2 * Math.PI * dicOPD / lam;
    const dicContrast = Math.sin(dicPhase);

    // Halo size (phase contrast artifact)
    const haloSize = 0.61 * lam / na * 1e9; // nm, related to resolution

    return { opd, opdWaves, phaseAngle, pcContrast, pcAmplitude, pcTransmission, shearDist, dicOPD, dicPhase, dicContrast, haloSize };
  }, [method, na, wavelength, n, phaseShift, shearAmount, sampleThickness, dnSample]);

  const plotData = useMemo(() => {
    const thicknesses = [];
    const pcContrasts = [];
    const dicContrasts = [];
    const lam = wavelength * 1e-9;
    const pcPhaseRetard = phaseShift * 2 * Math.PI;
    for (let t = 0.1; t <= 20; t += 0.1) {
      thicknesses.push(t);
      const opd = dnSample * t * 1e-6;
      const phaseAngle = 2 * Math.PI * opd / lam;
      pcContrasts.push(Math.sin(phaseAngle) * Math.sin(pcPhaseRetard));
      const dicOPD = dnSample * t * 1e-6 * 2;
      dicContrasts.push(Math.sin(2 * Math.PI * dicOPD / lam));
    }
    return [
      { x: thicknesses, y: pcContrasts, name: "Phase contrast", line: { color: "#60a5fa" }, type: "scatter", mode: "lines" },
      { x: thicknesses, y: dicContrasts, name: "DIC", line: { color: "#f87171" }, type: "scatter", mode: "lines" },
    ];
  }, [na, wavelength, n, phaseShift, shearAmount, dnSample]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Phase Contrast &amp; DIC Calculator" description="Contrast calculations for phase contrast and differential interference contrast microscopy.">
            
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">NA</label>
            <input type="number" step={0.01} value={na} onChange={e => setNa(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
            <input type="number" step={1} value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Refractive index (medium)</label>
            <input type="number" step={0.01} value={n} onChange={e => setN(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sample thickness (µm)</label>
            <input type="number" step={0.1} value={sampleThickness} onChange={e => setSampleThickness(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Δn (sample - medium)</label>
            <input type="number" step={0.001} value={dnSample} onChange={e => setDnSample(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phase plate retardation (λ)</label>
            <input type="number" step={0.05} min={0.05} max={1.0} value={phaseShift} onChange={e => setPhaseShift(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">DIC shear (λ)</label>
            <input type="number" step={0.01} value={shearAmount} onChange={e => setShearAmount(+e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Sample Properties</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">OPD</span><span className="font-mono">{results.opd.toExponential(2)} m</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">OPD (waves)</span><span className="font-mono text-yellow-400">{results.opdWaves.toFixed(3)} λ</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Phase shift</span><span className="font-mono">{results.phaseAngle.toFixed(2)} rad ({(results.phaseAngle * 180 / Math.PI).toFixed(1)}°)</span></div>

          <h2 className="text-lg font-semibold mt-4">Phase Contrast</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Contrast</span><span className="font-mono text-blue-400">{(results.pcContrast * 100).toFixed(2)}%</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Halo size</span><span className="font-mono">{results.haloSize.toFixed(1)} nm</span></div>

          <h2 className="text-lg font-semibold mt-4">DIC</h2>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">Lateral shear</span><span className="font-mono text-red-400">{results.shearDist.toFixed(1)} nm</span></div>
          <div className="flex justify-between border-b border-gray-800 pb-2"><span className="text-gray-400">DIC contrast</span><span className="font-mono text-green-400">{(results.dicContrast * 100).toFixed(2)}%</span></div>

          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>OPD = Δn · t</p>
            <p>PC contrast ∝ sin(φ) · sin(δ_plate)</p>
            <p>DIC shear: Δx = s·λ/NA</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Contrast vs Sample Thickness</h2>
        <ChartPanel data={plotData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, xaxis: { title: "Thickness (µm)", gridcolor: "#333" }, yaxis: { title: "Contrast (fraction)", gridcolor: "#333" }, legend: { font: { size: 11 } }, margin: { l: 60, r: 20, t: 20, b: 60 } }} />
      </div>
    </CalculatorShell>
  );
}
