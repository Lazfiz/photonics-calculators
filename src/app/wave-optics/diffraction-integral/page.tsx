import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/diffraction-integral' },
    title: 'Diffraction Integral Calculator',
  description: 'Fresnel/Kirchhoff diffraction patterns.'
};

export default function Page() {
  return <PageClient />;
}
