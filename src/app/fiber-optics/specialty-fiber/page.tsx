import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/specialty-fiber' },
    title: 'Specialty Fiber Types',
  description: 'Compare properties of specialty optical fibers: PM, PCF, rare-earth doped, chalcogenide, and fluoride.'
};

export default function Page() {
  return <PageClient />;
}
