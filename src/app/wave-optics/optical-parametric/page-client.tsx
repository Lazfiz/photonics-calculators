"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function OpticalParametricPage() {
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 532); // nm
  const [signalWavelength, setSignalWavelength] = useURLState("signalWavelength", 1064); // nm
  const [deff, setDeff] = useURLState("deff", 14.0); // pm/V (PPLN)
  const [crystalLength, setCrystalLength] = useURLState("crystalLength", 20); // mm
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 1000); // mW
  const [pumpWaist, setPumpWaist] = useURLState("pumpWaist", 50); // µm
  const [pumpPowerW, setPumpPowerW] = useURLState("pumpPowerW", 1000); // mW for OPO threshold
  const [lossRoundTrip, setLossRoundTrip] = useURLState("lossRoundTrip", 5); // %
  const [mode, setMode] = useState<"OPA" | "OPO">("OPA");

  // Idler wavelength: 1/λi = 1/λp - 1/λs
  const lambdaI = 1 / (1 / pumpWavelength - 1 / signalWavelength);

  // Tuning curve: idler wavelength vs signal wavelength
  const tuningData = useMemo(() => {
    const signals = Array.from({ length: 200 }, (_, i) => pumpWavelength * 1.05 + i * (pumpWavelength * 2 - pumpWavelength * 1.05) / 200);
    const idlers = signals.map(ls => {
      const li = 1 / (1 / pumpWavelength - 1 / ls);
      return li > 0 ? li : NaN;
    });
    return [
      { x: signals, y: idlers, type: "scatter", mode: "lines", name: "λ_i(λ_s)", line: { color: "#60a5fa", width: 2 } },
      { x: [signalWavelength, signalWavelength], y: [0, lambdaI || 5000], type: "scatter", mode: "lines", name: "Current", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [pumpWavelength, signalWavelength]);

  // OPO threshold
  const n = 2.2;
  const lambdaPm = pumpWavelength * 1e-9;
  const area = Math.PI * pumpWaist * 1e-6 ** 2;
  const Pth = (lossRoundTrip / 100) * Math.PI ** 3 * n ** 3 * (lambdaPm) ** 3 * area / (8 * deff * 1e-12 ** 2 * crystalLength * 1e-3);

  // Gain vs signal wavelength (phase-matching bandwidth)
  const gainBWData = useMemo(() => {
    const signals = Array.from({ length: 200 }, (_, i) => signalWavelength * 0.9 + i * signalWavelength * 0.2 / 200);
    const gains = signals.map(ls => {
      const li = 1 / (1 / pumpWavelength - 1 / ls);
      if (li <= 0) return -50;
      const dLambda = ls - signalWavelength;
      const deltaK = 2 * Math.PI * 1000 * dLambda * 1e-9; // approx phase mismatch
      const sinc = deltaK * crystalLength * 1e-3 / 2;
      const sincVal = sinc === 0 ? 1 : Math.sin(sinc) / sinc;
      const baseGain = 10 * Math.log10(Math.cosh(0.5) ** 2);
      return baseGain + 10 * Math.log10(sincVal ** 2 + 0.01);
    });
    return [
      { x: signals, y: gains, type: "scatter", mode: "lines", name: "Gain", line: { color: "#34d399", width: 2 } },
    ];
  }, [pumpWavelength, signalWavelength, crystalLength]);

  const tuningLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Signal wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Idler wavelength (nm)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  const gainLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Signal wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Relative gain (dB)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  // Parametric gain estimate for OPA mode
  const omegaS = 2 * Math.PI * 3e8 / (signalWavelength * 1e-9);
  const gOPA = (omegaS * deff * 1e-12) / (n * 3e8) * Math.sqrt(2 * pumpPower * 1e-3 / (8.854e-12 * n * 3e8 * area));
  const gainOPA = 10 * Math.log10(Math.cosh(gOPA * crystalLength * 1e-3) ** 2);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="OPA / OPO Design" description="Optical parametric oscillator and amplifier design — tuning curves, thresholds, and gain bandwidth.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">Energy:</span> 1/λ<sub>p</sub> = 1/λ<sub>s</sub> + 1/λ<sub>i</sub></p>
        <p><span className="text-blue-400">P<sub>th</sub></span> = (α · π³ · n³ · λ<sub>p</sub>³ · A) / (8 · d<sub>eff</sub>² · L)</p>
        <p><span className="text-blue-400">G<sub>OPA</sub></span> = cosh²(g · L)</p>
        <p><span className="text-blue-400">Δν<sub>BW</sub></span> ≈ 1/(L · |1/v<sub>g,p</sub> − 1/v<sub>g,s</sub>|)</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode("OPA")} className={`px-4 py-2 rounded ${mode === "OPA" ? "bg-blue-600" : "bg-gray-800"}`}>OPA Mode</button>
        <button onClick={() => setMode("OPO")} className={`px-4 py-2 rounded ${mode === "OPO" ? "bg-blue-600" : "bg-gray-800"}`}>OPO Mode</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pump λ (nm)" value={pumpWavelength} onChange={setPumpWavelength} />
        <ValidatedNumberInput label="Signal λ (nm)" value={signalWavelength} onChange={setSignalWavelength} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">d<sub>eff</sub> (pm/V)</span>
          <input type="number" value={deff} onChange={e => setDeff(+e.target.value)} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Crystal Length (mm)" value={crystalLength} onChange={setCrystalLength} />
        <ValidatedNumberInput label="Pump Power (mW)" value={pumpPower} onChange={setPumpPower} />
        <ValidatedNumberInput label="Pump Waist (µm)" value={pumpWaist} onChange={setPumpWaist} />
        {mode === "OPO" && (
          <ValidatedNumberInput label="Round-trip Loss (%)" value={lossRoundTrip} onChange={setLossRoundTrip} step="0.5" />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Idler Wavelength</p>
          <p className="text-xl font-bold text-blue-400">{isFinite(lambdaI) && lambdaI > 0 ? lambdaI.toFixed(1) : "—"} nm</p>
        </div>
        {mode === "OPA" ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">OPA Gain</p>
            <p className="text-xl font-bold text-green-400">{gainOPA.toFixed(1)} dB</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">OPO Threshold</p>
            <p className="text-xl font-bold text-green-400">{Pth.toExponential(2)} W</p>
          </div>
        )}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Pump–Signal Ratio</p>
          <p className="text-xl font-bold text-orange-400">{(pumpWavelength / signalWavelength).toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">P/P<sub>th</sub></p>
          <p className="text-xl font-bold text-purple-400">{(pumpPower * 1e-3 / Pth).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={tuningData} layout={tuningLayout} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={gainBWData} layout={gainLayout} />
        </div>
      </div>
    </CalculatorShell>
  );
}
