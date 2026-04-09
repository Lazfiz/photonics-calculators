import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/bragg-reflector' },
    title: 'Bragg Reflector',
  description: 'Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.'
};

export default function Page() {
  return <PageClient />;
}
