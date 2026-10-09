"use client";

import BlockingFilterCalculator from "../../../components/blocking-filter-calculator";

// A UV-blocking filter reflects the UV and transmits the visible: a long-pass edge filter whose
// reflection zone is widened to cover 290–390 nm by stacks in series. The default indices are lower
// than the other pages' because most high-index oxides absorb in the UV.
export default function UVBlockingPage() {
  return (
    <BlockingFilterCalculator
      type="long-pass"
      defaults={{ nH: 2.1, nL: 1.47, nSub: 1.52, blockFrom: 290, blockTo: 390, passFrom: 420, passTo: 700, periods: 12 }}
      blockName="Blocked band (UV)"
      passName="Transmitted band (visible)"
    />
  );
}
