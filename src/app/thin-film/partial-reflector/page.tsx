import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/partial-reflector' },
      title: 'Partial Reflector Design',
  description: 'Partial reflectors (output couplers, etalon mirrors) provide controlled reflectance between',
};

export default function Page() {
  return <PageClient />;
}
