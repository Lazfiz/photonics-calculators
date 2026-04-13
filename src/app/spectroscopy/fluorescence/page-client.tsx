"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function FluorescencePage() {
  const [tau, setTau] = useURLState("tau", 3);
  const [multiExp, setMultiExp] = useState(false);
  const [tau2, setTau2] = useURLState("tau2", 10);
  const [amp2, setAmp2] = useURLState("amp2", 0.3);

  const chartData = useMemo(() => {
    const tMax = Math.max(tau, multiExp ? tau2 : 0) * 6;
    const t = Array.from({ length: 300 }, (_, i) => (i / 300) * tMax);

    const single = t.map(ti => Math.exp(-ti / tau));
    const biExp = multiExp
      ? t.map(ti => (1 - amp2) * Math.exp(-ti / tau) + amp2 * Math.exp(-ti / tau2))
      : [];

    const traces: Record<string, unknown>[] = [
      { x: t, y: single, type: "scatter" as const, mode: "lines" as const, name: `τ₁ = ${tau} ns`, line: { color: "#60a5fa", width: 2 } },
    ];

    if (multiExp) {
      traces.push(
        { x: t, y: biExp, type: "scatter" as const, mode: "lines" as const, name: `Bi-exponential`, line: { color: "#34d399", width: 2 } },
        { x: t, y: t.map(ti => amp2 * Math.exp(-ti / tau2)), type: "scatter" as const, mode: "lines" as const, name: `Component τ₂`, line: { color: "#f87171", width: 1, dash: "dash" } },
      );
    }

    return traces;
  }, [tau, multiExp, tau2, amp2]);

  const avgLifetime = multiExp
    ? ((1 - amp2) * tau * tau + amp2 * tau2 * tau2) / ((1 - amp2) * tau + amp2 * tau2)
    : tau;

  // Exponential decay → Lorentzian spectrum: Δν_FWHM = 1/(πτ)
  const deltaNu = 1 / (Math.PI * tau * 1e-9); // Hz (τ in ns)
  const centerFreq = 3e8 / (540e-9); // ~5.56e14 Hz for green
  const fwhmNm = 3e8 * 1e9 * deltaNu / (centerFreq * centerFreq); // Δλ = λ²Δν/c
  const fwhmSpectrum = fwhmNm.toExponential(2);
  const fwhmSpectrumSimple = (1 / Math.PI).toFixed(3); // Δν·τ = 1/π ≈ 0.318 (dimensionless)

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Fluorescence Lifetime" description="Exponential decay models for fluorescence. Single and bi-exponential fitting.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="τ₁ (ns)" value={tau} onChange={setTau} min={0.01} max={100} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Bi-exponential</span>
          <input type="checkbox" checked={multiExp} onChange={e => setMultiExp(e.target.checked)}
            className="mt-1 w-5 h-5" />
        </label>
        {multiExp && <>
          <ValidatedNumberInput label="τ₂ (ns)" value={tau2} onChange={setTau2} min={0.01} max={100} />
          <ValidatedNumberInput label="Amplitude₂ (fraction)" value={amp2} onChange={setAmp2} min={0} max={1} />
        </>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Avg. Lifetime ⟨τ⟩</p>
          <p className="text-xl font-bold text-green-400">{typeof avgLifetime === 'number' ? avgLifetime.toFixed(2) : avgLifetime} ns</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FWHM of spectrum (Lorentzian: Δν·τ ≈ 0.318)</p>
          <p className="text-xl font-bold text-blue-400">{fwhmSpectrumSimple} (1/(πτ))</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-300"><span className="text-blue-400 font-mono">I(t) = I₀ · e^(−t/τ)</span></p>
        <p className="text-sm text-gray-300"><span className="text-green-400 font-mono">Bi-exp: I(t) = a₁·e^(−t/τ₁) + a₂·e^(−t/τ₂)</span></p>
        <p className="text-gray-300 text-sm mt-1">Fourier-limited spectral width: Δν = 1/(πτ), Δλ = λ²·Δν/c</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Time (ns)", gridcolor: "#374151" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151", range: [-0.05, 1.1] },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { x: 0.7, y: 0.99 },
        }} />
      </div>
    </CalculatorShell>
  );
}
