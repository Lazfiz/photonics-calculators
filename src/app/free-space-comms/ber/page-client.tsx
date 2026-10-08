"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  MAX_NOISE_PER_SLOT,
  MAX_PHOTONS_PER_BIT,
  ookPhotonCountingBer,
  photonCountingBer,
  requiredPhotonsPerBit,
  type PhotonCountingScheme,
} from "../../../physics/free-space-comms/ber";

const TARGET_BERS = [1e-3, 1e-6, 1e-9];
const CHART_FLOOR = 1e-18;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatBer(ber: number): string {
  if (Number.isNaN(ber)) return "—";
  return ber < 1e-300 ? "< 1e-300" : ber.toExponential(2);
}

/** log₁₀ BER curve, trimmed at CHART_FLOOR (SimpleChart's log axis can't go below 1e-10). */
function berCurve(scheme: PhotonCountingScheme, noisePerSlot: number, name: string, line: Record<string, unknown>) {
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i <= 200; i++) {
    const ppb = Math.pow(10, i * 0.02); // 1 … 1e4 photons/bit
    const ber = photonCountingBer(scheme, ppb, noisePerSlot);
    if (!(ber >= CHART_FLOOR)) break; // BER only falls with ppb
    x.push(ppb);
    y.push(Math.log10(ber));
  }
  return { x, y, type: "scatter", mode: "lines", name, line };
}

export default function BERPage() {
  const [photons, setPhotons] = useURLState("photons", 100);
  const [darkCount, setDarkCount] = useURLState("darkCount", 100);
  const [modulation, setModulation] = useState<PhotonCountingScheme>("OOK");

  const calc = useMemo(() => {
    const n = clamp(photons, 0, MAX_PHOTONS_PER_BIT);
    const nb = clamp(darkCount, 0, MAX_NOISE_PER_SLOT);
    const ook = ookPhotonCountingBer(n, nb);
    const ber = modulation === "OOK" ? ook.ber : photonCountingBer("DPSK", n, nb);
    const required = TARGET_BERS.map((target) => ({ target, photons: requiredPhotonsPerBit(modulation, target, nb) }));
    return { ber, threshold: ook.threshold, pulsePhotons: 2 * n, required };
  }, [photons, darkCount, modulation]);

  const plotData = useMemo(() => {
    const nb = clamp(darkCount, 0, MAX_NOISE_PER_SLOT);
    return [
      berCurve("OOK", nb, "OOK", { color: "#06b6d4" }),
      berCurve("DPSK", nb, "DPSK", { color: "#f59e0b" }),
      berCurve("OOK", 0, "OOK, no noise", { color: "#06b6d4", dash: "dot" }),
      berCurve("DPSK", 0, "DPSK, no noise", { color: "#f59e0b", dash: "dot" }),
    ];
  }, [darkCount]);

  return (
    <>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-cyan-400">Inputs</h2>
          <div>
            <ValidatedNumberInput label="Detected Signal Photons per Bit (average)" value={photons} onChange={setPhotons} min={0.1} max={MAX_PHOTONS_PER_BIT} />
          </div>
          <div>
            <ValidatedNumberInput label="Dark + Background Counts per Bit Slot (per detector)" value={darkCount} onChange={setDarkCount} min={0} max={MAX_NOISE_PER_SLOT} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Modulation</label>
            <div className="flex gap-2">
              {(["OOK", "DPSK"] as const).map((m) => (
                <button key={m} onClick={() => setModulation(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${modulation === m ? "bg-cyan-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">BER ({modulation})</span><span>{formatBer(calc.ber)}</span></div>
              {modulation === "OOK" ? (
                <>
                  <div className="flex justify-between"><span className="text-gray-400">Photons per &quot;1&quot; pulse</span><span>{calc.pulsePhotons.toPrecision(3)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Decision threshold (ML)</span><span>{Number.isFinite(calc.threshold) ? `≥ ${calc.threshold} counts` : "—"}</span></div>
                </>
              ) : (
                <div className="flex justify-between"><span className="text-gray-400">Decision</span><span>port with more counts</span></div>
              )}
              {calc.required.map(({ target, photons }) => (
                <div key={target} className="flex justify-between">
                  <span className="text-gray-400">Required for BER {target.toExponential(0)}</span>
                  <span>{Number.isFinite(photons) ? `${photons.toPrecision(3)} photons/bit` : Number.isNaN(photons) ? "—" : "> 1e7 photons/bit"}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <ChartPanel data={plotData} layout={{
              xaxis: { title: "Detected photons per bit", type: "log", color: "#9ca3af", gridcolor: "#374151" },
              yaxis: { title: "log₁₀ BER", color: "#9ca3af", gridcolor: "#374151" },
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              margin: { t: 20, r: 20, b: 40, l: 50 }, font: { color: "#9ca3af" },
            }} />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-400">Model (exact for an ideal photon-counting receiver):</strong> Poisson signal and noise counts, equiprobable bits, no dead time or ISI.</p>
            <p><strong className="text-gray-400">OOK:</strong> a &quot;1&quot; carries 2n̄ photons. Decide &quot;1&quot; when k ≥ k<sub>T</sub> = ⌊2n̄ / ln(1 + 2n̄/n<sub>b</sub>)⌋ + 1 (maximum likelihood). BER = ½[P(K ≥ k<sub>T</sub> | n<sub>b</sub>) + P(K &lt; k<sub>T</sub> | 2n̄ + n<sub>b</sub>)].</p>
            <p><strong className="text-gray-400">DPSK:</strong> delay-line interferometer with one counter per port. BER = P(K<sub>d</sub> &gt; K<sub>c</sub>) + ½P(K<sub>d</sub> = K<sub>c</sub>), K<sub>c</sub> ~ Poisson(n̄ + n<sub>b</sub>), K<sub>d</sub> ~ Poisson(n<sub>b</sub>).</p>
            <p><strong className="text-gray-400">No noise (dotted):</strong> ½e<sup>−2n̄</sup> (OOK, 10 photons/bit at 10⁻⁹) and ½e<sup>−n̄</sup> (DPSK, 20 photons/bit). Ref: D. O. Caplan, in Free-Space Laser Communications (Springer, 2008), doi:10.1007/978-0-387-28677-8_4.</p>
          </div>
        </div>
      </div>
    </>
  );
}
