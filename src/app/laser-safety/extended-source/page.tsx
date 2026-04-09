import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/extended-source' },
    title: 'Extended Source Correction (C₆)',
  description: 'C₆ angular subtense correction factor for extended source laser hazard evaluation per ANSI Z136.'
};

export default function Page() {
  return <PageClient />;
}
