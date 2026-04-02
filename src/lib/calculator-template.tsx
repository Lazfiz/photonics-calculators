"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface InputConfig {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit: string;
}

export interface OutputConfig {
  name: string;
  label: string;
  unit: string;
}

export interface PlotConfig {
  data: (inputs: Record<string, number>) => Plotly.Data[];
  layout: Partial<Plotly.Layout>;
}

export interface CalculatorTemplateProps {
  title: string;
  description: string;
  inputs: InputConfig[];
  calculate: (inputs: Record<string, number>) => Record<string, number>;
  outputs: OutputConfig[];
  plot?: PlotConfig;
}

export default function CalculatorTemplate({
  title,
  description,
  inputs,
  calculate,
  outputs,
  plot,
}: CalculatorTemplateProps) {
  // Initialize state with default values
  const [inputValues, setInputValues] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    inputs.forEach((input) => {
      defaults[input.name] = input.default;
    });
    return defaults;
  });

  // Calculate outputs whenever inputs change
  const calculatedOutputs = useMemo(() => {
    return calculate(inputValues);
  }, [inputValues, calculate]);

  // Handle input changes
  const handleInputChange = (name: string, value: number) => {
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate plot data if plot config exists
  const plotData = useMemo(() => {
    if (!plot) return null;
    return plot.data(inputValues);
  }, [inputValues, plot]);

  return (
    <main className="min-h-screen bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400">{description}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs Panel */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Inputs</h2>
            <div className="space-y-6">
              {inputs.map((input) => (
                <div key={input.name}>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">
                      {input.label}
                    </label>
                    <span className="text-sm text-gray-500">
                      {inputValues[input.name].toFixed(
                        Math.max(0, -Math.floor(Math.log10(input.step)))
                      )}{" "}
                      {input.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={input.min}
                    max={input.max}
                    step={input.step}
                    value={inputValues[input.name]}
                    onChange={(e) =>
                      handleInputChange(input.name, parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>
                      {input.min} {input.unit}
                    </span>
                    <span>
                      {input.max} {input.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outputs Panel */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Results</h2>
            <div className="space-y-4">
              {outputs.map((output) => (
                <div
                  key={output.name}
                  className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0"
                >
                  <span className="text-gray-400">{output.label}</span>
                  <span className="text-xl font-semibold text-blue-400">
                    {typeof calculatedOutputs[output.name] === "number"
                      ? calculatedOutputs[output.name].toExponential(4)
                      : calculatedOutputs[output.name]}{" "}
                    <span className="text-sm text-gray-500">{output.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plot (if configured) */}
        {plot && plotData && (
          <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Visualization
            </h2>
            <div className="w-full h-[400px]">
              <Plot
                data={plotData}
                layout={{
                  ...plot.layout,
                  paper_bgcolor: "transparent",
                  plot_bgcolor: "transparent",
                  font: { color: "#9ca3af" },
                  margin: { t: 40, r: 40, b: 60, l: 60 },
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
