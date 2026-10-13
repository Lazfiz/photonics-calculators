"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  MARCUSE_MIN_V, SPECIALTY_FIBERS, specialtyCutoff, specialtyMfd, specialtyV, type SpecialtyFiber, type SpecialtyFiberId,
} from "../../../physics/fiber-optics/specialty-fiber";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const SINGLE_MODE_V = 2.405;
const IDS = Object.keys(SPECIALTY_FIBERS) as SpecialtyFiberId[];
const isId = (s: string): s is SpecialtyFiberId => Object.hasOwn(SPECIALTY_FIBERS, s);
/** Second LP mode group (LP21/LP02) cuts off at the first zero of J₁. */
const MULTIMODE_V = 3.832;
/** dB figure with sensible digits from 0.001 to 10⁵ dB. */
const fmtDb = (x: number) => (!Number.isFinite(x) ? "—" : x >= 100 ? `${x.toFixed(0)} dB` : x >= 1 ? `${x.toFixed(1)} dB` : `${x.toPrecision(2)} dB`);

export default function SpecialtyFiberPage() {
  const [fiberParam, setFiber] = useURLState("fiber", "pm");
  const [length, setLength] = useURLState("length", 10); // m
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm

  const id: SpecialtyFiberId = isId(fiberParam) ? fiberParam : "pm";
  const spec: SpecialtyFiber = SPECIALTY_FIBERS[id];
  const lambdaBad = !(wavelength >= 300 && wavelength <= 7000);
  const lengthBad = !(length > 0);

  const calc = useMemo(() => {
    const lam = wavelength * 1e-9;
    const V = lambdaBad ? NaN : specialtyV(spec, lam);
    const transmits = lam >= spec.transmission[0] && lam <= spec.transmission[1];
    const loss = spec.attenuation ?? spec.absorption;
    return {
      V,
      singleMode: lam > spec.cutoff,
      transmits,
      cutoffModel: specialtyCutoff(spec),
      mfdModel: lambdaBad ? NaN : specialtyMfd(spec, lam),
      mfdAtSheetLambda: specialtyMfd(spec, spec.mfd.lambda),
      inBand: spec.band ? lam >= spec.band[0] && lam <= spec.band[1] : null,
      lossDb: loss && !lengthBad ? loss.dbPerM * length : NaN,
    };
  }, [spec, wavelength, length, lambdaBad, lengthBad]);

  const vData = useMemo(() => {
    const lo = spec.band ? Math.min(spec.band[0], spec.cutoff) * 0.8 : spec.cutoff * 0.6;
    const hi = spec.band ? spec.band[1] * 1.1 : spec.cutoff * 1.6;
    const wl: number[] = [];
    const v: number[] = [];
    for (let i = 0; i <= 120; i++) {
      const lam = lo + ((hi - lo) * i) / 120;
      wl.push(lam * 1e9);
      v.push(specialtyV(spec, lam));
    }
    const x = [wl[0], wl[wl.length - 1]];
    return [
      { x: wl, y: v, type: "scatter" as const, mode: "lines" as const, name: "V", line: { color: "#f59e0b", width: 2 } },
      { x, y: [SINGLE_MODE_V, SINGLE_MODE_V], type: "scatter" as const, mode: "lines" as const, name: "2.405", line: { color: "#f87171", width: 1, dash: "dash" as const } },
    ];
  }, [spec]);

  const naData = useMemo(() => [{
    x: IDS.map((k) => SPECIALTY_FIBERS[k].product),
    y: IDS.map((k) => SPECIALTY_FIBERS[k].NA),
    type: "bar" as const, name: "NA",
  }], []);

  const loss = spec.attenuation ?? spec.absorption;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Fiber</span>
          <select
            value={id}
            onChange={(e) => {
              const next: SpecialtyFiber = SPECIALTY_FIBERS[e.target.value as SpecialtyFiberId];
              setFiber(e.target.value);
              // Jump to the wavelength the sheet quotes its MFD at (or its loss figure, when no MFD is given).
              const ref = Number.isFinite(next.mfd.lambda) ? next.mfd.lambda : (next.attenuation ?? next.absorption)?.lambda ?? 1550e-9;
              setWavelength(Math.round(ref * 1e9));
            }}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
          >
            {IDS.map((k) => <option key={k} value={k}>{SPECIALTY_FIBERS[k].label}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Length (m)" value={length} onChange={setLength} min={0.001} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={7000} step="1" />
      </div>

      <p className="text-gray-300 mb-2 text-sm">{spec.description}</p>
      <p className="text-gray-500 mb-6 text-xs">
        Data sheet: <a href={spec.source} className="underline hover:text-gray-300" target="_blank" rel="noopener noreferrer">{spec.product}</a>
        {" "}({spec.glass}). Typical catalogue values for one product, not limits for the fibre class.
      </p>

      {(lambdaBad || lengthBad) && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: {lambdaBad ? "the wavelength must lie between 300 and 7000 nm." : "the length must be positive."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard
          label="Core / cladding, NA"
          value={`${fmt(spec.coreDiameter * 1e6, 1)} / ${fmt(spec.claddingDiameter * 1e6, 0)} µm`}
          subtext={`NA ${spec.NA}`}
        />
        <ResultCard
          label="V-number at λ"
          value={fmt(calc.V, 2)}
          tone="yellow"
          subtext={!Number.isFinite(calc.V) ? undefined : calc.singleMode ? "single-mode (λ above the sheet cutoff)" : calc.V < MULTIMODE_V ? "two LP mode groups (LP01, LP11)" : "multimode"}
        />
        <ResultCard
          label="Second-mode cutoff"
          value={fmt(spec.cutoff * 1e9, 0, " nm")}
          tone="cyan"
          subtext={`data sheet; step-index 2πa·NA/2.405 gives ${fmt(calc.cutoffModel * 1e9, 0, " nm")}`}
        />
        <ResultCard
          label="Mode-field diameter"
          value={Number.isFinite(spec.mfd.value) ? `${fmt(spec.mfd.value * 1e6, 1, " µm")} at ${fmt(spec.mfd.lambda * 1e9, 0, " nm")}` : "not stated"}
          tone="green"
          subtext={`Marcuse estimate ${Number.isFinite(calc.mfdModel) ? fmt(calc.mfdModel * 1e6, 1, " µm") : `— (V < ${MARCUSE_MIN_V})`} at λ${Number.isFinite(spec.mfd.value) ? `, ${fmt(calc.mfdAtSheetLambda * 1e6, 1, " µm")} at the sheet λ` : ""}`}
        />
        <ResultCard
          label={spec.attenuation ? "Background attenuation" : "Core absorption"}
          value={loss ? `${loss.dbPerM >= 0.01 ? loss.dbPerM : loss.dbPerM * 1e3} ${loss.dbPerM >= 0.01 ? "dB/m" : "dB/km"}` : "—"}
          tone="red"
          subtext={loss ? `at ${fmt(loss.lambda * 1e9, 0, " nm")}, ${loss.note}` : undefined}
        />
        <ResultCard
          label={spec.attenuation ? "Attenuation over length" : "Small-signal absorption over length"}
          value={fmtDb(calc.lossDb)}
          tone="orange"
          subtext={loss ? `${length} m × figure at ${fmt(loss.lambda * 1e9, 0, " nm")} only${spec.absorption ? "; real gain fibres are cm to m long" : ""}` : undefined}
        />
      </div>
      {!lambdaBad && !calc.transmits && (
        <p className="-mt-4 mb-4 text-sm text-yellow-300" role="status">
          {fmt(wavelength, 0, " nm")} is outside the transmission window of {spec.glass} ({fmt(spec.transmission[0] * 1e9, 0)}–
          {fmt(spec.transmission[1] * 1e9, 0)} nm): the fibre is opaque there.
        </p>
      )}
      {calc.inBand === false && (
        <p className="-mt-4 mb-8 text-sm text-yellow-300" role="status">
          {fmt(wavelength, 0, " nm")} is outside the data-sheet operating range ({fmt((spec.band?.[0] ?? NaN) * 1e9, 0)}–
          {fmt((spec.band?.[1] ?? NaN) * 1e9, 0)} nm).
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">V-Number vs Wavelength</h3>
        <ChartPanel data={vData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "V", gridcolor: "#374151", rangemode: "tozero" },
          margin: { t: 20, r: 30, b: 50, l: 60 }, height: 300,
        }} />
        <p className="mt-2 text-sm text-gray-400">
          V = 2πa·NA/λ (amber) from the data-sheet core and NA; the fibre is single-mode where it lies below 2.405 (red, dashed),
          i.e. above the cutoff wavelength.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Numerical Aperture Comparison</h3>
        <ChartPanel data={naData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Fiber", gridcolor: "#374151", tickangle: -30 },
          yaxis: { title: "NA", gridcolor: "#374151", rangemode: "tozero" },
          margin: { t: 20, r: 20, b: 90, l: 50 }, height: 320,
        }} />
        <p className="mt-2 text-sm text-gray-400">Data-sheet core NA of each fibre (selected: {spec.product}, NA {spec.NA}).</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">V = 2πa·NA/λ;  single-mode for V &lt; 2.405, λ_c = 2πa·NA/2.405</p>
          <p className="font-mono">w = a(0.65 + 1.619V^−1.5 + 2.879V^−6);  loss (dB) = α (dB/m) × L</p>
          <p className="text-gray-400">
            The step-index formulas ignore stress rods and graded dopant profiles. Losses are single data-sheet figures at one
            wavelength, not spectra: doped-fibre absorption changes by orders of magnitude across a band and bleaches under pumping.
          </p>
        </div>
      </div>
    </>
  );
}
