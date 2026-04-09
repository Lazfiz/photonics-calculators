import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/gvd' },
      title: 'Group Velocity Dispersion (GVD)',
  description: 'Calculate d²n/d² and dispersion parameter from Sellmeier coefficients.',
};

export default function Page() {
  return <PageClient />;
}
