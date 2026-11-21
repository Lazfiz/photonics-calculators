"use client";

import { useMemo } from "react";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { TICK_FONT, formatTick, niceTicks, tickCount } from "../../../components/chart-axes";
import { useElementWidth } from "../../../hooks/use-element-width";
import { useURLState } from "../../../hooks/use-url-state";
import {
  DLPC900_MIN_PATTERN_US, type Dlpc900Dmd, dmdTiming,
} from "../../../physics/spatial-light-modulators/dmd-timing";

const DMDS: Dlpc900Dmd[] = ["DLP5500", "DLP6500", "DLP9000", "DLP670S", "DLP500YX"];

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const fmt = (v: number, digits: number) => (Number.isFinite(v) ? (v + 0).toFixed(digits) : "—");
const pct = (v: number, digits = 2) => (Number.isFinite(v) ? `${fmt(v * 100, digits)} %` : "—");
const sig = (v: number, digits = 4) => (Number.isFinite(v) ? String(Number(v.toPrecision(digits))) : "—");
/** A duration in s, in the unit that keeps it between 1 and 1000. */
const dur = (s: number) => {
  if (!Number.isFinite(s)) return "—";
  if (s >= 1) return `${sig(s)} s`;
  if (s >= 1e-3) return `${sig(s * 1e3)} ms`;
  if (s >= 1e-6) return `${sig(s * 1e6)} µs`;
  return `${sig(s * 1e9)} ns`;
};
const hz = (f: number) => (Number.isFinite(f) ? (f >= 1e3 ? `${sig(f / 1e3)} kHz` : `${sig(f)} Hz`) : "—");

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

const PAD = { left: 56, right: 12, top: 12, bottom: 42 };

/** A plot frame of the container's width and the given height; x and y map [0, 1] fractions to pixels. */
function useFrame(height: number) {
  const [ref, measured] = useElementWidth<HTMLDivElement>();
  const width = Math.min(measured ?? 420, 560);
  const w = width - PAD.left - PAD.right, h = height - PAD.top - PAD.bottom;
  return { ref, width, w, h, x: (f: number) => PAD.left + f * w, y: (f: number) => PAD.top + (1 - f) * h };
}

/** Time axis unit for a span of `total` seconds. */
const timeUnit = (total: number): [number, string] => (total >= 1 ? [1, "s"] : total >= 1e-2 ? [1e3, "ms"] : [1e6, "µs"]);

const TL_HEIGHT = 140;

