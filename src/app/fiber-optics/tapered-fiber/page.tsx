import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/tapered-fiber' },
    title: 'Tapered Fiber Design',
  description: 'Design adiabatic fiber tapers for mode conversion, evanescent field enhancement, and coupler fabrication.'
};

export default function Page() {
  return <PageClient />;
}
