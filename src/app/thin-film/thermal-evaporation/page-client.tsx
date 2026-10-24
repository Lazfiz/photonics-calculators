"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { TORR } from "../../../physics/constants";
import {
  EVAPORANTS, FIT_T_MAX, airMeanFreePath, evaporationMassFlux, inFitRange, meanSpeed, structureZone,
  surfaceSourceProfile, surfaceSourceRate, vapourPressure, type EvaporantId,
} from "../../../physics/thin-film/thermal-evaporation";

const IDS = Object.keys(EVAPORANTS) as EvaporantId[];
const isId = (s: string): s is EvaporantId => Object.hasOwn(EVAPORANTS, s);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtExp = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toExponential(digits)}${unit}` : "—");
/** Plain digits from 0.01 to 10⁴, exponent outside. */
const fmtSci = (x: number, unit: string) => (Number.isFinite(x) && x >= 0.01 && x < 1e4 ? `${x.toPrecision(3)}${unit}` : fmtExp(x, 2, unit));
/** Rate with sensible digits from 10⁻⁶ to 10³ nm/s. */
const fmtRate = (x: number) => (!Number.isFinite(x) ? "—" : x >= 0.1 ? `${x.toFixed(2)} nm/s` : `${x.toPrecision(2)} nm/s`);
const ZONE_TEXT = ["", "zone 1: tapered columns with voids", "zone 2: dense columnar grains", "zone 3: recrystallised, equiaxed grains"];
/** Highest source temperature the fits allow (2500 K) in °C. */
const T_MAX_C = FIT_T_MAX - 273.15;
/** End of the rate sweep (Pa), ten times the vapour-cloud onset. */
const SWEEP_P_MAX = 10;

export default function ThermalEvaporationPage() {
  const [materialParam, setMaterial] = useURLState("material", "Al");
  const [sourceTemp, setSourceTemp] = useURLState("sourceTemp", 1200); // °C
  const [sourceSubstrateDist, setSourceSubstrateDist] = useURLState("sourceSubstrateDist", 30, { min: 0.1 }); // cm
  const [sourceDiameter, setSourceDiameter] = useURLState("sourceDiameter", 2, { min: 0.01 }); // cm
  const [substrateRadius, setSubstrateRadius] = useURLState("substrateRadius", 5, { min: 0 }); // cm
  const [alpha, setAlpha] = useURLState("alpha", 1, { min: 0.001, max: 1 });
  const [chamberPressure, setChamberPressure] = useURLState("chamberPressure", 1e-6, { min: 0 }); // Torr
  const [substrateTemp, setSubstrateTemp] = useURLState("substrateTemp", 100); // °C

  const id: EvaporantId = isId(materialParam) ? materialParam : "Al";
  const ev = EVAPORANTS[id];
  const T = sourceTemp + 273.15;
  const errors = [
    !(T > 0 && T <= FIT_T_MAX) && `the source temperature must lie between −273.15 and ${T_MAX_C} °C`,
    !(sourceSubstrateDist > 0) && "the source–substrate distance must be positive",
    !(sourceDiameter > 0) && "the source diameter must be positive",
    !(substrateRadius >= 0) && "the substrate radius can't be negative",
    !(alpha > 0 && alpha <= 1) && "the evaporation coefficient must lie in (0, 1]",
    !(chamberPressure > 0) && "the chamber pressure must be positive",
    !(substrateTemp >= -273.15) && "the substrate temperature must be above absolute zero",
  ].filter((e): e is string => typeof e === "string");
  const valid = errors.length === 0;

  const r = useMemo(() => {
    if (!valid) return null;
    const h = sourceSubstrateDist * 1e-2;
    const rs = (sourceDiameter / 2) * 1e-2;
    const p = vapourPressure(ev, T);
    const flux = evaporationMassFlux(p, ev.M, T, alpha);
    const mfp = airMeanFreePath(chamberPressure * TORR);
    return {
      p,
      fitOk: inFitRange(T, p),
      flux,
      rate: surfaceSourceRate(flux, Math.PI * rs * rs, ev.rho, h) * 1e9, // nm/s
      edge: surfaceSourceProfile(substrateRadius * 1e-2, h),
      mfp,
      Kn: mfp / h,
      speed: meanSpeed(ev.M, T),
      homologous: (substrateTemp + 273.15) / ev.Tm,
      zone: structureZone(substrateTemp + 273.15, ev.Tm),
      bigSource: rs / h > 0.1,
    };
  }, [valid, ev, T, sourceSubstrateDist, sourceDiameter, substrateRadius, alpha, chamberPressure, substrateTemp]);

  const sweepData = useMemo(() => {
    const h = sourceSubstrateDist * 1e-2;
    const rs = (sourceDiameter / 2) * 1e-2;
    if (!(h > 0 && rs > 0 && alpha > 0 && alpha <= 1)) return [];
    // From 10⁻⁶ Pa to 10 Pa (or 2500 K): above ≈ 1 Pa a vapour cloud forms and the free-evaporation rate is only a bound.
    const temps: number[] = [];
    const rates: (number | null)[] = [];
    for (let i = 0; i <= 160; i++) {
      const Tk = 0.5 * ev.Tm + ((FIT_T_MAX - 0.5 * ev.Tm) * i) / 160;
      const p = vapourPressure(ev, Tk);
      if (p < 1e-6) continue;
      if (p > SWEEP_P_MAX) break;
      temps.push(Tk - 273.15);
      rates.push(surfaceSourceRate(evaporationMassFlux(p, ev.M, Tk, alpha), Math.PI * rs * rs, ev.rho, h) * 1e9);
    }
    return [
      // The vapour pressure has the same shape on a log axis (rate ∝ p/√T), so it isn't drawn too.
      { x: temps, y: rates, type: "scatter" as const, mode: "lines" as const, name: "Growth rate", line: { color: "#60a5fa" } },
    ];
  }, [ev, sourceSubstrateDist, sourceDiameter, alpha]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Evaporant</span>
          <select value={id} onChange={(e) => setMaterial(e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {IDS.map((k) => <option key={k} value={k}>{EVAPORANTS[k].name} ({k})</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Source temperature (°C)" value={sourceTemp} onChange={setSourceTemp} max={T_MAX_C} step="10" />
        <ValidatedNumberInput label="Source–substrate distance h (cm)" value={sourceSubstrateDist} onChange={setSourceSubstrateDist} min={0.1} step="1" />
        <ValidatedNumberInput label="Source (melt surface) diameter (cm)" value={sourceDiameter} onChange={setSourceDiameter} min={0.01} step="0.5" />
        <ValidatedNumberInput label="Substrate radius (cm)" value={substrateRadius} onChange={setSubstrateRadius} min={0} step="1" />
        <ValidatedNumberInput label="Evaporation coefficient α" value={alpha} onChange={setAlpha} min={0.001} max={1} step="0.1" />
        <ValidatedNumberInput label="Chamber pressure (Torr)" value={chamberPressure} onChange={setChamberPressure} min={0} step="any" />
        <ValidatedNumberInput label="Substrate temperature (°C)" value={substrateTemp} onChange={setSubstrateTemp} step="10" />
      </div>

      <p className="text-gray-500 mb-6 text-xs">
        {ev.name}: M = {fmt(ev.M * 1e3, 3)} g/mol, ρ = {fmt(ev.rho / 1e3, 2)} g/cm³, T<sub>m</sub> = {ev.Tm} K. Metals only:
        oxides and fluorides evaporate by dissociation or sublimation, which these fits don&apos;t cover.
      </p>

      {errors.length > 0 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">No result: {errors.join("; ")}.</p>
      )}

      {r && (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <ResultCard
              label="Vapour pressure"
              value={fmtSci(r.p, " Pa")}
              tone="yellow"
              subtext={`${fmtSci(r.p / TORR, " Torr")}${r.fitOk ? "" : "; outside the fit range (10⁻¹⁵–10⁻³ atm)"}`}
            />
            <ResultCard
              label="Growth rate at the centre"
              value={fmtRate(r.rate)}
              tone="green"
              subtext={`${fmtRate(r.rate * 10).replace("nm/s", "Å/s")}; film at bulk density, sticking 1`}
            />
            <ResultCard
              label="Thickness at the substrate edge"
              value={fmt(r.edge * 100, 1, " %")}
              tone="cyan"
              subtext={`of the centre, at ${fmt(substrateRadius, 1)} cm (flat substrate)`}
            />
            <ResultCard label="Evaporation flux (α p √(M/2πRT))" value={fmtExp(r.flux, 2, " kg m⁻² s⁻¹")} />
            <ResultCard
              label="Mean free path (residual air)"
              value={r.mfp >= 1 ? fmt(r.mfp, 1, " m") : fmt(r.mfp * 100, 2, " cm")}
              subtext={`Kn = λ/h = ${r.Kn >= 100 ? r.Kn.toExponential(1) : r.Kn.toFixed(2)}${r.Kn < 1 ? ": gas scattering cuts the rate" : ": straight-line flight"}`}
            />
            <ResultCard label="Mean speed of the vapour" value={fmt(r.speed, 0, " m/s")} subtext="√(8RT/πM) at the source temperature" />
            <ResultCard
              label="Homologous temperature T_s/T_m"
              value={fmt(r.homologous, 2)}
              tone="red"
              subtext={Number.isFinite(r.zone) ? `Movchan–Demchishin ${ZONE_TEXT[r.zone]}` : r.homologous >= 1 ? "Substrate at or above the melting point: no solid film" : undefined}
            />
          </div>
          {(r.bigSource || r.p > 1) && (
            <p className="mb-6 text-sm text-yellow-300" role="status">
              {r.bigSource && "The source is not small next to h (r_s/h > 0.1); the point-like cosine formula loses accuracy. "}
              {r.p > 1 && "Above ≈ 1 Pa the vapour's own mean free path falls to centimetres, comparable to the source, and a vapour cloud forms over the melt, so the free-evaporation rate is an upper bound."}
            </p>
          )}
        </>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Model</p>
        <p>log₁₀(p/atm) = A + B/T + C log₁₀T (Alcock, Itkin &amp; Horrigan 1984; solid below T<sub>m</sub>, liquid above)</p>
        <p>Γ = α p √(M/(2πRT)) (Hertz–Knudsen–Langmuir mass flux)</p>
        <p>R = Γ π r<sub>s</sub>² / (π ρ h²) at the centre; d/d₀ = 1/(1 + (l/h)²)² across a flat substrate (cosine source)</p>
        <p>λ = 5×10⁻³ cm·Torr / P (air at room temperature); zones at T<sub>s</sub>/T<sub>m</sub> = 0.3 and 0.45 (metals)</p>
      </div>

      <ChartPanel data={sweepData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Source temperature (°C)", gridcolor: "#374151" },
        yaxis: { title: "Growth rate at the centre (nm/s)", gridcolor: "#374151", type: "log" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true,
      }} />
    </>
  );
}
