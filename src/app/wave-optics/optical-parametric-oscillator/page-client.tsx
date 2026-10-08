"use client";
import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
import ValidatedNumberInput from "../../../components/validated-number-input";
import {
  idlerWavelength, parametricGainCoefficient, phaseMismatch, sroThresholdGainLength, sroThresholdIntensity,
  walkOffApertureLength,
} from "../../../physics/wave-optics/optical-parametric-oscillator";

const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)} ${unit}` : "—");
const fmtPower = (P: number) =>
  !Number.isFinite(P) ? "—" : P < 1 ? `${(P * 1e3).toFixed(1)} mW` : P < 1000 ? `${P.toFixed(2)} W` : `${(P / 1000).toFixed(2)} kW`;

export default function OPOCalculator() {
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 532); // nm
  const [signalWavelength, setSignalWavelength] = useURLState("signalWavelength", 800); // nm
  const [crystalLength, setCrystalLength] = useURLState("crystalLength", 20); // mm
  const [dEff, setDEff] = useURLState("dEff", 2.0); // pm/V
  const [nPump, setNPump] = useURLState("nPump", 1.65);
  const [nSignal, setNSignal] = useURLState("nSignal", 1.53);
  const [nIdler, setNIdler] = useURLState("nIdler", 1.53);
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 5); // W
  const [beamRadius, setBeamRadius] = useURLState("beamRadius", 50); // µm
  const [walkOff, setWalkOff] = useURLState("walkOff", 0.5); // deg
  const [cavityLoss, setCavityLoss] = useURLState("cavityLoss", 3); // % per round trip

  const process = useMemo(
    () => ({ lambdaPump: pumpWavelength * 1e-9, lambdaSignal: signalWavelength * 1e-9, dEff: dEff * 1e-12, nPump, nSignal, nIdler }),
    [pumpWavelength, signalWavelength, dEff, nPump, nSignal, nIdler],
  );
  const w = beamRadius * 1e-6;
  const area = Math.PI * w * w;
  const apertureLength = walkOffApertureLength(w, (walkOff * Math.PI) / 180);

  const r = useMemo(() => {
    const Leff = Math.min(crystalLength * 1e-3, apertureLength);
    const intensity = pumpPower / area;
    const g = parametricGainCoefficient(process, intensity);
    const gThL = sroThresholdGainLength(cavityLoss / 100);
    const Pth = sroThresholdIntensity(process, Leff, cavityLoss / 100) * area;
    const dk = phaseMismatch(process);
    return {
      lambdaIdler_nm: idlerWavelength(process.lambdaPump, process.lambdaSignal) * 1e9,
      intensity, g, Leff, gL: g * Leff, gThL, Pth, dk,
      singlePassGain: Math.cosh(g * Leff) ** 2 - 1,
    };
  }, [process, crystalLength, pumpPower, area, apertureLength, cavityLoss]);

  const valid = Number.isFinite(r.g) && Number.isFinite(r.Pth);

  const gainVsLength = useMemo(() => {
    const lengths = Array.from({ length: 99 }, (_, i) => 1 + i * 0.5);
    return { x: lengths, y: lengths.map((L) => parametricGainCoefficient(process, pumpPower / area) * Math.min(L * 1e-3, apertureLength)) };
  }, [process, pumpPower, area, apertureLength]);

  const gainVsPower = useMemo(() => {
    const Pmax = 2 * Math.max(pumpPower, Number.isFinite(r.Pth) ? r.Pth : 0);
    const powers = Array.from({ length: 101 }, (_, i) => (i * Pmax) / 100);
    return { x: powers, y: powers.map((P) => parametricGainCoefficient(process, P / area) * r.Leff) };
  }, [process, pumpPower, area, r.Pth, r.Leff]);

  const finite = (d: { x: number[]; y: number[] }) => {
    const keep = d.y.map(Number.isFinite);
    return { x: d.x.filter((_, i) => keep[i]), y: d.y.filter((_, i) => keep[i]) };
  };
  const thresholdLine = (xs: number[]) => ({
    x: Number.isFinite(r.gThL) ? [xs[0], xs[xs.length - 1]] : [], y: Number.isFinite(r.gThL) ? [r.gThL, r.gThL] : [], type: "scatter", mode: "lines",
    line: { color: "#f87171", width: 1.5, dash: "dash" }, name: "SRO threshold",
  });

  const darkPlot = { paper_bgcolor: "#0a0a0a", plot_bgcolor: "#111", font: { color: "#ccc" } };
  const axisStyle = { gridcolor: "#333", zerolinecolor: "#444", color: "#ccc" };
  const qpmPeriod_um = (2 * Math.PI) / Math.abs(r.dk) * 1e6;

  return (
    <>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
        <h3 className="text-cyan-400 font-semibold mb-2">Key Equations</h3>
        <p className="font-mono text-gray-400 text-sm leading-relaxed">
          ωₚ = ωₛ + ωᵢ &nbsp;|&nbsp; λᵢ = λₚ·λₛ / (λₛ − λₚ)<br />
          g² = 2ωₛωᵢ d_eff² Iₚ / (nₚnₛnᵢ ε₀ c³), &nbsp; Iₚ = P/(πw²)<br />
          L_eff = min(L, √π·w/ρ) &nbsp;|&nbsp; single-pass signal gain cosh²(g·L_eff) − 1<br />
          SRO threshold: cosh²(g·L_eff)·(1 − α) = 1 &nbsp;(g·L_eff ≈ √α)<br />
          Δk = kₚ − kₛ − kᵢ &nbsp;|&nbsp; QPM period Λ = 2π/|Δk|
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Plane-wave estimate (Boyd, Nonlinear Optics §2.8–2.9): perfect phase matching assumed, no pump depletion,
          no focusing optimisation (Boyd–Kleinman). α is the signal&apos;s round-trip power loss, output coupling included;
          the idler is not resonated.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h3 className="text-orange-400 font-semibold mb-4">Parameters</h3>

            <ValidatedNumberInput label="Pump λ (nm)" value={pumpWavelength} onChange={setPumpWavelength} min={200} max={5000} />
            <ValidatedNumberInput label="Signal λ (nm)" value={signalWavelength} onChange={setSignalWavelength} min={201} max={20000} />
            <ValidatedNumberInput label="Crystal Length (mm)" value={crystalLength} onChange={setCrystalLength} min={0.1} max={200} />
            <ValidatedNumberInput label="d_eff (pm/V)" value={dEff} onChange={setDEff} min={0.01} max={100} />

            <p className="text-xs text-gray-500 mb-2">Refractive Indices</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <ValidatedNumberInput label="nₚ" value={nPump} onChange={setNPump} min={1} max={5} />
              <ValidatedNumberInput label="nₛ" value={nSignal} onChange={setNSignal} min={1} max={5} />
              <ValidatedNumberInput label="nᵢ" value={nIdler} onChange={setNIdler} min={1} max={5} />
            </div>

            <ValidatedNumberInput label="Pump Power (W)" value={pumpPower} onChange={setPumpPower} min={0} max={1e6} />
            <ValidatedNumberInput label="Beam Radius (μm)" value={beamRadius} onChange={setBeamRadius} min={1} max={10000} />
            <ValidatedNumberInput label="Walk-off (deg)" value={walkOff} onChange={setWalkOff} min={0} max={10} />
            <ValidatedNumberInput label="Signal round-trip loss (%)" value={cavityLoss} onChange={setCavityLoss} min={0.01} max={99} step="0.5" />
          </div>
        </div>

        <div className="md:col-span-8">
          {!valid && (
            <p className="mb-4 text-sm text-yellow-300" role="status">
              No result: the signal wavelength must be longer than the pump wavelength.
            </p>
          )}
          <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
            <h3 className="text-orange-400 font-semibold mb-3">Results</h3>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Idler λ", fmt(r.lambdaIdler_nm, 1, "nm")],
                  ["Pump intensity P/(πw²)", fmt(r.intensity / 1e4 / 1e6, 3, "MW/cm²")],
                  ["Gain coefficient g", fmt(r.g, 2, "m⁻¹")],
                  ["Walk-off aperture length √π·w/ρ", Number.isFinite(apertureLength) ? fmt(apertureLength * 1e3, 2, "mm") : "∞ (no walk-off)"],
                  ["Effective length L_eff", fmt(r.Leff * 1e3, 2, "mm")],
                  ["g·L_eff", fmt(r.gL, 4, "")],
                  ["Single-pass signal gain", fmt(r.singlePassGain * 100, 2, "%")],
                  ["SRO threshold (g·L_eff)", fmt(r.gThL, 4, "")],
                  ["SRO threshold pump power", fmtPower(r.Pth)],
                  ["Above threshold?", valid ? (pumpPower > r.Pth ? `Yes (${(pumpPower / r.Pth).toFixed(2)}× threshold)` : `No (${(pumpPower / r.Pth).toFixed(3)}× threshold)`) : "—"],
                  ["Phase mismatch Δk (with these indices)", fmt(r.dk / 1e3, 2, "mm⁻¹")],
                  ["First-order QPM period 2π/|Δk|", Number.isFinite(qpmPeriod_um) ? fmt(qpmPeriod_um, 2, "µm") : "— (Δk = 0)"],
                ].map(([label, val], i) => (
                  <tr key={i}>
                    <td className="text-gray-500 py-1">{label}</td>
                    <td className="text-gray-200 font-semibold">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartPanel
              data={[{ ...finite(gainVsLength), type: "scatter", mode: "lines", line: { color: "#00e5ff", width: 2 }, name: "g·L_eff" }, thresholdLine(gainVsLength.x)]}
              layout={{ ...darkPlot, title: { text: "g·L_eff vs Crystal Length", font: { color: "#ccc" } }, xaxis: { ...axisStyle, title: "Length (mm)" }, yaxis: { ...axisStyle, title: "g·L_eff" }, margin: { t: 40, b: 40 } }}
            />
            <ChartPanel
              data={[{ ...finite(gainVsPower), type: "scatter", mode: "lines", line: { color: "#ff9100", width: 2 }, name: "g·L_eff" }, thresholdLine(gainVsPower.x)]}
              layout={{ ...darkPlot, title: { text: "g·L_eff vs Pump Power", font: { color: "#ccc" } }, xaxis: { ...axisStyle, title: "Power (W)" }, yaxis: { ...axisStyle, title: "g·L_eff" }, margin: { t: 40, b: 40 } }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
