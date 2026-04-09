import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/aging-effects' },
    title: 'Aging of Optical Materials',
  description: 'Long-term degradation: transmission loss, solarization, compaction, stress relaxation',
};

export default function Page() {
  return <PageClient />;
}
