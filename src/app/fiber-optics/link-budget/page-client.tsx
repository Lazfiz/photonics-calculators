"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { linkBudget } from "../../../physics/fiber-optics/link-budget";

const fmt = (x: number, digits: number, unit = "") =>
  x === Infinity ? "∞" : Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—";
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export default function LinkBudgetPage() {
  const [txIn, setTx] = useURLState("txPower", 0); // dBm
  const [rxIn, setRx] = useURLState("rxSensitivity", -28); // dBm
  const [lengthIn, setLength] = useURLState("fiberLength", 50); // km
  const [lossIn, setLoss] = useURLState("fiberAttenuation", 0.2); // dB/km
  const [splicesIn, setSplices] = useURLState("spliceCount", 10);
  const [spliceLossIn, setSpliceLoss] = useURLState("spliceLoss", 0.1); // dB each
  const [connectorsIn, setConnectors] = useURLState("connectorCount", 2);
  const [connectorLossIn, setConnectorLoss] = useURLState("connectorLoss", 0.5); // dB each
  const [marginIn, setMargin] = useURLState("margin", 3); // dB required system margin

  const p = {
    txPowerDbm: clamp(txIn, -40, 40),
    rxSensitivityDbm: clamp(rxIn, -70, 10),
    lengthKm: clamp(lengthIn, 0, 20000),
    fiberLossDbPerKm: clamp(lossIn, 0, 20),
    splices: Math.round(clamp(splicesIn, 0, 1000)),
    spliceLossDb: clamp(spliceLossIn, 0, 10),
    connectors: Math.round(clamp(connectorsIn, 0, 100)),
    connectorLossDb: clamp(connectorLossIn, 0, 10),
    marginDb: clamp(marginIn, 0, 50),
  };
  const { txPowerDbm, rxSensitivityDbm, lengthKm, fiberLossDbPerKm, splices, spliceLossDb, connectors, connectorLossDb, marginDb } = p;

  const b = useMemo(
    () => linkBudget({ txPowerDbm, rxSensitivityDbm, lengthKm, fiberLossDbPerKm, splices, spliceLossDb, connectors, connectorLossDb, marginDb }),
    [txPowerDbm, rxSensitivityDbm, lengthKm, fiberLossDbPerKm, splices, spliceLossDb, connectors, connectorLossDb, marginDb],
  );
  const closes = b.excessMarginDb >= 0;

  // Power-level diagram: a connector at each end (extra connectors and the splices evenly spaced), fibre loss in between.
  const chartData = useMemo(() => {
    const L = lengthKm;
    const events: { z: number; loss: number }[] = [];
    if (connectors >= 1) events.push({ z: 0, loss: connectorLossDb });
    if (connectors >= 2) events.push({ z: L, loss: connectorLossDb });
    for (let i = 1; i <= connectors - 2; i++) events.push({ z: (i * L) / (connectors - 1), loss: connectorLossDb });
    for (let i = 1; i <= splices; i++) events.push({ z: (i * L) / (splices + 1), loss: spliceLossDb });
    events.sort((u, v) => u.z - v.z);
    const x: number[] = [0], y: number[] = [txPowerDbm];
    let level = txPowerDbm, z0 = 0;
    for (const e of events) {
      level -= fiberLossDbPerKm * (e.z - z0);
      x.push(e.z, e.z);
      y.push(level, level - e.loss);
      level -= e.loss;
      z0 = e.z;
    }
    level -= fiberLossDbPerKm * (L - z0);
    x.push(L);
    y.push(level);
    const span = [0, Math.max(L, 1e-3)];
    return [
      { x, y, type: "scatter" as const, mode: "lines" as const, name: "Signal power", line: { color: closes ? "#34d399" : "#f87171", width: 2 } },
      { x: span, y: [rxSensitivityDbm + marginDb, rxSensitivityDbm + marginDb], type: "scatter" as const, mode: "lines" as const, name: "Sensitivity + margin", line: { color: "#a78bfa", dash: "dash" } },
      { x: span, y: [rxSensitivityDbm, rxSensitivityDbm], type: "scatter" as const, mode: "lines" as const, name: "Rx sensitivity", line: { color: "#60a5fa", dash: "dot" } },
    ];
  }, [lengthKm, connectors, connectorLossDb, splices, spliceLossDb, txPowerDbm, fiberLossDbPerKm, rxSensitivityDbm, marginDb, closes]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Tx Power (dBm)" value={txIn} onChange={setTx} min={-40} max={40} step="any" />
        <ValidatedNumberInput label="Rx Sensitivity (dBm)" value={rxIn} onChange={setRx} min={-70} max={10} step="any" />
        <ValidatedNumberInput label="Required System Margin (dB)" value={marginIn} onChange={setMargin} min={0} max={50} step="any" />
        <ValidatedNumberInput label="Fiber Length (km)" value={lengthIn} onChange={setLength} min={0} max={20000} step="any" />
        <ValidatedNumberInput label="Fiber Attenuation (dB/km)" value={lossIn} onChange={setLoss} min={0} max={20} step="any" />
        <div />
        <ValidatedNumberInput label="Splices (count)" value={splicesIn} onChange={setSplices} min={0} max={1000} step="1" />
        <ValidatedNumberInput label="Splice Loss (dB each)" value={spliceLossIn} onChange={setSpliceLoss} min={0} max={10} step="any" />
        <div />
        <ValidatedNumberInput label="Connectors (count)" value={connectorsIn} onChange={setConnectors} min={0} max={100} step="1" />
        <ValidatedNumberInput label="Connector Loss (dB each)" value={connectorLossIn} onChange={setConnectorLoss} min={0} max={10} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard
          label="Channel Loss"
          value={fmt(b.channelLossDb, 2, " dB")}
          tone="red"
          subtext={`fibre ${fmt(b.fiberLossDb, 2)} + splices ${fmt(b.spliceLossDb, 2)} + connectors ${fmt(b.connectorLossDb, 2)} dB`}
        />
        <ResultCard label="Received Power" value={fmt(b.receivedPowerDbm, 2, " dBm")} tone="blue" subtext="Tx power − channel loss" />
        <ResultCard
          label="Margin above Sensitivity"
          value={fmt(b.availableMarginDb, 2, " dB")}
          tone={closes ? "green" : "red"}
          subtext={`${closes ? "✓" : "✗"} ${fmt(Math.abs(b.excessMarginDb), 2, " dB")} ${b.excessMarginDb >= 0 ? "more" : "less"} than the ${marginDb} dB required`}
        />
        <ResultCard
          label="Maximum Length"
          value={fmt(b.maxLengthKm, 1, " km")}
          tone="purple"
          subtext={Number.isNaN(b.maxLengthKm) && Number.isFinite(b.receivedPowerDbm)
            ? "doesn't close at any length: splices, connectors and margin alone exceed the power budget"
            : "keeping the margin, same splices and connectors"}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Power Level along the Link</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Distance (km)", gridcolor: "#374151" },
          yaxis: { title: "Power (dBm)", gridcolor: "#374151" },
          margin: { t: 20, r: 30, b: 50, l: 70 }, height: 340, showlegend: false,
        }} />
        <p className="mt-2 text-xs text-gray-400">
          Solid line: signal power from {fmt(txPowerDbm, 1, " dBm")} to {fmt(b.receivedPowerDbm, 2, " dBm")}, with connector and
          splice steps. Dashed violet: sensitivity plus the {marginDb} dB margin. Dotted blue: receiver sensitivity.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">P_tx = P_rx + C_L + M_s    C_L = α_f L + n_c α_con + n_s α_splice</p>
          <p>
            The received power is the transmitter power minus the channel loss. The system margin M_s is not a loss: it is the
            part of the power above the receiver sensitivity kept in reserve for ageing, repairs, temperature and penalties the
            budget doesn&apos;t list. The link closes when P_rx − sensitivity ≥ M_s.
          </p>
          <p className="text-gray-400">
            Not included: dispersion, reflection and other power penalties (add them to the margin), and receiver overload at
            short lengths. The diagram puts one connector at each end and spaces the others and the splices evenly.
          </p>
        </div>
      </div>
    </>
  );
}
