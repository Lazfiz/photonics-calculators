"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c, h } from "../../../physics/constants";
import { decoyBb84, maxChannelLossDb, optimalMu, plobBound } from "../../../physics/free-space-comms/qkd";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const positiveOrNull = (x: number) => (Number.isFinite(x) && x > 0 ? x : null);
const SI_RATE = (bps: number) =>
  !(bps > 0) ? "0 b/s" : bps >= 1e6 ? `${fmt(bps / 1e6)} Mb/s` : bps >= 1e3 ? `${fmt(bps / 1e3)} kb/s` : `${fmt(bps)} b/s`;

/** Text for the maximum-distance card; with α = 0 the limit is a loss budget, not a distance. */
function maxDistanceCard(maxLoss: number, maxRange: number, alpha: number, fixedLoss: number) {
  if (maxLoss === 0) return { value: "No key", subtext: "no key even at zero channel loss" };
  if (!Number.isFinite(maxLoss)) return { value: "Unlimited", subtext: "key still positive at 300 dB loss" };
  if (maxLoss < fixedLoss) return { value: "No key", subtext: `fixed loss exceeds the ${fmt(maxLoss, 4)} dB limit` };
  if (alpha === 0) return { value: `${fmt(maxLoss, 4)} dB loss`, subtext: "no attenuation: limit independent of distance" };
  return { value: `${fmt(maxRange, 4)} km`, subtext: `at ${fmt(maxLoss, 4)} dB channel loss, μ fixed` };
}

