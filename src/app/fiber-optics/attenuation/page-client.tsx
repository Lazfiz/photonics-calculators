"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { minimumLossWavelength, silicaLossDbPerKm } from "../../../physics/fiber-optics/silica-attenuation";

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

export default function AttenuationPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 600, max: 2000 }); // nm
  const [length, setLength] = useURLState("length", 50, { min: 0.001, max: 20000 }); // km
  const [rayleighA, setRayleighA] = useURLState("rayleighA", 0.85, { min: 0.5, max: 1.5 }); // dB·km⁻¹·µm⁴
  const [geO2, setGeO2] = useURLState("geO2", 4, { min: 0, max: 30 }); // mol %
  const [ohPeak, setOhPeak] = useURLState("ohPeak", 0.05, { min: 0, max: 5 }); // dB/km excess at 1383 nm

  const params = useMemo(
    () => ({ rayleighA, geO2Fraction: geO2 / 100, ohPeakDbPerKm: ohPeak }),
    [rayleighA, geO2, ohPeak],
  );

  const calc = useMemo(() => {
    const at = silicaLossDbPerKm(params, wavelength * 1e-9);
    const lambdaMin = minimumLossWavelength(params);
    return {
      at,
      total_dB: at.total * length,
      at1310: silicaLossDbPerKm(params, 1310e-9).total,
      at1383: silicaLossDbPerKm(params, 1383e-9).total,
      at1550: silicaLossDbPerKm(params, 1550e-9).total,
      lambdaMin_nm: lambdaMin * 1e9,
      minLoss: silicaLossDbPerKm(params, lambdaMin).total,
    };
  }, [params, wavelength, length]);

  const chartData = useMemo(() => {
    const wls: number[] = [];
    const parts = { total: [] as number[], rayleigh: [] as number[], infrared: [] as number[], ultraviolet: [] as number[], oh: [] as (number | null)[] };
    for (let i = 0; i <= 450; i++) {
      const wl = 800 + 2 * i;
      const l = silicaLossDbPerKm(params, wl * 1e-9);
      wls.push(wl);
      parts.total.push(l.total);
      parts.rayleigh.push(l.rayleigh);
      parts.infrared.push(l.infrared);
      parts.ultraviolet.push(l.ultraviolet);
      parts.oh.push(l.oh > 1e-4 ? l.oh : null); // log axis: drop the vanishing Gaussian wings
    }
    return [
      { x: wls, y: parts.total, type: "scatter" as const, mode: "lines" as const, name: "Total", line: { color: "#f87171", width: 3 } },
      { x: wls, y: parts.rayleigh, type: "scatter" as const, mode: "lines" as const, name: "Rayleigh A/λ⁴", line: { color: "#60a5fa", dash: "dash" } },
      { x: wls, y: parts.infrared, type: "scatter" as const, mode: "lines" as const, name: "Infrared absorption", line: { color: "#fbbf24", dash: "dash" } },
      { x: wls, y: parts.ultraviolet, type: "scatter" as const, mode: "lines" as const, name: "UV absorption tail", line: { color: "#a78bfa", dash: "dash" } },
      { x: wls, y: parts.oh, type: "scatter" as const, mode: "lines" as const, name: "OH band (illustrative)", line: { color: "#34d399", dash: "dot" } },
      { x: [wavelength], y: [calc.at.total], type: "scatter" as const, mode: "markers" as const, name: `${wavelength} nm`, marker: { color: "#f9fafb", size: 10 } },
    ];
  }, [params, wavelength, calc.at.total]);

  const yTop = Math.max(10, 1.2 * (Number.isFinite(calc.at.total) ? calc.at.total : 0)); // dB/km, top of the log axis
  const outside = wavelength < 800 || wavelength > 1700;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={600} max={2000} step="1" />
        <ValidatedNumberInput label="Fiber Length (km)" value={length} onChange={setLength} min={0.001} max={20000} step="any" />
        <ValidatedNumberInput label="Rayleigh Coefficient A (dB·km⁻¹·µm⁴)" value={rayleighA} onChange={setRayleighA} min={0.5} max={1.5} step="0.01" />
        <ValidatedNumberInput label="Core GeO₂ (mol %)" value={geO2} onChange={setGeO2} min={0} max={30} step="0.1" />
        <ValidatedNumberInput label="OH Excess Loss at 1383 nm (dB/km)" value={ohPeak} onChange={setOhPeak} min={0} max={5} step="0.01" />
      </div>

      {outside && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          The fits are made for the 0.8–1.7 µm range; at {wavelength} nm the result is an extrapolation.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <ResultCard label={`Attenuation at ${wavelength} nm`} value={fmt(calc.at.total, 3, " dB/km")} tone="red" subtext={`${fmt(calc.total_dB, 2, " dB")} over ${length} km`} />
        <ResultCard
          label="Breakdown"
          value={`${fmt((100 * calc.at.rayleigh) / calc.at.total, 0, " %")} Rayleigh`}
          tone="blue"
          subtext={`IR ${fmt(calc.at.infrared, 4)}, UV ${fmt(calc.at.ultraviolet, 4)}, OH ${fmt(calc.at.oh, 4)} dB/km`}
        />
        <ResultCard label="Minimum Loss" value={fmt(calc.lambdaMin_nm, 0, " nm")} tone="green" subtext={`${fmt(calc.minLoss, 3, " dB/km")} (scattering meets the IR tail)`} />
        <ResultCard
          label="Windows"
          value={`${fmt(calc.at1310, 3)} / ${fmt(calc.at1550, 3)}`}
          tone="yellow"
          subtext={`dB/km at 1310 / 1550 nm; ${fmt(calc.at1383, 3)} at the 1383 nm water peak`}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <h3 className="text-lg font-semibold mb-3">Attenuation Spectrum</h3>
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Attenuation (dB/km)", gridcolor: "#374151", type: "log", range: [-3, Math.log10(yTop)] },
          legend: { x: 0.55, y: 0.98 },
          margin: { t: 20, r: 30, b: 50, l: 70 }, height: 380,
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">α = A/λ⁴ + 7.81×10¹¹ e^(−48.48/λ) + 154.2x/(46.6x + 60)·10⁻² e^(4.63/λ) + α_OH(λ)   (λ in µm, dB/km)</p>
          <p>
            Rayleigh scattering from frozen-in density and composition fluctuations falls as λ⁻⁴; A is 0.7–0.9 dB·km⁻¹·µm⁴ for
            silica fibres and rises with the core&apos;s germania content (Agrawal). The infrared tail of the Si–O vibrations and the
            ultraviolet tail of the electronic absorption are Keiser&apos;s empirical fits for GeO₂-doped silica (x = GeO₂ mole fraction).
            Scattering and the infrared tail cross near 1550 nm, which sets the minimum-loss window.
          </p>
          <p>
            The OH band is drawn as a Gaussian of the given height at 1383 nm and an illustrative 30 nm FWHM. 1 ppm of OH by weight
            gives about 63 dB/km at the peak, so 0.5 dB/km means ≈ 8 ppb. G.652.D (low water peak) caps the 1383 nm loss after hydrogen
            ageing at the 1310–1625 nm maximum, 0.40 dB/km for cable.
          </p>
          <p className="text-gray-400">
            Not included: waveguide imperfections and bending, the weak 1246 nm OH combination band (the 943 nm OH band is modelled, scaled from the 1383 nm peak), hydrogen ageing, and other
            impurities. The defaults (A 0.85, 4 mol % GeO₂) give 0.32 dB/km at 1310 nm and 0.19 dB/km at 1550 nm, typical of
            standard single-mode fibre.
          </p>
        </div>
      </div>
    </>
  );
}
