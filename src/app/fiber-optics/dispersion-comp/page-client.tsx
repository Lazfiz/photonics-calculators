"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  TOLERANCE_PENALTY_DB, accumulatedDispersion, dcfLength, dispersionLimitedBitRate, dispersionPenaltyDb,
  residualSlope, rmsBroadening, toleratedBroadening, usableHalfBandwidth,
} from "../../../physics/fiber-optics/dispersion-comp";

// UI units → SI.
const PS_NM_KM = 1e-6; // ps/(nm·km) → s/m²
const PS_NM2_KM = 1e3; // ps/(nm²·km) → s/m³
const TO_PS_NM = 1e3; // s/m → ps/nm
const TO_PS_NM2 = 1e-6; // s/m² → ps/nm²
const CHART_HALF_SPAN_NM = 40;
// Beyond this the linear D(λ) model says nothing useful about the band.
const MAX_BAND_NM = 100;

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const fmtPenalty = (dB: number) => (dB === Infinity ? "eye closed" : `${fmt(dB)} dB`);
const penaltyTone = (dB: number) => (!(dB < 3) ? "red" : dB > TOLERANCE_PENALTY_DB ? "yellow" : "green");

export default function DispersionCompPage() {
  const [dispersion, setDispersion] = useURLState("dispersion", 17); // ps/(nm·km), G.652 at 1550 nm
  const [slope, setSlope] = useURLState("slope", 0.058); // ps/(nm²·km)
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 80); // km
  const [bwNm, setBwNm] = useURLState("bwNm", 0.5); // rms source width, nm
  const [bitRate, setBitRate] = useURLState("bitRate", 10); // Gb/s
  const [compDispersion, setCompDispersion] = useURLState("compDispersion", -100); // ps/(nm·km)
  const [compSlope, setCompSlope] = useURLState("compSlope", -0.2); // ps/(nm²·km)
  const [refWavelength, setRefWavelength] = useURLState("refWavelength", 1550); // nm
  const [channelWavelength, setChannelWavelength] = useURLState("channelWavelength", 1550); // nm

  const calc = useMemo(() => {
    const span = { D: dispersion * PS_NM_KM, S: slope * PS_NM2_KM };
    const dcf = { D: compDispersion * PS_NM_KM, S: compSlope * PS_NM2_KM };
    const L = fiberLength * 1e3;
    const sigmaLambda = bwNm * 1e-9;
    const B = bitRate * 1e9;
    const detuning = (channelWavelength - refWavelength) * 1e-9;

    const Dacc = accumulatedDispersion(span, L, detuning);
    const sigmaUnc = rmsBroadening(Dacc, span.S * L, sigmaLambda);
    const Lc = dcfLength(span, L, dcf);
    const Sres = residualSlope(span, L, dcf, Lc);
    const DresAtChannel = Sres * detuning;
    const sigmaComp = rmsBroadening(DresAtChannel, Sres, sigmaLambda);
    const sigmaTol = toleratedBroadening(B);
    return {
      Dacc_psnm: Dacc * TO_PS_NM,
      sigmaUnc_ps: sigmaUnc * 1e12,
      Bmax_Gbps: dispersionLimitedBitRate(sigmaUnc) / 1e9,
      penaltyUnc: dispersionPenaltyDb(B, sigmaUnc),
      Lc_km: Lc / 1e3,
      Sres_psnm2: Sres * TO_PS_NM2,
      slopeCompensation: span.S * L !== 0 ? (-dcf.S * Lc) / (span.S * L) : NaN,
      Dres_psnm: DresAtChannel * TO_PS_NM,
      sigmaComp_ps: sigmaComp * 1e12,
      penaltyComp: dispersionPenaltyDb(B, sigmaComp),
      halfBand_nm: usableHalfBandwidth(Sres, sigmaLambda, sigmaTol) * 1e9,
      // |D_acc| of the compensated link at which the penalty reaches the tolerance (S_acc = S_res everywhere).
      tolerance_psnm:
        (Math.sqrt(Math.max(0, sigmaTol ** 2 - (Sres * sigmaLambda ** 2) ** 2 / 2)) / sigmaLambda) * TO_PS_NM,
    };
  }, [dispersion, slope, fiberLength, bwNm, bitRate, compDispersion, compSlope, refWavelength, channelWavelength]);

  const chartData = useMemo(() => {
    if (!Number.isFinite(calc.Sres_psnm2)) return [];
    const wavelengths = Array.from({ length: 161 }, (_, i) => refWavelength - CHART_HALF_SPAN_NM + i * 0.5);
    const traces: Record<string, unknown>[] = [{
      x: wavelengths, y: wavelengths.map((wl) => calc.Sres_psnm2 * (wl - refWavelength)),
      type: "scatter", mode: "lines", name: "Residual after DCF", line: { color: "#60a5fa", width: 2 },
    }];
    if (Number.isFinite(calc.tolerance_psnm) && calc.tolerance_psnm > 0) {
      const ends = [wavelengths[0], wavelengths[wavelengths.length - 1]];
      for (const sign of [1, -1]) {
        traces.push({
          x: ends, y: [sign * calc.tolerance_psnm, sign * calc.tolerance_psnm], type: "scatter", mode: "lines",
          // Unnamed traces stay out of the legend.
          name: sign > 0 ? `±${TOLERANCE_PENALTY_DB} dB penalty` : "", line: { color: "#f87171", width: 1, dash: "dash" },
        });
      }
    }
    return traces;
  }, [calc.Sres_psnm2, calc.tolerance_psnm, refWavelength]);

  const dcfValid = Number.isFinite(calc.Lc_km);
  const band = calc.halfBand_nm;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Span D (ps/nm/km)" value={dispersion} onChange={setDispersion} min={-500} max={500} step="0.1" />
        <ValidatedNumberInput label="Span slope S (ps/nm²/km)" value={slope} onChange={setSlope} min={-5} max={5} step="0.001" />
        <ValidatedNumberInput label="Span length (km)" value={fiberLength} onChange={setFiberLength} min={0.001} max={20000} step="1" />
        <ValidatedNumberInput label={<>D<sub>DCF</sub> (ps/nm/km)</>} value={compDispersion} onChange={setCompDispersion} min={-1000} max={1000} step="1" />
        <ValidatedNumberInput label={<>S<sub>DCF</sub> (ps/nm²/km)</>} value={compSlope} onChange={setCompSlope} min={-20} max={20} step="0.01" />
        <ValidatedNumberInput label="Reference λ₀ for D, S (nm)" value={refWavelength} onChange={setRefWavelength} min={800} max={2000} step="1" />
        <ValidatedNumberInput label={<>Source rms width σ<sub>λ</sub> (nm)</>} value={bwNm} onChange={setBwNm} min={0} max={100} step="0.1" />
        <ValidatedNumberInput label="Bit rate (Gb/s)" value={bitRate} onChange={setBitRate} min={0.001} max={1000} step="1" />
        <ValidatedNumberInput label="Channel λ (nm)" value={channelWavelength} onChange={setChannelWavelength} min={800} max={2000} step="1" />
      </div>

      {!dcfValid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No DCF length: D<sub>DCF</sub> must have the opposite sign of the span D to compensate it.
        </p>
      )}

      <h3 className="text-lg font-semibold mb-3">Span without compensation (at {channelWavelength} nm)</h3>
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label="Accumulated dispersion" value={`${fmt(calc.Dacc_psnm, 4)} ps/nm`} tone="blue" subtext="(D + S(λ − λ₀)) · L" />
        <ResultCard label="RMS broadening" value={`${fmt(calc.sigmaUnc_ps)} ps`} tone="purple" subtext={`4Bσ = ${fmt(4 * bitRate * 1e-3 * calc.sigmaUnc_ps)}`} />
        <ResultCard
          label="Dispersion-limited bit rate"
          value={`${fmt(calc.Bmax_Gbps)} Gb/s`}
          tone={calc.Bmax_Gbps < bitRate ? "red" : "green"}
          subtext={calc.Bmax_Gbps < bitRate ? `below ${bitRate} Gb/s` : `above ${bitRate} Gb/s`}
        />
        <ResultCard label="Dispersion penalty" value={fmtPenalty(calc.penaltyUnc)} tone={penaltyTone(calc.penaltyUnc)} />
      </div>

      <h3 className="text-lg font-semibold mb-3">With DCF (dispersion nulled at λ₀ = {refWavelength} nm)</h3>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="DCF length" value={dcfValid ? `${fmt(calc.Lc_km)} km` : "—"} tone="yellow" subtext="Lc = −D·L / DDCF" />
        <ResultCard
          label="Residual slope"
          value={`${fmt(calc.Sres_psnm2)} ps/nm²`}
          tone="purple"
          subtext={Number.isFinite(calc.slopeCompensation) ? `${(100 * calc.slopeCompensation).toFixed(0)} % of the span slope compensated` : undefined}
        />
        <ResultCard
          label={`Usable band (≤ ${TOLERANCE_PENALTY_DB} dB)`}
          value={!dcfValid ? "—" : band > MAX_BAND_NM ? `wider than ±${MAX_BAND_NM} nm` : band === 0 ? "none" : `${fmt(refWavelength - band, 5)}–${fmt(refWavelength + band, 5)} nm`}
          tone={!dcfValid ? "gray" : band > 0 ? "green" : "red"}
          subtext={!dcfValid ? undefined : band > MAX_BAND_NM ? "limited by the curvature of D(λ), not modelled" : band > 0 ? `λ₀ ± ${fmt(band)} nm` : "the penalty exceeds the limit even at λ₀"}
        />
        <ResultCard label={`Residual at ${channelWavelength} nm`} value={dcfValid ? `${fmt(calc.Dres_psnm, 4)} ps/nm` : "—"} tone="blue" subtext="Sres · (λ − λ₀)" />
        <ResultCard label="RMS broadening" value={dcfValid ? `${fmt(calc.sigmaComp_ps)} ps` : "—"} tone="purple" />
        <ResultCard label="Dispersion penalty" value={dcfValid ? fmtPenalty(calc.penaltyComp) : "—"} tone={dcfValid ? penaltyTone(calc.penaltyComp) : "gray"} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Residual Dispersion after DCF vs Wavelength</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151", color: "#9ca3af" },
          yaxis: { title: "Accumulated dispersion (ps/nm)", gridcolor: "#374151", color: "#9ca3af" },
          font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 60 }, height: 320,
          legend: { x: 0.02, y: 0.98, bgcolor: "transparent", font: { color: "#9ca3af", size: 11 } },
        }} />
        <p className="text-sm text-gray-400 mt-2">
          The DCF cancels the span&apos;s dispersion only at λ₀. Elsewhere the residual is S<sub>res</sub>·(λ − λ₀); the dashed lines mark
          where the penalty reaches {TOLERANCE_PENALTY_DB} dB at {bitRate} Gb/s (±{fmt(calc.tolerance_psnm)} ps/nm).
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">σ<sub>D</sub> = √((D<sub>acc</sub>σ<sub>λ</sub>)² + ½ (S<sub>acc</sub>σ<sub>λ</sub>²)²),   B ≤ 1/(4σ<sub>D</sub>),   δ = −5 log₁₀(1 − (4Bσ<sub>D</sub>)²) dB</p>
          <p className="font-mono">L<sub>c</sub> = −D·L / D<sub>DCF</sub>,   S<sub>res</sub> = S·L + S<sub>DCF</sub>·L<sub>c</sub>,   D<sub>acc</sub>(λ) = S<sub>res</sub>(λ − λ₀)</p>
          <p>
            Broad-source model (Agrawal, Fiber-Optic Communication Systems, §2.4.3 and §5.4.4): the source&apos;s rms
            spectral width σ<sub>λ</sub> is much larger than the modulation bandwidth (≈ λ²B/c, 0.08 nm at 10 Gb/s and 1550 nm), and
            D varies linearly with λ. A DCF compensates the whole band only when its relative slope S<sub>DCF</sub>/D<sub>DCF</sub> equals the
            span&apos;s S/D.
          </p>
          <p>
            Textbook approximation. Not included: narrow-linewidth (transform-limited) sources, where the limit is
            B√(|β₂|L) ≤ 1/4; the curvature of D(λ), which is large for real DCFs away from their design band; PMD,
            nonlinearity and DCF loss.
          </p>
        </div>
      </div>
    </>
  );
}
