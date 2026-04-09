import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/speckle-imaging' },
    title: 'Speckle Imaging',
  description: 'Speckle size, contrast, averaging strategies, and surface roughness effects.'
};

export default function Page() {
  return <PageClient />;
}
