import { laserSafetyReferencePoints } from "../lib/laser-safety-mpe";

export default function LaserSafetyCwReferences() {
  return (
    <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm leading-6 text-slate-200">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Reference points for this bounded suite</p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {laserSafetyReferencePoints.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
