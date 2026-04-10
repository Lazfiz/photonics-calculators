"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function DispersionCompPage() {
  const [dispersion, setDispersion] = useURLState("dispersion", 17); // ps/(nm·km) typical SMF at 1550
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 80); // km
  const [bwNm, setBwNm] = useURLState("bwNm", 0.5); // source spectral width nm
  const [bitRate, setBitRate] = useURLState("bitRate", 10); // Gbps
  const [compDispersion, setCompDispersion] = useState(-17); // ps/(nm·km) DCF
  const [targetResidual, setTargetResidual] = useURLState("targetResidual", 1); // ps/nm max residual

  const totalDispersion = dispersion * fiberLength; // ps/nm
  const pulseBroadening = totalDispersion * bwNm; // ps
  const maxBitRate = 1 / (4 * pulseBroadening * 1e-12) / 1e9; // Gbps (NRZ, 0.25*Δτ limit)
  const isLlimited = pulseBroadening > 0.25e12 / (bitRate * 1e9);

  // DCF length to compensate
  const requiredDCF = dispersion !== 0 ? (dispersion * fiberLength) / -compDispersion : 0;
  const residualDisp = totalDispersion + compDispersion * requiredDCF;
  const residualBroadening = Math.abs(residualDisp * bwNm);

  const chartData = useMemo(() => {
    const lengths = Array.from({ length: 200 }, (_, i) => i * 200 / 200); // 0 to 200 km
    const totalDisp = lengths.map(l => dispersion * l);
    const broadening = totalDisp.map(d => d * bwNm);

    // With DCF compensation at each length
    const dcfLength = lengths.map(l => (dispersion * l) / -compDispersion);
    const residualD = lengths.map((l, i) => totalDisp[i] + compDispersion * dcfLength[i]);
    const residualB = residualD.map(d => Math.abs(d * bwNm));

    return [
      { x: lengths, y: broadening, type: "scatter" as const, mode: "lines" as const, name: "Uncompensated Δτ (ps)", line: { color: "#f87171", width: 2 } },
      { x: lengths, y: residualB, type: "scatter" as const, mode: "lines" as const, name: "Compensated Δτ (ps)", line: { color: "#60a5fa", width: 2, dash: "dash" } },
    ];
  }, [dispersion, bwNm, compDispersion]);

  // Power penalty from residual dispersion: Penalty ≈ 5·(B·Δτ)² dB
  // B in Hz, Δτ in s → B·Δτ = bitRate(Gbps)×1e9 × residualBroadening(ps)×1e-12 = bitRate×Δτ×1e-3
  const penaltyLinear = 5e-6 * (residualBroadening * bitRate) ** 2;
  const penaltyDb = 10 * Math.log10(Math.max(1e-10, 1 + penaltyLinear));

  return (
    <CalculatorShell backHref="/fiber-optics" backLabel="Fiber Optics" title="Dispersion Compensation" description="Calculates chromatic dispersion limits and DCF (dispersion-compensating fiber) requirements.
        Total dispersion: Dtotal = D · L. Pulse broadening: Δτ = Dtotal · Δλ.
        NRZ bit-rate limit: B ≤ 1/(4Δτ). DCF length: LDCF = D·L / |DDCF|.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="D (ps/nm/km)" value={dispersion} onChange={setDispersion} step="0.1" />
        <ValidatedNumberInput label="Fiber length (km)" value={fiberLength} onChange={setFiberLength} step="1" />
        <ValidatedNumberInput label="Source Δλ (nm)" value={bwNm} onChange={setBwNm} step="0.1" />
        <ValidatedNumberInput label="Bit rate (Gbps)" value={bitRate} onChange={setBitRate} step="1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">D<sub>DCF</sub> (ps/nm/km)</span>
          <ValidatedNumberInput label="DDCF (ps/nm/km)" value={compDispersion} onChange={setCompDispersion} step="1" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Total dispersion = <span className="text-blue-400 font-mono">{totalDispersion.toFixed(1)} ps/nm</span></p>
        <p className="text-gray-300">Pulse broadening = <span className="text-blue-400 font-mono">{pulseBroadening.toFixed(1)} ps</span></p>
        <p className="text-gray-300">Max bit rate (NRZ) = <span className={`font-mono ${isLlimited ? "text-red-400" : "text-green-400"}`}>{maxBitRate.toFixed(2)} Gbps</span></p>
        <p className="text-gray-300">Dispersion-limited? <span className={isLlimited ? "text-red-400" : "text-green-400"}>{isLlimited ? "YES" : "NO"}</span></p>
        <hr className="border-gray-700 my-2" />
        <p className="text-gray-300">Required DCF length = <span className="text-yellow-400 font-mono">{requiredDCF.toFixed(1)} km</span></p>
        <p className="text-gray-300">Residual Δτ after DCF = <span className="text-yellow-400 font-mono">{residualBroadening.toFixed(4)} ps</span></p>
        <p className="text-gray-300">Est. power penalty = <span className="text-yellow-400 font-mono">{penaltyDb.toFixed(4)} dB</span></p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Fiber length (km)", gridcolor: "#374151" },
        yaxis: { title: "Pulse broadening (ps)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true,
        legend: { x: 0.02, y: 0.98 },
      }} />
    </CalculatorShell>
  );
}
