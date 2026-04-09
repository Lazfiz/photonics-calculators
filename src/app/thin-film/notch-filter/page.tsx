import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/notch-filter' },
    title: 'Notch Filter',
  description: 'Rejection notch filter — high reflectance at target wavelength, transmits elsewhere.'
};

export default function Page() {
  return <PageClient />;
}
