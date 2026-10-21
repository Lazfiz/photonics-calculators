/** Transmission bands of several materials on a shared log wavelength axis, with a marker at the current λ. */
export interface BandRow {
  key: string;
  name: string;
  /** Bands in µm; empty when no sourced range is included. */
  bands: readonly (readonly [number, number])[];
  selected?: boolean;
}

const TICKS_UM = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];

export default function TransmissionBands({
  rows, markerUm, minUm = 0.1, maxUm = 100,
}: { rows: BandRow[]; markerUm?: number; minUm?: number; maxUm?: number }) {
  const span = Math.log10(maxUm / minUm);
  // Rounded: the server HTML shortens long floats in style values, which would fail hydration.
  const pos = (x: number) => Math.round((1e5 * Math.log10(Math.min(maxUm, Math.max(minUm, x)) / minUm)) / span) / 1000;
  const marker = markerUm !== undefined && markerUm >= minUm && markerUm <= maxUm ? pos(markerUm) : null;
  const fmt = (x: number) => (x >= 1 ? String(x) : x.toFixed(2).replace(/0$/, ""));

  return (
    <figure className="text-xs text-gray-300">
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-2">
            <div className={`w-28 shrink-0 truncate ${r.selected ? "font-semibold text-white" : ""}`}>{r.name}</div>
            <div className="relative h-4 flex-1 rounded bg-gray-800" role="img"
              aria-label={`${r.name}: ${r.bands.length ? r.bands.map(([lo, hi]) => `${lo}–${hi} µm`).join(" and ") : "no sourced range"}`}>
              {r.bands.map(([lo, hi]) => (
                <div key={lo} className={`absolute top-0.5 bottom-0.5 rounded-sm ${r.selected ? "bg-blue-500" : "bg-gray-500"}`}
                  style={{ left: `${pos(lo)}%`, width: `${Math.max(pos(hi) - pos(lo), 0.5)}%` }} />
              ))}
              {marker !== null && <div className="absolute top-0 bottom-0 w-px bg-amber-300" style={{ left: `${marker}%` }} />}
              {r.bands.length === 0 && <span className="absolute inset-0 pl-2 leading-4 text-gray-400">no sourced range</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div className="w-28 shrink-0" />
        <div className="relative h-4 flex-1 text-gray-400">
          {TICKS_UM.filter((t) => t >= minUm && t <= maxUm).map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: `${pos(t)}%` }}>{fmt(t)}</span>
          ))}
        </div>
      </div>
      <figcaption className="mt-1 text-center text-gray-400">
        Wavelength (µm, log scale){marker !== null ? `; the amber line marks ${fmt(markerUm!)} µm` : ""}. Bands as listed in the data sheets.
      </figcaption>
    </figure>
  );
}
