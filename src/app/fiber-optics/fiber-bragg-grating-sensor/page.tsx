import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-bragg-grating-sensor' },
    title: 'Fiber Bragg Grating Sensor',
  description: 'Calculate FBG wavelength shift for strain and temperature sensing applications.'
};

export default function Page() {
  return <PageClient />;
}
