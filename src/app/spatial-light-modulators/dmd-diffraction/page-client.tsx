"use client";

import { useMemo } from "react";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { TICK_FONT, niceTicks } from "../../../components/chart-axes";
import { useElementWidth } from "../../../hooks/use-element-width";
import { useURLState } from "../../../hooks/use-url-state";
import {
  type DmdOrder, type DmdSetup, type MirrorState,
  STEEP_ANGLE, STEEP_WARNING, blazedIncidences, dmdDiffraction, nearestBlazedIncidence, ordersNearBlaze,
} from "../../../physics/spatial-light-modulators/dmd-diffraction";

const DEG = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const fmt = (v: number, digits: number) => (Number.isFinite(v) ? (v + 0).toFixed(digits) : "—");
const deg = (rad: number, digits = 2) => `${fmt(rad / DEG, digits)}°`;

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-400 mr-1">{label}</span>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={`text-sm px-4 py-2 rounded ${value === v ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

const PAD = { left: 52, right: 16, top: 16, bottom: 44 };
/** Incidence range of the power sweep, in degrees. */
const SWEEP_DEG = 75;

/** Orders around the mirror reflection, plotted by output angle (x) and angle out of the tilt plane (y). */
function OrderMap({ orders, onAngle, nearest, fill }: { orders: DmdOrder[]; onAngle: number; nearest: DmdOrder | null; fill: number }) {
  const [ref, measured] = useElementWidth<HTMLDivElement>();
  const width = measured ?? 560;
  const height = Math.round(Math.min(width, 420));
  const plotW = width - PAD.left - PAD.right, plotH = height - PAD.top - PAD.bottom;
  // Equal degrees per pixel on both axes, the window set by the orders drawn.
  const spanY = Math.max(1, ...orders.map((o) => Math.abs(o.elevation / DEG))) * 1.08;
  const spanX = Math.max(1, ...orders.map((o) => Math.abs((o.outputAngle - onAngle) / DEG))) * 1.08;
  const scale = Math.min(plotW / (2 * spanX), plotH / (2 * spanY));
  const cx = PAD.left + plotW / 2, cy = PAD.top + plotH / 2, x0 = onAngle / DEG;
  const X = (d: number) => cx + (d - x0) * scale;
  const Y = (d: number) => cy - d * scale;
  const xTicks = niceTicks(x0 - plotW / 2 / scale, x0 + plotW / 2 / scale, Math.max(3, Math.floor(plotW / 80)), false);
  const yTicks = niceTicks(-plotH / 2 / scale, plotH / 2 / scale, Math.max(3, Math.floor(plotH / 60)), false);
  // Dot area follows the order's power; the largest dot is a little under half the order spacing.
  const spacing = Math.min(...orders.flatMap((a) => orders.filter((b) => b !== a).map((b) => Math.hypot(X(a.outputAngle / DEG) - X(b.outputAngle / DEG), Y(a.elevation / DEG) - Y(b.elevation / DEG)))));
  const rMax = Math.max(4, Math.min(18, 0.45 * (Number.isFinite(spacing) ? spacing : 40)));
  const labelled = [...orders].sort((a, b) => b.efficiency - a.efficiency).slice(0, 3);
  const inX = (d: number) => X(d) >= PAD.left && X(d) <= width - PAD.right;
  const inY = (d: number) => Y(d) >= PAD.top && Y(d) <= height - PAD.bottom;
  const label = `Diffraction orders around the mirror reflection at ${fmt(x0, 2)} degrees. Strongest: ${labelled
    .map((o) => `order (${o.mx}, ${o.my}) at ${fmt(o.outputAngle / DEG, 2)} degrees with ${fmt(o.efficiency * 100, 1)} percent`).join("; ")}.`;
  return (
    <div ref={ref}>
      <svg width={width} height={height} role="img" aria-label={label} className="block">
        <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} fill="#030712" stroke="#374151" />
        {xTicks.filter(inX).map((t) => (
          <g key={`x${t}`}>
            <line x1={X(t)} x2={X(t)} y1={PAD.top} y2={height - PAD.bottom} stroke="#1f2937" />
            <text x={X(t)} y={height - PAD.bottom + 16} fill="#9ca3af" fontSize={TICK_FONT} textAnchor="middle">{fmt(t, Math.abs(t % 1) > 1e-9 ? 1 : 0)}</text>
          </g>
        ))}
        {yTicks.filter(inY).map((t) => (
          <g key={`y${t}`}>
            <line x1={PAD.left} x2={width - PAD.right} y1={Y(t)} y2={Y(t)} stroke="#1f2937" />
            <text x={PAD.left - 6} y={Y(t) + 4} fill="#9ca3af" fontSize={TICK_FONT} textAnchor="end">{fmt(t, Math.abs(t % 1) > 1e-9 ? 1 : 0)}</text>
          </g>
        ))}
        <text x={PAD.left + plotW / 2} y={height - 8} fill="#d1d5db" fontSize={12} textAnchor="middle">Output angle in the tilt plane θo (°)</text>
        <text x={14} y={PAD.top + plotH / 2} fill="#d1d5db" fontSize={12} textAnchor="middle" transform={`rotate(-90 14 ${PAD.top + plotH / 2})`}>Out of the tilt plane (°)</text>
        {orders.map((o) => {
          const x = X(o.outputAngle / DEG), y = Y(o.elevation / DEG);
          if (!inX(o.outputAngle / DEG) || !inY(o.elevation / DEG)) return null;
          const best = nearest && o.mx === nearest.mx && o.my === nearest.my;
          return (
            <g key={`${o.mx},${o.my}`}>
              <circle cx={x} cy={y} r={2} fill="#4b5563" />
              {o.efficiency > 1e-4 && <circle cx={x} cy={y} r={rMax * Math.sqrt(o.efficiency / (fill * fill))} fill={best ? "#34d399" : "#60a5fa"} fillOpacity={0.75} />}
            </g>
          );
        })}
        {labelled.filter((o) => inX(o.outputAngle / DEG) && inY(o.elevation / DEG)).map((o) => {
          const x = X(o.outputAngle / DEG), left = x > width - PAD.right - 110;
          return (
            <text key={`l${o.mx},${o.my}`} x={left ? x - rMax * 0.75 - 3 : x + rMax * 0.75 + 3} y={Y(o.elevation / DEG) - rMax * 0.75 - 2}
              fill="#e5e7eb" fontSize={11} textAnchor={left ? "end" : "start"}>
              ({o.mx}, {o.my}) {fmt(o.efficiency * 100, 1)}%
            </text>
          );
        })}
        <g stroke="#fbbf24" strokeWidth={2}>
          <line x1={cx - 7} x2={cx + 7} y1={cy} y2={cy} />
          <line x1={cx} x2={cx} y1={cy - 7} y2={cy + 7} />
        </g>
      </svg>
    </div>
  );
}

