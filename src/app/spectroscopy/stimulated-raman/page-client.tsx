"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function StimulatedRamanPage() {
  const [ramanShift, setRamanShift] = useState(2880);
  const [pumpPower, setPumpPower] = useState(100);
  const [stokesPower, setStokesPower] = useState(50);
  const [pathLength, setPathLength] = useState(0.1);
  const [concentration, setConcentration] = useState(0.1);
  const [linewidth, setLinewidth] = useState(10);

  const stimulatedGainData = useMemo(() => {
    const detunings = Array.from({ length: 400 }, (_, i) => -50 + (i / 400) * 100);
    const gamma = linewidth;
    // Stimulated Raman gain profile: Lorentzian
    const gain = detunings.map(d => {
      const lorentz = Math.pow(gamma, 2) / (Math.pow(d, 2) + Math.pow(gamma, 2));
      return lorentz * pumpPower * concentration * pathLength * 1e-3;
    });
    return [
      { x: detunings, y: gain, type: "scatter" as const, mode: "lines" as const, name: "SRS Gain", line: { color: "#34d399", width: 2 } },
    ];
  }, [ramanShift, pumpPower, concentration, pathLength, linewidth]);

  const powerTransferData = useMemo(() => {
    const distances = Array.from({ length: 300 }, (_, i) => (i / 300) * pathLength * 1e3);
    const gR = concentration * 1e-3;
    const pumpDepletion = distances.map(z => pumpPower * Math.exp(-gR * z * stokesPower * 1e-3));
    const stokesGrowth = distances.map(z => stokesPower * Math.exp(gR * z * pumpPower * 1e-3));
    return [
      { x: distances, y: pumpDepletion, type: "scatter" as const, mode: "lines" as const, name: "Pump (depleted)", line: { color: "#f87171", width: 2 } },
      { x: distances, y: stokesGrowth, type: "scatter" as const, mode: "lines" as const, name: "Stokes (amplified)", line: { color: "#34d399", width: 2 } },
    ];
  }, [pumpPower, stokesPower, pathLength, concentration]);

  const ramanGainCoeff = concentration * 1e-3;
  const maxStokesGain = Math.log(1 + pumpPower * ramanGainCoeff * pathLength * 1e3 / stokesPower) * stokesPower;

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Stimulated Raman Scattering (SRS)" description="Coherent Raman gain/loss process for high-speed chemical imaging without non-resonant background.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Raman Shift (cm⁻¹)" value={ramanShift} onChange={setRamanShift} min={100} max={4500} />
        <ValidatedNumberInput label="Pump Power (mW)" value={pumpPower} onChange={setPumpPower} min={1} max={1e6} />
        <ValidatedNumberInput label="Stokes Power (mW)" value={stokesPower} onChange={setStokesPower} min={1} max={1e6} />
        <ValidatedNumberInput label="Path Length (cm)" value={pathLength} onChange={setPathLength} min={0.001} max={100} />
        <ValidatedNumberInput label="Concentration (M)" value={concentration} onChange={setConcentration} min={0.001} max={50} />
        <ValidatedNumberInput label="Raman Linewidth (cm⁻¹)" value={linewidth} onChange={setLinewidth} min={1} max={100} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Formulas</h3>
        <p className="text-gray-300 text-sm mb-1"><span className="text-green-400 font-mono">Stokes gain:</span> dI<sub>s</sub>/dz = g<sub>R</sub> × I<sub>p</sub> × I<sub>s</sub></p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-green-400 font-mono">Pump depletion:</span> dI<sub>p</sub>/dz = −(ω<sub>p</sub>/ω<sub>s</sub>) × g<sub>R</sub> × I<sub>p</sub> × I<sub>s</sub></p>
        <p className="text-gray-300 text-sm mb-1"><span className="text-green-400 font-mono">SRG:</span> ΔI<sub>s</sub>/I<sub>s</sub> = g<sub>R</sub> × I<sub>p</sub> × L</p>
        <p className="text-sm text-gray-300"><span className="text-red-400 font-mono">SRL:</span> ΔI<sub>p</sub>/I<sub>p</sub> = −g<sub>R</sub> × I<sub>s</sub> × L</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-green-400">{(ramanGainCoeff * 1e3).toFixed(2)} cm/GW</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-blue-400">{maxStokesGain.toFixed(2)} mW</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center">
                    <p className="text-xl font-bold text-yellow-400">{(ramanGainCoeff * pumpPower * pathLength * 1e3 * 100).toFixed(4)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">SRS Gain Profile</h3>
          <ChartPanel data={stimulatedGainData} layout={{
            xaxis: { title: "Detuning (cm⁻¹)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Gain (a.u.)", gridcolor: "#374151", color: "#9ca3af" },
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Power Transfer Along Path</h3>
          <ChartPanel data={powerTransferData} layout={{
            xaxis: { title: "Distance (mm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Power (mW)", gridcolor: "#374151", color: "#9ca3af" },
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#e5e7eb" }, margin: { t: 20 },
            legend: { orientation: "h", y: -0.2 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">SRS vs CARS Comparison</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-green-400 font-semibold mb-1">SRS Advantages</p>
            <ul className="text-gray-300 space-y-1">
              <li>• No non-resonant background</li>
              <li>• Linear concentration dependence</li>
              <li>• Quantitative measurements</li>
            </ul>
          </div>
          <div>
            <p className="text-yellow-400 font-semibold mb-1">Trade-offs</p>
            <ul className="text-gray-300 space-y-1">
              <li>• Modulation detection (lock-in needed)</li>
              <li>• Weaker signal than CARS at low conc.</li>
              <li>• Requires high-frequency detection</li>
            </ul>
          </div>
        </div>
      </div>
    </CalculatorShell>
  );
}
