"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function MicrowaveSpectroscopyPage() {
  const [moleculeType, setMoleculeType] = useState("linear");
  const [bondLength, setBondLength] = useState(1.128); // N₂-like, in Å
  const [reducedMass, setReducedMass] = useState(14); // amu
  const [temperature, setTemperature] = useState(293);
  const [dipoleMoment, setDipoleMoment] = useState(1.47); // Debye (CO)

  const calcRotationalConstants = () => {
    // B = h / (8π²cI) in cm⁻¹
    // I = μ × r²
    const mu = reducedMass * 1.66054e-27; // kg
    const r = bondLength * 1e-10; // m
    const I = mu * r * r;
    const h = 6.626e-34;
    const c = 2.998e10;
    const B = h / (8 * Math.PI * Math.PI * c * I); // cm⁻¹
    const B_GHz = B * c; // GHz (h × B in Hz)
    const D = B * B / (2 * 1e6 * 1.66054e-27 * r * r * 1e-20 * 2.998e10 * 6.626e-34 / (8 * Math.PI * Math.PI)); // centrifugal distortion
    return { B, B_GHz, I };
  };

  const { B, B_GHz, I } = calcRotationalConstants();

  const spectrumData = useMemo(() => {
    const maxJ = 30;
    const transitions = [];
    for (let J = 0; J < maxJ; J++) {
      const nu = 2 * B * (J + 1); // cm⁻¹ for J→J+1
      const freqGHz = nu * 2.998e10 / 1e9; // GHz
      // Boltzmann population
      const E_J = B * J * (J + 1);
      const kT = 0.695 * temperature; // cm⁻¹
      const degeneracy = moleculeType === "linear" ? 2 * J + 1 : (2 * J + 1) * (J + 1);
      const population = degeneracy * Math.exp(-E_J / kT);
      const intensity = population * (J + 1) * Math.pow(2 * J + 3, 0); // simple model
      transitions.push({ freqGHz, intensity, J });
    }
    const maxInt = Math.max(...transitions.map(t => t.intensity));
    return [
      {
        x: transitions.map(t => t.freqGHz),
        y: transitions.map(t => (t.intensity / maxInt) * 100),
        type: "bar" as const,
        name: "Rotational Lines",
        marker: { color: "#60a5fa" },
      },
    ];
  }, [B, temperature, moleculeType]);

  const boltzmannData = useMemo(() => {
    const Js = Array.from({ length: 30 }, (_, i) => i);
    const kT = 0.695 * temperature;
    const populations = Js.map(J => {
      const E = B * J * (J + 1);
      const deg = moleculeType === "linear" ? 2 * J + 1 : (2 * J + 1) * (J + 1);
      return deg * Math.exp(-E / kT);
    });
    const maxPop = Math.max(...populations);
    return [
      { x: Js, y: populations.map(p => p / maxPop * 100), type: "scatter" as const, mode: "lines+markers" as const, name: "Population", line: { color: "#34d399" }, marker: { size: 4 } },
    ];
  }, [B, temperature, moleculeType]);

  const maxJ_pop = Math.sqrt(temperature * 0.695 / B) - 0.5;
  const maxJ_observed = maxJ_pop + 0.5;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Microwave / Rotational Spectroscopy" description="Pure rotational transitions for molecular structure determination (1–300 GHz).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Molecule Type</span>
          <select value={moleculeType} onChange={e => setMoleculeType(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="linear">Linear</option>
            <option value="symmetric">Symmetric Top</option>
          </select>
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bond Length (Å)</span>
          <input type="number" value={bondLength} onChange={e => setBondLength(+e.target.value)} min={0.5} max={5} step={0.001}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Reduced Mass (amu)</span>
          <input type="number" value={reducedMass} onChange={e => setReducedMass(+e.target.value)} min={1} max={200} step={0.1}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Dipole Moment (D)</span>
          <input type="number" value={dipoleMoment} onChange={e => setDipoleMoment(+e.target.value)} min={0} max={20} step={0.01}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Temperature (K)</span>
          <input type="number" value={temperature} onChange={e => setTemperature(+e.target.value)} min={10} max={1000}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Rotational constant:</span> B = h / (8π²cI)</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Moment of inertia:</span> I = μ × r²</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Transition (linear):</span> ν(J→J+1) = 2B(J+1)</p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-blue-400 font-mono">Energy levels:</span> E<sub>J</sub> = BJ(J+1)</p>
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">Selection rule:</span> ΔJ = ±1 (dipole-allowed)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-blue-400">{B.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-green-400">{B_GHz.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-yellow-400">{I.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-red-400">{maxJ_pop.toFixed(0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Rotational Spectrum</h3>
          <ChartPanel data={spectrumData} layout={{
            xaxis: { title: "Frequency (GHz)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Relative Intensity (%)", gridcolor: "#374151", color: "#9ca3af" },
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
            bargap: 0.1,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Boltzmann Population</h3>
          <ChartPanel data={boltzmannData} layout={{
            xaxis: { title: "J", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Relative Population (%)", gridcolor: "#374151", color: "#9ca3af" },
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Notes</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong className="text-blue-400">Requirement</strong>: Molecule must have a permanent dipole moment (μ ≠ 0)</li>
          <li>• <strong className="text-green-400">Resolution</strong>: GHz frequencies require high-Q cavities or FTMW</li>
          <li>• <strong className="text-yellow-400">Applications</strong>: Astrophysics (interstellar molecules), atmospheric chemistry, structural determination</li>
          <li>• <strong className="text-red-400">Isotopologues</strong>: Different reduced masses → different B → resolved lines</li>
        </ul>
      </div>
    </CalculatorShell>
  );
}
