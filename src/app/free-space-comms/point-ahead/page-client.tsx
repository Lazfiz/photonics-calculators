"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  GEO_SUBSATELLITE_VPERP, GM_EARTH, R_EARTH_EQ, R_GEO, airyHalfAngle, lightTime, pointAheadAngle,
} from "../../../physics/free-space-comms/point-ahead";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

const LEO_ALTITUDE = 500e3;
const PRESETS: { name: string; range: number; v: number }[] = [
  // Satellite at zenith: range = altitude, transverse velocity = circular orbital velocity √(GM/r).
  { name: "LEO 500 km at zenith", range: LEO_ALTITUDE, v: Math.sqrt(GM_EARTH / (R_EARTH_EQ + LEO_ALTITUDE)) },
  // GEO over the station: zero in the Earth-fixed frame, ω_E(r_GEO − R_E) in the inertial frame.
  { name: "GEO to station beneath", range: R_GEO - R_EARTH_EQ, v: GEO_SUBSATELLITE_VPERP },
];

export default function PointAheadPage() {
  const [rangeRaw, setRange] = useURLState("range", 1000); // km
  const [velocityRaw, setVelocity] = useURLState("relVelocity", 7); // km/s
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [apertureRaw, setAperture] = useURLState("txAperture", 10); // cm

  const range_km = clamp(rangeRaw, 0.001, 1e9, 1000);
  const v_kms = clamp(velocityRaw, 0, 100, 7);
  const lambda = clamp(wavelengthRaw, 100, 20000, 1550) * 1e-9;
  const D = clamp(apertureRaw, 0.01, 1000, 10) * 1e-2;

  const r = useMemo(() => {
    const theta = pointAheadAngle(v_kms * 1e3);
    const airy = airyHalfAngle(lambda, D);
    const R = range_km * 1e3;
    return { theta, airy, ratio: theta / airy, miss: theta * R, tof: lightTime(R) };
  }, [v_kms, lambda, D, range_km]);

  const plotData = useMemo(() => {
    const vs = Array.from({ length: 101 }, (_, i) => (i * Math.max(20, 1.5 * v_kms)) / 100);
    const airy_urad = r.airy * 1e6;
    return [
      { x: vs, y: vs.map((v) => pointAheadAngle(v * 1e3) * 1e6), type: "scatter", mode: "lines", name: "Point-ahead 2v⊥/c", line: { color: "#06b6d4" } },
      { x: [vs[0], vs[vs.length - 1]], y: [airy_urad, airy_urad], type: "scatter", mode: "lines", name: "Diffraction half-angle 1.22λ/D", line: { color: "#f59e0b", dash: "dash" } },
      { x: [v_kms], y: [r.theta * 1e6], type: "scatter", mode: "markers", name: "This link", marker: { color: "#22c55e", size: 9 } },
    ];
  }, [v_kms, r]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ValidatedNumberInput label="Link Range (km)" value={rangeRaw} onChange={setRange} min={0.001} max={1e9} step="any" />
        <ValidatedNumberInput label="Transverse Relative Velocity v⊥ (km/s, inertial)" value={velocityRaw} onChange={setVelocity} min={0} max={100} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={20000} step="any" />
        <ValidatedNumberInput label="TX Aperture Diameter (cm)" value={apertureRaw} onChange={setAperture} min={0.01} max={1000} step="any" />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-8 text-xs text-gray-400">
        <span>Presets:</span>
        {PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => { setRange(Math.round(p.range / 1e3)); setVelocity(Number((p.v / 1e3).toFixed(3))); }}
            className="bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-gray-300">
            {p.name} ({(p.v / 1e3).toFixed(2)} km/s)
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Point-ahead angle 2v⊥/c" value={`${(r.theta * 1e6).toFixed(2)} µrad`} tone="cyan" subtext="independent of range" />
        <ResultCard label="Diffraction half-angle 1.22λ/D" value={`${fmt(r.airy * 1e6)} µrad`} tone="gray" subtext="first null of a uniformly filled aperture" />
        <ResultCard label="Point-ahead / half-angle" value={fmt(r.ratio)} tone={r.ratio < 0.1 ? "green" : r.ratio < 1 ? "yellow" : "red"}
          subtext={r.ratio < 0.1 ? "small: the beam still covers the target" : "the beam must be steered ahead"} />
        <ResultCard label="Miss distance without point-ahead" value={`${fmt(r.miss)} m`} tone="orange" subtext="θ_PA × R at the far terminal" />
        <ResultCard label="One-way light time R/c" value={`${fmt(r.tof * 1e3)} ms`} tone="blue" subtext={`round trip ${fmt(2 * r.tof * 1e3)} ms`} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Point-ahead angle vs transverse velocity</h2>
        <ChartPanel data={plotData} layout={{
          xaxis: { title: "v⊥ (km/s)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Angle (µrad)", color: "#9ca3af", gridcolor: "#374151" },
          margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-sm text-gray-400 space-y-2">
        <p>
          The beacon from the far terminal shows where it was R/c ago, and the transmitted beam arrives R/c later, so the
          transmit direction must lead the received beacon by θ<sub>PA</sub> = 2v⊥/c. Use the transverse velocity in an
          inertial frame: a GEO satellite is fixed in the sky, yet relative to the stars it moves 2.61 km/s faster than a
          station beneath it, which gives 17.4 µrad. The LEO preset uses the orbital velocity alone, as the cited chapter does; the station&apos;s own rotation (up to 0.465 km/s at the equator) changes θ<sub>PA</sub> by up to ≈ ±3 µrad (2 × 0.465 km/s / c = 3.1 µrad), depending on the pass geometry.
        </p>
        <p>
          Point-ahead matters when θ<sub>PA</sub> is a sizeable fraction of the beam half-angle; a 10 cm aperture at
          1550 nm has 1.22λ/D = 18.9 µrad, so a LEO downlink (≈ 51 µrad) needs a point-ahead mirror.
        </p>
      </div>
    </>
  );
}
