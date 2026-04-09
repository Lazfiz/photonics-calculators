import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/corneal-limits' },
    title: 'Corneal Exposure Limits',
  description: 'Corneal MPE across UV, visible, and IR spectral regions. Simplified model.'
};

export default function Page() {
  return <PageClient />;
}
