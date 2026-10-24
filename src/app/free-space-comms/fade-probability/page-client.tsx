"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  apertureParameter, gammaGammaCdf, gammaGammaParameters, lognormalFadeProbability, rytovVariance, scintillationIndex,
} from "../../../physics/free-space-comms/turbulence";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const chartLayout = (xTitle: string, yTitle: string, logY = false) => ({
  xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151" },
  yaxis: { title: yTitle, color: "#9ca3af", gridcolor: "#374151", ...(logY ? { type: "log" } : {}) },
  margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
  legend: { x: 0.02, y: 0.02, bgcolor: "rgba(0,0,0,0)" },
});

export default function FadeProbabilityPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 200, max: 20000 }); // nm
  const [cn2, setCn2] = useURLState("cn2", 1e-15, { min: 1e-18, max: 1e-11 }); // m^(−2/3)
  const [distance, setDistance] = useURLState("distance", 1, { min: 0.001, max: 1000 }); // km
  const [fadeThreshold, setFadeThreshold] = useURLState("fadeThreshold", 10, { min: 0, max: 40 }); // dB below the mean
  const [rxDiameter, setRxDiameter] = useURLState("rxDiameter", 0, { min: 0, max: 50 }); // cm
  const [numChannels, setNumChannels] = useURLState("numChannels", 1, { min: 1, max: 8 });

  const n = Math.min(8, Math.max(1, Math.round(numChannels)));

  const model = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const L = distance * 1e3;
    const D = Math.max(0, rxDiameter) * 1e-2;
    const sigmaR2 = rytovVariance(cn2, lambda, L);
    const d2 = apertureParameter(lambda, L, D);
    const sigmaI2 = scintillationIndex(sigmaR2, lambda, L, D);
    const { alpha, beta } = gammaGammaParameters(sigmaR2, d2);
    return { sigmaR2, sigmaI2, alpha, beta };
  }, [wavelength, cn2, distance, rxDiameter]);

  const results = useMemo(() => {
    const t = 10 ** (-fadeThreshold / 10);
    const pGg = gammaGammaCdf(t, model.alpha, model.beta);
    return { pGg, pLn: lognormalFadeProbability(t, model.sigmaI2), pN: pGg ** n };
  }, [model, fadeThreshold, n]);

  const fadeData = useMemo(() => {
    const thresholds = Array.from({ length: 61 }, (_, i) => i * 0.5); // dB below the mean
    const curve = (f: (t: number) => number) => {
      const pts = thresholds.map((dB) => ({ x: dB, y: f(10 ** (-dB / 10)) })).filter((p) => Number.isFinite(p.y) && p.y > 1e-15);
      return { x: pts.map((p) => p.x), y: pts.map((p) => p.y) };
    };
    const gg = (t: number) => gammaGammaCdf(t, model.alpha, model.beta);
    const traces: Record<string, unknown>[] = [
      { type: "scatter", mode: "lines", ...curve(gg), name: "gamma-gamma", line: { color: "#3b82f6", width: 2 } },
      { type: "scatter", mode: "lines", ...curve((t) => lognormalFadeProbability(t, model.sigmaI2)), name: "log-normal", line: { color: "#ef4444", dash: "dash" } },
    ];
    if (n > 1) {
      traces.push({ type: "scatter", mode: "lines", ...curve((t) => gg(t) ** n), name: `gamma-gamma, ${n} receivers`, line: { color: "#22c55e", width: 2 } });
    }
    return traces;
  }, [model, n]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
        <ValidatedNumberInput label="Cn² (m⁻²ᐟ³)" value={cn2} onChange={setCn2} min={1e-18} max={1e-11} step="any" />
        <ValidatedNumberInput label="Link Distance (km)" value={distance} onChange={setDistance} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Fade Threshold (dB below mean)" value={fadeThreshold} onChange={setFadeThreshold} min={0} max={40} step="any" />
        <ValidatedNumberInput label="Receiver Diameter (cm, 0 = point)" value={rxDiameter} onChange={setRxDiameter} min={0} max={50} step="any" />
        <ValidatedNumberInput label="Independent Receivers N" value={numChannels} onChange={setNumChannels} min={1} max={8} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Rytov variance σ_R²" value={fmt(model.sigmaR2)} tone="blue" />
        <ResultCard label="Scintillation index σ_I²(D)" value={fmt(model.sigmaI2)} tone="purple" />
        <ResultCard label="Gamma-gamma α, β" value={`${fmt(model.alpha)}, ${fmt(model.beta)}`} tone="gray" />
        <ResultCard label={`P(fade > ${fmt(fadeThreshold)} dB), gamma-gamma`} value={fmt(results.pGg)} tone="green" subtext="primary result, weak to strong" />
        <ResultCard label="P(fade), log-normal" value={fmt(results.pLn)} tone="orange" subtext="log-normal (weak-turbulence comparison)" />
        {n > 1 && (
          <ResultCard label={`P^N, N = ${n}`} value={fmt(results.pN)} tone="cyan"
            subtext="N uncorrelated receivers, selection combining: P^N (separation ≫ √(λL))" />
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Fade probability vs threshold</h2>
        <ChartPanel data={fadeData} layout={chartLayout("Fade threshold below the mean (dB)", "P(I < threshold)", true)} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">I = XY,   α = 1/(e^σ²lnX − 1),   β = 1/(e^σ²lnY − 1)</p>
        <p>
          Gamma-gamma irradiance with α and β set by the aperture-averaged large- and small-scale log variances (Al-Habash,
          Andrews &amp; Phillips, Opt. Eng. 40, 1554, 2001). It is valid from weak to strong turbulence. The log-normal
          curve is the weak-turbulence comparison and underestimates deep fades in moderate to strong turbulence.
        </p>
        <p>
          P(I &lt; t⟨I⟩) with t = 10^(−F/10) for a fade of F dB below the mean. For N receivers whose separation is far
          larger than √(λL), the fades are independent and selection combining fails only when all fail: P^N.
        </p>
      </div>
    </>
  );
}
