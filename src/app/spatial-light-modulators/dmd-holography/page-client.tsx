"use client";

import { useMemo } from "react";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { TICK_FONT } from "../../../components/chart-axes";
import { useElementWidth } from "../../../hooks/use-element-width";
import { useURLState } from "../../../hooks/use-url-state";
import {
  type Field, type HologramMethod,
  SUPERPIXEL_ENUMERATED, dmdHologram, leeFields, leeOrderPower, superpixelFields,
} from "../../../physics/spatial-light-modulators/dmd-holography";

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const whole = (v: number, lo: number, hi: number) => Math.round(clamp(v, lo, hi));
const fmt = (v: number, digits: number) => (Number.isFinite(v) ? (v + 0).toFixed(digits) : "—");
const count = (v: number) => (Number.isFinite(v) ? Math.round(v).toLocaleString("en-US") : "—");

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

const PAD = { left: 48, right: 12, top: 12, bottom: 42 };

/** A square plot with equal scales, from −half to +half on both axes. */
function useSquare(half: number) {
  const [ref, measured] = useElementWidth<HTMLDivElement>();
  const width = Math.min(measured ?? 420, 460);
  const plot = width - PAD.left - PAD.right;
  const height = plot + PAD.top + PAD.bottom;
  const X = (v: number) => PAD.left + ((v + half) / (2 * half)) * plot;
  const Y = (v: number) => PAD.top + ((half - v) / (2 * half)) * plot;
  return { ref, width, height, plot, X, Y };
}

function Axes({ ticks, X, Y, plot, height, xLabel, yLabel }: {
  ticks: number[]; X: (v: number) => number; Y: (v: number) => number; plot: number; height: number; xLabel: string; yLabel: string;
}) {
  const digits = ticks.some((t) => Math.abs(t * 10 - Math.round(t * 10)) > 1e-9) ? 2 : 1;
  return (
    <>
      <rect x={PAD.left} y={PAD.top} width={plot} height={plot} fill="#030712" stroke="#374151" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={PAD.top} y2={PAD.top + plot} stroke="#1f2937" />
          <line x1={PAD.left} x2={PAD.left + plot} y1={Y(t)} y2={Y(t)} stroke="#1f2937" />
          <text x={X(t)} y={PAD.top + plot + 16} fill="#9ca3af" fontSize={TICK_FONT} textAnchor="middle">{fmt(t, digits)}</text>
          <text x={PAD.left - 6} y={Y(t) + 4} fill="#9ca3af" fontSize={TICK_FONT} textAnchor="end">{fmt(t, digits)}</text>
        </g>
      ))}
      <text x={PAD.left + plot / 2} y={height - 6} fill="#d1d5db" fontSize={12} textAnchor="middle">{xLabel}</text>
      <text x={14} y={PAD.top + plot / 2} fill="#d1d5db" fontSize={12} textAnchor="middle" transform={`rotate(-90 14 ${PAD.top + plot / 2})`}>{yLabel}</text>
    </>
  );
}

