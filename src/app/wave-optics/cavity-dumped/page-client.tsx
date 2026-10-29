"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { peakPower } from "../../../physics/laser-safety/peak-power";
import { roundTripTime } from "../../../physics/wave-optics/pulsed-laser";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));

export default function CavityDumpedLaserPage() {
  const [repRateRaw, setRepRate] = useURLState("repRate", 1); // MHz
  const [energyRaw, setEnergy] = useURLState("pulseEnergy", 10); // µJ
  const [lengthRaw, setLength] = useURLState("cavityLength", 1.5); // m, optical length

  const repRate = clamp(repRateRaw, 1e-6, 1e4, 1) * 1e6;
  const energy = clamp(energyRaw, 1e-6, 1e9, 10) * 1e-6;
  const L = clamp(lengthRaw, 1e-3, 1000, 1.5);

  const tRT = roundTripTime(L);
  const fsr = 1 / tRT;
  const possible = repRate < fsr;
  const peak = peakPower(energy, tRT, "rectangular");
  const avg = energy * repRate;
  const duty = tRT * repRate;

  // Ideal dump: the output is one round trip long and flat (instant switch, uniform circulating power).
  const tNs = tRT * 1e9;
  const series = [{
    name: "Dumped pulse",
    color: "#60a5fa",
    points: [[-0.5, 0], [0, 0], [0, peak], [1, peak], [1, 0], [1.5, 0]].map(([t, p]) => ({ x: round6(t * tNs), y: round6(p / 1e3) })),
  }];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Dump rate (MHz)" value={repRateRaw} onChange={setRepRate} min={1e-6} max={1e4} step="any" />
        <ValidatedNumberInput label="Pulse energy (µJ)" value={energyRaw} onChange={setEnergy} min={1e-6} max={1e9} step="any" />
        <ValidatedNumberInput label="Optical cavity length L (m)" value={lengthRaw} onChange={setLength} min={1e-3} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Round-trip time = pulse length" value={`${fmt(tNs)} ns`} subtext={`2L/c; one dump per round trip at most: ${fmt(fsr / 1e6)} MHz`} tone="cyan" />
        <ResultCard label="Peak power" value={`${fmt(peak / 1e3)} kW`} subtext="E/τ_RT, equal to the circulating power before the dump" tone="purple" />
        <ResultCard label="Average power" value={possible ? `${fmt(avg)} W` : "—"} subtext={possible ? "E × f" : "dump rate at or above c/2L"} tone="orange" />
        <ResultCard label="Duty cycle" value={possible ? `${fmt(duty * 100)} %` : "—"} subtext="τ_RT × f" tone="green" />
      </div>

      {!possible && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The dump rate is at or above the round-trip rate c/2L = {fmt(fsr / 1e6)} MHz. A dump empties the cavity, so it cannot repeat
          faster than once per round trip; in practice the circulating power also needs many round trips to build up again.
        </p>
      )}

      {possible && duty > 0.1 && (
        <p className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
          The dump rate is above 10 % of c/2L: fewer than 10 round trips between dumps, so the cavity can&apos;t rebuild the full circulating power; the real pulse energy is lower.
        </p>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>A linear cavity of optical length L stores E = P_circ × 2L/c in the one-way circulating power P_circ. A fast switch (Pockels
          cell or acousto-optic dumper) that couples all of it out gives a pulse one round trip long, τ_RT = 2L/c, with peak power
          P_circ = E/τ_RT, whatever the gain medium. A partial dump scales E down; a mode-locked cavity dumps one mode-locked pulse instead.</p>
      </div>

      <SimpleLineChart title="Ideal cavity-dumped pulse" xLabel="Time (ns)" yLabel="Output power (kW)" series={series} />
    </>
  );
}
