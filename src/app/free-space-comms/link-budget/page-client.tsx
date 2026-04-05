"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import RelatedCalculatorLinks from "../../../components/related-calculator-links";
import { getRelatedCalculators } from "../../../lib/related-calculators";

const presets = [
  { label: "Short urban", txPower: 10, txGain: 25, range: 1, rxGain: 30, wavelength: 1550, atmosphere: 3, misc: 2 },
  { label: "Campus", txPower: 15, txGain: 30, range: 2, rxGain: 35, wavelength: 1550, atmosphere: 4, misc: 2 },
  { label: "Long link", txPower: 20, txGain: 35, range: 5, rxGain: 40, wavelength: 1550, atmosphere: 6, misc: 3 },
];
const currentHref = "/free-space-comms/link-budget";

export default function LinkBudgetPage() {
  const [txPower, setTxPower] = useState(10);
  const [txGain, setTxGain] = useState(30);
  const [range, setRange] = useState(1);
  const [rxGain, setRxGain] = useState(40);
  const [wavelength, setWavelength] = useState(1550);
  const [atmosphere, setAtmosphere] = useState(3);
  const [misc, setMisc] = useState(2);

  const calc = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const R = range * 1e3;
    const fspl = 20 * Math.log10((4 * Math.PI * R) / lambda);
    const pr = txPower + txGain + rxGain - fspl - atmosphere - misc;
    return { fspl, pr, margin: pr - -30 };
  }, [txPower, txGain, range, rxGain, wavelength, atmosphere, misc]);

  const series = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const ranges = Array.from({ length: 220 }, (_, i) => 0.05 + i * 0.05);
    const powers = ranges.map((r) => {
      const R = r * 1e3;
      const fspl = 20 * Math.log10((4 * Math.PI * R) / lambda);
      return txPower + txGain + rxGain - fspl - atmosphere - misc;
    });
    return [
      { name: "Received power", color: "#06b6d4", points: ranges.map((x, i) => ({ x, y: powers[i] })) },
      { name: "Sensitivity reference", color: "#ef4444", dashed: true, points: ranges.map((x) => ({ x, y: -30 })) },
      { name: "Current", color: "#22c55e", showPoints: true, points: [{ x: range, y: calc.pr }] },
    ];
  }, [txPower, txGain, rxGain, wavelength, atmosphere, misc, range, calc.pr]);

  return (
    <CalculatorShell backHref="/free-space-comms" backLabel="Free-Space Comms" title="FSO Link Budget" description="Interactive free-space optical link budget with presets, sliders, and received-power versus range view.">
      <div className="mb-5 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              setTxPower(preset.txPower); setTxGain(preset.txGain); setRange(preset.range); setRxGain(preset.rxGain); setWavelength(preset.wavelength); setAtmosphere(preset.atmosphere); setMisc(preset.misc);
            }}
            className={`rounded-full border px-3 py-1 text-sm transition ${txPower === preset.txPower && txGain === preset.txGain && range === preset.range ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <InputSlider label="TX power" value={txPower} onChange={setTxPower} min={-10} max={30} step={0.1} unit="dBm" />
        <InputSlider label="TX gain" value={txGain} onChange={setTxGain} min={0} max={50} step={0.1} unit="dBi" />
        <InputSlider label="Range" value={range} onChange={setRange} min={0.05} max={10} step={0.05} unit="km" />
        <InputSlider label="RX gain" value={rxGain} onChange={setRxGain} min={0} max={60} step={0.1} unit="dBi" />
        <InputSlider label="Wavelength" value={wavelength} onChange={setWavelength} min={850} max={2000} step={1} unit="nm" />
        <InputSlider label="Atmospheric loss" value={atmosphere} onChange={setAtmosphere} min={0} max={30} step={0.1} unit="dB" />
        <InputSlider label="Misc loss" value={misc} onChange={setMisc} min={0} max={20} step={0.1} unit="dB" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="FSPL" value={`${calc.fspl.toFixed(1)} dB`} tone="blue" />
        <ResultCard label="Received power" value={`${calc.pr.toFixed(1)} dBm`} tone="green" />
        <ResultCard label="Margin vs −30 dBm" value={`${calc.margin.toFixed(1)} dB`} tone={calc.margin >= 0 ? "yellow" : "red"} />
      </div>

      <SimpleLineChart title="Received power vs range" xLabel="Range (km)" yLabel="Received power (dBm)" series={series} />

      <RelatedCalculatorLinks currentHref={currentHref} items={getRelatedCalculators(currentHref)} />
    </CalculatorShell>
  );
}
