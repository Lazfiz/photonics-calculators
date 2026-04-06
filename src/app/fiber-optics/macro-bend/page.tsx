import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Macro Bend Loss',
  description: 'Detailed macrobending loss calculation for single-mode fibers based on bend radius and wavelength.'
};

export default function Page() {
  return <PageClient />;
}