export default function DmdDiffractionPage() {
  const [stateIn, setState] = useURLState("state", "on");
  const [pitchIn, setPitch] = useURLState("pitch", 7.56);
  const [tiltIn, setTilt] = useURLState("tilt", 12);
  const [wavelengthIn, setWavelength] = useURLState("wavelength", 465);
  const [incidenceIn, setIncidence] = useURLState("incidence", 45.2);
  const [fillIn, setFill] = useURLState("fillFactor", 0.92);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const state: MirrorState = stateIn === "off" ? "off" : "on";
  const pitch = clamp(pitchIn, 1, 50) * 1e-6;
  const tilt = clamp(tiltIn, 1, 30) * DEG;
  const lambda = clamp(wavelengthIn, 200, 5000) * 1e-9;
  const incidence = clamp(incidenceIn, -89, 89) * DEG;
  const fill = clamp(fillIn, 0.05, 1);
  const setup: DmdSetup = useMemo(() => ({ pitch, tilt, lambda, incidence, fillFactor: fill, state }), [pitch, tilt, lambda, incidence, fill, state]);

  const result = useMemo(() => dmdDiffraction(setup), [setup]);
  const orders = useMemo(() => ordersNearBlaze(setup, 3), [setup]);
  const blazed = useMemo(() => blazedIncidences(lambda, pitch, tilt, state), [lambda, pitch, tilt, state]);
  const best = nearestBlazedIncidence(blazed, incidence);
  const sweep = useMemo(() => {
    const points: { x: number; y: number | null }[] = [];
    // ±75°: beyond 60° the power estimate is unreliable anyway, and a span ≤ 150° keeps several ticks on a phone axis.
    for (let t = -SWEEP_DEG; t <= SWEEP_DEG + 1e-4; t += 0.25) {
      const r = dmdDiffraction({ pitch, tilt, lambda, incidence: t * DEG, fillFactor: fill, state });
      points.push({ x: t, y: r.nearest ? r.nearest.efficiency * 100 : null });
    }
    return points;
  }, [pitch, tilt, lambda, fill, state]);
  const n = result.nearest;
  const sign = state === "on" ? "−" : "+";

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>orders in the tilt plane (n, −n): sin θ<sub>i</sub> − sin θ<sub>o</sub> = n√2 λ/d</p>
        <p>blaze (mirror reflection): θ<sub>o</sub> = θ<sub>i</sub> ∓ 2γ &nbsp;⇒&nbsp; θ<sub>i</sub> = ±γ ± acos(nλ/(√2 d sin γ))</p>
        <p>power in an order: η = F² sinc²(kw/2 ê<sub>u</sub>·(â − b̂)) sinc²(kw/2 ê<sub>v</sub>·(â − b̂)), w = √F d</p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
        <Toggle label="Mirrors" value={state} options={[["on", "On (+γ)"], ["off", "Off (−γ)"]]} onChange={setState} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <ValidatedNumberInput label="Micromirror pitch d (µm)" value={pitchIn} onChange={setPitch} min={1} max={50} step="0.01" />
        <ValidatedNumberInput label="Mirror tilt γ (°)" value={tiltIn} onChange={setTilt} min={1} max={30} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthIn} onChange={setWavelength} min={200} max={5000} step="1" />
        <InputSlider label="Incidence angle θi" value={incidenceIn} onChange={setIncidence} min={-89} max={89} step={0.01} unit="°" />
        <ValidatedNumberInput label="Fill factor F" value={fillIn} onChange={setFill} min={0.05} max={1} step="0.01" />
      </div>
      <p className="text-xs text-gray-500 mb-6">
        Angles are in the plane the mirrors tilt in (the plane of the pixel diagonal and the normal), measured from the DMD
        normal. The output angle is positive on the far side of the normal from the source, as in the law of reflection,
        so a flat mirror sends light to θo = θi. TI DMDs with diagonal hinges tilt ±12° (some ±14.5°). For F, TI quotes on-state fill factors of 92–97 %: a ray-traced
        power fraction, used here as the area fraction of the mirror.
      </p>

      {result.reason && <p className="text-sm text-red-400 mb-4" role="alert">{result.reason}</p>}
      {n && (Math.abs(incidence) > STEEP_ANGLE || Math.abs(n.outputAngle) > STEEP_ANGLE) &&
        <p className="text-sm text-amber-400 mb-4">{STEEP_WARNING}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Mirror reflection (on direction)" value={deg(result.onAngle)}
          subtext={`θi ${sign} 2γ; order number ${fmt(result.blazeOrder, 3)} (whole: blazed, n + ½: anti-blazed)`} />
        <ResultCard label="Nearest order" tone="green" value={n ? `(${n.mx}, ${n.my}) at ${deg(n.outputAngle)}` : "—"}
          subtext={n ? `${deg(n.deviation)} from the mirror reflection${Math.abs(n.elevation) > 1e-9 ? `; ${deg(n.elevation)} out of the tilt plane` : ""}` : result.reason} />
        <ResultCard label="Power in that order" tone="yellow" value={n ? `${fmt(n.efficiency * 100, 1)} %` : "—"}
          subtext={n ? `F² = ${fmt(fill * fill * 100, 1)} % × mirror envelope ${fmt(n.envelope, 3)}` : result.reason} />
        <ResultCard label="Nearest blazed incidence" tone="purple" value={best ? deg(best.incidence) : "—"}
          subtext={best
            ? `order (${best.order}, ${-best.order}) leaves at ${deg(best.output)}`
            : "No order can be blazed at this wavelength with both beams inside ±90°: nλ/(√2 d sin γ) must lie between sin γ and 1."} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
          <h3 className="text-sm text-gray-400 mb-3">Orders around the mirror reflection (+)</h3>
          {orders.length > 0 && Number.isFinite(result.onAngle)
            ? <OrderMap orders={orders} onAngle={result.onAngle} nearest={n} fill={fill} />
            : <p className="text-sm text-gray-400">{result.reason}</p>}
          <p className="text-xs text-gray-500 mt-2">Dot area is proportional to the power in the order; green is the order nearest the mirror reflection. The grey dots are orders with less than 0.01 %.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
          <SimpleLineChart bare title="Power in the order nearest the mirror reflection" xLabel="Incidence angle θi (°)" yLabel="Power (%)"
            series={[
              { name: "Nearest order", color: "#34d399", points: sweep },
              ...(Math.abs(incidence / DEG) <= SWEEP_DEG
                ? [{ name: "Your incidence", color: "#fbbf24", dashed: true, points: [{ x: incidence / DEG, y: 0 }, { x: incidence / DEG, y: fill * fill * 100 }] }]
                : []),
            ]} />
          <p className="text-xs text-gray-500 mt-2">Peaks reach F² (the normal-incidence array value) where an order is blazed exactly; the dips between them are the
            anti-blaze angles. Far off normal the absolute power is uncertain by about ±10 %. Incidence shown within ±{SWEEP_DEG}°.</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-sm text-gray-400 mb-3">Incidence angles that blaze an order at {fmt(lambda * 1e9, 0)} nm ({state === "on" ? "on" : "off"}-state mirrors)</h3>
        {blazed.length > 0 ? (
          <table className="text-sm text-gray-300">
            <thead>
              <tr className="text-left text-gray-400"><th className="pr-6 font-normal">Order</th><th className="pr-6 font-normal">Incidence θi</th><th className="font-normal">Output θo</th></tr>
            </thead>
            <tbody>
              {blazed.map((b) => (
                <tr key={`${b.order}${b.incidence}`} className={best === b ? "text-green-400" : undefined}>
                  <td className="pr-6">({b.order}, {-b.order})</td><td className="pr-6">{deg(b.incidence)}</td><td>{deg(b.output)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">No order can be blazed at this wavelength with both beams inside ±90°: nλ/(√2 d sin γ) must lie between sin γ and 1.</p>
        )}
        <p className="text-xs text-gray-500 mt-2">Swapping source and output (reciprocity) gives the second angle of each pair.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <p>
          <strong>Worked example (Brown et al. 2021, Table 1).</strong> A DMD with d = 7.56 µm and γ = 12° (the defaults) at
          465 nm and θi = 45.20° puts order (4, −4) on the blaze at 21.20°. At 635 nm and 45.89°, order (3, −3) leaves at
          21.20°, 0.69° from the blaze. With off-state mirrors, 532 nm at −2.09° puts order (−4, 4) at 21.20°, 0.71° from
          the blaze. The calculator gives the same orders and angles.
        </p>
        <p>
          <strong>Limits.</strong> The order angles are exact for a plane wave on a regular array. The power is a scalar
          estimate. It uses one flat square mirror (side √F·d) on an infinite array with every mirror in the same state,
          and the light must arrive in the tilt plane. It leaves out polarization, the window and mirror-coating losses
          (TI DLPA083B budgets them for projection), shadowing between mirrors, the hinge and via structure, mirror
          curvature and a finite beam. The peak power F² is the flat-array value at normal incidence; off normal the
          scalar model is good to about ±10 %, and beyond 60° the orders together can add up to more than 100 % (no
          shadowing), so the page warns there. The nearest order is searched next to the mirror reflection only. The model
          covers diagonal-hinge pixels that tilt ±γ about one axis, not TI&apos;s tilt-and-roll pixels (e.g. ±17° parts).
        </p>
      </div>
    </>
  );
}
