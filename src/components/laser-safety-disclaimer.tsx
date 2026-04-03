export default function LaserSafetyDisclaimer() {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-950/60 p-4 shadow-lg shadow-red-950/20">
      <p className="text-sm font-semibold text-red-200">
        ⚠️ Laser safety calculators use simplified educational models.
      </p>
      <p className="mt-2 text-sm leading-6 text-red-100/90">
        Do not use these results alone for compliance, hazard sign-off, PPE selection,
        or controlled-area decisions. Verify against ANSI Z136.1, IEC 60825-1, and
        your local laser safety process before relying on any result.
      </p>
    </div>
  );
}
