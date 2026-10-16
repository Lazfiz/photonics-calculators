"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cameraSnr, EM_REGISTER_STAGES, emExcessNoiseFactorSq } from "../../../physics/detectors/camera-snr";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fix = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

export default function ElectronMultiplyingPage() {
  const [signalRaw, setSignalElectrons] = useURLState("signalElectrons", 10);
  const [darkRaw, setDarkCurrent] = useURLState("darkCurrent", 0.001);
  const [emccdReadRaw, setEmccdReadNoise] = useURLState("emccdReadNoise", 60);
  const [scmosReadRaw, setScmosReadNoise] = useURLState("scmosReadNoise", 1.5);
  const [emGainRaw, setEmGain] = useURLState("emGain", 1000);
  const [stagesRaw, setStages] = useURLState("stages", EM_REGISTER_STAGES);

  const signalElectrons = clamp(signalRaw, 0, 1e5, 10);
  const darkCurrent = clamp(darkRaw, 0, 1e3, 0.001);
  const emccdReadNoise = clamp(emccdReadRaw, 0, 500, 60);
  const scmosReadNoise = clamp(scmosReadRaw, 0, 100, 1.5);
  const emGain = clamp(emGainRaw, 1, 1e4, 1000);
  const stages = Math.round(clamp(stagesRaw, 1, 2000, EM_REGISTER_STAGES));

  const emccdAt = (signal: number, gain: number) =>
    cameraSnr({ signal, dark: darkCurrent, read: emccdReadNoise, gain, excessNoiseFactorSq: emExcessNoiseFactorSq(gain, stages) });
  const scmosAt = (signal: number) => cameraSnr({ signal, dark: darkCurrent, read: scmosReadNoise });
  const enf2 = emExcessNoiseFactorSq(emGain, stages);
  const emccdSNR = emccdAt(signalElectrons, emGain);
  const scmosSNR = scmosAt(signalElectrons);
  const winner = !Number.isFinite(emccdSNR) || !Number.isFinite(scmosSNR) ? "—" : emccdSNR > scmosSNR ? "EMCCD" : "sCMOS";

  const signals = Array.from({ length: 201 }, (_, i) => 10 ** (-1 + i / 50));
  const snrVsSignal = [
    { x: signals, y: signals.map(s => emccdAt(s, emGain)), type: "scatter" as const, mode: "lines" as const, name: "EMCCD", line: { color: "#60a5fa" } },
    { x: signals, y: signals.map(scmosAt), type: "scatter" as const, mode: "lines" as const, name: "sCMOS", line: { color: "#34d399" } },
  ];
  const gains = Array.from({ length: 201 }, (_, i) => 10 ** (i / 50));
  const snrVsGain = [
    { x: gains, y: gains.map(g => emccdAt(signalElectrons, g)), type: "scatter" as const, mode: "lines" as const, name: "EMCCD SNR", line: { color: "#60a5fa" } },
    { x: [1, 1e4], y: [scmosSNR, scmosSNR], type: "scatter" as const, mode: "lines" as const, name: "sCMOS SNR", line: { color: "#34d399", dash: "dash" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Signal (e⁻/pix/frame)" value={signalRaw} onChange={setSignalElectrons} min={0} max={100000} step="1" />
        <ValidatedNumberInput label="Dark Current (e⁻/pix/frame)" value={darkRaw} onChange={setDarkCurrent} min={0} max={1000} step="0.001" />
        <ValidatedNumberInput label="EMCCD Read Noise (e⁻)" value={emccdReadRaw} onChange={setEmccdReadNoise} min={0} max={500} step="5" />
        <ValidatedNumberInput label="sCMOS Read Noise (e⁻)" value={scmosReadRaw} onChange={setScmosReadNoise} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="EM Gain" value={emGainRaw} onChange={setEmGain} min={1} max={10000} step="50" />
        <ValidatedNumberInput label="Gain-Register Stages N" value={stagesRaw} onChange={setStages} min={1} max={2000} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="EMCCD SNR" value={fix(emccdSNR, 3)} tone="blue" />
        <ResultCard label="sCMOS SNR" value={fix(scmosSNR, 3)} tone="green" />
        <ResultCard label="Winner" value={winner} tone={winner === "EMCCD" ? "blue" : "green"} />
        <ResultCard label="ENF²" value={fix(enf2, 4)} tone="yellow" />
      </div>
      {!Number.isFinite(enf2) && (
        <p className="mb-6 text-sm text-yellow-400">A gain of {emGain} needs more than 100 % multiplication per stage with {stages} stages (G ≤ 2^N).</p>
      )}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>EMCCD: σ = √(F²·(S + D) + (σ_read/G)²), F² = 2(G − 1)·G^(−(N+1)/N) + 1/G</p>
        <p>sCMOS: σ = √(S + D + σ_read²)</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={snrVsSignal} layout={{ xaxis: { title: "Signal (e⁻/pix/frame)", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151", type: "log" } }} title="SNR vs Signal" />
        <ChartPanel data={snrVsGain} layout={{ xaxis: { title: "EM Gain", gridcolor: "#374151", type: "log" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="EMCCD SNR vs Gain" />
      </div>
    </>
  );
}
