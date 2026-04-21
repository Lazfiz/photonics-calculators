"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";
const currentHref = "/spectroscopy/ftir-resolution";

export default function FtirResolutionPage() {
  const [maxOPD, setMaxOPD] = useURLState("maxOPD", 1.0);
  const [spectralRange, setSpectralRange] = useURLState("spectralRange", 4000);
  const [apodization, setApodization] = useState<"boxcar" | "nortonbeermedium" | "blackmanharris" | "happgenzel">("boxcar");
  const [mirrorVelocity, setMirrorVelocity] = useURLState("mirrorVelocity", 1.0);

  const apodFactors: Record<string, number> = {
    boxcar: 1.0,
    nortonbeermedium: 1.2,
    blackmanharris: 1.5,
    happgenzel: 1.3,
  };

  const nominalResolution = 1 / maxOPD;
  const effectiveResolution = nominalResolution * apodFactors[apodization];
  const dataPoints = 2 * maxOPD * spectralRange;
  // OPD changes at 2v (light round-trip), so scan time = maxOPD / (2v)
  const scanTime = maxOPD / (2 * mirrorVelocity);

  const resolutionSeries = useMemo(() => {
    const opds = Array.from({ length: 200 }, (_, i) => 0.1 + (i * 9.9) / 199);
    return [
      { name: "Boxcar", color: "#60a5fa", points: opds.map((x) => ({ x, y: 1 / x })) },
      { name: "Norton-Beer Medium", color: "#f87171", dashed: true, points: opds.map((x) => ({ x, y: apodFactors.nortonbeermedium / x })) },
      { name: "Blackman-Harris", color: "#34d399", dashed: true, points: opds.map((x) => ({ x, y: apodFactors.blackmanharris / x })) },
      { name: "Happ-Genzel", color: "#fbbf24", dashed: true, points: opds.map((x) => ({ x, y: apodFactors.happgenzel / x })) },
    ];
  }, []);

  const interferogramSeries = useMemo(() => {
    const nu0 = 1000;
    const N = 500;
    const x = Array.from({ length: N }, (_, i) => (i / N) * maxOPD);
    const y = x.map((xi) => {
      const raw = Math.cos(2 * Math.PI * nu0 * xi);
      let apod = 1;
      const frac = xi / maxOPD;
      if (apodization === "nortonbeermedium") {
        // Norton-Beer Medium: D(x) = d0 + d1*(1-x²) + d2*(1-x²)²
        // Coefficients from Norton & Beer (1976), JOSA 66, 259
        const u = 1 - frac * frac;
        apod = 0.15244 + 0.13618 * u + 0.98373 * u * u;
      }
      else if (apodization === "blackmanharris") apod = 0.35875 + 0.48829 * Math.cos(Math.PI * frac) + 0.14128 * Math.cos(2 * Math.PI * frac) + 0.01168 * Math.cos(3 * Math.PI * frac);
      else if (apodization === "happgenzel") apod = (1 - frac) * (1 + Math.cos(Math.PI * frac)) / 2;
      return raw * apod;
    });
    return [{ name: "Interferogram", color: "#fbbf24", points: x.map((v, i) => ({ x: v, y: y[i] })) }];
  }, [maxOPD, apodization]);

  return (
    <CalculatorShell
      backHref="/spectroscopy"
      backLabel="Spectroscopy"
      title="FTIR Resolution Calculator"
      description="Spectral resolution from maximum optical path difference (OPD) and apodization function."
    >
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="Max OPD" value={maxOPD} onChange={setMaxOPD} min={0.01} max={10} step={0.01} unit="cm" />
        <InputSlider label="Spectral range" value={spectralRange} onChange={setSpectralRange} min={100} max={8000} step={10} unit="cm⁻¹" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Apodization</span>
          <select value={apodization} onChange={e => setApodization(e.target.value as any)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="boxcar">Boxcar (no apodization)</option>
            <option value="nortonbeermedium">Norton-Beer Medium</option>
            <option value="blackmanharris">Blackman-Harris</option>
            <option value="happgenzel">Happ-Genzel</option>
          </select>
        </label>
        <InputSlider label="Mirror velocity" value={mirrorVelocity} onChange={setMirrorVelocity} min={0.01} max={10} step={0.01} unit="cm/s" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Nominal resolution" value={`${nominalResolution.toFixed(3)} cm⁻¹`} tone="blue" />
        <ResultCard label="Effective resolution" value={`${effectiveResolution.toFixed(3)} cm⁻¹`} tone="green" />
        <ResultCard label="Data points" value={Math.round(dataPoints).toLocaleString()} tone="yellow" />
        <ResultCard label="Scan time (single)" value={`${scanTime.toFixed(1)} s`} tone="purple" />
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>δν = 1 / Δ<sub>max</sub> (boxcar), where Δ<sub>max</sub> = max OPD</p>
        <p>Apodization broadens line shape: δν<sub>eff</sub> = k · δν<sub>nominal</sub></p>
        <p>Data points N = 2 · Δ<sub>max</sub> · ν<sub>max</sub></p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SimpleLineChart title="Resolution vs max OPD" xLabel="Max OPD (cm)" yLabel="Resolution (cm⁻¹)" series={resolutionSeries} />
        <SimpleLineChart title="Apodized interferogram" xLabel="OPD (cm)" yLabel="Signal (a.u.)" series={interferogramSeries} />
      </div>

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
