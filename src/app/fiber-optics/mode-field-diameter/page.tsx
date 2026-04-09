import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/mode-field-diameter' },
    title: 'Mode Field Diameter',
  description: 'Calculate MFD, effective area, and spot size for single-mode fibers.'
};

export default function Page() {
  return <PageClient />;
}
