"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { absorbanceFromTransmittance, attenuationDb, transmittance } from "../../../physics/spectroscopy/lambert-beer-law";

const odPresets = [0.1, 0.3, 1, 2, 3, 4, 6];
const OD_MAX = 8, T_MIN = 1e-6, T_MAX = 100; // T in percent; T_MIN is OD 8
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmtPct = (t: number) => (t >= 0.01 ? t.toPrecision(4) : t.toExponential(3));

export default function OpticalDensityPage() {
  const [transmissionRaw, setTransmission] = useURLState("transmission", 1); // %
  const [absorbanceRaw, setAbsorbance] = useURLState("absorbance", 2);
  const [modeRaw, setMode] = useURLState("mode", "abs");

  const mode = modeRaw === "trans" ? "trans" : "abs";
  const transmission = clamp(transmissionRaw, T_MIN, T_MAX, 1);
  const absorbance = clamp(absorbanceRaw, 0, OD_MAX, 2);
  const od = mode === "abs" ? absorbance : absorbanceFromTransmittance(transmission / 100);
  const trans = mode === "trans" ? transmission : transmittance(absorbance) * 100;
  const filterFactor = 100 / trans;
  const stops = od * Math.log2(10);

  const grid = Array.from({ length: 300 }, (_, i) => (i / 299) * OD_MAX);
  const series = [
    { name: "Transmission (%)", color: "#60a5fa", points: grid.map((x) => ({ x, y: transmittance(x) * 100 })) },
    { name: "Absorbed or scattered (%)", color: "#f87171", dashed: true, points: grid.map((x) => ({ x, y: x > 0 ? (1 - transmittance(x)) * 100 : null })) }, // log axis: skip 0
    { name: "Current", color: "#34d399", showPoints: true, points: [{ x: od, y: trans }] },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {odPresets.map((preset) => (
          <button key={preset} onClick={() => { setAbsorbance(preset); setMode("abs"); }} className={`rounded-full border px-3 py-1 text-sm transition ${mode === "abs" && absorbance === preset ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            OD {preset}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="Optical density (OD)" value={mode === "abs" ? absorbanceRaw : od} onChange={(v) => { setAbsorbance(v); setMode("abs"); }} min={0} max={OD_MAX} step={0.01} />
        <ValidatedNumberInput label="Transmission (%)" value={mode === "trans" ? transmissionRaw : trans} onChange={(v) => { setTransmission(v); setMode("trans"); }} min={T_MIN} max={T_MAX} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Optical density" value={od.toFixed(3)} tone="blue" subtext="OD = −log₁₀ T" />
        <ResultCard label="Transmission" value={`${fmtPct(trans)} %`} tone="green" subtext={`blocked ${fmtPct(100 - trans)} %`} />
        <ResultCard label="Attenuation" value={`${attenuationDb(od).toFixed(1)} dB`} tone="orange" subtext="10 · OD" />
        <ResultCard label="Filter factor 1/T" value={filterFactor < 1e5 ? filterFactor.toPrecision(4) : filterFactor.toExponential(3)} tone="purple" subtext={`${stops.toFixed(2)} photographic stops (log₂ 1/T)`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Reference Values</h3>
        <div className="grid grid-cols-2 gap-1 text-sm text-gray-300">
          {odPresets.map((p) => (
            <p key={p}>OD <span className="text-blue-400">{p}</span> → <span className="text-green-400">{(transmittance(p) * 100).toPrecision(4)}%</span> T</p>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">OD = −log₁₀(T)</span></p>
        <p><span className="text-green-400 font-mono">T = 10^(−OD)</span></p>
        <p><span className="text-orange-400 font-mono">Attenuation (dB) = 10 log₁₀(1/T) = 10 × OD</span></p>
        <p>
          A neutral-density filter labelled &quot;ND 2.0&quot; or &quot;OD 2&quot; transmits 1 %. Photographic ND numbers
          are filter factors instead (ND8 = 1/T = 8, three stops, OD 0.9). For a sample, OD counts everything that
          leaves the beam, scattering included; absorbance counts only absorption, and the two agree for a clear
          solution. The transmission entered here can&apos;t exceed 100 %.
        </p>
        <p className="text-gray-500">Reference: IUPAC Compendium of Chemical Terminology (Gold Book), &quot;absorbance&quot; and &quot;transmittance&quot;.</p>
      </div>

      <SimpleLineChart title="Transmission and loss vs optical density" xLabel="Optical Density (OD)" yLabel="Percentage (%)" yScale="log" series={series} />
    </>
  );
}
