"use client";

import { useState } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { fix } from "../../../components/polarization-format";
import {
  POLARIZER_IDS,
  POLARIZERS,
  coversWavelength,
  polarizerFigures,
  type PolarizerSpec,
} from "../../../physics/polarization/polarizer-types";

const NM = 1e-9;
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
/** Power in mW: fixed above 0.01, scientific below; "—" when unknown. */
const mW = (v: number) => (!Number.isFinite(v) ? "—" : v >= 0.01 || v === 0 ? fix(v, 3) : v.toExponential(2));
const range = (s: PolarizerSpec) =>
  s.lambdaMin_nm === s.lambdaMax_nm
    ? `${s.lambdaMin_nm} nm`
    : s.lambdaMax_nm >= 10_000
      ? `${s.lambdaMin_nm / 1000}–${s.lambdaMax_nm / 1000} µm`
      : `${s.lambdaMin_nm}–${s.lambdaMax_nm} nm`;

type Input = "aligned" | "unpolarized";
const INPUTS: Record<Input, string> = {
  aligned: "Linear, along the pass axis",
  unpolarized: "Unpolarized",
};
const isInput = (v: string): v is Input => v in INPUTS;

export default function PolarizerTypesPage() {
  const [selected, setSelected] = useState<string[]>(POLARIZER_IDS);
  const [powerIn, setPower] = useURLState("inputPower", 10); // mW
  const [wavelengthIn, setWavelength] = useURLState("wavelength", 1064); // nm
  const [inputIn, setInput] = useURLState("input", "aligned");

  // useURLState doesn't clamp: keep URL values inside the input ranges.
  const P = clamp(powerIn, 0, 1e6);
  const lambda = clamp(wavelengthIn, 100, 50_000) * NM;
  const input: Input = isInput(inputIn) ? inputIn : "aligned";

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((n) => n !== id) : [...s, id]));

  const rows = POLARIZER_IDS.filter((id) => selected.includes(id)).map((id) => {
    const spec = POLARIZERS[id];
    const f = polarizerFigures(spec);
    // Aligned linear input: k₁ passes, and k₂ with the polarizer turned 90°. Unpolarized: (k₁ + k₂)/2 passes, of which
    // k₂/2 is the blocked polarization.
    const out = input === "aligned" ? P * f.k1 : P * f.tUnpolarized;
    const leak = input === "aligned" ? P * f.k2 : (P * f.k2) / 2;
    return { id, spec, f, out, leak, covers: coversWavelength(spec, lambda) };
  });

  const erChart = [
    {
      x: rows.map((r) => r.spec.name),
      y: rows.map((r) => Number(r.f.erDb.toFixed(2))),
      text: rows.map((r) => `${r.spec.er.toLocaleString("en-US")}:1`),
      type: "bar" as const,
      marker: { color: rows.map((r) => (r.covers ? "#3b82f6" : "#4b5563")) },
      name: "ER",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Inputs</h2>
          <div className="space-y-3">
            <ValidatedNumberInput label="Input power (mW)" value={powerIn} onChange={setPower} min={0} max={1e6} step="any" />
            <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthIn} onChange={setWavelength} min={100} max={50000} step="1" />
            <label className="block text-sm text-gray-300">
              Input polarization
              <select
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="mt-1 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
              >
                {(Object.keys(INPUTS) as Input[]).map((k) => (
                  <option key={k} value={k}>
                    {INPUTS[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <h3 className="text-sm font-semibold mb-2 mt-5">Polarizers</h3>
          <div className="space-y-1">
            {POLARIZER_IDS.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} className="accent-blue-500" />
                {POLARIZERS[id].name}
                {!coversWavelength(POLARIZERS[id], lambda) && <span className="text-xs text-gray-500">(not at {fix(lambda / NM, 0)} nm)</span>}
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-1">Extinction ratio (dB)</h2>
          <p className="text-xs text-gray-400 mb-3">
            Catalogue minimum, 10·log₁₀(k₁/k₂). Grey bars: the type&apos;s range doesn&apos;t include {fix(lambda / NM, 0)} nm.
          </p>
          {rows.length > 0 ? (
            <ChartPanel
              data={erChart}
              layout={{ height: 260, margin: { t: 20, b: 90, l: 55, r: 10 }, xaxis: { tickangle: -40 }, yaxis: { title: "ER (dB)" } }}
            />
          ) : (
            <p className="text-sm text-gray-400">Select at least one polarizer.</p>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-1">Comparison</h2>
        <p className="text-xs text-gray-400 mb-3">
          {input === "aligned"
            ? "Output: P·k₁. Leakage: P·k₂, with the polarizer turned 90° to the input."
            : "Output: P·(k₁ + k₂)/2. Leakage: P·k₂/2, the blocked polarization in the output."}{" "}
          Both use the stated minima, so the output is a lower bound and the leakage an upper bound. &quot;—&quot;: the vendor
          states no transmission (plots only) or no damage threshold.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700 text-left">
                <th className="py-2 px-2">Type (item)</th>
                <th className="py-2 px-2">Range</th>
                <th className="py-2 px-2 text-right">ER</th>
                <th className="py-2 px-2 text-right">DOP, unpol. in</th>
                <th className="py-2 px-2 text-right">Stated T</th>
                <th className="py-2 px-2 text-right">Output (mW)</th>
                <th className="py-2 px-2 text-right">Leakage (mW)</th>
                <th className="py-2 px-2 text-right">Aperture</th>
                <th className="py-2 px-2">Pulsed LIDT</th>
                <th className="py-2 px-2">CW LIDT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ id, spec, f, out, leak, covers }) => (
                <tr key={id} className={`border-b border-gray-800 align-top ${covers ? "" : "text-gray-500"}`}>
                  <td className="py-2 px-2">
                    <a href={spec.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-400 hover:underline">
                      {spec.name}
                    </a>
                    <div className="text-xs text-gray-400">
                      {spec.item}, {spec.material}
                      {spec.outputs === 2 ? ", two outputs" : ""}
                    </div>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    {range(spec)}
                    {!covers && <div className="text-xs">outside</div>}
                  </td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    {spec.er.toLocaleString("en-US")}:1
                    <div className="text-xs text-gray-400">{fix(f.erDb, 1)} dB</div>
                    {spec.erNote && <div className="text-xs text-gray-400">{spec.erNote}</div>}
                  </td>
                  <td className="py-2 px-2 text-right">{fix(f.dop, 6)}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    {spec.tPass !== undefined
                      ? `Tp > ${fix(spec.tPass * 100, 0)} %`
                      : spec.tUnpolarized !== undefined
                        ? `${fix(spec.tUnpolarized * 100, 0)} % unpol.`
                        : "—"}
                  </td>
                  <td className="py-2 px-2 text-right">{mW(out)}</td>
                  <td className="py-2 px-2 text-right">{mW(leak)}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    {spec.apertureShape === "round" ? "Ø" : ""}
                    {spec.aperture_mm} mm{spec.apertureShape === "square" ? " sq." : ""}
                  </td>
                  <td className="py-2 px-2 text-xs">
                    {spec.pulsed
                      ? `${spec.pulsed.fluence_J_cm2} J/cm² (${spec.pulsed.lambda_nm} nm, ${spec.pulsed.pulse_ns} ns, ${spec.pulsed.rate_Hz} Hz)`
                      : "—"}
                  </td>
                  <td className="py-2 px-2 text-xs">{spec.cw ? `${spec.cw.linear_W_cm} W/cm (${spec.cw.lambda_nm} nm)` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Thorlabs catalogue values for one product family per type, read 2026-10-23. Damage thresholds hold only at their
          test wavelength and pulse length; CW thresholds are linear power densities (power ÷ beam diameter).
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>ER = k₁/k₂, &nbsp;ER (dB) = 10·log₁₀(k₁/k₂)</p>
          <p>Aligned linear input: output P·k₁; turned 90°: P·k₂</p>
          <p>Unpolarized input: output P·(k₁ + k₂)/2, DOP = (k₁ − k₂)/(k₁ + k₂) = (ER − 1)/(ER + 1)</p>
          <p>Stated unpolarized T: k₁ = 2T/(1 + 1/ER)</p>
        </div>
      </div>
    </>
  );
}
