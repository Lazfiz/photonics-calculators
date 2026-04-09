import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/angle-shift' },
    title: 'Angle-Dependent Blue Shift',
  description: 'How the effective design wavelength shifts with angle of incidence (blue shift).',
};

export default function Page() {
  return <PageClient />;
}
