import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Gaussian Beam Propagation',
  description: 'Explore how wavelength and waist size shape Rayleigh range, divergence, and Gaussian beam envelope.'
};

export default function Page() {
  return <PageClient />;
}
