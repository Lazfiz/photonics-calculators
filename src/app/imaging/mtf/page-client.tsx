"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  MAX_HIGH_NA_PHASE, cutoffFrequency, defocusW020, defocusedOtf, diffractionMtf, highNaDefocusOtf, highNaDefocusStrehl,
} from "../../../physics/imaging/diffraction-mtf";
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
  const [naRaw, setNa] = useURLState("na", 0.4);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550);
  const [indexRaw, setIndex] = useURLState("n", 1);
  const [defocusRaw, setDefocus] = useURLState("defocus", 3);
  const [nuRaw, setNu] = useURLState("nu", 0.5);
  const n = clamp(indexRaw, 1, 1.8, 1);
  const na = clamp(naRaw, 0.01, n, Math.min(0.4, n));
  const wavelengthNm = clamp(wavelengthRaw, 200, 2000, 550);
  const defocusUm = clamp(defocusRaw, -20, 20, 3);
  const nu = clamp(nuRaw, 0, 1, 0.5);

  const fc = cutoffFrequency(na, wavelengthNm * nm);
  const w020 = defocusW020(defocusUm * um, na, n) / (wavelengthNm * nm);
  // Exact edge path difference n·Δz(1 − cos θ), sin θ = NA/n.
  const edgeWaves = (n * defocusUm * um * (1 - Math.sqrt(1 - (na / n) ** 2))) / (wavelengthNm * nm);
  // Exact phase 2πD√(1 − s²ρ²): D = nΔz/λ, s = NA/n.
  const dWaves = (n * defocusUm * um) / (wavelengthNm * nm);
  const s = na / n;
  const inFocus = diffractionMtf(nu);
  const defocused = defocusedOtf(nu, w020);
  const exact = highNaDefocusOtf(nu, dWaves, s);
  const strehl = defocusStrehlExact(Math.abs(w020) / Math.sqrt(12));
  const strehlExact = highNaDefocusStrehl(dWaves, s);
  const paraxialOptimistic = Math.abs(edgeWaves) > 1.1 * Math.abs(w020);

  const chart = useMemo(() => {
    const nus = Array.from({ length: 101 }, (_, k) => k / 100);
    const curve = (otf: (v: number) => number, name: string, color: string, dash?: string) => ({
      x: nus.map((v) => (v * fc * um)), y: nus.map(otf), type: "scatter" as const, mode: "lines" as const,
      name, line: { color, dash },
    });
    return [
      curve(diffractionMtf, "In focus", "#60a5fa"),
      curve((v) => defocusedOtf(v, 0.25), "W₀₂₀ = λ/4 (Rayleigh)", "#34d399", "dot"),
      curve((v) => defocusedOtf(v, w020), `Δz = ${defocusUm} µm, paraxial W₀₂₀ = ${fmt(w020, 3)}λ`, "#f87171", "dash"),
      curve((v) => highNaDefocusOtf(v, dWaves, s), `Δz = ${defocusUm} µm, exact phase`, "#f87171"),
      { x: [nu * fc * um, nu * fc * um, nu * fc * um], y: [inFocus, defocused, exact], type: "scatter" as const, mode: "markers" as const, name: "Chosen ν", marker: { color: "#facc15", size: 10 } },
    ];
  }, [fc, w020, dWaves, s, defocusUm, nu, inFocus, defocused, exact]);

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
          {row("Defocused OTF(ν), paraxial (Hopkins)", fmt(defocused, 4))}
          {row("Defocused OTF(ν), exact phase", fmt(exact, 4), exact < 0 ? "text-yellow-400" : "text-red-400")}
          {row("Strehl ratio, paraxial sinc²(kW₀₂₀/2)", fmt(strehl, 4))}
          {row("Strehl ratio, exact phase", fmt(strehlExact, 4), "text-red-400")}
          {paraxialOptimistic && (
            <p className="text-sm text-yellow-400">
              Paraxial W₀₂₀ is {Math.round(100 * (1 - Math.abs(w020) / Math.abs(edgeWaves)))} % below the exact edge path n·Δz(1 − cos θ): at this NA the wavefront is not quadratic, so use the exact-phase values; the paraxial ones are unreliable (usually optimistic).
            </p>
          )}
          {exact < 0 && <p className="text-sm text-yellow-400">Negative OTF: the pattern is imaged with reversed contrast.</p>}
          {!Number.isFinite(exact) && <p className="text-sm text-yellow-400">The exact-phase OTF is not computed past {MAX_HIGH_NA_PHASE} rad of phase across the pupil overlap; the OTF there is close to 0.</p>}
          <p className="text-xs text-gray-500">
            Scalar, uniform pupil amplitude in ρ = sin θ/(NA/n): an aplanatic lens weights it by (1 − (NAρ/n)²)^(−1/4), which
            lowers the defocused OTF further at high NA (by a third at NA 0.95, Δz 0.5 µm); no polarization. The exact phase is 2π(nΔz/λ)√(1 − (NAρ/n)²)
            (Debye integral); its path difference at the pupil edge, n·Δz(1 − cos θ), is {fmt(edgeWaves, 3)}λ here against the
            paraxial W₀₂₀ = {fmt(w020, 3)}λ.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">OTF vs spatial frequency</h2>
        <ChartPanel bare data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
          xaxis: { title: "Spatial frequency (lp/µm)", gridcolor: "#333" },
          yaxis: { title: "OTF", gridcolor: "#333", range: [-0.2, 1.05] },
          margin: { l: 60, r: 20, t: 20, b: 50 }, showlegend: true,
        }} />
      </div>
    </>
  );
}
