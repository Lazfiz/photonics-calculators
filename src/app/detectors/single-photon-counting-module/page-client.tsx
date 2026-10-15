"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { countLoss, measuredRate } from "../../../physics/detectors/dead-time";
import { countingSnr, photonRate } from "../../../physics/detectors/spad";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 3) => (Number.isFinite(x) ? x.toExponential(digits) : "—");

// Defaults: Excelitas SPCM-AQRH-14 (datasheet Rev 2023-1) at 650 nm: PDE 65 %, 22 ns dead time, < 100 cps dark, 0.5 % afterpulsing.
export default function SPCMPage() {
  const [deadTimeRaw, setDeadTime] = useURLState("deadTime", 22); // ns
  const [darkRaw, setDarkCountRate] = useURLState("darkCountRate", 100); // counts/s
  const [pdeRaw, setPde] = useURLState("quantumEff", 0.65);
  const [powerRaw, setIncidentPower] = useURLState("incidentPower", 1e-12); // W
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 650); // nm
  const [apRaw, setAfterpulseProb] = useURLState("afterpulseProb", 0.005);
  const [gateRaw, setGateTime] = useURLState("gateTime", 1); // s

  const deadTime_ns = clamp(deadTimeRaw, 1, 1e5, 22);
  const dark = clamp(darkRaw, 0, 1e7, 100);
  const pde = clamp(pdeRaw, 0, 1, 0.65);
  const power = clamp(powerRaw, 0, 1e-6, 1e-12);
  const wavelength_nm = clamp(wavelengthRaw, 200, 1100, 650);
  const pap = clamp(apRaw, 0, 0.5, 0.005);
  const gate = clamp(gateRaw, 1e-6, 1e4, 1);

  const tau = deadTime_ns * 1e-9;
  const lambda = wavelength_nm * 1e-9;
  const photons = photonRate(power, lambda);
  const signal = photons * pde;
  const R = signal + dark;
  const m = measuredRate(R, tau, "nonparalyzable");
  const loss = countLoss(R, tau, "nonparalyzable");
  const afterpulseRate = m * pap;
  const snr = countingSnr({ signalRate: signal, darkRate: dark, afterpulseProb: pap, deadTime: tau, gateTime: gate });
  const snrIdeal = countingSnr({ signalRate: signal, darkRate: dark, afterpulseProb: 0, deadTime: 0, gateTime: gate });

  // Incident power over 0.1 fW – 100 pW, 201 log-spaced points: up to Rτ ≈ 5 at the defaults, where the real
  // module already departs from a fixed dead time.
  const powers = Array.from({ length: 201 }, (_, i) => 1e-16 * 10 ** ((i * 6) / 200));
  const sig = powers.map((p) => photonRate(p, lambda) * pde);
  const chartData = [
    { x: powers, y: sig.map((s) => s + dark), type: "scatter" as const, mode: "lines" as const, name: "Avalanche rate R", line: { color: "#60a5fa" } },
    { x: powers, y: sig.map((s) => measuredRate(s + dark, tau, "nonparalyzable")), type: "scatter" as const, mode: "lines" as const, name: "Recorded m = R/(1 + Rτ)", line: { color: "#f87171", dash: "dash" as const } },
    { x: powers, y: sig.map((s) => countingSnr({ signalRate: s, darkRate: dark, afterpulseProb: pap, deadTime: tau, gateTime: gate })), type: "scatter" as const, mode: "lines" as const, name: "SNR in the gate", line: { color: "#34d399" }, yaxis: "y2" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTimeRaw} onChange={setDeadTime} min={1} max={1e5} step="1" />
        <ValidatedNumberInput label="Dark Count Rate (counts/s)" value={darkRaw} onChange={setDarkCountRate} min={0} max={1e7} step="10" />
        <ValidatedNumberInput label="Photon Detection Efficiency" value={pdeRaw} onChange={setPde} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Incident Power (W)" value={powerRaw} onChange={setIncidentPower} min={0} max={1e-6} step="1e-15" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={1100} step="10" />
        <ValidatedNumberInput label="Afterpulse Probability" value={apRaw} onChange={setAfterpulseProb} min={0} max={0.5} step="0.001" />
        <ValidatedNumberInput label="Counting Gate (s)" value={gateRaw} onChange={setGateTime} min={1e-6} max={1e4} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ResultCard label="Incident Photons" value={`${fmt(photons)} /s`} tone="blue" />
        <ResultCard label="Avalanche Rate R (photons + dark)" value={`${fmt(R)} /s`} tone="cyan" />
        <ResultCard label="Recorded Rate m" value={`${fmt(m)} /s`} tone="green" subtext={`${(loss * 100).toFixed(2)} % lost to dead time`} />
        <ResultCard label="Dead-Time Correction R/m = 1 + Rτ" value={Number.isFinite(R) ? (1 + R * tau).toFixed(4) : "—"} tone="purple" />
        <ResultCard label="Afterpulse Rate m·P_ap" value={`${fmt(afterpulseRate)} /s`} tone="orange" />
        <ResultCard label="Total Output m(1 + P_ap)" value={`${fmt(m + afterpulseRate)} /s`} tone="gray" />
        <ResultCard label={`SNR in ${gate} s (corrected)`} value={Number.isFinite(snr) ? snr.toFixed(1) : "—"} tone="yellow" />
        <ResultCard label="SNR without dead time or afterpulses" value={Number.isFinite(snrIdeal) ? snrIdeal.toFixed(1) : "—"} tone="gray" />
      </div>
      {m * gate < 10 && (
        <p className="mb-6 text-sm text-yellow-400">
          Fewer than 10 counts are recorded in the gate: the SNR formula assumes many counts and is only indicative here.
        </p>
      )}
      {loss > 0.1 && (
        <p className="mb-6 text-sm text-yellow-400">
          {(loss * 100).toFixed(0)} % of the avalanches fall in the dead time. Real modules drift from the non-paralyzable model
          here: the SPCM-AQRH datasheet lists a correction of 1.16 at 5 Mc/s recorded, where a fixed 22 ns gives 1.12. Use the
          module&apos;s own correction table at these rates.
        </p>
      )}

      <h2 className="text-xl font-semibold mb-2 mt-6">Key Formulas</h2>
      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1 text-sm font-mono text-gray-400">
        <p>R = P·λ/(hc)·PDE + DCR,  m = R / (1 + R·τ)  [non-paralyzable]</p>
        <p>Afterpulses: m·P_ap, first order (no afterpulses of afterpulses)</p>
        <p>SNR = (R_s/R)·√(m·T) / √(1 + (1 + Rτ)²·P_ap(1 − P_ap)/(1 + P_ap)²)</p>
        <p>The SNR is that of the photon rate after dead-time correction, with DCR and P_ap known and subtracted</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Incident Power (W)", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Count Rate (counts/s)", type: "log", gridcolor: "#374151" },
        yaxis2: { title: "SNR", type: "log", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 80, r: 60 }, autosize: true, showlegend: true,
      }} />
    </>
  );
}
