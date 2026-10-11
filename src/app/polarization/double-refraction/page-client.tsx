"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CrystalNote, CrystalSelect, isCrystalId, materialRange, resolveIndices } from "../../../components/crystal-select";
import { fix } from "../../../components/polarization-format";
import {
  beamSeparation, extraordinaryIndex, maxWalkoff, plateRetardance, plateWaves, walkoffAngle,
} from "../../../physics/polarization/uniaxial";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const geometry = (incidence: number, axisPolar: number) => ({ nIncident: 1, incidence, axisPolar, axisAzimuth: 0 });
const deg = (rad: number, digits = 2) => (Number.isFinite(rad) ? `${fix(rad / DEG, digits)}°` : "—");

export default function DoubleRefractionPage() {
  const [material, setMaterial] = useURLState("crystal", "calcite");
  const [customNo, setCustomNo] = useURLState("nO", 1.658);
  const [customNe, setCustomNe] = useURLState("nE", 1.486);
  const [wavelengthNm, setWavelengthNm] = useURLState("wavelength", 589);
  const [thicknessMm, setThicknessMm] = useURLState("thickness", 10);
  const [axisDeg, setAxisDeg] = useURLState("axisAngle", 45);
  const [aoiDeg, setAoiDeg] = useURLState("angleOfIncidence", 0);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const lambda = clamp(wavelengthNm, 200, 7000) * 1e-9;
  const d = clamp(thicknessMm, 0.001, 100) * 1e-3;
  const alpha = clamp(axisDeg, 0, 90) * DEG;
  const aoi = clamp(aoiDeg, 0, 85) * DEG;
  const cNo = clamp(customNo, 1, 5);
  const cNe = clamp(customNe, 1, 5);

  const { no, ne } = resolveIndices(material, lambda, cNo, cNe);
  const w = plateWaves(no, ne, geometry(aoi, alpha));
  const rayE = Math.atan2(w.e.ray[0], w.e.ray[2]);
  const separation = beamSeparation(w, d, aoi);
  const gammaWaves = plateRetardance(w, d, lambda) / (2 * Math.PI);
  const peak = maxWalkoff(no, ne);

  const axisChart = useMemo(() => {
    const a = Array.from({ length: 181 }, (_, i) => i * 0.5);
    return [
      { x: a, y: a.map((t) => extraordinaryIndex(no, ne, t * DEG)), type: "scatter" as const, mode: "lines" as const, name: "n(θ)", line: { color: "#60a5fa", width: 2 } },
      { x: a, y: a.map((t) => walkoffAngle(no, ne, t * DEG) / DEG), type: "scatter" as const, mode: "lines" as const, name: "Walk-off ρ (°)", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
      { x: [peak.theta / DEG], y: [peak.rho / DEG], type: "scatter" as const, mode: "markers" as const, name: "Largest walk-off", marker: { color: "#fbbf24", size: 9 }, yaxis: "y2" },
    ];
  }, [no, ne, peak.theta, peak.rho]);

  const incidenceChart = useMemo(() => {
    const t = Array.from({ length: 161 }, (_, i) => i * 0.5);
    const waves = t.map((x) => plateWaves(no, ne, geometry(x * DEG, alpha)));
    return [
      { x: t, y: waves.map((wv, i) => beamSeparation(wv, d, t[i] * DEG) * 1e3), type: "scatter" as const, mode: "lines" as const, name: "Beam separation (mm)", line: { color: "#34d399", width: 2 } },
      { x: t, y: waves.map((wv) => plateRetardance(wv, d, lambda) / (2 * Math.PI)), type: "scatter" as const, mode: "lines" as const, name: "Retardance (waves)", line: { color: "#a78bfa", width: 2 }, yaxis: "y2" },
    ];
  }, [no, ne, alpha, d, lambda]);

  const spectralChart = useMemo(() => {
    const [lo, hi] = materialRange(material, [300e-9, 1800e-9]);
    const a = Math.max(lo, 250e-9), b = Math.min(hi, 2500e-9);
    const l = Array.from({ length: 300 }, (_, i) => a * (b / a) ** (i / 299));
    const y = l.map((x) => {
      const n = resolveIndices(material, x, cNo, cNe);
      return plateRetardance(plateWaves(n.no, n.ne, geometry(aoi, alpha)), d, x) / (2 * Math.PI);
    });
    return [{ x: l.map((x) => x * 1e9), y, type: "scatter" as const, mode: "lines" as const, name: "Retardance (waves)", line: { color: "#a78bfa", width: 2 } }];
  }, [material, cNo, cNe, aoi, alpha, d]);

  const layout = (x: string, y: string, y2?: string) => ({
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
    xaxis: { title: x, gridcolor: "#374151" },
    yaxis: { title: y, gridcolor: "#374151" },
    ...(y2 ? { yaxis2: { title: y2, overlaying: "y" as const, side: "right" as const, gridcolor: "transparent" } } : {}),
    margin: { t: 20, r: y2 ? 60 : 20, b: 50, l: 60 }, height: 300, legend: { orientation: "h" as const, y: -0.3 },
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>1/n(θ)² = cos²θ/n<sub>o</sub>² + sin²θ/n<sub>e</sub>² &nbsp;(θ: wave normal to optic axis)</p>
        <p>tan θ<sub>S</sub> = (n<sub>o</sub>²/n<sub>e</sub>²) tan θ, &nbsp;ρ = θ<sub>S</sub> − θ &nbsp;(ρ &gt; 0: ray turned away from the axis)</p>
        <p>k<sub>x</sub> = sin θ<sub>i</sub> conserved; e wave: k<sub>⊥</sub>²/n<sub>e</sub>² + k<sub>∥</sub>²/n<sub>o</sub>² = 1</p>
        <p>Γ = (2πd/λ)(k<sub>z,e</sub> − k<sub>z,o</sub>)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        <CrystalSelect value={material} onChange={setMaterial} />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthNm} onChange={setWavelengthNm} min={200} max={7000} step="1" />
        <ValidatedNumberInput label="Thickness (mm)" value={thicknessMm} onChange={setThicknessMm} min={0.001} max={100} step="0.1" />
        <ValidatedNumberInput label="Optic axis from surface normal (°)" value={axisDeg} onChange={setAxisDeg} min={0} max={90} step="1" />
        <ValidatedNumberInput label="Angle of incidence (°)" value={aoiDeg} onChange={setAoiDeg} min={0} max={85} step="1" />
        {!isCrystalId(material) && (
          <>
            <ValidatedNumberInput label={<>n<sub>o</sub></>} value={customNo} onChange={setCustomNo} min={1} max={5} step="0.001" />
            <ValidatedNumberInput label={<>n<sub>e</sub></>} value={customNe} onChange={setCustomNe} min={1} max={5} step="0.001" />
          </>
        )}
      </div>
      <CrystalNote material={material} lambda={lambda} />

      <p className="text-xs text-gray-500 mb-6">
        The optic axis lies in the plane of incidence, tilted by the axis angle from the surface normal toward the incoming beam&apos;s
        side (+x). Both beams leave the plate parallel to the incident beam.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n<sub>o</sub> / n<sub>e</sub></p>
          <p className="text-xl font-bold text-blue-400">{fix(no, 5)} / {fix(ne, 5)}</p>
          <p className="text-xs text-gray-500">Δn = {fix(ne - no, 5)} ({ne < no ? "negative" : "positive"} uniaxial)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">e wave</p>
          <p className="text-xl font-bold text-blue-400">n = {fix(w.e.index, 5)}</p>
          <p className="text-xs text-gray-500">wave normal {deg(w.e.axisAngle)} from the optic axis</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Walk-off (e ray − e wave normal)</p>
          <p className="text-xl font-bold text-yellow-400">{deg(rayE - w.e.waveAngle)}</p>
          <p className="text-xs text-gray-500">largest: {deg(Math.abs(peak.rho))} at θ = {deg(peak.theta)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Refraction angles (from the normal)</p>
          <p className="text-sm font-mono text-gray-200">o ray {deg(w.o.waveAngle)}</p>
          <p className="text-sm font-mono text-gray-200">e wave normal {deg(w.e.waveAngle)}</p>
          <p className="text-sm font-mono text-gray-200">e ray {deg(rayE)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam separation after the plate</p>
          <p className="text-xl font-bold text-green-400">{fix(separation * 1e3, 4)} mm</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Retardance (e relative to o)</p>
          <p className="text-xl font-bold text-purple-400">{fix(gammaWaves, 3)} waves</p>
          <p className="text-xs text-gray-500">{fix(gammaWaves * 360, 1)}°; negative: the e wave leads</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">e index and walk-off against the wave-normal angle to the axis</h3>
          <ChartPanel data={axisChart} layout={layout("θ from optic axis (°)", "n(θ)", "Walk-off ρ (°)")} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Separation and retardance against the angle of incidence</h3>
          <ChartPanel data={incidenceChart} layout={layout("Angle of incidence (°)", "Separation (mm)", "Retardance (waves)")} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Retardance against wavelength (this plate and geometry)</h3>
        <ChartPanel data={spectralChart} layout={layout("Wavelength (nm)", "Retardance (waves)")} />
      </div>
    </>
  );
}
