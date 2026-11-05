"use client";

import Link from "next/link";
import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { TORR, k_B_eV, q } from "../../../physics/constants";
import { TE_FIT_MAX, TE_FIT_MIN, TE_MAX, TE_MIN, argonDischarge, lowPressureRegime } from "../../../physics/thin-film/plasma-global-model";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtExp = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toExponential(digits)}${unit}` : "—");

export default function PlasmaDepositionPage() {
  const [power, setPower] = useURLState("power", 500, { min: 0 }); // W absorbed
  const [pressure, setPressure] = useURLState("pressure", 5, { min: 0.1 }); // mTorr
  const [radius, setRadius] = useURLState("radius", 15, { min: 0.5 }); // cm
  const [length, setLength] = useURLState("length", 30, { min: 0.5 }); // cm
  const [gasTemp, setGasTemp] = useURLState("gasTemp", 300, { min: 1 }); // K

  const errors = [
    !(power >= 0) && "the absorbed power can't be negative",
    !(pressure > 0) && "the pressure must be positive",
    !(radius > 0) && "the radius must be positive",
    !(length > 0) && "the length must be positive",
    !(gasTemp > 0) && "the gas temperature must be positive",
  ].filter((e): e is string => typeof e === "string");
  const valid = errors.length === 0;

  const R = radius * 1e-2;
  const l = length * 1e-2;
  const d = useMemo(
    () => (valid ? argonDischarge(power, R, l, pressure * 1e-3 * TORR, gasTemp) : null),
    [valid, power, R, l, pressure, gasTemp],
  );
  const noRoot = d !== null && !Number.isFinite(d.Te);

  const sweepData = useMemo(() => {
    if (!valid) return [];
    const p: number[] = [];
    const Te: number[] = [];
    const n: number[] = [];
    for (let i = 0; i <= 120; i++) {
      const mT = 0.1 * Math.pow(1000, i / 120);
      const s = argonDischarge(power, R, l, mT * 1e-3 * TORR, gasTemp);
      // Only points inside the rate-constant fits (TE_FIT_MIN < Tₑ ≤ TE_FIT_MAX).
      if (!(s.Te > TE_FIT_MIN && s.Te <= TE_FIT_MAX) || !Number.isFinite(s.n0)) continue;
      p.push(mT);
      Te.push(s.Te);
      n.push(s.n0 / 1e16);
    }
    return [
      { x: p, y: Te, type: "scatter" as const, mode: "lines" as const, name: "Tₑ (eV)", line: { color: "#60a5fa" } },
      { x: p, y: n, type: "scatter" as const, mode: "lines" as const, name: "n₀ (10¹⁶ m⁻³)", line: { color: "#f87171" }, yaxis: "y2" },
    ];
  }, [valid, power, R, l, gasTemp]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Power absorbed by the plasma (W)" value={power} onChange={setPower} min={0} step="50" />
        <ValidatedNumberInput label="Argon pressure (mTorr)" value={pressure} onChange={setPressure} min={0.1} step="1" />
        <ValidatedNumberInput label="Chamber radius R (cm)" value={radius} onChange={setRadius} min={0.5} step="1" />
        <ValidatedNumberInput label="Chamber length l (electrode gap) (cm)" value={length} onChange={setLength} min={0.5} step="1" />
        <ValidatedNumberInput label="Gas temperature (K)" value={gasTemp} onChange={setGasTemp} min={1} step="10" />
      </div>

      {errors.length > 0 && (
        <p className="mb-6 text-sm text-yellow-300" role="status">No result: {errors.join("; ")}.</p>
      )}
      {d && noRoot && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: at this pressure and chamber size particle balance needs Tₑ outside {TE_MIN}–{TE_MAX} eV, outside this model.
        </p>
      )}
      {d && !noRoot && (d.Te <= TE_FIT_MIN || d.Te > TE_FIT_MAX) && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          Tₑ = {fmt(d.Te, 2, " eV")} lies outside the {TE_FIT_MIN}–{TE_FIT_MAX} eV range of the argon rate-constant fits
          (Lieberman &amp; Lichtenberg Table 3.3): extrapolated.
        </p>
      )}
      {d && !noRoot && !lowPressureRegime(d, R, l, gasTemp) && (
        <p className="mb-6 text-sm text-gray-400">
          Collisional regime: λᵢ = {fmt(d.lambdaI * 1e3, 2, " mm")} is below (Tᵢ/Tₑ)·max(R, l) ={" "}
          {fmt(((gasTemp * k_B_eV) / d.Te) * Math.max(R, l) * 1e3, 2, " mm")}, so the ions diffuse to the walls and the
          diffusion term sets h<sub>l</sub> and h<sub>R</sub>. The ion energy assumes a collisionless sheath; once λᵢ is
          shorter than the sheath (a few Debye lengths) the ions arrive with less.
        </p>
      )}

      {d && !noRoot && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <ResultCard label="Electron temperature Tₑ" value={fmt(d.Te, 2, " eV")} tone="yellow" subtext="particle balance K_iz/u_B = 1/(n_g d_eff)" />
          <ResultCard label="Centre plasma density n₀" value={fmtExp(d.n0, 2, " m⁻³")} tone="green" subtext="P_abs / (e u_B A_eff E_T)" />
          <ResultCard
            label="Ion current density at the electrode"
            value={fmt(q * d.ionFluxAxial * 1e2, 1, " µA/cm²")}
            tone="cyan"
            subtext={`flux h_l n₀ u_B = ${fmtExp(d.ionFluxAxial, 2, " m⁻² s⁻¹")}`}
          />
          <ResultCard label="Ion energy at a floating substrate" value={fmt(d.Ei, 1, " eV")} subtext="V_s + Tₑ/2, V_s = Tₑ ln √(M/2πm)" />
          <ResultCard label="Energy lost per ion lost E_T" value={fmt(d.ET, 1, " eV")} subtext={`E_c = ${fmt(d.Ec, 1, " eV")} + 2Tₑ + E_i`} />
          <ResultCard label="Debye length" value={fmt(d.debye * 1e6, 1, " µm")} subtext="√(ε₀ Tₑ / (e n₀))" />
          <ResultCard label="Bohm speed u_B" value={fmt(d.uB / 1e3, 2, " km/s")} subtext="√(e Tₑ / M)" />
          <ResultCard label="Ion mean free path λᵢ" value={fmt(d.lambdaI * 1e3, 2, " mm")} subtext={`n_g = ${fmtExp(d.ng, 2, " m⁻³")}`} />
          <ResultCard label="h_l, h_R, d_eff" value={`${fmt(d.hl, 3)}, ${fmt(d.hR, 3)}`} subtext={`d_eff = ${fmt(d.dEff * 100, 1, " cm")}, D_a = ${Number.isFinite(d.Da) ? d.Da.toPrecision(3) : "—"} m²/s`} />
        </div>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Model</p>
        <p>λᵢ = 1/(n<sub>g</sub>σᵢ), σᵢ = 10⁻¹⁸ m²; D<sub>a</sub> = Dᵢ(1 + Tₑ/Tᵢ), Dᵢ = eTᵢλᵢ/(M v̄ᵢ), Tᵢ = T<sub>gas</sub></p>
        <p>h<sub>l</sub> = 0.86 [3 + l/2λᵢ + (0.86 l u<sub>B</sub>/πD<sub>a</sub>)²]<sup>−½</sup>, h<sub>R</sub> = 0.80 [4 + R/λᵢ + (0.80 R u<sub>B</sub>/χ₀₁J₁(χ₀₁)D<sub>a</sub>)²]<sup>−½</sup></p>
        <p>d<sub>eff</sub> = Rl / (2(Rh<sub>l</sub> + lh<sub>R</sub>)); A<sub>eff</sub> = 2πR(Rh<sub>l</sub> + lh<sub>R</sub>)</p>
        <p>E<sub>c</sub> = E<sub>iz</sub> + E<sub>ex</sub>K<sub>ex</sub>/K<sub>iz</sub> + (3m/M)TₑK<sub>el</sub>/K<sub>iz</sub> with the argon rate constants of Lieberman &amp; Lichtenberg</p>
        <p className="mt-2">
          A volume-averaged argon discharge in a cylinder: particle balance fixes Tₑ (d<sub>eff</sub> depends on Tₑ through
          D<sub>a</sub> and u<sub>B</sub>, so they are solved together), and the power sets the density. The h-factors join the
          low-pressure and the diffusion (high-pressure) solutions. The substrate sits on an end wall (an electrode). The wall is floating; an rf-biased or self-biased electrode
          (capacitive discharge) draws the same ion flux but at the bias voltage, set by the matching and the electrode areas. Deposition
          gases (SiH₄, O₂, N₂) attach electrons and change Tₑ and the loss channels, so the page models the argon carrier only.
          The ion current density is what the <Link className="text-blue-400 underline" href="/thin-film/ion-assisted-deposition">ion-assisted deposition</Link> page takes.
        </p>
      </div>

      <ChartPanel data={sweepData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Pressure (mTorr)", gridcolor: "#374151", type: "log" },
        yaxis: { title: "Tₑ (eV)", gridcolor: "#374151" },
        yaxis2: { title: "n₀ (10¹⁶ m⁻³)", gridcolor: "#374151", overlaying: "y", side: "right" },
        margin: { t: 20, b: 40, l: 50, r: 60 }, autosize: true,
      }} />
      <p className="text-gray-500 text-xs mt-2 text-center">
        0.1–100 mTorr at the current power and chamber; pressures where Tₑ leaves the {TE_FIT_MIN}–{TE_FIT_MAX} eV rate-constant fits are left out.
      </p>
    </>
  );
}
