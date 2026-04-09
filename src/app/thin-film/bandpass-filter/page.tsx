import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/bandpass-filter' },
    title: 'Bandpass Filter',
  description: 'Fabry-Perot bandpass — multi-cavity design with quarter-wave mirrors and half-wave spacers.'
};

export default function Page() {
  return <PageClient />;
}
