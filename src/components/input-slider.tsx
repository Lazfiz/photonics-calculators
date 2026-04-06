"use client";

import { useState } from "react";

interface InputSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export default function InputSlider({ label, value, onChange, min, max, step = 1, unit }: InputSliderProps) {
  const [localText, setLocalText] = useState<string | null>(null);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setLocalText(text);
    const num = Number(text);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    setLocalText(null);
    // Ensure final value is clamped
    const clamped = Math.min(Math.max(value, min), max);
    if (clamped !== value) onChange(clamped);
  };

  const displayValue = localText !== null ? localText : value;

  return (
    <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-medium text-blue-300">
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-blue-500"
      />
      <div className="mt-3 flex items-center gap-3">
        <input
          type="number"
          value={displayValue}
          min={min}
          max={max}
          step={step}
          onChange={handleNumberChange}
          onBlur={handleBlur}
          className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
        />
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {min}–{max}{unit ? ` ${unit}` : ""}
        </span>
      </div>
    </label>
  );
}
