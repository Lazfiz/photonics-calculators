import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Phase Shift Coatings',
  description: 'Phase shift accumulated in thin film coatings. Explore how film thickness and refractive index affect the optical phase of reflected and transmitted light.'
};

export default function Page() {
  return <PageClient />;
}
