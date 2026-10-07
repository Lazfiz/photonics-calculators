"use client";

import { useId, useState, type ReactNode } from "react";

import { clampToRange, isInRange, parseNumberInput } from "@/lib/number-input";

interface ValidatedNumberInputProps {
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
}

/**
 * Number field that lets the user type freely. Valid in-range values reach `onChange` as they're
 * typed. Out-of-range values are held back and clamped on blur or Enter, and invalid text reverts
 * to the last valid value. `onChange` only ever receives finite, in-range numbers.
 */
export default function ValidatedNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = "any",
  placeholder,
}: ValidatedNumberInputProps) {
  // Text being edited; null while the field shows `value`.
  const [text, setText] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const warningId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const num = parseNumberInput(raw);
    if (num === null) {
      setWarning("Enter a valid number");
    } else if (min !== undefined && num < min) {
      setWarning(`Min: ${min}`);
    } else if (max !== undefined && num > max) {
      setWarning(`Max: ${max}`);
    } else {
      setWarning(null);
      onChange(num);
    }
  };

  const commit = () => {
    if (text === null) return;
    setText(null);
    const num = parseNumberInput(text);
    if (num === null) {
      setWarning(null); // revert to the last valid value
      return;
    }
    // An out-of-range value is clamped; its "Min/Max" warning stays to explain the change.
    const clamped = clampToRange(num, min, max);
    if (isInRange(clamped, min, max) && clamped !== value) onChange(clamped);
  };

  return (
    <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
      <span className="text-sm text-gray-300">{label}</span>
      <input
        type="number"
        value={text ?? value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        aria-invalid={warning !== null}
        aria-describedby={warning ? warningId : undefined}
        className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
      />
      {warning && (
        <p id={warningId} className="mt-1 text-xs text-yellow-400">{warning}</p>
      )}
    </label>
  );
}