/** One pattern period: the bit planes in weight order (LSB first), filled where grey level g has its bit set, then the dark time. */
function Timeline({ planes, grey, dark, tiMin }: { planes: number[]; grey: number; dark: number; tiMin: number }) {
  const { ref, width, w, x } = useFrame(TL_HEIGHT);
  const exposure = planes.reduce((a, b) => a + b, 0);
  const total = Math.max(exposure + dark, Number.isFinite(tiMin) ? tiMin : 0);
  const [k, unit] = timeUnit(total);
  const X = (t: number) => x(t / total);
  const ticks = niceTicks(0, total * k, tickCount(w, 70), false).filter((t) => t <= total * k * (1 + 1e-9));
  const top = 28, barH = 64;
  const starts = planes.map((_, i) => planes.slice(0, i).reduce((a, b) => a + b, 0));
  const valid = Number.isInteger(grey) && grey >= 0 && grey < 2 ** planes.length;
  const label = `Bit planes of one ${planes.length}-bit pattern, least significant first, over ${dur(exposure)}${dark > 0 ? ` plus ${dur(dark)} dark` : ""}; grey level ${grey}${valid ? ` keeps the mirror on for the planes ${planes.map((_, i) => i).filter((i) => (grey >> i) & 1).join(", ") || "none"}` : " doesn't fit in this bit depth"}.`;
  return (
    <div ref={ref}>
      <svg width={width} height={TL_HEIGHT} role="img" aria-label={label} className="block">
        <rect x={PAD.left} y={top} width={w} height={barH} fill="#030712" stroke="#374151" />
        {planes.map((p, i) => {
          const on = valid && ((grey >> i) & 1) === 1;
          const x0 = X(starts[i]), x1 = X(starts[i] + p);
          return (
            <g key={i}>
              <rect x={x0} y={top} width={Math.max(x1 - x0, 0.5)} height={barH} fill={on ? "#fbbf24" : "#1f2937"} stroke="#030712" strokeWidth={x1 - x0 > 3 ? 1 : 0} />
              {x1 - x0 > 22 && <text x={(x0 + x1) / 2} y={top + barH / 2 + 4} fill={on ? "#111827" : "#9ca3af"} fontSize={11} textAnchor="middle">b{i}</text>}
            </g>
          );
        })}
        {dark > 0 && (
          <g>
            <rect x={X(exposure)} y={top} width={X(exposure + dark) - X(exposure)} height={barH} fill="url(#dark-hatch)" stroke="#374151" />
            {X(exposure + dark) - X(exposure) > 36 && <text x={(X(exposure) + X(exposure + dark)) / 2} y={top - 6} fill="#9ca3af" fontSize={11} textAnchor="middle">dark</text>}
          </g>
        )}
        <defs>
          <pattern id="dark-hatch" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={6} stroke="#4b5563" strokeWidth={2} />
          </pattern>
        </defs>
        {Number.isFinite(tiMin) && (
          <g>
            <line x1={X(tiMin)} x2={X(tiMin)} y1={top - 14} y2={top + barH + 6} stroke="#f87171" strokeDasharray="4 3" strokeWidth={1.5} />
            <text x={Math.min(X(tiMin), PAD.left + w - 2)} y={top - 16} fill="#f87171" fontSize={11} textAnchor={X(tiMin) > PAD.left + w - 60 ? "end" : "middle"}>TI min</text>
          </g>
        )}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={X(t / k)} x2={X(t / k)} y1={top + barH} y2={top + barH + 5} stroke="#6b7280" />
            <text x={X(t / k)} y={top + barH + 18} fill="#9ca3af" fontSize={TICK_FONT} textAnchor="middle">{formatTick(t, ticks)}</text>
          </g>
        ))}
        <text x={PAD.left + w / 2} y={top + barH + 38} fill="#d1d5db" fontSize={12} textAnchor="middle">Time ({unit})</text>
      </svg>
    </div>
  );
}

const MT_HEIGHT = 260;
const LOG_LO = 1, LOG_HI = 7; // 10 µs … 10 s, in log10(µs)

/** Shortest pattern against bit depth: TI's table for this DMD, (2^b − 1) × its 1-bit time, and this exposure. */
function MinTimeChart({ dmd, bits, exposure, binaryTime }: { dmd: Dlpc900Dmd | null; bits: number; exposure: number; binaryTime: number }) {
  const { ref, width, w, h, x, y } = useFrame(MT_HEIGHT);
  const table = dmd ? DLPC900_MIN_PATTERN_US[dmd] : {};
  const maxB = Math.max(8, bits, dmd === "DLP500YX" ? 16 : 8);
  const X = (b: number) => x((b - 1) / (maxB - 1));
  const Y = (us: number) => y((clamp(Math.log10(us), LOG_LO, LOG_HI) - LOG_LO) / (LOG_HI - LOG_LO));
  const t1 = dmd ? table[1] : binaryTime * 1e6;
  const naive = Array.from({ length: 4 * (maxB - 1) + 1 }, (_, i) => 1 + i / 4)
    .map((b, i) => `${i ? "L" : "M"}${X(b).toFixed(1)} ${Y((2 ** b - 1) * t1).toFixed(1)}`).join("");
  const points = Object.entries(table).map(([b, us]) => ({ b: +b, us })).filter((p) => p.b <= maxB);
  const label = dmd
    ? `TI's minimum pattern time on the DLPC900 + ${dmd} for bit depths ${points.map((p) => p.b).join(", ")}, from ${points[0].us} µs to ${points[points.length - 1].us} µs; this exposure is ${dur(exposure * 1e-6)} at ${bits} bits.`
    : `This exposure, ${dur(exposure * 1e-6)} at ${bits} bits, against (2^b − 1) times the shortest binary pattern.`;
  const yTicks: [number, string][] = [[1, "10 µs"], [2, "100 µs"], [3, "1 ms"], [4, "10 ms"], [5, "100 ms"], [6, "1 s"], [7, "10 s"]];
  const xTicks = Array.from({ length: maxB }, (_, i) => i + 1).filter((b) => maxB <= 8 || b % 2 === 0 || b === 1);
  return (
    <div ref={ref}>
      <svg width={width} height={MT_HEIGHT} role="img" aria-label={label} className="block">
        <rect x={PAD.left} y={PAD.top} width={w} height={h} fill="#030712" stroke="#374151" />
        {xTicks.map((b) => (
          <g key={`x${b}`}>
            <line x1={X(b)} x2={X(b)} y1={PAD.top} y2={PAD.top + h} stroke="#1f2937" />
            <text x={X(b)} y={PAD.top + h + 16} fill="#9ca3af" fontSize={TICK_FONT} textAnchor="middle">{b}</text>
          </g>
        ))}
        {yTicks.map(([e, t]) => (
          <g key={`y${e}`}>
            <line x1={PAD.left} x2={PAD.left + w} y1={Y(10 ** e)} y2={Y(10 ** e)} stroke="#1f2937" />
            <text x={PAD.left - 6} y={Y(10 ** e) + 4} fill="#9ca3af" fontSize={TICK_FONT} textAnchor="end">{t}</text>
          </g>
        ))}
        <text x={PAD.left + w / 2} y={MT_HEIGHT - 6} fill="#d1d5db" fontSize={12} textAnchor="middle">Bit depth b</text>
        <text x={14} y={PAD.top + h / 2} fill="#d1d5db" fontSize={12} textAnchor="middle" transform={`rotate(-90 14 ${PAD.top + h / 2})`}>Pattern time (log)</text>
        {Number.isFinite(t1) && <path d={naive} fill="none" stroke="#6b7280" strokeDasharray="4 4" strokeWidth={1.5} />}
        {points.map((p) => <circle key={p.b} cx={X(p.b)} cy={Y(p.us)} r={4} fill="#f87171" />)}
        <circle cx={X(bits)} cy={Y(exposure)} r={6} fill="none" stroke="#fbbf24" strokeWidth={2.5} />
      </svg>
    </div>
  );
}

