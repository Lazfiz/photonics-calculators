"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  FIT_D_OVER_PITCH, FIT_MAX_LAMBDA_OVER_PITCH, MARCUSE_MIN_V, V_CUTOFF, cutoffWavelength, endlesslySingleModeLimit, inDRange, pcfDispersion, pcfMode, saitohKoshibaV,
} from "../../../physics/fiber-optics/photonic-crystal";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
/** 1 ps/(nm·km) in s/m². */
const PS_NM_KM = 1e-6;
const ESM_LIMIT = endlesslySingleModeLimit();
/** Default plot range, nm: inside the Malitson fit (210–6700 nm) and the usual silica window. */
const PLOT_NM_DEFAULT: readonly [number, number] = [500, 2000];

export default function PhotonicCrystalFiberCalculator() {
  const [pitch, setPitch] = useURLState("pitch", 4.5, { min: 0.5, max: 50 }); // µm, Λ
  const [holeDiameter, setHoleDiameter] = useURLState("holeDiameter", 2.7, { min: 0.05 }); // µm, d
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 300, max: 3000 }); // nm

  const geometryBad = !(pitch > 0 && holeDiameter > 0 && holeDiameter < pitch);
  const r = holeDiameter / pitch;
  const dOutOfFit = !geometryBad && !inDRange(r);
  const lambdaBad = !(wavelength >= 300 && wavelength <= 3000);

  const mode = useMemo(
    () => (geometryBad || lambdaBad ? null : pcfMode(pitch * 1e-6, holeDiameter * 1e-6, wavelength * 1e-9)),
    [pitch, holeDiameter, wavelength, geometryBad, lambdaBad],
  );

  // Widen the default range to keep the input λ and the second-mode cutoff (capped at 4000 nm, inside the Malitson fit) on the charts.
  const cutoffForPlot_nm = geometryBad || dOutOfFit ? NaN : cutoffWavelength(pitch * 1e-6, r) * 1e9;
  const cutoffSpan_nm = Number.isFinite(cutoffForPlot_nm) ? Math.min(4000, 1.2 * cutoffForPlot_nm) : 0;
  const plotLo = Math.min(PLOT_NM_DEFAULT[0], Math.floor(wavelength / 10) * 10);
  const plotHi = Math.max(PLOT_NM_DEFAULT[1], Math.ceil(Math.max(wavelength, cutoffSpan_nm) / 10) * 10);

  const dispersionData = useMemo(() => {
    if (geometryBad) return [];
    const wl: number[] = [];
    const total: (number | null)[] = [];
    const material: (number | null)[] = [];
    for (let nm = plotLo; nm <= plotHi; nm += 10) {
      const m = pcfMode(pitch * 1e-6, holeDiameter * 1e-6, nm * 1e-9);
      wl.push(nm);
      total.push(Number.isFinite(m.dispersion) ? m.dispersion / PS_NM_KM : null);
      material.push(Number.isFinite(m.materialDispersion) ? m.materialDispersion / PS_NM_KM : null);
    }
    return [
      { x: wl, y: total, type: "scatter" as const, mode: "lines" as const, name: "PCF (total)", line: { color: "#60a5fa", width: 2 } },
      { x: wl, y: material, type: "scatter" as const, mode: "lines" as const, name: "Bulk silica", line: { color: "#9ca3af", width: 1.5, dash: "dash" as const } },
    ];
  }, [pitch, holeDiameter, geometryBad, plotLo, plotHi]);

  const vData = useMemo(() => {
    if (geometryBad || dOutOfFit) return [];
    const wl: number[] = [];
    const v: (number | null)[] = [];
    for (let nm = plotLo; nm <= plotHi; nm += 10) {
      wl.push(nm);
      // Beyond λ/Λ = 2 the fit is extrapolated: leave a gap.
      const x = (nm * 1e-3) / pitch;
      v.push(x <= FIT_MAX_LAMBDA_OVER_PITCH ? saitohKoshibaV(x, holeDiameter / pitch) : null);
    }
    return [
      { x: wl, y: v, type: "scatter" as const, mode: "lines" as const, name: "V_eff", line: { color: "#f59e0b", width: 2 } },
      { x: [plotLo, plotHi], y: [V_CUTOFF, V_CUTOFF], type: "scatter" as const, mode: "lines" as const, name: "2.405", line: { color: "#f87171", width: 1, dash: "dash" as const } },
    ];
  }, [pitch, holeDiameter, geometryBad, dOutOfFit, plotLo, plotHi]);

  const zeroCrossings = useMemo(() => {
    if (geometryBad) return [];
    const out: number[] = [];
    let prev = NaN;
    for (let nm = plotLo; nm <= plotHi; nm += 5) {
      const D = pcfDispersion(pitch * 1e-6, holeDiameter * 1e-6, nm * 1e-9);
      if (Number.isFinite(prev) && Number.isFinite(D) && Math.sign(prev) !== Math.sign(D)) out.push(nm - 5 * (D / (D - prev)));
      prev = D;
    }
    return out;
  }, [pitch, holeDiameter, geometryBad, plotLo, plotHi]);

  const D_ps = mode ? mode.dispersion / PS_NM_KM : NaN;
  const cutoff_nm = mode ? mode.cutoffWavelength * 1e9 : NaN;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Pitch Λ (µm)" value={pitch} onChange={setPitch} min={0.5} max={50} step="0.1" />
        <ValidatedNumberInput label="Hole diameter d (µm)" value={holeDiameter} onChange={setHoleDiameter} min={0.05} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={3000} step="1" />
      </div>

      {(geometryBad || lambdaBad) && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: {geometryBad ? "the holes must be smaller than the pitch (0 < d < Λ)." : "the wavelength must lie between 300 and 3000 nm."}
        </p>
      )}
      {dOutOfFit ? (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: d/Λ = {r.toFixed(3)} is outside the fitted range {FIT_D_OVER_PITCH[0]}–{FIT_D_OVER_PITCH[1]}, where the
          empirical relations diverge.
        </p>
      ) : mode && !mode.physical ? (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: at λ/Λ = {mode.lambdaOverPitch.toFixed(2)} the fitted W is {mode.W.toFixed(3)}, outside 0 &lt; W &lt; V
          (it would put n_eff below the cladding index). The fit breaks down at long wavelengths for small d/Λ.
        </p>
      ) : mode && !mode.inFitRange ? (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          λ/Λ = {mode.lambdaOverPitch.toFixed(2)} is beyond the fitted range (λ/Λ ≤ {FIT_MAX_LAMBDA_OVER_PITCH}): the relations
          are extrapolated and less reliable.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard
          label="V_eff (a_eff = Λ/√3)"
          value={fmt(mode?.V ?? NaN, 3)}
          tone="yellow"
          subtext={`d/Λ = ${fmt(holeDiameter / pitch, 3)}, λ/Λ = ${fmt(mode?.lambdaOverPitch ?? NaN, 3)}; W = ${fmt(mode?.W ?? NaN, 3)}`}
        />
        <ResultCard
          label="Guidance"
          value={!mode || !Number.isFinite(mode.V) ? "—" : mode.endlesslySingleMode ? "Endlessly single-mode" : mode.singleMode ? "Single-mode" : "Multimode"}
          tone={!mode || !Number.isFinite(mode.V) ? "gray" : mode.singleMode ? "green" : "orange"}
          subtext={
            !mode || !Number.isFinite(mode.V)
              ? undefined
              : mode.endlesslySingleMode
                ? `d/Λ below ${ESM_LIMIT.toFixed(3)}: V < 2.405 at every λ`
                : `second-mode cutoff λ_c = ${Number.isFinite(cutoff_nm) ? `${cutoff_nm.toFixed(0)} nm` : "beyond the fit"}`
          }
        />
        <ResultCard
          label="Effective index n_eff"
          value={fmt(mode?.nEff ?? NaN, 5)}
          subtext={`silica core ${fmt(mode?.nCore ?? NaN, 5)}, cladding n_FSM ${fmt(mode?.nFsm ?? NaN, 5)}`}
        />
        <ResultCard
          label="Effective cladding NA"
          value={fmt(mode?.na ?? NaN, 3)}
          tone="cyan"
          subtext="√(n_co² − n_FSM²)"
        />
        <ResultCard
          label="Mode-field diameter"
          value={fmt((mode?.mfd ?? NaN) * 1e6, 2, " µm")}
          tone="purple"
          subtext={mode && mode.physical && mode.V < MARCUSE_MIN_V
            ? `V < ${MARCUSE_MIN_V}: Marcuse's fit doesn't apply (weakly confined mode)`
            : `A_eff ≈ πw² = ${fmt((mode?.effectiveArea ?? NaN) * 1e12, 1, " µm²")} (Marcuse fit)`}
        />
        <ResultCard
          label="Dispersion D"
          value={fmt(D_ps, 1, " ps/(nm·km)")}
          tone={D_ps > 0 ? "green" : "blue"}
          subtext={`${D_ps > 0 ? "anomalous" : "normal"}; silica ${fmt((mode?.materialDispersion ?? NaN) / PS_NM_KM, 1)} + waveguide ${fmt((mode?.waveguideDispersion ?? NaN) / PS_NM_KM, 1)}`}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Chromatic Dispersion</h3>
        <ChartPanel data={dispersionData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "D (ps/(nm·km))", gridcolor: "#374151", zeroline: true },
          legend: { x: 0.01, y: 0.98 },
          margin: { t: 20, r: 30, b: 50, l: 70 }, height: 320,
        }} />
        <p className="mt-2 text-sm text-gray-400">
          Total dispersion of the fundamental mode (blue) and of bulk fused silica (grey, dashed); the gap is the waveguide
          contribution of the air-hole cladding. The blue curve stops where the fit is invalid (W ≤ 0 or d/Λ outside
          {" "}{FIT_D_OVER_PITCH[0]}–{FIT_D_OVER_PITCH[1]}).{" "}
          {zeroCrossings.length > 0
            ? `Zero dispersion near ${zeroCrossings.map((z) => `${z.toFixed(0)} nm`).join(" and ")}.`
            : `No zero-dispersion wavelength between ${plotLo} and ${plotHi} nm.`}
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Effective V-Number vs Wavelength</h3>
        <ChartPanel data={vData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "V_eff", gridcolor: "#374151", rangemode: "tozero" },
          legend: { x: 0.7, y: 0.98 },
          margin: { t: 20, r: 30, b: 50, l: 70 }, height: 300,
        }} />
        <p className="mt-2 text-sm text-gray-400">
          The fibre carries one mode where V_eff (amber) is below 2.405 (red, dashed). V_eff levels off at short wavelengths, so
          for d/Λ below {ESM_LIMIT.toFixed(3)} it never reaches 2.405: the fibre is endlessly single-mode.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">V = A₁ + A₂/(1 + A₃ e^(A₄λ/Λ)),  W = B₁ + B₂/(1 + B₃ e^(B₄λ/Λ)),  A_i, B_i polynomials in d/Λ</p>
          <p className="font-mono">n_eff² = n_silica(λ)² − (V² − W²)(λ/2πa_eff)²,  a_eff = Λ/√3</p>
          <p className="font-mono">D = −(λ/c) d²n_eff/dλ²;  w = a_eff(0.65 + 1.619V^−1.5 + 2.879V^−6)</p>
          <p className="text-gray-400">
            Solid-core fibre with a triangular lattice of air holes. Confinement loss depends on the number of hole rings and
            is not modelled; for a few rings and small d/Λ it can dominate.
          </p>
        </div>
      </div>
    </>
  );
}
