import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
      title: 'Fresnel Equations',
  description: 'Reflectance vs. angle of incidence at a dielectric interface. Shows s-polarization, p-polarization, Brewster\',s angle, and total internal reflection.'
};

export default function Page() {
  return <PageClient />;
}
