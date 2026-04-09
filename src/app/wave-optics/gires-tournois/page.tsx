import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/gires-tournois' },
    title: 'Gires-Tournois Interferometer',
  description: 'Dispersion control via a GTI — constant reflectivity with tunable group delay dispersion.'
};

export default function Page() {
  return <PageClient />;
}
