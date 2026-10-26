"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { secrecyCapacity } from "../../../physics/free-space-comms/channel-capacity";
import { divergenceHalfAngle } from "../../../physics/wave-optics/gaussian-beam";
import {
  capturedPower, linkSecurity, nepLimitedSnr, type SecurityInputs,
} from "../../../physics/free-space-comms/physical-layer-security";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const dBm = (w: number) => (w > 0 ? 10 * Math.log10(w * 1e3) : NaN);
const dB = (x: number) => (x > 0 ? 10 * Math.log10(x) : NaN);

export default function SecurityPage() {
  const [txPowerRaw, setTxPower] = useURLState("txPower", 10); // dBm
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 1550); // nm
  const [txBeamRaw, setTxBeam] = useURLState("txBeam", 5); // mm, 1/e² diameter at the waist
  const [rangeRaw, setRange] = useURLState("linkRange", 1); // km
  const [rxApertureRaw, setRxAperture] = useURLState("rxAperture", 10); // cm
  const [eveDistanceRaw, setEveDistance] = useURLState("eveDistance", 1000); // m
  const [eveOffsetRaw, setEveOffset] = useURLState("eveOffset", 0.3); // m
  const [eveApertureRaw, setEveAperture] = useURLState("eveAperture", 10); // cm
  const [nepRaw, setNep] = useURLState("nep", 20); // pW/√Hz
  const [bandwidthRaw, setBandwidth] = useURLState("bandwidth", 1); // GHz

  const inputs: SecurityInputs = useMemo(() => ({
    power: 1e-3 * 10 ** (clamp(txPowerRaw, -60, 60, 10) / 10),
    lambda: clamp(wavelengthRaw, 100, 20000, 1550) * 1e-9,
    waist: (clamp(txBeamRaw, 0.01, 10000, 5) * 1e-3) / 2,
    range: clamp(rangeRaw, 1e-6, 1e5, 1) * 1e3,
    bobAperture: clamp(rxApertureRaw, 0.01, 1000, 10) * 1e-2,
    // Eve between the transmitter and Bob; beyond Bob his aperture would shadow the axis.
    eveDistance: Math.min(clamp(eveDistanceRaw, 0, 1e8, 1000), clamp(rangeRaw, 1e-6, 1e5, 1) * 1e3),
    eveOffset: clamp(eveOffsetRaw, 0, 1e6, 0.3),
    eveAperture: clamp(eveApertureRaw, 0.01, 1000, 10) * 1e-2,
    nep: clamp(nepRaw, 1e-6, 1e9, 20) * 1e-12,
    bandwidth: clamp(bandwidthRaw, 1e-9, 1e4, 1) * 1e9,
  }), [txPowerRaw, wavelengthRaw, txBeamRaw, rangeRaw, rxApertureRaw, eveDistanceRaw, eveOffsetRaw, eveApertureRaw, nepRaw, bandwidthRaw]);

  const r = useMemo(() => linkSecurity(inputs), [inputs]);
  const divergence = 2 * divergenceHalfAngle({ lambda: inputs.lambda, w0: inputs.waist }); // full angle, rad

  const plotData = useMemo(() => {
    const span = Math.max(4 * r.eveBeamRadius, 2 * inputs.eveOffset, 1e-3);
    const offsets = Array.from({ length: 81 }, (_, i) => (span * i) / 80);
    // Only Eve changes along the chart; Bob is computed once.
    const runs = offsets.map((o) => {
      const evePower = capturedPower(inputs.power, inputs.lambda, inputs.waist, inputs.eveDistance, o, inputs.eveAperture);
      return { evePower, secrecy: secrecyCapacity(inputs.bandwidth, r.snrBob, nepLimitedSnr(evePower, inputs.nep, inputs.bandwidth)) };
    });
    return [
      { x: offsets, y: runs.map((s) => { const v = dBm(s.evePower); return Number.isFinite(v) ? v : null; }), type: "scatter", mode: "lines", name: "Eve power (dBm)", line: { color: "#f43f5e" } },
      { x: [0, span], y: [dBm(r.bobPower), dBm(r.bobPower)], type: "scatter", mode: "lines", name: "Bob power (dBm)", line: { color: "#22c55e", dash: "dash" } },
      { x: offsets, y: runs.map((s) => s.secrecy / 1e9), type: "scatter", mode: "lines", name: "Secrecy capacity (Gb/s)", line: { color: "#f59e0b" }, yaxis: "y2" },
    ];
  }, [inputs, r]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="TX Power (dBm)" value={txPowerRaw} onChange={setTxPower} min={-60} max={60} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={100} max={20000} step="any" />
        <ValidatedNumberInput label="TX Beam Diameter, 1/e² (mm)" value={txBeamRaw} onChange={setTxBeam} min={0.01} max={10000} step="any" />
        <ValidatedNumberInput label="Bob's Range (km)" value={rangeRaw} onChange={setRange} min={0.000001} max={1e5} step="any" />
        <ValidatedNumberInput label="Bob's Aperture (cm)" value={rxApertureRaw} onChange={setRxAperture} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Eve's Distance from TX (m, at most Bob's range)" value={eveDistanceRaw} onChange={setEveDistance} min={0} max={1e8} step="any" />
        <ValidatedNumberInput label="Eve's Offset from the Beam Axis (m)" value={eveOffsetRaw} onChange={setEveOffset} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="Eve's Aperture (cm)" value={eveApertureRaw} onChange={setEveAperture} min={0.01} max={1000} step="any" />
        <ValidatedNumberInput label="Receiver NEP (pW/√Hz, both)" value={nepRaw} onChange={setNep} min={0.000001} max={1e9} step="any" />
        <ValidatedNumberInput label="Electrical Bandwidth (GHz)" value={bandwidthRaw} onChange={setBandwidth} min={1e-9} max={1e4} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Bob's received power" value={`${fmt(dBm(r.bobPower))} dBm`} tone="green" subtext={`beam radius ${fmt(r.bobBeamRadius)} m at Bob`} />
        <ResultCard label="Eve's received power" value={r.evePower > 0 ? `${fmt(dBm(r.evePower))} dBm` : "0 (outside the beam)"} tone="red" subtext={`beam radius ${fmt(r.eveBeamRadius)} m at Eve`} />
        <ResultCard label="Bob / Eve power ratio" value={r.evePower > 0 ? `${fmt(dB(r.bobPower / r.evePower))} dB` : "∞"} tone="purple" subtext="optical power" />
        <ResultCard label="SNR Bob / Eve" value={`${fmt(dB(r.snrBob))} / ${r.snrEve > 0 ? fmt(dB(r.snrEve)) : "−∞"} dB`} tone="blue" subtext="(P / (NEP·√B))²" />
        <ResultCard label="Secrecy capacity" value={`${fmt(r.secrecy / 1e9)} Gb/s`} tone="yellow" subtext={`${fmt(r.secrecy / inputs.bandwidth)} bit/s/Hz × B`} />
        <ResultCard label="Beam divergence" value={`${fmt(divergence * 1e3)} mrad`} tone="gray" subtext="full angle 2λ/(πw₀)" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-2">Eve&apos;s power and the secrecy capacity vs her offset from the beam axis</h2>
        <ChartPanel data={plotData} layout={{
          xaxis: { title: "Eve's offset (m)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Received power (dBm)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis2: { title: "Secrecy capacity (Gb/s)", color: "#f59e0b", gridcolor: "#374151", overlaying: "y", side: "right" },
          margin: { l: 60, r: 60, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
          legend: { x: 0.4, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-sm text-gray-400 space-y-2">
        <p>
          Each receiver collects the part of the Gaussian beam (radius w(z) = w₀√(1 + (z/z_R)²)) that falls on its aperture,
          computed exactly, so no receiver gets more than the transmitted power even in the near field. Eve is assumed not
          to block Bob&apos;s beam.
        </p>
        <p>
          Secrecy capacity of the Gaussian wiretap channel: C_s = B[log₂(1 + SNR_B) − log₂(1 + SNR_E)]⁺ (Leung-Yan-Cheong
          and Hellman, 1978), with SNR = (P/(NEP·√B))² for receivers limited by the same amplifier noise. This is an
          illustration of why a narrow beam is hard to tap; an intensity-modulated link is not a Gaussian channel, and the
          figure is not a security guarantee.
        </p>
      </div>
    </>
  );
}
