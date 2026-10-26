"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import { rayleighScatteringDbPerKm } from "../../../physics/fiber-optics/silica-attenuation";
import {
  backscatterRatio, captureFraction, dbPerKmToPerM, dynamicRangeDb, fresnelReflectance, noisePower, otdrTrace,
  reflectivePeakDb, twoPointResolution,
} from "../../../physics/fiber-optics/otdr";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const dB = (ratio: number) => 10 * Math.log10(ratio);

export default function OTDRAnalysisPage() {
  const [wavelengthIn, setWavelength] = useURLState("wavelength", 1550); // nm
  const [mfdIn, setMfd] = useURLState("mfd", 10.4); // µm
  const [rayleighAIn, setRayleighA] = useURLState("rayleighA", 0.85); // dB·km⁻¹·µm⁴
  const [lossIn, setLoss] = useURLState("attenuationCoeff", 0.19); // dB/km
  const [nPhaseIn, setNPhase] = useURLState("nPhase", 1.447);
  const [nGroupIn, setNGroup] = useURLState("refractiveIndex", 1.4682); // group index
  const [pulseIn, setPulse] = useURLState("pulseWidth", 100); // ns
  const [lengthIn, setLength] = useURLState("fiberLength", 50); // km
  const [splicesIn, setSplices] = useURLState("numSplices", 5);
  const [spliceLossIn, setSpliceLoss] = useURLState("spliceLoss", 0.1); // dB
  const [launchRIn, setLaunchR] = useURLState("launchReflectance", -45); // dB
  const [peakPowerIn, setPeakPower] = useURLState("peakPower", 20); // dBm
  const [nepIn, setNep] = useURLState("nep", 0.5); // pW/√Hz
  const [averagesIn, setAverages] = useURLState("averages", 65536);

  const wavelength = clamp(wavelengthIn, 800, 1700);
  const mfd = clamp(mfdIn, 2, 30);
  const rayleighA = clamp(rayleighAIn, 0.3, 2);
  const loss = clamp(lossIn, 0.01, 10);
  const nPhase = clamp(nPhaseIn, 1.3, 1.8);
  const nGroup = clamp(nGroupIn, 1.3, 1.8);
  const pulse = clamp(pulseIn, 1, 100000);
  const length = clamp(lengthIn, 0.1, 300);
  const splices = Math.round(clamp(splicesIn, 0, 50));
  const spliceLoss = clamp(spliceLossIn, 0, 5);
  const launchR = clamp(launchRIn, -90, -10);
  const peakPower = clamp(peakPowerIn, -20, 40);
  const nep = clamp(nepIn, 0.001, 1000);
  const averages = Math.round(clamp(averagesIn, 1, 1e8));

  const calc = useMemo(() => {
    const tau = pulse * 1e-9;
    const resolution = twoPointResolution(tau, nGroup);
    const alphaS_dBkm = rayleighScatteringDbPerKm(rayleighA, wavelength * 1e-9);
    const S = captureFraction(wavelength * 1e-9, (mfd * 1e-6) / 2, nPhase);
    const alpha = dbPerKmToPerM(loss);
    const eta1 = backscatterRatio(S, dbPerKmToPerM(alphaS_dBkm), 1e-9, nGroup, alpha);
    const eta = backscatterRatio(S, dbPerKmToPerM(alphaS_dBkm), tau, nGroup, alpha);
    const pbs = 10 ** (peakPower / 10) * 1e-3 * eta; // W
    const pn = noisePower(nep * 1e-12, tau, averages);
    const dr = dynamicRangeDb(pbs, pn);
    const spanLoss = loss * length + splices * spliceLoss;
    const endR = fresnelReflectance(nPhase, 1);
    return {
      resolution, alphaS_dBkm, S, eta1, eta, pbs, pn, dr, spanLoss, endR,
      farEndMargin: dr - spanLoss,
      maxLength: dr > 0 ? dr / loss : NaN,
      endPeak: reflectivePeakDb(endR, eta),
      launchPeak: reflectivePeakDb(10 ** (launchR / 10), eta),
      acquisition: (averages * 2 * nGroup * length * 1e3) / c,
    };
  }, [pulse, nGroup, rayleighA, wavelength, mfd, nPhase, peakPower, nep, averages, loss, length, splices, spliceLoss, launchR]);

  const traceData = useMemo(() => {
    const L = length * 1e3;
    const tr = otdrTrace({
      length: L, lossDbPerKm: loss,
      splices: Array.from({ length: splices }, (_, i) => ({ z: ((i + 1) * L) / (splices + 1), lossDb: spliceLoss })),
      launchReflectance: 10 ** (launchR / 10), endReflectance: calc.endR,
      eta: calc.eta, noiseRatio: calc.pn / calc.pbs, resolution: calc.resolution, samples: 800,
    });
    const z_km = tr.z.map((z) => z / 1e3);
    return [
      { x: z_km, y: tr.level, type: "scatter" as const, mode: "lines" as const, name: "Model trace", line: { color: "#34d399", width: 1.5 } },
      { x: [0, length], y: [0, -loss * length], type: "scatter" as const, mode: "lines" as const, name: `Fibre slope ${loss} dB/km`, line: { color: "#fbbf24", dash: "dash" } },
      { x: [0, z_km[z_km.length - 1]], y: [tr.noiseDb, tr.noiseDb], type: "scatter" as const, mode: "lines" as const, name: "Noise level (SNR = 1)", line: { color: "#f87171", dash: "dot" } },
    ];
  }, [length, loss, splices, spliceLoss, launchR, calc.endR, calc.eta, calc.pn, calc.pbs, calc.resolution]);

  const pulseData = useMemo(() => {
    const S = calc.S, aS = dbPerKmToPerM(calc.alphaS_dBkm), alpha = dbPerKmToPerM(loss);
    const taus: number[] = [], drs: number[] = [];
    for (let i = 0; i <= 75; i++) {
      const t_ns = 10 ** (i / 15); // 1 ns – 100 µs
      const tau = t_ns * 1e-9;
      taus.push(t_ns);
      drs.push(dynamicRangeDb(10 ** (peakPower / 10) * 1e-3 * backscatterRatio(S, aS, tau, nGroup, alpha), noisePower(nep * 1e-12, tau, averages)));
    }
    return [
      { x: taus, y: drs, type: "scatter" as const, mode: "lines" as const, name: "Dynamic range (dB)", line: { color: "#60a5fa", width: 2 } },
      { x: [pulse], y: [calc.dr], type: "scatter" as const, mode: "markers" as const, name: `${pulse} ns`, marker: { size: 10 } },
    ];
  }, [calc.S, calc.alphaS_dBkm, calc.dr, loss, peakPower, nGroup, nep, averages, pulse]);

  const farEndLost = calc.farEndMargin < 0;
  const scatterAboveLoss = calc.alphaS_dBkm > loss;
  const pulseLongerThanFibre = calc.resolution > length * 1e3;

  return (
    <>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Fibre</h3>
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthIn} onChange={setWavelength} min={800} max={1700} step="1" />
        <ValidatedNumberInput label="Mode Field Diameter (µm)" value={mfdIn} onChange={setMfd} min={2} max={30} step="0.1" />
        <ValidatedNumberInput label="Rayleigh Coefficient A (dB·km⁻¹·µm⁴)" value={rayleighAIn} onChange={setRayleighA} min={0.3} max={2} step="0.01" />
        <ValidatedNumberInput label="Total Loss (dB/km)" value={lossIn} onChange={setLoss} min={0.01} max={10} step="0.01" />
        <ValidatedNumberInput label="Phase Index n" value={nPhaseIn} onChange={setNPhase} min={1.3} max={1.8} step="0.001" />
        <ValidatedNumberInput label="Group Index n_g" value={nGroupIn} onChange={setNGroup} min={1.3} max={1.8} step="0.0001" />
        <ValidatedNumberInput label="Fibre Length (km)" value={lengthIn} onChange={setLength} min={0.1} max={300} step="any" />
        <ValidatedNumberInput label="Splices (evenly spaced)" value={splicesIn} onChange={setSplices} min={0} max={50} step="1" />
        <ValidatedNumberInput label="Loss per Splice (dB)" value={spliceLossIn} onChange={setSpliceLoss} min={0} max={5} step="0.01" />
        <ValidatedNumberInput label="Launch Connector Reflectance (dB)" value={launchRIn} onChange={setLaunchR} min={-90} max={-10} step="1" />
      </div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">OTDR</h3>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Pulse Width (ns)" value={pulseIn} onChange={setPulse} min={1} max={100000} step="any" />
        <ValidatedNumberInput label="Peak Launch Power (dBm)" value={peakPowerIn} onChange={setPeakPower} min={-20} max={40} step="0.5" />
        <ValidatedNumberInput label="Receiver NEP (pW/√Hz)" value={nepIn} onChange={setNep} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Averaged Traces" value={averagesIn} onChange={setAverages} min={1} max={1e8} step="1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <ResultCard label="Two-Point Resolution" value={fmt(calc.resolution, 2, " m")} tone="green" subtext="cτ/(2n_g); the ideal event dead zone" />
        <ResultCard label="Dynamic Range (one-way)" value={fmt(calc.dr, 1, " dB")} tone="blue" subtext={`Backscatter ${fmt(dB(calc.pbs / 1e-3), 1)} dBm over noise ${fmt(dB(calc.pn / 1e-3), 1)} dBm`} />
        <ResultCard
          label="Far-End Margin"
          value={fmt(calc.farEndMargin, 1, " dB")}
          tone={farEndLost ? "red" : "green"}
          subtext={`DR − span loss ${fmt(calc.spanLoss, 2, " dB")}; clean-fibre reach ${fmt(calc.maxLength, 0, " km")}`}
        />
        <ResultCard label="Backscatter Coefficient" value={fmt(dB(calc.eta1), 1, " dB")} tone="purple" subtext={`at 1 ns; ${fmt(dB(calc.eta), 1, " dB")} at ${pulse} ns (S ${fmt(dB(calc.S), 1, " dB")})`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="Far-End Fresnel Peak" value={fmt(calc.endPeak, 1, " dB")} tone="yellow" subtext={`above backscatter; cleaved end R = ${fmt(dB(calc.endR), 1, " dB")}`} />
        <ResultCard label="Launch Connector Peak" value={fmt(calc.launchPeak, 1, " dB")} tone="orange" subtext={`R = ${launchR} dB`} />
        <ResultCard label="Rayleigh Scattering Loss" value={fmt(calc.alphaS_dBkm, 3, " dB/km")} tone="cyan" subtext={`A/λ⁴ at ${wavelength} nm`} />
        <ResultCard label="Minimum Acquisition Time" value={fmt(calc.acquisition, 1, " s")} tone="gray" subtext={`${averages} round trips of ${fmt((2 * nGroup * length * 1e9) / c, 0, " µs")}`} />
      </div>

      {farEndLost && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The far end lies {fmt(-calc.farEndMargin, 1, " dB")} below the noise level: use a longer pulse, more averages or a
          higher launch power, at the cost of resolution or time.
        </p>
      )}

      {scatterAboveLoss && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          Rayleigh scattering alone (A/λ⁴ = {fmt(calc.alphaS_dBkm, 3, " dB/km")}) exceeds the total loss of {loss} dB/km, which no real
          fibre can do: raise the total loss or lower A for this wavelength.
        </p>
      )}
      {pulseLongerThanFibre && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The pulse spans {fmt(calc.resolution / 1e3, 2, " km")}, longer than the fibre: no event along it can be resolved.
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Model OTDR Trace</h3>
        <ChartPanel data={traceData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Distance (km)", color: "#9ca3af", gridcolor: "#374151" },
          yaxis: { title: "Level re near-end backscatter (dB, one-way)", color: "#9ca3af", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 70 }, height: 380, showlegend: false,
        }} />
        <p className="mt-2 text-xs text-gray-400">
          Green: model trace with the launch-connector and far-end Fresnel peaks and {splices} splice steps of {spliceLoss} dB.
          Dashed yellow: the fibre slope of {loss} dB/km. Dotted red: the noise level, {fmt(calc.dr, 1, " dB")} below the
          near-end backscatter.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Dynamic Range vs Pulse Width</h3>
        <ChartPanel data={pulseData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Pulse width (ns)", color: "#9ca3af", gridcolor: "#374151", type: "log" },
          yaxis: { title: "One-way dynamic range (dB)", color: "#60a5fa", gridcolor: "#374151" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 70 }, height: 320, showlegend: false,
        }} />
        <p className="mt-2 text-xs text-gray-400">
          One-way dynamic range against pulse width; the dot marks {pulse} ns. Each tenfold longer pulse gains 7.5 dB but
          worsens the two-point resolution tenfold ({fmt(c * 1e-9 / (2 * nGroup), 3, " m")} per ns at n_g {nGroup}).
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">Δz = cτ/(2n_g)    P_bs(z) = P₀ · S α_s (v_g τ/2) · e^(−2αz)    S = (3/2)·(λ/(2πn w))²</p>
          <p className="font-mono">P_n = NEP·√(1/(2τ))/√N    DR = 5 log₁₀(P_bs(0)/P_n)    peak = 5 log₁₀(1 + R/η)</p>
          <p>
            Rayleigh scattering (α_s = A/λ⁴) sends a fraction S back into the fundamental mode (Brinkmeyer, for a Gaussian mode
            of radius w = MFD/2); the pulse lights a length v_gτ/2 at a time (Barnoski &amp; Jensen). The backscatter coefficient
            η = S α_s v_gτ/2 rises 10 dB per decade of pulse width (for long pulses v_gτ/2 becomes sinh(αΔz)/α); data sheets quote it for 1 ns (SMF-28: −82 dB at 1550 nm).
          </p>
          <p>
            Noise is the receiver&apos;s noise-equivalent power over the matched bandwidth 1/(2τ), reduced by √N for N averages. For this
            ideal matched receiver the one-way dynamic range grows 7.5 dB per decade of pulse width (less on real instruments) and 1.5 dB per 4× averages. OTDRs display one-way dB
            (5 log₁₀), so a splice of 0.1 dB steps the trace down by 0.1 dB and the fibre slope equals its loss in dB/km.
          </p>
          <p className="text-gray-400">
            Not included: receiver recovery after strong reflections (attenuation dead zones several times Δz), the 98 %-noise
            dynamic range some vendors quote (≈ 1.5–2 dB lower), coherent fading noise and the non-Gaussian mode tail. The near-end
            connector loss is hidden in the launch dead zone.
          </p>
        </div>
      </div>
    </>
  );
}
