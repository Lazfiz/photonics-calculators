"use client";

import { useId } from "react";
import type { BeamDefinition } from "../lib/laser-safety-cw-suite";

/** Parses the `beamDefinition` URL value; anything else is the data-sheet convention, 1/e². */
export function parseBeamDefinition(value: string): BeamDefinition {
  return value === "1/e" ? "1/e" : "1/e2";
}

/** Picks how the entered beam diameter (and divergence) are quoted. */
export default function LaserSafetyBeamDefinition({
  value,
  onChange,
  withDivergence = true,
}: {
  value: BeamDefinition;
  onChange: (value: BeamDefinition) => void;
  withDivergence?: boolean;
}) {
  const id = useId();
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <label htmlFor={id} className="block text-sm text-gray-300">
        {withDivergence ? "Diameter and divergence quoted at" : "Diameter quoted at"}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(parseBeamDefinition(e.target.value))}
        className="mt-3 w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 text-white"
      >
        <option value="1/e2">1/e² of peak (data sheets)</option>
        <option value="1/e">1/e of peak (ANSI Z136.1, IEC 60825-1)</option>
      </select>
      <p className="mt-2 text-xs leading-5 text-gray-400">
        The standards use 1/e values; 1/e² values are divided by √2. If unsure, pick 1/e²: it errs on the safe side.
      </p>
    </div>
  );
}
