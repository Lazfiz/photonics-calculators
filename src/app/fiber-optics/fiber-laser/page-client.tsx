"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function FiberLaserCalculator() {
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 100); // W
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 976); // nm
  const [laserWavelength, setLaserWavelength] = useURLState("laserWavelength", 1064); // nm
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 5); // m
  const [absorptionCoeff, setAbsorptionCoeff] = useURLState("absorptionCoeff", 1.5); // dB/m
  const [slopeEfficiency, setSlopeEfficiency] = useURLState("slopeEfficiency", 80); // %
  const [thresholdPower, setThresholdPower] = useURLState("thresholdPower", 2); // W
  const [outputCoupling, setOutputCoupling] = useURLState("outputCoupling", 10); // %
  const [cavityLoss, setCavityLoss] = useURLState("cavityLoss", 0.5); // dB (round-trip)

  // Quantum efficiency
  const quantumEfficiency = useMemo(() => {
    return (pumpWavelength / laserWavelength) * (slopeEfficiency / 100);
  }, [pumpWavelength, laserWavelength, slopeEfficiency]);

  // Stokes efficiency (photonic)
  const stokesEfficiency = pumpWavelength / laserWavelength;

  // Output power
  const outputPower = useMemo(() => {
    if (pumpPower <= thresholdPower) return 0;
    return slopeEfficiency / 100 * (pumpPower - thresholdPower);
  }, [pumpPower, slopeEfficiency, thresholdPower]);

  // Optical efficiency
  const opticalEfficiency = pumpPower > 0 ? (outputPower / pumpPower) * 100 : 0;

  // Power from output coupling (OC loss in dB)
  const ocLossDb = useMemo(() => {
    return -10 * Math.log10(outputCoupling / 100);
  }, [outputCoupling]);

  // Total cavity round-trip loss
  const totalCavityLoss = cavityLoss + ocLossDb;

  // Optimum output coupling (Siegman)
  const optimumOC = useMemo(() => {
    // T_opt = sqrt(g₀ · L_i) - L_i  (Siegman, all in nepers)
    // gi: small-signal single-pass gain in dB → convert to nepers
    const gi_dB = absorptionCoeff * fiberLength;
    const gi = gi_dB / (10 * Math.log10(Math.E)); // nepers
    // Li: round-trip cavity loss in dB → single-pass loss in nepers
    const Li = cavityLoss / (10 * Math.log10(Math.E) * 2);
    const tOpt = Math.sqrt(gi * Li) - Li;
    return Math.max(1, Math.min(99, tOpt * 100));
  }, [absorptionCoeff, fiberLength, cavityLoss]);

  // P-I curve
  const piCurve = useMemo(() => {
    const pumps: number[] = [];
    const outputs: number[] = [];
    const opticalEff: number[] = [];

    const maxPump = pumpPower * 2;
    for (let p = 0; p <= maxPump; p += maxPump / 200) {
      pumps.push(p);
      const pOut = p > thresholdPower ? slopeEfficiency / 100 * (p - thresholdPower) : 0;
      outputs.push(pOut);
      opticalEff.push(p > 0 ? (pOut / p) * 100 : 0);
    }

    return [
      { x: pumps, y: outputs, type: "scatter" as const, mode: "lines" as const, name: "Output Power (W)", line: { color: "#10b981", width: 2.5 }, yaxis: "y" },
      { x: pumps, y: opticalEff, type: "scatter" as const, mode: "lines" as const, name: "Optical Efficiency (%)", line: { color: "#f59e0b", width: 2 }, yaxis: "y2" },
    ];
  }, [pumpPower, slopeEfficiency, thresholdPower]);

  // Gain vs fiber length
  const gainCurve = useMemo(() => {
    const lengths: number[] = [];
    const gains: number[] = [];

    for (let l = 0; l <= 20; l += 0.1) {
      lengths.push(l);
      // Small-signal gain: G = exp(α·L) in dB
      gains.push(absorptionCoeff * l);
    }

    return [{ x: lengths, y: gains, type: "scatter" as const, mode: "lines" as const, name: "Small-Signal Gain (dB)", line: { color: "#8b5cf6", width: 2 } }];
  }, [absorptionCoeff]);

  const layout1 = {
    title: "P-I Characteristic",
    xaxis: { title: "Pump Power (W)", gridcolor: "#374151" },
    yaxis: { title: "Output Power (W)", gridcolor: "#374151", titlefont: { color: "#10b981" } },
    yaxis2: { title: "Optical Eff. (%)", gridcolor: "#374151", overlaying: "y", side: "right", titlefont: { color: "#f59e0b" }, range: [0, 100] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  const layout2 = {
    title: "Small-Signal Gain vs Fiber Length",
    xaxis: { title: "Fiber Length (m)", gridcolor: "#374151" },
    yaxis: { title: "Gain (dB)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Pump Power (W)</label>
              <ValidatedNumberInput label="Pump Power (W)" value={pumpPower} onChange={setPumpPower} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pump Wavelength (nm)</label>
              <ValidatedNumberInput label="Pump Wavelength (nm)" value={pumpWavelength} onChange={setPumpWavelength} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Laser Wavelength (nm)</label>
              <ValidatedNumberInput label="Laser Wavelength (nm)" value={laserWavelength} onChange={setLaserWavelength} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Length (m)</label>
              <ValidatedNumberInput label="Fiber Length (m)" value={fiberLength} onChange={setFiberLength} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Absorption Coefficient (dB/m)</label>
              <ValidatedNumberInput label="Absorption Coefficient (dB/m)" value={absorptionCoeff} onChange={setAbsorptionCoeff} step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slope Efficiency (%)</label>
              <ValidatedNumberInput label="Slope Efficiency (%)" value={slopeEfficiency} onChange={setSlopeEfficiency} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Threshold Power (W)</label>
              <ValidatedNumberInput label="Threshold Power (W)" value={thresholdPower} onChange={setThresholdPower} step="0.1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Output Coupling (%)</label>
                <ValidatedNumberInput label="Output Coupling (%)" value={outputCoupling} onChange={setOutputCoupling} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cavity Loss (dB)</label>
                <ValidatedNumberInput label="Cavity Loss (dB)" value={cavityLoss} onChange={setCavityLoss} step="0.1" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Output power:</span><span className="font-mono text-green-400 text-lg">{outputPower.toFixed(1)} W</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Optical efficiency:</span><span className="font-mono">{opticalEfficiency.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Stokes efficiency (λ_p/λ_l):</span><span className="font-mono">{(stokesEfficiency * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Quantum efficiency:</span><span className="font-mono">{(quantumEfficiency * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">OC loss:</span><span className="font-mono">{ocLossDb.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total cavity loss:</span><span className="font-mono">{totalCavityLoss.toFixed(2)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Optimum OC (est.):</span><span className="font-mono text-yellow-400">{optimumOC.toFixed(1)}%</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">P_out = η_s · (P_pump - P_th)</p>
              <p className="font-mono text-sm mt-1">η_quantum = (λ_p/λ_l) · η_slope</p>
              <p className="font-mono text-sm mt-1">η_optical = P_out / P_pump</p>
              <p className="font-mono text-sm mt-1">T_opt ≈ √(g₀·L_i) - L_i</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={piCurve} layout={layout1} />
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={gainCurve} layout={layout2} />
          </div>
        </div>
      </div>
    </div>
  );
}
