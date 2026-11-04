"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { heroPowerSplit, wavelengthToColor } from "../../lib/hero-optics";
import type { HeroBranch, HeroBranchId } from "../../lib/home-categories";
import PhotonicChipArt, { HERO_BRANCH_VISUALS } from "./photonic-chip-art";
import type { HeroHover } from "./photonic-chip-art";

interface PhotonicChipHeroProps {
  branches: HeroBranch[];
  /** Intro block (eyebrow, h1, lede, call to action) rendered by the page. */
  children: ReactNode;
}

const HUD_TOP: Record<HeroBranchId, string> = { spectral: "10%", imaging: "34%", interference: "54%" };
const SPEEDS = [0.5, 1, 2];

function percent(fraction: number): string {
  return `${Math.round(fraction * 1000) / 10}%`;
}

function signedDeg(deg: number): string {
  return deg > 0 ? `+${deg}°` : `${deg}°`;
}

export default function PhotonicChipHero({ branches, children }: PhotonicChipHeroProps) {
  const router = useRouter();
  const ids = useId();
  const stageRef = useRef<HTMLElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hovered, setHoveredState] = useState<HeroHover>(null);
  const [wavelength, setWavelength] = useState(1550);
  const [phaseDeg, setPhaseDeg] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [pulseBurst, setPulseBurst] = useState(0);

  const beam = useMemo(() => wavelengthToColor(wavelength), [wavelength]);
  const split = useMemo(() => heroPowerSplit((phaseDeg * Math.PI) / 180), [phaseDeg]);
  const byId = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    [],
  );

  // A short delay on leave lets the pointer cross from the art onto the HUD card without it disappearing.
  const setHover = useCallback((next: HeroHover) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (next === null) {
      leaveTimer.current = setTimeout(() => setHoveredState(null), 160);
    } else {
      setHoveredState(next);
    }
  }, []);

  const goTo = useCallback(
    (id: HeroBranchId) => {
      const branch = byId.get(id);
      if (branch) router.push(branch.href);
    },
    [byId, router],
  );

  const stepPhase = useCallback(() => {
    setPulseBurst((n) => n + 1);
    setPhaseDeg((p) => (p === 0 ? 35 : p === 35 ? -35 : 0));
  }, []);

  // Parallax and spotlight write CSS variables directly: no React state, so the ~1000 SVG nodes are not re-rendered.
  const handleMouseMove = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    el.style.setProperty("--hero-px", ((nx - 0.5) * -10).toFixed(2));
    el.style.setProperty("--hero-py", ((ny - 0.5) * -7).toFixed(2));
    el.style.setProperty("--hero-sx", `${(nx * 100).toFixed(1)}%`);
    el.style.setProperty("--hero-sy", `${(ny * 100).toFixed(1)}%`);
  }, []);

  const hoveredBranch = hovered && hovered !== "chip" ? byId.get(hovered) : undefined;
  const hoveredVisual = hoveredBranch ? HERO_BRANCH_VISUALS[hoveredBranch.id] : undefined;
  const wavelengthId = `${ids}-wavelength`;
  const phaseId = `${ids}-phase`;

  return (
    <>
      <section
        ref={stageRef}
        aria-label="Photonic chip overview"
        onMouseMove={handleMouseMove}
        className="hero-stage relative select-none overflow-hidden"
        style={{ "--hero-speed": speed } as CSSProperties}
      >
        <div className="relative mx-auto w-full max-w-[1720px] xl:aspect-video xl:max-h-[860px]">
          {/* Intro: in flow below xl, top-left overlay at xl+ (above the input beam at y = 50 %). */}
          <div className="relative z-20 px-4 pb-4 pt-8 sm:px-8 xl:absolute xl:left-8 xl:top-7 xl:max-w-[460px] xl:p-0">
            {children}
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Photonics branches">
              {branches.map((branch) => (
                <li key={branch.id}>
                  <Link
                    href={branch.href}
                    onMouseEnter={() => setHover(branch.id)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(branch.id)}
                    onBlur={() => setHover(null)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                      hovered === branch.id
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-100 shadow-[0_0_16px_rgba(0,242,255,0.25)]"
                        : "border-slate-700 bg-slate-950/80 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    <span className="font-mono text-cyan-300">{HERO_BRANCH_VISUALS[branch.id].index}</span>
                    <span>{branch.title}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Art, plus the hover cards positioned in its coordinate frame. */}
          <div className="relative aspect-video w-full xl:absolute xl:inset-0 xl:aspect-auto">
            <PhotonicChipArt
              hovered={hovered}
              beam={beam}
              split={split}
              pulseBurst={pulseBurst}
              onHover={setHover}
              onBranchClick={goTo}
              onChipClick={stepPhase}
            />

            {hoveredBranch && hoveredVisual && (
              <div
                onMouseEnter={() => setHover(hoveredBranch.id)}
                onMouseLeave={() => setHover(null)}
                style={{ top: HUD_TOP[hoveredBranch.id] }}
                className="absolute right-[29%] z-30 hidden w-[330px] rounded-xl border border-cyan-400/50 bg-slate-950/95 p-4 shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(0,242,255,0.18)] backdrop-blur-xl md:block"
              >
                <p className="font-mono text-[11px] uppercase tracking-widest text-cyan-300">
                  Branch {hoveredVisual.index}
                </p>
                <h3 className="mt-1 text-sm font-bold leading-snug text-white">
                  <Link href={hoveredBranch.href} className="hover:text-cyan-200">
                    {hoveredBranch.title}
                    <span className="ml-1 font-normal text-slate-400">({hoveredBranch.count})</span>
                  </Link>
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">{hoveredVisual.subtitle}</p>
                <div className="mt-2.5 flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2">
                  <span className="text-[11px] text-slate-400">{hoveredVisual.formulaLabel}</span>
                  <code className="font-mono text-xs font-semibold text-cyan-300">{hoveredVisual.formula}</code>
                </div>
                <ul className="mt-2.5 space-y-1">
                  {hoveredBranch.calculators.map((calc) => (
                    <li key={calc.href}>
                      <Link
                        href={calc.href}
                        className="group flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/20 hover:text-cyan-100"
                      >
                        <span className="truncate">{calc.title}</span>
                        <span aria-hidden="true" className="text-slate-400 group-hover:text-cyan-300">
                          ›
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hovered === "chip" && (
              <div className="pointer-events-none absolute left-[37%] top-[21%] z-30 hidden w-[300px] rounded-xl border border-purple-400/50 bg-slate-950/95 p-3.5 shadow-2xl md:block">
                <p className="text-[11px] font-semibold text-purple-300">Mach-Zehnder splitter · click to step Δφ</p>
                <p className="mt-1 text-xs text-slate-300">
                  Click to step the phase shift through 0°, +35° and −35°. The two outputs trade power as
                  ½(1 ± sin Δφ).
                </p>
              </div>
            )}
          </div>

          {/* Controls: in flow below xl, bottom-left overlay at xl+. */}
          <div className="relative z-20 mx-4 mb-4 mt-4 rounded-xl border border-slate-800/90 bg-slate-950/85 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.75)] backdrop-blur-md sm:mx-8 xl:absolute xl:bottom-7 xl:left-8 xl:m-0 xl:w-[430px]">
            <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Source and splitter</h2>
              <span className="rounded border border-cyan-500/20 bg-cyan-950/60 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
                {beam.name}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <div className="mb-1 flex justify-between font-mono text-[11px]">
                  <label htmlFor={wavelengthId} className="text-slate-300">
                    Wavelength λ
                  </label>
                  <span className="text-cyan-300">{wavelength} nm</span>
                </div>
                <input
                  id={wavelengthId}
                  type="range"
                  min={405}
                  max={1550}
                  step={5}
                  value={wavelength}
                  onChange={(e) => setWavelength(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-400"
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between font-mono text-[11px]">
                  <label htmlFor={phaseId} className="text-slate-300">
                    Arm phase Δφ
                  </label>
                  <span className="text-purple-300">{signedDeg(phaseDeg)}</span>
                </div>
                <input
                  id={phaseId}
                  type="range"
                  min={-90}
                  max={90}
                  step={5}
                  value={phaseDeg}
                  onChange={(e) => setPhaseDeg(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-purple-400"
                />
              </div>
            </div>

            <div className="mt-3 border-t border-slate-800/70 pt-2 font-mono text-[11px] text-slate-300">
              <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                <span className="text-slate-400">Power split:</span>
                <span className={hovered === "spectral" ? "font-bold text-cyan-300" : ""}>
                  Upper {percent(split.spectral)}
                </span>
                <span className={hovered === "imaging" ? "font-bold text-cyan-300" : ""}>
                  Middle {percent(split.imaging)}
                </span>
                <span className={hovered === "interference" ? "font-bold text-cyan-300" : ""}>
                  Lower {percent(split.interference)}
                </span>
              </p>
              <p className="mt-1 text-slate-400">P± = ½(1 ± sin Δφ), quadrature-biased MZI, 50/50 taps</p>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2 text-[11px] text-slate-300">
              <button
                type="button"
                onClick={stepPhase}
                className="rounded border border-purple-500/40 bg-purple-500/10 px-2 py-1 text-purple-200 transition hover:bg-purple-500/20"
              >
                Step Δφ (0°, +35°, −35°)
              </button>
              <div className="flex items-center gap-1" role="group" aria-label="Pulse speed">
                <span className="mr-1 text-slate-400">Pulse speed</span>
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={speed === s}
                    onClick={() => setSpeed(s)}
                    className={`rounded px-1.5 py-1 ${
                      speed === s
                        ? "border border-cyan-500/40 bg-cyan-500/20 text-cyan-200"
                        : "border border-transparent bg-slate-900 text-slate-300 hover:text-white"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Photonics branches" className="border-t border-slate-800/90 bg-[#0a0d14] px-4 py-4 sm:px-8">
        <div className="mx-auto grid max-w-[1720px] grid-cols-1 gap-4 lg:grid-cols-3">
          {branches.map((branch) => {
            const visual = HERO_BRANCH_VISUALS[branch.id];
            const active = hovered === branch.id;
            return (
              <article
                key={branch.id}
                onMouseEnter={() => setHover(branch.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(branch.id)}
                onBlur={() => setHover(null)}
                className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                  active
                    ? "border-cyan-400/60 bg-slate-900/95 shadow-[0_0_25px_rgba(0,242,255,0.12)]"
                    : "border-slate-800/80 bg-slate-900/45 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-cyan-300">
                      Branch {visual.index}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">{branch.count} calculators</span>
                  </div>
                  <h2 className="text-sm font-bold text-white">
                    <Link href={branch.href} className="flex items-center justify-between gap-2 hover:text-cyan-200">
                      <span>{branch.title}</span>
                      <span aria-hidden="true" className="shrink-0 text-cyan-400">
                        ›
                      </span>
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">{visual.subtitle}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {branch.calculators.map((calc) => (
                      <li key={calc.href}>
                        <Link
                          href={calc.href}
                          className="inline-block rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-100"
                        >
                          {calc.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-800/80 pt-2.5 font-mono text-[11px]">
                  <code className="text-cyan-300/90">{visual.formula}</code>
                  <span className="shrink-0 text-amber-300">{percent(split[branch.id])} of input</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
