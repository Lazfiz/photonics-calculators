"use client";

import { useMemo, useState } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";
import { useURLState } from "../../../hooks/use-url-state";

const currentHref = "/imaging/airy-disk";

export default function AiryDiskPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [na, setNa] = useURLState("na", 0.95);

  const airyRadius = 0.61 * (wavelength / 1000) / na; // µm (nm→µm / NA)
  const airyDiameter = 2 * airyRadius; // µm
  const airyRadiusUm = airyRadius;
  const resolutionNm = wavelength / (2 * na);

  const series = useMemo(() => {
    const nas = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.015);
    return [
      { name: "Airy radius", color: "#60a5fa", points: nas.map((x) => ({ x, y: 0.61 * (wavelength / 1000) / x })) },
      { name: "Abbe limit", color: "#34d399", dashed: true, points: nas.map((x) => ({ x, y: wavelength / (2 * x) / 1000 })) },
      { name: "Current", color: "#f87171", showPoints: true, points: [{ x: na, y: airyRadiusUm }] },
    ];
  }, [wavelength, na, airyRadiusUm]);

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Airy Disk Size Calculator" description="Calculate the Airy disk radius and Abbe diffraction limit based on wavelength and numerical aperture.">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={300} max={2000} step={1} unit="nm" />
        <InputSlider label="Numerical Aperture" value={na} onChange={setNa} min={0.1} max={1.5} step={0.01} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Airy radius" value={`${airyRadiusUm.toFixed(2)} µm`} tone="blue" />
        <ResultCard label="Airy diameter" value={`${airyDiameter.toFixed(3)} µm`} tone="green" />
        <ResultCard label="Abbe limit" value={`${resolutionNm.toFixed(1)} nm`} tone="yellow" />
        <ResultCard label="Resolution (lp/mm)" value={`${(1000 / airyDiameter).toFixed(0)}`} tone="purple" />
      </div>

      <SimpleLineChart title="Diffraction-limited spot size vs NA" xLabel="Numerical aperture" yLabel="Size (µm)" series={series} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
