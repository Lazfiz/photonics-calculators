"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  DB_PER_NEPER, LP11_CUTOFF_V, MIN_V, bendLossCoefficient, bendLossPerTurnDb, lp01Mode, lp11CutoffWavelength,
  modeFieldRadius, vNumber,
} from "../../../physics/fiber-optics/macro-bending-loss";

const CHART_WAVELENGTHS_NM = [1310, 1550, 1625];
// Log-axis floor for the charts: smaller losses are below any measurement and would only stretch the axis.
const MIN_PLOTTED_DB = 1e-6;

const fmtDb = (x: number) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "< 1e-300" : x >= 0.01 && x < 1e4 ? x.toPrecision(3) : x.toExponential(2);

/** Keep the (x, y) pairs a log axis can show. */
function plottable(xs: number[], ys: number[]) {
  const keep = ys.map((y) => Number.isFinite(y) && y >= MIN_PLOTTED_DB);
  return { x: xs.filter((_, i) => keep[i]), y: ys.filter((_, i) => keep[i]) };
}

export default function MacrobendingLossPage() {
  const [bendRadius, setBendRadius] = useURLState("bendRadius", 15); // mm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.1); // µm
  const [coreNA, setCoreNA] = useURLState("coreNA", 0.1246);
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.4682);
  const [numBends, setNumBends] = useURLState("numBends", 1); // turns

  const fiber = useMemo(() => ({ a: coreRadius * 1e-6, n1: coreIndex, NA: coreNA }), [coreRadius, coreIndex, coreNA]);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const R = bendRadius * 1e-3;
    const V = vNumber(fiber, lambda);
    const mode = lp01Mode(V);
    const perTurn = bendLossPerTurnDb(fiber, lambda, R, mode);
    return {
      V,
      n2: Math.sqrt(coreIndex ** 2 - coreNA ** 2),
      dBPerMetre: DB_PER_NEPER * bendLossCoefficient(fiber, lambda, R, mode),
      perTurn,
      total: perTurn * numBends,
      mfd_um: 2 * modeFieldRadius(fiber, lambda) * 1e6,
      cutoff_nm: lp11CutoffWavelength(fiber) * 1e9,
    };
  }, [fiber, wavelength, bendRadius, numBends, coreIndex, coreNA]);

  const radiusData = useMemo(() => {
    const radii_mm = Array.from({ length: 126 }, (_, i) => 5 + i * 0.2);
    return CHART_WAVELENGTHS_NM.map((wl) => {
      const lambda = wl * 1e-9;
      const mode = lp01Mode(vNumber(fiber, lambda));
      const loss = radii_mm.map((r) => bendLossPerTurnDb(fiber, lambda, r * 1e-3, mode));
      return { ...plottable(radii_mm, loss), type: "scatter" as const, mode: "lines" as const, name: `${wl} nm`, line: { width: 2 } };
    });
  }, [fiber]);

  const wavelengthData = useMemo(() => {
    const wavelengths_nm = Array.from({ length: 61 }, (_, i) => 1100 + i * 10);
    const loss = wavelengths_nm.map((wl) => bendLossPerTurnDb(fiber, wl * 1e-9, bendRadius * 1e-3));
    return [{ ...plottable(wavelengths_nm, loss), type: "scatter" as const, mode: "lines" as const, name: "Bend loss", line: { color: "#f97316", width: 2 } }];
  }, [fiber, bendRadius]);

  const valid = Number.isFinite(calc.perTurn);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Bend Radius (mm)" value={bendRadius} onChange={setBendRadius} min={1} max={1000} step="0.5" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={5000} step="1" />
        <ValidatedNumberInput label="Core Radius (µm)" value={coreRadius} onChange={setCoreRadius} min={0.5} max={100} step="0.1" />
        <ValidatedNumberInput label="Core NA" value={coreNA} onChange={setCoreNA} min={0.01} max={0.5} step="0.001" />
        <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} min={1} max={4} step="0.0001" />
        <ValidatedNumberInput label="Number of Turns" value={numBends} onChange={setNumBends} min={1} max={10000} step="1" />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the model needs V ≥ {MIN_V} (here V = {Number.isFinite(calc.V) ? calc.V.toFixed(3) : "—"}) and NA &lt; n₁.
        </p>
      )}
      {valid && calc.V > LP11_CUTOFF_V && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          V = {calc.V.toFixed(2)} &gt; 2.405: the fibre is not single-mode at this wavelength. The loss shown is for LP01 only.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Loss per turn" value={`${fmtDb(calc.perTurn)} dB`} tone="red" subtext={`${fmtDb(calc.dBPerMetre)} dB/m of bent fibre`} />
        <ResultCard
          label={`Total loss (${numBends} turn${numBends === 1 ? "" : "s"})`}
          value={`${fmtDb(calc.total)} dB`}
          tone={calc.total > 0.5 ? "red" : calc.total > 0.1 ? "yellow" : "green"}
        />
        <ResultCard label="V-number" value={Number.isFinite(calc.V) ? calc.V.toFixed(3) : "—"} tone="purple" subtext={`LP11 cutoff λc = ${Number.isFinite(calc.cutoff_nm) ? calc.cutoff_nm.toFixed(0) : "—"} nm`} />
        <ResultCard label="Mode-field diameter" value={Number.isFinite(calc.mfd_um) ? `${calc.mfd_um.toFixed(2)} µm` : "—"} tone="blue" subtext="Marcuse 1977 Gaussian fit" />
        <ResultCard label="Cladding index n₂" value={Number.isFinite(calc.n2) ? calc.n2.toFixed(4) : "—"} tone="gray" subtext="n₂ = √(n₁² − NA²)" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Loss per Turn vs Bend Radius</h3>
          <ChartPanel data={radiusData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Bend Radius (mm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Loss per turn (dB)", gridcolor: "#374151", color: "#9ca3af", type: "log" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 320,
            legend: { bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Loss per Turn vs Wavelength (R = {bendRadius} mm)</h3>
          <ChartPanel data={wavelengthData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Loss per turn (dB)", gridcolor: "#374151", color: "#9ca3af", type: "log" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 320,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">α = √π κ² exp(−2γ³R / 3β²) / (2 γ^(3/2) V² √R K₁²(W))   [1/m, power]</p>
          <p className="font-mono">κ = U/a, γ = W/a, β² = (n₁k)² − κ², U J₁(U)/J₀(U) = W K₁(W)/K₀(W)</p>
          <p>Marcuse&apos;s curvature-loss formula for the LP01 mode of a step-index fibre (J. Opt. Soc. Am. 66, 216, 1976), with the exact LP01 eigenvalues. Loss per turn = 4.343 α · 2πR dB.</p>
          <p>Textbook approximation. It leaves out the elasto-optic correction (silica acts as if R were about 1.28× larger, so real fibre loses less), reflections from the cladding and coating (ripples in R and λ), and the transition loss where each bend starts and ends. ITU-T G.657 specifies bend loss at R = 7.5, 10, 15 and 30 mm.</p>
        </div>
      </div>
    </>
  );
}
