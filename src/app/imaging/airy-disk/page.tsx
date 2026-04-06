import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    title: 'Airy Disk Size Calculator',
  description: 'Calculate the Airy disk radius and Abbe diffraction limit from wavelength and numerical aperture.'
};

export default function Page() {
  return <PageClient />;
}
