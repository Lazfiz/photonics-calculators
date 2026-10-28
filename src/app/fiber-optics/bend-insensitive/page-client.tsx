"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  LP11_CUTOFF_V, MIN_V, bendLossPerTurnDb, lp01Mode, lp11CutoffWavelength, modeFieldRadius, vNumber, type StepIndexFiber,
} from "../../../physics/fiber-optics/macro-bending-loss";
import { G657_MIN_MFD_UM, G657_CATEGORIES, G657_LIMITS, g657Category, type G657Category } from "../../../physics/fiber-optics/g657";

// SMF-28-like G.652 step equivalent (same as the macrobending-loss and mode-field-diameter pages).
const SMF = { a: 4.1e-6, NA: 0.1246 };
const MIN_PLOTTED_DB = 1e-6;

const fmtDb = (x: number) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "< 1e-300" : x >= 0.01 && x < 1e4 ? x.toPrecision(3) : x.toExponential(2);
const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

function finitePairs(xs: number[], ys: number[]) {
  const keep = ys.map((y) => Number.isFinite(y) && y >= MIN_PLOTTED_DB);
  return { x: xs.filter((_, i) => keep[i]), y: ys.filter((_, i) => keep[i]) };
}

/** Category line; the macrobend limits alone don't qualify a fibre whose MFD at 1310 nm is below the G.657 minimum. */
const classText = (c: G657Category | null, mfd1310_um: number) =>
  (c ? `Meets the G.657.${c} macrobend limits` : "Meets no G.657 macrobend limits") +
  (c && mfd1310_um < G657_MIN_MFD_UM ? `, but its MFD is below ${G657_MIN_MFD_UM} µm` : "");

const perTurn = (f: StepIndexFiber, elastoOptic: boolean) => (R: number, lambda: number) =>
  bendLossPerTurnDb(f, lambda, R, undefined, elastoOptic);

