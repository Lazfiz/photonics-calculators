"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import { applyMueller } from "../../../physics/polarization/mueller";
import {
  MAX_SAMPLES, type DriveWaveform, type ScramblerStage, residualDopVsTime, scramblerMeanMueller, stageResonance,
  worstCaseResidualDop,
} from "../../../physics/polarization/scrambler";
import { degreeOfPolarization, stokesFromEllipse } from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;
const J0_ZERO = 2.4048256; // first zero of J₀ (Abramowitz & Stegun Table 9.5)
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const tab = (on: boolean) => `text-sm px-4 py-2 rounded ${on ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`;
const card = "bg-gray-900 border border-gray-800 rounded-lg p-4";
const layoutOf = (x: string, extra: Record<string, unknown> = {}) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151", ...extra }, yaxis: { title: "Residual DOP", gridcolor: "#374151", range: [0, 1] },
  margin: { t: 20, r: 20, b: 60, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
});

/** URL state of one stage, clamped; angles in degrees, frequency in kHz. */
function useStage(k: number, axis: number, kHz: number) {
  const [axisIn, setAxis] = useURLState(`axis${k}`, axis);
  const [ampIn, setAmp] = useURLState(`amplitude${k}`, J0_ZERO);
  const [biasIn, setBias] = useURLState(`bias${k}`, 0);
  const [freqIn, setFreq] = useURLState(`frequency${k}`, kHz);
  return {
    axis: clamp(axisIn, -180, 180), amp: clamp(ampIn, 0, 20), bias: clamp(biasIn, -20, 20), kHz: clamp(freqIn, 0.01, 1000),
    setAxis, setAmp, setBias, setFreq,
  };
}
type Stage = ReturnType<typeof useStage>;

function StageInputs({ k, s }: { k: number; s: Stage }) {
  return (
    <div className={card}>
      <h3 className="text-sm text-gray-300 mb-3">Stage {k}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ValidatedNumberInput label="Fast-axis azimuth (°)" value={s.axis} onChange={s.setAxis} min={-180} max={180} step="1" />
        <ValidatedNumberInput label="Drive amplitude Γm (rad)" value={s.amp} onChange={s.setAmp} min={0} max={20} step="0.001" />
        <ValidatedNumberInput label="Bias Γ0 (rad)" value={s.bias} onChange={s.setBias} min={-20} max={20} step="0.01" />
        <ValidatedNumberInput label="Frequency (kHz)" value={s.kHz} onChange={s.setFreq} min={0.01} max={1000} step="0.0001" />
      </div>
    </div>
  );
}

