"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  amplitudeWeightedLifetime, decayIntensity, fractionalIntensities, intensityWeightedLifetime, quantumYield,
  type DecayComponent,
} from "../../../physics/spectroscopy/fluorescence-lifetime";

const NS = 1e-9;
const fmt = (x: number, digits = 3) => (!Number.isFinite(x) ? "—" : x.toPrecision(digits));

export default function FluorescenceLifetimePage() {
  const [tau, setTau] = useURLState("tau", 5); // ns
  const [amplitude, setAmplitude] = useURLState("amplitude", 1);
  const [model, setModel] = useURLState("model", "single");
  const [tau2, setTau2] = useURLState("tau2", 1); // ns
  const [frac1, setFrac1] = useURLState("frac1", 0.7); // amplitude fraction α₁
  const [tMax, setTMax] = useURLState("tMax", 30); // ns
  const [tauRad, setTauRad] = useURLState("tauRad", 10); // ns
  const bi = model === "bi";

  const components: DecayComponent[] = useMemo(
    () => (bi
      ? [{ amplitude: amplitude * frac1, lifetime: tau * NS }, { amplitude: amplitude * (1 - frac1), lifetime: tau2 * NS }]
      : [{ amplitude, lifetime: tau * NS }]),
    [bi, amplitude, frac1, tau, tau2],
  );
  const tauAmp = amplitudeWeightedLifetime(components) / NS;
  const tauInt = intensityWeightedLifetime(components) / NS;
  const f = fractionalIntensities(components);
  const phi = quantumYield(components, tauRad * NS);

  const chartData = useMemo(() => {
    const ts = Array.from({ length: 401 }, (_, i) => (i / 400) * tMax);
    const traces: Record<string, unknown>[] = [
      { x: ts, y: ts.map((t) => decayIntensity(components, t * NS)), type: "scatter", mode: "lines", name: "I(t)",
        line: { color: "#34d399", width: 2 } },
    ];
    if (bi) {
      components.forEach((c, i) => traces.push({
        x: ts, y: ts.map((t) => decayIntensity([c], t * NS)), type: "scatter", mode: "lines",
        name: `α${i + 1} e^(−t/τ${i + 1})`, line: { color: i === 0 ? "#60a5fa" : "#c084fc", width: 1, dash: "dash" },
      }));
    }
    traces.push({ x: [0, tMax], y: [amplitude / Math.E, amplitude / Math.E], type: "scatter", mode: "lines",
      name: "I₀/e", line: { color: "#fbbf24", width: 1, dash: "dot" } });
    return traces;
  }, [components, bi, amplitude, tMax]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Decay model</span>
          <select value={model} onChange={(e) => setModel(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="single">Single exponential</option>
            <option value="bi">Bi-exponential</option>
          </select>
        </label>
        <ValidatedNumberInput label="Amplitude I₀" value={amplitude} onChange={setAmplitude} min={0.01} step="0.1" />
        <ValidatedNumberInput label={bi ? "τ₁ (ns)" : "Lifetime τ (ns)"} value={tau} onChange={setTau} min={0.001} max={1e6} step="0.1" />
        {bi && <>
          <ValidatedNumberInput label="τ₂ (ns)" value={tau2} onChange={setTau2} min={0.001} max={1e6} step="0.1" />
          <ValidatedNumberInput label="Amplitude fraction α₁ (0–1)" value={frac1} onChange={setFrac1} min={0} max={1} step="0.05" />
        </>}
        <ValidatedNumberInput label="Radiative lifetime τ_rad (ns)" value={tauRad} onChange={setTauRad} min={0.001} max={1e9} step="0.1" />
        <ValidatedNumberInput label="Time Range (ns)" value={tMax} onChange={setTMax} min={0.01} max={1e6} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {bi ? <>
          <ResultCard label="⟨τ⟩ intensity-weighted" value={`${fmt(tauInt)} ns`} tone="green" subtext="Σαᵢτᵢ² / Σαᵢτᵢ, mean photon arrival time" />
          <ResultCard label="⟨τ⟩ amplitude-weighted" value={`${fmt(tauAmp)} ns`} tone="yellow" subtext="Σαᵢτᵢ / Σαᵢ, ∝ quantum yield" />
          <ResultCard label="Fractional intensities f₁ / f₂" value={`${fmt(f[0] * 100)} % / ${fmt(f[1] * 100)} %`} tone="blue" subtext="fᵢ = αᵢτᵢ / Σαⱼτⱼ" />
        </> : (
          <ResultCard label="Lifetime τ (1/e time)" value={`${fmt(tau)} ns`} tone="green" subtext={`decay rate 1/τ = ${fmt(1 / (tau * NS))} s⁻¹`} />
        )}
        <ResultCard label="Quantum yield Φ" value={Number.isFinite(phi) ? fmt(phi) : "—"} tone="purple"
          subtext={Number.isFinite(phi) ? `⟨τ⟩_amp / τ_rad, non-radiative rate ${fmt(1 / (tauAmp * NS) - 1 / (tauRad * NS))} s⁻¹` : "τ_rad must be ≥ ⟨τ⟩_amp"} />
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "transparent", plot_bgcolor: "transparent",
        font: { color: "#9ca3af" },
        xaxis: { title: "Time (ns)", gridcolor: "#374151" },
        yaxis: { title: "Intensity (a.u.)", type: "log", gridcolor: "#374151" },
        margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
      }} />

      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-1">
        <p><strong>Single:</strong> I(t) = I₀ · exp(−t/τ)</p>
        <p><strong>Bi-exponential:</strong> I(t) = I₀ · [α₁·exp(−t/τ₁) + (1−α₁)·exp(−t/τ₂)]</p>
        <p>Intensity-weighted: ⟨τ⟩_int = Σ fᵢτᵢ = Σαᵢτᵢ² / Σαᵢτᵢ. Amplitude-weighted: ⟨τ⟩_amp = Σαᵢτᵢ / Σαᵢ.</p>
        <p>
          α₁ is the fraction of the initial amplitude, not of the emitted light: the longer component contributes
          more photons (fᵢ). Use ⟨τ⟩_int to compare with a single-exponential fit or a phase/modulation lifetime, and
          ⟨τ⟩_amp for quantum yields and FRET efficiencies; Φ = ⟨τ⟩_amp/τ_rad assumes one radiative rate for all
          components. The log scale shows a single exponential as a straight line.
        </p>
        <p className="text-gray-500">
          References: J. R. Lakowicz, <em>Principles of Fluorescence Spectroscopy</em>, 3rd ed. (2006), ch. 4;
          A. Sillen, Y. Engelborghs, Photochem. Photobiol. 67, 475 (1998).
        </p>
      </div>
    </>
  );
}
