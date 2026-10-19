"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { cutoffFrequency, defocusW020, defocusedOtf, diffractionMtf } from "../../../physics/imaging/diffraction-mtf";
import { defocusStrehlExact } from "../../../physics/imaging/wavefront";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const um = 1e-6;
const nm = 1e-9;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function MTFPage() {
  const [naRaw, setNa] = useURLState("na", 0.95);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550);
  const [indexRaw, setIndex] = useURLState("n", 1);
  const [defocusRaw, setDefocus] = useURLState("defocus", 0.5);
  const [nuRaw, setNu] = useURLState("nu", 0.5);
  const n = clamp(indexRaw, 1, 1.8, 1);
  const na = clamp(naRaw, 0.01, n, Math.min(0.95, n));
  const wavelengthNm = clamp(wavelengthRaw, 200, 2000, 550);
  const defocusUm = clamp(defocusRaw, -20, 20, 0.5);
  const nu = clamp(nuRaw, 0, 1, 0.5);

  const fc = cutoffFrequency(na, wavelengthNm * nm);
  const w020 = defocusW020(defocusUm * um, na, n) / (wavelengthNm * nm);
  // Exact edge path difference n·Δz(1 − cos θ), sin θ = NA/n.
  const edgeWaves = (n * defocusUm * um * (1 - Math.sqrt(1 - (na / n) ** 2))) / (wavelengthNm * nm);
  const inFocus = diffractionMtf(nu);
  const defocused = defocusedOtf(nu, w020);
  const strehl = defocusStrehlExact(Math.abs(w020) / Math.sqrt(12));

  const chart = useMemo(() => {
    const nus = Array.from({ length: 201 }, (_, k) => k / 200);
    const curve = (w: number, name: string, color: string, dash?: string) => ({
      x: nus.map((v) => (v * fc * um)), y: nus.map((v) => defocusedOtf(v, w)), type: "scatter" as const, mode: "lines" as const,
      name, line: { color, dash },
    });
    return [
      curve(0, "In focus", "#60a5fa"),
      curve(0.25, "W₀₂₀ = λ/4 (Rayleigh)", "#34d399", "dot"),
      curve(w020, `Δz = ${defocusUm} µm, W₀₂₀ = ${fmt(w020, 3)}λ`, "#f87171"),
      { x: [nu * fc * um, nu * fc * um], y: [inFocus, defocused], type: "scatter" as const, mode: "markers" as const, name: "Chosen ν", marker: { color: "#facc15", size: 10 } },
    ];
  }, [fc, w020, defocusUm, nu, inFocus, defocused]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Numerical aperture NA" value={naRaw} onChange={setNa} min={0.01} max={n} step="any" />
          <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={200} max={2000} step="any" />
          <ValidatedNumberInput label="Refractive index on the NA side, n" value={indexRaw} onChange={setIndex} min={1} max={1.8} step="any" />
          <ValidatedNumberInput label="Defocus Δz on the NA side (µm)" value={defocusRaw} onChange={setDefocus} min={-20} max={20} step="any" />
          <ValidatedNumberInput label="Normalised frequency ν = f/f_c" value={nuRaw} onChange={setNu} min={0} max={1} step="any" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Cutoff f_c = 2NA/λ", fmt(fc * um, 4, " lp/µm"), "text-blue-400")}
          {row("Cutoff", fmt(fc * 1e-3, 0, " lp/mm"))}
          {row("Chosen frequency f = ν·f_c", fmt(nu * fc * 1e-3, 0, " lp/mm"))}
          {row("In-focus MTF(ν)", fmt(inFocus, 5), "text-blue-400")}
          {row("Paraxial W₀₂₀ = Δz·NA²/(2n)", fmt(w020, 4, " λ"))}
          {row("Defocused OTF(ν), Hopkins", fmt(defocused, 4), defocused < 0 ? "text-yellow-400" : "text-red-400")}
          {row("Strehl ratio of the defocus, sinc²(kW₀₂₀/2)", fmt(strehl, 4))}
          {defocused < 0 && <p className="text-sm text-yellow-400">Negative OTF: the pattern is imaged with reversed contrast.</p>}
          <p className="text-xs text-gray-500">
            Scalar, uniform pupil. The paraxial W₀₂₀ under-estimates high-NA defocus: the exact path difference at the
            pupil edge, n·Δz(1 − cos θ), is {fmt(edgeWaves, 3)}λ here, and the wavefront is no longer quadratic in ρ.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">OTF vs spatial frequency</h2>
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Spatial frequency (lp/µm)", gridcolor: "#333" },
          yaxis: { title: "OTF", gridcolor: "#333", range: [-0.2, 1.05] },
          margin: { l: 60, r: 20, t: 20, b: 50 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
