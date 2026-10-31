"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  coneSolidAngle, jacquinotRatio, mirrorRimHalfAngle, projectedSolidAngle, slitResolvingPower,
} from "../../../physics/spectroscopy/throughput";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1e6) / 1e6 : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const DEG = Math.PI / 180;

export default function ConcMirrorPage() {
  const [rRaw, setRadius] = useURLState("radius", 50); // mm, radius of curvature
  const [dRaw, setMirrorDiam] = useURLState("mirrorDiam", 25); // mm
  const [wRaw, setSlitWidth] = useURLState("slitWidth", 50); // µm
  const [hRaw, setSlitHeight] = useURLState("slitHeight", 1); // mm
  const [thRaw, setLittrowAngle] = useURLState("littrowAngle", 30); // deg

  const Rc = clamp(rRaw, 5, 5000, 50);
  const D = clamp(dRaw, 1, 1000, 25);
  const w = clamp(wRaw, 1, 5000, 50);
  const h = clamp(hRaw, 0.01, 100, 1);
  const theta = clamp(thRaw, 1, 85, 30) * DEG;

  const f = Rc / 2; // mm
  const alpha = mirrorRimHalfAngle(Rc, D);
  const omega = coneSolidAngle(alpha);
  const smallAngle = (Math.PI * (D / 2) ** 2) / f ** 2; // π(D/2)²/f², the paraxial estimate
  const etendue = (w * 1e-3) * h * projectedSolidAngle(alpha); // mm²·sr: slit area × π sin²α
  const R = slitResolvingPower(f * 1e3, w, theta, theta); // f in µm, w in µm
  const ratio = jacquinotRatio(f, h, theta, theta);

  const chart = (() => {
    // f-number N = f/D around the current value (so the marker is on the curve), at the current radius of curvature.
    const nNow = f / D;
    const nLo = Math.max(0.3, nNow / 3);
    const nHi = Math.max(3 * nNow, nNow + 2);
    const ns = Array.from({ length: 121 }, (_, i) => nLo * (nHi / nLo) ** (i / 120));
    const at = (N: number) => mirrorRimHalfAngle(Rc, f / N);
    const line = (y: number[], name: string, color: string, dash?: string) =>
      ({ x: ns.map(r6), y: y.map(r6), type: "scatter", mode: "lines", name, line: { color, width: 2, ...(dash ? { dash } : {}) } });
    return [
      line(ns.map((N) => Math.PI / (4 * N * N)), "Paraxial π/(4N²)", "#f87171", "dash"),
      line(ns.map((N) => coneSolidAngle(at(N))), "Exact cone Ω (to the rim)", "#60a5fa"),
      line(ns.map((N) => projectedSolidAngle(at(N))), "Projected π sin²α (étendue per area)", "#34d399"),
      { x: [r6(f / D)], y: [r6(omega)], type: "scatter", mode: "markers", name: "Current", line: { color: "#fbbf24" }, marker: { color: "#fbbf24", size: 10 } },
    ];
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <ValidatedNumberInput label="Radius of Curvature (mm)" value={rRaw} onChange={setRadius} min={5} max={5000} />
        <ValidatedNumberInput label="Mirror Diameter (mm)" value={dRaw} onChange={setMirrorDiam} min={1} max={1000} />
        <ValidatedNumberInput label="Slit Width (µm)" value={wRaw} onChange={setSlitWidth} min={1} max={5000} />
        <ValidatedNumberInput label="Slit Height (mm)" value={hRaw} onChange={setSlitHeight} min={0.01} max={100} step="0.1" />
        <ValidatedNumberInput label="Grating Littrow Angle θ (°)" value={thRaw} onChange={setLittrowAngle} min={1} max={85} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Focal Length f = R/2" value={`${fmt(f)} mm`} tone="blue" subtext={`f/${fmt(f / D, 3)}`} />
        <ResultCard label="Rim Half-Angle α" value={Number.isFinite(alpha) ? `${fmt(alpha / DEG)}°` : "—"} tone="purple"
          subtext={Number.isFinite(alpha) ? `NA = sin α = ${fmt(Math.sin(alpha))}; includes the mirror sag` : "the rim reaches the focal plane: D must be < √3 R"} />
        <ResultCard label="Solid Angle Ω = 2π(1 − cos α)" value={`${fmt(omega)} sr`} tone="green"
          subtext={Number.isFinite(omega) ? `paraxial π(D/2f)² = ${fmt(smallAngle)} sr (${fmt(100 * (smallAngle / omega - 1), 3)} % off)` : undefined} />
        <ResultCard label="Slit Étendue w·h·π sin²α" value={`${fmt(etendue)} mm²·sr`} tone="cyan" subtext="Lambertian slit, mirror filled" />
        <ResultCard label="Slit-Limited Resolving Power" value={fmt(R)} tone="orange" subtext="R = 2f tan θ/w (Littrow)" />
        <ResultCard label="Jacquinot Advantage" value={`${fmt(ratio)}×`} tone="yellow"
          subtext={`FTS of the same mirror area and R: π f/(h tan θ); 2πf/h = ${fmt((2 * Math.PI * f) / h)}`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chart} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "f-number N = f/D", gridcolor: "#374151", type: "log" },
          yaxis: { title: "Solid Angle (sr)", gridcolor: "#374151", type: "log" },
          margin: { t: 30, r: 30, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
        }} />
      </div>
    </>
  );
}
