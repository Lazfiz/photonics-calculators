"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  combinerEtendueRatio, fiberEtendue, hexBundleDiameter, taperedPumpNA,
} from "../../../physics/fiber-optics/fiber-bundle";

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

export default function PumpCombinerCalculator() {
  const [portsRaw, setNumPumpPorts] = useURLState("numPumpPorts", 6);
  const [signalPortRaw, setSignalPort] = useURLState("signalPort", "yes");
  const [powerRaw, setPumpPowerPerPort] = useURLState("pumpPowerPerPort", 30); // W
  const [effRaw, setCombinerEfficiency] = useURLState("combinerEfficiency", 98); // %
  const [signalILRaw, setSignalInsertionLoss] = useURLState("signalInsertionLoss", 0.1); // dB
  const [pumpCoreRaw, setPumpCore] = useURLState("pumpCore", 200); // µm
  const [pumpCladRaw, setPumpClad] = useURLState("pumpClad", 220); // µm
  const [pumpNARaw, setPumpNA] = useURLState("pumpNA", 0.22);
  const [outDiaRaw, setOutDia] = useURLState("outputDiameter", 400); // µm, pump guide (inner cladding)
  const [outNARaw, setOutNA] = useURLState("outputNA", 0.46);

  const N = Math.round(clamp(portsRaw, 1, 100));
  const signalPort = signalPortRaw !== "no";
  const P = clamp(powerRaw, 0, 10000);
  const eta = clamp(effRaw, 0, 100) / 100;
  const signalIL = clamp(signalILRaw, 0, 20);
  const pumpClad_um = clamp(pumpCladRaw, 1, 2000);
  const pumpCore_um = clamp(pumpCoreRaw, 1, pumpClad_um);
  const pumpNA = clamp(pumpNARaw, 0.01, 1);
  const outDia_um = clamp(outDiaRaw, 1, 5000);
  const outNA = clamp(outNARaw, 0.01, 1);

  const calc = useMemo(() => {
    const totalFibres = N + (signalPort ? 1 : 0);
    const bundle = hexBundleDiameter(totalFibres, pumpClad_um * 1e-6);
    const taperRatio = Math.max(1, bundle / (outDia_um * 1e-6));
    const naTaper = taperedPumpNA(pumpNA, bundle, outDia_um * 1e-6);
    const U = combinerEtendueRatio(N, pumpCore_um * 1e-6, pumpNA, outDia_um * 1e-6, outNA);
    const gPump = fiberEtendue(pumpCore_um * 1e-6, pumpNA) * 1e6; // mm²·sr
    const gOut = fiberEtendue(outDia_um * 1e-6, outNA) * 1e6;
    const pIn = N * P, pOut = pIn * eta;
    return {
      bundle, taperRatio, naTaper, U, pIn, pOut,
      maxPorts: Math.floor(1 / combinerEtendueRatio(1, pumpCore_um * 1e-6, pumpNA, outDia_um * 1e-6, outNA) + 1e-9),
      bIn: P / gPump, bOut: pOut / gOut,
      signalT: 10 ** (-signalIL / 10),
      taperOK: naTaper <= outNA, etendueOK: U <= 1,
    };
  }, [N, signalPort, P, eta, signalIL, pumpCore_um, pumpClad_um, pumpNA, outDia_um, outNA]);

  const chartData = useMemo(() => {
    const ports = Array.from({ length: Math.max(36, N + 5) }, (_, i) => i + 1);
    const out = outDia_um * 1e-6;
    const taper = ports.map(n => Math.min(1, taperedPumpNA(pumpNA, hexBundleDiameter(n + (signalPort ? 1 : 0), pumpClad_um * 1e-6), out)));
    // NA the output guide needs if only the pump étendue counts: NA_out·√U.
    const ideal = ports.map(n => outNA * Math.sqrt(combinerEtendueRatio(n, pumpCore_um * 1e-6, pumpNA, out, outNA)));
    return [
      { x: ports, y: taper, type: "scatter" as const, mode: "lines+markers" as const, name: "Pump NA after taper (capped at 1)", line: { color: "#f59e0b", width: 2, shape: "hv" as const } },
      { x: ports, y: ideal, type: "scatter" as const, mode: "lines" as const, name: "Étendue limit (cores only)", line: { color: "#60a5fa", width: 2 } },
      { x: ports, y: ports.map(() => outNA), type: "scatter" as const, mode: "lines" as const, name: "Output NA", line: { color: "#9ca3af", width: 1, dash: "dash" } },
    ];
  }, [pumpNA, pumpCore_um, pumpClad_um, outDia_um, outNA, signalPort, N]);

  const ok = (b: boolean) => (b ? "text-green-400" : "text-red-400");

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedNumberInput label="Pump Ports N" value={portsRaw} onChange={setNumPumpPorts} min={1} max={100} />
            <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
              <span className="text-sm text-gray-300">Centre Signal Fibre</span>
              <select value={signalPort ? "yes" : "no"} onChange={e => setSignalPort(e.target.value)}
                className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
                <option value="yes">Yes, (N+1)×1</option>
                <option value="no">No, N×1</option>
              </select>
            </label>
            <ValidatedNumberInput label="Pump Power per Port (W)" value={powerRaw} onChange={setPumpPowerPerPort} min={0} max={10000} step="any" />
            <ValidatedNumberInput label="Pump Transmission (%)" value={effRaw} onChange={setCombinerEfficiency} min={0} max={100} step="any" />
            <ValidatedNumberInput label="Pump Fibre Core Ø (µm)" value={pumpCoreRaw} onChange={setPumpCore} min={1} max={2000} step="any" />
            <ValidatedNumberInput label="Pump Fibre Cladding Ø (µm)" value={pumpCladRaw} onChange={setPumpClad} min={1} max={2000} step="any" />
            <ValidatedNumberInput label="Pump Fibre NA" value={pumpNARaw} onChange={setPumpNA} min={0.01} max={1} step="any" />
            <ValidatedNumberInput label="Signal Insertion Loss (dB)" value={signalILRaw} onChange={setSignalInsertionLoss} min={0} max={20} step="any" />
            <ValidatedNumberInput label="Output Pump-Guide Ø (µm)" value={outDiaRaw} onChange={setOutDia} min={1} max={5000} step="any" />
            <ValidatedNumberInput label="Output Pump-Guide NA" value={outNARaw} onChange={setOutNA} min={0.01} max={1} step="any" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Results</h2>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-400">Total pump input:</span><span className="font-mono">{calc.pIn.toFixed(1)} W</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Combined pump output:</span><span className="font-mono text-green-400 text-lg">{calc.pOut.toFixed(1)} W</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Lost in combiner:</span><span className="font-mono text-red-400">{(calc.pIn - calc.pOut).toFixed(1)} W</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Étendue used N·(d·NA)²/(D·NA)²:</span><span className={`font-mono ${ok(calc.etendueOK)}`}>{(calc.U * 100).toFixed(1)} %</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Ideal port limit (étendue):</span><span className="font-mono">{calc.maxPorts}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Bundle Ø before taper:</span><span className="font-mono">{(calc.bundle * 1e6).toFixed(0)} µm</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Taper ratio:</span><span className="font-mono">{calc.taperRatio.toFixed(3)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Pump NA after taper:</span><span className={`font-mono ${ok(calc.taperOK)}`}>{calc.naTaper > 1 ? "> 1 (unguided)" : `${calc.naTaper.toFixed(3)} ${calc.taperOK ? "≤" : ">"} ${outNA}`}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Pump brightness in / out:</span><span className="font-mono">{calc.bIn.toExponential(2)} / {calc.bOut.toExponential(2)} W/(mm²·sr)</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Signal transmission:</span><span className="font-mono">{(calc.signalT * 100).toFixed(2)} %</span></div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
            <p className="font-mono text-sm">P_out = N·P_port·η</p>
            <p className="font-mono text-sm mt-1">Étendue: N·(d_p·NA_p)² ≤ (D_out·NA_out)²</p>
            <p className="font-mono text-sm mt-1">Hex bundle Ø = (2n + 1)·d_clad; taper ratio TR = max(1, Ø/D_out)</p>
            <p className="font-mono text-sm mt-1">NA after taper = NA_p·TR ≤ NA_out</p>
            <p className="text-xs text-gray-400 mt-2">
              The taper test includes the cladding and packing gaps, so it is stricter than the étendue bound.
              The signal fibre is taken with the pump cladding Ø.
              The bundle diameter (2n + 1)·d assumes full hexagonal rings around a centre fibre, so for 2–4 fibres without
              a centre fibre it overstates the bundle (N = 2: 3d vs 2d) and the taper NA, which errs on the safe side.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
        <ChartPanel data={chartData} layout={{
          title: "Pump NA vs Number of Ports",
          xaxis: { title: "Pump Ports N", gridcolor: "#374151" },
          yaxis: { title: "NA", gridcolor: "#374151", rangemode: "tozero" },
          paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
          font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
        }} />
      </div>
    </>
  );
}