/** One period of the Fourier plane in spatial frequency (cycles per pixel): orders, zero order and the aperture. */
function FourierMap({ lee, p, nuX, nuY, radiusNu }: { lee: boolean; p: number; nuX: number; nuY: number; radiusNu: number }) {
  const { ref, width, height, plot, X, Y } = useSquare(0.5);
  const unit = plot; // pixels per cycle/pixel
  const orders = lee ? Array.from({ length: 2 * Math.floor(p / 2) + 1 }, (_, i) => i - Math.floor(p / 2)).map((m) => ({ m, power: leeOrderPower(p, m) })) : [];
  const rMax = Math.max(3, Math.min(16, (0.4 * unit) / p));
  // The filtered order is m = −1 (Lee, ν = −1/p) or the superpixel aperture at (−1/n², 1/n), as Goorden et al. print it.
  const ax = -nuX, ay = nuY;
  const label = lee
    ? `Fourier plane: Lee orders every 1/${p} cycle per pixel; the aperture of radius ${fmt(radiusNu, 3)} cycles per pixel is centred on order −1.`
    : `Fourier plane: superpixel aperture at (${fmt(ax, 3)}, ${fmt(ay, 3)}) cycles per pixel, radius ${fmt(radiusNu, 3)}.`;
  return (
    <div ref={ref}>
      <svg width={width} height={height} role="img" aria-label={label} className="block">
        <clipPath id="fourier-clip"><rect x={PAD.left} y={PAD.top} width={plot} height={plot} /></clipPath>
        <Axes ticks={[-0.5, -0.25, 0, 0.25, 0.5]} X={X} Y={Y} plot={plot} height={height}
          xLabel="νx (cycles per pixel)" yLabel="νy (cycles per pixel)" />
        {orders.map(({ m, power }) => (
          <g key={m}>
            <circle cx={X(m / p)} cy={Y(0)} r={2} fill="#4b5563" />
            {power > 1e-4 && <circle cx={X(m / p)} cy={Y(0)} r={rMax * Math.sqrt(power / 0.25)} fill={m === -1 ? "#34d399" : "#60a5fa"} fillOpacity={0.75} />}
            {power > 1e-4 && Math.abs(m) <= 2 && (
              <text x={X(m / p)} y={Y(0) + rMax + 14} fill="#e5e7eb" fontSize={11} textAnchor="middle">{fmt(power * 100, 1)}%</text>
            )}
          </g>
        ))}
        {!lee && <circle cx={X(0)} cy={Y(0)} r={rMax} fill="#60a5fa" fillOpacity={0.75} />}
        <circle cx={X(ax)} cy={Y(ay)} r={radiusNu * unit} fill="none" stroke="#fbbf24" strokeWidth={2} clipPath="url(#fourier-clip)" />
        <g stroke="#fbbf24" strokeWidth={1.5}>
          <line x1={X(ax) - 5} x2={X(ax) + 5} y1={Y(ay)} y2={Y(ay)} />
          <line x1={X(ax)} x2={X(ax)} y1={Y(ay) - 5} y2={Y(ay) + 5} />
        </g>
      </svg>
    </div>
  );
}