export default function QuantumKeyDistributionPage() {
  const [muRaw, setMu] = useURLState("mu", 0.48);
  const [rangeRaw, setRange] = useURLState("range", 50); // km
  const [attenuationRaw, setAttenuation] = useURLState("fiberLoss", 0.21); // dB/km
  const [fixedLossRaw, setFixedLoss] = useURLState("fixedLoss", 0); // dB
  const [etaBobRaw, setEtaBob] = useURLState("detectorEfficiency", 0.045);
  const [y0Raw, setY0] = useURLState("y0", 1.7e-6);
  const [eDetRaw, setEDet] = useURLState("eDetector", 0.033);
  const [fEcRaw, setFEc] = useURLState("fEc", 1.22);
  const [repRateRaw, setRepRate] = useURLState("repRate", 1e9); // Hz
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm

  const mu = clamp(muRaw, 1e-6, 1e9, 0.48);
  const range = clamp(rangeRaw, 0, 1e6, 50);
  const alpha = clamp(attenuationRaw, 0, 100, 0.21);
  const fixedLoss = clamp(fixedLossRaw, 0, 300, 0);
  const etaBob = clamp(etaBobRaw, 1e-9, 1, 0.045);
  const y0 = clamp(y0Raw, 0, 0.01, 1.7e-6); // the model assumes Y₀ ≪ 1 (Ma et al. eq. (10) drops −Y₀(1 − e^(−ημ)))
  const eDetector = clamp(eDetRaw, 0, 0.5, 0.033);
  const fEc = clamp(fEcRaw, 1, 10, 1.22);
  const repRate = clamp(repRateRaw, 1, 1e12, 1e9);
  const lambda = clamp(wavelengthRaw, 100, 20000, 1550) * 1e-9;

  const r = useMemo(() => {
    const lossDb = alpha * range + fixedLoss;
    const etaCh = 10 ** (-lossDb / 10);
    const eta = etaCh * etaBob;
    const sys = { y0, eDetector, fEc };
    const res = decoyBb84({ ...sys, mu, eta });
    const maxLoss = maxChannelLossDb({ ...sys, mu }, etaBob, 300);
    const maxRange = !Number.isFinite(maxLoss) ? Infinity : alpha > 0 ? Math.max(0, (maxLoss - fixedLoss) / alpha) : maxLoss >= fixedLoss ? Infinity : 0;
    const muOpt = optimalMu({ ...sys, eta });
    const optKey = decoyBb84({ ...sys, mu: muOpt, eta }).keyPerPulse;
    return {
      lossDb, etaCh, eta, res, maxLoss, maxRange, muOpt: optKey > 0 ? muOpt : NaN, optKey,
      plob: plobBound(etaCh), power: (mu * repRate * h * c) / lambda,
    };
  }, [alpha, range, fixedLoss, etaBob, y0, eDetector, fEc, mu, repRate, lambda]);

  const xMax = Number.isFinite(r.maxRange) && r.maxRange > 0 ? Math.min(1.15 * r.maxRange, 1e5) : Math.max(2 * range, 100);
  const distances = useMemo(() => Array.from({ length: 201 }, (_, i) => (xMax * i) / 200), [xMax]);

  const keyPlot = useMemo(() => {
    const sys = { y0, eDetector, fEc };
    const etaChAt = (d: number) => 10 ** (-(alpha * d + fixedLoss) / 10);
    return [
      { x: distances, y: distances.map((d) => positiveOrNull(decoyBb84({ ...sys, mu, eta: etaChAt(d) * etaBob }).keyPerPulse)), type: "scatter", mode: "lines", name: `Decoy BB84, μ = ${fmt(mu)}`, line: { color: "#06b6d4" } },
      { x: distances, y: distances.map((d) => { const eta = etaChAt(d) * etaBob; return positiveOrNull(decoyBb84({ ...sys, mu: optimalMu({ ...sys, eta }), eta }).keyPerPulse); }), type: "scatter", mode: "lines", name: "Decoy BB84, optimal μ", line: { color: "#22c55e", dash: "dash" } },
      { x: distances, y: distances.map((d) => positiveOrNull(plobBound(etaChAt(d)))), type: "scatter", mode: "lines", name: "PLOB bound −log₂(1 − η_ch)", line: { color: "#9ca3af", dash: "dot" } },
    ];
  }, [distances, y0, eDetector, fEc, alpha, fixedLoss, mu, etaBob]);

  const qberPlot = useMemo(() => {
    const sys = { y0, eDetector, fEc, mu };
    return [
      { x: distances, y: distances.map((d) => 100 * decoyBb84({ ...sys, eta: 10 ** (-(alpha * d + fixedLoss) / 10) * etaBob }).qber), type: "scatter", mode: "lines", name: "QBER E_μ", line: { color: "#f97316" } },
    ];
  }, [distances, y0, eDetector, fEc, mu, alpha, fixedLoss, etaBob]);

  const hasKey = r.res.keyPerPulse > 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Mean Photon Number μ" value={muRaw} onChange={setMu} min={0.000001} max={1e9} step="any" />
        <ValidatedNumberInput label="Distance (km)" value={rangeRaw} onChange={setRange} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="Channel Attenuation (dB/km)" value={attenuationRaw} onChange={setAttenuation} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Fixed Link Loss (dB)" value={fixedLossRaw} onChange={setFixedLoss} min={0} max={300} step="any" />
        <ValidatedNumberInput label="Bob's Efficiency η_Bob (optics × detector)" value={etaBobRaw} onChange={setEtaBob} min={1e-9} max={1} step="any" />
        <ValidatedNumberInput label="Background Probability per Pulse Y₀" value={y0Raw} onChange={setY0} min={0} max={0.01} step="any" />
        <ValidatedNumberInput label="Optical Error e_d" value={eDetRaw} onChange={setEDet} min={0} max={0.5} step="any" />
        <ValidatedNumberInput label="Error-Correction Inefficiency f" value={fEcRaw} onChange={setFEc} min={1} max={10} step="any" />
        <ValidatedNumberInput label="Pulse Rate (Hz)" value={repRateRaw} onChange={setRepRate} min={1} max={1e12} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={20000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Secure key rate" value={hasKey ? SI_RATE(r.res.keyPerPulse * repRate) : "No secure key"} tone={hasKey ? "green" : "red"}
          subtext={`${fmt(r.res.keyPerPulse)} bit per pulse`} />
        <ResultCard label="QBER E_μ" value={`${fmt(r.res.qber * 100)} %`} tone="orange" subtext={`single-photon error e₁ = ${fmt(r.res.e1 * 100)} %`} />
        <ResultCard label="Channel loss / overall η" value={`${fmt(r.lossDb)} dB`} tone="gray" subtext={`η = η_ch·η_Bob = ${fmt(r.eta)}`} />
        <ResultCard label="Gain Q_μ / single-photon gain Q₁" value={`${fmt(r.res.gain)} / ${fmt(r.res.q1)}`} tone="blue" subtext="detections per pulse" />
        <ResultCard label="Maximum distance (key > 0)" tone="cyan" {...maxDistanceCard(r.maxLoss, r.maxRange, alpha, fixedLoss)} />
        <ResultCard label="Optimal μ here" value={fmt(r.muOpt)} tone="purple" subtext={r.optKey > 0 ? `key ${fmt(r.optKey)} bit per pulse` : "no key at any μ ≤ 1"} />
        <ResultCard label="PLOB bound (channel)" value={Number.isFinite(r.plob) ? SI_RATE(r.plob * repRate) : "unbounded"} tone="gray"
          subtext={Number.isFinite(r.plob) ? `${fmt(r.plob)} bit per pulse, any protocol` : "lossless channel, η_ch = 1"} />
        <ResultCard label="Mean optical power" value={`${fmt(10 * Math.log10(r.power * 1e3))} dBm`} tone="gray" subtext={`${fmt(r.power)} W = μ·f_rep·hc/λ`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-2">Secure key per pulse vs distance</h2>
          <ChartPanel data={keyPlot} layout={{
            xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "bit per pulse", type: "log", color: "#9ca3af", gridcolor: "#374151" },
            margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
            legend: { x: 0.4, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
          }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-2">QBER vs distance</h2>
          <ChartPanel data={qberPlot} layout={{
            xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
            yaxis: { title: "QBER (%)", color: "#9ca3af", gridcolor: "#374151", range: [0, 50] },
            margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-sm text-gray-400 space-y-2">
        <p>
          Key rate (GLLP with infinitely many decoy states, Ma et al. 2005):
          {"R = ½·{−f·Q_μ·H₂(E_μ) + Q₁[1 − H₂(e₁)]}"} per pulse, where Q_μ = Y₀ + 1 − e^(−ημ),
          E_μQ_μ = ½Y₀ + e_d(1 − e^(−ημ)), Q₁ = Y₁μe^(−μ) and e₁ = (½Y₀ + e_dη)/Y₁ with Y₁ = Y₀ + η − Y₀η.
          The first term pays for error correction; without it the key never ends.
        </p>
        <p>
          Defaults are the GYS experiment of Ma et al.&apos;s Table 1 (0.21 dB/km, η_Bob = 4.5 %, Y₀ = 1.7×10⁻⁶,
          e_d = 3.3 %, f = 1.22, μ = 0.48), whose key ends at 142 km. For a free-space link, set the attenuation to zero and
          put the geometric and atmospheric loss in the fixed loss. The PLOB bound caps any repeaterless protocol over a
          channel of transmittance η_ch. Finite-key effects are not included.
        </p>
      </div>
    </>
  );
}
