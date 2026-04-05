import { cwPointSourceAssumptions } from "../lib/laser-safety-cw-suite";

export default function LaserSafetyCwBounds() {
  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Bounded engineering pre-check</p>
      <p className="mt-2 font-medium text-amber-200">
        This mini-suite is intentionally limited to a narrow CW point-source use case. Unsupported regimes should be rejected, not guessed through.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {cwPointSourceAssumptions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
