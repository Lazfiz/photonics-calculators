"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { beamRadius } from "../../../physics/free-space-comms/pointing-loss";
import {
  beamWanderDiffractionFactor, beamWanderLossDb, beamWanderVariance, beamWanderVarianceDiffracting, friedParameter, rytovVariance,
} from "../../../physics/free-space-comms/turbulence";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const chartLayout = (xTitle: string, yTitle: string, logX = false) => ({
  xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151", ...(logX ? { type: "log" } : {}) },
  yaxis: { title: yTitle, color: "#9ca3af", gridcolor: "#374151" },
  margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
  legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
});

export default function BeamWanderPage() {
  const [cn2, setCn2] = useURLState("cn2", 1e-14, { min: 1e-18, max: 1e-11 }); // m^(−2/3)
  const [pathLength, setPathLength] = useURLState("pathLength", 1, { min: 0.001, max: 1000 }); // km
  const [w0Cm, setW0Cm] = useURLState("beamRadius", 2, { min: 0.01, max: 100 }); // transmit beam radius W₀, cm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 200, max: 20000 }); // nm

  const results = useMemo(() => {
    const L = pathLength * 1e3;
    const W0 = w0Cm * 1e-2;
    const lambda = wavelength * 1e-9;
    const zR = (Math.PI * W0 ** 2) / lambda;
    const factor = beamWanderDiffractionFactor(L / zR);
    const variance = beamWanderVariance(cn2, L, W0) * factor;
    const rms = Math.sqrt(variance);
    const W = beamRadius(W0, lambda, L);
    const sigmaR2 = rytovVariance(cn2, lambda, L);
    const r0 = friedParameter(cn2, lambda, L);
    return {
      variance, rms, angular: rms / L, factor, lOverZr: L / zR, W, lossDb: beamWanderLossDb(variance, W), sigmaR2, r0,
      strong: sigmaR2 > 1 || 2 * W0 > r0,
    };
  }, [cn2, pathLength, w0Cm, wavelength]);

  const cn2Data = useMemo(() => {
    const L = pathLength * 1e3;
    const W0 = w0Cm * 1e-2;
    const lambda = wavelength * 1e-9;
    const n = 100;
    const xs = Array.from({ length: n }, (_, i) => 10 ** (-18 + (7 * i) / (n - 1))); // 1e-18 .. 1e-11
    return [{
      type: "scatter", mode: "lines", x: xs, y: xs.map((c) => Math.sqrt(beamWanderVarianceDiffracting(c, L, W0, lambda)) * 100),
      name: "rms wander", line: { color: "#a78bfa", width: 2 },
    }, {
      type: "scatter", mode: "markers", x: [cn2], y: [Math.sqrt(beamWanderVarianceDiffracting(cn2, L, W0, lambda)) * 100],
      name: "Current", marker: { color: "#facc15", size: 10 },
    }];
  }, [cn2, pathLength, w0Cm, wavelength]);

  const distData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const W0 = w0Cm * 1e-2;
    const n = 80;
    const kLo = Math.min(0.1, pathLength / 10);
    const kHi = Math.max(10, pathLength * 10);
    const kms = Array.from({ length: n }, (_, i) => kLo * (kHi / kLo) ** (i / (n - 1))); // log-spaced
    return [
      { type: "scatter", mode: "lines", x: kms, y: kms.map((k) => Math.sqrt(beamWanderVarianceDiffracting(cn2, k * 1e3, W0, lambda)) * 100), name: "rms wander", line: { color: "#a78bfa", width: 2 } },
      { type: "scatter", mode: "lines", x: kms, y: kms.map((k) => Math.sqrt(beamWanderVariance(cn2, k * 1e3, W0)) * 100), name: "wander without diffraction (W₀ form)", line: { color: "#a78bfa", dash: "dot" } },
      { type: "scatter", mode: "lines", x: kms, y: kms.map((k) => beamRadius(W0, lambda, k * 1e3) * 100), name: "beam radius W(L)", line: { color: "#3b82f6", dash: "dash" } },
      { type: "scatter", mode: "markers", x: [pathLength], y: [Math.sqrt(beamWanderVarianceDiffracting(cn2, pathLength * 1e3, W0, lambda)) * 100],
        name: "Current wander", marker: { color: "#facc15", size: 10 } },
      { type: "scatter", mode: "markers", x: [pathLength], y: [beamRadius(W0, lambda, pathLength * 1e3) * 100],
        name: "Current W(L)", marker: { color: "#f43f5e", size: 10 } },
    ];
  }, [cn2, pathLength, w0Cm, wavelength]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Cn² (m⁻²ᐟ³)" value={cn2} onChange={setCn2} min={1e-18} max={1e-11} step="any" />
        <ValidatedNumberInput label="Path Length (km)" value={pathLength} onChange={setPathLength} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Transmit Beam Radius W₀ (cm)" value={w0Cm} onChange={setW0Cm} min={0.01} max={100} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Wander variance ⟨r_c²⟩" value={`${fmt(results.variance)} m²`} tone="purple"
          subtext={`F = ${fmt(results.factor)} at L/z_R = ${fmt(results.lOverZr)}`} />
        <ResultCard label="RMS wander √⟨r_c²⟩" value={`${fmt(results.rms * 100)} cm`} tone="blue" />
        <ResultCard label="Angular RMS wander" value={`${fmt(results.angular * 1e6)} µrad`} tone="cyan" subtext="√⟨r_c²⟩ / L" />
        <ResultCard label="Beam radius W(L)" value={`${fmt(results.W * 100)} cm`} tone="gray" subtext="free-space Gaussian spread at the receiver" />
        <ResultCard label="Mean on-axis loss" value={`${fmt(results.lossDb)} dB`} tone="orange" subtext="10·log10(1 + 2⟨r_c²⟩/W²)" />
        <ResultCard label="Rytov variance σ_R²" value={fmt(results.sigmaR2)} tone="blue" subtext="plane wave" />
        <ResultCard label="Fried parameter r₀" value={`${fmt(results.r0 * 100)} cm`} tone="cyan" subtext={`2W₀ = ${fmt(w0Cm * 2)} cm`} />
      </div>

      {results.strong && (
        <div role="alert" className="mb-6 rounded-lg border border-yellow-600 bg-yellow-900/30 p-4 text-sm text-yellow-200">
          Outside weak fluctuations (σ_R² &lt; 1, 2W₀ &lt; r₀): the weak-turbulence wander formula overestimates the
          wander here.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">RMS wander vs Cn²</h2>
          <ChartPanel data={cn2Data} layout={chartLayout("Cn² (m⁻²ᐟ³)", "RMS wander (cm)", true)} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Wander and beam radius vs distance</h2>
          <ChartPanel data={distData} layout={chartLayout("Distance (km)", "Radius (cm)", true)} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">⟨r_c²⟩ = 2.42 Cn² L³ W₀^(−1/3) · F,   F = 3∫₀¹ ξ² (1 + ((1 − ξ)L/z_R)²)^(−1/6) dξ,   loss = 10·log10(1 + 2⟨r_c²⟩/W²)</p>
        <p>
          Collimated beam, Kolmogorov spectrum with infinite outer scale (Andrews &amp; Phillips, <em>Laser Beam
          Propagation through Random Media</em>, 2nd ed., 2005). Eddies larger than the beam at each point z deflect it,
          with lever arm ξ = 1 − z/L to the receiver. Their 2.42 Cn² L³ W₀^(−1/3) takes the beam radius as W₀ all along the
          path; keeping its diffraction, W(z) = W₀√(1 + (z/z_R)²) with z_R = πW₀²/λ, multiplies it by F (our derivation;
          the same integral as Berman, Chumak &amp; Gorshkov, Phys. Rev. E 76, 056606, 2007). F ≈ 1 within a Rayleigh
          range and falls as 2.025 (L/z_R)^(−1/3) far beyond it, where the wander grows as L^(8/3). A finite outer scale reduces the
          wander, so the value is an upper bound.
        </p>
      </div>
    </>
  );
}
