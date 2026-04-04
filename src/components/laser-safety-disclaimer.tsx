export default function LaserSafetyDisclaimer() {
  return (
    <div className="mb-6 rounded-xl border-2 border-red-500/60 bg-red-950/80 p-5 shadow-lg shadow-red-950/30">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-300">Educational only — not compliance-grade</p>
      <p className="mt-2 text-base font-semibold text-red-100">
        Laser-safety pages in this site are quarantined as educational tools until they are reviewed against the full standard set and signed off by a qualified laser safety process / CLSO workflow.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-red-100/90">
        <li>Do not use these results alone for PPE selection, NHZ / NOHD approval, controlled-area sign-off, enclosure/interlock approval, or formal classification.</li>
        <li>Several pages intentionally disable unsupported regimes instead of guessing through missing correction factors or pulse rules.</li>
        <li>Always verify against ANSI Z136.1, IEC 60825-1, your local procedures, and the responsible laser safety officer / CLSO.</li>
      </ul>
    </div>
  );
}
