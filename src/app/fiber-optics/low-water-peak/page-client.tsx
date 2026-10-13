"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { intervalStats } from "../../../physics/math";
import { CWDM_CHANNELS, silicaLossDbPerKm, type SilicaLossParams } from "../../../physics/fiber-optics/silica-attenuation";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
/** E-band, ITU-T G-series band plan (Supplement 39): 1360–1460 nm. */
const E_BAND: [number, number] = [1360e-9, 1460e-9];
/** ITU-T G.652.D cable: maximum attenuation over 1310–1625 nm, which also bounds 1383 nm after hydrogen ageing, dB/km. */
const G652D_MAX = 0.4;

function summarize(p: SilicaLossParams, length: number) {
  const at = (l: number) => silicaLossDbPerKm(p, l).total;
  const channels = CWDM_CHANNELS.map((l) => at(l) * length);
  let worst = 0;
  for (let i = 1; i < channels.length; i++) if (channels[i] > channels[worst]) worst = i;
  return {
    at1310: at(1310e-9),
    at1383: at(1383e-9),
    eBandMean: intervalStats(at, E_BAND[0], E_BAND[1], 200).mean,
    channels,
    worst,
  };
}

export default function LowWaterPeakPage() {
  const [length, setLength] = useURLState("length", 40); // km
  const [ohLwp, setOhLwp] = useURLState("ohLwp", 0.05); // dB/km excess at 1383 nm, low-water-peak fibre
  const [ohLegacy, setOhLegacy] = useURLState("ohLegacy", 1); // dB/km, older fibre
  const [rayleighA, setRayleighA] = useURLState("rayleighA", 0.85);
  const [geO2, setGeO2] = useURLState("geO2", 4); // mol %

  const lwp = useMemo(
    () => summarize({ rayleighA, geO2Fraction: geO2 / 100, ohPeakDbPerKm: ohLwp }, length),
    [rayleighA, geO2, ohLwp, length],
  );
  const legacy = useMemo(
    () => summarize({ rayleighA, geO2Fraction: geO2 / 100, ohPeakDbPerKm: ohLegacy }, length),
    [rayleighA, geO2, ohLegacy, length],
  );

  const spectrumData = useMemo(() => {
    const wls: number[] = [];
    const a: number[] = [];
    const b: number[] = [];
    for (let i = 0; i <= 400; i++) {
      const wl = 1250 + i;
      wls.push(wl);
      a.push(silicaLossDbPerKm({ rayleighA, geO2Fraction: geO2 / 100, ohPeakDbPerKm: ohLegacy }, wl * 1e-9).total);
      b.push(silicaLossDbPerKm({ rayleighA, geO2Fraction: geO2 / 100, ohPeakDbPerKm: ohLwp }, wl * 1e-9).total);
    }
    return [
      { x: wls, y: a, type: "scatter" as const, mode: "lines" as const, name: "Older fibre", line: { color: "#f87171", width: 1.5 } },
      { x: wls, y: b, type: "scatter" as const, mode: "lines" as const, name: "Low water peak", line: { color: "#34d399", width: 2 } },
    ];
  }, [rayleighA, geO2, ohLwp, ohLegacy]);

  const cwdmData = useMemo(() => {
    const x = CWDM_CHANNELS.map((l) => Math.round(l * 1e9));
    return [
      { x, y: legacy.channels, type: "bar" as const, name: "Older fibre", marker: { color: "#f87171" } },
      { x, y: lwp.channels, type: "bar" as const, name: "Low water peak", marker: { color: "#34d399" } },
    ];
  }, [lwp, legacy]);

  const meetsD = lwp.at1383 <= G652D_MAX;
  const meetsZwp = lwp.at1383 <= lwp.at1310;
  const worstNm = Math.round(CWDM_CHANNELS[lwp.worst] * 1e9);
  const legacyWorstNm = Math.round(CWDM_CHANNELS[legacy.worst] * 1e9);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Fiber Length (km)" value={length} onChange={setLength} min={0.1} max={500} step="any" />
        <ValidatedNumberInput label="OH Excess, Low-Water-Peak Fibre (dB/km)" value={ohLwp} onChange={setOhLwp} min={0} max={5} step="0.01" />
        <ValidatedNumberInput label="OH Excess, Older Fibre (dB/km)" value={ohLegacy} onChange={setOhLegacy} min={0} max={5} step="0.01" />
        <ValidatedNumberInput label="Rayleigh Coefficient A (dB·km⁻¹·µm⁴)" value={rayleighA} onChange={setRayleighA} min={0.5} max={1.5} step="0.01" />
        <ValidatedNumberInput label="Core GeO₂ (mol %)" value={geO2} onChange={setGeO2} min={0} max={30} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard
          label="Loss at 1383 nm"
          value={fmt(lwp.at1383, 3, " dB/km")}
          tone="green"
          subtext={`older fibre ${fmt(legacy.at1383, 3, " dB/km")}`}
        />
        <ResultCard
          label="Water-Peak Check (G.652.D)"
          value={meetsD ? "Meets" : "Fails"}
          tone={meetsD ? "green" : "red"}
          subtext={`α(1383) ${meetsD ? "≤" : ">"} ${G652D_MAX.toFixed(2)} dB/km cable limit; ${meetsZwp ? "also ≤" : "but >"} this fibre's α(1310) = ${fmt(lwp.at1310, 3, " dB/km")} (stricter data-sheet criterion)`}
        />
        <ResultCard
          label="Worst CWDM Channel"
          value={fmt(lwp.channels[lwp.worst], 2, " dB")}
          tone="yellow"
          subtext={`${worstNm} nm over ${length} km; older fibre ${fmt(legacy.channels[legacy.worst], 2, " dB")} at ${legacyWorstNm} nm`}
        />
        <ResultCard
          label="E-band Mean (1360–1460 nm)"
          value={fmt(lwp.eBandMean, 3, " dB/km")}
          tone="blue"
          subtext={`older fibre ${fmt(legacy.eBandMean, 3, " dB/km")}`}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Attenuation Spectrum: Older vs Low-Water-Peak Fibre</h3>
        <ChartPanel data={spectrumData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Attenuation (dB/km)", gridcolor: "#374151", rangemode: "tozero" },
          legend: { x: 0.6, y: 0.98 },
          margin: { t: 20, r: 20, b: 50, l: 70 }, height: 360,
        }} />
        <p className="mt-2 text-sm text-gray-400">
          O-band 1260–1360 nm, E-band 1360–1460 nm (the water peak), S-band 1460–1530 nm, C-band 1530–1565 nm, L-band 1565–1625 nm.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">CWDM Channel Span Loss (ITU-T G.694.2 grid, {length} km)</h3>
        <ChartPanel data={cwdmData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          barmode: "group",
          xaxis: { title: "Channel wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Fibre loss (dB)", gridcolor: "#374151", rangemode: "tozero" },
          legend: { x: 0.6, y: 0.98 },
          margin: { t: 20, r: 20, b: 50, l: 70 }, height: 320,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">α = A/λ⁴ + α_IR + α_UV + α_OH,peak · exp(−(λ − 1383 nm)²/2σ²),  FWHM 30 nm</p>
          <p>
            Both fibres share the intrinsic silica loss (Rayleigh scattering, infrared and ultraviolet tails; see the attenuation
            calculator) and differ only in the OH absorption at 1383 nm, from residual water in the glass. 1 ppm of OH by weight adds
            about 63 dB/km at the peak, so a low-water-peak fibre holds its OH content to a few ppb. G.652.D requires the 1383 nm loss
            (after hydrogen ageing) to stay at or below the maximum specified for 1310–1625 nm, 0.40 dB/km for cable; many
            &quot;zero-water-peak&quot; data sheets promise the stricter α(1383) ≤ α(1310), shown alongside. The limits are cable values
            and this model is bare fibre, so the check is indicative. Older G.652.A/B fibres had no limit there, which made the
            E-band and the CWDM channels around 1371–1411 nm unusable over long spans.
          </p>
          <p className="text-gray-400">
            Illustrative: the OH band is a Gaussian with an assumed 30 nm FWHM, and the peak heights are inputs, not data for a
            particular fibre. Splices, connectors, bends and the weaker OH bands near 1240 and 950 nm are not included.
          </p>
        </div>
      </div>
    </>
  );
}
