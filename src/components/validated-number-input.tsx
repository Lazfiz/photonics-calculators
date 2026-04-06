"use client";

import { useState } from "react";

interface ValidatedNumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
}

export default function ValidatedNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = "any",
  placeholder,
}: ValidatedNumberInputProps) {
  const [warning, setWarning] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = Number(raw);
    if (raw === "" || isNaN(num)) {
      setWarning("Enter a valid number");
      return;
    }
    if (min !== undefined && num < min) {
      setWarning(`Min: ${min}`);
      onChange(Math.max(num, min));
      return;
    }
    if (max !== undefined && num > max) {
      setWarning(`Max: ${max}`);
      onChange(Math.min(num, max));
      return;
    }
    setWarning(null);
    onChange(num);
  };

  return (
    <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
      <span className="text-sm text-gray-300">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={handleChange}
        className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white"
      />
      {warning && (
        <p className="mt-1 text-xs text-yellow-400">{warning}</p>
      )}
    </label>
  );
}