export default function DmdTimingPage() {
  const [dmdIn, setDmd] = useURLState("dmd", "DLP6500");
  const [bitsIn, setBits] = useURLState("bits", 8);
  const [exposureIn, setExposure] = useURLState("exposure", 4046);
  const [darkIn, setDark] = useURLState("dark", 0);
  const [greyIn, setGrey] = useURLState("grey", 200);
  const [binaryRateIn, setBinaryRate] = useURLState("binaryRate", 9523);
  const [mirrorsXIn, setMirrorsX] = useURLState("mirrorsX", 1920);
  const [mirrorsYIn, setMirrorsY] = useURLState("mirrorsY", 1080);
  const [frameRateIn, setFrameRate] = useURLState("frameRate", 120);
  const [coloursIn, setColours] = useURLState("colours", 3);

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const dmd = DMDS.find((d) => d === dmdIn) ?? null;
  const bits = Math.round(clamp(bitsIn, 1, 16));
  const exposureUs = clamp(exposureIn, 1, 1e7);
  const dark = clamp(darkIn, 0, 1e7) * 1e-6;
  const grey = Math.round(clamp(greyIn, 0, 65535));
  const binaryRate = clamp(binaryRateIn, 1, 1e5);
  const mirrorsX = Math.round(clamp(mirrorsXIn, 1, 8192));
  const mirrorsY = Math.round(clamp(mirrorsYIn, 1, 8192));
  const frameRate = clamp(frameRateIn, 1, 1000);
  const colours = Math.round(clamp(coloursIn, 1, 3));

  const r = useMemo(() => dmdTiming({ bits, exposure: exposureUs * 1e-6, dark, grey, dmd, binaryRate, mirrorsX, mirrorsY, frameRate, colours }),
    [bits, exposureUs, dark, grey, dmd, binaryRate, mirrorsX, mirrorsY, frameRate, colours]);
  const maxGrey = 2 ** bits - 1;
  const tooShort = Number.isFinite(r.tiMinPattern) && exposureUs * 1e-6 < r.tiMinPattern * (1 - 1e-9);

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-gray-300 text-sm font-mono space-y-1">
        <p>b bit planes of 2^k LSB (k = 0 … b − 1): exposure = (2^b − 1) LSB</p>
        <p>grey level g: on for g·LSB; pattern rate = 1/(exposure + dark time)</p>
        <p>video: slot per colour = 1/(f N_c); binary data rate = mirrors × R₁</p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
        <Toggle label="DLPC900 table" value={dmd ?? "none"} options={[...DMDS.map((d): [string, string] => [d, d]), ["none", "None"]]} onChange={setDmd} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-2">
        <ValidatedNumberInput label="Bit depth b" value={bitsIn} onChange={setBits} min={1} max={16} step="1" />
        <ValidatedNumberInput label="Exposure per pattern (µs)" value={exposureIn} onChange={setExposure} min={1} max={1e7} step="1" />
        <ValidatedNumberInput label="Dark time after each pattern (µs)" value={darkIn} onChange={setDark} min={0} max={1e7} step="1" />
        <ValidatedNumberInput label={`Grey level g (0 … ${maxGrey})`} value={greyIn} onChange={setGrey} min={0} max={65535} step="1" />
        <ValidatedNumberInput label="Binary pattern rate R₁ (Hz)" value={binaryRateIn} onChange={setBinaryRate} min={1} max={100000} step="1" />
        <ValidatedNumberInput label="Mirrors across" value={mirrorsXIn} onChange={setMirrorsX} min={1} max={8192} step="1" />
        <ValidatedNumberInput label="Mirrors down" value={mirrorsYIn} onChange={setMirrorsY} min={1} max={8192} step="1" />
        <ValidatedNumberInput label="Video frame rate f (Hz)" value={frameRateIn} onChange={setFrameRate} min={1} max={1000} step="1" />
        <ValidatedNumberInput label="Colours per video frame N_c" value={coloursIn} onChange={setColours} min={1} max={3} step="1" />
      </div>
      <p className="text-xs text-gray-500 mb-6">
        The defaults are the DLP6500 (1920 × 1080 mirrors, 9523 binary patterns/s) on the DLPC900, at TI&apos;s shortest
        8-bit pattern, 4046 µs.{" "}
        {Number.isFinite(r.tiMinPattern) && (
          <button type="button" onClick={() => setExposure(Math.round(r.tiMinPattern * 1e6))} className="text-blue-400 underline">
            Set the exposure to TI&apos;s minimum for {bits} bits ({Math.round(r.tiMinPattern * 1e6)} µs)
          </button>
        )}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Least significant bit plane" tone="green" value={dur(r.lsb)}
          subtext={`${r.greyLevels} grey levels; the MSB lasts ${dur(r.msb)}`} />
        <ResultCard label={`Mirror on-time, g = ${grey}`} tone="green" value={dur(r.onTime)}
          subtext={Number.isFinite(r.onTime) ? `${pct(r.onFraction)} of the exposure, ${pct(r.meanFraction)} of the pattern period` : `none: a ${bits}-bit pattern has levels 0 to ${maxGrey}`} />
        <ResultCard label="Pattern rate" tone="purple" value={hz(r.patternRate)}
          subtext={`period ${dur(r.period)}; video pattern mode: ${r.patternsPerFrame} pattern${r.patternsPerFrame === 1 ? "" : "s"} per ${sig(frameRate)} Hz frame (at most ⌊24/b⌋)`} />
        <ResultCard label={`TI minimum, ${bits}-bit`} tone={tooShort ? "yellow" : undefined} value={dur(r.tiMinPattern)}
          subtext={!dmd ? "no DLPC900 table selected" : Number.isFinite(r.tiMinPattern)
            ? `at most ${hz(r.tiMaxRate)} on the DLPC900 + ${dmd}${tooShort ? "; this exposure is shorter: expect an out-of-range error" : ""}`
            : `TI lists no ${bits}-bit patterns for the ${dmd}`} />
        <ResultCard label="Binary patterns" value={`${sig(r.dataRate / 1e9)} Gbit/s`}
          subtext={`shortest binary pattern 1/R₁ = ${dur(r.binaryTime)}, ${sig(mirrorsX * mirrorsY / 1e6)} Mpixel each`} />
        <ResultCard label="Video colour slot" value={dur(r.colourSlot)}
          subtext={`1/(f N_c); its ${bits}-bit LSB is ${dur(r.videoLsb)}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
          <h3 className="text-sm text-gray-400 mb-3">One pattern: bit planes and grey level {grey}</h3>
          <Timeline planes={r.planes} grey={grey} dark={dark} tiMin={r.tiMinPattern} />
          <p className="text-xs text-gray-500 mt-2">
            Each bar is one bit plane, least significant (b0) on the left, its width its duration. Amber: planes where
            g = {grey}{grey <= maxGrey ? ` (binary ${grey.toString(2).padStart(bits, "0")})` : ""}{" "}has its bit set, so the
            mirror is on. Hatched: dark time. Dashed red: TI&apos;s minimum pattern time for this bit depth. In video mode
            the DLPC900 shuffles and interleaves the planes; the total on-time is the same.
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 min-w-0">
          <h3 className="text-sm text-gray-400 mb-3">Shortest pattern against bit depth</h3>
          <MinTimeChart dmd={dmd} bits={bits} exposure={exposureUs} binaryTime={r.binaryTime} />
          <p className="text-xs text-gray-500 mt-2">
            {dmd ? `Red: TI's minimum pattern times on the DLPC900 + ${dmd} (Table 6-4). ` : ""}Dashed grey: (2^b − 1) times
            the {dmd ? "1-bit entry" : "shortest binary pattern 1/R₁"}, what each pattern would need if every LSB lasted a
            whole binary pattern. Amber ring: this exposure and bit depth.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <p>
          <strong>Worked example (TI DLPC900 datasheet, Sec. 6.3).</strong>{" "}A 120 Hz, 24-bit RGB input gives each colour
          1/360 s, which TI rounds to 2.78 ms, and splits it into eight bit planes weighted 1, 2, 4 … 128. Set f = 120 Hz and
          N_c = 3: the calculator gives a 2.778 ms slot. Those weights sum to 255 (the datasheet says 256, TI&apos;s Programmer&apos;s
          Guide 255), so the 8-bit LSB in that slot is 1/(360 × 255) s = 10.89 µs.
        </p>
        <p>
          <strong>Binary rate (TI DLP6500 datasheet).</strong>{" "}On the DLPC900 the DLP6500 shows up to 9523 binary patterns
          per second, &quot;up to 19.7 Giga-bits per second&quot;: 1920 × 1080 × 9523 = 19.75 Gbit/s. With the DLPC910&apos;s
          11 574 Hz the same sum gives TI&apos;s 24 Gbit/s.
        </p>
        <p>
          <strong>Shortest patterns (DLPC900 Table 6-4).</strong>{" "}TI lists the shortest pattern for each bit depth: on the
          DLP6500, 105 µs at 1 bit (1/9523 Hz) and 4046 µs at 8 bits, so at most 247 eight-bit patterns per second. That is
          far shorter than 255 × 105 µs = 26.8 ms, because each plane loads into the pixel memory while the previous one is
          shown (DMD 101, Secs. 2.3.1–2.3.3); planes shorter than a load, like the 15.9 µs 8-bit LSB at 4046 µs, need block
          clears or phased mirror clocking (Secs. 4.2–4.3). TI doesn&apos;t publish how the DLPC900 schedules them, so no
          formula reproduces the table and it is used as printed. It applies to the full array: loading fewer blocks
          allows 1-bit patterns down to 24 µs on the DLP6500 (Table 6-6), and preloaded patterns on an external trigger
          run slightly slower (Programmer&apos;s Guide, Table 2-110). With illumination modulation (the light source pulsed to
          shorten the small bits) TI reaches 8-bit patterns up to four times faster, at the cost of brightness; that mode is
          not modelled.
        </p>
        <p>
          <strong>Limits.</strong>{" "}Ideal binary pulse-width modulation: each plane lasts exactly its weight, the mirrors
          switch instantly and the light is steady. A DLP6500 mirror takes 2.5 µs (typical) to cross between its states, so a
          plane of a few microseconds doesn&apos;t carry exactly its weight in light. The colour slots are
          taken as equal; TI&apos;s guide also shows unequal splits. In video pattern mode a frame&apos;s patterns must
          finish within the frame (DLPC900 Programmer&apos;s Guide, Sec. 5.1) and come from its 24 bits per pixel
          (datasheet Sec. 6.4.1), so a frame holds at most ⌊24/b⌋ patterns; the count assumes the sequence starts on the
          frame sync. Trigger delays are not included, nor the 105 µs of dark time that ends the pattern which precedes a
          triggered one in the default lookup-table order, wherever a reordered sequence puts it (Programmer&apos;s Guide,
          Sec. 2.4.4.3.4).
        </p>
      </div>
    </>
  );
}