/** The complex values T₋₁ one cell can encode, as a fraction of the incident field. */
function FieldMap({ fields, label }: { fields: Field[]; label: string }) {
  const half = 0.4;
  const { ref, width, height, plot, X, Y } = useSquare(half);
  const path = fields.map(([re, im]) => `M${X(re).toFixed(1)} ${Y(im).toFixed(1)}h0`).join("");
  return (
    <div ref={ref}>
      <svg width={width} height={height} role="img" aria-label={label} className="block">
        <Axes ticks={[-0.3, -0.15, 0, 0.15, 0.3]} X={X} Y={Y} plot={plot} height={height} xLabel="Re T₋₁" yLabel="Im T₋₁" />
        <circle cx={X(0)} cy={Y(0)} r={(plot / (2 * half)) / Math.PI} fill="none" stroke="#6b7280" strokeDasharray="4 4" />
        <path d={path} stroke="#34d399" strokeWidth={fields.length > 1000 ? 2 : 5} strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function DmdHolographyPage() {
  const [methodIn, setMethod] = useURLState("method", "superpixel");
  const [wavelengthIn, setWavelength] = useURLState("wavelength", 633);
  const [pitchIn, setPitch] = useURLState("pitch", 13.68);
  const [focalIn, setFocal] = useURLState("focal", 300);
  const [columnsIn, setColumns] = useURLState("columns", 1024);
  const [rowsIn, setRows] = useURLState("rows", 768);
  const [periodIn, setPeriod] = useURLState("period", 4);
  const [superpixelIn, setSuperpixel] = useURLState("superpixel", 4);
  const [rateIn, setRate] = useURLState("rate", 32552);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const method: HologramMethod = methodIn === "lee-parallel" || methodIn === "lee-orthogonal" ? methodIn : "superpixel";
  const lee = method !== "superpixel";
  const lambda = clamp(wavelengthIn, 200, 2500) * 1e-9;
  const pitch = clamp(pitchIn, 1, 50) * 1e-6;
  const focal = clamp(focalIn, 1, 5000) * 1e-3;
  const columns = whole(columnsIn, 64, 8192), rows = whole(rowsIn, 64, 8192);
  const p = whole(periodIn, 2, 64), n = whole(superpixelIn, 2, 8);
  const rate = clamp(rateIn, 1, 100000);

  const r = useMemo(() => dmdHologram({ method, lambda, pitch, focal, columns, rows, period: p, superpixel: n }),
    [method, lambda, pitch, focal, columns, rows, p, n]);
  // Lee values (Eq. 22) hold the flat-pixel envelope; superpixel phasor sums get it here, so both share one scale.
  const fields = useMemo(() => {
    if (lee) return leeFields(p, method === "lee-parallel" ? "lee-parallel" : "lee-orthogonal");
    const k = Math.sqrt(r.envelope);
    return superpixelFields(n).map(([re, im]): Field => [re * k, im * k]);
  }, [lee, method, p, n, r.envelope]);
  const mm = (m: number) => fmt(m * 1e3, 3);
  const radiusNu = r.apertureRadius / r.fourierPeriod;
  const fieldsLabel = fields.length > 0
    ? `${fields.length} complex values one ${lee ? `Lee cell of period ${p}` : `${n} by ${n} superpixel`} can encode, largest amplitude ${fmt(Math.sqrt(r.efficiency), 3)}.`
    : `Not enumerated for n above ${SUPERPIXEL_ENUMERATED}.`;

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>Lee: T₋₁,₀ = (w<sub>y</sub>/p) sin(πw<sub>x</sub>/p)/π · e<sup>2πi s<sub>x</sub>/p</sup>; η = 1/π² (p even), sin²[π(p−1)/2p]/π² (p odd)</p>
        <p>superpixel: aperture at (−λf₁/(n²d), λf₁/(nd)); η = [sin(π⌊n²/2⌋/n²)/(n² sin(π/n²))]² × sinc²(π/n²) sinc²(π/n)</p>
        <p>aperture radius ≤ λf₁/(2pd) (Lee), λf₁/(4nd) (superpixel); Fourier-plane resolution λf₁/(Nd)</p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
        <Toggle label="Method" value={method} options={[["superpixel", "Superpixel"], ["lee-parallel", "Parallel Lee"], ["lee-orthogonal", "Orthogonal Lee"]]} onChange={setMethod} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        {lee
          ? <ValidatedNumberInput label="Lee carrier period p (pixels)" value={periodIn} onChange={setPeriod} min={2} max={64} step="1" />
          : <ValidatedNumberInput label="Superpixel side n (pixels)" value={superpixelIn} onChange={setSuperpixel} min={2} max={8} step="1" />}
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthIn} onChange={setWavelength} min={200} max={2500} step="1" />
        <ValidatedNumberInput label="Micromirror pitch d (µm)" value={pitchIn} onChange={setPitch} min={1} max={50} step="0.01" />
        <ValidatedNumberInput label="Focal length f₁ of the first lens (mm)" value={focalIn} onChange={setFocal} min={1} max={5000} step="1" />
        <ValidatedNumberInput label="Mirrors across (x)" value={columnsIn} onChange={setColumns} min={64} max={8192} step="1" />
        <ValidatedNumberInput label="Mirrors down (y)" value={rowsIn} onChange={setRows} min={64} max={8192} step="1" />
        <ValidatedNumberInput label="Binary pattern rate (Hz)" value={rateIn} onChange={setRate} min={1} max={100000} step="1" />
      </div>
      <p className="text-xs text-gray-500 mb-6">
        The defaults are Goorden et al.&apos;s setup: a ViALUX V-4100 with a 1024 × 768 DMD of 13.68 µm pitch, at 633 nm with
        f₁ = 300 mm. TI&apos;s DLP7000 (1024 × 768, 13.68 µm; part of the DLP Discovery 4100 platform) runs at 32 552 binary
        patterns per second with its DLPC410 controller (datasheet DLPS026G, Table 8-1). Each
        hologram is one binary pattern, so it changes at that rate.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Best efficiency (filtered order)" tone="green" value={`${fmt(r.efficiency * 100, 2)} %`}
          subtext={`${lee ? "Eq. 22" : `half of the ${n * n} pixels on`}: phasor sum ${fmt(r.phasorEfficiency * 100, 2)} % × pixel envelope ${fmt(r.envelope, 3)}`} />
        <ResultCard label="Aperture centre (from the zero order)" tone="yellow" value={`(${mm(r.apertureX)}, ${mm(r.apertureY)}) mm`}
          subtext={`radius at most ${mm(r.apertureRadius)} mm; phase steps ${fmt(r.phaseStepX * 180 / Math.PI, 1)}° (x), ${fmt(r.phaseStepY * 180 / Math.PI, 1)}° (y)`} />
        <ResultCard label={lee ? "Lee cells (p × p)" : "Superpixels (n × n)"} value={count(r.cells)}
          subtext={`finest target period ${fmt(r.finestPeriod, 0)} pixels${lee ? `; carrier period ${fmt(r.carrierPeriod * 1e6, 2)} µm` : ""}`} />
        <ResultCard label="Distinct values per cell" tone="purple" value={fields.length > 0 ? count(fields.length) : "—"}
          subtext={fields.length > 0 ? "complex values T₋₁ one cell can encode" : `counted by trying all 2^(n²) patterns, only up to n = ${SUPERPIXEL_ENUMERATED}`} />
        <ResultCard label="Pixel-grid order spacing λf₁/d" value={`${mm(r.fourierPeriod)} mm`}
          subtext="these orders vanish for flat pixels of 100 % fill; a real DMD shows them. The map spans one spacing." />
        <ResultCard label="Fourier-plane resolution λf₁/(Nd)" value={`${fmt(r.spotX * 1e6, 2)} × ${fmt(r.spotY * 1e6, 2)} µm`}
          subtext="first zero of the spot from the whole array, x × y" />
        <ResultCard label="Hologram rate" value={`${count(rate)} Hz`}
          subtext={`${fmt(1e6 / rate, 2)} µs per hologram; ${count(r.cells * rate)} cell values per second`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
          <h3 className="text-sm text-gray-400 mb-3">Fourier plane: one pixel-grid order spacing (+)</h3>
          <FourierMap lee={lee} p={p} nuX={r.nuX} nuY={r.nuY} radiusNu={radiusNu} />
          <p className="text-xs text-gray-500 mt-2">
            Position = ν · λf₁/d, so 1 cycle per pixel is {mm(r.fourierPeriod)} mm. The amber circle is the largest aperture.
            {lee
              ? " Dots: the orders of the brightest Lee cell, area proportional to power; green is the filtered order −1."
              : " The blue dot is the zero order; the superpixel pattern's own spectrum depends on the target field and is not drawn."}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
          <h3 className="text-sm text-gray-400 mb-3">Complex values one cell can encode</h3>
          {fields.length > 0
            ? <FieldMap fields={fields} label={fieldsLabel} />
            : <p className="text-sm text-gray-400">{fieldsLabel} Counting the fields means trying all 2^(n²) pixel patterns.</p>}
          <p className="text-xs text-gray-500 mt-2">
            Amplitude of the filtered order relative to the incident field; the dashed circle is 1/π, the limit of a
            continuous Lee hologram. {lee
              ? "A Lee cell encodes few levels: the parallel hologram has ⌊p/2⌋ amplitudes, the orthogonal one p."
              : "Goorden et al. count 343 values for n = 3 and 6561 for n = 4; n = 2 gives 9."}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <p>
          <strong>Worked example (Goorden et al. 2014).</strong> With 4 × 4 superpixels, 633 nm, f₁ = 300 mm and a 13.68 µm
          pitch (the defaults), the paper puts the aperture at (−0.87, 3.47) mm and finds 6561 distinct fields (343 for
          3 × 3), a calculated efficiency of 10.3 % and a largest aperture of r = 0.9 mm. The calculator gives (−0.868,
          3.470) mm, 6561 (343), a phasor sum of 10.26 % and 0.868 mm. The paper&apos;s measured efficiency was 4 %: 60 % into
          the DMD&apos;s zero order times 7 % modulation efficiency. Goorden&apos;s 10.3 % leaves out the envelope of the flat
          pixels, which Lee&apos;s Eq. 22 includes. With it (sinc²(π/16) sinc²(π/4) = 0.800, derived here, not in either paper)
          the superpixel gives 8.21 %, against 10.13 % for an even-period Lee hologram on the same footing.
        </p>
        <p>
          <strong>Lee holograms (Gutiérrez-Cuevas and Popoff 2024).</strong> A carrier of whole period p pixels gives 1/π²
          = 10.1 % for even p and sin²[π(p − 1)/2p]/π² for odd p, 7.60 % at p = 3 (the text after Eq. 22).
        </p>
        <p>
          <strong>Limits.</strong> Scalar, paraxial Fourier optics in a 4f system with a plane wave on ideal square pixels
          (100 % fill). The efficiency is the best cell; a real field uses dimmer ones too, and the DMD&apos;s own diffraction
          efficiency into the direction used (the blaze, the window and the fill factor; see the DMD diffraction calculator)
          multiplies it. For Lee holograms the largest aperture is the Nyquist bound ‖ν‖/2 of Gutiérrez-Cuevas and Popoff, a
          sampling limit rather than a guarantee of no crosstalk (order −2 spreads to about twice the bandwidth). For
          superpixels it is the π/(2n) rad per pixel band Goorden et al. set so that the pixels blur into their superpixel. The Lee carrier is
          along x with whole periods only. A wavelength Δλ away from the design value adds a phase gradient of period
          |nλ/Δλ| pixels to a superpixel hologram (Goorden et al.). Signs of the aperture position depend on the axes; the
          sizes do not. Lee&apos;s 1974 paper (Appl. Opt. 13, 1677) is cited here through Gutiérrez-Cuevas and Popoff.
        </p>
      </div>
    </>
  );
}
