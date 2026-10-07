"use client";

import { useId, useState } from "react";

import { clampToRange, isInRange, parseNumberInput } from "@/lib/number-input";

interface InputSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

/**
 * Slider plus an exact-value field. The field lets the user type freely: in-range values reach
 * `onChange` as they're typed, out-of-range ones are clamped on blur or Enter, and invalid text
 * reverts. `onChange` only ever receives finite numbers within [min, max].
 */
export default function InputSlider({ label, value, onChange, min, max, step = 1, unit }: InputSliderProps) {
  // Text being edited in the number field; null while it shows `value`.
  const [text, setText] = useState<string | null>(null);
  const sliderId = useId();

  const typed = text === null ? null : parseNumberInput(text);
  const invalid = text !== null && (typed === null || !isInRange(typed, min, max));

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const num = parseNumberInput(raw);
    if (num !== null && isInRange(num, min, max)) onChange(num);
  };

  const commit = () => {
    if (text === null) return;
    setText(null);
    const num = parseNumberInput(text);
    if (num === null) return; // revert to the last valid value
    const clamped = clampToRange(num, min, max);
    if (isInRange(clamped, min, max) && clamped !== value) onChange(clamped);
  };

  return (
    <div className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={sliderId} className="text-sm text-gray-300">{label}</label>
        <span className="text-sm font-medium text-blue-300">
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        id={sliderId}
        type="range"
        value={clampToRange(value, min, max)}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          setText(null); // the slider wins over any half-typed text
          onChange(Number(e.target.value));
        }}
        className="mt-3 w-full accent-blue-500 min-h-[44px] py-2"
      />
      <div className="mt-3 flex items-center gap-3">
        <input
          aria-label={`${label} exact value`}
          type="number"
          value={text ?? value}
          min={min}
          max={max}
          step={step}
          onChange={handleNumberChange}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          aria-invalid={invalid}
          className={`w-full bg-gray-950 border rounded px-3 py-3 min-h-[44px] text-white ${
            invalid ? "border-yellow-400" : "border-gray-700"
          }`}
        />
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {min}–{max}{unit ? ` ${unit}` : ""}
        </span>
      </div>
    </div>
  );
}
