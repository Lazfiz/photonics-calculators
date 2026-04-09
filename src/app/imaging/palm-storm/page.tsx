import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/palm-storm' },
    title: 'PALM/STORM Localization Calculator',
  description: 'Estimate effective resolution for single-molecule localization microscopy (PALM/STORM) based on localization precision and labeling density.'
};

export default function Page() {
  return <PageClient />;
}
