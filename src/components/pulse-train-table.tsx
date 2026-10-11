import { fmtEnergy, fmtNum, fmtPower, LIMIT_LABELS } from "./eye-limit-labels";
import type { TrainLimit } from "../physics/laser-safety/pulse-train";

const fmtCount = (n: number) => (n >= 1e5 ? n.toExponential(2) : n.toLocaleString("en-US"));

const WORDS = {
  pulse: {
    single: "1. Single pulse", groups: "2. Pulse groups (average)", reduced: "3. C_P × single pulse", max: "Max per pulse",
    yours: "Your pulse / max", plural: "pulses", fmt: fmtEnergy,
    note: "Energies per pulse in the beam (1/e² Gaussian, averaged over each limit's aperture).",
  },
  pass: {
    single: "1. Single pass", groups: "2. Groups of passes (average)", reduced: "3. C_P × single pass", max: "Max beam power",
    yours: "Your power / max", plural: "passes", fmt: fmtPower,
    note: "Beam powers: each pass over a limit's aperture is one pulse, its energy proportional to the power.",
  },
} as const;

/**
 * Each eye limit of a pulse train (`pulseTrainLimits`) or a scanned beam (`scannedBeamLimits`, `unit="pass"`) under
 * the three ICNIRP 2013 rules, what they allow (energy per pulse in J, or beam power in W), and how `value` compares.
 * `pulses` is the count in the exposure, unless a limit carries its own (`passes`). The rule that binds is highlighted.
 */
export default function PulseTrainTable({
  result,
  value,
  unit = "pulse",
}: {
  result: { limits: readonly (TrainLimit & { readonly passes?: number })[]; pulses?: number };
  value: number;
  unit?: "pulse" | "pass";
}) {
  const w = WORDS[unit];
  const cell = (on: boolean) => `py-2 pr-4 ${on ? "font-semibold text-white" : ""}`;
  // A limit that doesn't apply within the exposure (the photochemical one before 10 s) has no binding rule.
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-gray-400 border-b border-gray-800">
          <tr>
            <th className="py-2 pr-4 font-normal">Limit</th>
            <th className="py-2 pr-4 font-normal">{w.single}</th>
            <th className="py-2 pr-4 font-normal">{w.groups}</th>
            <th className="py-2 pr-4 font-normal">{w.reduced}</th>
            <th className="py-2 pr-4 font-normal">{w.max}</th>
            <th className="py-2 font-normal">{w.yours}</th>
          </tr>
        </thead>
        <tbody>
          {result.limits.map((l) => {
            const applies = Number.isFinite(l.qMax);
            const ratio = value / l.qMax;
            const total = l.passes ?? result.pulses;
            return (
              <tr key={l.kind} className="border-b border-gray-900 align-top">
                <td className="py-2 pr-4">{LIMIT_LABELS[l.kind]}</td>
                <td className={cell(applies && l.rule === 1)}>{Number.isFinite(l.singlePulse) ? w.fmt(l.singlePulse) : "n/a before 10 s"}</td>
                <td className={cell(applies && l.rule === 2)}>
                  {Number.isFinite(l.group) ? (
                    <>
                      {w.fmt(l.group)}
                      <span className="block text-xs text-gray-500">
                        {l.groupPulses === total ? "full train" : "worst group"}: {fmtCount(l.groupPulses)} {w.plural}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={cell(applies && l.rule === 3)}>
                  {Number.isFinite(l.reduced) ? (
                    <>
                      {w.fmt(l.reduced)}
                      <span className="block text-xs text-gray-500">
                        C_P = {fmtNum(l.cp)}, n = {fmtCount(l.cpCount)}
                        {l.perGroup > 1 ? ` groups of ${fmtCount(l.perGroup)} ${w.plural} in T_i` : ""}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-4">{w.fmt(l.qMax)}</td>
                {applies ? (
                  <td className={`py-2 ${ratio > 1 ? "text-red-400" : "text-green-400"}`}>
                    {fmtNum(ratio)}× {ratio > 1 ? "(exceeds)" : "(within)"}
                  </td>
                ) : (
                  <td className="py-2 text-gray-500">doesn&apos;t apply</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">
        {w.note}{" "}Rule 3 applies to the retinal thermal limit only; &quot;—&quot; means the rule doesn&apos;t apply (rule 2
        needs two {w.plural}).
      </p>
    </div>
  );
}
