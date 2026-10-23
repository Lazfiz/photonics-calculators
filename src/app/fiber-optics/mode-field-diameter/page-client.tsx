"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  LP11_CUTOFF_V, MFD_FIT_V_RANGE, MIN_V, bendLossPerTurnDb, lp01Mode, lp11CutoffWavelength, modeFieldRadius, vNumber,
} from "../../../physics/fiber-optics/macro-bending-loss";
import {
  claddingIndex, coreConfinement, effectiveIndex, lp01Field, normalizedB, petermannIIRadius,
} from "../../../physics/fiber-optics/step-index-modes";

// SMF-28-like step-index equivalent: a = 4.1 µm, NA 0.1246, pure-silica cladding (n₂ = 1.4440 at 1550 nm).
const SMF_PRESET = { coreRadius: 4.1, na: 0.1246, coreIndex: 1.4494 };
const MIN_PLOTTED_DB = 1e-6;

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const fmtDb = (x: number) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "< 1e-300" : x >= 0.01 && x < 1e4 ? x.toPrecision(3) : x.toExponential(2);

/** Keep the finite (x, y) pairs (and y ≥ floor for log axes). */
function finitePairs(xs: number[], ys: number[], floor = -Infinity) {
  const keep = ys.map((y) => Number.isFinite(y) && y >= floor);
  return { x: xs.filter((_, i) => keep[i]), y: ys.filter((_, i) => keep[i]) };
}

