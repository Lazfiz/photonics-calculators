export default function LaserSafetyQuarantineBanner() {
  return (
    <div className="mb-6 rounded-xl border-2 border-fuchsia-500/60 bg-fuchsia-950/35 p-5 shadow-lg shadow-fuchsia-950/20">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-fuchsia-300">Quarantined standards-heavy page</p>
      <p className="mt-2 text-base font-semibold text-fuchsia-100">
        This page stays public for reference and educational context, but it is not part of the bounded pre-check suite and should not be used for hazard sign-off, PPE specification, classification, interlock design, or operational approval.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-fuchsia-100/90">
        <li>The underlying standards logic for this topic is too broad or too branch-heavy to trust in this simplified form.</li>
        <li>Unsupported regimes should be considered disabled rather than approximately handled.</li>
        <li>Use ANSI Z136.1, IEC 60825-1, IEC 62471 where relevant, and a CLSO / LSO review process for any real decision.</li>
      </ul>
    </div>
  );
}
