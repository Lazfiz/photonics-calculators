"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function TaperedFiberPage() {
  const [inputDia, setInputDia] = useURLState("inputDia", 125); // μm
  const [outputDia, setOutputDia] = useURLState("outputDia", 20); // μm
  const [taperLength, setTaperLength] = useURLState("taperLength", 20); // mm
  const [coreDia, setCoreDia] = useURLState("coreDia", 9); // μm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [n1, setN1] = useURLState("n1", 1.4682);
  const [n2, setN2] = useURLState("n2", 1.4629);

  const calc = useMemo(() => {
    const taperRatio = outputDia / inputDia;
    const coreAtWaist = coreDia * taperRatio;
    const NA = Math.sqrt(n1 * n1 - n2 * n2);
    const V_input = (2 * Math.PI / (wavelength * 1e-3)) * (coreDia / 2) * NA;
    const V_waist = V_input * taperRatio;

    // Mode field diameter estimate (Marcuse)
    const w_input = coreDia / 2 * (0.65 + 1.619 / Math.pow(V_input, 1.5) + 2.879 / Math.pow(V_input, 6));
    const w_waist = coreAtWaist > 0.1 ? coreAtWaist / 2 * (0.65 + 1.619 / Math.pow(Math.max(V_waist, 0.1), 1.5) + 2.879 / Math.pow(Math.max(V_waist, 0.1), 6)) : 0;

    // Adiabatic condition: taper angle must be small compared to λ/(πw)
    // Rayleigh range z_R = πw²/λ is the characteristic adiabaticity length
    const z_R = Math.PI * w_input * w_input / (wavelength * 1e-3); // μm
    const taperAngle = Math.atan((inputDia - outputDia) / 2 / (taperLength * 1000)) * 1e3; // mrad
    const maxAngle = 100; // mrad (simplified adiabatic threshold)

    // Loss: non-adiabatic coupling loss
    const adiabaticLoss = taperAngle > maxAngle ? 0.1 * Math.pow((taperAngle - maxAngle) / maxAngle, 2) : 0;

    return { taperRatio, coreAtWaist, V_input, V_waist, w_input, w_waist, z_R, taperAngle, maxAngle, adiabaticLoss, NA };
  }, [inputDia, outputDia, taperLength, coreDia, wavelength, n1, n2]);

  const chartData = useMemo(() => {
    const z = Array.from({ length: 200 }, (_, i) => (i / 199) * taperLength);
    const cladProfile = z.map(zi => {
      const t = zi / taperLength;
      return inputDia - (inputDia - outputDia) * (3 * t * t - 2 * t * t * t); // smooth taper
    });
    const coreProfile = cladProfile.map(d => d * coreDia / inputDia);

    return [
      { x: z, y: cladProfile, type: "scatter" as const, mode: "lines" as const, name: "Cladding", line: { color: "#f87171" } },
      { x: z, y: coreProfile, type: "scatter" as const, mode: "lines" as const, name: "Core", line: { color: "#60a5fa" } },
      { x: [0, taperLength], y: [calc.w_input * 2, calc.w_input * 2], type: "scatter" as const, mode: "lines" as const, name: "Input MFD", line: { color: "#34d399", dash: "dash" } },
      { x: [0, taperLength], y: [calc.w_waist * 2, calc.w_waist * 2], type: "scatter" as const, mode: "lines" as const, name: "Waist MFD", line: { color: "#a78bfa", dash: "dot" } },
    ];
  }, [inputDia, outputDia, taperLength, coreDia]);

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Tapered Fiber Design" description="Design adiabatic fiber tapers for mode conversion, evanescent field enhancement, and coupler fabrication.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Input Cladding Ø (μm)" value={inputDia} onChange={setInputDia} min={1} />
        <ValidatedNumberInput label="Output (Waist) Ø (μm)" value={outputDia} onChange={setOutputDia} min={0.1} step="any" />
        <ValidatedNumberInput label="Taper Length (mm)" value={taperLength} onChange={setTaperLength} min={0.1} step="any" />
        <ValidatedNumberInput label="Core Ø (μm)" value={coreDia} onChange={setCoreDia} min={0.1} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={400} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Taper Ratio</p>
          <p className="text-xl font-bold text-red-400">{calc.taperRatio.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V at Waist</p>
          <p className="text-xl font-bold text-blue-400">{calc.V_waist.toFixed(3)}</p>
          <p className="text-xs text-gray-500">{calc.V_waist < 2.405 ? "Single-mode" : "Multi-mode"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Taper Angle</p>
          <p className="text-xl font-bold text-green-400">{calc.taperAngle.toFixed(2)} mrad</p>
          <p className="text-xs text-gray-500">max ≈ {calc.maxAngle} mrad</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Non-adiabatic Loss</p>
          <p className="text-xl font-bold text-yellow-400">{calc.adiabaticLoss.toFixed(4)} dB</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Formulas</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Taper ratio: r = d_waist / d_input</p>
          <p>V-number at waist: V_w = V_input × r</p>
          <p>Adiabatic condition: dθ/dz &lt; r(z) / (L_b × z)</p>
          <p>Rayleigh range: z_R = πw₀²/λ</p>
          <p>MFD (Marcuse): w/a = 0.65 + 1.619/V^1.5 + 2.879/V^6</p>
        </div>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Position along taper (mm)", gridcolor: "#374151" },
        yaxis: { title: "Diameter (μm)", gridcolor: "#374151" },
        legend: { x: 0.01, y: 0.99 },
        margin: { t: 30 },
      }} />
    </CalculatorShell>
  );
}
