import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/concentration' },
      title: 'Concentration from Absorbance',
  description: 'c = A / (l) — determine concentration from measured absorbance using Beer-Lambert law.',
};

export default function Page() {
  return <PageClient />;
}
