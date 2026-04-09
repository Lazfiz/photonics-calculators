import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/super-resolution' },
    title: 'Super-Resolution Calculator',
  description: 'STED and PALM/STORM resolution limits beyond the diffraction barrier.'
};

export default function Page() {
  return <PageClient />;
}
