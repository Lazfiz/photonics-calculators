"use client";

import BlockingFilterCalculator from "../../../components/blocking-filter-calculator";

// A cold mirror reflects the visible and transmits the near IR: a long-pass edge filter whose
// reflection zone is widened to cover 400–700 nm by stacks in series.
export default function ColdMirrorPage() {
  return (
    <BlockingFilterCalculator
      type="long-pass"
      defaults={{ nH: 2.35, nL: 1.45, nSub: 1.52, blockFrom: 400, blockTo: 700, passFrom: 800, passTo: 1200, periods: 10 }}
      blockName="Reflected band (visible)"
      passName="Transmitted band (IR)"
    />
  );
}
