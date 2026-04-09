import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/photoacoustic' },
    title: 'Photoacoustic Imaging Calculator',
  description: 'Imaging depth, resolution, and signal estimation for photoacoustic microscopy/tomography.'
};

export default function Page() {
  return <PageClient />;
}
