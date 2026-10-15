"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { q } from "../../../physics/constants";
import {
  analogSnr, anodeSensitivity, photonCountingSnr, pulseResolutionFwhm,
} from "../../../physics/detectors/electron-multiplier";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toExponential(digits) : "—");

// Defaults: PerkinElmer CPM C900/C1300/C1900 data sheet: bialkali dark count rate 10 cps, anode sensitivity quoted at
// 410 nm, and the channel saturates above a gain of 10⁷, which sets the 10⁷ e⁻ linear limit. A gain of 10⁵ keeps a
// 100-photon pulse linear. QE 25 % as in the Hamamatsu PMT handbook's worked example. F = 2 for the near-exponential
// pulse heights of an unsaturated channel, J. L. Wiza, Nucl. Instrum. Methods 162, 587 (1979).
export default function ChannelPMTPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 410); // nm
  const [qeRaw, setQe] = useURLState("quantumEff", 0.25);
  const [gainRaw, setGain] = useURLState("channelGain", 1e5);
  const [enfRaw, setEnf] = useURLState("excessNoise", 2);
  const [darkRaw, setDarkCountRate] = useURLState("darkCountRate", 10); // counts/s
  const [photonRateRaw, setPhotonRate] = useURLState("photonRate", 1e4); // photons/s
  const [gateRaw, setGate] = useURLState("gateTime", 1); // s
  const [photonsRaw, setPhotonsPerPulse] = useURLState("photonsPerPulse", 100);
  const [limitRaw, setLimit] = useURLState("linearLimit", 1e7); // electrons per pulse

  const wavelength_nm = clamp(wavelengthRaw, 115, 900, 410);
  const qe = clamp(qeRaw, 0, 1, 0.25);
  const gain = clamp(gainRaw, 1e2, 1e9, 1e5);
  const enf = clamp(enfRaw, 1, 3, 2);
  const dark = clamp(darkRaw, 0, 1e6, 10);
  const photonRate = clamp(photonRateRaw, 0, 1e10, 1e4);
  const gate = clamp(gateRaw, 1e-6, 1e4, 1);
  const photons = clamp(photonsRaw, 1, 1e7, 100);
  const limit = clamp(limitRaw, 1e5, 1e10, 1e7);

  const sensitivity = anodeSensitivity(qe, wavelength_nm * 1e-9, gain);
  const signalRate = photonRate * qe;
  const signalCurrent = signalRate * q * gain;
  const darkCurrent = dark * q * gain; // dark counts come from the photocathode only
  const countSnr = photonCountingSnr(signalRate, dark, gate);
  const analog = analogSnr(signalRate, dark, 1 / (2 * gate), enf);
  const nPe = photons * qe;
  const pulseElectrons = nPe * gain;
  const linear = pulseElectrons <= limit;
  const resolution = linear ? pulseResolutionFwhm(nPe, enf) : NaN;

  const axis = Array.from({ length: 121 }, (_, i) => 10 ** (i / 20)); // 1 to 10⁶ photons per pulse
  const cut = (p: number, f: number) => (p * qe * gain <= limit ? 100 * pulseResolutionFwhm(p * qe, f) : NaN);
  const chartData = [
    { x: axis, y: axis.map((p) => cut(p, 1)), type: "scatter" as const, mode: "lines" as const, name: "F = 1 (photoelectron statistics)", line: { color: "#60a5fa", dash: "dash" } },
    { x: axis, y: axis.map((p) => cut(p, enf)), type: "scatter" as const, mode: "lines" as const, name: `F = ${enf}`, line: { color: "#f87171" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={115} max={900} step="10" />
        <ValidatedNumberInput label="Photocathode QE" value={qeRaw} onChange={setQe} min={0} max={1} step="0.01" />
        <ValidatedNumberInput label="Channel Gain" value={gainRaw} onChange={setGain} min={1e2} max={1e9} step="1e5" />
        <ValidatedNumberInput label="Excess Noise Factor F" value={enfRaw} onChange={setEnf} min={1} max={3} step="0.05" />
        <ValidatedNumberInput label="Dark Count Rate (counts/s)" value={darkRaw} onChange={setDarkCountRate} min={0} max={1e6} step="1" />
        <ValidatedNumberInput label="Photon Rate (photons/s)" value={photonRateRaw} onChange={setPhotonRate} min={0} max={1e10} step="1000" />
        <ValidatedNumberInput label="Gate Time (s)" value={gateRaw} onChange={setGate} min={1e-6} max={1e4} step="0.1" />
        <ValidatedNumberInput label="Photons per Pulse" value={photonsRaw} onChange={setPhotonsPerPulse} min={1} max={1e7} step="10" />
        <ValidatedNumberInput label="Linear Limit (e⁻ per pulse)" value={limitRaw} onChange={setLimit} min={1e5} max={1e10} step="1e6" />
      </div>
      <p className="text-sm text-gray-400 mb-6">
        F ≈ 2 for an unsaturated channel, whose pulse heights are near-exponential. Above a gain of about 10⁷ the
        channel saturates and the single-electron peak narrows to about 50 % FWHM, so F = 1 + (0.5/2.355)² ≈ 1.05 for
        single photons. A saturated pulse no longer grows with the number of photoelectrons.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Anode Sensitivity" value={`${fmt(sensitivity)} A/W`} tone="blue" subtext={`QE·eλ/(hc)·G at ${wavelength_nm} nm`} />
        <ResultCard label="Photoelectron Rate" value={`${fmt(signalRate)} /s`} tone="green" subtext={`Signal anode current ${fmt(signalCurrent)} A`} />
        <ResultCard label="Dark Anode Current" value={`${fmt(darkCurrent)} A`} tone="orange" subtext="Dark counts × e × G (photocathode emission)" />
        <ResultCard label="Photon-Counting SNR" value={Number.isFinite(countSnr) ? countSnr.toFixed(2) : "—"} tone="cyan"
          subtext={gain >= 1e7 ? `${gate} s gate; saturated single-electron peak` : `${gate} s gate; below a gain of 10⁷ single pulses sit close to the electronic noise`} />
        <ResultCard label="Analog SNR" value={Number.isFinite(analog) ? analog.toFixed(2) : "—"} tone="purple" subtext={`Bandwidth 1/(2T); the gain spread costs √F = ${Math.sqrt(enf).toFixed(3)}`} />
        <ResultCard label="Pulse Resolution" value={Number.isFinite(resolution) ? `${(resolution * 100).toFixed(1)} % FWHM` : "—"} tone="red"
          subtext={linear ? `${nPe.toFixed(1)} photoelectrons, ${(pulseElectrons * q * 1e12).toPrecision(3)} pC` : `${fmt(pulseElectrons)} e⁻ exceeds the linear limit: the pulse is clipped`} />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1">
        <p>S<sub>anode</sub> = QE · eλ/(hc) · G</p>
        <p>SNR<sub>count</sub> = R<sub>s</sub>T / √((R<sub>s</sub> + R<sub>d</sub>)T), R<sub>s</sub> = Φ · QE</p>
        <p>SNR<sub>analog</sub> = R<sub>s</sub> / √(2B(R<sub>s</sub> + R<sub>d</sub>)F), B = 1/(2T)</p>
        <p>ΔQ/Q (FWHM) = 2.355 · √(F / N<sub>pe</sub>), valid while N<sub>pe</sub> · G ≤ linear limit</p>
      </div>
      <ChartPanel data={chartData} layout={{
        title: { text: "Pulse Resolution vs Photons per Pulse", font: { size: 12 } },
        xaxis: { title: "Photons per pulse", type: "log", gridcolor: "#374151" },
        yaxis: { title: "Resolution (% FWHM)", type: "log", gridcolor: "#374151" },
      }} />
    </>
  );
}
