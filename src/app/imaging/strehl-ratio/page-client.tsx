"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  MAX_STREHL_RMS_WAVES, type ZernikeMode, marechalRms, marechalStrehl, pvFromRms, rmsFromPv, zernikeStrehl,
} from "../../../physics/imaging/wavefront";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const nm = 1e-9;

const MODES: ZernikeMode[] = ["defocus", "astigmatism", "coma", "spherical"];
const MODE_LABELS: Record<ZernikeMode, string> = {
  defocus: "Defocus √3(2ρ² − 1)",
  astigmatism: "Astigmatism √6ρ²cos 2θ",
  coma: "Coma √8(3ρ³ − 2ρ)cos θ",
  spherical: "Spherical √5(6ρ⁴ − 6ρ² + 1)",
};
const INPUTS = ["rms", "pv"] as const;
type InputKind = (typeof INPUTS)[number];

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const buttonClass = (active: boolean) =>
  `px-3 py-2 rounded text-sm font-medium ${active ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`;

export default function StrehlRatioPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelengthNm", 550);
  const [wfeRaw, setWfe] = useURLState("wfeNm", 20);
  const [inputRaw, setInput] = useURLState("input", "rms");
  const [modeRaw, setMode] = useURLState("mode", "defocus");
  const wavelengthNm = clamp(wavelengthRaw, 200, 20000, 550);
  const wfeNm = clamp(wfeRaw, 0, 10000, 20);
  const input: InputKind = INPUTS.find((k) => k === inputRaw) ?? "rms";
  const mode: ZernikeMode = MODES.find((m) => m === modeRaw) ?? "defocus";

  const rmsNm = input === "rms" ? wfeNm : rmsFromPv(wfeNm, mode);
  const pvNm = pvFromRms(rmsNm, mode);
  const waves = rmsNm / wavelengthNm;
  const marechal = marechalStrehl(rmsNm * nm, wavelengthNm * nm);
  const exact = zernikeStrehl(mode, waves);
  const sigma08Nm = marechalRms(0.8, wavelengthNm * nm) / nm;
  const lambda14Nm = wavelengthNm / 14;

  const curves = useMemo(() => {
    const ws = Array.from({ length: 61 }, (_, k) => (0.3 * k) / 60);
    return [
      { x: ws, y: ws.map((w) => marechalStrehl(w, 1)), type: "scatter" as const, mode: "lines" as const, name: "Maréchal exp(−(2πσ/λ)²)", line: { color: "#60a5fa" } },
      { x: ws, y: ws.map((w) => 1 - (2 * Math.PI * w) ** 2), type: "scatter" as const, mode: "lines" as const, name: "First order 1 − (2πσ/λ)²", line: { color: "#9ca3af", dash: "dot" } },
      { x: ws, y: ws.map((w) => zernikeStrehl(mode, w)), type: "scatter" as const, mode: "lines" as const, name: `Exact, ${mode}`, line: { color: "#f87171" } },
      { x: [0, 0.3], y: [0.8, 0.8], type: "scatter" as const, mode: "lines" as const, name: "S = 0.8", line: { color: "#34d399", dash: "dash" } },
    ];
  }, [mode]);
  const chart = [
    ...curves,
    { x: [waves], y: [exact], type: "scatter" as const, mode: "markers" as const, name: "Current", marker: { color: "#facc15", size: 10 } },
  ];

  return (
    <>
      <div role="group" aria-label="Aberration" className="flex flex-wrap gap-2 mb-4">
        {MODES.map((m) => (
          <button key={m} onClick={() => setMode(m)} className={buttonClass(mode === m)}>{MODE_LABELS[m]}</button>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={20000} step="any" />
          <div role="group" aria-label="Wavefront error given as" className="flex gap-2">
            <button onClick={() => setInput("rms")} className={buttonClass(input === "rms")}>RMS</button>
            <button onClick={() => setInput("pv")} className={buttonClass(input === "pv")}>Peak-to-valley</button>
          </div>
          <ValidatedNumberInput label={`Wavefront error, ${input === "rms" ? "RMS" : "PV"} (nm)`} value={wfeRaw} onChange={setWfe} min={0} max={10000} step="any" />
          <p className="text-xs text-gray-500">
            PV/RMS is fixed only for a single Zernike term ({fmt(pvFromRms(1, mode), 3)} for {mode}). A measured
            surface mixes terms, so convert its PV with care; RMS is the number the Strehl ratio depends on.
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("RMS wavefront error σ", fmt(rmsNm, 2, " nm"))}
          {row("σ in waves", fmt(waves, 4, " λ"))}
          {row(`PV for one ${mode} term`, fmt(pvNm, 2, " nm"))}
          {row("Strehl, Maréchal exp(−(2πσ/λ)²)", fmt(marechal, 4), "text-blue-400")}
          {row(`Strehl, exact for ${mode}`, fmt(exact, 4), "text-red-400")}
          {row("Maréchal tolerance λ/14", fmt(lambda14Nm, 2, " nm"), rmsNm <= lambda14Nm ? "text-green-400" : "text-yellow-400")}
          {row("σ for S = 0.8 with exp(−(2πσ/λ)²)", fmt(sigma08Nm, 2, " nm"), rmsNm <= sigma08Nm ? "text-green-400" : "text-yellow-400")}
          {waves > MAX_STREHL_RMS_WAVES && <p className="text-sm text-yellow-400">— : the exact Strehl is computed up to {MAX_STREHL_RMS_WAVES} waves RMS.</p>}
          <p className="text-xs text-gray-500">
            Maréchal&apos;s λ/14 is where the first-order form 1 − (2πσ/λ)² reaches 0.8; the exponential form reaches 0.8
            at 0.0752λ. The exponential stays within 2 % of the exact Strehl of each term up to σ = 0.1λ (S ≈ 0.67);
            the first-order form is already 10 % low there. The exact Strehl is the squared pupil average of
            exp(2πiσZ/λ) for one balanced Zernike term (Noll normalisation, RMS = coefficient).
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Strehl ratio vs RMS wavefront error</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "RMS wavefront error σ (waves)", gridcolor: "#333", range: [0, 0.3] },
          yaxis: { title: "Strehl ratio", gridcolor: "#333", range: [0, 1.05] },
          margin: { l: 60, r: 20, t: 20, b: 50 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
