import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Fabry-Pérot Filter',
  description: 'Fabry-Pérot etalon/filter transmission based on the Airy function. Explore how mirror reflectance and cavity spacing control spectral selectivity.'
};

export default function Page() {
  return <PageClient />;
}
