import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/sbs-threshold' },
    title: 'SBS Threshold Power',
  description: 'Calculate Stimulated Brillouin Scattering threshold for optical fibers.'
};

export default function Page() {
  return <PageClient />;
}
