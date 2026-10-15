"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { countLoss, measuredRate } from "../../../physics/detectors/dead-time";
import { arrheniusFactor, countingSnr, dbmToWatts, doublingInterval, photonRate } from "../../../physics/detectors/spad";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");
const K = 273.15;

// Defaults: free-running InGaAs/InP NFAD of Korzh et al., Appl. Phys. Lett. 104, 081108 (2014): at −110 °C,
// 11.5 % efficiency at 1550 nm with 1.19 cps dark counts, 2.2 % afterpulsing and a 20 µs hold-off.
export default function SPADPage() {
  const [pdeRaw, setPde] = useURLState("pde", 0.115);
  const [dcrRaw, setDcr] = useURLState("dcr", 1.19); // counts/s at the reference temperature
  const [refTempRaw, setRefTemp] = useURLState("refTemperature", -110); // °C
  const [tempRaw, setTemp] = useURLState("temperature", -110); // °C
  const [eaRaw, setEa] = useURLState("activationEnergy", 0.25); // eV
  const [deadTimeRaw, setDeadTime] = useURLState("deadTime", 20000); // ns
  const [apRaw, setAfterpulseProb] = useURLState("afterpulseProb", 0.022);
  const [powerRaw, setOpticalPower] = useURLState("opticalPower", -120); // dBm
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [gateRaw, setGateTime] = useURLState("gateTime", 1); // s

  const pde = clamp(pdeRaw, 0, 1, 0.115);
  const dcrRef = clamp(dcrRaw, 0, 1e8, 1.19);
  const refTemp_C = clamp(refTempRaw, -200, 100, -110);
  const temp_C = clamp(tempRaw, -200, 100, -110);
  const ea = clamp(eaRaw, 0, 1.5, 0.25);
  const deadTime_ns = clamp(deadTimeRaw, 1, 1e6, 20000);
  const pap = clamp(apRaw, 0, 0.5, 0.022);
  const power_dBm = clamp(powerRaw, -160, -30, -120);
  const wavelength_nm = clamp(wavelengthRaw, 200, 2000, 1550);
  const gate = clamp(gateRaw, 1e-6, 1e4, 1);

  const tau = deadTime_ns * 1e-9;
  const lambda = wavelength_nm * 1e-9;
  const photons = photonRate(dbmToWatts(power_dBm), lambda);
  const signal = photons * pde;
  const dcr = dcrRef * arrheniusFactor(ea, temp_C + K, refTemp_C + K);
  const R = signal + dcr;
  const m = measuredRate(R, tau, "nonparalyzable");
  const loss = countLoss(R, tau, "nonparalyzable");
  const afterpulseRate = m * pap;
  const snr = countingSnr({ signalRate: signal, darkRate: dcr, afterpulseProb: pap, deadTime: tau, gateTime: gate });
  const doubling = doublingInterval(ea, temp_C + K);

  // DCR over T_ref ± 60 °C, widened to include the operating point (above 0 K).
  const tLo = Math.max(-260, Math.min(refTemp_C - 60, temp_C - 10));
  const tHi = Math.max(refTemp_C + 60, temp_C + 10);
  const temps = Array.from({ length: 121 }, (_, i) => tLo + (i * (tHi - tLo)) / 120);
  const dcrChart = [
    { x: temps, y: temps.map((t) => dcrRef * arrheniusFactor(ea, t + K, refTemp_C + K)), type: "scatter" as const, mode: "lines" as const, name: "DCR", line: { color: "#f87171" } },
    { x: [temp_C], y: [dcr], type: "scatter" as const, mode: "markers" as const, name: "Operating point", marker: { color: "#fbbf24", size: 8 } },
  ];
  // Power from 40 dB below to 30 dB above the input.
  const pwr = Array.from({ length: 141 }, (_, i) => power_dBm - 40 + i * 0.5);
  const snrChart = [
    { x: pwr, y: pwr.map((p) => countingSnr({ signalRate: photonRate(dbmToWatts(p), lambda) * pde, darkRate: dcr, afterpulseProb: pap, deadTime: tau, gateTime: gate })), type: "scatter" as const, mode: "lines" as const, name: "With dead time and afterpulses", line: { color: "#34d399" } },
    { x: pwr, y: pwr.map((p) => countingSnr({ signalRate: photonRate(dbmToWatts(p), lambda) * pde, darkRate: dcr, afterpulseProb: 0, deadTime: 0, gateTime: gate })), type: "scatter" as const, mode: "lines" as const, name: "Ideal (τ = 0, P_ap = 0)", line: { color: "#6b7280", dash: "dash" as const } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Photon Detection Efficiency" value={pdeRaw} onChange={setPde} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Dark Count Rate at T_ref (counts/s)" value={dcrRaw} onChange={setDcr} min={0} max={1e8} step="1" />
        <ValidatedNumberInput label="Reference Temperature T_ref (°C)" value={refTempRaw} onChange={setRefTemp} min={-200} max={100} step="5" />
        <ValidatedNumberInput label="Operating Temperature (°C)" value={tempRaw} onChange={setTemp} min={-200} max={100} step="5" />
        <ValidatedNumberInput label="DCR Activation Energy (eV)" value={eaRaw} onChange={setEa} min={0} max={1.5} step="0.01" />
        <ValidatedNumberInput label="Dead Time (ns)" value={deadTimeRaw} onChange={setDeadTime} min={1} max={1e6} step="10" />
        <ValidatedNumberInput label="Afterpulse Probability" value={apRaw} onChange={setAfterpulseProb} min={0} max={0.5} step="0.005" />
        <ValidatedNumberInput label="Optical Power (dBm)" value={powerRaw} onChange={setOpticalPower} min={-160} max={-30} step="1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step="10" />
        <ValidatedNumberInput label="Counting Gate (s)" value={gateRaw} onChange={setGateTime} min={1e-6} max={1e4} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ResultCard label="Photon Rate" value={`${fmt(photons)} /s`} tone="blue" />
        <ResultCard label="DCR at Operating T" value={`${fmt(dcr)} /s`} tone="red" subtext={Number.isFinite(doubling) ? `doubles every ${doubling.toFixed(1)} °C` : undefined} />
        <ResultCard label="Recorded Rate m" value={`${fmt(m)} /s`} tone="green" subtext={`R·τ = ${(R * tau).toFixed(3)}, ${(loss * 100).toFixed(1)} % lost`} />
        <ResultCard label="Afterpulse Rate m·P_ap" value={`${fmt(afterpulseRate)} /s`} tone="orange" />
        <ResultCard label={`SNR in ${gate} s`} value={Number.isFinite(snr) ? snr.toFixed(2) : "—"} tone="yellow" />
      </div>
      {m * gate < 10 && (
        <p className="mb-6 text-sm text-yellow-400">
          Fewer than 10 counts are recorded in the gate: the SNR formula assumes many counts and is only indicative here.
        </p>
      )}
      {loss > 0.1 && (
        <p className="mb-6 text-sm text-yellow-400">
          R·τ = {(R * tau).toFixed(2)}: {(loss * 100).toFixed(0)} % of the avalanches fall in the dead time and the recorded rate
          saturates at 1/τ = {fmt(1 / tau)} /s. {pap > 0 ? "The corrected SNR falls as the correction gain (1 + Rτ)² amplifies the afterpulse noise" : "Without afterpulses the corrected SNR levels off at √(T/τ)"}; attenuate the light or shorten the dead time.
        </p>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6 mt-6 text-sm text-gray-300 space-y-1">
        <p>R = P·λ/(hc)·PDE + DCR(T);  m = R / (1 + R·τ)  [non-paralyzable]</p>
        <p>DCR(T) = DCR(T_ref) · exp[−(E_a/k_B)(1/T − 1/T_ref)], at a fixed excess bias</p>
        <p>SNR = (R_s/R)·√(m·T) / √(1 + (1 + Rτ)²·P_ap(1 − P_ap)/(1 + P_ap)²)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={dcrChart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Dark Count Rate vs Temperature", font: { size: 12 } },
          xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
          yaxis: { title: "DCR (counts/s)", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
        <ChartPanel data={snrChart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: `SNR vs Optical Power (${gate} s gate)`, font: { size: 12 } },
          xaxis: { title: "Power (dBm)", gridcolor: "#374151" },
          yaxis: { title: "SNR", gridcolor: "#374151", type: "log" },
          margin: { t: 40, r: 20, b: 50, l: 60 },
        }} />
      </div>
    </>
  );
}
