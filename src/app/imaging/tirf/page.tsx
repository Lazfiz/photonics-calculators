import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/tirf' },
    title: 'TIRF Penetration Depth Calculator',
  description: 'Evanescent field penetration depth for Total Internal Reflection Fluorescence microscopy.'
};

export default function Page() {
  return <PageClient />;
}
