export default function LaserSafetyCwScope() {
  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100">
      <p className="font-semibold text-amber-200">Bounded implementation scope</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Supported here: bounded small-source ocular direct-beam branch for 400–1050 nm and 1 ms to 3×10^4 s, using only explicitly implemented ANSI-style table slices.</li>
        <li>Still disabled on purpose: pulse rules, extended-source corrections, UV, corneal/skin branches, product-classification logic, and broader standards-table edge cases.</li>
        <li>This suite separates radiant exposure <span className="font-semibold">H</span> from equivalent irradiance <span className="font-semibold">E</span> instead of mixing them.</li>
      </ul>
    </div>
  );
}
