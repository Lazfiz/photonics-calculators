import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/diamond-optics' },
    title: 'Diamond Optics',
  description: 'Diamond — the ultimate optical material. Bandgap: 5.47 eV. n 2.42.'
};

export default function Page() {
  return <PageClient />;
}
