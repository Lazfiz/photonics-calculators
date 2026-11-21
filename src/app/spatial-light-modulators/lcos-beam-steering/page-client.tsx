"use client";

import { useMemo } from "react";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { TICK_FONT } from "../../../components/chart-axes";
import { useElementWidth } from "../../../hooks/use-element-width";
import { useURLState } from "../../../hooks/use-url-state";
import { pixelEnvelope } from "../../../physics/imaging/holography";
import {
  type GapModel, gapOrderEfficiency, lcosSteering, rampOrderEfficiency,
} from "../../../physics/spatial-light-modulators/lcos-steering";

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const fmt = (v: number, digits: number) => (Number.isFinite(v) ? (v + 0).toFixed(digits) : "—");
const pct = (v: number, digits = 2) => (Number.isFinite(v) ? `${fmt(v * 100, digits)} %` : "—");
const deg = (rad: number, digits = 3) => (Number.isFinite(rad) ? `${fmt((rad * 180) / Math.PI, digits)}°` : "—");

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

const PAD = { left: 52, right: 12, top: 12, bottom: 42 };
const HEIGHT = 260;

/** A plot frame of the container's width; x and y map [0, 1] fractions to pixels. */
function useFrame() {
  const [ref, measured] = useElementWidth<HTMLDivElement>();
  const width = Math.min(measured ?? 420, 560);
  const w = width - PAD.left - PAD.right, h = HEIGHT - PAD.top - PAD.bottom;
  return { ref, width, w, h, x: (f: number) => PAD.left + f * w, y: (f: number) => PAD.top + (1 - f) * h };
}

function Frame({ w, h, x, y, xTicks, yTicks, xLabel, yLabel }: {
  w: number; h: number; x: (f: number) => number; y: (f: number) => number;
  xTicks: [number, string][]; yTicks: [number, string][]; xLabel: string; yLabel: string;
}) {
  return (
    <>
      <rect x={PAD.left} y={PAD.top} width={w} height={h} fill="#030712" stroke="#374151" />
      {xTicks.map(([f, t]) => (
        <g key={`x${t}`}>
          <line x1={x(f)} x2={x(f)} y1={PAD.top} y2={PAD.top + h} stroke="#1f2937" />
          <text x={x(f)} y={PAD.top + h + 16} fill="#9ca3af" fontSize={TICK_FONT} textAnchor="middle">{t}</text>
        </g>
      ))}
      {yTicks.map(([f, t]) => (
        <g key={`y${t}`}>
          <line x1={PAD.left} x2={PAD.left + w} y1={y(f)} y2={y(f)} stroke="#1f2937" />
          <text x={PAD.left - 6} y={y(f) + 4} fill="#9ca3af" fontSize={TICK_FONT} textAnchor="end">{t}</text>
        </g>
      ))}
      <text x={PAD.left + w / 2} y={HEIGHT - 6} fill="#d1d5db" fontSize={12} textAnchor="middle">{xLabel}</text>
      <text x={14} y={PAD.top + h / 2} fill="#d1d5db" fontSize={12} textAnchor="middle" transform={`rotate(-90 14 ${PAD.top + h / 2})`}>{yLabel}</text>
    </>
  );
}

const NU = 1.5; // the order map spans ν = −1.5 … 1.5 cycles per pixel
const LOG_FLOOR = 1e-4;

