"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  airyTransmission, diffractionLimit, fabryPerotResolution, gratingAngularDispersion, gratingDiffractionAngle,
  gratingDiffractionLimit, gratingMaxOrder, gratingSlitBandpass, slitBandpass,
} from "../../../physics/spectroscopy/spectral-resolution";

const DEG = Math.PI / 180;
const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
/** A wavelength interval given in m, shown in pm below 0.1 nm. */
const fmtDl = (m: number) => (!Number.isFinite(m) ? "—" : m < 1e-10 ? `${fmt(m * 1e12)} pm` : `${fmt(m * 1e9)} nm`);

const chartLayout = (xTitle: string, yTitle: string, yRange?: number[]) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent",
  font: { color: "#9ca3af" },
  xaxis: { title: xTitle, gridcolor: "#374151" },
  yaxis: { title: yTitle, gridcolor: "#374151", ...(yRange ? { range: yRange } : {}) },
  margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
});

export default function SpectralResolutionPage() {
  const [mode, setMode] = useURLState("mode", "grating");
  const [grooveDensity, setGrooveDensity] = useURLState("grooveDensity", 1200); // lines/mm
  const [focalLength, setFocalLength] = useURLState("focalLength", 500); // mm
  const [slitWidth, setSlitWidth] = useURLState("slitWidth", 25); // µm
  const [order, setOrder] = useURLState("order", 1);
  const [gratingWL, setGratingWL] = useURLState("gratingWL", 500); // nm, central wavelength in every mode
  const [centralAngle, setCentralAngle] = useURLState("centralAngle", 10); // incidence angle, degrees
  const [gratingWidth, setGratingWidth] = useURLState("gratingWidth", 50); // illuminated ruled width, mm
  const [dispersion, setDispersion] = useURLState("dispersion", 1e-4); // prism angular dispersion, rad/nm
  const [beamWidth, setBeamWidth] = useURLState("beamWidth", 25); // beam width leaving the prism, mm
  const [finesse, setFinesse] = useURLState("finesse", 50);
  const [fsrNm, setFsrNm] = useURLState("fsrNm", 0.05);

  const lambda = gratingWL * 1e-9;
  const w = slitWidth * 1e-6;
  const f = focalLength * 1e-3;

  const calc = useMemo(() => {
    if (mode === "fabry-perot") {
      const res = fabryPerotResolution(fsrNm * 1e-9, finesse);
      return { kind: "fp" as const, res, slit: NaN, diff: NaN, beta: NaN, recipLinear: NaN, maxOrder: NaN };
    }
    if (mode === "prism") {
      const dThetaDl = dispersion * 1e9; // rad/nm → rad/m
      const slit = slitBandpass(w, f, dThetaDl);
      const diff = diffractionLimit(lambda, beamWidth * 1e-3, dThetaDl);
      return { kind: "dispersive" as const, res: Math.max(slit, diff), slit, diff, beta: NaN, recipLinear: 1 / (f * dThetaDl), maxOrder: NaN };
    }
    const d = 1e-3 / grooveDensity;
    const incidence = centralAngle * DEG;
    const beta = gratingDiffractionAngle(lambda, d, order, incidence);
    const maxOrder = gratingMaxOrder(lambda, d, incidence);
    if (!Number.isFinite(beta)) return { kind: "unreachable" as const, res: NaN, slit: NaN, diff: NaN, beta, recipLinear: NaN, maxOrder };
    const slit = gratingSlitBandpass(w, d, order, beta, f);
    const diff = gratingDiffractionLimit(lambda, order, gratingWidth * 1e-3, d);
    const recipLinear = 1 / (f * gratingAngularDispersion(d, order, beta)); // m of wavelength per m at the focal plane
    return { kind: "dispersive" as const, res: Math.max(slit, diff), slit, diff, beta, recipLinear, maxOrder };
  }, [mode, lambda, w, f, grooveDensity, centralAngle, order, gratingWidth, dispersion, beamWidth, finesse, fsrNm]);

  const chartData = useMemo(() => {
    if (calc.kind === "fp") {
      const fsr = fsrNm * 1e-9;
      const x = Array.from({ length: 1201 }, (_, i) => -1.2 * fsr + (i * 2.4 * fsr) / 1200);
      return [
        { x: x.map((v) => (lambda + v) * 1e9), y: x.map((v) => airyTransmission(v, fsr, finesse)), type: "scatter", mode: "lines",
          name: "Airy transmission", line: { color: "#34d399", width: 2 } },
      ];
    }
    if (calc.kind !== "dispersive") return [];
    // δλ vs slit width: the slit term grows linearly, the diffraction limit is a floor.
    const matched = (calc.diff / calc.slit) * slitWidth; // µm where the two terms are equal
    const xMax = Math.max(4 * slitWidth, 2 * matched);
    const x = Array.from({ length: 101 }, (_, i) => (i * xMax) / 100);
    const slitNm = x.map((xi) => (calc.slit * (xi / slitWidth)) * 1e9);
    const yMax = Math.max(...slitNm, calc.diff * 1e9);
    return [
      { x, y: slitNm, type: "scatter", mode: "lines", name: "Slit-limited", line: { color: "#60a5fa", width: 2 } },
      { x: [0, xMax], y: [calc.diff * 1e9, calc.diff * 1e9], type: "scatter", mode: "lines", name: "Diffraction limit",
        line: { color: "#f87171", width: 2, dash: "dash" } },
      { x: [slitWidth, slitWidth], y: [0, yMax], type: "scatter", mode: "lines", name: `Slit ${slitWidth} µm`,
        line: { color: "#fbbf24", width: 1.5, dash: "dot" } },
    ];
  }, [calc, slitWidth, lambda, fsrNm, finesse]);

  const limitedBy = calc.kind === "dispersive" ? (calc.slit >= calc.diff ? "slit-limited" : "diffraction-limited") : "";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Instrument Type</span>
          <select value={mode} onChange={(e) => setMode(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="grating">Diffraction Grating</option>
            <option value="prism">Prism</option>
            <option value="fabry-perot">Fabry-Pérot</option>
          </select>
        </label>
        <ValidatedNumberInput label="Central Wavelength (nm)" value={gratingWL} onChange={setGratingWL} min={100} max={100000} />
        {mode === "grating" && <>
          <ValidatedNumberInput label="Groove Density (lines/mm)" value={grooveDensity} onChange={setGrooveDensity} min={10} max={10000} />
          <ValidatedNumberInput label="Diffraction Order" value={order} onChange={setOrder} min={1} max={10} step="1" />
          <ValidatedNumberInput label="Incidence Angle α (°)" value={centralAngle} onChange={setCentralAngle} min={-80} max={80} />
          <ValidatedNumberInput label="Illuminated Grating Width (mm)" value={gratingWidth} onChange={setGratingWidth} min={0.1} max={1000} />
        </>}
        {mode !== "fabry-perot" && <>
          <ValidatedNumberInput label="Slit Width (µm)" value={slitWidth} onChange={setSlitWidth} min={1} max={10000} />
          <ValidatedNumberInput label="Focal Length (mm)" value={focalLength} onChange={setFocalLength} min={10} max={10000} />
        </>}
        {mode === "prism" && <>
          <ValidatedNumberInput label="Angular Dispersion dθ/dλ (rad/nm)" value={dispersion} onChange={setDispersion} min={1e-7} max={1} step="0.00001" />
          <ValidatedNumberInput label="Beam Width Leaving the Prism (mm)" value={beamWidth} onChange={setBeamWidth} min={0.1} max={1000} />
        </>}
        {mode === "fabry-perot" && <>
          <ValidatedNumberInput label="Finesse ℱ" value={finesse} onChange={setFinesse} min={2} max={1e6} step="1" />
          <ValidatedNumberInput label="FSR (nm)" value={fsrNm} onChange={setFsrNm} min={1e-6} max={1000} step="0.01" />
        </>}
      </div>

      {calc.kind === "unreachable" ? (
        <div className="mb-8 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
          Order {order} does not propagate: mλ/d − sin α = {fmt(order * gratingWL * 1e-6 * grooveDensity - Math.sin(centralAngle * DEG))} lies
          outside [−1, 1].{" "}
          {calc.maxOrder >= 1 ? `The highest order at this incidence angle is ${calc.maxOrder}.` : "No diffracted order propagates at this wavelength; use fewer lines/mm."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <ResultCard label="Spectral Resolution δλ" value={fmtDl(calc.res)} tone="green" subtext={limitedBy || undefined} />
          <ResultCard label="Resolving Power λ/δλ" value={fmt(lambda / calc.res, 4)} tone="yellow" />
          <ResultCard label="Resolution (wavenumber)" value={`${fmt((calc.res / lambda ** 2) * 1e-2)} cm⁻¹`} tone="blue" />
          {calc.kind === "dispersive" && <>
            <ResultCard label="Slit-Limited Bandpass" value={fmtDl(calc.slit)} tone="cyan" subtext="w × reciprocal linear dispersion" />
            <ResultCard label="Diffraction Limit" value={fmtDl(calc.diff)} tone="red"
              subtext={mode === "grating" ? `λ/(mN), N = ${Math.round(gratingWidth * grooveDensity).toLocaleString()} grooves` : "λ/(D · dθ/dλ)"} />
            <ResultCard label="Reciprocal Linear Dispersion" value={`${fmt(calc.recipLinear * 1e6)} nm/mm`} tone="purple"
              subtext={mode === "grating" ? `β = ${fmt(calc.beta / DEG)}°` : undefined} />
          </>}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">{calc.kind === "fp" ? "Fabry-Pérot Transmission" : "Bandpass vs Slit Width"}</h3>
          <ChartPanel data={chartData} layout={calc.kind === "fp"
            ? chartLayout("Wavelength (nm)", "Transmission", [0, 1.05])
            : chartLayout("Slit width (µm)", "δλ (nm)")} />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">Grating: mλ = d(sin α + sin β),   δλ_slit = w·d·cos β / (m·f),   δλ_diff = λ / (mN)</p>
        <p className="font-mono">Prism: δλ_slit = w / (f · dθ/dλ),   δλ_diff = λ / (D · dθ/dλ) = λ / (b·|dn/dλ|)</p>
        <p className="font-mono">Fabry-Pérot: δλ = FSR / ℱ,   T = 1 / [1 + (2ℱ/π)² sin²(π Δλ / FSR)]</p>
        <p>
          The slit is imaged at unit magnification onto the detector, so its width times the reciprocal linear
          dispersion is the slit-limited bandpass. Diffraction by the illuminated aperture sets a floor (Rayleigh
          criterion: resolving power mN for a grating, b·|dn/dλ| for a prism of base b). The resolution shown is the
          larger of the two, an approximation: the real line shape is the slit image convolved with the diffraction
          pattern, broadened further by aberrations and detector pixels, which are not modelled. Widening the slit
          past the point where the two lines cross costs resolution for throughput.
        </p>
        <p className="text-gray-500">
          References: C. Palmer, E. Loewen, <em>Diffraction Grating Handbook</em>, 6th ed. (Newport, 2005), ch. 2;
          E. Hecht, <em>Optics</em>, 5th ed., §9.6.1 (Fabry-Pérot).
        </p>
      </div>
    </>
  );
}
