"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { N_A, TORR } from "../../../physics/constants";
import { structureZone } from "../../../physics/thin-film/thermal-evaporation";
import {
  SPUTTER_TARGETS,
  diskOnAxisFlux,
  growthRate,
  sputteredAtomDiameter,
  sputteredAtomRate,
  targetIonCurrent,
  thermalisationDistance,
  thermalisationEnergy,
  thompsonFractionBelow,
  thompsonPeakEnergy,
  type SputterTargetId,
} from "../../../physics/thin-film/sputtering";

const IDS = Object.keys(SPUTTER_TARGETS) as SputterTargetId[];
const isId = (s: string): s is SputterTargetId => Object.hasOwn(SPUTTER_TARGETS, s);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtExp = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toExponential(digits)}${unit}` : "—");
const fmtE = (x: number) => (x >= 1e6 ? "> 1 MeV" : Number.isFinite(x) ? `${x < 10 ? x.toPrecision(2) : x.toFixed(0)} eV` : "—");
const ZONE = ["", "zone 1: tapered columns, voided", "zone 2: dense columns", "zone 3: recrystallised grains"];

export default function SputteringDepositionPage() {
  const [targetParam, setTarget] = useURLState("target", "Al");
  const [power, setPower] = useURLState("power", 300, { min: 0 }); // W
  const [voltage, setVoltage] = useURLState("voltage", 500, { min: 1 }); // V
  const [gamma, setGamma] = useURLState("gamma", 0.07, { min: 0 });
  const [yieldParam, setYield] = useURLState("yield", 0, { min: 0 }); // atoms/ion, 0 = table value at 500 eV
  const [targetRadius, setTargetRadius] = useURLState("targetRadius", 2, { min: 0 }); // cm
  const [distance, setDistance] = useURLState("distance", 10, { min: 0.1 }); // cm
  const [pressure, setPressure] = useURLState("pressure", 3, { min: 0.01 }); // mTorr
  const [substrateTemp, setSubstrateTemp] = useURLState("substrateTemp", 200, { min: -273.15 }); // °C

  const id: SputterTargetId = isId(targetParam) ? targetParam : "Al";
  const t = SPUTTER_TARGETS[id];
  const useTable = yieldParam === 0;
  const Y = useTable ? t.Y500 : yieldParam;
  const gasT = 300; // K

  const errors = [
    !(power >= 0) && "the power can't be negative",
    !(voltage > 0) && "the discharge voltage must be positive",
    !(gamma >= 0) && "the secondary-electron yield can't be negative",
    !(yieldParam >= 0) && "the sputter yield can't be negative",
    !(targetRadius >= 0) && "the target radius can't be negative",
    !(distance > 0) && "the distance must be positive",
    !(pressure > 0) && "the pressure must be positive",
    !(substrateTemp >= -273.15) && "the substrate temperature is below absolute zero",
  ].filter((e): e is string => typeof e === "string");
  const valid = errors.length === 0;

  const r = useMemo(() => {
    if (!valid) return null;
    const a = targetRadius * 1e-2;
    const d = distance * 1e-2;
    const I = power / voltage;
    const Ii = targetIonCurrent(power, voltage, gamma);
    const Phi = sputteredAtomRate(Ii, Y);
    const F = diskOnAxisFlux(Phi, a, d);
    const rate = growthRate(F, t.M, t.rho); // m/s
    const p = pressure * 1e-3 * TORR;
    const ms = t.M / N_A;
    const sigma = sputteredAtomDiameter(t.M * 1e3);
    const peak = thompsonPeakEnergy(t.Us);
    const th = thermalisationDistance(peak, p, gasT, ms, sigma);
    const Es = thermalisationEnergy(d, p, gasT, ms, sigma);
    const thermalised = thompsonFractionBelow(Es, t.Us);
    const Ts = substrateTemp + 273.15;
    return { I, Ii, Phi, F, rate, th, Es, thermalised, d, Ts, zone: structureZone(Ts, t.Tm), peak };
  }, [valid, targetRadius, distance, power, voltage, gamma, Y, t, pressure, substrateTemp]);

  const sweepData = useMemo(() => {
    if (!r) return [];
    const ds: number[] = [];
    const rates: number[] = [];
    const a = targetRadius * 1e-2;
    const dLo = Math.min(2, distance / 2); // cm, range always brackets the input distance
    const dHi = Math.max(30, 2 * distance);
    for (let i = 0; i <= 120; i++) {
      const dcm = dLo + ((dHi - dLo) * i) / 120;
      ds.push(dcm);
      rates.push(growthRate(diskOnAxisFlux(r.Phi, a, dcm * 1e-2), t.M, t.rho) * 1e9);
    }
    const Dcm = r.th.distance * 100;
    const marker = Dcm > dLo && Dcm < dHi
      ? [{ x: [Dcm, Dcm], y: [0, Math.max(...rates)], type: "scatter" as const, mode: "lines" as const, name: "D at the peak energy", line: { color: "#facc15", dash: "dash" as const } }]
      : [];
    return [
      { x: ds, y: rates, type: "scatter" as const, mode: "lines" as const, name: "On-axis rate (collisionless)", line: { color: "#60a5fa" } },
      { x: [distance], y: [r.rate * 1e9], type: "scatter" as const, mode: "markers" as const, name: "Input distance", marker: { color: "#f87171", size: 10 } },
      ...marker,
    ];
  }, [r, targetRadius, t, distance]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Target (elemental)</span>
          <select value={id} onChange={(e) => setTarget(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {IDS.map((k) => <option key={k} value={k}>{SPUTTER_TARGETS[k].name}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Discharge power (W)" value={power} onChange={setPower} min={0} step="10" />
        <ValidatedNumberInput label="Discharge voltage (V)" value={voltage} onChange={setVoltage} min={1} step="10" />
        <ValidatedNumberInput label="Secondary-electron yield γ (≈ 0.07 clean metal)" value={gamma} onChange={setGamma} min={0} step="0.01" />
        <ValidatedNumberInput label="Sputter yield (atoms/ion; 0 = 500 eV table)" value={yieldParam} onChange={setYield} min={0} step="0.05" />
        <ValidatedNumberInput label="Erosion-zone radius of the target (cm)" value={targetRadius} onChange={setTargetRadius} min={0} step="0.5" />
        <ValidatedNumberInput label="Target–substrate distance (cm)" value={distance} onChange={setDistance} min={0.1} step="0.5" />
        <ValidatedNumberInput label="Argon pressure (mTorr)" value={pressure} onChange={setPressure} min={0.01} step="0.5" />
        <ValidatedNumberInput label="Substrate temperature (°C)" value={substrateTemp} onChange={setSubstrateTemp} min={-273.15} step="10" />
      </div>

      <p className="text-gray-500 mb-6 text-xs">
        {t.name}: Y(500 eV Ar⁺) = {fmt(t.Y500, 2)} atoms/ion, U<sub>s</sub> = {fmt(t.Us, 2)} eV, ρ = {fmt(t.rho / 1e3, 2)} g/cm³,
        T<sub>m</sub> = {fmt(t.Tm, 0)} K. The ions reach the target with ≈ the full discharge voltage.
      </p>

      {errors.length > 0 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">No result: {errors.join("; ")}.</p>
      )}
      {valid && useTable && Math.abs(voltage - 500) > 100 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The table yield is for 500 eV; at {fmt(voltage, 0, " V")} enter a measured yield for this voltage.
        </p>
      )}
      {r && Number.isFinite(r.thermalised) && (
        <p className="mb-6 text-sm text-gray-400">
          {r.thermalised < 0.01
            ? <>Ballistic: only atoms ejected below E* = {fmtE(r.Es)} are thermalised before the substrate at {fmt(distance, 1, " cm")}, under 1 % of the
                Thompson distribution. The atoms still collide about {fmt(r.d / (1.25 * r.th.lambda), 1)} times on average and lose some energy.</>
            : <>{r.thermalised > 0.5 ? "Mostly diffusive" : "Mostly ballistic"}: atoms ejected below E* = {fmtE(r.Es)}, {fmt(r.thermalised * 100, 0, " %")} of
                the Thompson distribution, are thermalised before the substrate at {fmt(distance, 1, " cm")} and reach it by diffusion through the argon.
                The rest arrive with part of their energy after about {fmt(r.d / (1.25 * r.th.lambda), 1)} collisions on average. So the deposition rate is
                below the collisionless value shown here, and the more so the larger the thermalised share.</>}
        </p>
      )}

      {r && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <ResultCard label="On-axis deposition rate" value={fmt(r.rate * 1e9, 3, " nm/s")} tone="yellow" subtext={`${fmt(r.rate * 1e10 * 60, 0, " Å/min")}; collisionless`} />
          <ResultCard label="Ion current to the target" value={fmt(r.Ii, 3, " A")} tone="cyan" subtext={`I/(1+γ), I = P/V = ${fmt(r.I, 3, " A")}`} />
          <ResultCard label="Sputtered atoms" value={fmtExp(r.Phi, 2, " s⁻¹")} tone="green" subtext={`(Iᵢ/e) Y, Y = ${fmt(Y, 2)}${useTable ? " (500 eV table)" : ""}`} />
          <ResultCard
            label="Thermalised before the substrate"
            value={fmt(r.thermalised * 100, 0, " %")}
            subtext={`ejected below E* = ${fmtE(r.Es)}; Thompson CDF (E/(E + U_s))²`}
          />
          <ResultCard
            label="Thermalisation distance D at the peak energy"
            value={fmt(r.th.distance * 100, 1, " cm")}
            subtext={`1.25 η′λ, E₀ = U_s/2 = ${fmt(r.peak, 2, " eV")}: η′ = ${fmt(r.th.collisions, 1)}, λ = ${fmt(r.th.lambda * 100, 2, " cm")}`}
          />
          <ResultCard
            label="Homologous temperature"
            value={fmt(r.Ts / t.Tm, 2)}
            subtext={Number.isFinite(r.zone) ? ZONE[r.zone] : "at or above the melting point"}
          />
        </div>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Model</p>
        <p>Iᵢ = P / (V(1 + γ)); Φ = (Iᵢ/e)·Y; F = Φ / (π(a² + d²)); r = F·M / (ρ N<sub>A</sub>)</p>
        <p>Thompson peak E₀ = U<sub>s</sub>/2; λ = k<sub>B</sub>T / (π((σ<sub>s</sub> + σ<sub>g</sub>)/2)² p √(1 + M<sub>s</sub>/M<sub>g</sub>)), σ<sub>g</sub> = 0.29 nm, σ<sub>s</sub> 0.30–0.45 nm</p>
        <p>η′ = ln(v<sub>g</sub>/v₀) / ln(ν′/ν), v<sub>g</sub>/v₀ = √(k<sub>B</sub>T/E₀), ν′/ν Jeans&apos; persistence for M<sub>g</sub>/M<sub>s</sub>; D = 1.25 η′λ (Westwood 1978)</p>
        <p>E* = k<sub>B</sub>T (ν′/ν)<sup>−2d/1.25λ</sup> (D(E*) = d); thermalised share (E*/(E* + U<sub>s</sub>))²</p>
        <p className="mt-2">
          A disk of radius a emitting uniformly with a cosine distribution, seen on axis from a parallel substrate; a real magnetron
          erodes a ring (racetrack), so take a as its mean radius. Every atom sticks and the film has bulk density. The rate ignores gas
          scattering. Westwood&apos;s D is the distance an atom ejected normal to the target travels before it slows to thermal speed (gas at
          300 K); beyond it the atoms diffuse, the rate falls below this value and the profile flattens. D scales as 1/p and grows as ln E₀.
          Oblique ejection shortens the normal distance, and the gas-averaged persistence makes D about 25 % shorter than for a fast atom
          hitting gas at rest. Zones are
          Movchan–Demchishin by T<sub>s</sub>/T<sub>m</sub>; Thornton&apos;s sputtered-film zones also shift with the argon pressure.
          Reactive sputtering (oxides, nitrides) changes the yield and the film and isn&apos;t covered.
        </p>
      </div>

      <ChartPanel data={sweepData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Target–substrate distance (cm)", gridcolor: "#374151" },
        yaxis: { title: "On-axis rate (nm/s)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true,
      }} />
    </>
  );
}
