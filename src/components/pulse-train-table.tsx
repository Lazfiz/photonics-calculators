import { fmtEnergy, fmtNum, LIMIT_LABELS } from "./eye-limit-labels";
import type { TrainLimits } from "../physics/laser-safety/pulse-train";

const fmtCount = (n: number) => (n >= 1e5 ? n.toExponential(2) : n.toLocaleString("en-US"));

/**
 * Each eye limit of a pulse train (`pulseTrainLimits`) under the three ICNIRP 2013 rules, the energy per pulse they
 * allow, and how a pulse of `energy` (J) compares. The rule that binds is highlighted.
 */
export default function PulseTrainTable({ result, energy }: { result: TrainLimits; energy: number }) {
  const cell = (on: boolean) => `py-2 pr-4 ${on ? "font-semibold text-white" : ""}`;
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-gray-400 border-b border-gray-800">
          <tr>
            <th className="py-2 pr-4 font-normal">Limit</th>
            <th className="py-2 pr-4 font-normal">1. Single pulse</th>
            <th className="py-2 pr-4 font-normal">2. Pulse groups (average)</th>
            <th className="py-2 pr-4 font-normal">3. C_P × single pulse</th>
            <th className="py-2 pr-4 font-normal">Max per pulse</th>
            <th className="py-2 font-normal">Your pulse / max</th>
          </tr>
        </thead>
        <tbody>
          {result.limits.map((l) => {
            const ratio = energy / l.qMax;
            return (
              <tr key={l.kind} className="border-b border-gray-900 align-top">
                <td className="py-2 pr-4">{LIMIT_LABELS[l.kind]}</td>
                <td className={cell(l.rule === 1)}>{Number.isFinite(l.singlePulse) ? fmtEnergy(l.singlePulse) : "n/a before 10 s"}</td>
                <td className={cell(l.rule === 2)}>
                  {Number.isFinite(l.group) ? (
                    <>
                      {fmtEnergy(l.group)}
                      <span className="block text-xs text-gray-500">
                        {l.groupPulses === result.pulses ? "full train" : "worst group"}: {fmtCount(l.groupPulses)} pulses
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={cell(l.rule === 3)}>
                  {Number.isFinite(l.reduced) ? (
                    <>
                      {fmtEnergy(l.reduced)}
                      <span className="block text-xs text-gray-500">
                        C_P = {fmtNum(l.cp)}, n = {fmtCount(l.cpCount)}
                        {l.perGroup > 1 ? ` groups of ${fmtCount(l.perGroup)} pulses in T_i` : ""}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-4">{fmtEnergy(l.qMax)}</td>
                <td className={`py-2 ${ratio > 1 ? "text-red-400" : "text-green-400"}`}>
                  {fmtNum(ratio)}× {ratio > 1 ? "(exceeds)" : "(within)"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">
        Energies per pulse in the beam (1/e² Gaussian, averaged over each limit&apos;s aperture). Rule 3 applies to the
        retinal thermal limit only; &quot;—&quot; means the rule doesn&apos;t apply (rule 2 needs two pulses).
      </p>
    </div>
  );
}
