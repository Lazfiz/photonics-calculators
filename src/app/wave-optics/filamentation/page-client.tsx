"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  criticalPower, focusedCollapseDistance, pulsePeakPower, rayleighRangeInMedium, selfFocusingDistance,
} from "../../../physics/wave-optics/kerr";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits).replace("e+", "e") : "—");
const round6 = (x: number) => Number(x.toPrecision(6));
const fmtLength = (m: number) => !Number.isFinite(m)
  ? "—"
  : Math.abs(m) >= 1 ? `${fmt(m)} m` : Math.abs(m) >= 1e-3 ? `${fmt(m * 1e3)} mm` : `${fmt(m * 1e6)} µm`;

/** Collapse distance against peak power from 1.05 P_cr to 3× the current power (at least 10 P_cr). */
function collapseCurves(Pcr: number, zR: number, f: number, power: number) {
  const pMax = Math.max(10, 3 * power / Pcr);
  const ratios = Array.from({ length: 200 }, (_, i) => 1.05 * Math.pow(pMax / 1.05, i / 199));
  const curve = (lens: number) => ratios.flatMap((r) => {
    const z = focusedCollapseDistance(selfFocusingDistance(r, zR), lens);
    return Number.isFinite(z) ? [{ x: round6(r * Pcr * 1e-6), y: round6(z * 1e3) }] : [];
  });
  return [
    { name: "Collimated (Marburger)", color: "#60a5fa", points: curve(Infinity) },
    ...(Number.isFinite(f) ? [{ name: `With the geometric focus at ${fmt(f * 1e3, 3)} mm`, color: "#f472b6", points: curve(f) }] : []),
  ];
}

export default function FilamentationPage() {
  const [lambdaRaw, setLambda] = useURLState("wavelength", 800); // nm
  const [energyRaw, setEnergy] = useURLState("pulseEnergy", 1); // µJ
  const [fwhmRaw, setFwhm] = useURLState("pulseDuration", 100); // fs, Gaussian intensity FWHM
  const [waistRaw, setWaist] = useURLState("beamWaist", 50); // µm
  const [n2Raw, setN2] = useURLState("n2", 2.4); // 1e-16 cm²/W, fused silica (Dubietis et al. 2017, Table 1)
  const [n0Raw, setN0] = useURLState("n0", 1.45);
  const [lensRaw, setLens] = useURLState("lensFocal", 0); // mm, geometric focus depth in the medium, 0 = collimated

  const lambda = clamp(lambdaRaw, 200, 20000, 800) * 1e-9;
  const energy = clamp(energyRaw, 0, 1e7, 1) * 1e-6;
  const fwhm = clamp(fwhmRaw, 1, 1e6, 100) * 1e-15;
  const w = clamp(waistRaw, 1, 1e5, 50) * 1e-6;
  const n2 = clamp(n2Raw, 1e-4, 1e6, 2.4) * 1e-20;
  const n0 = clamp(n0Raw, 1, 5, 1.45);
  const lensMm = clamp(lensRaw, -1e6, 1e6, 0);
  const f = lensMm === 0 ? Infinity : lensMm * 1e-3;

  const Pcr = criticalPower(lambda, n0, n2);
  const power = pulsePeakPower(energy, fwhm, "gaussian");
  const ratio = power / Pcr;
  const energyAtPcr = Pcr / pulsePeakPower(1, fwhm, "gaussian");
  const zR = rayleighRangeInMedium(lambda, n0, w);
  const zsf = selfFocusingDistance(ratio, zR);
  const zLens = focusedCollapseDistance(zsf, f);
  const collapses = Number.isFinite(zsf);

  const zHere = Number.isFinite(f) ? zLens : zsf;
  const curves = [
    ...collapseCurves(Pcr, zR, f, power),
    ...(Number.isFinite(zHere) ? [{ name: "This pulse", color: "#fbbf24", showPoints: true, points: [{ x: round6(power * 1e-6), y: round6(zHere * 1e3) }] }] : []),
  ];

  const lensNote = !Number.isFinite(f)
    ? ""
    : !collapses
      ? `Below P_cr the lens focuses the beam at the geometric focus depth ${fmtLength(f)}, but it doesn't collapse.`
      : Number.isFinite(zLens)
        ? `With the lens the collapse moves to ${fmtLength(zLens)}, before the geometric focus at depth ${fmtLength(f)}.`
        : "The diverging lens outruns the Kerr lens: no collapse.";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={lambdaRaw} onChange={setLambda} min={200} max={20000} step="any" />
        <ValidatedNumberInput label="Pulse energy (µJ)" value={energyRaw} onChange={setEnergy} min={0} max={1e7} step="any" />
        <ValidatedNumberInput label="Pulse duration, Gaussian FWHM (fs)" value={fwhmRaw} onChange={setFwhm} min={1} max={1e6} step="any" />
        <ValidatedNumberInput label="Beam radius at the entrance, 1/e² (µm)" value={waistRaw} onChange={setWaist} min={1} max={1e5} step="any" />
        <ValidatedNumberInput label="n₂ (×10⁻¹⁶ cm²/W)" value={n2Raw} onChange={setN2} min={1e-4} max={1e6} step="any" />
        <ValidatedNumberInput label="Linear index n₀" value={n0Raw} onChange={setN0} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Geometric focus depth in the medium (mm, n₀f for a lens at the entrance face; 0 = collimated)" value={lensRaw} onChange={setLens} min={-1e6} max={1e6} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <ResultCard label="Critical power P_cr" value={`${fmt(Pcr * 1e-6)} MW`} subtext={`3.77 λ²/(8π n₀ n₂); ${fmt(energyAtPcr * 1e6)} µJ at this duration`} tone="blue" />
        <ResultCard label="Peak power" value={`${fmt(power * 1e-6)} MW`} subtext={`0.9394 E/FWHM; P/P_cr = ${fmt(ratio)}`} tone={collapses ? "green" : "red"} />
        <ResultCard
          label="Collapse distance"
          value={collapses ? fmtLength(zHere) : "none"}
          subtext={collapses
            ? Number.isFinite(f) ? `collimated z_sf = ${fmtLength(zsf)}; 1/z′ = 1/z_sf + 1/f` : "Marburger, collimated beam"
            : "P ≤ P_cr: Kerr focusing only slows diffraction"}
          tone="purple"
        />
        <ResultCard label="Rayleigh range z_R" value={fmtLength(zR)} subtext="π n₀ w²/λ inside the medium" tone="cyan" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 leading-6 space-y-1">
        <p>Above the critical power the Kerr lens beats diffraction and a Gaussian beam self-focuses. A collimated beam
          collapses after z_sf = 0.367 z_R / √((√(P/P_cr) − 0.852)² − 0.0219), Dawes and Marburger&apos;s fit to numerical
          solutions. Near the collapse the intensity climbs until multiphoton ionisation makes a plasma that defocuses the
          beam and absorbs energy. The intensity then clamps, at about 5×10¹³ W/cm² in air (Kasparian et al.), and a
          filament forms. The filament&apos;s length and plasma density need a full propagation model; this page gives the
          threshold and where the filament starts. P uses the pulse&apos;s peak power, which self-focuses first. Far above
          P_cr, small irregularities in the beam make it break into several filaments.</p>
        {lensNote && <p className="text-yellow-400">{lensNote}</p>}
      </div>

      <SimpleLineChart title="Collapse distance against peak power" xLabel="Peak power (MW)" yLabel="Collapse distance (mm)" series={curves} xScale="log" yScale="log" />
    </>
  );
}
