import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/penetration-depth",
      title: 'Penetration Depth Calculator',
  description: 'Calculate optical penetration depth from complex refractive index ñ = n + ik. Includes oblique incidence via Snell\',s law.'
};

export default function Page() {
  return <PageClient />;
}