/** Far-field orders along the steering axis on a log power scale, with the pixel envelope F² sinc²(π√F ν). */
function OrderMap({ N, F, gap, blazed, nuMax }: { N: number; F: number; gap: GapModel; blazed: boolean; nuMax: number }) {
  const { ref, width, w, h, x, y } = useFrame();
  const X = (nu: number) => x((nu + NU) / (2 * NU));
  const Y = (p: number) => y((Math.log10(Math.max(p, LOG_FLOOR)) - Math.log10(LOG_FLOOR)) / -Math.log10(LOG_FLOOR));
  const envelope = Array.from({ length: 301 }, (_, i) => -NU + (2 * NU * i) / 300)
    .map((nu, i) => `${i ? "L" : "M"}${X(nu).toFixed(1)} ${Y(F ** 2 * pixelEnvelope(nu, 1, F)).toFixed(1)}`).join("");
  // Only propagating orders (|ν| ≤ d/λ) are drawn.
  const shown = (nu: number) => Math.abs(nu) <= Math.min(NU, nuMax);
  const ramp = blazed ? [-2, -1, 0, 1].map((k) => ({ k, nu: k + 1 / N, p: rampOrderEfficiency(N, F, k) })).filter((o) => shown(o.nu)) : [];
  const grid = blazed && gap === "mirror" ? [-1, 0, 1].map((k) => ({ k, nu: k, p: gapOrderEfficiency(F, k) })).filter((o) => shown(o.nu)) : [];
  const steered = ramp.find((o) => o.k === 0);
  const label = blazed
    ? `Far-field orders: the steered order at ${fmt(1 / N, 3)} cycles per pixel carries ${pct(steered?.p ?? NaN)}; the alias at ${fmt(1 / N - 1, 3)} carries ${pct(ramp.find((o) => o.k === -1)?.p ?? NaN)}.`
    : "Far-field orders: not drawn, the phase stroke is below 2π.";
  const yTicks: [number, string][] = [[1e-4, "0.01%"], [1e-3, "0.1%"], [1e-2, "1%"], [0.1, "10%"], [1, "100%"]]
    .map(([p, t]) => [(Math.log10(p as number) + 4) / 4, t as string]);
  return (
    <div ref={ref}>
      <svg width={width} height={HEIGHT} role="img" aria-label={label} className="block">
        <Frame w={w} h={h} x={x} y={y} xLabel="ν = d sin θ/λ (cycles per pixel)" yLabel="Power (log)"
          xTicks={[-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map((nu) => [(nu + NU) / (2 * NU), fmt(nu, 1)])} yTicks={yTicks} />
        <path d={envelope} fill="none" stroke="#6b7280" strokeDasharray="4 4" />
        {grid.map((o) => (
          <g key={`g${o.k}`}>
            <line x1={X(o.nu)} x2={X(o.nu)} y1={Y(LOG_FLOOR)} y2={Y(o.p)} stroke="#f87171" strokeWidth={3} />
            <circle cx={X(o.nu)} cy={Y(o.p)} r={4} fill="#f87171" />
          </g>
        ))}
        {ramp.map((o) => (
          <g key={`r${o.k}`}>
            <line x1={X(o.nu)} x2={X(o.nu)} y1={Y(LOG_FLOOR)} y2={Y(o.p)} stroke={o.k === 0 ? "#34d399" : "#60a5fa"} strokeWidth={3} />
            <circle cx={X(o.nu)} cy={Y(o.p)} r={4} fill={o.k === 0 ? "#34d399" : "#60a5fa"} />
            {(o.k === 0 || o.k === -1) && o.p > LOG_FLOOR && (
              <text x={X(o.nu)} y={Y(o.p) - 8} fill="#e5e7eb" fontSize={11} textAnchor="middle">{fmt(o.p * 100, 1)}%</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

const N_MIN = 2, N_MAX = 1000;
const logN = (N: number) => Math.log10(N / N_MIN) / Math.log10(N_MAX / N_MIN);

/** Steered power against the period: with fill F, at F = 100 %, and over the unpatterned zero order. */
function EfficiencyCurve({ N, F, eta, absorbing, blazed }: { N: number; F: number; eta: number; absorbing: boolean; blazed: boolean }) {
  const { ref, width, w, h, x, y } = useFrame();
  const Ns = Array.from({ length: 121 }, (_, i) => N_MIN * (N_MAX / N_MIN) ** (i / 120));
  const line = (f: (n: number) => number) => Ns.map((n, i) => `${i ? "L" : "M"}${x(logN(n)).toFixed(1)} ${y(f(n)).toFixed(1)}`).join("");
  const label = `Steered power against the grating period from 2 to 1000 pixels; at N = ${fmt(N, 1)} it is ${pct(eta)} of the incident power.`;
  return (
    <div ref={ref}>
      <svg width={width} height={HEIGHT} role="img" aria-label={label} className="block" opacity={blazed ? 1 : 0.35}>
        <Frame w={w} h={h} x={x} y={y} xLabel="Grating period N (pixels, log)" yLabel="Steered power"
          xTicks={[2, 5, 10, 20, 50, 100, 200, 500, 1000].map((n) => [logN(n), String(n)])}
          yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => [f, `${f * 100}%`])} />
        <path d={line((n) => rampOrderEfficiency(n, 1, 0))} fill="none" stroke="#6b7280" strokeDasharray="4 4" strokeWidth={1.5} />
        {absorbing && <path d={line((n) => rampOrderEfficiency(n, F, 0) / F ** 2)} fill="none" stroke="#a78bfa" strokeDasharray="1 3" strokeWidth={2} />}
        <path d={line((n) => rampOrderEfficiency(n, F, 0))} fill="none" stroke="#34d399" strokeWidth={2} />
        {Number.isFinite(eta) && <circle cx={x(logN(N))} cy={y(eta)} r={5} fill="#fbbf24" />}
      </svg>
    </div>
  );
}

export default function LcosBeamSteeringPage() {
  const [gapIn, setGap] = useURLState("gap", "absorbing");
  const [wavelengthIn, setWavelength] = useURLState("wavelength", 633);
  const [pitchIn, setPitch] = useURLState("pitch", 12.5);
  const [periodIn, setPeriod] = useURLState("period", 4);
  const [fillIn, setFill] = useURLState("fill", 96.8);
  const [deltaNIn, setDeltaN] = useURLState("deltaN", 0.2);
  const [thicknessIn, setThickness] = useURLState("thickness", 2.5);
  const [focalIn, setFocal] = useURLState("focal", 200);
  const [pixelsIn, setPixels] = useURLState("pixels", 1272);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const gap: GapModel = gapIn === "mirror" ? "mirror" : "absorbing";
  const lambda = clamp(wavelengthIn, 200, 2500) * 1e-9;
  const pitch = clamp(pitchIn, 1, 50) * 1e-6;
  const N = clamp(periodIn, N_MIN, N_MAX);
  const F = clamp(fillIn, 10, 100) / 100;
  const deltaN = clamp(deltaNIn, 0.01, 0.5);
  const thickness = clamp(thicknessIn, 0.5, 20) * 1e-6;
  const focal = clamp(focalIn, 1, 5000) * 1e-3;
  const pixels = Math.round(clamp(pixelsIn, 16, 8192));

  const r = useMemo(() => lcosSteering({ lambda, pitch, period: N, fillFactor: F, gap, deltaN, thickness, focal, pixels }),
    [lambda, pitch, N, F, gap, deltaN, thickness, focal, pixels]);
  const short = r.reaches2Pi ? "" : "stroke below 2π";

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>sin θ = λ/(N d); orders at ν = k + 1/N cycles per pixel, power F² sinc²(π√F (k + 1/N))</p>
        <p>steered (k = 0): F² sinc²(π√F/N) → sinc²(π/N) at F = 1, → F² for long periods</p>
        <p>reflective cell: δ = 4π Δn t/λ; 2π needs t = λ/(2Δn)</p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
        <Toggle label="Gaps between pixels" value={gap} options={[["absorbing", "Reflect nothing"], ["mirror", "Reflect, unmodulated"]]} onChange={setGap} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <ValidatedNumberInput label="Grating period N (pixels)" value={periodIn} onChange={setPeriod} min={2} max={1000} step="0.1" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthIn} onChange={setWavelength} min={200} max={2500} step="1" />
        <ValidatedNumberInput label="Pixel pitch d (µm)" value={pitchIn} onChange={setPitch} min={1} max={50} step="0.01" />
        <ValidatedNumberInput label="Area fill factor F (%)" value={fillIn} onChange={setFill} min={10} max={100} step="0.1" />
        <ValidatedNumberInput label="Birefringence Δn at λ" value={deltaNIn} onChange={setDeltaN} min={0.01} max={0.5} step="0.01" />
        <ValidatedNumberInput label="Liquid-crystal thickness t (µm)" value={thicknessIn} onChange={setThickness} min={0.5} max={20} step="0.01" />
        <ValidatedNumberInput label="Fourier lens focal length (mm)" value={focalIn} onChange={setFocal} min={1} max={5000} step="1" />
        <ValidatedNumberInput label="Pixels across the steering direction" value={pixelsIn} onChange={setPixels} min={16} max={8192} step="1" />
      </div>
      <p className="text-xs text-gray-500 mb-6">
        The defaults are Hamamatsu&apos;s X15213 (1272 × 1024 pixels, 12.5 µm pitch, fill factor 96.8 %) at 633 nm with the
        4-level grating of its application note. Δn and t are illustrative: enter your cell&apos;s. Zhang et al. give 0.05 to
        0.45 as the range of Δn for liquid crystals.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Steering angle" tone="green" value={deg(r.angle)}
          subtext={`${Number.isFinite(r.angle) ? "" : "evanescent: λ/(N d) > 1, so the first order doesn't leave the SLM; "}period ${fmt(r.periodLength * 1e6, 2)} µm, ${fmt(r.gratingFrequency / 1e3, 2)} lp/mm; at most ${deg(r.maxAngle)} (N = 2)`} />
        <ResultCard label="Steered power" tone="green" value={pct(r.efficiency)}
          subtext={!Number.isFinite(r.angle) ? "none: the steered order is evanescent" : short || `of the incident power; ${gap === "absorbing" ? `${pct(r.relativeEfficiency)} of the unpatterned zero order. ` : ""}Pixelation sinc²(π/N) ${pct(r.pixelation)}; F² ${pct(r.fillLimit)}`} />
        <ResultCard label="Alias order (other side)" tone="yellow" value={pct(r.aliasEfficiency)}
          subtext={Number.isFinite(r.aliasAngle) ? `at ${deg(r.aliasAngle)}${short ? `; ${short}` : ""}` : "none: λ(1 − 1/N)/d > 1, so the alias order is evanescent"} />
        <ResultCard label="Zero order" value={pct(r.zeroOrder, 3)}
          subtext={short || (gap === "absorbing" ? "none: non-reflective gaps and a 2π ramp leave nothing undeflected" : "(1 − F)² from the unmodulated gaps")} />
        <ResultCard label="Phase stroke at λ" tone="purple" value={`${fmt(r.stroke / (2 * Math.PI), 3)} waves`}
          subtext={`2π needs t = ${fmt(r.thickness2Pi * 1e6, 3)} µm; this cell reaches 2π up to ${fmt(r.maxWavelength * 1e9, 0)} nm`} />
        <ResultCard label="Focal plane" value={`${fmt(r.spotShift * 1e3, 3)} mm`}
          subtext={`spot shift f tan θ (ideal lens); paraxial replay field λf/d ${fmt(r.replayField * 1e3, 2)} mm; spot λf/(M d) ${fmt(r.spotSize * 1e6, 2)} µm`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
          <h3 className="text-sm text-gray-400 mb-3">Far-field orders along the steering direction</h3>
          <OrderMap N={N} F={F} gap={gap} blazed={r.reaches2Pi} nuMax={pitch / lambda} />
          <p className="text-xs text-gray-500 mt-2">
            Green: the steered order; blue: its aliases, a whole number of pixel-grid orders away{gap === "mirror" ? "; red: orders of the unmodulated gaps, the zero order (1 − F)² among them" : ""}.
            The dashed line is the pixel envelope F² sinc²(π√F ν) the ramp orders sit on. Only orders that propagate
            (|ν| ≤ d/λ) are drawn; 1 cycle per pixel is {lambda < pitch ? `sin θ = λ/d, ${deg(Math.asin(lambda / pitch), 2)} here` : "evanescent here (λ ≥ d)"}.
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
          <h3 className="text-sm text-gray-400 mb-3">Steered power against the grating period</h3>
          <EfficiencyCurve N={N} F={F} eta={r.efficiency} absorbing={gap === "absorbing"} blazed={r.reaches2Pi} />
          <p className="text-xs text-gray-500 mt-2">
            Green: fraction of the incident power at this fill factor. Dashed grey: F = 100 %, sinc²(π/N).
            {gap === "absorbing" ? " Dotted violet: over the unpatterned zero order, as datasheets quote it." : ""} Amber: this period.
            {r.reaches2Pi ? "" : " Greyed out: the stroke is below 2π, so these curves don't apply."}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <p>
          <strong>Worked example (Hamamatsu X15213, Cat. No. LLAP3012E05).</strong> The note shows a 2-level grating at
          40 lp/mm and a 4-level grating at 20 lp/mm on its 12.5 µm pixels, so N = 2 and N = 4: the calculator gives 40.00
          and 20.00 lp/mm. At 633 nm the 4-pixel grating steers 0.725°. Hamamatsu quotes efficiency against the zero order
          with no pattern; with non-reflective gaps that ratio is sinc²(π√F/N) = 81.6 % (81.1 % at F = 100 %), and with
          lossless mirrors the fraction of the incident power is 76.5 %. The note gives the X15213-01 a light utilization
          efficiency (the unpatterned zero order over the input) of 76 % typical, so about 0.76 × 81.6 % ≈ 62 % of the input
          reaches the steered order. The note plots measured efficiencies next to a theoretical curve but prints no values,
          so none are compared here.
        </p>
        <p>
          <strong>Fill factor (Naber et al. 2016; Shane et al. 2019).</strong> For a PLUTO SLM with 87 % fill factor Naber
          et al. give a theoretical efficiency of (fill factor)² = 76 %, and found about that. Set F = 87 % and N = 1000:
          the calculator gives 75.7 %. Shane et al. state the same F² law for flat mirrors with non-reflective gaps.
        </p>
        <p>
          <strong>Phase stroke (Zhang, You and Chu 2014).</strong> Light crosses a reflective cell twice, so it retards by
          δ = 2πΔn·2t/λ (Eq. 3) and needs t = λ/(2Δn) for 2π (Eq. 4): 1.58 µm at 633 nm for Δn = 0.2. A thicker cell reaches
          2π at longer wavelengths but responds more slowly (response time grows as t²).
        </p>
        <p>
          <strong>Limits.</strong> Scalar Fraunhofer diffraction of a plane wave at normal incidence, polarised along the
          liquid-crystal director, on lossless flat square pixels (reflectance 1; multiply by the device&apos;s own
          reflectance and window losses) whose phase is exactly the ramp&apos;s (a lookup table calibrated to
          2π, enough grey levels). <strong>Fringing fields are left out:</strong> the liquid crystal near a pixel edge
          follows its neighbours, which Shane et al. describe as a low-pass filter that costs most at short periods. No
          verified closed-form model of that loss was found, so measured efficiencies at small N fall below these. With a
          stroke under 2π the ramp can&apos;t be wrapped at 2π and no efficiencies are given. Unmodulated gaps are drawn
          after Improso et al.&apos;s dead-area model; the (1 − F)² zero order and the gap orders follow from it (derived
          here). Δn is taken at λ and held fixed, so the longest wavelength for 2π ignores dispersion.
        </p>
      </div>
    </>
  );
}