export default function PolarizationScramblingPage() {
  const [nIn, setN] = useURLState("stages", 2);
  const [waveformIn, setWaveform] = useURLState("waveform", "sine");
  const [psiIn, setPsi] = useURLState("azimuth", 45);
  const [chiIn, setChi] = useURLState("ellipticity", 0);
  const s1 = useStage(1, 0, 1), s2 = useStage(2, 45, 1.4142), s3 = useStage(3, 0, 2.2361);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const n = Math.round(clamp(nIn, 1, 3));
  const waveform: DriveWaveform = waveformIn === "ramp" ? "ramp" : "sine";
  const psi_deg = clamp(psiIn, -90, 90);
  const chi_deg = clamp(chiIn, -45, 45);

  // Stage objects in SI (rad, Hz), built from primitives.
  const stages = useMemo<ScramblerStage[]>(() => {
    const rows = [
      [s1.axis, s1.bias, s1.amp, s1.kHz], [s2.axis, s2.bias, s2.amp, s2.kHz], [s3.axis, s3.bias, s3.amp, s3.kHz],
    ];
    return rows.slice(0, n).map(([axis, bias, amplitude, kHz]) => ({ axis: axis * DEG, bias, amplitude, frequency: kHz * 1e3, waveform }));
  }, [n, waveform, s1.axis, s1.bias, s1.amp, s1.kHz, s2.axis, s2.bias, s2.amp, s2.kHz, s3.axis, s3.bias, s3.amp, s3.kHz]);

  const Sin = stokesFromEllipse(1, psi_deg * DEG, chi_deg * DEG);
  const longTime = degreeOfPolarization(applyMueller(scramblerMeanMueller(stages), Sin));
  const worst = worstCaseResidualDop(stages);
  const resonance = stageResonance(stages.map((s) => s.frequency));

  const timeChart = useMemo(() => {
    const S = stokesFromEllipse(1, psi_deg * DEG, chi_deg * DEG);
    const fs = stages.map((s) => s.frequency);
    const fmin = Math.min(...fs), fmax = Math.max(...fs);
    // The longest window keeps 64 samples per period of the fastest stage within the sampling limit.
    const tMin = 0.1 / fmin, tMax = Math.min(1000 / fmin, MAX_SAMPLES / (64 * fmax));
    if (!(tMax > 2 * tMin)) return null;
    const windows = Array.from({ length: 25 }, (_, i) => tMin * (tMax / tMin) ** (i / 24));
    const ms = windows.map((w) => w * 1e3);
    const long = degreeOfPolarization(applyMueller(scramblerMeanMueller(stages), S));
    const data: Record<string, unknown>[] = [
      { x: ms, y: residualDopVsTime(stages, S, windows), type: "scatter", mode: "lines+markers", name: "Residual DOP", line: { color: "#60a5fa", width: 2 }, marker: { color: "#60a5fa", size: 3 } },
      { x: [ms[0], ms[24]], y: [long, long], type: "scatter", mode: "lines", name: "Long-time", line: { color: "#9ca3af", dash: "dash" } },
    ];
    return { data, capped: tMax < 1000 / fmin, tMax };
  }, [stages, psi_deg, chi_deg]);

  const amplitudeChart = useMemo(() => {
    const S = stokesFromEllipse(1, psi_deg * DEG, chi_deg * DEG);
    const at = (a: number) => degreeOfPolarization(applyMueller(scramblerMeanMueller(stages.map((s) => ({ ...s, amplitude: a }))), S));
    const x = Array.from({ length: 200 }, (_, i) => (8 * i) / 199);
    const data: Record<string, unknown>[] = [{ x, y: x.map(at), type: "scatter", mode: "lines", name: "Long-time DOP", line: { color: "#60a5fa", width: 2 } }];
    const common = stages[0].amplitude;
    if (stages.every((s) => s.amplitude === common)) {
      data.push({ x: [common], y: [at(common)], type: "scatter", mode: "markers", name: "Current Γm", line: { color: "#facc15" }, marker: { color: "#facc15", size: 8 } });
    }
    return data;
  }, [stages, psi_deg, chi_deg]);

  const setAllAmp = (v: number) => { s1.setAmp(v); s2.setAmp(v); s3.setAmp(v); };

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>stage k: retarder with fast axis θ<sub>k</sub>, Γ<sub>k</sub>(t) = Γ0 + Γm w(f<sub>k</sub> t); a slow detector sees the time-average Stokes vector</p>
        <p>sine: ⟨cos Γ⟩ = J₀(Γm) cos Γ0, ⟨sin Γ⟩ = J₀(Γm) sin Γ0 &nbsp;(J₀ = 0 at Γm = 2.4048 rad)</p>
        <p>ramp: ⟨cos Γ⟩ = [sin(Γ0 + Γm) − sin Γ0]/Γm, &nbsp;⟨sin Γ⟩ = [cos Γ0 − cos(Γ0 + Γm)]/Γm</p>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div role="group" aria-label="Number of stages" className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-300">Stages</span>
          {[1, 2, 3].map((k) => <button key={k} onClick={() => setN(k)} aria-pressed={n === k} className={tab(n === k)}>{k}</button>)}
        </div>
        <label className="block text-sm text-gray-300">
          Drive waveform (all stages)
          <select value={waveform} onChange={(e) => setWaveform(e.target.value)} className="ml-3 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="sine">Sine</option>
            <option value="ramp">Ramp</option>
          </select>
        </label>
        <button onClick={() => setAllAmp(waveform === "sine" ? J0_ZERO : 2 * Math.PI)} className={tab(false)}>
          {waveform === "sine" ? "J₀ zero (2.4048 rad)" : "One full wave (2π rad)"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {waveform === "ramp" ? "Ramp: the amplitude is the total sweep of the retardance; 2π sweeps a full wave. " : ""}
        Use incommensurate frequencies (the defaults are 1, √2 and √5 kHz) so the stage phases are independent.
      </p>
      <div className="space-y-3 mb-6">
        <StageInputs k={1} s={s1} />
        {n >= 2 && <StageInputs k={2} s={s2} />}
        {n >= 3 && <StageInputs k={3} s={s3} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Input azimuth ψ (°)" value={psi_deg} onChange={setPsi} min={-90} max={90} step="1" />
        <ValidatedNumberInput label="Input ellipticity χ (°, −45 … 45)" value={chi_deg} onChange={setChi} min={-45} max={45} step="1" />
      </div>

      {resonance && (
        <p className="text-sm text-yellow-400 mb-4" role="status">
          Stages {resonance.i + 1} and {resonance.j + 1} are near {resonance.q}·f<sub>{resonance.i + 1}</sub> = {resonance.p}·f<sub>{resonance.j + 1}</sub>:
          their phases lock, so the long-time values below (a product of stage means) {Number.isFinite(resonance.beatPeriod)
            ? `hold only for averaging times well beyond the ${fix(resonance.beatPeriod * 1e3, 1)} ms beat period`
            : "do not apply"}. Use incommensurate frequencies; the chart shows the true average.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ResultCard label="Residual DOP, this input (long-time average)" value={fix(longTime, 4)} tone="green" subtext={`${fix(longTime * 100, 2)} % of the light stays polarized`} />
        <ResultCard label="Residual DOP, worst case over all inputs" value={fix(worst, 4)} tone="yellow" subtext="largest over fully polarized inputs" />
      </div>
      {n === 1 && <p className="text-sm text-yellow-400 mb-4">One stage cannot scramble light on its own axis: the Stokes component along its eigen-axis is never touched.</p>}

      <div className="grid gap-4">
        <div className={card}>
          <h3 className="text-sm text-gray-400 mb-2">Residual DOP against averaging time</h3>
          {timeChart ? (
            <>
              <ChartPanel data={timeChart.data} layout={layoutOf("Averaging time (ms)", { type: "log" })} />
              <p className="text-xs text-gray-500 mt-2">
                Residual DOP of the average over [0, T] for this input; the dashed line is the long-time value.
                {timeChart.capped ? ` The longest window is capped at ${fix(timeChart.tMax * 1e3, 1)} ms to keep 64 samples per period of the fastest stage.` : ""}
              </p>
            </>
          ) : <p className="text-sm text-yellow-400">The frequencies are too far apart to average over enough periods of the slowest stage with the sampling limit.</p>}
        </div>
        <div className={card}>
          <h3 className="text-sm text-gray-400 mb-2">Long-time residual DOP against drive amplitude</h3>
          <ChartPanel data={amplitudeChart} layout={layoutOf("Drive amplitude Γm (rad)")} />
          <p className="text-xs text-gray-500 mt-2">
            The same Γm on every stage, for this input; the marker appears when all stages share one amplitude.
            {waveform === "sine" ? " A stage's average vanishes at the zeros of J₀." : " A stage's average vanishes at whole numbers of waves."}
          </p>
        </div>
      </div>
    </>
  );
}
