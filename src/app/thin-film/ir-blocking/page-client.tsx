"use client";

import BlockingFilterCalculator from "../../../components/blocking-filter-calculator";

// An IR-blocking filter (hot mirror) transmits the visible and reflects the near IR: a short-pass edge
// filter whose reflection zone is widened to cover 700–1100 nm by stacks in series.
export default function IRBlockingPage() {
  return (
    <BlockingFilterCalculator
      type="short-pass"
      defaults={{ nH: 2.35, nL: 1.45, nSub: 1.52, blockFrom: 700, blockTo: 1100, passFrom: 420, passTo: 650, periods: 10 }}
      blockName="Blocked band (near IR)"
      passName="Transmitted band (visible)"
    />
  );
}
