import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/anti-fog",
    title: 'Anti-Fog Coating Design',
  description: 'Hydrophilic thin film that spreads condensation into a uniform water layer, minimizing scattering.'
};

export default function Page() {
  return <PageClient />;
}
