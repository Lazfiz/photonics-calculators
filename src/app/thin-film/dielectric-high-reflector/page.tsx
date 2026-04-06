import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Dielectric High Reflector',
  description: 'Quarter-wave dielectric stack HR mirror — stopband width, peak reflectance, and dispersion.'
};

export default function Page() {
  return <PageClient />;
}
