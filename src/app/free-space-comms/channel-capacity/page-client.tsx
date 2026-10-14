"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  BITS_PER_SYMBOL, MODULATIONS, type Modulation, bitErrorRate, minimumHardDecisionOverhead, requiredSnrDb,
  shannonCapacity, shannonEbN0,
} from "../../../physics/free-space-comms/channel-capacity";

const COLORS: Record<Modulation, string> = { OOK: "#ef4444", BPSK: "#f59e0b", QPSK: "#22c55e", "8PSK": "#8b5cf6", "16QAM": "#ec4899" };
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const dB = (x: number) => 10 * Math.log10(x);

export default function ChannelCapacityPage() {
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1); // GHz
  const [snrRaw, setSnrDB] = useURLState("snrDB", 20);
  const [modRaw, setModulation] = useURLState("modulation", "QPSK");
  const [ohRaw, setFecOverhead] = useURLState("fecOverhead", 7); // %
  const [berRaw, setBerLimit] = useURLState("berLimit", 3.8e-3);

  const modulation: Modulation = MODULATIONS.find((m) => m === modRaw) ?? "QPSK";
  const bandwidth = clamp(bandwidthRaw, 1e-6, 1e3, 1);
  const snrDB = clamp(snrRaw, -20, 40, 20);
  const overhead = clamp(ohRaw, 0, 100, 7) / 100;
  const berLimit = clamp(berRaw, 1e-15, 0.2, 3.8e-3);

  // Required E_s/N₀ per modulation; 8-PSK takes ≈ 30 ms, so only the limit triggers it.
  const required = useMemo(
    () => Object.fromEntries(MODULATIONS.map((m) => [m, requiredSnrDb(m, berLimit)])) as Record<Modulation, number>,
    [berLimit],
  );

  const calc = useMemo(() => {
    const B = bandwidth * 1e9;
    const snr = 10 ** (snrDB / 10);
    const capacity = shannonCapacity(B, snr);
    const k = BITS_PER_SYMBOL[modulation];
    const eta = k / (1 + overhead); // net b/s/Hz
    const req = required[modulation];
    const ok = snrDB >= req;
    return {
      capacity, shannonSE: capacity / B, eta, ber: bitErrorRate(modulation, snr), req, ok,
      rate: ok ? B * eta : 0,
      gapDb: req - dB(2 ** eta - 1), // extra SNR over Shannon at the same net spectral efficiency
      ebN0LimitDb: dB(shannonEbN0(eta)),
      minOh: minimumHardDecisionOverhead(berLimit),
    };
  }, [bandwidth, snrDB, modulation, overhead, berLimit, required]);

  const plotData = useMemo(() => {
    const B = bandwidth * 1e9;
    const snrs = Array.from({ length: 251 }, (_, i) => -10 + i * 0.2);
    const traces: Record<string, unknown>[] = [{
      x: snrs, y: snrs.map((s) => shannonCapacity(B, 10 ** (s / 10)) / 1e9), type: "scatter", mode: "lines",
      name: "Shannon", line: { color: "#06b6d4", width: 2, dash: "dash" },
    }];
    for (const m of MODULATIONS) {
      const rate = (B * BITS_PER_SYMBOL[m]) / (1 + overhead) / 1e9;
      traces.push({
        x: snrs, y: snrs.map((s) => (s >= required[m] ? rate : 0)), type: "scatter", mode: "lines", name: m,
        line: { color: COLORS[m], width: m === modulation ? 3 : 1.5 },
      });
    }
    return traces;
  }, [bandwidth, overhead, modulation, required]);

  return (
    <>
      <div className="mb-6 max-w-xs">
        <label className="block text-sm text-gray-400 mb-1" htmlFor="modulation">Modulation (Gray-coded, coherent)</label>
        <select id="modulation" value={modulation} onChange={(e) => setModulation(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
          {MODULATIONS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Bandwidth B (GHz)" value={bandwidth} onChange={setBandwidth} min={1e-6} max={1000} step="any" />
        <ValidatedNumberInput label="SNR = Es/N0 (dB)" value={snrDB} onChange={setSnrDB} min={-20} max={40} step="any" />
        <ValidatedNumberInput label="FEC Overhead (%)" value={ohRaw} onChange={setFecOverhead} min={0} max={100} step="any" />
        <ValidatedNumberInput label="FEC Input-BER Limit" value={berLimit} onChange={setBerLimit} min={1e-15} max={0.2} step="any" />
      </div>

      {overhead < calc.minOh && (
        <div role="alert" className="mb-6 rounded-lg border border-yellow-600 bg-yellow-900/30 p-4 text-sm text-yellow-200">
          No hard-decision code can correct an input BER of {fmt(berLimit)} with {fmt(overhead * 100)} % overhead:
          it needs at least {fmt(calc.minOh * 100)} % (code rate ≤ 1 − H₂(p)). The net rate below is not achievable.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Shannon capacity" value={`${fmt(calc.capacity / 1e9, 4)} Gb/s`} tone="cyan" subtext={`${fmt(calc.shannonSE)} b/s/Hz`} />
        <ResultCard label={`${modulation} net rate`} value={`${fmt(calc.rate / 1e9, 4)} Gb/s`} tone={calc.ok ? "green" : "red"}
          subtext={calc.ok ? `${fmt(calc.eta)} b/s/Hz after FEC` : "uncoded BER above the FEC limit"} />
        <ResultCard label={`${modulation} uncoded BER`} value={fmt(calc.ber)} tone="gray" subtext={`at Es/N0 = ${fmt(snrDB)} dB`} />
        <ResultCard label="Required SNR" value={`${fmt(calc.req)} dB`} tone="orange" subtext={`Es/N0 for BER = ${fmt(berLimit)}`} />
        <ResultCard label="Gap to Shannon" value={`${fmt(calc.gapDb)} dB`} tone="purple" subtext="required SNR − 10 log₁₀(2^η − 1) at the same net η" />
        <ResultCard label="Shannon Eb/N0 limit" value={`${fmt(calc.ebN0LimitDb)} dB`} tone="gray" subtext={`(2^η − 1)/η at η = ${fmt(calc.eta)} b/s/Hz`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4">Net rate vs SNR</h2>
        <ChartPanel data={plotData} layout={{
          xaxis: { title: "Es/N0 (dB)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Rate (Gb/s)", color: "#9ca3af", gridcolor: "#374151" },
          margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
          legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">C = B log₂(1 + SNR),   R = B·k/(1 + OH) if BER(Es/N0) ≤ limit, else 0</p>
        <p>
          Complex AWGN channel with Nyquist signalling (symbol rate = B), so SNR = Es/N0 and k bits per symbol give
          k b/s/Hz. Bit error rates are exact for Gray mapping and ideal coherent detection: BPSK Q(√(2γ)), QPSK and
          coherent on-off keying Q(√γ), 16-QAM from Cho &amp; Yoon (2002), 8-PSK from Craig&apos;s (1991) exact phase
          integral. The FEC is modelled by its input-BER limit; ≈ 3.8×10⁻³ is often quoted for 7 % hard-decision codes.
        </p>
        <p>
          Scope: most terrestrial FSO links use intensity modulation with direct detection. Their channel is real and
          non-negative with peak and average power limits, its capacity has no closed form, and its SNR is defined on
          the photocurrent. Photon-counting links follow the Poisson channel
          instead; see the photon-counting BER page.
        </p>
      </div>
    </>
  );
}
