import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/na-fnumber' },
      title: 'NA f/# Conversion',
  description: 'NA = 1/(2f/#) for objects at infinity. Relates numerical aperture to f-number.',
};

export default function Page() {
  return <PageClient />;
}