export default function BendInsensitivePage() {
  const [radius, setRadius] = useURLState("radius", 7.5, { min: 1, max: 100 }); // mm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 800, max: 1700 }); // nm
  const [designRadius, setDesignRadius] = useURLState("designRadius", 3.4, { min: 1, max: 10 }); // µm
  const [designNA, setDesignNA] = useURLState("designNA", 0.15, { min: 0.05, max: 0.35 });
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.4494, { min: 1, max: 4 });
  const [elastoOptic, setElastoOptic] = useURLState("elastoOptic", 1, { min: 0, max: 1 });
  const eo = elastoOptic === 1;

  const smf = useMemo(() => ({ ...SMF, n1: coreIndex }), [coreIndex]);
  const design = useMemo(() => ({ a: designRadius * 1e-6, NA: designNA, n1: coreIndex }), [designRadius, designNA, coreIndex]);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const R = radius * 1e-3;
    const props = (f: StepIndexFiber) => ({
      V: vNumber(f, lambda),
      loss: bendLossPerTurnDb(f, lambda, R, undefined, eo),
      cutoff_nm: lp11CutoffWavelength(f) * 1e9,
      mfd1550_um: 2e6 * modeFieldRadius(f, 1550e-9),
      mfd1310_um: 2e6 * modeFieldRadius(f, 1310e-9),
      category: g657Category(perTurn(f, eo)),
    });
    return { smf: props(smf), design: props(design) };
  }, [smf, design, wavelength, radius, eo]);

  const specRows = useMemo(
    () =>
      G657_CATEGORIES.flatMap((cat) =>
        G657_LIMITS[cat].map((l) => {
          const d1550 = bendLossPerTurnDb(design, 1550e-9, l.R, undefined, eo) * l.turns;
          const d1625 = bendLossPerTurnDb(design, 1625e-9, l.R, undefined, eo) * l.turns;
          return { cat, ...l, d1550, d1625, pass: d1550 <= l.max1550 && d1625 <= l.max1625 };
        }),
      ),
    [design, eo],
  );

  const chartData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const lo_mm = Math.min(3, radius);
    const hi_mm = Math.max(30, 1.2 * radius);
    const radii_mm = Array.from({ length: 136 }, (_, i) => lo_mm + (i * (hi_mm - lo_mm)) / 135);
    const curve = (f: StepIndexFiber) => {
      const mode = lp01Mode(vNumber(f, lambda));
      return finitePairs(radii_mm, radii_mm.map((r) => bendLossPerTurnDb(f, lambda, r * 1e-3, mode, eo)));
    };
    return [
      { ...curve(smf), type: "scatter" as const, mode: "lines" as const, name: "Standard SMF (G.652)", line: { color: "#f87171", width: 2 } },
      { ...curve(design), type: "scatter" as const, mode: "lines" as const, name: "Reduced-MFD design", line: { color: "#34d399", width: 2 } },
      { ...finitePairs([radius, radius], [calc.smf.loss, calc.design.loss]), type: "scatter" as const, mode: "markers" as const, name: `${radius} mm`, marker: { color: "#f9fafb", size: 10 } },
    ];
  }, [smf, design, wavelength, radius, eo, calc.smf.loss, calc.design.loss]);

  const valid = Number.isFinite(calc.design.loss) && Number.isFinite(calc.smf.loss);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Bend Radius (mm)" value={radius} onChange={setRadius} min={1} max={100} step="0.5" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={800} max={1700} step="1" />
        <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} min={1} max={4} step="0.0001" />
        <ValidatedNumberInput label="Design Core Radius (µm)" value={designRadius} onChange={setDesignRadius} min={1} max={10} step="0.1" />
        <ValidatedNumberInput label="Design NA" value={designNA} onChange={setDesignNA} min={0.05} max={0.35} step="0.005" />
        <label className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <input type="checkbox" className="mt-1" checked={elastoOptic === 1} onChange={(e) => setElastoOptic(e.target.checked ? 1 : 0)} />
          <span className="text-sm text-gray-300">Elasto-optic correction (R_eff = R/(1 − p_e) ≈ 1.25 R)</span>
        </label>
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the model needs V ≥ {MIN_V} for both fibres and NA &lt; n₁.
        </p>
      )}

      {valid && calc.smf.V > LP11_CUTOFF_V && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          Standard SMF V = {calc.smf.V.toFixed(2)} &gt; 2.405 at {wavelength} nm: LP11 is guided too (theory; a real G.652 fibre cuts it off
          below its cable cutoff of 1260 nm or less). Its LP01 bend loss is still shown.
        </p>
      )}

      {valid && calc.design.V > LP11_CUTOFF_V && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          Design V = {calc.design.V.toFixed(2)} &gt; 2.405 at {wavelength} nm: LP11 is guided too, so the design is not
          single-mode here (its LP11 cutoff is {fmt(calc.design.cutoff_nm, 0, " nm")}).
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label={`Standard SMF at ${radius} mm`} value={`${fmtDb(calc.smf.loss)} dB/turn`} tone="red" subtext={classText(calc.smf.category, calc.smf.mfd1310_um)} />
        <ResultCard label={`Design at ${radius} mm`} value={`${fmtDb(calc.design.loss)} dB/turn`} tone="green" subtext={classText(calc.design.category, calc.design.mfd1310_um)} />
        <ResultCard
          label="Design MFD"
          value={fmt(calc.design.mfd1310_um, 2, " µm at 1310 nm")}
          tone="blue"
          subtext={`${fmt(calc.design.mfd1550_um, 2, " µm at 1550 nm")} (SMF ${fmt(calc.smf.mfd1550_um, 2, " µm")})${
            calc.design.mfd1310_um < G657_MIN_MFD_UM ? `; below the ${G657_MIN_MFD_UM} µm that G.657 allows` : ""
          }`}
        />
        <ResultCard label="Design LP11 cutoff" value={fmt(calc.design.cutoff_nm, 0, " nm")} tone="purple" subtext={`V = ${fmt(calc.design.V, 3)} at ${wavelength} nm (SMF λc ${fmt(calc.smf.cutoff_nm, 0, " nm")})`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Bend Loss vs Radius ({wavelength} nm)</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Bend radius (mm)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Loss per turn (dB)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 350,
          legend: { bgcolor: "transparent", font: { color: "#9ca3af" } },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Design vs ITU-T G.657 Macrobend Limits</h3>
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr className="text-left">
              <th className="py-1 pr-3">Category</th>
              <th className="py-1 pr-3">Radius</th>
              <th className="py-1 pr-3">Turns</th>
              <th className="py-1 pr-3">Limit 1550 / 1625 nm</th>
              <th className="py-1 pr-3">Design 1550 / 1625 nm</th>
              <th className="py-1">Meets</th>
            </tr>
          </thead>
          <tbody className="font-mono text-gray-300">
            {specRows.map((r) => (
              <tr key={`${r.cat}-${r.R}`} className="border-t border-gray-800">
                <td className="py-1 pr-3">{r.cat}</td>
                <td className="py-1 pr-3">{r.R * 1e3} mm</td>
                <td className="py-1 pr-3">{r.turns}</td>
                <td className="py-1 pr-3">{r.max1550} / {r.max1625} dB</td>
                <td className="py-1 pr-3">{fmtDb(r.d1550)} / {fmtDb(r.d1625)} dB</td>
                <td className={`py-1 ${r.pass ? "text-green-400" : "text-red-400"}`}>{r.pass ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-500">
          Macrobend limits only. G.657 also limits the cable cutoff (≤ 1260 nm) and the MFD at 1310 nm. Commercial A2 and B3
          fibres keep an MFD of about 8.5–9 µm at 1310 nm, which a plain step profile cannot combine with B3 bend loss.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">α = √π κ² exp(−2γ³R / 3β²) / (2 γ^(3/2) V² √R K₁²(W)),  loss/turn = 4.343 α · 2πR</p>
          <p>
            Marcuse&apos;s curvature loss of the LP01 mode (J. Opt. Soc. Am. 66, 216, 1976) for two step-index fibres: an SMF-28-like
            G.652 equivalent (a = 4.1 µm, NA 0.1246) and your design. Raising NA and shrinking the core at the same cutoff
            confines the mode (smaller MFD), which is how G.657.A1 fibres cut bend loss. A2 and B3 fibres use a depressed trench
            around the core instead, which keeps the MFD near 9 µm; trench profiles need a numerical mode solver and are not modelled.
          </p>
          <p>
            The elasto-optic correction (Nagano et al. 1978; Schermer &amp; Cole 2007) is on by default: bending stretches the outer
            side, lowering its index, and compresses the inner side, partly undoing the bend&apos;s tilt of the index profile, so
            silica loses as if the radius were R/(1 − p_e), about 1.25× larger (the turn length
            stays 2πR). Untick it for the plain Marcuse formula. Coating reflections and transition loss are left out, so treat the
            category as indicative.
          </p>
        </div>
      </div>
    </>
  );
}
