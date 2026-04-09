import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/dual-band-ar' },
    title: 'Dual-Band AR Coating',
  description: 'Three-layer anti-reflection coating optimized for two distinct wavelength bands.'
};

export default function Page() {
  return <PageClient />;
}
