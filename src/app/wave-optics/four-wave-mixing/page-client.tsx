"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function FourWaveMixingPage() {
  const [wavelengthPump, setWavelengthPump] = useState(1064); // nm
  const [wavelengthSignal, setWavelengthSignal] = useState(1550); // nm
  const [pumpPower, setPumpPower] = useState(100); // mW
  const [n2, setN2] = useState(3.2); // ×10⁻¹⁶ cm²/W
  const [coreArea, setCoreArea] = useState(50); // µm²
  const [fiberLength, setFiberLength] = useState(10); // m
  const [chi3, setChi3] = useState(2.7); // ×10⁻²² m²/V² (silica)

  // Phase matching: 2ωp = ωs + ωi → 1/λi = 2/λp - 1/λs
  const lambdaI = 1 / (2 / wavelengthPump - 1 / wavelengthSignal);
  const freqI = 3e8 / (lambdaI * 1e-9); // Hz
  const freqP = 3e8 / (wavelengthPump * 1e-9);
  const freqS = 3e8 / (wavelengthSignal * 1e-9);

  // Phase mismatch
  const beta2 = 20; // ps²/km typical dispersion
  const deltaBeta = beta2 * 1e-3 * (2 * (2 * Math.PI * freqP) ** 2 / (2 * Math.PI * freqP) ** 2 - (2 * Math.PI * freqS) ** 2 / (2 * Math.PI * freqP) ** 2 - (2 * Math.PI * freqI) ** 2 / (2 * Math.PI * freqP) ** 2) * 1e-12;

  // FWM efficiency estimate
  const gamma = (2 * Math.PI * n2 * 1e-20) / (wavelengthPump * 1e-9 * coreArea * 1e-12); // 1/(W·m)
  const sinc = (x: number) => Math.abs(x) < 1e-12 ? 1 : Math.sin(x) / x;
  const eta = (gamma * pumpPower * 1e-3) ** 2 * sinc((deltaBeta * fiberLength) ** 2);

  // Idler power vs fiber length
  const chartData = useMemo(() => {
    const lengths = Array.from({ length: 200 }, (_, i) => 0.1 + i * 50 / 200);
    const pIdler = lengths.map(L => {
      const g = (2 * Math.PI * n2 * 1e-20) / (wavelengthPump * 1e-9 * coreArea * 1e-12);
      return pumpPower * 1e-3 * (g * pumpPower * 1e-3 * L) ** 2 * 1e3;
    });
    return [
      { x: lengths, y: pIdler, type: "scatter", mode: "lines", name: "Idler power", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [wavelengthPump, wavelengthSignal, pumpPower, n2, coreArea, chi3]);

  const plotLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Fiber length (m)", gridcolor: "#374151" },
    yaxis: { title: "Idler power (mW)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  // FWM bandwidth vs pump-signal detuning
  const bandwidthData = useMemo(() => {
    const detunings = Array.from({ length: 200 }, (_, i) => 0.1 + i * 200 / 200);
    const lambdaSweep = detunings.map(d => {
      const ls = wavelengthPump + d;
      const li = 1 / (2 / wavelengthPump - 1 / ls);
      return li > 0 && li < 5000 ? li : NaN;
    });
    return [
      { x: detunings, y: lambdaSweep, type: "scatter", mode: "lines", name: "Idler λ", line: { color: "#f472b6", width: 2 } },
    ];
  }, [wavelengthPump]);

  const bandwidthLayout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: { color: "#9ca3af" },
    xaxis: { title: "Pump–Signal detuning (nm)", gridcolor: "#374151" },
    yaxis: { title: "Idler wavelength (nm)", gridcolor: "#374151" },
    margin: { t: 30, r: 30, b: 50, l: 70 },
  };

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Four-Wave Mixing (FWM)" description="Degenerate FWM with energy conservation 2ωp = ωs + ωi in fibers and waveguides.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400">Energy:</span> 2ω<sub>p</sub> = ω<sub>s</sub> + ω<sub>i</sub></p>
        <p><span className="text-blue-400">Momentum:</span> 2β<sub>p</sub> = β<sub>s</sub> + β<sub>i</sub> + Δβ</p>
        <p><span className="text-blue-400">γ</span> = 2π n₂ / (λ A<sub>eff</sub>)</p>
        <p><span className="text-blue-400">P<sub>i</sub></span> ∝ γ² P<sub>p</sub>² L² sinc²(Δβ L/2)</p>
        <p><span className="text-blue-400">χ⁽³⁾</span> ≈ (4ε₀ c n₀² / 3) n₂</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Pump λ (nm)" value={wavelengthPump} onChange={setWavelengthPump} />
        <ValidatedNumberInput label="Signal λ (nm)" value={wavelengthSignal} onChange={setWavelengthSignal} />
        <ValidatedNumberInput label="Pump Power (mW)" value={pumpPower} onChange={setPumpPower} />
        <ValidatedNumberInput label="n₂ (×10⁻¹⁶ cm²/W)" value={n2} onChange={setN2} step="0.1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">A<sub>eff</sub> (µm²)</span>
          <input type="number" value={coreArea} onChange={e => setCoreArea(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Fiber Length (m)" value={fiberLength} onChange={setFiberLength} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Idler Wavelength</p>
          <p className="text-xl font-bold text-blue-400">{isFinite(lambdaI) ? lambdaI.toFixed(1) : "—"} nm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Nonlinear Coefficient γ</p>
          <p className="text-xl font-bold text-green-400">{gamma.toExponential(2)} W⁻¹m⁻¹</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWM Efficiency η</p>
          <p className="text-xl font-bold text-orange-400">{eta.toExponential(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">χ⁽³⁾ Estimate</p>
          <p className="text-xl font-bold text-purple-400">{chi3.toFixed(1)} ×10⁻²² m²/V²</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={chartData} layout={plotLayout} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={bandwidthData} layout={bandwidthLayout} />
        </div>
      </div>
    </CalculatorShell>
  );
}
