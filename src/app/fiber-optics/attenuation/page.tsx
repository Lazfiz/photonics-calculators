import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Wavelength-Dependent Attenuation',
  description: 'Fiber attenuation spectrum showing Rayleigh scattering, IR absorption, and OH peak for standard fiber types.'
};

export default function Page() {
  return <PageClient />;
}