export default function ModeFieldDiameterPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", SMF_PRESET.coreRadius); // µm
  const [na, setNa] = useURLState("na", SMF_PRESET.na);
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", SMF_PRESET.coreIndex);

  const applyPreset = () => {
    setCoreRadius(SMF_PRESET.coreRadius);
    setNa(SMF_PRESET.na);
    setCoreIndex(SMF_PRESET.coreIndex);
  };

  const fiber = useMemo(() => ({ a: coreRadius * 1e-6, n1: coreIndex, NA: na }), [coreRadius, coreIndex, na]);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const V = vNumber(fiber, lambda);
    const mode = lp01Mode(V);
    const wFit = modeFieldRadius(fiber, lambda);
    const wPII = petermannIIRadius(fiber, lambda, mode);
    return {
      V,
      mode,
      delta: na ** 2 / (2 * coreIndex ** 2),
      n2: claddingIndex(fiber),
      wFit_um: wFit * 1e6,
      mfdFit_um: 2 * wFit * 1e6,
      mfdPII_um: 2 * wPII * 1e6,
      aeff_um2: Math.PI * (wFit * 1e6) ** 2,
      cutoff_nm: lp11CutoffWavelength(fiber) * 1e9,
      b: normalizedB(mode),
      nEff: effectiveIndex(fiber, lambda, mode),
      gamma: coreConfinement(mode),
    };
  }, [fiber, wavelength, na, coreIndex]);

  const valid = Number.isFinite(calc.mode.U);

  const profileData = useMemo(() => {
    if (!valid) return [];
    const r_um = Array.from({ length: 241 }, (_, i) => -3 * coreRadius + (i * 6 * coreRadius) / 240);
    const exact = r_um.map((r) => lp01Field(calc.mode, r / coreRadius) ** 2);
    const gauss = r_um.map((r) => Math.exp((-2 * r * r) / calc.wFit_um ** 2));
    return [
      { type: "scatter" as const, mode: "lines" as const, x: r_um, y: exact, name: "Exact LP01", line: { color: "#3b82f6", width: 2 } },
      { type: "scatter" as const, mode: "lines" as const, x: r_um, y: gauss, name: "Gaussian fit", line: { color: "#22c55e", width: 2, dash: "dash" as const } },
      { type: "scatter" as const, mode: "lines" as const, x: [-coreRadius, -coreRadius, coreRadius, coreRadius], y: [0, 1, 1, 0], name: "Core", line: { color: "#f59e0b", width: 1, dash: "dot" as const } },
    ];
  }, [valid, calc.mode, calc.wFit_um, coreRadius]);

  const mfdData = useMemo(() => {
    const wl_nm = Array.from({ length: 91 }, (_, i) => 1100 + i * 10);
    const fit = wl_nm.map((wl) => 2e6 * modeFieldRadius(fiber, wl * 1e-9));
    const pii = wl_nm.map((wl) => 2e6 * petermannIIRadius(fiber, wl * 1e-9));
    return [
      { ...finitePairs(wl_nm, pii), type: "scatter" as const, mode: "lines" as const, name: "Petermann II", line: { color: "#3b82f6", width: 2 } },
      { ...finitePairs(wl_nm, fit), type: "scatter" as const, mode: "lines" as const, name: "Gaussian fit", line: { color: "#22c55e", width: 2, dash: "dash" as const } },
    ];
  }, [fiber]);

  const bendData = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const mode = lp01Mode(vNumber(fiber, lambda));
    const radii_mm = Array.from({ length: 126 }, (_, i) => 5 + i * 0.2);
    const loss = radii_mm.map((R) => bendLossPerTurnDb(fiber, lambda, R * 1e-3, mode));
    return [{ ...finitePairs(radii_mm, loss, MIN_PLOTTED_DB), type: "scatter" as const, mode: "lines" as const, name: "Bend loss", line: { color: "#ef4444", width: 2 } }];
  }, [fiber, wavelength]);

  const layout = (x: string, y: string, logY = false) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    xaxis: { title: x, color: "#9ca3af", gridcolor: "#374151" },
    yaxis: { title: y, color: "#9ca3af", gridcolor: "#374151", ...(logY ? { type: "log" as const } : {}) },
    font: { color: "#e5e7eb" }, margin: { l: 60, r: 20, t: 20, b: 50 }, height: 320,
    legend: { bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={5000} step="1" />
        <ValidatedNumberInput label="Core Radius (µm)" value={coreRadius} onChange={setCoreRadius} min={0.5} max={100} step="0.1" />
        <ValidatedNumberInput label="Numerical Aperture" value={na} onChange={setNa} min={0.01} max={0.5} step="0.001" />
        <ValidatedNumberInput label="Core Index n₁" value={coreIndex} onChange={setCoreIndex} min={1} max={4} step="0.0001" />
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-gray-400">
        <button onClick={applyPreset} className="px-3 py-1 text-xs rounded border bg-gray-800 border-gray-700 hover:border-blue-500">
          SMF-28-like step fibre
        </button>
        <span>a = 4.1 µm, NA = 0.1246, n₁ = 1.4494 (λc ≈ 1335 nm). Real SMF-28 is a step-index fibre with a rounded step; its datasheet MFD is 10.4 µm at 1550 nm.</span>
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the model needs V ≥ {MIN_V} (here V = {fmt(calc.V, 3)}) and 0 &lt; NA &lt; n₁.
        </p>
      )}
      {valid && calc.V > LP11_CUTOFF_V && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          V = {calc.V.toFixed(2)} &gt; 2.405: LP11 is also guided, so the fibre is not single-mode here. Values are for LP01.
        </p>
      )}
      {valid && (calc.V < MFD_FIT_V_RANGE[0] || calc.V > MFD_FIT_V_RANGE[1]) && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          V = {calc.V.toFixed(2)} is outside 1.2–2.4, where Marcuse&apos;s Gaussian fit is within about 1 %.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="MFD (Petermann II)" value={fmt(calc.mfdPII_um, 2, " µm")} tone="blue" subtext="Exact LP01; ITU-T G.650.1 definition" />
        <ResultCard label="MFD (Gaussian fit)" value={fmt(calc.mfdFit_um, 2, " µm")} tone="green" subtext="Marcuse 1977: w/a = 0.65 + 1.619/V^1.5 + 2.879/V^6" />
        <ResultCard label="Effective area" value={fmt(calc.aeff_um2, 1, " µm²")} tone="yellow" subtext="π w² of the Gaussian fit" />
        <ResultCard label="V-number" value={fmt(calc.V, 3)} tone="purple" subtext={`LP11 cutoff λc = ${fmt(calc.cutoff_nm, 0, " nm")}`} />
        <ResultCard label="Relative index Δ" value={fmt(calc.delta * 100, 3, " %")} tone="gray" subtext={`n₂ = √(n₁² − NA²) = ${fmt(calc.n2, 4)}`} />
        <ResultCard label="Normalized b" value={fmt(calc.b, 4)} tone="gray" subtext={`n_eff = ${fmt(calc.nEff, 5)}`} />
        <ResultCard label="Power in core Γ" value={fmt(calc.gamma * 100, 1, " %")} tone="cyan" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Mode Intensity Profile</h3>
          <ChartPanel data={profileData} layout={{ ...layout("Radial position (µm)", "Normalized intensity"), yaxis: { title: "Normalized intensity", color: "#9ca3af", gridcolor: "#374151", range: [0, 1.05] } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">MFD vs Wavelength</h3>
          <ChartPanel data={mfdData} layout={layout("Wavelength (nm)", "MFD (µm)")} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Bend Loss per Turn vs Radius ({wavelength} nm)</h3>
          <ChartPanel data={bendData} layout={layout("Bend radius (mm)", "Loss per turn (dB)", true)} />
          <p className="mt-2 text-xs text-gray-500">
            Marcuse 1976 curvature loss of LP01, as on the macrobending-loss page; no elasto-optic correction. At 10 mm: {fmtDb(bendLossPerTurnDb(fiber, wavelength * 1e-9, 10e-3))} dB/turn.
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Model</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p className="font-mono">V = 2π a NA / λ,  U J₁(U)/J₀(U) = W K₁(W)/K₀(W),  U² + W² = V²</p>
            <p className="font-mono">w_PII = √2 a K₁(W) / (U K₀(W)),  MFD = 2w</p>
            <p className="font-mono">Γ = (W²/V²)(1 + J₀²(U)/J₁²(U)),  b = W²/V²</p>
            <p>
              Weakly guiding step-index fibre (Gloge 1971). Petermann II is the far-field MFD that ITU-T G.650.1 specifies;
              for the step profile it follows in closed form from the exact LP01 field. Marcuse&apos;s fit is the best Gaussian to the near field, about 2 % larger near V = 2.
              Graded or trench profiles (real G.652 and G.657 fibres) need a numerical mode solver.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
