import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/detectors/antiblooming' },
    title: 'Anti-Blooming Design',
  description: 'Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.'
};

export default function Page() {
  return <PageClient />;
}
